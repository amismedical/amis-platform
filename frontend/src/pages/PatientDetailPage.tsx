import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, Descriptions, Button, Typography, Space, Tag, Table, Tabs, Row, Col, Statistic, Modal, Form, Input, DatePicker, Select, message, Divider, Alert } from 'antd'
import { ArrowLeftOutlined, EditOutlined, UserOutlined, PhoneOutlined, MailOutlined, CalendarOutlined, HistoryOutlined, MedicineBoxOutlined, FileTextOutlined, HeartOutlined, ExperimentOutlined } from '@ant-design/icons'
import { patientService, appointmentService } from '../services/mockApi'
import { i18n, formatDate, formatFullDate } from '../i18n/uz'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { TextArea } = Input

export function PatientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('info')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [form] = Form.useForm()

  // Fetch patient data
  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientService.get(id!),
    enabled: !!id,
  })

  // Fetch patient history
  const { data: appointments } = useQuery({
    queryKey: ['patient-appointments', id],
    queryFn: () => appointmentService.list({ patient_id: id }),
    enabled: !!id,
  })

  // Fetch vitals
  const { data: vitals } = useQuery({
    queryKey: ['patient-vitals', id],
    queryFn: () => Promise.resolve([]),
    enabled: !!id,
  })

  // Fetch diagnoses
  const { data: diagnoses } = useQuery({
    queryKey: ['patient-diagnoses', id],
    queryFn: () => Promise.resolve([]),
    enabled: !!id,
  })

  // Fetch lab results
  const { data: labResults } = useQuery({
    queryKey: ['patient-lab', id],
    queryFn: () => Promise.resolve([]),
    enabled: !!id,
  })

  // Fetch financial history
  const { data: financial } = useQuery({
    queryKey: ['patient-financial', id],
    queryFn: () => Promise.resolve({ deposits: [], transactions: [] }),
    enabled: !!id,
  })

  const updatePatientMutation = useMutation({
    mutationFn: (data: any) => patientService.update(id!, data),
    onSuccess: () => {
      message.success('Bemor ma\'lumotlari yangilandi')
      setEditModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['patient', id] })
    },
    onError: () => message.error('Xatolik yuz berdi'),
  })

  const handleUpdatePatient = (values: any) => {
    updatePatientMutation.mutate(values)
  }

  if (isLoading) {
    return <div style={{ padding: 50, textAlign: 'center' }}>Yuklanmoqda...</div>
  }

  const patientData = patient || {
    id,
    first_name: 'Rahimov',
    last_name: 'Alisher',
    patronymic: 'Hasanovich',
    birth_date: '1990-05-15',
    gender: 'male',
    phone: '+998901234567',
    phone_2: '+998901234568',
    email: 'rahimov@example.uz',
    citizenship: 'O\'zbekiston',
    address: 'Toshkent shahri, Yunusobod tumani, 15-uy',
    passport: 'AA1234567',
    deposit_balance: 500000,
    is_active: true,
    created_at: '2024-01-15',
  }

  // Demo history data
  const historyData = [
    { key: '1', date: '2024-06-10', type: 'examination', doctor: 'Karimova Nodira', diagnosis: 'Oshqozon-ichak yallig\'lanishi', status: 'completed' },
    { key: '2', date: '2024-05-20', type: 'lab', doctor: 'Mahmudova Gulshan', diagnosis: 'Qon tahlili', status: 'completed' },
    { key: '3', date: '2024-04-15', type: 'uzi', doctor: 'Rasulov Sardor', diagnosis: 'Qorin bo\'shlig\'i UTT', status: 'completed' },
  ]

  const vitalsData = [
    { key: '1', date: '2024-06-10', bp: '120/80', pulse: 72, temp: 36.6, weight: 78, height: 175 },
    { key: '2', date: '2024-05-20', bp: '125/85', pulse: 75, temp: 36.8, weight: 79, height: 175 },
  ]

  const diagnosesData = [
    { key: '1', date: '2024-06-10', code: 'K29.5', name: 'Oshqozon-ichak yallig\'lanishi', type: 'main', status: 'active' },
    { key: '2', date: '2024-03-15', code: 'E11.9', name: '2-tur diabet', type: 'secondary', status: 'chronic' },
  ]

  const labData = [
    { key: '1', date: '2024-05-20', test: 'Umumiy qon tahlili', result: 'Normal', status: 'ready' },
    { key: '2', date: '2024-05-20', test: 'Biokimyoviy tahlil', result: 'Normal', status: 'ready' },
    { key: '3', date: '2024-04-15', test: 'Glyukoz', result: '5.2 mmol/L', status: 'ready' },
  ]

  const financialData = [
    { key: '1', date: '2024-06-10', type: 'payment', amount: -150000, description: 'Maslahat' },
    { key: '2', date: '2024-06-01', type: 'deposit', amount: 500000, description: 'Depozit to\'ldirish' },
    { key: '3', date: '2024-05-20', type: 'payment', amount: -250000, description: 'Qon tahlili' },
  ]

  const historyColumns = [
    { title: 'Sana', dataIndex: 'date', key: 'date', render: (d: string) => formatDate(d) },
    { title: 'Turi', dataIndex: 'type', key: 'type', render: (t: string) => <Tag color={t === 'examination' ? 'blue' : t === 'lab' ? 'green' : 'purple'}>{t}</Tag> },
    { title: 'Shifokor', dataIndex: 'doctor', key: 'doctor' },
    { title: 'Tashxis', dataIndex: 'diagnosis', key: 'diagnosis' },
    { title: 'Holat', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'completed' ? 'success' : 'processing'}>{s}</Tag> },
  ]

  const vitalsColumns = [
    { title: 'Sana', dataIndex: 'date', key: 'date', render: (d: string) => formatDate(d) },
    { title: 'Qon bosimi', dataIndex: 'bp', key: 'bp' },
    { title: 'Puls', dataIndex: 'pulse', key: 'pulse', render: (v: number) => `${v} /daq` },
    { title: 'Harorat', dataIndex: 'temp', key: 'temp', render: (v: number) => `${v}°C` },
    { title: 'Vazn', dataIndex: 'weight', key: 'weight', render: (v: number) => `${v} kg` },
    { title: 'Bo\'y', dataIndex: 'height', key: 'height', render: (v: number) => `${v} sm` },
    { title: 'BMI', key: 'bmi', render: (_: any, r: any) => (r.weight / ((r.height / 100) ** 2)).toFixed(1) },
  ]

  const diagnosisColumns = [
    { title: 'Sana', dataIndex: 'date', key: 'date', render: (d: string) => formatDate(d) },
    { title: 'ICD-10', dataIndex: 'code', key: 'code', render: (c: string) => <Tag color="blue">{c}</Tag> },
    { title: 'Tashxis', dataIndex: 'name', key: 'name' },
    { title: 'Turi', dataIndex: 'type', key: 'type', render: (t: string) => <Tag color={t === 'main' ? 'red' : 'orange'}>{t === 'main' ? 'Asosiy' : 'Qo\'shimcha'}</Tag> },
    { title: 'Holat', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'active' ? 'success' : 'default'}>{s}</Tag> },
  ]

  const labColumns = [
    { title: 'Sana', dataIndex: 'date', key: 'date', render: (d: string) => formatDate(d) },
    { title: 'Test', dataIndex: 'test', key: 'test' },
    { title: 'Natija', dataIndex: 'result', key: 'result' },
    { title: 'Holat', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'ready' ? 'success' : 'processing'}>{s === 'ready' ? 'Tayyor' : 'Kutilmoqda'}</Tag> },
    { title: 'Amal', key: 'action', render: () => <Button size="small">Ko'rish</Button> },
  ]

  const financialColumns = [
    { title: 'Sana', dataIndex: 'date', key: 'date', render: (d: string) => formatDate(d) },
    { title: 'Turi', dataIndex: 'type', key: 'type', render: (t: string) => <Tag color={t === 'deposit' ? 'success' : 'error'}>{t === 'deposit' ? 'Kirim' : 'Chiqim'}</Tag> },
    { title: 'Summa', dataIndex: 'amount', key: 'amount', render: (v: number) => <Text style={{ color: v > 0 ? '#52c41a' : '#ff4d4f' }}>{v > 0 ? '+' : ''}{v.toLocaleString()} UZS</Text> },
    { title: 'Izoh', dataIndex: 'description', key: 'description' },
  ]

  const tabItems = [
    {
      key: 'info',
      label: <span><UserOutlined /> Shaxsiy ma'lumotlar</span>,
      children: (
        <Row gutter={24}>
          <Col span={16}>
            <Card title="Asosiy ma'lumotlar">
              <Descriptions column={2} bordered>
                <Descriptions.Item label="Familiya">{patientData.last_name}</Descriptions.Item>
                <Descriptions.Item label="Ism">{patientData.first_name}</Descriptions.Item>
                <Descriptions.Item label="Otasining ismi">{patientData.patronymic || '-'}</Descriptions.Item>
                <Descriptions.Item label="Tug'ilgan sana">{formatDate(patientData.birth_date)}</Descriptions.Item>
                <Descriptions.Item label="Jinsi">{patientData.gender === 'male' ? 'Erkak' : 'Ayol'}</Descriptions.Item>
                <Descriptions.Item label="Telefon">{patientData.phone}</Descriptions.Item>
                <Descriptions.Item label="Qo'shimcha tel">{patientData.phone_2 || '-'}</Descriptions.Item>
                <Descriptions.Item label="Email">{patientData.email || '-'}</Descriptions.Item>
                <Descriptions.Item label="Fuqaroligi">{patientData.citizenship || '-'}</Descriptions.Item>
                <Descriptions.Item label="Passport">{patientData.passport || '-'}</Descriptions.Item>
                <Descriptions.Item label="Manzil" span={2}>{patientData.address || '-'}</Descriptions.Item>
                <Descriptions.Item label="Ro'yxatga olingan">{formatDate(patientData.created_at)}</Descriptions.Item>
                <Descriptions.Item label="Holati"><Tag color={patientData.is_active ? 'success' : 'error'}>{patientData.is_active ? 'Faol' : 'Nofaol'}</Tag></Descriptions.Item>
              </Descriptions>
              <Space style={{ marginTop: 16 }}>
                <Button type="primary" icon={<EditOutlined />} onClick={() => setEditModalOpen(true)}>
                  Tahrirlash
                </Button>
                <Button icon={<FileTextOutlined />} onClick={() => navigate(`/medical-card/${id}`)}>
                  Tibbiyot kartasi
                </Button>
              </Space>
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Depozit balansi"
                value={patientData.deposit_balance}
                precision={0}
                prefix="UZS "
                valueStyle={{ color: patientData.deposit_balance > 0 ? '#00d4aa' : '#ff4d4f' }}
              />
              <Divider />
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button block type="default">Depozit to'ldirish</Button>
                <Button block type="default">Pul qo'shish</Button>
              </Space>
            </Card>
            <Card style={{ marginTop: 16 }}>
              <Title level={5}>Tezkor amallar</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button block icon={<CalendarOutlined />} onClick={() => navigate('/appointments')}>Qabul yaratish</Button>
                <Button block icon={<ExperimentOutlined />} onClick={() => navigate('/lis')}>Laboratoriya buyurtma</Button>
                <Button block icon={<MedicineBoxOutlined />} onClick={() => navigate('/doctor')}>Shifokor ish joyi</Button>
              </Space>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'history',
      label: <span><HistoryOutlined /> Qabul tarixi</span>,
      children: (
        <Card>
          <Table columns={historyColumns} dataSource={historyData} rowKey="key" pagination={false} />
        </Card>
      ),
    },
    {
      key: 'vitals',
      label: <span><HeartOutlined /> Vitals</span>,
      children: (
        <Card>
          <Table columns={vitalsColumns} dataSource={vitalsData} rowKey="key" pagination={false} />
        </Card>
      ),
    },
    {
      key: 'diagnoses',
      label: <span><MedicineBoxOutlined /> Tashxislar</span>,
      children: (
        <Card>
          <Table columns={diagnosisColumns} dataSource={diagnosesData} rowKey="key" pagination={false} />
        </Card>
      ),
    },
    {
      key: 'lab',
      label: <span><ExperimentOutlined /> Laboratoriya</span>,
      children: (
        <Card>
          <Table columns={labColumns} dataSource={labData} rowKey="key" pagination={false} />
        </Card>
      ),
    },
    {
      key: 'financial',
      label: <span>Moliyaviy tarix</span>,
      children: (
        <Card>
          <Table columns={financialColumns} dataSource={financialData} rowKey="key" pagination={false} />
        </Card>
      ),
    },
  ]

  return (
    <div style={{ padding: 0 }}>
      <div style={{
        padding: '16px 24px',
        background: 'linear-gradient(135deg, #081423 0%, #0d1f35 100%)',
        borderBottom: '1px solid rgba(0,212,170,0.15)',
      }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/patients')} style={{ marginRight: 16 }}>
          Bemorlar ro'yxati
        </Button>
        <Title level={3} style={{ color: '#fff', margin: 0, display: 'inline' }}>
          {patientData.last_name} {patientData.first_name} {patientData.patronymic || ''}
        </Title>
        <Tag color={patientData.is_active ? 'success' : 'error'} style={{ marginLeft: 12 }}>
          {patientData.is_active ? 'Faol' : 'Nofaol'}
        </Tag>
      </div>

      <div style={{ padding: 24 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </div>

      {/* Edit Modal */}
      <Modal
        title="Bemor ma'lumotlarini tahrirlash"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdatePatient}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Familiya" name="last_name" initialValue={patientData.last_name}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ism" name="first_name" initialValue={patientData.first_name}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Telefon" name="phone" initialValue={patientData.phone}>
            <Input />
          </Form.Item>
          <Form.Item label="Email" name="email" initialValue={patientData.email}>
            <Input />
          </Form.Item>
          <Form.Item label="Manzil" name="address" initialValue={patientData.address}>
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}