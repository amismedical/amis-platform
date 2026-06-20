import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Typography, Card, Table, Tag, Button, Space, Modal, Form, Select, Input, InputNumber, DatePicker, message, Row, Col, Statistic, Tabs, Steps } from 'antd'
import { PlusOutlined, ExperimentOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, EyeOutlined, PrinterOutlined } from '@ant-design/icons'
import { i18n, formatDate } from '../i18n/uz'

const { Title, Text } = Typography
const { TextArea } = Input

export function LISPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('orders')
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [resultModalOpen, setResultModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [form] = Form.useForm()
  const [resultForm] = Form.useForm()

  // Demo orders data
  const [orders, setOrders] = useState([
    { id: 'LIS001', patient: 'Rahimov Alisher', doctor: 'Karimova Nodira', tests: ['Umumiy qon', 'Biokimyo'], status: 'collected', date: '2024-06-15', sample_type: 'Qon' },
    { id: 'LIS002', patient: 'Tursunova Dilshoda', doctor: 'Ahmedov Botir', tests: ['Glyukoz', 'Insulin'], status: 'pending', date: '2024-06-15', sample_type: 'Qon' },
    { id: 'LIS003', patient: 'Abdullayev Jasur', doctor: 'Mahmudova Gulshan', tests: ['Umumiy siydik'], status: 'ready', date: '2024-06-14', sample_type: 'Siydik' },
    { id: 'LIS004', patient: 'Nazarova Sevara', doctor: 'Karimova Nodira', tests: ['TSH', 'T3', 'T4'], status: 'in_progress', date: '2024-06-14', sample_type: 'Qon' },
    { id: 'LIS005', patient: 'Saidov BEkmurod', doctor: 'Rasulov Sardor', tests: ['Jigar funktsiyalari'], status: 'ready', date: '2024-06-13', sample_type: 'Qon' },
  ])

  const [results, setResults] = useState([
    { id: 'RES001', order_id: 'LIS003', test: 'Umumiy siydik', result: 'Normal', value: '-', unit: '-', ref_min: '-', ref_max: '-', status: 'normal', date: '2024-06-14' },
  ])

  const statusColors: Record<string, string> = {
    pending: 'default',
    collected: 'processing',
    in_progress: 'processing',
    ready: 'success',
    cancelled: 'error',
  }

  const statusLabels: Record<string, string> = {
    pending: 'Kutilmoqda',
    collected: 'Namuna olingan',
    in_progress: 'Tahlil davom etmoqda',
    ready: 'Tayyor',
    cancelled: 'Bekor qilingan',
  }

  const ordersColumns = [
    { title: 'Buyurtma ID', dataIndex: 'id', key: 'id', render: (id: string) => <Tag color="blue">{id}</Tag> },
    { title: 'Bemor', dataIndex: 'patient', key: 'patient' },
    { title: 'Shifokor', dataIndex: 'doctor', key: 'doctor' },
    { title: 'Testlar', dataIndex: 'tests', key: 'tests', render: (tests: string[]) => tests.map((t, i) => <Tag key={i}>{t}</Tag>) },
    { title: 'Namuna', dataIndex: 'sample_type', key: 'sample_type' },
    { title: 'Sana', dataIndex: 'date', key: 'date', render: (d: string) => formatDate(d) },
    {
      title: 'Holat',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={statusColors[s]}>{statusLabels[s]}</Tag>,
    },
    {
      title: 'Amal',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          {record.status === 'pending' && (
            <Button size="small" type="primary" onClick={() => handleCollectSample(record)}>
              Namuna olish
            </Button>
          )}
          {record.status === 'collected' && (
            <Button size="small" type="primary" onClick={() => handleStartAnalysis(record)}>
              Tahlil boshlash
            </Button>
          )}
          {record.status === 'in_progress' && (
            <Button size="small" onClick={() => openResultModal(record)}>
              Natija kiritish
            </Button>
          )}
          {record.status === 'ready' && (
            <Button size="small" icon={<EyeOutlined />}>Ko'rish</Button>
          )}
          <Button size="small" icon={<PrinterOutlined />}>Chop etish</Button>
        </Space>
      ),
    },
  ]

  const resultsColumns = [
    { title: 'Buyurtma', dataIndex: 'order_id', key: 'order_id', render: (id: string) => <Tag color="blue">{id}</Tag> },
    { title: 'Test', dataIndex: 'test', key: 'test' },
    { title: 'Natija', dataIndex: 'result', key: 'result' },
    { title: 'Qiymat', dataIndex: 'value', key: 'value' },
    { title: 'Birlik', dataIndex: 'unit', key: 'unit' },
    { title: 'Ref', key: 'ref', render: (_: any, r: any) => `${r.ref_min} - ${r.ref_max}` },
    { title: 'Holat', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'normal' ? 'success' : s === 'high' ? 'error' : 'warning'}>{s}</Tag> },
  ]

  const handleCollectSample = (order: any) => {
    setOrders(orders.map(o => o.id === order.id ? { ...o, status: 'collected' } : o))
    message.success('Namuna muvaffaqiyatli olindi')
  }

  const handleStartAnalysis = (order: any) => {
    setOrders(orders.map(o => o.id === order.id ? { ...o, status: 'in_progress' } : o))
    message.success('Tahlil boshlandi')
  }

  const openResultModal = (order: any) => {
    setSelectedOrder(order)
    resultModalOpen
    setResultModalOpen(true)
  }

  const handleSubmitResult = (values: any) => {
    const newResult = {
      id: 'RES' + Date.now(),
      order_id: selectedOrder.id,
      test: values.test,
      result: values.is_normal ? 'Normal' : 'Anormal',
      value: values.value,
      unit: values.unit,
      ref_min: values.ref_min,
      ref_max: values.ref_max,
      status: values.is_normal ? 'normal' : 'high',
      date: new Date().toISOString().split('T')[0],
    }
    setResults([...results, newResult])
    setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: 'ready' } : o))
    message.success('Natija muvaffaqiyatli kiritildi')
    setResultModalOpen(false)
    resultForm.resetFields()
  }

  const pendingCount = orders.filter(o => o.status === 'pending').length
  const inProgressCount = orders.filter(o => o.status === 'in_progress' || o.status === 'collected').length
  const readyCount = orders.filter(o => o.status === 'ready').length

  const tabItems = [
    {
      key: 'orders',
      label: <span><ExperimentOutlined /> Buyurtmalar</span>,
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
          <Title level={3} style={{ margin: 0 }}>{i18n.laboratory.title}</Title>
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
              title="Tahlilda"
              value={inProgressCount}
              prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
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
              title="Jami buyurtmalar"
              value={orders.length}
              prefix={<ExperimentOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* New Order Modal */}
      <Modal
        title="Yangi laboratoriya buyurtmasi"
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
          <Form.Item label="Testlar" name="tests" rules={[{ required: true }]}>
            <Select mode="multiple" placeholder="Test tanlang">
              <Select.Option value="umumiy_qon">Umumiy qon tahlili</Select.Option>
              <Select.Option value="biokimyo">Biokimyoviy tahlil</Select.Option>
              <Select.Option value="glyukoz">Glyukoz</Select.Option>
              <Select.Option value="insulin">Insulin</Select.Option>
              <Select.Option value="umumiy_siydik">Umumiy siydik tahlili</Select.Option>
              <Select.Option value="tsh">TSH</Select.Option>
              <Select.Option value="t3">T3</Select.Option>
              <Select.Option value="t4">T4</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Namuna turi" name="sample_type" rules={[{ required: true }]}>
            <Select placeholder="Namuna tanlang">
              <Select.Option value="Qon">Qon</Select.Option>
              <Select.Option value="Siydik">Siydik</Select.Option>
              <Select.Option value="Najis">Najis</Select.Option>
              <Select.Option value="Balig'">Balg'am</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Izoh" name="notes">
            <TextArea rows={3} placeholder="Qo'shimcha ma'lumot" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Result Entry Modal */}
      <Modal
        title="Tahlil natijasini kiritish"
        open={resultModalOpen}
        onCancel={() => setResultModalOpen(false)}
        onOk={() => resultForm.submit()}
        width={500}
      >
        <Form form={resultForm} layout="vertical" onFinish={handleSubmitResult}>
          <Form.Item label="Buyurtma ID">
            <Input value={selectedOrder?.id} disabled />
          </Form.Item>
          <Form.Item label="Test nomi" name="test" rules={[{ required: true }]}>
            <Select placeholder="Test tanlang">
              {selectedOrder?.tests.map((t: string, i: number) => (
                <Select.Option key={i} value={t}>{t}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Natija qiymati" name="value" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Birlik" name="unit" rules={[{ required: true }]}>
                <Input placeholder="mmol/L, g/L, %" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Ref min" name="ref_min">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ref max" name="ref_max">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Holat" name="is_normal" initialValue={true}>
            <Select>
              <Select.Option value={true}>Normal</Select.Option>
              <Select.Option value={false}>Anormal</Select.Option>
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