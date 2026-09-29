const router=require('express').Router();
const db=require('../database/init');
router.get('/',(req,res)=>{
  const q=(req.query.q||'').trim();
  const books=q?db.prepare(`SELECT b.*,c.name category FROM books b LEFT JOIN categories c ON c.id=b.category_id
    WHERE b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ? ORDER BY b.id DESC`).all(`%${q}%`,`%${q}%`,`%${q}%`)
    :db.prepare(`SELECT b.*,c.name category FROM books b LEFT JOIN categories c ON c.id=b.category_id ORDER BY b.id DESC`).all();
  res.render('search',{title:'Tra cứu sách',books,q});
});
module.exports=router;
