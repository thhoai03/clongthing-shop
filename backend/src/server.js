// backend/src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/product');
const orderRoutes = require('./routes/order');

const app = express(); // Tạo app TRƯỚC khi sử dụng

// 2. Cấu hình Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json()); // Để đọc được dữ liệu JSON từ Frontend gửi lên

// Cấu hình thư mục ảnh
const uploadsPath = path.resolve(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPath));

// 3. Đăng ký các API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes); // Đường dẫn sẽ là /api/orders/checkout

// 4. Bật Server
const PORT = process.env.PORT || 8888;
app.listen(PORT, () => {
  console.log("-----------------------------------------");
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`📂 Thư mục ảnh: ${uploadsPath}`);
  console.log("-----------------------------------------");
});