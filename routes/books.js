const router=require('express').Router();
const QRCode=require('qrcode');
const db=require('../database/init');
router.get('/',(req,res)=>{
  const q=(req.query.q||'').trim();
  const books=q?db.prepare(`SELECT b.*,c.name category FROM books b LEFT JOIN categories c ON c.id=b.category_id
    WHERE b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ? ORDER BY b.id DESC`).all(`%${q}%`,`%${q}%`,`%${q}%`)
    :db.prepare(`SELECT b.*,c.name category FROM books b LEFT JOIN categories c ON c.id=b.category_id ORDER BY b.id DESC`).all();
  res.render('books/index',{title:'Quản lý sách',books,q});
});
router.get('/add',(req,res)=>res.render('books/form',{title:'Thêm sách',book:null,categories:db.prepare('SELECT * FROM categories').all()}));
router.post('/add',(req,res)=>{
  const b=req.body;
  try{
    const quantity=Math.max(1,parseInt(b.quantity,10)||1);
    db.prepare(`INSERT INTO books(isbn,title,author,publisher,year,category_id,quantity,available,description)
      VALUES (?,?,?,?,?,?,?,?,?)`).run(b.isbn.trim(),b.title.trim(),b.author.trim(),b.publisher||'',b.year||null,b.category_id||null,quantity,quantity,b.description||'');
    req.flash('success','Đã thêm sách.');res.redirect('/admin/books');
  }catch(e){req.flash('error','Không thể thêm sách. ISBN có thể đã tồn tại.');res.redirect('/admin/books/add');}
});
router.get('/edit/:id',(req,res)=>{
  const book=db.prepare('SELECT * FROM books WHERE id=?').get(req.params.id);
  if(!book)return res.redirect('/admin/books');
  res.render('books/form',{title:'Sửa sách',book,categories:db.prepare('SELECT * FROM categories').all()});
});
router.post('/edit/:id',(req,res)=>{
  const b=req.body;
  try{
    const quantity=Math.max(1,parseInt(b.quantity,10)||1);
    const borrowed=db.prepare("SELECT COUNT(*) c FROM borrow_records WHERE book_id=? AND status='Đang mượn'").get(req.params.id).c;
    if(quantity<borrowed){req.flash('error',`Số lượng không thể nhỏ hơn ${borrowed} cuốn đang được mượn.`);return res.redirect('/admin/books/edit/'+req.params.id);}
    db.prepare(`UPDATE books SET isbn=?,title=?,author=?,publisher=?,year=?,category_id=?,quantity=?,description=? WHERE id=?`)
      .run(b.isbn.trim(),b.title.trim(),b.author.trim(),b.publisher||'',b.year||null,b.category_id||null,quantity,b.description||'',req.params.id);
    db.prepare('UPDATE books SET available=? WHERE id=?').run(quantity-borrowed,req.params.id);
    req.flash('success','Đã cập nhật sách.');res.redirect('/admin/books');
  }catch(e){req.flash('error','Không thể cập nhật sách.');res.redirect('/admin/books');}
});
router.post('/delete/:id',(req,res)=>{
  try{db.prepare('DELETE FROM books WHERE id=?').run(req.params.id);req.flash('success','Đã xóa sách.');}
  catch(e){req.flash('error','Không thể xóa sách đang có lịch sử mượn.');}
  res.redirect('/admin/books');
});
router.get('/:id',async(req,res)=>{
  const book=db.prepare(`SELECT b.*,c.name category FROM books b LEFT JOIN categories c ON c.id=b.category_id WHERE b.id=?`).get(req.params.id);
  if(!book)return res.redirect('/admin/books');
  const history=db.prepare(`SELECT br.*,r.full_name reader FROM borrow_records br JOIN readers r ON r.id=br.reader_id
    WHERE br.book_id=? ORDER BY br.id DESC`).all(req.params.id);
  const base=`${req.protocol}://${req.get('host')}/search?q=${encodeURIComponent(book.isbn)}`;
  const qr=await QRCode.toDataURL(base,{width:220,margin:2});
  res.render('books/detail',{title:'Chi tiết sách',book,history,qr});
});
module.exports=router;
