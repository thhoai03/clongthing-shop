// backend/src/routes/auth.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken'); 

const prisma = new PrismaClient();

// 1. CẤU HÌNH GỬI MAIL 
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'hoaik4d5@gmail.com', 
    pass: 'cqjyfkjffthvyasi'        
  }
});

// 2. BƯỚC 1: ĐĂNG KÝ (Gửi OTP)
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const otp = crypto.randomInt(100000, 999999).toString();
  const expires = new Date(Date.now() + 10 * 60000); // 10 phút

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await prisma.user.upsert({
      where: { email },
      update: { passwordHash: hashedPassword, otpCode: otp, otpExpires: expires },
      create: { email, passwordHash: hashedPassword, otpCode: otp, otpExpires: expires }
    });

    await transporter.sendMail({
      from: '"Security System" <hoaik4d5@gmail.com>',
      to: email,
      subject: "Mã xác thực đăng ký tài khoản",
      html: `<p>Mã OTP của bạn là: <b style="font-size: 20px; color: blue;">${otp}</b></p>`
    });

    res.status(200).json({ message: "Đã gửi OTP vào email của bạn!" });
  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    res.status(500).json({ message: "Lỗi đăng ký tài khoản!" });
  }
});

// 3. BƯỚC 2: XÁC THỰC OTP
router.post('/verify-registration', async (req, res) => {
  const { email, otpEntered } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.otpCode !== otpEntered || new Date() > user.otpExpires) {
      return res.status(400).json({ message: "Mã OTP không đúng hoặc đã hết hạn!" });
    }

    await prisma.user.update({
      where: { email },
      data: { isVerified: true, otpCode: null, otpExpires: null }
    });

    res.json({ message: "Kích hoạt tài khoản thành công!" });
  } catch (error) {
    console.error("Lỗi xác thực:", error);
    res.status(500).json({ message: "Lỗi hệ thống khi xác thực!" });
  }
});

// 4. BƯỚC 3: ĐĂNG NHẬP (Cấp Token Zero Trust)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: "Tài khoản không tồn tại!" });
    }

    // Kiểm tra xem đã xác thực OTP chưa
    if (!user.isVerified) {
      return res.status(403).json({ message: "Vui lòng xác thực OTP trước khi đăng nhập!" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Mật khẩu không chính xác!" });
    }

    // ==========================================
    // ZERO TRUST: Lấy thông tin môi trường lúc đăng nhập
    // ==========================================
    const currentUserAgent = req.headers['user-agent'] || 'unknown';

    // Tạo JWT Token và GẮN CHẶT userAgent vào bên trong
    const secretKey = process.env.JWT_SECRET || 'HOAI_SECURITY_KEY_2026';
    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.role, 
        userAgent: currentUserAgent 
      },
      secretKey, 
      { expiresIn: '1d' }
    );

    res.json({
      message: "Đăng nhập thành công!",
      token,
      user: { email: user.email, role: user.role }
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.status(500).json({ message: "Lỗi hệ thống khi đăng nhập!" });
  }
});

module.exports = router;