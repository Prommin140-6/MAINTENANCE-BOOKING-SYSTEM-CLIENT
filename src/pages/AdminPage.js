import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Col, Input, Row, Statistic, Table, Tag, Tooltip, Space, Modal, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined, ExclamationCircleOutlined, SearchOutlined, HomeOutlined, EditOutlined } from '@ant-design/icons';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const { confirm } = Modal;

const AdminPage = () => {
  const [requests, setRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [summary, setSummary] = useState({});
  const [searchText, setSearchText] = useState('');
  const [filterDate, setFilterDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditDateModalVisible, setIsEditDateModalVisible] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [newPreferredDate, setNewPreferredDate] = useState(null);
  const navigate = useNavigate();

  const formatDateToLocal = (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const filterRequests = (search, date, initialRequests = requests) => {
    let filtered = [...initialRequests];
    if (search) {
      filtered = filtered.filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.phone.includes(search) ||
        r.carModel.toLowerCase().includes(search.toLowerCase()) ||
        r.licensePlate.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (date) {
      const filterDateStr = formatDateToLocal(date);
      filtered = filtered.filter((r) => formatDateToLocal(r.preferredDate) === filterDateStr);
    }
    setPendingRequests(filtered.filter((r) => r.status === 'pending'));
    setAcceptedRequests(filtered.filter((r) => r.status === 'accepted'));
  };

  const fetchRequests = async () => {
    const token = localStorage.getItem('token');
    try {
      const requestsRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/maintenance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allRequests = requestsRes.data;
      setRequests(allRequests);
      filterRequests(searchText, filterDate, allRequests);
      return allRequests;
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
        const requestsRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/maintenance`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const summaryRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/maintenance/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const allRequests = requestsRes.data;
        setRequests(allRequests);
        filterRequests(searchText, filterDate, allRequests);
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
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/api/maintenance/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchRequests();
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
      title: 'คุณแน่ใจที่จะลบคำขอนี้หรือไม่?',
      icon: <ExclamationCircleOutlined />,
      okText: 'ลบ',
      okType: 'danger',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`${process.env.REACT_APP_API_URL}/api/maintenance/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          await fetchRequests();
          message.success('ลบคำขอเรียบร้อย');
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message;
          message.error(`ไม่สามารถลบคำขอได้: ${errorMessage}`);
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
            message.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
            navigate('/admin/login');
          }
          console.error('Error deleting request:', error.response?.data || error.message);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleEditDate = async () => {
    if (!newPreferredDate) {
      message.error('กรุณาเลือกวันที่ใหม่');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/api/maintenance/${selectedRequestId}`,
        { preferredDate: newPreferredDate.toISOString().slice(0, 10) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchRequests();
      message.success('แก้ไขวันที่สะดวกเรียบร้อย');
      setIsEditDateModalVisible(false);
      setNewPreferredDate(null);
      setSelectedRequestId(null);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      message.error(`ไม่สามารถแก้ไขวันที่ได้: ${errorMessage}`);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        message.error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        navigate('/admin/login');
      }
      console.error('Error updating date:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditDateModal = (record) => {
    setSelectedRequestId(record._id);
    setNewPreferredDate(new Date(record.preferredDate));
    setIsEditDateModalVisible(true);
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchText(value);
    filterRequests(value, filterDate);
  };

  const handleDateFilter = (date) => {
    setFilterDate(date);
    filterRequests(searchText, date);
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
      title: 'วันที่สะดวก',
      dataIndex: 'preferredDate',
      key: 'preferredDate',
      width: 120,
      render: (text) => formatDateToLocal(text),
      sorter: (a, b) => new Date(a.preferredDate) - new Date(b.preferredDate),
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
      width: 200,
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Tooltip title="ยืนยันคำขอ">
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleStatusUpdate(record._id, 'accepted')}
                  loading={loading}
                >
                  ยืนยัน
                </Button>
              </Tooltip>
              <Tooltip title="ปฏิเสธคำขอ">
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
              <Tooltip title="แก้ไขวันที่">
                <Button
                  type="default"
                  icon={<EditOutlined />}
                  onClick={() => openEditDateModal(record)}
                  loading={loading}
                >
                  แก้ไขวันที่
                </Button>
              </Tooltip>
              <Tooltip title="ลบคำขอ">
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(record._id)}
                  loading={loading}
                >
                  ลบ
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
              icon={<HomeOutlined />}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
            >
              ไปหน้าส่งคำขอ
            </Button>
          </Link>
        </Col>
      </Row>

      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={8}>
          <Card hoverable bordered={false} className="rounded-lg shadow-lg">
            <Statistic
              title="คำขอวันนี้"
              value={summary.todayRequests || 0}
              valueStyle={{ color: '#3f8600', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable bordered={false} className="rounded-lg shadow-lg">
            <Statistic
              title="รอดำเนินการ"
              value={summary.pendingRequests || 0}
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
            className="w-full"
          />
        </Col>
        <Col xs={24} sm={8}>
          <DatePicker
            selected={filterDate}
            onChange={handleDateFilter}
            dateFormat="yyyy-MM-dd"
            placeholderText="กรองวันที่สะดวก"
            className="w-full rounded-lg border border-gray-300 p-2 date-picker"
            isClearable
            popperClassName="date-picker-popper"
          />
        </Col>
      </Row>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-3 text-gray-700">รายการรอดำเนินการ</h2>
        <Table
          columns={columns}
          dataSource={pendingRequests}
          rowKey="_id"
          pagination={{ pageSize: 5 }}
          loading={loading}
          scroll={{ x: 900 }}
          bordered
          size="middle"
          className="mb-10"
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3 text-gray-700">รายการยืนยันแล้ว</h2>
        <Table
          columns={columns}
          dataSource={acceptedRequests}
          rowKey="_id"
          pagination={{ pageSize: 5 }}
          loading={loading}
          scroll={{ x: 900 }}
          bordered
          size="middle"
        />
      </div>

      <Modal
        title="แก้ไขวันที่สะดวก"
        visible={isEditDateModalVisible}
        onOk={handleEditDate}
        onCancel={() => {
          setIsEditDateModalVisible(false);
          setNewPreferredDate(null);
          setSelectedRequestId(null);
        }}
        okText="บันทึก"
        cancelText="ยกเลิก"
        centered
      >
        <DatePicker
          selected={newPreferredDate}
          onChange={(date) => setNewPreferredDate(date)}
          dateFormat="yyyy-MM-dd"
          minDate={new Date()}
          placeholderText="เลือกวันที่ใหม่"
          className="w-full rounded-lg border border-gray-300 p-2"
        />
      </Modal>

      <style jsx>{`
        .date-picker {
          z-index: 1000 !important;
          position: relative;
        }
        .date-picker-popper {
          z-index: 1001 !important;
        }
        .ant-table-wrapper {
          position: relative;
          z-index: 1;
        }
      `}</style>
    </div>
  );
};

export default AdminPage;