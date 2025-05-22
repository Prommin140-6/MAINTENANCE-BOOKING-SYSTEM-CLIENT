import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Col, Input, Row, Statistic, Table, Tag, Tooltip, Space, Modal, message, Select } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined, ExclamationCircleOutlined, SearchOutlined, CalendarOutlined, HomeOutlined, ClockCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './AdminPage.css';

const { confirm } = Modal;
const { Option } = Select;

const AdminPage = () => {
  const [bookings, setBookings] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [acceptedBookings, setAcceptedBookings] = useState([]);
  const [summary, setSummary] = useState({});
  const [searchText, setSearchText] = useState('');
  const [filterDate, setFilterDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRescheduleModalVisible, setIsRescheduleModalVisible] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [newDate, setNewDate] = useState(new Date());
  const [newTime, setNewTime] = useState('');
  const navigate = useNavigate();

  // ช่องเวลาที่กำหนดไว้
  const timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

  const formatDateToLocal = (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getAvailableTimeSlots = (selectedDate, currentBookingId) => {
    const selectedDateStr = formatDateToLocal(selectedDate);
    // กรองการจองในวันที่เลือก (ยกเว้นการจองที่กำลังแก้ไข)
    const bookingsOnDate = bookings.filter(
      (b) => formatDateToLocal(b.date) === selectedDateStr && b._id !== currentBookingId && b.status === 'accepted'
    );
    const bookedTimes = bookingsOnDate.map((b) => b.time);
    // คืนค่ารายการเวลาทั้งหมดพร้อมสถานะว่าง/ไม่ว่าง
    return timeSlots.map((time) => ({
      time,
      available: !bookedTimes.includes(time),
    }));
  };

  const filterBookings = (search, date, initialBookings = bookings) => {
    let filtered = [...initialBookings];
    if (search) {
      filtered = filtered.filter((b) =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.phone.includes(search) ||
        b.carModel.toLowerCase().includes(search.toLowerCase()) ||
        b.licensePlate.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (date) {
      const filterDateStr = formatDateToLocal(date);
      filtered = filtered.filter((b) => {
        let bookingDate = new Date(b.date);
        if (isNaN(bookingDate.getTime())) {
          bookingDate = new Date(b.date.split('T')[0]);
        }
        return formatDateToLocal(bookingDate) === filterDateStr;
      });
    }
    setPendingBookings(filtered.filter((b) => b.status === 'pending'));
    setAcceptedBookings(filtered.filter((b) => b.status === 'accepted'));
  };

  const fetchBookings = async () => {
    const token = localStorage.getItem('token');
    try {
      const bookingsRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allBookings = bookingsRes.data;
      setBookings(allBookings);
      filterBookings(searchText, filterDate, allBookings);
      return allBookings;
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.error('กรุณาเข้าสู่ระบบ');
      navigate('/admin/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const bookingsRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const summaryRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/bookings/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const allBookings = bookingsRes.data;
        setBookings(allBookings);
        filterBookings(searchText, filterDate, allBookings);
        setSummary(summaryRes.data);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          message.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
          navigate('/admin/login');
        } else {
          message.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
          console.error('API error:', error.response?.data || error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, searchText, filterDate]);

  const handleStatusUpdate = async (id, status) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${process.env.REACT_APP_API_URL}/api/bookings/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchBookings();
      message.success(`เปลี่ยนสถานะเป็น '${status}' เรียบร้อย`);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      message.error(`ไม่สามารถเปลี่ยนสถานะเป็น '${status}' ได้: ${errorMessage}`);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        message.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        navigate('/admin/login');
      }
      console.error('Error updating status:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    confirm({
      title: 'คุณแน่ใจที่จะลบการจองนี้หรือไม่?',
      icon: <ExclamationCircleOutlined />,
      okText: 'ลบ',
      okType: 'danger',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`${process.env.REACT_APP_API_URL}/api/bookings/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          await fetchBookings();
          message.success('ลบการจองเรียบร้อย');
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message;
          message.error(`ไม่สามารถลบการจองได้: ${errorMessage}`);
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
            message.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
            navigate('/admin/login');
          }
          console.error('Error deleting booking:', error.response?.data || error.message);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleReschedule = async () => {
    if (!newDate || !newTime) {
      message.error('กรุณาเลือกวันที่และเวลาใหม่');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formattedDate = formatDateToLocal(newDate);
      const response = await axios.patch(
        `${process.env.REACT_APP_API_URL}/api/bookings/${selectedBookingId}`,
        { date: formattedDate, time: newTime, status: 'accepted' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data && response.data.booking) {
        await fetchBookings();
        message.success('เลื่อนเวลาการจองเรียบร้อย');
        setIsRescheduleModalVisible(false);
        setNewDate(new Date());
        setNewTime('');
        setSelectedBookingId(null);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      message.error(`ไม่สามารถเลื่อนเวลาการจองได้: ${errorMessage}`);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        message.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        navigate('/admin/login');
      }
      console.error('Error rescheduling booking:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const showRescheduleModal = (id) => {
    setSelectedBookingId(id);
    setNewTime('');
    setIsRescheduleModalVisible(true);
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchText(value);
    filterBookings(value, filterDate);
  };

  const handleDateFilter = (date) => {
    setFilterDate(date);
    filterBookings(searchText, date);
  };

  const columns = [
    {
      title: 'ชื่อ',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      width: 150,
    },
    {
      title: 'เบอร์โทร',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
    },
    {
      title: 'รุ่นรถ',
      dataIndex: 'carModel',
      key: 'carModel',
      width: 150,
    },
    {
      title: 'ทะเบียนรถ',
      dataIndex: 'licensePlate',
      key: 'licensePlate',
      width: 120,
      render: (text) => <Tag color="blue">{text.toUpperCase()}</Tag>,
    },
    {
      title: 'วันที่จอง',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (text) => formatDateToLocal(text),
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: 'เวลา',
      dataIndex: 'time',
      key: 'time',
      width: 100,
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        let color = 'default';
        let icon = null;
        switch (status) {
          case 'pending':
            color = 'orange';
            icon = <ExclamationCircleOutlined />;
            break;
          case 'accepted':
            color = 'green';
            icon = <CheckCircleOutlined />;
            break;
          case 'rejected':
            color = 'red';
            icon = <CloseCircleOutlined />;
            break;
          default:
            color = 'default';
        }
        return <Tag icon={icon} color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'จัดการ',
      key: 'action',
      fixed: 'right',
      width: 250,
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Tooltip title="ยืนยันการจอง">
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleStatusUpdate(record._id, 'accepted')}
                  loading={loading}
                >
                  ยืนยันการจอง
                </Button>
              </Tooltip>
              <Tooltip title="ปฏิเสธการจอง">
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleStatusUpdate(record._id, 'rejected')}
                  loading={loading}
                >
                  ปฏิเสธ
                </Button>
              </Tooltip>
            </>
          )}
          {record.status === 'accepted' && (
            <>
              <Tooltip title="เลื่อนเวลา">
                <Button
                  type="default"
                  icon={<ClockCircleOutlined />}
                  onClick={() => showRescheduleModal(record._id)}
                  loading={loading}
                >
                  เลื่อนการจอง
                </Button>
              </Tooltip>
              <Tooltip title="ลบการจอง">
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(record._id)}
                  loading={loading}
                >
                  ยกเลิกนัด
                </Button>
              </Tooltip>
            </>
          )}
          {record.status === 'rejected' && <Tag color="red">Rejected</Tag>}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white rounded-lg shadow-md">
      <Row justify="space-between" align="middle" className="mb-6">
        <Col>
          <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-2">
            <HomeOutlined /> Admin Dashboard
          </h1>
        </Col>
        <Col>
          <Link to="/">
            <Button
              type="default"
              icon={<CalendarOutlined />}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
            >
              ไปหน้าจองคิว
            </Button>
          </Link>
        </Col>
      </Row>

      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={8}>
          <Card hoverable bordered={false} className="rounded-lg shadow-lg">
            <Statistic
              title="จองวันนี้"
              value={summary.todayBookings || 0}
              valueStyle={{ color: '#3f8600', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable bordered={false} className="rounded-lg shadow-lg">
            <Statistic
              title="รอดำเนินการ"
              value={summary.pendingBookings || 0}
              valueStyle={{ color: '#cf1322', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable bordered={false} className="rounded-lg shadow-lg">
            <Statistic
              title="ยืนยันแล้ว"
              value={summary.statusBreakdown?.find((s) => s._id === 'accepted')?.count || 0}
              valueStyle={{ color: '#108ee9', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={12} className="mb-6" align="middle">
        <Col xs={24} sm={16}>
          <Input
            size="large"
            placeholder="ค้นหาชื่อ, เบอร์โทร, รุ่นรถ, ทะเบียน"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={handleSearch}
            allowClear
          />
        </Col>
        <Col xs={24} sm={8}>
          <DatePicker
            selected={filterDate}
            onChange={handleDateFilter}
            dateFormat="yyyy-MM-dd"
            placeholderText="กรองวันที่จอง"
            className="w-full rounded-lg border border-gray-300 p-2"
            isClearable
          />
        </Col>
      </Row>

      <div>
        <h2 className="text-xl font-semibold mb-3 text-gray-700">รายการรอดำเนินการ</h2>
        <Table
          columns={columns}
          dataSource={pendingBookings}
          rowKey="_id"
          pagination={{ pageSize: 5 }}
          loading={loading}
          scroll={{ x: 900 }}
          bordered
          size="middle"
        />
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-3 text-gray-700">รายการยืนยันแล้ว</h2>
        <Table
          columns={columns}
          dataSource={acceptedBookings}
          rowKey="_id"
          pagination={{ pageSize: 5 }}
          loading={loading}
          scroll={{ x: 900 }}
          bordered
          size="middle"
        />
      </div>

      <Modal
        title="เลื่อนเวลาการจอง"
        visible={isRescheduleModalVisible}
        onOk={handleReschedule}
        onCancel={() => {
          setIsRescheduleModalVisible(false);
          setNewDate(new Date());
          setNewTime('');
          setSelectedBookingId(null);
        }}
        okText="บันทึก"
        cancelText="ยกเลิก"
        confirmLoading={loading}
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block mb-1 font-semibold">วันที่ใหม่:</label>
            <DatePicker
              selected={newDate}
              onChange={(date) => {
                setNewDate(date);
                setNewTime('');
              }}
              dateFormat="yyyy-MM-dd"
              className="w-full rounded-lg border border-gray-300 p-2"
              minDate={new Date()}
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">เวลาใหม่:</label>
            <Select
              value={newTime}
              onChange={(value) => setNewTime(value)}
              placeholder="เลือกเวลา"
              className="w-full"
              disabled={!newDate}
            >
              {getAvailableTimeSlots(newDate, selectedBookingId).map(({ time, available }) => (
                <Option key={time} value={time} disabled={!available}>
                  {time} {available ? '' : '(ถูกจอง)'}
                </Option>
              ))}
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminPage;