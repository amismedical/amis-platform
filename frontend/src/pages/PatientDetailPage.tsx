import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, Descriptions, Button, Typography, Space, Tag, Table, Tabs, Row, Col, Statistic, Modal, Form, Input, message, Divider, Empty } from 'antd'
import { ArrowLeftOutlined, EditOutlined, UserOutlined, CalendarOutlined, HistoryOutlined, MedicineBoxOutlined, FileTextOutlined, HeartOutlined, ExperimentOutlined } from '@ant-design/icons'
import { patientService, appointmentService } from '../services/api'
import { i18n, formatDate } from '../i18n/uz'
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
  const { data: patient, isLoading, error } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientService.get(id!),
    enabled: !!id,
  })

  // Fetch patient appointments (history)
  const { data: appointmentsData } = useQuery({
    queryKey: ['patient-appointments', id],
    queryFn: () => appointmentService.list({ patient_id: id, limit: 100 }),
    enabled: !!id,
  })

  const updatePatientMutation = useMutation({
    mutationFn: (data: any) => patientService.update(id!, data),
    onSuccess: () => {
      message.success("Bemor ma'lumotlari yangilandi")
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

  // Patient not found
  if (error || !patient) {
    return (
      <div style={{ padding: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/patients')} style={{ marginBottom: 16 }}>
          Bemorlar ro'yxati
        </Button>
        <Card>
          <Empty description="Bemor topilmadi" />
        </Card>
      </div>
    )
  }

  const patientData = patient

  // History columns
  const historyColumns = [
    { title: 'Sana', dataIndex: 'appointment_date', key: 'appointment_date', render: (d: string) => formatDate(d) },
    { title: 'Vaqt', dataIndex: 'start_time', key: 'start_time' },
    { title: 'Shifokor', key: 'doctor', render: (_: any, r: any) => r.doctor ? `${r.doctor.last_name} ${r.doctor.first_name}` : '-' },
    { title: 'Xizmat', key: 'service', render: (_: any, r: any) => r.service?.name || '-' },
    { title: 'Holat', dataIndex: 'status', key: 'status', render: (s: string) => {
      const statusMap: Record<string, { color: string; text: string }> = {
        scheduled: { color: 'blue', text: 'Rejalashtirilgan' },
        waiting: { color: 'orange', text: 'Kutmoqda' },
        in_progress: { color: 'processing', text: 'Jarayonda' },
        completed: { color: 'success', text: 'Tugallangan' },
        cancelled: { color: 'error', text: 'Bekor qilingan' },
      }
      const status = statusMap[s] || { color: 'default', text: s }
      return <Tag color={status.color}>{status.text}</Tag>
    }},
  ]

  // Tab items with real data or empty states
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
                <Descriptions.Item label="Sharifi">{patientData.patronymic || '-'}</Descriptions.Item>
                <Descriptions.Item label="Tug'ilgan sana">{formatDate(patientData.birth_date)}</Descriptions.Item>
                <Descriptions.Item label="Jinsi">{patientData.gender === 'male' ? 'Erkak' : 'Ayol'}</Descriptions.Item>
                <Descriptions.Item label="Telefon">{patientData.phone}</Descriptions.Item>
                <Descriptions.Item label="Qo'shimcha tel">{patientData.phone_2 || '-'}</Descriptions.Item>
                <Descriptions.Item label="Email">{patientData.email || '-'}</Descriptions.Item>
                <Descriptions.Item label="Fuqaroligi">{patientData.citizenship || '-'}</Descriptions.Item>
                <Descriptions.Item label="Pasport">{patientData.passport || '-'}</Descriptions.Item>
                <Descriptions.Item label="Manzil" span={2}>{patientData.address || '-'}</Descriptions.Item>
                <Descriptions.Item label="Ro'yxatga olingan">{formatDate(patientData.created_at)}</Descriptions.Item>
                <Descriptions.Item label="Holati"><Tag color={patientData.is_active ? 'success' : 'error'}>{patientData.is_active ? 'Faol' : 'Nofaol'}</Tag></Descriptions.Item>
              </Descriptions>
              <Space style={{ marginTop: 16 }}>
                <Button type="primary" icon={<EditOutlined />} onClick={() => {
                  form.setFieldsValue(patientData)
                  setEditModalOpen(true)
                }}>
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
          {appointmentsData?.data && appointmentsData.data.length > 0 ? (
            <Table
              columns={historyColumns}
              dataSource={appointmentsData.data}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          ) : (
            <Empty description="Ma'lumot yo'q" />
          )}
        </Card>
      ),
    },
    {
      key: 'vitals',
      label: <span><HeartOutlined /> Vital ma'lumotlar</span>,
      children: (
        <Card>
          <Empty description="Ma'lumot yo'q" />
        </Card>
      ),
    },
    {
      key: 'diagnoses',
      label: <span><MedicineBoxOutlined /> Tashxislar</span>,
      children: (
        <Card>
          <Empty description="Ma'lumot yo'q" />
        </Card>
      ),
    },
    {
      key: 'lab',
      label: <span><ExperimentOutlined /> Laboratoriya</span>,
      children: (
        <Card>
          <Empty description="Ma'lumot yo'q" />
        </Card>
      ),
    },
    {
      key: 'financial',
      label: <span>Moliyaviy tarix</span>,
      children: (
        <Card>
          <Empty description="Ma'lumot yo'q" />
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
        confirmLoading={updatePatientMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdatePatient}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Familiya" name="last_name" rules={[{ required: true, message: 'Familiya kiritish majburiy' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ism" name="first_name" rules={[{ required: true, message: 'Ism kiritish majburiy' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Telefon" name="phone">
            <Input />
          </Form.Item>
          <Form.Item label="Email" name="email">
            <Input />
          </Form.Item>
          <Form.Item label="Manzil" name="address">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
