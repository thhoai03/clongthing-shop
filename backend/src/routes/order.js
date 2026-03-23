const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// ZERO TRUST: Sử dụng phân quyền Database
const { prismaOrder, prismaAdmin } = require('../prismaClient');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'hoaik4d5@gmail.com',
    pass: 'cqjyfkjffthvyasi' 
  }
});

// Hàm hỗ trợ ghi Log an toàn (Sử dụng quyền Admin để không bị chặn)
const logSecurityEvent = async (action, email, status, details) => {
  try {
    await prismaAdmin.securityLog.create({
      data: {
        action: action,
        email: email || "Unknown",
        status: status,
        details: details
      }
    });
    console.log(`[Security Log] ${action} - ${status} - ${email}`);
  } catch (logErr) {
    console.error("[Lỗi Ghi Log Bảo Mật]:", logErr.message);
  }
};

// ==========================================
// API CHO KHÁCH HÀNG (Dùng prismaOrder - Quyền Ghi Giới Hạn)
// ==========================================

router.post('/checkout', async (req, res) => {
  const { items, address, phone, total, userId, customerName, email } = req.body;

  const otp = crypto.randomInt(100000, 999999).toString();
  const expires = new Date(Date.now() + 5 * 60000); // 5 phút

  try {
    const result = await prismaOrder.$transaction(async (tx) => {
      // 1. Tạo đơn hàng
      const order = await tx.order.create({
        data: {
          userId: userId || null,
          customerName: customerName,
          customerPhone: phone,
          customerAddress: address,
          totalAmount: parseFloat(total),
          otpCode: otp, 
          otpExpires: expires,
          isVerified: false,
          items: {
            create: items.map(item => ({
              productId: item.id,
              quantity: item.quantity,
              price: item.price
            }))
          }
        }
      });

      // 2. Trừ kho hàng 
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.id } });
        if (!product || product.stock < item.quantity) {
          throw new Error(`Sản phẩm ${product?.name || item.id} không đủ hàng!`);
        }

        await tx.product.update({
          where: { id: item.id },
          data: { stock: { decrement: item.quantity } }
        });
      }

      return order;
    });

    // 3. Ghi Nhật ký bảo mật (Sau khi tạo đơn thành công)
    await logSecurityEvent("SEND_OTP", email || customerName, "SUCCESS", `Đã tạo đơn hàng ${result.id.substring(0,8)} và gửi mã OTP.`);

    // 4. Gửi Email 
    console.log(">>> Đang gửi mail OTP đến:", email);
    await transporter.sendMail({
      from: '"Shop Quần Áo Hoài" <hoaik4d5@gmail.com>',
      to: email, 
      subject: "Xác thực đơn hàng của bạn",
      html: `
        <h3>Xác thực đơn hàng</h3>
        <p>Chào <b>${customerName}</b>,</p>
        <p>Mã OTP để xác nhận đơn hàng của bạn là: <b style="color:red; font-size:20px;">${otp}</b></p>
        <p>Mã này có hiệu lực trong 5 phút. Vui lòng không cung cấp mã này cho bất kỳ ai.</p>
      `
    });
    console.log(">>> Đã gửi mail thành công!");

    res.status(201).json({ 
      message: "Mã OTP đã được gửi về Email!", 
      orderId: result.id 
    });

  } catch (error) {
    console.error("LỖI THANH TOÁN:", error.message);
    // Ghi log lỗi nếu bị hacker phá bĩnh
    await logSecurityEvent("CHECKOUT_FAILED", email || customerName, "FAILED", error.message);
    res.status(500).json({ message: error.message || "Lỗi khi xử lý đơn hàng" });
  }
});

router.post('/verify-order', async (req, res) => {
  const { orderId, otpEntered } = req.body;

  try {
    const order = await prismaOrder.order.findUnique({ where: { id: orderId } });

    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng!" });

    const userEmailOrName = order.customerName || "Khách Hàng";

    // 1. Kiểm tra sai mã OTP
    if (order.otpCode !== otpEntered) {
      await logSecurityEvent("VERIFY_OTP", userEmailOrName, "FAILED", "Nhập sai mã OTP.");
      return res.status(400).json({ message: "Mã OTP không chính xác!" });
    }

    // 2. Kiểm tra mã hết hạn
    if (new Date() > order.otpExpires) {
      await logSecurityEvent("VERIFY_OTP", userEmailOrName, "FAILED", "Mã OTP đã hết hạn.");
      return res.status(400).json({ message: "Mã OTP đã hết hạn (5 phút)!" });
    }

    // 3. Xác thực thành công -> Cập nhật trạng thái đơn
    await prismaOrder.order.update({
      where: { id: orderId },
      data: { isVerified: true, otpCode: null, otpExpires: null } 
    });

    // 4. Ghi Log khi XÁC THỰC THÀNH CÔNG
    await logSecurityEvent("VERIFY_OTP", userEmailOrName, "SUCCESS", "Xác thực 2FA thành công.");

    res.json({ message: "Xác thực đơn hàng thành công!" });
  } catch (error) {
    console.error("Lỗi hệ thống verify:", error);
    res.status(500).json({ message: "Lỗi hệ thống khi xác thực" });
  }
});

// ==========================================
// API CHO ADMIN (Dùng prismaAdmin & Auth Middleware)
// ==========================================

// API để Admin lấy danh sách Nhật ký bảo mật
router.get('/security-logs', verifyToken, isAdmin, async (req, res) => {
  try {
    const logs = await prismaAdmin.securityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20 // Lấy 20 dòng mới nhất
    });
    res.json(logs);
  } catch (error) {
    console.error("Lỗi lấy Security Logs:", error);
    res.status(500).json({ message: "Lỗi khi lấy nhật ký bảo mật" });
  }
});

router.get('/stats', verifyToken, isAdmin, async (req, res) => {
  try {
    const totalOrders = await prismaAdmin.order.count();
    const revenueData = await prismaAdmin.order.aggregate({
      where: { isVerified: true },
      _sum: { totalAmount: true },
    });
    const lowStockProducts = await prismaAdmin.product.count({
      where: { stock: { lt: 5 } }
    });

    res.json({
      totalOrders,
      totalRevenue: revenueData._sum.totalAmount || 0,
      lowStockProducts
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy thống kê" });
  }
}); 

router.get('/all', verifyToken, isAdmin, async (req, res) => {
  try {
    const orders = await prismaAdmin.order.findMany({
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy đơn hàng" });
  }
});

router.patch('/status/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await prismaAdmin.order.update({
      where: { id: id },
      data: { status: status }
    });
    res.json({ message: "Cập nhật thành công!" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật trạng thái" });
  }
});

module.exports = router;