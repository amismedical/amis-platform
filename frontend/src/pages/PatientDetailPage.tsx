/**
 * AMIS - Patient 360 / Patient Detail (Module 2)
 * Redesigned: Passport card layout + tabs + quick actions + print
 */
import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card, Descriptions, Button, Typography, Space, Tag, Table, Tabs,
  Row, Col, Statistic, Modal, Form, Input, Select, DatePicker,
  message, Divider, Empty, Badge, Tooltip, Popconfirm
} from 'antd'
import {
  ArrowLeftOutlined, EditOutlined, UserOutlined, CalendarOutlined,
  HistoryOutlined, MedicineBoxOutlined, FileTextOutlined, HeartOutlined,
  ExperimentOutlined, CheckCircleOutlined, PrinterOutlined, PhoneOutlined,
  MailOutlined, HomeOutlined, IdcardOutlined, QrcodeOutlined,
  PlusOutlined, WarningOutlined, DeleteOutlined, StopOutlined
} from '@ant-design/icons'
import { patientService, appointmentService, staffService } from '../services/api'
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
  const [apptModalOpen, setApptModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [apptForm] = Form.useForm()

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

  // Doctors list
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors-list'],
    queryFn: () => staffService.listDoctors(),
  })
  const doctorsList = doctorsData?.data || []

  // Create appointment
  const createApptMutation = useMutation({
    mutationFn: (values: any) => {
      const payload = {
        patient_id: id,
        doctor_id: values.doctor_id,
        service_id: values.service_id,
        appointment_date: values.appointment_date?.format('YYYY-MM-DD'),
        start_time: values.start_time,
        cabinet: values.cabinet,
        notes: values.notes,
        booking_method: 'manual',
      }
      return appointmentService.create(payload)
    },
    onSuccess: () => {
      message.success({ content: 'Qabul muvaffaqiyatli yaratildi!', icon: <CheckCircleOutlined style={{ color: '#52c41a' }} /> })
      setApptModalOpen(false)
      apptForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['patient-appointments', id] })
    },
    onError: (error: any) => {
      message.error({ content: error?.response?.data?.error || 'Qabul yaratishda xatolik', icon: <ExperimentOutlined style={{ color: '#ff4d4f' }} /> })
    },
  })

  // Print patient passport
  const handlePrintPassport = () => {
    window.print()
  }

  if (isLoading) {
    return <div style={{ padding: 50, textAlign: 'center' }}>Yuklanmoqda...</div>
  }

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

  // Today's status
  const todayAppts = (appointmentsData?.data || []).filter((a: any) =>
    a.appointment_date === dayjs().format('YYYY-MM-DD')
  )
  const todayStatus = todayAppts.length > 0
    ? todayAppts[0].status
    : null

  const statusColorMap: Record<string, string> = {
    scheduled: 'blue', confirmed: 'cyan', checked_in: 'processing',
    waiting: 'warning', in_progress: 'processing', completed: 'success',
    cancelled: 'error', no_show: 'default',
  }
  const statusTextMap: Record<string, string> = {
    scheduled: 'Rejalashtirilgan', confirmed: 'Tasdiqlangan',
    checked_in: 'Ro\'yxatdan o\'tgan', waiting: 'Navbatda',
    in_progress: 'Qabul davom etmoqda', completed: 'Tugallangan',
    cancelled: 'Bekor qilingan', no_show: 'Kelmagan',
  }

  const historyColumns = [
    { title: 'Sana', dataIndex: 'appointment_date', key: 'appointment_date', render: (d: string) => formatDate(d) },
    { title: 'Vaqt', dataIndex: 'start_time', key: 'start_time' },
    { title: 'Shifokor', key: 'doctor', render: (_: any, r: any) => r.doctor ? `${r.doctor.last_name} ${r.doctor.first_name}` : '-' },
    { title: 'Xizmat', key: 'service', render: (_: any, r: any) => r.service?.name || '-' },
    { title: 'Kabinet', dataIndex: 'cabinet', key: 'cabinet', render: (c: string) => c || '-' },
    { title: 'Holat', dataIndex: 'status', key: 'status', render: (s: string) => {
      const color = statusColorMap[s] || 'default'
      const text = statusTextMap[s] || s
      return <Tag color={color}>{text}</Tag>
    }},
  ]

  const tabItems = [
    {
      key: 'info',
      label: <span><UserOutlined /> Shaxsiy</span>,
      children: (
        <Row gutter={24}>
          {/* Passport Card */}
          <Col span={16}>
            {/* Passport-style card */}
            <div id="patient-passport-print">
              <Card
                style={{
                  background: 'linear-gradient(135deg, #1a2a4a 0%, #0d1a30 100%)',
                  border: '2px solid rgba(212,175,55,0.4)',
                  borderRadius: 16,
                  marginBottom: 16,
                  overflow: 'hidden',
                  position: 'relative',
                }}
                bodyStyle={{ padding: 0 }}
              >
                {/* Gold stripe at top */}
                <div style={{
                  height: 6,
                  background: 'linear-gradient(90deg, #d4af37, #f5d560, #d4af37)',
                  marginBottom: 20,
                }} />

                <div style={{ padding: '0 24px 24px' }}>
                  <Row gutter={24} align="middle">
                    {/* Left: Avatar + QR */}
                    <Col span={5} style={{ textAlign: 'center' }}>
                      <div style={{
                        width: 90,
                        height: 110,
                        borderRadius: 8,
                        background: 'rgba(212,175,55,0.1)',
                        border: '1px solid rgba(212,175,55,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 8px',
                      }}>
                        <UserOutlined style={{ fontSize: 40, color: 'rgba(212,175,55,0.5)' }} />
                      </div>
                      {/* QR placeholder */}
                      <div style={{
                        width: 70,
                        height: 70,
                        border: '1px solid rgba(212,175,55,0.2)',
                        borderRadius: 4,
                        margin: '0 auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <QrcodeOutlined style={{ fontSize: 32, color: 'rgba(212,175,55,0.3)' }} />
                      </div>
                    </Col>

                    {/* Right: Patient info */}
                    <Col span={19}>
                      {/* Header row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <div style={{
                            fontSize: 11,
                            color: '#d4af37',
                            textTransform: 'uppercase',
                            letterSpacing: 2,
                            marginBottom: 4,
                          }}>
                            Tibbiy Pasport
                          </div>
                          <div style={{
                            fontFamily: 'monospace',
                            fontSize: 18,
                            fontWeight: 700,
                            color: '#d4af37',
                            letterSpacing: 1,
                          }}>
                            {patientData.med_id || '—'}
                          </div>
                          <div style={{
                            fontSize: 12,
                            color: '#8c8c8c',
                            marginTop: 2,
                          }}>
                            Region: {patientData.passport_region_code || '—'} {patientData.passport_region_name ? `— ${patientData.passport_region_name}` : ''}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <Tag color={patientData.is_active ? 'success' : 'error'} style={{ fontSize: 12 }}>
                            {patientData.is_active ? 'FAOL' : 'NOFAOL'}
                          </Tag>
                          {todayStatus && (
                            <Tag color={statusColorMap[todayStatus]} style={{ marginLeft: 4, fontSize: 11 }}>
                              {todayStatus === 'no_show' ? 'Kelmagan' : 'Bugun: ' + (statusTextMap[todayStatus] || todayStatus)}
                            </Tag>
                          )}
                        </div>
                      </div>

                      {/* FIO row */}
                      <div style={{
                        fontSize: 22,
                        fontWeight: 700,
                        color: '#fff',
                        marginBottom: 16,
                        lineHeight: 1.2,
                      }}>
                        {patientData.last_name} {patientData.first_name} {patientData.patronymic || ''}
                      </div>

                      {/* Info grid */}
                      <Row gutter={[12, 8]}>
                        <Col span={8}>
                          <div style={{ color: '#8c8c8c', fontSize: 11, marginBottom: 2 }}>Tug'ilgan sana</div>
                          <div style={{ color: '#fff', fontSize: 13 }}>{formatDate(patientData.birth_date)}</div>
                        </Col>
                        <Col span={8}>
                          <div style={{ color: '#8c8c8c', fontSize: 11, marginBottom: 2 }}>Jinsi</div>
                          <div style={{ color: '#fff', fontSize: 13 }}>{patientData.gender === 'male' ? 'Erkak' : 'Ayol'}</div>
                        </Col>
                        <Col span={8}>
                          <div style={{ color: '#8c8c8c', fontSize: 11, marginBottom: 2 }}>Fuqaroligi</div>
                          <div style={{ color: '#fff', fontSize: 13 }}>{patientData.citizenship || '—'}</div>
                        </Col>
                        <Col span={12}>
                          <div style={{ color: '#8c8c8c', fontSize: 11, marginBottom: 2 }}>
                            <PhoneOutlined style={{ marginRight: 4 }} />Telefon
                          </div>
                          <div style={{ color: '#d4af37', fontSize: 14, fontWeight: 600 }}>{patientData.phone}</div>
                        </Col>
                        <Col span={12}>
                          <div style={{ color: '#8c8c8c', fontSize: 11, marginBottom: 2 }}>
                            <IdcardOutlined style={{ marginRight: 4 }} />Pasport
                          </div>
                          <div style={{ color: '#fff', fontSize: 13 }}>{patientData.passport || '—'}</div>
                        </Col>
                        <Col span={24}>
                          <div style={{ color: '#8c8c8c', fontSize: 11, marginBottom: 2 }}>
                            <HomeOutlined style={{ marginRight: 4 }} />Manzil
                          </div>
                          <div style={{ color: '#fff', fontSize: 13 }}>{patientData.address || '—'}</div>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </div>

                {/* Bottom bar */}
                <div style={{
                  padding: '12px 24px',
                  borderTop: '1px solid rgba(212,175,55,0.15)',
                  background: 'rgba(0,0,0,0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <Text style={{ color: '#8c8c8c', fontSize: 12 }}>
                    Ro'yxatga olingan: {formatDate(patientData.created_at)}
                  </Text>
                  <Text style={{ color: '#8c8c8c', fontSize: 12 }}>
                    ID: {patientData.id?.slice(0, 8)}...
                  </Text>
                </div>
              </Card>
            </div>

            {/* Action buttons */}
            <Space wrap style={{ marginBottom: 16 }}>
              <Button icon={<PrinterOutlined />} onClick={handlePrintPassport}
                style={{ borderColor: '#d4af37', color: '#d4af37' }}>
                Chop etish
              </Button>
              <Button type="primary" icon={<EditOutlined />} onClick={() => {
                form.setFieldsValue(patientData)
                setEditModalOpen(true)
              }}
                style={{ background: '#d4af37', borderColor: '#d4af37', color: '#000' }}>
                Tahrirlash
              </Button>
              <Button icon={<FileTextOutlined />} onClick={() => navigate(`/medical-card/${id}`)}>
                Tibbiyot kartasi
              </Button>
            </Space>
          </Col>

          {/* Right sidebar */}
          <Col span={8}>
            {/* Deposit */}
            <Card
              style={{
                background: 'linear-gradient(135deg, #1a2a4a 0%, #0d1a30 100%)',
                border: '1px solid rgba(212,175,55,0.2)',
                borderRadius: 12,
                marginBottom: 16,
              }}
              bodyStyle={{ padding: 16 }}
            >
              <Statistic
                title={<span style={{ color: '#8c8c8c', fontSize: 12 }}>Depozit balansi</span>}
                value={patientData.deposit_balance}
                precision={0}
                prefix={<span style={{ color: patientData.deposit_balance > 0 ? '#52c41a' : '#ff4d4f' }}>UZS</span>}
                valueStyle={{ color: patientData.deposit_balance > 0 ? '#52c41a' : '#ff4d4f', fontSize: 28 }}
              />
              <Divider style={{ margin: '12px 0', borderColor: 'rgba(212,175,55,0.1)' }} />
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button block type="default" size="small">Depozit to'ldirish</Button>
                <Button block type="default" size="small">Pul qo'shish</Button>
              </Space>
            </Card>

            {/* Quick Actions */}
            <Card
              title={<span style={{ color: '#fff', fontSize: 14 }}>Tezkor amallar</span>}
              style={{
                background: 'rgba(13,26,48,0.8)',
                border: '1px solid rgba(212,175,55,0.15)',
                borderRadius: 12,
              }}
              headStyle={{ borderBottom: '1px solid rgba(212,175,55,0.1)', color: '#fff' }}
              bodyStyle={{ padding: 8 }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  block type="primary" icon={<CalendarOutlined />}
                  onClick={() => setApptModalOpen(true)}
                  style={{ background: '#d4af37', borderColor: '#d4af37', color: '#000', textAlign: 'left' }}>
                  Qabul yaratish
                </Button>
                <Button block icon={<ExperimentOutlined />} onClick={() => navigate('/lis')}
                  style={{ textAlign: 'left' }}>
                  Lab buyurtma
                </Button>
                <Button block icon={<HistoryOutlined />} onClick={() => setActiveTab('history')}
                  style={{ textAlign: 'left' }}>
                  Qabul tarixi
                </Button>
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
        <Card
          style={{ background: 'rgba(13,26,48,0.8)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 12 }}
          bodyStyle={{ padding: 0 }}
        >
          {(appointmentsData?.data || []).length > 0 ? (
            <Table
              columns={historyColumns}
              dataSource={appointmentsData.data}
              rowKey="id"
              pagination={{ pageSize: 15 }}
              style={{ background: 'transparent' }}
            />
          ) : (
            <div style={{ padding: 48 }}>
              <Empty description="Qabul tarixi yo'q" />
            </div>
          )}
        </Card>
      ),
    },
    {
      key: 'vitals',
      label: <span><HeartOutlined /> Vital</span>,
      children: (
        <Card style={{ background: 'rgba(13,26,48,0.8)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 12 }}>
          <Empty description="Vital ma'lumotlar yo'q" />
        </Card>
      ),
    },
    {
      key: 'diagnoses',
      label: <span><MedicineBoxOutlined /> Tashxislar</span>,
      children: (
        <Card style={{ background: 'rgba(13,26,48,0.8)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 12 }}>
          <Empty description="Tashxislar yo'q" />
        </Card>
      ),
    },
    {
      key: 'lab',
      label: <span><ExperimentOutlined /> Lab</span>,
      children: (
        <Card style={{ background: 'rgba(13,26,48,0.8)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 12 }}>
          <Empty description="Laboratoriya natijalari yo'q" />
        </Card>
      ),
    },
    {
      key: 'financial',
      label: <span>Moliyaviy</span>,
      children: (
        <Card style={{ background: 'rgba(13,26,48,0.8)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 12 }}>
          <Empty description="Moliyaviy ma'lumotlar yo'q" />
        </Card>
      ),
    },
  ]

  return (
    <div style={{ padding: 0 }}>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #patient-passport-print, #patient-passport-print * { visibility: visible; }
          #patient-passport-print {
            position: absolute; left: 0; top: 0; width: 100%;
            background: #fff !important;
            border: 2px solid #000 !important;
            color: #000 !important;
          }
          #patient-passport-print .ant-card-body { padding: 24px !important; }
          #patient-passport-print [style*="color: '#d4af37'"] { color: #000 !important; }
          #patient-passport-print [style*="color: '#fff'"] { color: #000 !important; }
          #patient-passport-print [style*="color: '#8c8c8c'"] { color: #333 !important; }
        }
      `}</style>

      {/* Top header bar */}
      <div style={{
        padding: '16px 24px',
        background: 'linear-gradient(135deg, #081423 0%, #0d1f35 100%)',
        borderBottom: '1px solid rgba(0,212,170,0.15)',
      }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/patients')} style={{ marginRight: 16 }}>
          Bemorlar
        </Button>
        <span style={{
          fontFamily: 'monospace',
          color: '#d4af37',
          fontSize: 13,
          fontWeight: 600,
          marginRight: 12,
        }}>
          {patientData.med_id || '—'}
        </span>
        <Title level={3} style={{ color: '#fff', margin: 0, display: 'inline' }}>
          {patientData.last_name} {patientData.first_name} {patientData.patronymic || ''}
        </Title>
        <Tag color={patientData.is_active ? 'success' : 'error'} style={{ marginLeft: 12 }}>
          {patientData.is_active ? 'Faol' : 'Nofaol'}
        </Tag>
      </div>

      <div style={{ padding: 24 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          tabBarStyle={{ color: '#8c8c8c' }}
        />
      </div>

      {/* Edit Modal */}
      <Modal
        title="Bemor ma'lumotlarini tahrirlash"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={updatePatientMutation.isPending}
        styles={{ content: { background: 'rgba(13,26,48,0.95)' }, header: { background: 'rgba(13,26,48,0.95)', color: '#fff' } }}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdatePatient}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Familiya" name="last_name" rules={[{ required: true, message: 'Familiya kiritish majburiy' }]}>
                <Input placeholder="Familiyani kiriting" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ism" name="first_name" rules={[{ required: true, message: 'Ism kiritish majburiy' }]}>
                <Input placeholder="Ismni kiriting" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Telefon" name="phone">
                <Input placeholder="+998901234567" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Email" name="email">
                <Input placeholder="email@example.com" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Manzil" name="address">
            <TextArea rows={2} placeholder="Manzilni kiriting..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Appointment Modal */}
      <Modal
        title={<span><CalendarOutlined style={{ color: '#d4af37', marginRight: 8 }} />Yangi qabul</span>}
        open={apptModalOpen}
        onCancel={() => { setApptModalOpen(false); apptForm.resetFields() }}
        footer={null}
        width={480}
        styles={{ content: { background: 'rgba(13,26,48,0.95)' }, header: { background: 'rgba(13,26,48,0.95)', color: '#fff' } }}
      >
        <Form form={apptForm} layout="vertical" onFinish={(values) => createApptMutation.mutate(values)}>
          <Form.Item label="Shifokor" name="doctor_id" rules={[{ required: true, message: 'Shifokor tanlash majburiy' }]}>
            <Select
              placeholder="Shifokorni tanlang"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={doctorsList.map((d: any) => ({
                value: d.id,
                label: `${d.last_name} ${d.first_name}${d.specialty ? ' — ' + d.specialty : ''}`,
              }))}
            />
          </Form.Item>
          <Form.Item label="Sana" name="appointment_date" rules={[{ required: true, message: 'Sana tanlash majburiy' }]}>
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Vaqt (HH:MM)" name="start_time" rules={[{ required: true, message: 'Vaqt majburiy' }]}>
                <Input placeholder="09:00" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Kabinet" name="cabinet">
                <Input placeholder="101" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Xizmat ID (ixtiyoriy)" name="service_id">
            <Input placeholder="Xizmat ID (ixtiyoriy)" />
          </Form.Item>
          <Form.Item label="Qayd" name="notes">
            <TextArea rows={2} placeholder="Qo'shimcha ma'lumot..." />
          </Form.Item>
          <Button
            type="primary" htmlType="submit" block
            loading={createApptMutation.isPending}
            style={{ background: '#d4af37', borderColor: '#d4af37', color: '#000', marginTop: 8 }}
          >
            Qabul yaratish
          </Button>
        </Form>
      </Modal>
    </div>
  )
}
