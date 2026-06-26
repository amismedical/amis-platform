/**
 * AMIS - Patient Detail Page (Patient Profile - TANA CRM Phase 1)
 * Redesigned: Full Patient Profile with 13 sections + Medical Card navigation
 */
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card, Descriptions, Button, Typography, Space, Tag, Table, Tabs,
  Row, Col, Statistic, Modal, Form, Input, Select, DatePicker,
  message, Divider, Empty, Badge, Tooltip, Popconfirm, Alert, Spin
} from 'antd'
import {
  ArrowLeftOutlined, EditOutlined, UserOutlined, CalendarOutlined,
  HistoryOutlined, MedicineBoxOutlined, FileTextOutlined, HeartOutlined,
  ExperimentOutlined, CheckCircleOutlined, PrinterOutlined, PhoneOutlined,
  MailOutlined, HomeOutlined, IdcardOutlined, QrcodeOutlined,
  PlusOutlined, WarningOutlined, DeleteOutlined, StopOutlined,
  SafetyOutlined, TeamOutlined, PaperClipOutlined, PlusCircleOutlined,
  FileProtectOutlined, AlertOutlined, ProfileOutlined, BankOutlined,
  TrophyOutlined, CloseCircleOutlined, UserSwitchOutlined
} from '@ant-design/icons'
import {
  patientService, appointmentService, staffService, patientProfileService, referenceService
} from '../services/api'
import { formatDate } from '../i18n/uz'
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
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [relativeModalOpen, setRelativeModalOpen] = useState(false)
  const [allergyModalOpen, setAllergyModalOpen] = useState(false)
  const [documentModalOpen, setDocumentModalOpen] = useState(false)
  const [depositModalOpen, setDepositModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [apptForm] = Form.useForm()
  const [contactForm] = Form.useForm()
  const [relativeForm] = Form.useForm()
  const [allergyForm] = Form.useForm()
  const [documentForm] = Form.useForm()
  const [depositForm] = Form.useForm()

  // Fetch patient base data
  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientService.get(id!),
    enabled: !!id,
  })

  // Fetch patient appointments
  const { data: appointmentsData } = useQuery({
    queryKey: ['patient-appointments', id],
    queryFn: () => appointmentService.list({ patient_id: id, limit: 100 }),
    enabled: !!id,
  })

  // Fetch patient profile (medical data)
  const { data: profileData } = useQuery({
    queryKey: ['patient-profile', id],
    queryFn: () => patientProfileService.getProfile(id!),
    enabled: !!id,
  })

  // Fetch contacts
  const { data: contactsData, refetch: refetchContacts } = useQuery({
    queryKey: ['patient-contacts', id],
    queryFn: () => patientProfileService.getContacts(id!),
    enabled: !!id,
  })

  // Fetch relatives
  const { data: relativesData, refetch: refetchRelatives } = useQuery({
    queryKey: ['patient-relatives', id],
    queryFn: () => patientProfileService.getRelatives(id!),
    enabled: !!id,
  })

  // Fetch allergies
  const { data: allergiesData, refetch: refetchAllergies } = useQuery({
    queryKey: ['patient-allergies', id],
    queryFn: () => patientProfileService.getAllergies(id!),
    enabled: !!id,
  })

  // Fetch documents
  const { data: documentsData, refetch: refetchDocuments } = useQuery({
    queryKey: ['patient-documents', id],
    queryFn: () => patientProfileService.getDocuments(id!),
    enabled: !!id,
  })

  // Fetch questionnaires
  const { data: questionnairesData, refetch: refetchQuestionnaires } = useQuery({
    queryKey: ['patient-questionnaires', id],
    queryFn: () => patientProfileService.getQuestionnaires(id!),
    enabled: !!id,
  })

  // Fetch deposit transactions
  const { data: depositTxData, refetch: refetchDepositTx } = useQuery({
    queryKey: ['patient-deposit-tx', id],
    queryFn: () => patientProfileService.getDepositTransactions(id!),
    enabled: !!id,
  })

  // Fetch death info
  const { data: deathInfo } = useQuery({
    queryKey: ['patient-death-info', id],
    queryFn: () => patientProfileService.getDeathInfo(id!),
    enabled: !!id,
  })

  // Doctors list
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors-list'],
    queryFn: () => staffService.listDoctors(),
  })
  const doctorsList = doctorsData?.data || []

  // Services list
  const { data: servicesData } = useQuery({
    queryKey: ['services-list'],
    queryFn: () => referenceService.list(),
  })
  const servicesList = servicesData || []

  // --- Mutations ---
  const updatePatientMutation = useMutation({
    mutationFn: (data: any) => patientService.update(id!, data),
    onSuccess: () => {
      message.success("Bemor ma'lumotlari yangilandi")
      setEditModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['patient', id] })
    },
    onError: () => message.error('Xatolik yuz berdi'),
  })

  const createContactMutation = useMutation({
    mutationFn: (data: any) => patientProfileService.createContact(id!, data),
    onSuccess: () => {
      message.success('Aloqa qo\'shildi')
      setContactModalOpen(false)
      contactForm.resetFields()
      refetchContacts()
    },
    onError: () => message.error('Xatolik yuz berdi'),
  })

  const deleteContactMutation = useMutation({
    mutationFn: (contactId: string) => patientProfileService.deleteContact(id!, contactId),
    onSuccess: () => {
      message.success('Aloqa o\'chirildi')
      refetchContacts()
    },
    onError: () => message.error('Xatolik yuz berdi'),
  })

  const createRelativeMutation = useMutation({
    mutationFn: (data: any) => patientProfileService.createRelative(id!, data),
    onSuccess: () => {
      message.success('Qarindosh qo\'shildi')
      setRelativeModalOpen(false)
      relativeForm.resetFields()
      refetchRelatives()
    },
    onError: () => message.error('Xatolik yuz berdi'),
  })

  const deleteRelativeMutation = useMutation({
    mutationFn: (relativeId: string) => patientProfileService.deleteRelative(id!, relativeId),
    onSuccess: () => {
      message.success('Qarindosh o\'chirildi')
      refetchRelatives()
    },
    onError: () => message.error('Xatolik yuz berdi'),
  })

  const createAllergyMutation = useMutation({
    mutationFn: (data: any) => patientProfileService.createAllergy(id!, data),
    onSuccess: () => {
      message.success('Allergiya qo\'shildi')
      setAllergyModalOpen(false)
      allergyForm.resetFields()
      refetchAllergies()
    },
    onError: () => message.error('Xatolik yuz berdi'),
  })

  const deleteAllergyMutation = useMutation({
    mutationFn: (allergyId: string) => patientProfileService.deleteAllergy(id!, allergyId),
    onSuccess: () => {
      message.success('Allergiya o\'chirildi')
      refetchAllergies()
    },
    onError: () => message.error('Xatolik yuz berdi'),
  })

  const createDocumentMutation = useMutation({
    mutationFn: (data: any) => patientProfileService.createDocument(id!, data),
    onSuccess: () => {
      message.success('Hujjat qo\'shildi')
      setDocumentModalOpen(false)
      documentForm.resetFields()
      refetchDocuments()
    },
    onError: () => message.error('Xatolik yuz berdi'),
  })

  const deleteDocumentMutation = useMutation({
    mutationFn: (docId: string) => patientProfileService.deleteDocument(id!, docId),
    onSuccess: () => {
      message.success('Hujjat o\'chirildi')
      refetchDocuments()
    },
    onError: () => message.error('Xatolik yuz berdi'),
  })

  const createDepositTxMutation = useMutation({
    mutationFn: (data: any) => patientProfileService.createDepositTransaction(id!, data),
    onSuccess: () => {
      message.success('Depozit operatsiyasi bajarildi')
      setDepositModalOpen(false)
      depositForm.resetFields()
      refetchDepositTx()
      queryClient.invalidateQueries({ queryKey: ['patient', id] })
    },
    onError: () => message.error('Xatolik yuz berdi'),
  })

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
      message.success('Qabul muvaffaqiyatli yaratildi!')
      setApptModalOpen(false)
      apptForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['patient-appointments', id] })
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.error || 'Qabul yaratishda xatolik')
    },
  })

  // Print patient passport
  const handlePrintPassport = () => {
    window.print()
  }

  if (patientLoading) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#8c8c8c' }}>Bemor ma'lumotlari yuklanmoqda...</div>
      </div>
    )
  }

  if (!patient) {
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

  // Today's appointments
  const todayAppts = (appointmentsData?.data || []).filter((a: any) =>
    a.appointment_date === dayjs().format('YYYY-MM-DD')
  )

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

  const allergySeverityColor = (severity?: string) => {
    switch (severity) {
      case 'life_threatening': return 'red'
      case 'severe': return 'orange'
      case 'moderate': return 'gold'
      default: return 'green'
    }
  }

  const allergySeverityText = (severity?: string) => {
    switch (severity) {
      case 'life_threatening': return 'Hayotiy xavfli'
      case 'severe': return 'Og\'ir'
      case 'moderate': return 'O\'rta'
      case 'mild': return 'Yengil'
      default: return severity || '—'
    }
  }

  const allergyTypeText = (type?: string) => {
    switch (type) {
      case 'drug': return 'Dori'
      case 'food': return 'Oziq-ovqat'
      case 'environmental': return 'Atrof-muhit'
      default: return type || 'Boshqa'
    }
  }

  // History table columns
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

  // Deposit transaction columns
  const depositTxColumns = [
    { title: 'Sana', dataIndex: 'created_at', key: 'created_at', render: (d: string) => formatDate(d) },
    { title: 'Turi', dataIndex: 'transaction_type', key: 'transaction_type', render: (t: string) => {
      const colors: Record<string, string> = { deposit: 'green', withdrawal: 'red', refund: 'cyan', transfer: 'purple' }
      return <Tag color={colors[t] || 'default'}>{t}</Tag>
    }},
    { title: 'Summa', dataIndex: 'amount', key: 'amount', render: (a: number) => `${a.toLocaleString()} UZS` },
    { title: 'Qoldiq', dataIndex: 'balance_after', key: 'balance_after', render: (b: number) => `${b.toLocaleString()} UZS` },
    { title: 'To\'lov usuli', dataIndex: 'payment_method', key: 'payment_method', render: (m: string) => m || '—' },
    { title: 'Izoh', dataIndex: 'description', key: 'description', render: (d: string) => d || '—' },
  ]

  // Documents columns
  const documentColumns = [
    { title: 'Turi', dataIndex: 'document_type', key: 'document_type' },
    { title: 'Raqam', dataIndex: 'document_number', key: 'document_number', render: (n: string) => n || '—' },
    { title: 'Berilgan', dataIndex: 'issued_by', key: 'issued_by', render: (b: string) => b || '—' },
    { title: 'Amal qilish', dataIndex: 'expiry_date', key: 'expiry_date', render: (d: string) => d ? formatDate(d) : '—' },
    { title: 'Asosiy', dataIndex: 'is_primary', key: 'is_primary', render: (p: boolean) => p ? <Tag color="gold">Ha</Tag> : 'Yo\'q' },
    { title: 'Tasdiqlangan', dataIndex: 'is_verified', key: 'is_verified', render: (v: boolean) => v ? <Tag color="green">Ha</Tag> : <Tag color="default">Yo\'q</Tag> },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: any, record: any) => (
        <Popconfirm title="Hujjatni o'chirish?" onConfirm={() => deleteDocumentMutation.mutate(record.id)}>
          <Button type="link" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ]

  // Contacts columns
  const contactColumns = [
    { title: 'Ism', dataIndex: 'contact_name', key: 'contact_name' },
    { title: 'Qarindoshlik', dataIndex: 'relationship', key: 'relationship', render: (r: string) => r || '—' },
    { title: 'Telefon', dataIndex: 'phone', key: 'phone', render: (p: string) => p || '—' },
    { title: 'Email', dataIndex: 'email', key: 'email', render: (e: string) => e || '—' },
    { title: 'Manzil', dataIndex: 'address', key: 'address', render: (a: string) => a || '—' },
    {
      title: '',
      key: 'badges',
      width: 100,
      render: (_: any, record: any) => (
        <Space>
          {record.is_emergency && <Tag color="red">Shoshilinch</Tag>}
          {record.is_primary && <Tag color="gold">Asosiy</Tag>}
        </Space>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: any, record: any) => (
        <Popconfirm title="Aloqani o'chirish?" onConfirm={() => deleteContactMutation.mutate(record.id)}>
          <Button type="link" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ]

  // Relatives columns
  const relativeColumns = [
    { title: 'Ism', dataIndex: 'relative_name', key: 'relative_name' },
    { title: 'Qarindoshlik', dataIndex: 'relationship', key: 'relationship' },
    { title: 'Tug\'ilgan', dataIndex: 'birth_date', key: 'birth_date', render: (d: string) => d ? formatDate(d) : '—' },
    { title: 'Telefon', dataIndex: 'phone', key: 'phone', render: (p: string) => p || '—' },
    { title: 'Kasb', dataIndex: 'occupation', key: 'occupation', render: (o: string) => o || '—' },
    {
      title: '',
      key: 'badges',
      width: 140,
      render: (_: any, record: any) => (
        <Space>
          {record.is_next_of_kin && <Tag color="blue">Yaqin qarindosh</Tag>}
          {record.is_emergency_contact && <Tag color="red">Shoshilinch</Tag>}
        </Space>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: any, record: any) => (
        <Popconfirm title="Qarindoshni o'chirish?" onConfirm={() => deleteRelativeMutation.mutate(record.id)}>
          <Button type="link" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ]

  // Allergies columns
  const allergyColumns = [
    { title: 'Allergen', dataIndex: 'allergen', key: 'allergen' },
    { title: 'Turi', dataIndex: 'allergen_type', key: 'allergen_type', render: (t: string) => allergyTypeText(t) },
    { title: 'Og\'irlik', dataIndex: 'severity', key: 'severity', render: (s: string) => <Tag color={allergySeverityColor(s)}>{allergySeverityText(s)}</Tag> },
    { title: 'Reaksiya', dataIndex: 'reaction', key: 'reaction', render: (r: string) => r || '—' },
    { title: 'Boshlanish', dataIndex: 'onset_date', key: 'onset_date', render: (d: string) => d ? formatDate(d) : '—' },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: any, record: any) => (
        <Popconfirm title="Allergiyani o'chirish?" onConfirm={() => deleteAllergyMutation.mutate(record.id)}>
          <Button type="link" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ]

  // Questionnaire columns
  const questionnaireColumns = [
    { title: 'Nomi', dataIndex: 'questionnaire_name', key: 'questionnaire_name', render: (n: string) => n || '—' },
    { title: 'Turi', dataIndex: 'questionnaire_type', key: 'questionnaire_type' },
    { title: 'Ball', dataIndex: 'score', key: 'score', render: (s: number) => s ?? '—' },
    { title: 'Xavf darajasi', dataIndex: 'risk_level', key: 'risk_level', render: (r: string) => r ? <Tag color={r === 'high' ? 'red' : r === 'medium' ? 'orange' : 'green'}>{r}</Tag> : '—' },
    { title: 'Tugallangan', dataIndex: 'completed_at', key: 'completed_at', render: (d: string) => d ? formatDate(d) : <Tag color="default">Davom etmoqda</Tag> },
    { title: 'Kritik', dataIndex: 'is_critical', key: 'is_critical', render: (c: boolean) => c ? <Tag color="red">Ha</Tag> : 'Yo\'q' },
  ]

  // Tab definitions
  const tabItems = [
    // A) Main Information
    {
      key: 'info',
      label: <span><UserOutlined /> Shaxsiy ma'lumotlar</span>,
      children: (
        <Row gutter={24}>
          <Col span={16}>
            <div id="patient-passport-print">
              <Card
                style={{
                  background: 'linear-gradient(135deg, #1a2a4a 0%, #0d1a30 100%)',
                  border: '2px solid rgba(212,175,55,0.4)',
                  borderRadius: 16,
                  marginBottom: 16,
                }}
                bodyStyle={{ padding: 0 }}
              >
                <div style={{ height: 6, background: 'linear-gradient(90deg, #d4af37, #f5d560, #d4af37)', marginBottom: 20 }} />
                <div style={{ padding: '0 24px 24px' }}>
                  <Row gutter={24} align="middle">
                    <Col span={5} style={{ textAlign: 'center' }}>
                      <div style={{
                        width: 90, height: 110, borderRadius: 8,
                        background: 'rgba(212,175,55,0.1)',
                        border: '1px solid rgba(212,175,55,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 8px',
                      }}>
                        <UserOutlined style={{ fontSize: 40, color: 'rgba(212,175,55,0.5)' }} />
                      </div>
                      <div style={{
                        width: 70, height: 70, border: '1px solid rgba(212,175,55,0.2)',
                        borderRadius: 4, margin: '0 auto',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <QrcodeOutlined style={{ fontSize: 32, color: 'rgba(212,175,55,0.3)' }} />
                      </div>
                    </Col>
                    <Col span={19}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 11, color: '#d4af37', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>
                            Tibbiy Pasport
                          </div>
                          <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: '#d4af37', letterSpacing: 1 }}>
                            {patientData.med_id || '—'}
                          </div>
                          <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
                            Viloyat: {patientData.passport_region_code || '—'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <Tag color={patientData.is_active ? 'success' : 'error'}>
                            {patientData.is_active ? 'FAOL' : 'NOFAOL'}
                          </Tag>
                        </div>
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 16, lineHeight: 1.2 }}>
                        {patientData.last_name} {patientData.first_name} {patientData.patronymic || ''}
                      </div>
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
                <div style={{
                  padding: '12px 24px', borderTop: '1px solid rgba(212,175,55,0.15)',
                  background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between',
                }}>
                  <Text style={{ color: '#8c8c8c', fontSize: 12 }}>
                    Ro'yxatga olingan: {formatDate(patientData.created_at)}
                  </Text>
                  <Text style={{ color: '#8c8c8c', fontSize: 12 }}>ID: {patientData.id?.slice(0, 8)}...</Text>
                </div>
              </Card>
            </div>

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
              {/* B) Identification Documents */}
              <Button icon={<FileProtectOutlined />} onClick={() => setActiveTab('documents')}>
                Hujjatlar
              </Button>
            </Space>
          </Col>

          <Col span={8}>
            {/* Deposit */}
            <Card style={{
              background: 'linear-gradient(135deg, #1a2a4a 0%, #0d1a30 100%)',
              border: '1px solid rgba(212,175,55,0.2)',
              borderRadius: 12, marginBottom: 16,
            }} bodyStyle={{ padding: 16 }}>
              <Statistic
                title={<span style={{ color: '#8c8c8c', fontSize: 12 }}>Depozit balansi</span>}
                value={patientData.deposit_balance}
                precision={0}
                prefix={<span style={{ color: patientData.deposit_balance > 0 ? '#52c41a' : '#ff4d4f' }}>UZS</span>}
                valueStyle={{ color: patientData.deposit_balance > 0 ? '#52c41a' : '#ff4d4f', fontSize: 28 }}
              />
              <Divider style={{ margin: '12px 0', borderColor: 'rgba(212,175,55,0.1)' }} />
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button block type="default" size="small"
                  onClick={() => { depositForm.setFieldsValue({ transaction_type: 'deposit' }); setDepositModalOpen(true) }}>
                  Depozit to'ldirish
                </Button>
                <Button block type="default" size="small"
                  onClick={() => { depositForm.setFieldsValue({ transaction_type: 'withdrawal' }); setDepositModalOpen(true) }}>
                  Pul olish
                </Button>
                <Button block type="link" size="small" onClick={() => setActiveTab('deposit')}>
                  Barcha operatsiyalar
                </Button>
              </Space>
            </Card>

            {/* Quick Actions */}
            <Card
              title={<span style={{ color: '#fff', fontSize: 14 }}>Tezkor amallar</span>}
              style={{ background: 'rgba(13,26,48,0.8)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 12 }}
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
                <Button
                  block icon={<HistoryOutlined />}
                  onClick={() => setActiveTab('history')}
                  style={{ textAlign: 'left' }}>
                  Qabul tarixi
                </Button>
                <Button
                  block icon={<MedicineBoxOutlined />}
                  onClick={() => navigate(`/patients/${id}/medical-card`)}
                  style={{ textAlign: 'left', borderColor: '#d4af37', color: '#d4af37' }}>
                  Tibbiy karta
                </Button>
              </Space>
            </Card>

            {/* Profile Summary */}
            {profileData && (
              <Card
                title={<span style={{ color: '#fff', fontSize: 14 }}>Tibbiy ma'lumotlar</span>}
                style={{ background: 'rgba(13,26,48,0.8)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 12, marginTop: 16 }}
                headStyle={{ borderBottom: '1px solid rgba(212,175,55,0.1)', color: '#fff' }}
                bodyStyle={{ padding: 12 }}
              >
                <Row gutter={[8, 8]}>
                  <Col span={12}>
                    <Text style={{ color: '#8c8c8c', fontSize: 11 }}>Qon guruhi</Text>
                    <div style={{ color: '#fff', fontSize: 14 }}>{profileData.blood_type || '—'} {profileData.rh_factor || ''}</div>
                  </Col>
                  <Col span={12}>
                    <Text style={{ color: '#8c8c8c', fontSize: 11 }}>Bo'yi</Text>
                    <div style={{ color: '#fff', fontSize: 14 }}>{profileData.height ? `${profileData.height} sm` : '—'}</div>
                  </Col>
                  <Col span={12}>
                    <Text style={{ color: '#8c8c8c', fontSize: 11 }}>Vazni</Text>
                    <div style={{ color: '#fff', fontSize: 14 }}>{profileData.weight ? `${profileData.weight} kg` : '—'}</div>
                  </Col>
                  <Col span={12}>
                    <Text style={{ color: '#8c8c8c', fontSize: 11 }}>Allergiya</Text>
                    <div style={{ color: '#fff', fontSize: 14 }}>{(profileData.allergies as string[])?.length > 0 ? (profileData.allergies as string[]).length + ' ta' : 'Yo\'q'}</div>
                  </Col>
                </Row>
                <Divider style={{ margin: '8px 0', borderColor: 'rgba(212,175,55,0.1)' }} />
                <Button block type="link" size="small" onClick={() => setActiveTab('medical-info')}
                  style={{ color: '#d4af37', padding: 0, textAlign: 'left' }}>
                  Barcha tibbiy ma'lumotlar
                </Button>
              </Card>
            )}
          </Col>
        </Row>
      ),
    },

    // B) Identification Documents + I) Patient Documents
    {
      key: 'documents',
      label: <span><FileProtectOutlined /> Hujjatlar</span>,
      children: (
        <Card
          title="Hujjatlar ro'yxati"
          extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setDocumentModalOpen(true)}>Yangi hujjat</Button>}
          style={{ background: 'rgba(13,26,48,0.8)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 12 }}
          headStyle={{ color: '#fff', borderBottom: '1px solid rgba(212,175,55,0.1)' }}
          bodyStyle={{ padding: 0 }}
        >
          {(documentsData?.data || []).length > 0 ? (
            <Table columns={documentColumns} dataSource={documentsData.data} rowKey="id" pagination={{ pageSize: 10 }} />
          ) : (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <FileProtectOutlined style={{ fontSize: 40, color: 'rgba(212,175,55,0.3)', marginBottom: 16 }} />
              <div style={{ color: '#8c8c8c' }}>Hujjatlar yo'q. "Yangi hujjat" tugmasini bosing.</div>
            </div>
          )}
        </Card>
      ),
    },

    // C) Registered Address + D) Actual Living Address + E) Social Information
    {
      key: 'address-social',
      label: <span><HomeOutlined /> Manzil va ijtimoiy</span>,
      children: (
        <Row gutter={16}>
          <Col span={8}>
            <Card
              title="Ro'yxatdagi manzil"
              style={{ background: 'rgba(13,26,48,0.8)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 12, height: '100%' }}
              headStyle={{ color: '#fff', borderBottom: '1px solid rgba(212,175,55,0.1)' }}
            >
              <Descriptions column={1} size="small" labelStyle={{ color: '#8c8c8c' }} contentStyle={{ color: '#fff' }}>
                <Descriptions.Item label="Viloyat">{patientData.passport_region_code || '—'}</Descriptions.Item>
                <Descriptions.Item label="Manzil">{patientData.address || '—'}</Descriptions.Item>
                <Descriptions.Item label="Pasport">{patientData.passport || '—'}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col span={8}>
            <Card
              title="Yashash manzili"
              style={{ background: 'rgba(13,26,48,0.8)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 12, height: '100%' }}
              headStyle={{ color: '#fff', borderBottom: '1px solid rgba(212,175,55,0.1)' }}
            >
              <div style={{ color: '#8c8c8c', textAlign: 'center', padding: '40px 0' }}>
                <HomeOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                <div>Yashash manzili kiritilmagan</div>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card
              title="Ijtimoiy ma'lumotlar"
              style={{ background: 'rgba(13,26,48,0.8)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 12, height: '100%' }}
              headStyle={{ color: '#fff', borderBottom: '1px solid rgba(212,175,55,0.1)' }}
            >
              <Descriptions column={1} size="small" labelStyle={{ color: '#8c8c8c' }} contentStyle={{ color: '#fff' }}>
                <Descriptions.Item label="Fuqaroligi">{patientData.citizenship || '—'}</Descriptions.Item>
                <Descriptions.Item label="Telefon">{patientData.phone || '—'}</Descriptions.Item>
                <Descriptions.Item label="Telefon 2">{patientData.phone_2 || '—'}</Descriptions.Item>
                <Descriptions.Item label="Email">{patientData.email || '—'}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      ),
    },

    // F) Basic Medical Information
    {
      key: 'medical-info',
      label: <span><MedicineBoxOutlined /> Tibbiy ma'lumotlar</span>,
      children: (
        <Card
          title="Tibbiy ma'lumotlar"
          extra={<Button icon={<EditOutlined />} onClick={() => setEditModalOpen(true)}>Tahrirlash</Button>}
          style={{ background: 'rgba(13,26,48,0.8)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 12 }}
          headStyle={{ color: '#fff', borderBottom: '1px solid rgba(212,175,55,0.1)' }}
        >
          {profileData ? (
            <Row gutter={[24, 16]}>
              <Col span={6}>
                <Card style={{ background: 'rgba(26,42,74,0.6)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 8 }} bodyStyle={{ textAlign: 'center', padding: 16 }}>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>Qon guruhi</div>
                  <div style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>{profileData.blood_type || '—'}</div>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>{profileData.rh_factor || ''}</div>
                </Card>
              </Col>
              <Col span={6}>
                <Card style={{ background: 'rgba(26,42,74,0.6)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 8 }} bodyStyle={{ textAlign: 'center', padding: 16 }}>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>Bo'yi</div>
                  <div style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>{profileData.height ? `${profileData.height}` : '—'}</div>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>sm</div>
                </Card>
              </Col>
              <Col span={6}>
                <Card style={{ background: 'rgba(26,42,74,0.6)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 8 }} bodyStyle={{ textAlign: 'center', padding: 16 }}>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>Vazni</div>
                  <div style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>{profileData.weight ? `${profileData.weight}` : '—'}</div>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>kg</div>
                </Card>
              </Col>
              <Col span={6}>
                <Card style={{ background: 'rgba(26,42,74,0.6)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 8 }} bodyStyle={{ textAlign: 'center', padding: 16 }}>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>Allergiyasi</div>
                  <div style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>{(profileData.allergies as string[])?.length || 0}</div>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>ta</div>
                </Card>
              </Col>
              <Col span={24}>
                <Descriptions column={2} size="small" labelStyle={{ color: '#8c8c8c' }} contentStyle={{ color: '#fff' }}>
                  <Descriptions.Item label="Allergiyasi">{(profileData.allergies as string[])?.join(', ') || 'Yo\'q'}</Descriptions.Item>
                  <Descriptions.Item label="Surunkali kasalliklar">{(profileData.chronic_diseases as string[])?.join(', ') || 'Yo\'q'}</Descriptions.Item>
                  <Descriptions.Item label="Nogironlik">{profileData.disabilities || 'Yo\'q'}</Descriptions.Item>
                  <Descriptions.Item label="Izoh">{profileData.notes || '—'}</Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
          ) : (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <AlertOutlined style={{ fontSize: 40, color: 'rgba(212,175,55,0.3)', marginBottom: 16 }} />
              <div style={{ color: '#8c8c8c', marginBottom: 16 }}>Tibbiy ma'lumotlar hali kiritilmagan</div>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditModalOpen(true)}>
                Tibbiy ma'lumot qo'shish
              </Button>
            </div>
          )}
        </Card>
      ),
    },

    // G) Contact Information
    {
      key: 'contacts',
      label: <span><PhoneOutlined /> Aloqalar</span>,
      children: (
        <Card
          title="Aloqalar ro'yxati"
          extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setContactModalOpen(true)}>Yangi aloqa</Button>}
          style={{ background: 'rgba(13,26,48,0.8)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 12 }}
          headStyle={{ color: '#fff', borderBottom: '1px solid rgba(212,175,55,0.1)' }}
          bodyStyle={{ padding: 0 }}
        >
          {(contactsData?.data || []).length > 0 ? (
            <Table columns={contactColumns} dataSource={contactsData.data} rowKey="id" pagination={{ pageSize: 10 }} />
          ) : (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <PhoneOutlined style={{ fontSize: 40, color: 'rgba(212,175,55,0.3)', marginBottom: 16 }} />
              <div style={{ color: '#8c8c8c', marginBottom: 16 }}>Aloqa ma'lumotlari yo'q</div>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setContactModalOpen(true)}>
                Aloqa qo'shish
              </Button>
            </div>
          )}
        </Card>
      ),
    },

    // H) Relatives
    {
      key: 'relatives',
      label: <span><TeamOutlined /> Qarindoshlar</span>,
      children: (
        <Card
          title="Qarindoshlar ro'yxati"
          extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setRelativeModalOpen(true)}>Yangi qarindosh</Button>}
          style={{ background: 'rgba(13,26,48,0.8)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 12 }}
          headStyle={{ color: '#fff', borderBottom: '1px solid rgba(212,175,55,0.1)' }}
          bodyStyle={{ padding: 0 }}
        >
          {(relativesData?.data || []).length > 0 ? (
            <Table columns={relativeColumns} dataSource={relativesData.data} rowKey="id" pagination={{ pageSize: 10 }} />
          ) : (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <TeamOutlined style={{ fontSize: 40, color: 'rgba(212,175,55,0.3)', marginBottom: 16 }} />
              <div style={{ color: '#8c8c8c', marginBottom: 16 }}>Qarindoshlar ro'yxati bo'sh</div>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setRelativeModalOpen(true)}>
                Qarindosh qo'shish
              </Button>
            </div>
          )}
        </Card>
      ),
    },

    // J) Surveys / Questionnaires
    {
      key: 'questionnaires',
      label: <span><FileTextOutlined /> So'rovnomalar</span>,
      children: (
        <Card
          title="So'rovnomalar ro'yxati"
          style={{ background: 'rgba(13,26,48,0.8)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 12 }}
          headStyle={{ color: '#fff', borderBottom: '1px solid rgba(212,175,55,0.1)' }}
          bodyStyle={{ padding: 0 }}
        >
          {(questionnairesData?.data || []).length > 0 ? (
            <Table columns={questionnaireColumns} dataSource={questionnairesData.data} rowKey="id" pagination={{ pageSize: 10 }} />
          ) : (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <FileTextOutlined style={{ fontSize: 40, color: 'rgba(212,175,55,0.3)', marginBottom: 16 }} />
              <div style={{ color: '#8c8c8c' }}>So'rovnomalar yo'q</div>
            </div>
          )}
        </Card>
      ),
    },

    // K) Allergies
    {
      key: 'allergies',
      label: <span><WarningOutlined /> Allergiyalar</span>,
      children: (
        <Card
          title="Allergiyalar ro'yxati"
          extra={<Button danger type="primary" icon={<PlusOutlined />} onClick={() => setAllergyModalOpen(true)}>Yangi allergiya</Button>}
          style={{ background: 'rgba(13,26,48,0.8)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 12 }}
          headStyle={{ color: '#fff', borderBottom: '1px solid rgba(212,175,55,0.1)' }}
          bodyStyle={{ padding: 0 }}
        >
          {(allergiesData?.data || []).length > 0 ? (
            <>
              <Alert type="warning" message="Allergiyali bemor — diqqat bilan davolash rejimini tanlang!" style={{ margin: 16 }} showIcon />
              <Table columns={allergyColumns} dataSource={allergiesData.data} rowKey="id" pagination={{ pageSize: 10 }} />
            </>
          ) : (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <SafetyOutlined style={{ fontSize: 40, color: 'rgba(82,196,26,0.3)', marginBottom: 16 }} />
              <div style={{ color: '#8c8c8c', marginBottom: 16 }}>Allergiyali ma'lumotlar yo'q. Bu bemor uchun allergiya testi o'tkazilmagan.</div>
              <Button danger type="primary" icon={<PlusOutlined />} onClick={() => setAllergyModalOpen(true)}>
                Allergiya qo'shish
              </Button>
            </div>
          )}
        </Card>
      ),
    },

    // L) Deposit
    {
      key: 'deposit',
      label: <span><BankOutlined /> Depozit</span>,
      children: (
        <Card
          title="Depozit operatsiyalari"
          extra={
            <Space>
              <Button type="primary" icon={<PlusCircleOutlined />} onClick={() => { depositForm.setFieldsValue({ transaction_type: 'deposit' }); setDepositModalOpen(true) }}>
                To'ldirish
              </Button>
              <Button danger icon={<BankOutlined />} onClick={() => { depositForm.setFieldsValue({ transaction_type: 'withdrawal' }); setDepositModalOpen(true) }}>
                Pul olish
              </Button>
            </Space>
          }
          style={{ background: 'rgba(13,26,48,0.8)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 12 }}
          headStyle={{ color: '#fff', borderBottom: '1px solid rgba(212,175,55,0.1)' }}
          bodyStyle={{ padding: 0 }}
        >
          <div style={{ padding: 16 }}>
            <Statistic
              title="Joriy depozit balansi"
              value={patientData.deposit_balance}
              precision={0}
              prefix="UZS "
              valueStyle={{ color: patientData.deposit_balance > 0 ? '#52c41a' : '#ff4d4f', fontSize: 32 }}
            />
          </div>
          {(depositTxData?.data || []).length > 0 ? (
            <Table columns={depositTxColumns} dataSource={depositTxData.data} rowKey="id" pagination={{ pageSize: 15 }} />
          ) : (
            <div style={{ padding: 32, textAlign: 'center', color: '#8c8c8c' }}>Depozit operatsiyalari yo'q</div>
          )}
        </Card>
      ),
    },

    // M) Death Information
    {
      key: 'death',
      label: <span><CloseCircleOutlined /> Vafot ma'lumotlari</span>,
      children: (
        <Card
          title="Vafot haqida ma'lumot"
          style={{ background: 'rgba(13,26,48,0.8)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 12 }}
          headStyle={{ color: '#fff', borderBottom: '1px solid rgba(212,175,55,0.1)' }}
        >
          {deathInfo ? (
            <Descriptions column={2} size="small" labelStyle={{ color: '#8c8c8c' }} contentStyle={{ color: '#fff' }}>
              <Descriptions.Item label="Vafot sanasi">{deathInfo.death_date ? formatDate(deathInfo.death_date) : '—'}</Descriptions.Item>
              <Descriptions.Item label="Vafot joyi">{deathInfo.death_place || '—'}</Descriptions.Item>
              <Descriptions.Item label="Sababi">{deathInfo.death_cause || '—'}</Descriptions.Item>
              <Descriptions.Item label="ICD-10">{deathInfo.icd_code ? `${deathInfo.icd_code} — ${deathInfo.icd_name}` : '—'}</Descriptions.Item>
              <Descriptions.Item label="Guvohnoma raqami">{deathInfo.certificate_number || '—'}</Descriptions.Item>
              <Descriptions.Item label="Tasdiqlangan">{deathInfo.is_verified ? 'Ha' : 'Yo\'q'}</Descriptions.Item>
            </Descriptions>
          ) : (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <UserSwitchOutlined style={{ fontSize: 40, color: 'rgba(212,175,55,0.3)', marginBottom: 16 }} />
              <div style={{ color: '#8c8c8c' }}>Vafot haqida ma'lumot mavjud emas</div>
            </div>
          )}
        </Card>
      ),
    },

    // Appointment History
    {
      key: 'history',
      label: <span><HistoryOutlined /> Qabul tarixi</span>,
      children: (
        <Card
          style={{ background: 'rgba(13,26,48,0.8)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 12 }}
          bodyStyle={{ padding: 0 }}
        >
          {(appointmentsData?.data || []).length > 0 ? (
            <Table columns={historyColumns} dataSource={appointmentsData.data} rowKey="id" pagination={{ pageSize: 15 }} />
          ) : (
            <div style={{ padding: 48 }}><Empty description="Qabul tarixi yo'q" /></div>
          )}
        </Card>
      ),
    },
  ]

  return (
    <div style={{ padding: 0 }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #patient-passport-print, #patient-passport-print * { visibility: visible; }
          #patient-passport-print {
            position: absolute; left: 0; top: 0; width: 100%;
            background: #fff !important; border: 2px solid #000 !important;
            color: #000 !important;
          }
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
        <span style={{ fontFamily: 'monospace', color: '#d4af37', fontSize: 13, fontWeight: 600, marginRight: 12 }}>
          {patientData.med_id || '—'}
        </span>
        <Title level={3} style={{ color: '#fff', margin: 0, display: 'inline' }}>
          {patientData.last_name} {patientData.first_name} {patientData.patronymic || ''}
        </Title>
        <Tag color={patientData.is_active ? 'success' : 'error'} style={{ marginLeft: 12 }}>
          {patientData.is_active ? 'Faol' : 'Nofaol'}
        </Tag>
        {/* Open Medical Card button */}
        <Button
          type="primary"
          icon={<MedicineBoxOutlined />}
          onClick={() => navigate(`/patients/${id}/medical-card`)}
          style={{ marginLeft: 16, background: '#d4af37', borderColor: '#d4af37', color: '#000' }}
        >
          Tibbiy karta
        </Button>
      </div>

      <div style={{ padding: 24 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} tabBarStyle={{ color: '#8c8c8c' }} />
      </div>

      {/* Edit Patient Modal */}
      <Modal
        title="Bemor ma'lumotlarini tahrirlash"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={updatePatientMutation.isPending}
        styles={{ content: { background: 'rgba(13,26,48,0.95)' }, header: { background: 'rgba(13,26,48,0.95)', color: '#fff' } }}
      >
        <Form form={form} layout="vertical" onFinish={(values) => updatePatientMutation.mutate(values)}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Familiya" name="last_name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ism" name="first_name" rules={[{ required: true }]}>
                <Input />
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
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item label="Pasport" name="passport">
            <Input placeholder="AA1234567" />
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
            <Select placeholder="Shifokorni tanlang" showSearch
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={doctorsList.map((d: any) => ({
                value: d.id,
                label: `${d.last_name} ${d.first_name}${d.specialty ? ' — ' + d.specialty : ''}${d.cabinet ? ' — Kabinet ' + d.cabinet : ''}`,
              }))} />
          </Form.Item>
          <Form.Item label="Xizmat" name="service_id">
            <Select placeholder="Xizmatni tanlang (ixtiyoriy)" allowClear showSearch
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={servicesList.map((s: any) => ({ value: s.id, label: s.name }))} />
          </Form.Item>
          <Form.Item label="Sana" name="appointment_date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Vaqt (HH:MM)" name="start_time" rules={[{ required: true }]}>
                <Input placeholder="09:00" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Kabinet" name="cabinet">
                <Input placeholder="101" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Izoh" name="notes">
            <TextArea rows={2} placeholder="Qo'shimcha ma'lumot..." />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={createApptMutation.isPending}
            style={{ background: '#d4af37', borderColor: '#d4af37', color: '#000', marginTop: 8 }}>
            Qabul yaratish
          </Button>
        </Form>
      </Modal>

      {/* Contact Modal */}
      <Modal
        title="Yangi aloqa qo'shish"
        open={contactModalOpen}
        onCancel={() => { setContactModalOpen(false); contactForm.resetFields() }}
        footer={null}
        width={500}
        styles={{ content: { background: 'rgba(13,26,48,0.95)' }, header: { background: 'rgba(13,26,48,0.95)', color: '#fff' } }}
      >
        <Form form={contactForm} layout="vertical" onFinish={(values) => createContactMutation.mutate(values)}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Ism" name="contact_name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Qarindoshlik" name="relationship">
                <Select placeholder="Tanlang" options={[
                  { value: 'ota', label: 'Ota' },
                  { value: 'ona', label: 'Ona' },
                  { value: 'aka-uka', label: 'Aka-uka' },
                  { value: 'opa-singil', label: 'Opa-singil' },
                  { value: 'turboshqa', label: 'Turboshqa' },
                  { value: 'turmaslaha', label: 'Turmaslaha' },
                  { value: 'bola', label: 'Bola' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Telefon" name="phone">
                <Input placeholder="+998..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Email" name="email">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Manzil" name="address">
            <TextArea rows={2} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={createContactMutation.isPending}>
            Qo'shish
          </Button>
        </Form>
      </Modal>

      {/* Relative Modal */}
      <Modal
        title="Yangi qarindosh qo'shish"
        open={relativeModalOpen}
        onCancel={() => { setRelativeModalOpen(false); relativeForm.resetFields() }}
        footer={null}
        width={500}
        styles={{ content: { background: 'rgba(13,26,48,0.95)' }, header: { background: 'rgba(13,26,48,0.95)', color: '#fff' } }}
      >
        <Form form={relativeForm} layout="vertical" onFinish={(values) => createRelativeMutation.mutate(values)}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Ism" name="relative_name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Qarindoshlik" name="relationship" rules={[{ required: true }]}>
                <Select placeholder="Tanlang" options={[
                  { value: 'ota', label: 'Ota' },
                  { value: 'ona', label: 'Ona' },
                  { value: 'aka-uka', label: 'Aka-uka' },
                  { value: 'opa-singil', label: 'Opa-singil' },
                  { value: 'turboshqa', label: 'Turboshqa' },
                  { value: 'turmaslaha', label: 'Turmaslaha' },
                  { value: 'bola', label: 'Bola' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Telefon" name="phone">
                <Input placeholder="+998..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Kasb" name="occupation">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Manzil" name="address">
            <TextArea rows={2} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={createRelativeMutation.isPending}>
            Qo'shish
          </Button>
        </Form>
      </Modal>

      {/* Allergy Modal */}
      <Modal
        title="Yangi allergiya qo'shish"
        open={allergyModalOpen}
        onCancel={() => { setAllergyModalOpen(false); allergyForm.resetFields() }}
        footer={null}
        width={500}
        styles={{ content: { background: 'rgba(13,26,48,0.95)' }, header: { background: 'rgba(13,26,48,0.95)', color: '#fff' } }}
      >
        <Form form={allergyForm} layout="vertical" onFinish={(values) => createAllergyMutation.mutate(values)}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Allergen" name="allergen" rules={[{ required: true }]}>
                <Input placeholder="Masalan: Penicillin" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Turi" name="allergen_type">
                <Select placeholder="Tanlang" options={[
                  { value: 'drug', label: 'Dori' },
                  { value: 'food', label: 'Oziq-ovqat' },
                  { value: 'environmental', label: 'Atrof-muhit' },
                  { value: 'other', label: 'Boshqa' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Og'irlik" name="severity">
                <Select placeholder="Tanlang" options={[
                  { value: 'mild', label: 'Yengil' },
                  { value: 'moderate', label: 'O\'rta' },
                  { value: 'severe', label: 'Og\'ir' },
                  { value: 'life_threatening', label: 'Hayotiy xavfli' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Boshlanish sanasi" name="onset_date">
                <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Reaksiya" name="reaction">
            <Input.TextArea rows={2} placeholder="Allergik reaksiya tavsifi..." />
          </Form.Item>
          <Form.Item label="Izoh" name="notes">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Button danger type="primary" htmlType="submit" block loading={createAllergyMutation.isPending}>
            Allergiyani qo'shish
          </Button>
        </Form>
      </Modal>

      {/* Document Modal */}
      <Modal
        title="Yangi hujjat qo'shish"
        open={documentModalOpen}
        onCancel={() => { setDocumentModalOpen(false); documentForm.resetFields() }}
        footer={null}
        width={500}
        styles={{ content: { background: 'rgba(13,26,48,0.95)' }, header: { background: 'rgba(13,26,48,0.95)', color: '#fff' } }}
      >
        <Form form={documentForm} layout="vertical" onFinish={(values) => createDocumentMutation.mutate(values)}>
          <Form.Item label="Hujjat turi" name="document_type" rules={[{ required: true }]}>
            <Select placeholder="Tanlang" options={[
              { value: 'passport', label: 'Pasport' },
              { value: 'birth_certificate', label: 'Tug\'ilgan guvohnomasi' },
              { value: 'insurance', label: 'Sug\'urta polisi' },
              { value: 'medical_certificate', label: 'Tibbiy guvohnoma' },
              { value: 'driver_license', label: 'Haydovchilik guvohnomasi' },
              { value: 'other', label: 'Boshqa' },
            ]} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Hujjat raqami" name="document_number">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Beruvchi" name="issued_by">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Amal qilish muddati" name="expiry_date">
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={createDocumentMutation.isPending}>
            Hujjatni qo'shish
          </Button>
        </Form>
      </Modal>

      {/* Deposit Transaction Modal */}
      <Modal
        title={depositForm.getFieldValue('transaction_type') === 'withdrawal' ? 'Depozitdan pul olish' : 'Depozit to\'ldirish'}
        open={depositModalOpen}
        onCancel={() => { setDepositModalOpen(false); depositForm.resetFields() }}
        footer={null}
        width={400}
        styles={{ content: { background: 'rgba(13,26,48,0.95)' }, header: { background: 'rgba(13,26,48,0.95)', color: '#fff' } }}
      >
        <Form form={depositForm} layout="vertical" onFinish={(values) => createDepositTxMutation.mutate(values)}>
          <Form.Item label="Summa" name="amount" rules={[{ required: true }]}>
            <Input type="number" placeholder="0" suffix="UZS" />
          </Form.Item>
          <Form.Item label="To'lov usuli" name="payment_method">
            <Select placeholder="Tanlang" options={[
              { value: 'cash', label: 'Naqd' },
              { value: 'card', label: 'Karta' },
              { value: 'click', label: 'Click' },
              { value: 'payme', label: 'Payme' },
            ]} />
          </Form.Item>
          <Form.Item label="Izoh" name="description">
            <TextArea rows={2} />
          </Form.Item>
          <Button
            type="primary" htmlType="submit" block loading={createDepositTxMutation.isPending}
            style={{ background: depositForm.getFieldValue('transaction_type') === 'withdrawal' ? '#ff4d4f' : '#52c41a', border: 'none' }}>
            {depositForm.getFieldValue('transaction_type') === 'withdrawal' ? 'Pul olish' : 'To\'ldirish'}
          </Button>
        </Form>
      </Modal>
    </div>
  )
}
