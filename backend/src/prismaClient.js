// Phân mảnh vi mô 
const { PrismaClient } = require('@prisma/client');

// 1. Client Toàn quyền Chỉ dùng cho Admin
const prismaAdmin = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

// 2. Client Chỉ đọc (Dành cho API xem sản phẩm, không thể sửa/xóa)
const prismaReadOnly = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL_READONLY } },
});

// 3. Client Xử lý đơn hàng (Được phép thêm/sửa đơn hàng và tồn kho, KHÔNG được xóa)
const prismaOrder = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL_ORDER } },
});

// Xuất cả 3 luồng này ra để các file khác dùng
module.exports = {
  prismaAdmin,
  prismaReadOnly,
  prismaOrder
};