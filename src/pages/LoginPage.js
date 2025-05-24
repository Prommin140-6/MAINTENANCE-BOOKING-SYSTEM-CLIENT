import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/login`, values);
      const { token } = response.data;
      localStorage.setItem('token', token);
      window.dispatchEvent(new Event('storage'));
      message.success('เข้าสู่ระบบสำเร็จ');
      navigate('/admin');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'เข้าสู่ระบบล้มเหลว';
      message.error(errorMessage);
      console.error('Login error:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-[#1f1f1f] rounded-xl shadow-2xl p-8 border border-[#896253]">
        <h1 className="text-3xl font-bold uppercase text-center mb-6 tracking-wide" style={{ color: '#CD9969' }}>
          Admin Login
        </h1>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="username"
            label={<span className="text-gray-400 font-semibold uppercase tracking-wider">ชื่อผู้ใช้</span>}
            rules={[{ required: true, message: 'กรุณากรอกชื่อผู้ใช้' }]}
          >
            <Input
              placeholder="กรอกชื่อผู้ใช้"
              className="rounded-lg border border-[#896253] bg-[#2a2a2a] text-[#CD9969] focus:ring-2 focus:ring-[#CD9969] focus:border-[#CD9969] placeholder-[#8a7d5a]"
            />
          </Form.Item>
          <Form.Item
            name="password"
            label={<span className="text-gray-400 font-semibold uppercase tracking-wider">รหัสผ่าน</span>}
            rules={[{ required: true, message: 'กรุณากรอกรหัสผ่าน' }]}
          >
            <Input.Password
              placeholder="กรอกรหัสผ่าน"
              className="rounded-lg border border-[#896253] bg-[#2a2a2a] text-[#CD9969] focus:ring-2 focus:ring-[#CD9969] focus:border-[#CD9969] placeholder-[#8a7d5a]"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full rounded-lg bg-gradient-to-r from-[#CD9969] to-[#896253] text-black font-bold uppercase tracking-wide shadow-lg hover:from-[#b3894f] hover:to-[#735a42] transition-all duration-300 h-14"
            >
              เข้าสู่ระบบ
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default LoginPage;