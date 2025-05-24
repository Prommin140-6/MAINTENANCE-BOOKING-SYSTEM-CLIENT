import React, { useState, useEffect } from 'react';
import { Button, Form, Input, message, Modal } from 'antd';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import Swal from 'sweetalert2';
import logo from './ถึงแก่นLOGO.png';
import './MaintenancePage.css';

const MaintenancePage = () => {
  const [form] = Form.useForm();
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateOffset, setDateOffset] = useState(0);
  const [bookedDates, setBookedDates] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false);
  const [maintenanceDetails, setMaintenanceDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateLoading, setDateLoading] = useState(true);

  const today = new Date();
  const datesPerPage = 5;

  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i + dateOffset);
    return date;
  });

  const fetchBookedDates = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/maintenance/booked-dates`);
      console.log('Booked dates from server:', response.data.bookedDates);
      // ถ้าเป็น array ของ string (เช่น ["2025-05-22", "2025-05-23"])
      const bookedDatesArray = Array.isArray(response.data.bookedDates) ? response.data.bookedDates : [];
      setBookedDates(bookedDatesArray);
    } catch (error) {
      console.error('Failed to load booked dates:', error.response?.data || error.message);
      message.error('ไม่สามารถดึงข้อมูลวันที่ที่เต็มได้');
      setBookedDates([]);
    } finally {
      setDateLoading(false);
    }
  };

  useEffect(() => {
    fetchBookedDates();
  }, []);

  useEffect(() => {
    if (!dateLoading && !selectedDate) {
      const firstAvailableDate = availableDates.find(date => !isDateFull(date));
      if (firstAvailableDate) {
        setSelectedDate(firstAvailableDate);
      } else {
        const newOffset = dateOffset + datesPerPage;
        setDateOffset(newOffset);
      }
    }
  }, [bookedDates, dateLoading]);

  const isSameDay = (d1, d2) =>
    d1 && d2 && 
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const isDateFull = (date) => {
    const dateStr = date.toISOString().slice(0, 10);
    const isFull = bookedDates.includes(dateStr);
    console.log(`Checking if ${dateStr} is full:`, isFull);
    return isFull;
  };

  const handleDateChange = (date) => {
    if (date && !isDateFull(date)) {
      setSelectedDate(date);
      const diffDays = Math.floor((date - today) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        setDateOffset(0);
      } else {
        const newOffset = Math.floor(diffDays / datesPerPage) * datesPerPage;
        setDateOffset(newOffset);
      }
      setShowDatePicker(false);
    } else if (isDateFull(date)) {
      message.error('วันที่นี้เต็มแล้ว กรุณาเลือกวันอื่น');
    }
  };

  const formatDate = (date) => {
    const dayOfWeek = date.toLocaleDateString('th-TH', { weekday: 'short' }).charAt(0);
    const dayMonth = date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    return { dayOfWeek, dayMonth };
  };

  const handlePrevDates = () => {
    if (dateOffset > 0) {
      setDateOffset(dateOffset - datesPerPage);
    }
  };

  const handleNextDates = () => {
    setDateOffset(dateOffset + datesPerPage);
  };

  const onFinish = async (values) => {
    if (!selectedDate) {
      message.error('กรุณาเลือกวันที่สะดวก');
      return;
    }

    if (isDateFull(selectedDate)) {
      message.error('วันที่นี้เต็มแล้ว กรุณาเลือกวันอื่น');
      return;
    }

    setLoading(true);
    try {
      const maintenanceData = {
        ...values,
        preferredDate: selectedDate.toISOString().slice(0, 10),
        status: 'pending',
      };
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/maintenance`, maintenanceData);
      setMaintenanceDetails({
        ...maintenanceData,
        status: 'รอการยืนยันจากแอดมิน',
      });
      await Swal.fire({
        icon: 'success',
        title: 'ส่งคำขอ maintenance เรียบร้อย',
        text: 'กรุณารอการติดต่อกลับจากแอดมิน',
        confirmButtonColor: '#CD9969',
      });
      setIsConfirmationModalVisible(true);
      form.resetFields();
      setSelectedDate(null);
      setDateOffset(0);
      setShowDatePicker(false);
      await fetchBookedDates(); // อัปเดต bookedDates หลังจองสำเร็จ
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      message.error(`การส่งคำขอล้มเหลว: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setIsConfirmationModalVisible(false);
    setMaintenanceDetails(null);
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

  if (dateLoading) {
    return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">กำลังโหลด...</div>;
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-[#1f1f1f] rounded-xl shadow-2xl p-8 border border-[#896253]">
        <h1 className="text-3xl font-bold uppercase text-center mb-6 tracking-wide" style={{ color: '#CD9969' }}>
          นัดหมาย Maintenance
        </h1>
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Maintenance logo" className="w-48 h-auto" style={{ maxWidth: '100%' }} />
        </div>
        <div className="mb-6">
          <label className="text-gray-400 font-semibold block mb-2 uppercase tracking-wider">วันที่สะดวก</label>
          <div className="flex items-center bg-[#2a2a2a] rounded-xl p-3 shadow-[0_8px_16px_rgba(0,0,0,0.4)]">
            <Button
              icon={<LeftOutlined />}
              onClick={handlePrevDates}
              disabled={dateOffset === 0}
              className="rounded-full bg-[#443833] hover:bg-[#5c4739] text-white w-10 h-10 flex items-center justify-center transition-all duration-300"
            />
            <div className="flex space-x-2 overflow-x-auto mx-2 flex-1">
              {availableDates.map((date) => {
                const { dayOfWeek, dayMonth } = formatDate(date);
                const isSelected = isSameDay(selectedDate, date);
                const isFull = isDateFull(date);
                return (
                  <div key={date.toISOString()} className="flex flex-col items-center">
                    <Button
                      onClick={() => handleDateChange(date)}
                      disabled={isFull}
                      className={`rounded-lg w-16 h-20 flex flex-col items-center justify-center transition-all duration-300 date-button ${
                        isSelected ? 'selected-date' : isFull ? 'full-date' : 'available-date'
                      }`}
                    >
                      <span className="text-xs font-bold uppercase">{dayOfWeek}</span>
                      <span className="text-lg font-extrabold">{dayMonth.split(' ')[0]}</span>
                      <span className="text-xs uppercase">{dayMonth.split(' ')[1]}</span>
                    </Button>
                    {isFull && <span className="text-gray-400 text-xs mt-1">เต็ม</span>}
                  </div>
                );
              })}
            </div>
            <Button
              icon={<RightOutlined />}
              onClick={handleNextDates}
              className="rounded-full bg-[#443833] hover:bg-[#5c4739] text-white w-10 h-10 flex items-center justify-center transition-all duration-300"
            />
          </div>
          <div className="mt-4">
            <Button
              onClick={() => setShowDatePicker(true)}
              className="rounded-lg bg-[#443833] hover:bg-[#5c4739] text-[#CD9969] border border-[#896253] px-4 py-2 text-sm font-semibold uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-300"
            >
              เลือกวันที่อื่น
            </Button>
            {showDatePicker && (
              <DatePicker
                selected={selectedDate}
                onChange={handleDateChange}
                dateFormat="yyyy-MM-dd"
                className="w-full rounded-lg border border-[#896253] bg-[#2a2a2a] text-[#CD9969] p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CD9969] mt-2"
                minDate={new Date()}
                customInput={<input type="text" placeholder="เลือกวันที่" className="bg-[#2a2a2a] text-[#CD9969]" />}
                popperClassName="z-50 bg-[#2a2a2a] text-[#CD9969]"
                showPopperArrow={false}
                inline
              />
            )}
          </div>
        </div>

        <Form form={form} onFinish={onFinish} layout="vertical">
          <Form.Item
            name="name"
            label={<span className="text-gray-400 font-semibold uppercase tracking-wider">ชื่อ</span>}
            rules={[{ required: true, message: 'กรุณากรอกชื่อ' }]}
          >
            <Input
              placeholder="กรอกชื่อ"
              className="rounded-lg border border-[#896253] bg-[#2a2a2a] text-[#CD9969] focus:ring-2 focus:ring-[#CD9969] focus:border-[#CD9969] placeholder-[#8a7d5a]"
            />
          </Form.Item>

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

          <Form.Item
            name="carModel"
            label={<span className="text-gray-400 font-semibold uppercase tracking-wider">รุ่นรถ</span>}
            rules={[{ required: true, message: 'กรุณากรอกรุ่นรถ' }]}
          >
            <Input
              placeholder="กรอกรุ่นรถ"
              className="rounded-lg border border-[#896253] bg-[#2a2a2a] text-[#CD9969] focus:ring-2 focus:ring-[#CD9969] focus:border-[#CD9969] placeholder-[#8a7d5a]"
            />
          </Form.Item>

          <Form.Item
            name="licensePlate"
            label={<span className="text-gray-400 font-semibold uppercase tracking-wider">หมายเลขทะเบียน</span>}
            rules={[{ required: true, message: 'กรุณากรอกหมายเลขทะเบียน' }]}
          >
            <Input
              placeholder="กรอกหมายเลขทะเบียน"
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
              ส่งคำขอ
            </Button>
          </Form.Item>
        </Form>

        <Modal
          open={isConfirmationModalVisible} // เปลี่ยนจาก visible เป็น open
          onCancel={handleModalClose}
          footer={null}
          className="confirmation-modal"
          centered
        >
          <div className="flex flex-col items-center">
            <img src={logo} alt="Maintenance logo" className="w-24 h-auto mb-3" />
            <h2 className="text-xl font-bold uppercase mb-3 tracking-wide">ส่งคำขอสำเร็จ!</h2>
            {maintenanceDetails && (
              <div className="w-full">
                <div className="maintenance-details">
                  <p><span className="font-semibold">ชื่อ:</span> {maintenanceDetails.name}</p>
                  <p><span className="font-semibold">เบอร์โทร:</span> {maintenanceDetails.phone}</p>
                  <p><span className="font-semibold">รุ่นรถ:</span> {maintenanceDetails.carModel}</p>
                  <p><span className="font-semibold">หมายเลขทะเบียน:</span> {maintenanceDetails.licensePlate}</p>
                  <p><span className="font-semibold">วันที่สะดวก:</span> {maintenanceDetails.preferredDate}</p>
                  <p><span className="font-semibold">สถานะ:</span> {maintenanceDetails.status}</p>
                </div>
                <div className="screenshot-notice flex items-center justify-center mt-3">
                  <span className="mr-1">📸</span>
                  <p>กรุณาแคปหน้าจอนี้เพื่อใช้เป็นหลักฐาน</p>
                </div>
                <div className="contact-info mt-3 text-center">
                  <p>หากมีปัญหา กรุณาติดต่อที่:</p>
                  <p>
                    โทร: <a href="tel:0812345678" className="underline">081-234-5678</a>
                  </p>
                  <p>LINE: <a href="https://line.me/ti/p/@shopname" target="_blank" rel="noopener noreferrer" className="underline">@shopname</a></p>
                </div>
              </div>
            )}
            <Button
              onClick={handleModalClose}
              className="mt-4 rounded-lg bg-gradient-to-r from-[#CD9969] to-[#896253] text-black font-bold uppercase tracking-wide shadow-lg hover:from-[#b3894f] hover:to-[#735a42] transition-all duration-300 h-10 w-full"
            >
              กลับสู่หน้าหลัก
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default MaintenancePage;