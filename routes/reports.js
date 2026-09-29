const router=require('express').Router();
const db=require('../database/init');
router.get('/',(req,res)=>{
  const stats={
    totalBorrows:db.prepare('SELECT COUNT(*) c FROM borrow_records').get().c,
    returned:db.prepare("SELECT COUNT(*) c FROM borrow_records WHERE status='Đã trả'").get().c,
    active:db.prepare("SELECT COUNT(*) c FROM borrow_records WHERE status='Đang mượn'").get().c,
    overdue:db.prepare("SELECT COUNT(*) c FROM borrow_records WHERE status='Đang mượn' AND date(due_date)<date('now')").get().c
  };
  const topBooks=db.prepare(`SELECT b.title,b.author,COUNT(br.id) total FROM borrow_records br
    JOIN books b ON b.id=br.book_id GROUP BY b.id ORDER BY total DESC LIMIT 10`).all();
  const topReaders=db.prepare(`SELECT r.full_name,r.reader_code,COUNT(br.id) total FROM borrow_records br
    JOIN readers r ON r.id=br.reader_id GROUP BY r.id ORDER BY total DESC LIMIT 10`).all();
  res.render('reports/index',{title:'Báo cáo thống kê',stats,topBooks,topReaders});
});
module.exports=router;
