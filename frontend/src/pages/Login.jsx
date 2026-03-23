import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      // Lưu Token bảo mật vào máy để dùng cho các chức năng sau
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.user.role);
      localStorage.setItem('email', res.data.user.email);
      
      alert(`Chào mừng ${res.data.user.email} quay trở lại!`);
    navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi đăng nhập');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc' }}>
      <h2>Đăng Nhập</h2>
      <p style={{ fontSize: '13px', color: 'gray' }}></p>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '10px' }}>
          <label>Email:</label> <br />
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%' }}/>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>Mật khẩu:</label> <br />
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%' }}/>
        </div>
        <button type="submit" style={{ width: '100%', padding: '10px', background: 'green', color: 'white' }}>Đăng Nhập</button>
      </form>
      <p style={{ marginTop: '10px' }}>Chưa có tài khoản? <Link to="/register">Đăng ký tại đây</Link></p>
    </div>
  );
};

export default Login;