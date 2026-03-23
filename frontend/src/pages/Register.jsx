import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(''); // Lưu mã OTP người dùng nhập
  const [step, setStep] = useState(1); // Bước 1: Đăng ký, Bước 2: Nhập OTP
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // BƯỚC 1: Gửi thông tin đăng ký để Backend gửi Email OTP
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', { email, password });
      alert('Mã xác thực đã được gửi vào Email của bạn. Hãy kiểm tra nhé!');
      setStep(2); // Chuyển sang giao diện nhập OTP
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi đăng ký rồi!');
    } finally {
      setLoading(false);
    }
  };

  // BƯỚC 2: Gửi mã OTP lên để kích hoạt tài khoản
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/verify-registration', { email, otpEntered: otp });
      alert('Tài khoản đã được kích hoạt! Bạn có thể đăng nhập ngay.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Mã OTP không chính xác!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '30px', border: '1px solid #eee', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
      
      {step === 1 ? (
        <>
          <h2 style={{ textAlign: 'center', color: '#333' }}>Đăng Ký Tài Khoản</h2>
          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#666' }}></p>
          
          {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
          
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '15px' }}>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box' }} placeholder="vi-du@gmail.com"/>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label>Mật khẩu:</label> <br />
              <input type="password" required minLength="6" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box' }}/>
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
              {loading ? 'Đang gửi mã...' : 'Nhận mã xác thực'}
            </button>
          </form>
        </>
      ) : (
        <>
          <h2 style={{ textAlign: 'center', color: '#28a745' }}>Xác Thực Email</h2>
          <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>Vui lòng nhập mã 6 số đã gửi tới: <br/> <b>{email}</b></p>
          
          {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
          
          <form onSubmit={handleVerifyOtp}>
            <div style={{ marginBottom: '20px' }}>
              <input 
                type="text" 
                required 
                maxLength="6"
                value={otp} 
                onChange={e => setOtp(e.target.value)} 
                placeholder="Nhập 6 số OTP"
                style={{ width: '100%', padding: '15px', fontSize: '1.5rem', textAlign: 'center', letterSpacing: '5px', borderRadius: '8px', border: '2px solid #ddd' }}
              />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
              {loading ? 'Đang xác thực...' : 'Kích hoạt tài khoản'}
            </button>
            <button type="button" onClick={() => setStep(1)} style={{ width: '100%', marginTop: '10px', background: 'none', border: 'none', color: '#007bff', cursor: 'pointer' }}>
              Quay lại sửa Email
            </button>
          </form>
        </>
      )}

      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
      </p>
    </div>
  );
};

export default Register;