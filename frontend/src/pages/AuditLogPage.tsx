import { useState } from 'react'
import { Typography, Card, Table, Row, Col, Select, DatePicker, Input, Space, Tag, Button } from 'antd'
import { SearchOutlined, FilterOutlined, DownloadOutlined } from '@ant-design/icons'
import { i18n, formatFullDate } from '../i18n/uz'
import dayjs from 'dayjs'

const { Title } = Typography
const { RangePicker } = DatePicker

export function AuditLogPage() {
  const [filters, setFilters] = useState({
    action: undefined,
    user: undefined,
    dateRange: undefined,
  })

  // Demo audit log data
  const auditLogs = [
    { id: '1', timestamp: '2024-06-15 14:32:15', user: 'admin@amis.uz', action: 'CREATE', table: 'patients', record_id: 'P001', ip_address: '192.168.1.1', details: 'Yangi bemor yaratildi' },
    { id: '2', timestamp: '2024-06-15 14:30:45', user: 'doctor@amis.uz', action: 'UPDATE', table: 'appointments', record_id: 'APT001', ip_address: '192.168.1.2', details: 'Qabul holati o\'zgartildi' },
    { id: '3', timestamp: '2024-06-15 14:28:12', user: 'cashier@amis.uz', action: 'PAYMENT', table: 'invoices', record_id: 'INV001', ip_address: '192.168.1.3', details: 'To\'lov amalga oshirildi' },
    { id: '4', timestamp: '2024-06-15 14:25:33', user: 'admin@amis.uz', action: 'DELETE', table: 'users', record_id: 'U005', ip_address: '192.168.1.1', details: 'Foydalanuvchi o\'chirildi' },
    { id: '5', timestamp: '2024-06-15 14:20:05', user: 'doctor@amis.uz', action: 'CREATE', table: 'diagnoses', record_id: 'D001', ip_address: '192.168.1.2', details: 'Tashxis qo\'shildi' },
    { id: '6', timestamp: '2024-06-15 14:15:22', user: 'nurse@amis.uz', action: 'UPDATE', table: 'vitals', record_id: 'V001', ip_address: '192.168.1.4', details: 'Vitals yangilandi' },
    { id: '7', timestamp: '2024-06-15 14:10:18', user: 'admin@amis.uz', action: 'LOGIN', table: 'sessions', record_id: 'S001', ip_address: '192.168.1.1', details: 'Tizimga kirildi' },
    { id: '8', timestamp: '2024-06-15 14:05:45', user: 'pharmacist@amis.uz', action: 'DISPENSE', table: 'prescriptions', record_id: 'PR001', ip_address: '192.168.1.5', details: 'Dori chiqarildi' },
  ]

  const actionColors: Record<string, string> = {
    CREATE: 'success',
    UPDATE: 'processing',
    DELETE: 'error',
    LOGIN: 'default',
    LOGOUT: 'default',
    PAYMENT: 'warning',
    DISPENSE: 'purple',
  }

  const actionLabels: Record<string, string> = {
    CREATE: 'Yaratildi',
    UPDATE: 'Yangilandi',
    DELETE: 'Ochirildi',
    LOGIN: 'Kirish',
    LOGOUT: 'Chiqish',
    PAYMENT: 'To\'lov',
    DISPENSE: 'Berildi',
  }

  const columns = [
    { title: 'Vaqt', dataIndex: 'timestamp', key: 'timestamp', width: 160 },
    { title: 'Foydalanuvchi', dataIndex: 'user', key: 'user' },
    {
      title: 'Amal',
      dataIndex: 'action',
      key: 'action',
      render: (a: string) => <Tag color={actionColors[a] || 'default'}>{actionLabels[a] || a}</Tag>,
    },
    { title: 'Jadval', dataIndex: 'table', key: 'table', render: (t: string) => <Tag>{t}</Tag> },
    { title: 'Yozuv ID', dataIndex: 'record_id', key: 'record_id', render: (id: string) => <Tag color="blue">{id}</Tag> },
    { title: 'Tafsilotlar', dataIndex: 'details', key: 'details' },
    { title: 'IP manzil', dataIndex: 'ip_address', key: 'ip_address' },
  ]

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>Audit Log</Title>
        </Col>
        <Col>
          <Space>
            <Button icon={<DownloadOutlined />}>Eksport</Button>
          </Space>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Select
              placeholder="Amal turi"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => setFilters({ ...filters, action: value })}
            >
              <Select.Option value="CREATE">Yaratildi</Select.Option>
              <Select.Option value="UPDATE">Yangilandi</Select.Option>
              <Select.Option value="DELETE">Ochirildi</Select.Option>
              <Select.Option value="LOGIN">Kirish</Select.Option>
              <Select.Option value="PAYMENT">To'lov</Select.Option>
            </Select>
          </Col>
          <Col span={6}>
            <Select
              placeholder="Foydalanuvchi"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => setFilters({ ...filters, user: value })}
            >
              <Select.Option value="admin@amis.uz">Admin</Select.Option>
              <Select.Option value="doctor@amis.uz">Shifokor</Select.Option>
              <Select.Option value="cashier@amis.uz">Kassir</Select.Option>
            </Select>
          </Col>
          <Col span={8}>
            <RangePicker style={{ width: '100%' }} />
          </Col>
          <Col span={4}>
            <Input placeholder="Qidiruv" prefix={<SearchOutlined />} />
          </Col>
        </Row>
      </Card>

      <Card>
        <Table columns={columns} dataSource={auditLogs} rowKey="id" pagination={{ pageSize: 20 }} />
      </Card>
    </div>
  )
}