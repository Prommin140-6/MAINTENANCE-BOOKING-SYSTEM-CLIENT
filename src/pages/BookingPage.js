import React, { useState, useEffect } from 'react';
import { Button, Form, Input, message, Modal } from 'antd';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { LeftOutlined, RightOutlined, CameraOutlined } from '@ant-design/icons';
import Swal from 'sweetalert2';
import logo from './ถึงแก่นLOGO.png';
import './BookingPage.css';

const BookingPage = () => {
  const [form] = Form.useForm();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);
  const [timeError, setTimeError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateOffset, setDateOffset] = useState(0);
  const [timeOffset, setTimeOffset] = useState(0);
  const [bookedTimes, setBookedTimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);

  const today = new Date();
  const datesPerPage = 5;
  const timesPerPage = 5;

  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i + dateOffset);
    return date;
  });

  const availableTimes = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

  const fetchBookedTimes = async (date) => {
    try {
      const dateStr = date.toISOString().slice(0, 10);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/bookings/booked-times?date=${dateStr}`);
      setBookedTimes(response.data.bookedTimes || []);
    } catch (error) {
      console.error('Failed to load booked times:', error.response?.data || error.message);
      message.error('ไม่สามารถดึงข้อมูลเวลาที่จองแล้วได้');
      setBookedTimes([]);
    }
  };

  useEffect(() => {
    fetchBookedTimes(selectedDate);
  }, [selectedDate]);

  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const onFinish = async (values) => {
    if (!selectedDate || !selectedTime) {
      message.error('กรุณาเลือกวันที่และเวลา');
      return;
    }

    if (bookedTimes.includes(selectedTime)) {
      setTimeError('เวลานี้เต็มแล้ว กรุณาเลือกเวลาอื่น');
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        ...values,
        date: selectedDate.toISOString().slice(0, 10),
        time: selectedTime,
      };
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/bookings`, bookingData);
      setBookingDetails({
        ...bookingData,
        status: 'รอการยืนยันจากแอดมิน',
      });
      await Swal.fire({
        icon: 'success',
        title: 'จองคิวเรียบร้อยแล้ว',
        text: 'กรุณารอการติดต่อกลับจากทางร้าน',
        confirmButtonColor: '#CD9969',
      });
      setIsConfirmationModalVisible(true);
      form.resetFields();
      setSelectedDate(new Date());
      setSelectedTime(null);
      setTimeError('');
      setShowDatePicker(false);
      setDateOffset(0);
      setTimeOffset(0);
      await fetchBookedTimes(new Date());
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      if (errorMessage === 'เวลา\nเต็ม') {
        setTimeError('เวลานี้เต็มแล้ว');
      } else {
        message.error(`การจองล้มเหลว: ${errorMessage}`);
      }
      console.error('Error creating booking:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    if (date) {
      setSelectedDate(date);
      setShowDatePicker(false);

      const diffDays = Math.floor((date - today) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        setDateOffset(0);
      } else {
        const newOffset = Math.floor(diffDays / datesPerPage) * datesPerPage;
        setDateOffset(newOffset);
      }
      setSelectedTime(null);
      setTimeError('');
      fetchBookedTimes(date);
    }
  };

  const handleTimeChange = (time) => {
    if (!bookedTimes.includes(time)) {
      setSelectedTime(time);
      setTimeError('');
    } else {
      setTimeError('เวลานี้เต็มแล้ว กรุณาเลือกเวลาอื่น');
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

  const handlePrevTimes = () => {
    if (timeOffset > 0) {
      setTimeOffset(timeOffset - timesPerPage);
    }
  };

  const handleNextTimes = () => {
    const maxOffset = Math.max(0, availableTimes.length - timesPerPage);
    if (timeOffset < maxOffset) {
      setTimeOffset(timeOffset + timesPerPage);
    }
  };

  const visibleTimes = availableTimes.slice(timeOffset, timeOffset + timesPerPage);

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

  const handleModalClose = () => {
    setIsConfirmationModalVisible(false);
    setBookingDetails(null);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-[#1f1f1f] rounded-xl shadow-2xl p-8 border border-[#896253]">
        <h1 className="text-3xl font-bold uppercase text-center mb-6 tracking-wide" style={{ color: '#CD9969' }}>
          นัดหมายล้างรถ
        </h1>
        <div className="flex justify-center mb-6">
          <img
            src={logo}
            alt="ถึงแก่น logo"
            className="w-48 h-auto"
            style={{ maxWidth: '100%' }}
          />
        </div>
        <Form form={form} onFinish={onFinish} layout="vertical">
          <div className="mb-6">
            <label className="text-gray-400 font-semibold block mb-2 uppercase tracking-wider">วันที่</label>
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
                  return (
                    <Button
                      key={date.toISOString()}
                      onClick={() => handleDateChange(date)}
                      className={`rounded-lg w-16 h-20 flex flex-col items-center justify-center transition-all duration-300 ${
                        isSelected
                          ? 'bg-gradient-to-br from-[#CD9969] to-[#896253] text-black ring-2 ring-[#CD9969] shadow-lg'
                          : 'bg-[#443833] hover:bg-[#5c4739] text-[#CD9969]'
                      }`}
                    >
                      <span className="text-xs font-bold uppercase">{dayOfWeek}</span>
                      <span className="text-lg font-extrabold">{dayMonth.split(' ')[0]}</span>
                      <span className="text-xs uppercase">{dayMonth.split(' ')[1]}</span>
                    </Button>
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

          <div className="mb-6">
            <label className="text-gray-400 font-semibold block mb-2 uppercase tracking-wider">เวลา</label>
            <div className="flex items-center bg-[#2a2a2a] rounded-xl p-3 shadow-[0_8px_16px_rgba(0,0,0,0.4)]">
              <Button
                icon={<LeftOutlined />}
                onClick={handlePrevTimes}
                disabled={timeOffset === 0}
                className="rounded-full bg-[#443833] hover:bg-[#5c4739] text-white w-10 h-10 flex items-center justify-center transition-all duration-300"
              />
              <div className="flex space-x-4 overflow-x-auto mx-2 flex-1">
                {visibleTimes.map((time) => {
                  const isBooked = bookedTimes.includes(time);
                  return (
                    <div key={time} className="flex flex-col items-center">
                      <Button
                        type={selectedTime === time ? 'primary' : 'default'}
                        onClick={() => handleTimeChange(time)}
                        disabled={isBooked}
                        style={isBooked ? { backgroundColor: '#9CA3AF', color: '#FFFFFF', cursor: 'not-allowed' } : {}}
                        className={`rounded-full px-6 py-2 shadow-lg transition-all duration-300 ${
                          selectedTime === time
                            ? 'bg-gradient-to-br from-[#CD9969] to-[#896253] text-black ring-2 ring-[#896253]'
                            : 'bg-[#443833] hover:bg-[#5c4739] text-[#CD9969]'
                        }`}
                      >
                        <span className="font-bold uppercase tracking-wide">{time}</span>
                      </Button>
                      {isBooked && <span className="text-gray-400 text-xs mt-1">เต็ม</span>}
                    </div>
                  );
                })}
              </div>
              <Button
                icon={<RightOutlined />}
                onClick={handleNextTimes}
                disabled={timeOffset + timesPerPage >= availableTimes.length}
                className="rounded-full bg-[#443833] hover:bg-[#5c4739] text-white w-10 h-10 flex items-center justify-center transition-all duration-300"
              />
            </div>
            {timeError && (
              <p className="mt-2 text-red-400 whitespace-pre-line text-sm font-medium">{timeError}</p>
            )}
          </div>

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
              placeholder="กรอกเบอร์โทร (เช่น 0826595365)"
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
              จองคิว
            </Button>
          </Form.Item>
        </Form>

        <Modal
          visible={isConfirmationModalVisible}
          onCancel={handleModalClose}
          footer={null}
          className="confirmation-modal"
          centered
        >
          <div className="flex flex-col items-center">
            <img src={logo} alt="ถึงแก่น logo" className="w-24 h-auto mb-3" />
            <h2 className="text-xl font-bold uppercase mb-3 tracking-wide">การจองคิวสำเร็จ!</h2>
            {bookingDetails && (
              <div className="w-full">
                <div className="booking-details">
                  <p><span className="font-semibold">ชื่อ:</span> {bookingDetails.name}</p>
                  <p><span className="font-semibold">เบอร์โทร:</span> {bookingDetails.phone}</p>
                  <p><span className="font-semibold">รุ่นรถ:</span> {bookingDetails.carModel}</p>
                  <p><span className="font-semibold">หมายเลขทะเบียน:</span> {bookingDetails.licensePlate}</p>
                  <p><span className="font-semibold">วันที่จอง:</span> {bookingDetails.date}</p>
                  <p><span className="font-semibold">เวลา:</span> {bookingDetails.time}</p>
                  <p><span className="font-semibold">สถานะ:</span> {bookingDetails.status}</p>
                </div>
                <div className="screenshot-notice flex items-center justify-center mt-3">
                  <CameraOutlined className="mr-1" />
                  <p>กรุณาแคปหน้าจอนี้เพื่อใช้เป็นหลักฐาน</p>
                </div>
                <div className="contact-info mt-3 text-center">
                  <p>หากมีปัญหา กรุณาติดต่อที่:</p>
                  <p>
                    โทร: <a href="tel:0826595365" className="underline">082-659-5365</a> , <a href="tel:0636869999" className="underline">063-686-9999</a>
                  </p>
                  <p>LINE: <a href="https://line.me/R/ti/p/@259xpcyb?ts=01311345&oat_content=url" target="_blank" rel="noopener noreferrer" className="underline">@thuengkaen_th</a></p>
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

export default BookingPage;