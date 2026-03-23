
const jwt = require('jsonwebtoken');

/**
 * 1. Middleware Xác thực (Authentication) + Zero Trust Context
 * Dùng cho MỌI route cần đăng nhập.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Định dạng: Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Bạn chưa đăng nhập hoặc thiếu token!' });
  }

  try {
    const secretKey = process.env.JWT_SECRET || 'HOAI_SECURITY_KEY_2026';
    const decoded = jwt.verify(token, secretKey);

    // 2. ZERO TRUST: XÁC MINH LIÊN TỤC (Continuous Verification)
    const currentRequestUserAgent = req.headers['user-agent'] || 'unknown';

    // So sánh User-Agent hiện tại với User-Agent đã đóng dấu lúc đăng nhập
    if (decoded.userAgent && decoded.userAgent !== currentRequestUserAgent) {
      console.log(`\n🚨 [ZERO TRUST ALERT] Phát hiện nghi vấn Session Hijacking (Đánh cắp Token)!`);
      console.log(`- Token gốc cấp cho trình duyệt: ${decoded.userAgent}`);
      console.log(`- Kẻ gian đang dùng trình duyệt: ${currentRequestUserAgent}\n`);
      
      return res.status(403).json({ 
        message: 'Cảnh báo an ninh: Phát hiện môi trường truy cập thay đổi đột ngột! Token đã bị vô hiệu hóa, vui lòng đăng nhập lại.',
        require2FA: true 
      });
    }

    // Nếu môi trường an toàn, cho phép đi tiếp
    req.user = decoded; 
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn!' });
  }
};

/**
 * 2. Middleware Phân quyền (Authorization)
 */
const isAdmin = (req, res, next) => {
  const userRole = req.user?.role?.toUpperCase();

  if (userRole !== 'ADMIN') {
    return res.status(403).json({ message: 'Truy cập bị từ chối! Chỉ Admin mới có quyền thực hiện.' });
  }
  
  next();
};

module.exports = { verifyToken, isAdmin };