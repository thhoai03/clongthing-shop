// backend/src/routes/product.js
const express = require('express');
const router = express.Router();

// ZERO TRUST: Dùng quyền Chỉ đọc cho user thường, Toàn quyền cho Admin
const { prismaReadOnly, prismaAdmin } = require('../prismaClient'); 
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// Route 1: Khách hàng xem sản phẩm (Quyền CHỈ ĐỌC)
router.get('/', async (req, res) => {
  try {
    const products = await prismaReadOnly.product.findMany();
    res.json(products); 
  } catch (error) {
    res.status(500).json({ error: "Không kết nối được với Neon Database" });
  }
});

// Route 2: Admin thêm sản phẩm mới (Cần Xác thực + Quyền Admin + Database Admin)
router.post('/products', verifyToken, isAdmin, async (req, res) => {
  const { name, price, stock, description, imageUrl } = req.body;
  try {
    const newProduct = await prismaAdmin.product.create({
      data: {
        name,
        price: parseFloat(price),
        stock: parseInt(stock),
        description,
        imageUrl
      }
    });
    res.status(201).json({ message: "Thêm sản phẩm thành công", product: newProduct });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi thêm sản phẩm" });
  }
});

module.exports = router;