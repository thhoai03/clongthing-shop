import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Home = () => {
  const [products, setProducts] = useState([]);
  
  // 1. KHÔI PHỤC GIỎ HÀNG TỪ LOCALSTORAGE KHI LOAD TRANG
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // 2. TỰ ĐỘNG ĐIỀN THÔNG TIN NẾU ĐÃ ĐĂNG NHẬP
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(''); // Thêm email để gửi OTP đơn hàng
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [currentOrderId, setCurrentOrderId] = useState(null);

  const BACKEND_URL = "http://localhost:8888"; 

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        setProducts(res.data);
      } catch (error) {
        console.error('Lỗi khi tải sản phẩm:', error);
      }
    };
    fetchProducts();

    // Lấy thông tin đã lưu khi đăng nhập (nếu có)
    const savedEmail = localStorage.getItem('email');
    if (savedEmail) setEmail(savedEmail);
  }, []);

  // 3. LƯU GIỎ HÀNG MỖI KHI CÓ THAY ĐỔI
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const isExist = prevCart.find(item => item.id === product.id);
      if (isExist) {
        return prevCart.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    // Thay alert bằng console.log hoặc toast để trải nghiệm mượt hơn
    console.log(`Đã thêm ${product.name}`);
  };

  const totalCartPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  const handleVerifyOtp = async () => {
  try {
    await api.post('/orders/verify-order', {
      orderId: currentOrderId,
      otpEntered: otpInput
    });
    alert("XÁC THỰC THÀNH CÔNG! Đơn hàng của bạn đã được duyệt.");
    setShowOtpModal(false);
    setCart([]); // Xóa giỏ hàng
    localStorage.removeItem('cart'); // Xóa bộ nhớ tạm
    setOtpInput('');
  } catch (error) {
    alert(error.response?.data?.message || "Mã sai rồi Hoài ơi!");
  }
};
  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Giỏ hàng đang trống!");
    
    // Yêu cầu email để gửi mã OTP xác thực đơn hàng
    if (!customerName || !address || !phone || !email) {
      return alert("Vui lòng nhập đủ thông tin, đặc biệt là Email để nhận mã OTP xác thực nhé!");
    }

    try {
      // Gửi đơn hàng kèm email để Backend gửi mã OTP
      const res = await api.post('/orders/checkout', {
        items: cart,
        customerName: customerName,
        address: address, 
        phone: phone,    
        email: email, // Cực kỳ quan trọng để gửi mail OTP
        total: totalCartPrice,
      });
      
      alert("Mã OTP đã được gửi về Gmail của bạn. Hãy kiểm tra để xác nhận đơn hàng!");
      
      // Không nên reset cart ngay ở đây, mà nên đợi sau khi xác thực OTP thành công
      // Ở đây có thể điều hướng sang trang xác thực hoặc hiện Modal nhập mã
      setCurrentOrderId(res.data.orderId); 
      setShowOtpModal(true); // HIỆN CỬA SỔ NHẬP MÃ
      alert("Vui lòng kiểm tra Email để lấy mã xác thực!");
    } catch (error) {
      console.error(error);
      alert("Lỗi khi tạo đơn hàng!");
    }
  };

  return (
    <div style={{ display: 'flex', gap: '30px', padding: '30px', backgroundColor: '#f4f4f4', minHeight: '100vh' }}>
      
      {/* CỘT TRÁI: DANH SÁCH SẢN PHẨM */}
      <div style={{ flex: 3 }}>
        <h2 style={{ borderBottom: '2px solid #333', paddingBottom: '10px' }}>Sản Phẩm Mới Nhất</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {products.map((p) => (
            <div key={p.id} style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
              <div style={{ height: '180px', overflow: 'hidden', borderRadius: '5px', marginBottom: '10px' }}>
                <img 
                  src={`${BACKEND_URL}${p.imageUrl?.startsWith('/') ? p.imageUrl : '/' + p.imageUrl}`} 
                  alt={p.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.src = "https://via.placeholder.com/200?text=No+Image" }}
                />
              </div>
              <h3 style={{ fontSize: '1rem', margin: '10px 0' }}>{p.name}</h3>
              <p style={{ color: 'red', fontWeight: 'bold' }}>{p.price.toLocaleString()} VNĐ</p>
              <button 
                onClick={() => addToCart(p)}
                style={{ width: '100%', padding: '10px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Thêm vào giỏ
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CỘT PHẢI: GIỎ HÀNG & THANH TOÁN */}
      <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', height: 'fit-content', position: 'sticky', top: '20px' }}>
        <h3>Giỏ Hàng ({cart.length})</h3>
        <hr />
        
        {cart.length === 0 ? <p style={{ color: '#888' }}>Trống trơn...</p> : (
          <>
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '15px' }}>
              {cart.map((item, index) => (
                <div key={index} style={{ marginBottom: '10px', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span><strong>{item.name}</strong> x {item.quantity}</span>
                  <span style={{ color: '#666' }}>{(item.price * item.quantity).toLocaleString()}đ</span>
                </div>
              ))}
            </div>
            
            <div style={{ backgroundColor: '#eee', padding: '10px', borderRadius: '5px', marginBottom: '20px', textAlign: 'right' }}>
              <strong>Tổng: {totalCartPrice.toLocaleString()} VNĐ</strong>
            </div>

            <h4 style={{ marginBottom: '10px' }}>Thông tin giao hàng</h4>
            
            <input 
              type="text" placeholder="Họ và tên..." value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }}
            />
            <input 
              type="email" placeholder="Email nhận mã OTP..." value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }}
            />
            <input 
              type="text" placeholder="Địa chỉ nhận hàng..." value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }}
            />
            <input 
              type="text" placeholder="Số điện thoại..." value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: '100%', padding: '10px', marginBottom: '20px', boxSizing: 'border-box' }}
            />

            <button 
              onClick={handleCheckout}
              style={{ width: '100%', padding: '15px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
              XÁC NHẬN & NHẬN MÃ OTP
            </button>
          </>
        )}
      </div>
      {/* CỬA SỔ MODAL NHẬP OTP */}
{showOtpModal && (
  <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', textAlign: 'center', width: '300px' }}>
      <h3>Nhập mã xác thực</h3>
      <p style={{ fontSize: '0.8rem', color: '#666' }}>Chúng tôi đã gửi mã 6 số đến Email của bạn</p>
      <input 
        type="text" maxLength="6" value={otpInput} 
        onChange={(e) => setOtpInput(e.target.value)}
        style={{ width: '100%', padding: '10px', fontSize: '1.5rem', textAlign: 'center', letterSpacing: '5px', marginBottom: '20px' }}
        placeholder="000000"
      />
      <button onClick={handleVerifyOtp} style={{ width: '100%', padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
        XÁC NHẬN ĐƠN HÀNG
      </button>
      <button onClick={() => setShowOtpModal(false)} style={{ marginTop: '10px', background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}>
        Hủy bỏ
      </button>
    </div>
  </div>
)}
    </div>
  );
};

export default Home;