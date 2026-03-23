// frontend/src/components/AdminRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  // Lấy dữ liệu trực tiếp từ localStorage
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  console.log(">>> Kiểm tra hàng rào:", { token: !!token, role: role });

  // Kiểm tra điều kiện: Không có token HOẶC role không phải ADMIN
  if (!token || role !== 'ADMIN') {
    // Thông báo cho người dùng 
    alert("Cảnh báo: Bạn không có quyền truy cập khu vực này!");
    
    // Redirect về trang chủ và xóa lịch sử chuyển trang (replace)
    return <Navigate to="/" replace />;
  }

  // Nếu thỏa mãn, cho phép truy cập vào nội dung bên trong
  return children;
};

export default AdminRoute;