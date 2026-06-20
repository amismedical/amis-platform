import { useState } from 'react'
import { Card, Table, Tag, Button, Space, Modal, Form, Select, Input, InputNumber, DatePicker, message, Row, Col, Statistic, Tabs, Steps, Descriptions, Divider, Typography } from 'antd'
import { PlusOutlined, ScanOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, EyeOutlined, PrinterOutlined, CameraOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { i18n, formatDate } from '../i18n/uz'

const { Title, Text } = Typography
const { TextArea } = Input

export function RadiologyPage() {
  const [activeTab, setActiveTab] = useState('orders')
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [resultModalOpen, setResultModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [form] = Form.useForm()
  const [resultForm] = Form.useForm()

  // Demo orders data
  const [orders, setOrders] = useState([
    { id: 'RAD001', patient: 'Rahimov Alisher', doctor: 'Karimova Nodira', type: 'X-Ray', area: 'Ko\'krak qafasi', status: 'pending', date: '2024-06-15', price: 150000 },
    { id: 'RAD002', patient: 'Tursunova Dilshoda', doctor: 'Ahmedov Botir', type: 'CT', area: 'Bosh miya', status: 'in_progress', date: '2024-06-15', price: 450000 },
    { id: 'RAD003', patient: 'Abdullayev Jasur', doctor: 'Mahmudova Gulshan', type: 'MRI', area: 'Bel umurg\'i', status: 'ready', date: '2024-06-14', price: 600000 },
    { id: 'RAD004', patient: 'Nazarova Sevara', doctor: 'Rasulov Sardor', type: 'Ultrasound', area: 'Qorin bo\'shlig\'i', status: 'ready', date: '2024-06-14', price: 200000 },
    { id: 'RAD005', patient: 'Saidov Bekmurod', doctor: 'Karimova Nodira', type: 'X-Ray', area: 'Qo\'l suyagi', status: 'pending', date: '2024-06-13', price: 120000 },
  ])

  // Demo results data
  const [results, setResults] = useState([
    { id: 'RES001', order_id: 'RAD003', type: 'MRI', findings: 'Bel umurg\'ida disk protruziyasi aniqlanmadi. Disklar holati yaxshi.', impression: 'Normal', date: '2024-06-14' },
    { id: 'RES002', order_id: 'RAD004', type: 'Ultrasound', findings: 'Jigar: o\'lchamlari normada, struktura diffuz gomogen. O\'t pufagi: devorlari qalinlashmagan.', impression: 'Normal', date: '2024-06-14' },
  ])

  const statusColors: Record<string, string> = {
    pending: 'default',
    in_progress: 'processing',
    ready: 'success',
    cancelled: 'error',
  }

  const statusLabels: Record<string, string> = {
    pending: 'Kutilmoqda',
    in_progress: 'Skanerlanmoqda',
    ready: 'Tayyor',
    cancelled: 'Bekor qilingan',
  }

  const typeIcons: Record<string, JSX.Element> = {
    'X-Ray': <ScanOutlined style={{ fontSize: 20, color: '#1890ff' }} />,
    'CT': <ScanOutlined style={{ fontSize: 20, color: '#722ed1' }} />,
    'MRI': <ScanOutlined style={{ fontSize: 20, color: '#f43f5e' }} />,
    'Ultrasound': <CameraOutlined style={{ fontSize: 20, color: '#52c41a' }} />,
  }

  const ordersColumns = [
    { title: 'Buyurtma ID', dataIndex: 'id', key: 'id', render: (id: string) => <Tag color="blue">{id}</Tag> },
    { title: 'Bemor', dataIndex: 'patient', key: 'patient' },
    { title: 'Shifokor', dataIndex: 'doctor', key: 'doctor' },
    { title: 'Turi', dataIndex: 'type', key: 'type', render: (t: string) => <Space>{typeIcons[t]} <Tag>{t}</Tag></Space> },
    { title: 'So\'ra', dataIndex: 'area', key: 'area' },
    { title: 'Sana', dataIndex: 'date', key: 'date', render: (d: string) => formatDate(d) },
    { title: 'Narxi', dataIndex: 'price', key: 'price', render: (v: number) => `${v.toLocaleString()} so\'m` },
    { title: 'Holat', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={statusColors[s]}>{statusLabels[s]}</Tag> },
    {
      title: 'Amal',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          {record.status === 'pending' && (
            <Button size="small" type="primary" onClick={() => handleStartScan(record)}>
              Skanerlash
            </Button>
          )}
          {record.status === 'in_progress' && (
            <Button size="small" type="primary" onClick={() => openResultModal(record)}>
              Natija kiritish
            </Button>
          )}
          {record.status === 'ready' && (
            <Button size="small" icon={<EyeOutlined />} onClick={() => openViewModal(record)}>
              Ko'rish
            </Button>
          )}
          <Button size="small" icon={<PrinterOutlined />}>Chop etish</Button>
        </Space>
      ),
    },
  ]

  const resultsColumns = [
    { title: 'Buyurtma', dataIndex: 'order_id', key: 'order_id', render: (id: string) => <Tag color="blue">{id}</Tag> },
    { title: 'Turi', dataIndex: 'type', key: 'type' },
    { title: 'Tekshiruv natijasi', dataIndex: 'findings', key: 'findings', ellipsis: true },
    { title: 'Xulosa', dataIndex: 'impression', key: 'impression', render: (s: string) => <Tag color={s === 'Normal' ? 'success' : 'warning'}>{s}</Tag> },
    { title: 'Sana', dataIndex: 'date', key: 'date', render: (d: string) => formatDate(d) },
    { title: 'Amal', key: 'action', render: () => <Button size="small" icon={<EyeOutlined />}>Batafsil</Button> },
  ]

  const handleStartScan = (order: any) => {
    setOrders(orders.map(o => o.id === order.id ? { ...o, status: 'in_progress' } : o))
    message.success('Skanerlash boshlandi')
  }

  const openResultModal = (order: any) => {
    setSelectedOrder(order)
    setResultModalOpen(true)
  }

  const openViewModal = (order: any) => {
    const result = results.find(r => r.order_id === order.id)
    if (result) {
      Modal.info({
        title: `${order.type} - ${order.patient}`,
        width: 700,
        content: (
          <div>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Buyurtma ID">{order.id}</Descriptions.Item>
              <Descriptions.Item label="So'ra">{order.area}</Descriptions.Item>
              <Descriptions.Item label="Shifokor">{order.doctor}</Descriptions.Item>
              <Descriptions.Item label="Sana">{formatDate(order.date)}</Descriptions.Item>
            </Descriptions>
            <Divider>Tekshiruv natijasi</Divider>
            <Text strong>Topilmalar:</Text>
            <Paragraph>{result.findings}</Paragraph>
            <Text strong>Xulosa:</Text>
            <Tag color={result.impression === 'Normal' ? 'success' : 'warning'} style={{ marginTop: 8 }}>{result.impression}</Tag>
          </div>
        ),
      })
    }
  }

  const handleSubmitResult = (values: any) => {
    const newResult = {
      id: 'RES' + Date.now(),
      order_id: selectedOrder.id,
      type: selectedOrder.type,
      findings: values.findings,
      impression: values.impression,
      date: new Date().toISOString().split('T')[0],
    }
    setResults([...results, newResult])
    setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: 'ready' } : o))
    message.success('Natija muvaffaqiyatli kiritildi')
    setResultModalOpen(false)
    resultForm.resetFields()
  }

  const pendingCount = orders.filter(o => o.status === 'pending').length
  const inProgressCount = orders.filter(o => o.status === 'in_progress').length
  const readyCount = orders.filter(o => o.status === 'ready').length
  const totalRevenue = orders.filter(o => o.status === 'ready').reduce((sum, o) => sum + o.price, 0)

  const tabItems = [
    {
      key: 'orders',
      label: <span><ScanOutlined /> Buyurtmalar</span>,
      children: (
        <Card>
          <Table columns={ordersColumns} dataSource={orders} rowKey="id" pagination={{ pageSize: 10 }} />
        </Card>
      ),
    },
    {
      key: 'results',
      label: <span><CheckCircleOutlined /> Natijalar</span>,
      children: (
        <Card>
          <Table columns={resultsColumns} dataSource={results} rowKey="id" pagination={{ pageSize: 10 }} />
        </Card>
      ),
    },
  ]

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>{i18n.radiology?.title || 'Radiologiya'}</Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOrderModalOpen(true)}>
            Yangi buyurtma
          </Button>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Kutilmoqda"
              value={pendingCount}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Skanerlanmoqda"
              value={inProgressCount}
              prefix={<ThunderboltOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tayyor"
              value={readyCount}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Jami daromad"
              value={totalRevenue}
              precision={0}
              prefix="UZS "
              valueStyle={{ color: '#00d4aa' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* New Order Modal */}
      <Modal
        title="Yangi radiologiya buyurtmasi"
        open={orderModalOpen}
        onCancel={() => setOrderModalOpen(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Bemor" name="patient" rules={[{ required: true }]}>
            <Select placeholder="Bemor tanlang">
              <Select.Option value="p1">Rahimov Alisher Hasanovich</Select.Option>
              <Select.Option value="p2">Tursunova Dilshoda Obidjon qizi</Select.Option>
              <Select.Option value="p3">Abdullayev Jasur Alisherovich</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Shifokor" name="doctor" rules={[{ required: true }]}>
            <Select placeholder="Shifokor tanlang">
              <Select.Option value="d1">Karimova Nodira Abdulhayevna</Select.Option>
              <Select.Option value="d2">Ahmedov Botir Javlonovich</Select.Option>
              <Select.Option value="d3">Mahmudova Gulshan Orifjonovna</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Turi" name="type" rules={[{ required: true }]}>
            <Select placeholder="Turi tanlang">
              <Select.Option value="X-Ray">X-Ray (Rentgen)</Select.Option>
              <Select.Option value="CT">CT (Kompyuter tomografiya)</Select.Option>
              <Select.Option value="MRI">MRI (Magnit-rezonans tomografiya)</Select.Option>
              <Select.Option value="Ultrasound">Ultrasound (UTT)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="So'ra" name="area" rules={[{ required: true }]}>
            <Select placeholder="So'ra tanlang">
              <Select.Option value="Ko'krak qafasi">Ko'krak qafasi</Select.Option>
              <Select.Option value="Qorin bo'shlig'i">Qorin bo'shlig'i</Select.Option>
              <Select.Option value="Bel umurg'i">Bel umurg'i</Select.Option>
              <Select.Option value="Bosh miya">Bosh miya</Select.Option>
              <Select.Option value="Bo'yin">Bo'yin</Select.Option>
              <Select.Option value="Qo'l suyagi">Qo'l suyagi</Select.Option>
              <Select.Option value="Oyoq suyagi">Oyoq suyagi</Select.Option>
              <Select.Option value="Tizz a'zosi">Tizza a'zosi</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Narxi" name="price" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} step={10000} />
          </Form.Item>
          <Form.Item label="Izoh" name="notes">
            <TextArea rows={3} placeholder="Qo'shimcha ma'lumot" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Result Entry Modal */}
      <Modal
        title="Tekshiruv natijasini kiritish"
        open={resultModalOpen}
        onCancel={() => setResultModalOpen(false)}
        onOk={() => resultForm.submit()}
        width={700}
      >
        <Form form={resultForm} layout="vertical" onFinish={handleSubmitResult}>
          <Form.Item label="Buyurtma ID">
            <Input value={selectedOrder?.id} disabled />
          </Form.Item>
          <Form.Item label="Turi">
            <Input value={selectedOrder?.type} disabled />
          </Form.Item>
          <Form.Item label="So'ra">
            <Input value={selectedOrder?.area} disabled />
          </Form.Item>
          <Form.Item label="Topilmalar" name="findings" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="Tekshiruv natijalari..." />
          </Form.Item>
          <Form.Item label="Xulosa" name="impression" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="Normal">Normal</Select.Option>
              <Select.Option value="Anormal">Anormal</Select.Option>
              <Select.Option value="Ekspertiza kerak">Ekspertiza kerak</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Izoh" name="notes">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}