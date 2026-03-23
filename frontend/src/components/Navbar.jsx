// frontend/src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const isAuth = !!localStorage.getItem('token');
  const userEmail = localStorage.getItem('email');
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.clear(); // Xóa sạch bộ nhớ
    alert("Đã đăng xuất!");
    navigate('/login');
    window.location.reload(); 
  };

  return (
    <nav style={{ padding: '15px', background: '#eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '15px' }}>
        <Link to="/" style={{ textDecoration: 'none', fontWeight: 'bold', color: '#333' }}>Trang Chủ Cửa Hàng</Link>
      </div>

      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        {!isAuth ? (
          <>
            <Link to="/login">Đăng Nhập</Link>
            <Link to="/register">Đăng Ký</Link>
          </>
        ) : (
          <>
            <span>Chào, <b>{userEmail}</b></span>
            
            {/* KIỂM TRA ROLE: CHỈ HIỆN NẾU LÀ ADMIN */}
            {role === 'ADMIN' && (
              <Link 
                to="/admin/orders" 
                style={{ 
                  background: 'gold', 
                  color: 'black', 
                  padding: '5px 10px', 
                  borderRadius: '5px', 
                  fontWeight: 'bold', 
                  textDecoration: 'none',
                  fontSize: '0.9rem'
                }}
              >
                💎 QUẢN LÝ ĐƠN HÀNG
              </Link>
            )}

            <button 
              onClick={handleLogout} 
              style={{ cursor: 'pointer', padding: '5px 10px', background: '#333', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Đăng Xuất
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;