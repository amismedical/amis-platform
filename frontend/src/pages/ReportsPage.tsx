import { useState } from 'react'
import { Typography, Card, Row, Col, Button, Select, DatePicker, Table, Space, Tag, Divider } from 'antd'
import { FilePdfOutlined, DownloadOutlined, PrinterOutlined, CalendarOutlined, DollarOutlined, TeamOutlined, ExperimentOutlined } from '@ant-design/icons'
import { i18n, formatDate } from '../i18n/uz'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

export function ReportsPage() {
  const [reportType, setReportType] = useState('daily')

  // Demo report templates
  const reportTemplates = [
    {
      id: 'daily',
      name: 'Kunlik hisobot',
      description: 'Bir kundagi barcha qabullar, tushumlar va statistika',
      icon: <CalendarOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
    },
    {
      id: 'monthly',
      name: 'Oylik hisobot',
      description: 'Bir oydagi to\'liq statistika va analitika',
      icon: <CalendarOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
    },
    {
      id: 'financial',
      name: 'Moliyaviy hisobot',
      description: 'Kassa, to\'lovlar, qarzdorlik va tushumlar',
      icon: <DollarOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
    },
    {
      id: 'patients',
      name: 'Bemorlar hisogoti',
      description: 'Yangi bemorlar, tashriflar va ro\'yxatlar',
      icon: <TeamOutlined style={{ fontSize: 32, color: '#faad14' }} />,
    },
    {
      id: 'doctor',
      name: 'Shifokorlar hisogoti',
      description: 'Shifokorlar samaradorligi va statistikasi',
      icon: <ExperimentOutlined style={{ fontSize: 32, color: '#f43f5e' }} />,
    },
    {
      id: 'lab',
      name: 'Laboratoriya hisogoti',
      description: 'Laboratoriya buyurtmalari va natijalari',
      icon: <ExperimentOutlined style={{ fontSize: 32, color: '#00d4aa' }} />,
    },
  ]

  // Demo generated reports
  const generatedReports = [
    { id: 'R001', name: 'Kunlik hisobot', date: '2024-06-15', type: 'daily', status: 'ready' },
    { id: 'R002', name: 'Moliyaviy hisobot', date: '2024-06-14', type: 'financial', status: 'ready' },
    { id: 'R003', name: 'Oylik hisobot', date: '2024-06-01', type: 'monthly', status: 'ready' },
    { id: 'R004', name: 'Kunlik hisobot', date: '2024-06-14', type: 'daily', status: 'ready' },
  ]

  const reportsColumns = [
    { title: 'Hisobot nomi', dataIndex: 'name', key: 'name' },
    { title: 'Sana', dataIndex: 'date', key: 'date', render: (d: string) => formatDate(d) },
    { title: 'Turi', dataIndex: 'type', key: 'type', render: (t: string) => <Tag>{t}</Tag> },
    { title: 'Holat', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'ready' ? 'success' : 'processing'}>{s}</Tag> },
    {
      title: 'Amal',
      key: 'action',
      render: () => (
        <Space>
          <Button size="small" type="primary" icon={<DownloadOutlined />}>Yuklab olish</Button>
          <Button size="small" icon={<PrinterOutlined />}>Chop etish</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>Hisobotlar</Title>
        </Col>
        <Col>
          <Space>
            <RangePicker />
            <Select placeholder="Filial" style={{ width: 150 }}>
              <Select.Option value="all">Barcha filiallar</Select.Option>
              <Select.Option value="main">Bosh filial</Select.Option>
            </Select>
          </Space>
        </Col>
      </Row>

      {/* Report Templates */}
      <Title level={4}>Hisobot yaratish</Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {reportTemplates.map((template) => (
          <Col span={8} key={template.id}>
            <Card
              hoverable
              style={{
                height: '100%',
                border: reportType === template.id ? '2px solid #00d4aa' : '1px solid #d9d9d9',
              }}
              onClick={() => setReportType(template.id)}
            >
              <Space direction="vertical" align="center" style={{ width: '100%', textAlign: 'center' }}>
                {template.icon}
                <Title level={5} style={{ margin: '12px 0 8px' }}>{template.name}</Title>
                <Text type="secondary">{template.description}</Text>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Divider />

      {/* Generate Report Button */}
      <Row justify="center" style={{ marginBottom: 32 }}>
        <Button type="primary" size="large" icon={<FilePdfOutlined />} style={{ padding: '0 40px', height: 48 }}>
          Hisobot yaratish (PDF)
        </Button>
      </Row>

      {/* Generated Reports */}
      <Title level={4}>Mavjud hisobotlar</Title>
      <Card>
        <Table columns={reportsColumns} dataSource={generatedReports} rowKey="id" pagination={false} />
      </Card>
    </div>
  )
}