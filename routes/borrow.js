const router=require('express').Router();
const db=require('../database/init');

router.get('/',(req,res)=>{
  const status=req.query.status||'';
  let sql=`SELECT br.*,r.full_name reader,b.title book FROM borrow_records br
    JOIN readers r ON r.id=br.reader_id JOIN books b ON b.id=br.book_id`;
  let params=[];
  if(status){sql+=' WHERE br.status=?';params=[status];}
  sql+=' ORDER BY br.id DESC';
  const records=db.prepare(sql).all(...params);
  res.render('borrow/index',{title:'Mượn / Trả sách',records,status});
});
router.get('/create',(req,res)=>{
  const readers=db.prepare("SELECT * FROM readers WHERE status='Hoạt động' ORDER BY full_name").all();
  const books=db.prepare('SELECT * FROM books WHERE available>0 ORDER BY title').all();
  res.render('borrow/create',{title:'Tạo phiếu mượn',readers,books});
});
router.post('/create',(req,res)=>{
  const {reader_id,book_id,due_date,notes}=req.body;
  const book=db.prepare('SELECT * FROM books WHERE id=?').get(book_id);
  if(!book||book.available<1){req.flash('error','Sách đã hết.');return res.redirect('/admin/borrow/create');}
  const today=new Date().toISOString().slice(0,10);
  const tx=db.transaction(()=>{
    db.prepare(`INSERT INTO borrow_records(reader_id,book_id,borrow_date,due_date,status,notes) VALUES (?,?,?,?,?,?)`)
      .run(reader_id,book_id,today,due_date,'Đang mượn',notes||'');
    db.prepare('UPDATE books SET available=available-1 WHERE id=?').run(book_id);
  });
  tx();req.flash('success','Tạo phiếu mượn thành công.');res.redirect('/admin/borrow');
});
router.post('/return/:id',(req,res)=>{
  const record=db.prepare("SELECT * FROM borrow_records WHERE id=? AND status='Đang mượn'").get(req.params.id);
  if(!record)return res.redirect('/admin/borrow');
  const tx=db.transaction(()=>{
    db.prepare("UPDATE borrow_records SET return_date=?,status='Đã trả' WHERE id=?").run(new Date().toISOString().slice(0,10),record.id);
    db.prepare('UPDATE books SET available=available+1 WHERE id=?').run(record.book_id);
  });
  tx();req.flash('success','Đã ghi nhận trả sách.');res.redirect('/admin/borrow');
});
module.exports=router;
