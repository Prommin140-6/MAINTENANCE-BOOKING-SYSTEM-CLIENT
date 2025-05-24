import React from 'react';
import { Modal, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import logo from './ถึงแก่นLOGO.png';

const ConfirmationModal = ({ open, onClose, details }) => {
  const navigate = useNavigate();

  const getStatusTextAndColor = (status) => {
    switch (status) {
      case 'pending':
        return { text: 'รอการติดต่อกลับจากแอดมิน', color: 'text-red-500 !important' };
      case 'accepted':
        return { text: 'ได้รับการจองคิวแล้ว', color: 'text-green-500 !important' };
      case 'rejected':
        return { text: 'ยกเลิก', color: 'text-gray-400 !important' };
      default:
        return { text: status, color: 'text-gray-400 !important' };
    }
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    return date.toLocaleDateString('th-TH', {
      weekday: 'long', // แสดงชื่อวัน เช่น วันอาทิตย์
      day: 'numeric',  // แสดงวันที่ เช่น 25
      month: 'long',   // แสดงชื่อเดือน เช่น พฤษภาคม
      year: 'numeric', // แสดงปี เช่น 2025
    });
  };

  const { text: statusText, color: statusColor } = getStatusTextAndColor(details?.status);
  const formattedDate = formatDate(details?.preferredDate);

  const handleReturnToHome = () => {
    onClose();
    navigate('/');
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      className="confirmation-modal"
      centered
    >
      <div className="flex flex-col items-center">
        <img src={logo} alt="Maintenance logo" className="w-24 h-auto mb-3" />
        <h2 className="text-xl font-bold uppercase mb-3 tracking-wide">ข้อมูลคำขอ</h2>
        {details && (
          <div className="w-full">
            <div className="maintenance-details">
              <p><span className="font-semibold">ชื่อ:</span> {details.name}</p>
              <p><span className="font-semibold">เบอร์โทร:</span> {details.phone}</p>
              <p><span className="font-semibold">รุ่นรถ:</span> {details.carModel}</p>
              <p><span className="font-semibold">หมายเลขทะเบียน:</span> {details.licensePlate}</p>
              <p><span className="font-semibold">วันที่สะดวก:</span> {formattedDate}</p>
              <p>
                <span className="font-semibold">สถานะ:</span>{' '}
                <span className={`font-semibold ${statusColor}`}>{statusText}</span>
              </p>
            </div>
            <div className="screenshot-notice flex items-center justify-center mt-3">
              <span className="mr-1">📸</span>
              <p>กรุณาแคปหน้าจอนี้เพื่อใช้เป็นหลักฐาน</p>
            </div>
            <div className="contact-info mt-3 text-center">
              <p>หากมีปัญหา กรุณาติดต่อที่:</p>
              <p>
                โทร: <a href="tel:0826595365" className="underline">082-659-5365</a> ,{' '}
                <a href="tel:0636869999" className="underline">063-686-9999</a>
              </p>
              <p>
                LINE: <a href="https://line.me/R/ti/p/@259xpcyb" target="_blank" rel="noopener noreferrer" className="underline">@thuengkaen_th</a>
              </p>
            </div>
          </div>
        )}
        <Button
          onClick={handleReturnToHome}
          className="mt-4 rounded-lg bg-gradient-to-r from-[#CD9969] to-[#896253] text-black font-bold uppercase tracking-wide shadow-lg hover:from-[#b3894f] hover:to-[#735a42] transition-all duration-300 h-10 w-full"
        >
          กลับสู่หน้าหลัก
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;