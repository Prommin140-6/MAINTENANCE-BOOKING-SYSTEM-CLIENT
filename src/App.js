import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import BookingPage from './pages/BookingPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';

function App() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(!!localStorage.getItem('token'));

  // ตรวจสอบ token ใน localStorage และอัปเดตสถานะเมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    const handleStorageChange = () => {
      setIsAdminAuthenticated(!!localStorage.getItem('token'));
    };

    // ฟังการเปลี่ยนแปลงใน localStorage (กรณี tab อื่นเปลี่ยน token)
    window.addEventListener('storage', handleStorageChange);

    // ตรวจสอบครั้งแรกเมื่อโหลดหน้า
    handleStorageChange();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<BookingPage />} />
        <Route
          path="/admin/login"
          element={
            isAdminAuthenticated ? <Navigate to="/admin" /> : <LoginPage />
          }
        />
        <Route
          path="/admin"
          element={
            isAdminAuthenticated ? <AdminPage /> : <Navigate to="/admin/login" />
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;