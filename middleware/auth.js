exports.isAuthenticated = (req,res,next)=>{
  if(req.session.user) return next();
  req.flash('error','Vui lòng đăng nhập để tiếp tục.');
  res.redirect('/login');
};
