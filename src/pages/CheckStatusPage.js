import React, { useState } from 'react';
import { Button, Form, Input, message } from 'antd';
import axios from 'axios';
import logo from './ถึงแก่นLOGO.png';
import './MaintenancePage.css'; // ใช้ CSS เดียวกับ MaintenancePage.js
import ConfirmationModal from './ConfirmationModal';

const CheckStatusPage = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [requestDetails, setRequestDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    setNotFound(false);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/maintenance/check-status`, {
        phone: values.phone,
      });
      if (response.data && response.data.length > 0) {
        const latestRequest = response.data[0]; // เลือกคำขอที่ใหม่ที่สุด
        setRequestDetails({
          name: latestRequest.name,
          phone: latestRequest.phone,
          carModel: latestRequest.carModel,
          licensePlate: latestRequest.licensePlate,
          preferredDate: latestRequest.preferredDate,
          status: latestRequest.status,
        });
        setIsModalVisible(true);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการตรวจสอบสถานะ');
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setRequestDetails(null);
  };

  const validatePhoneNumber = (_, value) => {
    if (!value) {
      return Promise.reject(new Error('กรุณากรอกเบอร์โทร'));
    }
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(value)) {
      return Promise.reject(new Error('เบอร์โทรต้องมี 10 หลัก เริ่มต้นด้วย 0 และเป็นตัวเลขเท่านั้น'));
    }
    return Promise.resolve();
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-[#1f1f1f] rounded-xl shadow-2xl p-8 border border-[#896253]">
        <h1 className="text-3xl font-bold uppercase text-center mb-6 tracking-wide" style={{ color: '#CD9969' }}>
          ตรวจสอบสถานะคำขอ
        </h1>
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Maintenance logo" className="w-48 h-auto" style={{ maxWidth: '100%' }} />
        </div>

        <Form form={form} onFinish={onFinish} layout="vertical">
          <Form.Item
            name="phone"
            label={<span className="text-gray-400 font-semibold uppercase tracking-wider">เบอร์โทร</span>}
            rules={[{ required: true, message: 'กรุณากรอกเบอร์โทร' }, { validator: validatePhoneNumber }]}
          >
            <Input
              placeholder="กรอกเบอร์โทร (เช่น 0812345678)"
              className="rounded-lg border border-[#896253] bg-[#2a2a2a] text-[#CD9969] focus:ring-2 focus:ring-[#CD9969] focus:border-[#CD9969] placeholder-[#8a7d5a]"
              maxLength={10}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full rounded-lg bg-gradient-to-r from-[#CD9969] to-[#896253] text-black font-bold uppercase tracking-wide shadow-lg hover:from-[#b3894f] hover:to-[#735a42] transition-all duration-300 h-14"
            >
              ตรวจสอบสถานะ
            </Button>
          </Form.Item>
        </Form>

        {notFound && (
          <div className="mt-4 text-center">
            <p className="text-red-500 font-semibold">ไม่พบคำขอ กรุณาติดต่อแอดมิน</p>
            <div className="contact-info mt-2 text-[#CD9969]">
              <p>หากมีปัญหา กรุณาติดต่อที่:</p>
              <p>
                โทร: <a href="tel:0826595365" className="underline">082-659-5365</a> ,{' '}
                     <a href="tel:0636869999" className="underline">063-686-9999</a>
              </p>
              <p>
                LINE: <a href="https://line.me/R/ti/p/@259xpcyb" target="_blank" rel="noopener noreferrer" className="underline">@thuengkaen_th</a>
              </p>
            </div>
            <Button
              href="/maintenance" // ลิงก์ไปยังหน้า MaintenancePage.js
              className="mt-4 rounded-lg bg-[#443833] hover:bg-[#5c4739] text-[#CD9969] border border-[#896253] px-4 py-2 text-sm font-semibold uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-300"
            >
              กลับไปจองใหม่
            </Button>
          </div>
        )}

        <ConfirmationModal
          open={isModalVisible}
          onClose={handleModalClose}
          details={requestDetails}
        />
      </div>
    </div>
  );
};

export default CheckStatusPage;