const jwt = require('jsonwebtoken');

// Middleware xác thực người dùng đã đăng nhập (dùng cho tính năng Yêu thích/Lịch sử)
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(403).json({ message: 'Cần đăng nhập.' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Token không hợp lệ.' });
    req.user = decoded; 
    next();
  });
};

// Middleware kiểm tra quyền Admin (dùng cho việc Thêm/Xóa/Sửa sản phẩm)
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Chỉ Admin mới có quyền thực hiện.' });
  }
  next();
};

module.exports = { verifyToken, isAdmin };