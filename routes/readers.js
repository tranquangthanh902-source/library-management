const router=require('express').Router();
const db=require('../database/init');
router.get('/',(req,res)=>{
  const q=(req.query.q||'').trim();
  const readers=q?db.prepare(`SELECT * FROM readers WHERE full_name LIKE ? OR reader_code LIKE ? OR phone LIKE ? ORDER BY id DESC`).all(`%${q}%`,`%${q}%`,`%${q}%`)
  :db.prepare('SELECT * FROM readers ORDER BY id DESC').all();
  res.render('readers/index',{title:'Quản lý bạn đọc',readers,q});
});
router.get('/add',(req,res)=>res.render('readers/form',{title:'Thêm bạn đọc',reader:null}));
router.post('/add',(req,res)=>{
  const r=req.body;
  try{db.prepare(`INSERT INTO readers(reader_code,full_name,email,phone,address,reader_type,status) VALUES (?,?,?,?,?,?,?)`)
    .run(r.reader_code,r.full_name,r.email||'',r.phone||'',r.address||'',r.reader_type||'Sinh viên','Hoạt động');
    req.flash('success','Đã thêm bạn đọc.');res.redirect('/admin/readers');
  }catch(e){req.flash('error','Mã bạn đọc đã tồn tại hoặc dữ liệu không hợp lệ.');res.redirect('/admin/readers/add');}
});
router.get('/edit/:id',(req,res)=>{
  const reader=db.prepare('SELECT * FROM readers WHERE id=?').get(req.params.id);
  if(!reader)return res.redirect('/admin/readers');
  res.render('readers/form',{title:'Sửa bạn đọc',reader});
});
router.post('/edit/:id',(req,res)=>{
  const r=req.body;
  try{
    db.prepare(`UPDATE readers SET reader_code=?,full_name=?,email=?,phone=?,address=?,reader_type=?,status=? WHERE id=?`)
      .run(r.reader_code,r.full_name,r.email||'',r.phone||'',r.address||'',r.reader_type||'Sinh viên',r.status||'Hoạt động',req.params.id);
    req.flash('success','Đã cập nhật bạn đọc.');res.redirect('/admin/readers');
  }catch(e){req.flash('error','Không thể cập nhật. Mã bạn đọc có thể đã tồn tại.');res.redirect('/admin/readers');}
});
router.post('/delete/:id',(req,res)=>{
  try{db.prepare('DELETE FROM readers WHERE id=?').run(req.params.id);req.flash('success','Đã xóa bạn đọc.');}
  catch(e){req.flash('error','Không thể xóa bạn đọc. Có thể đang có lịch sử mượn.');}
  res.redirect('/admin/readers');
});
router.get('/:id',(req,res)=>{
  const reader=db.prepare('SELECT * FROM readers WHERE id=?').get(req.params.id);
  if(!reader)return res.redirect('/admin/readers');
  const history=db.prepare(`SELECT br.*,b.title FROM borrow_records br JOIN books b ON b.id=br.book_id
    WHERE br.reader_id=? ORDER BY br.id DESC`).all(req.params.id);
  res.render('readers/detail',{title:'Chi tiết bạn đọc',reader,history});
});
module.exports=router;
