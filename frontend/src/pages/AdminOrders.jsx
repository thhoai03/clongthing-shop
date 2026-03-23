import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AdminOrders = () => {
  // 1. Khai báo toàn bộ State trong Component
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, lowStockProducts: 0 });
  const [logs, setLogs] = useState([]); // Chứa dữ liệu Nhật ký bảo mật
  const [loading, setLoading] = useState(true);

  // 2. Lấy dữ liệu từ Backend (Áp dụng kỹ thuật Fault Tolerance - Chịu lỗi)
  const fetchData = async () => {
    try {
      // BƯỚC A: Lấy dữ liệu cốt lõi (Đơn hàng & Thống kê)
      const resOrders = await api.get('/orders/all');
      const resStats = await api.get('/orders/stats');
      setOrders(resOrders.data);
      setStats(resStats.data);

      // BƯỚC B: Lấy dữ liệu Log Bảo Mật (Tách riêng try-catch)
      // Nếu lỗi DB phần Log, trang web vẫn hiển thị được Đơn hàng ở trên
      try {
        const resLogs = await api.get('/orders/security-logs');
        setLogs(resLogs.data);
      } catch (logErr) {
        console.error("Cảnh báo: Không tải được Security Logs:", logErr);
      }

    } catch (err) {
      console.error("Lỗi tải dữ liệu Admin:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 3. Hàm Duyệt đơn hàng
  const handleApprove = async (orderId) => {
    try {
      await api.patch(`/orders/status/${orderId}`, { status: 'DELIVERED' });
      alert("Đã duyệt đơn và chuyển sang trạng thái Giao Hàng!");
      fetchData(); // Load lại dữ liệu để cập nhật số liệu
    } catch (err) {
      alert("Lỗi khi duyệt đơn!");
    }
  };

  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '50px' }}>Đang tải dữ liệu hệ thống...</div>;

  return (
    <div style={{ padding: '30px', backgroundColor: '#1a1a1a', minHeight: '100vh', color: 'white', fontFamily: 'Arial' }}>
      <h1 style={{ textAlign: 'center', color: 'gold' }}>SHOP THANHHOAI</h1>

      {/* --- PHẦN 1: THỐNG KÊ (DASHBOARD) --- */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <div style={cardStyle}>
          <p>📦 Tổng đơn hàng</p>
          <h2 style={{ color: '#00d1ff' }}>{stats.totalOrders}</h2>
        </div>
        <div style={{ ...cardStyle, borderLeft: '5px solid #00ff88' }}>
          <p>💰 Doanh thu thực (Đã xác thực)</p>
          <h2 style={{ color: '#00ff88' }}>{stats.totalRevenue.toLocaleString()} VNĐ</h2>
        </div>
        <div style={{ ...cardStyle, borderLeft: '5px solid #ff4d4d' }}>
          <p>⚠️ Sản phẩm sắp hết</p>
          <h2 style={{ color: '#ff4d4d' }}>{stats.lowStockProducts}</h2>
        </div>
      </div>

      {/* --- PHẦN 2: BẢNG DANH SÁCH ĐƠN HÀNG --- */}
      <div style={sectionStyle}>
        <h3 style={titleStyle}>📦 Chi tiết đơn hàng mới nhất</h3>
        <table style={tableStyle}>
          <thead>
            <tr style={headerRowStyle}>
              <th style={thStyle}>Khách Hàng</th>
              <th style={thStyle}>SĐT</th>
              <th style={thStyle}>Tổng Tiền</th>
              <th style={thStyle}>Trạng Thái</th>
              <th style={thStyle}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} style={bodyRowStyle}>
                <td style={tdStyle}>{order.customerName}</td>
                <td style={tdStyle}>{order.customerPhone}</td>
                <td style={tdStyle}>{order.totalAmount.toLocaleString()} đ</td>
                <td style={tdStyle}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.8rem',
                    backgroundColor: order.isVerified ? '#28a74533' : '#ffc10733',
                    color: order.isVerified ? '#28a745' : '#ffc107'
                  }}>
                    {order.isVerified ? '● Đã xác thực OTP' : '○ Chờ xác thực'}
                  </span>
                  <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '5px' }}>{order.status}</div>
                </td>
                <td style={tdStyle}>
                  {order.isVerified && order.status === 'PENDING' && (
                    <button 
                      onClick={() => handleApprove(order.id)}
                      style={btnApproveStyle}
                    >
                      Duyệt Đơn
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- PHẦN 3: NHẬT KÝ BẢO MẬT (SECURITY LOGS) --- */}
      <div style={{ ...sectionStyle, marginTop: '50px', borderTop: '2px solid #ff4d4d' }}>
        <h3 style={{ ...titleStyle, color: '#ff4d4d' }}>🛡️ NHẬT KÝ BẢO MẬT (2FA AUDIT LOGS)</h3>
        <table style={tableStyle}>
          <thead>
            <tr style={headerRowStyle}>
              <th style={thStyle}>Thời Gian</th>
              <th style={thStyle}>Hành Động</th>
              <th style={thStyle}>Đối Tượng</th>
              <th style={thStyle}>Trạng Thái</th>
              <th style={thStyle}>Chi Tiết</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? logs.map((log) => (
              <tr key={log.id} style={bodyRowStyle}>
                <td style={{ ...tdStyle, fontSize: '0.8rem', color: '#888' }}>
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td style={{ ...tdStyle, fontWeight: 'bold' }}>{log.action}</td>
                <td style={tdStyle}>{log.email}</td>
                <td style={tdStyle}>
                  <span style={{ 
                    padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem',
                    backgroundColor: log.status === 'SUCCESS' ? '#00ff8822' : '#ff4d4d22',
                    color: log.status === 'SUCCESS' ? '#00ff88' : '#ff4d4d' 
                  }}>
                    {log.status}
                  </span>
                </td>
                <td style={{ ...tdStyle, fontSize: '0.8rem', fontStyle: 'italic', color: '#aaa' }}>
                  {log.details}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  Chưa có dữ liệu nhật ký bảo mật.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

// --- STYLES CỐ ĐỊNH ---
const sectionStyle = { backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '10px', overflowX: 'auto' };
const titleStyle = { marginBottom: '20px', borderBottom: '1px solid #444', paddingBottom: '10px' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const headerRowStyle = { color: '#888', borderBottom: '1px solid #444' };
const bodyRowStyle = { borderBottom: '1px solid #333' };
const cardStyle = { backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '10px', width: '250px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', borderLeft: '5px solid #00d1ff' };
const thStyle = { padding: '15px 10px' };
const tdStyle = { padding: '15px 10px' };
const btnApproveStyle = { background: '#007bff', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };

export default AdminOrders;