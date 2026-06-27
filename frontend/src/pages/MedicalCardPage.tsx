import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Typography, Card, Tabs, Table, Tag, Button, Space, Modal, Form,
  Input, Select, message, Row, Col, Descriptions, Divider, Empty,
  Spin, Alert, Badge, Tooltip, Popconfirm, InputNumber, DatePicker
} from 'antd'
import {
  ArrowLeftOutlined, UserOutlined, HeartOutlined, MedicineBoxOutlined,
  ExperimentOutlined, FileTextOutlined, PlusOutlined, ReloadOutlined,
  BugOutlined, ExperimentOutlined as LabOutlined, ScanOutlined,
  MedicineBoxOutlined as PillOutlined, ThunderboltOutlined, CalendarOutlined,
  PhoneOutlined, WarningOutlined, SaveOutlined, CheckCircleOutlined,
  StopOutlined, ClockCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { formatDate } from '../i18n/uz'
import {
  patientService, medicalCardService, appointmentService, patientProfileService,
  referenceService, staffService
} from '../services/api'

const { Title, Text } = Typography
const { TextArea } = Input

// Tab order (8 fixed tabs)
const TAB_ORDER = [
  { key: 'current-examination', label: 'Joriy ko\'rik', icon: <FileTextOutlined /> },
  { key: 'anthropometry', label: 'Antropometriya', icon: <HeartOutlined /> },
  { key: 'diagnoses', label: 'Tashxislar', icon: <BugOutlined /> },
  { key: 'examinations', label: 'Ko\'rik natijalari', icon: <ExperimentOutlined /> },
  { key: 'analyses', label: 'Analizlar', icon: <LabOutlined /> },
  { key: 'diagnostics', label: 'Diagnostika', icon: <ScanOutlined /> },
  { key: 'prescriptions', label: 'Retseptlar', icon: <PillOutlined /> },
  { key: 'treatment', label: 'Davolash kurslari', icon: <ThunderboltOutlined /> },
]

// Helper: calculate BMI
function calcBMI(height: number | null | undefined, weight: number | null | undefined): string {
  if (!height || !weight) return '-'
  const hM = height / 100
  if (hM <= 0) return '-'
  return (weight / (hM * hM)).toFixed(1)
}

// UUID validation regex
const isValidUUID = (str: string): boolean => {
  if (!str) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// Helper: status color
const statusColor = (s: string) => {
  const map: Record<string, string> = {
    active: 'processing', completed: 'success', cancelled: 'error',
    scheduled: 'blue', waiting: 'orange', in_progress: 'cyan',
  }
  return map[s] || 'default'
}
const statusLabel = (s: string) => {
  const map: Record<string, string> = {
    active: 'Faol', completed: 'Tugallangan', cancelled: 'Bekor qilingan',
    scheduled: 'Rejalashtirilgan', waiting: 'Kutmoqda', in_progress: 'Davom etmoqda',
  }
  return map[s] || s
}

export function MedicalCardPage() {
  const { id, patientId: legacyPatientId } = useParams()
  const patientId = id || legacyPatientId
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const [activeTab, setActiveTab] = useState(() =>
    searchParams.get('tab') || 'current-examination'
  )

  // Validate appointment_id: must be a proper UUID, not placeholder text like "<appointment_id>"
  const rawAppointmentId = searchParams.get('appointment_id')
  const appointmentIdFromUrl = rawAppointmentId && isValidUUID(rawAppointmentId) ? rawAppointmentId : null

  // Track if appointment context is invalid/missing (for warning message)
  const hasInvalidAppointmentId = rawAppointmentId && !isValidUUID(rawAppointmentId)
  const hasMissingAppointmentId = !rawAppointmentId

  const tabFromUrl = searchParams.get('tab')

  const handleTabChange = (key: string) => {
    setActiveTab(key)
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('tab', key)
      return next
    })
  }

  useEffect(() => {
    if (tabFromUrl && TAB_ORDER.some(t => t.key === tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  // ============ DATA QUERIES ============

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientService.get(patientId!),
    enabled: !!patientId,
  })

  const { data: medicalCardData } = useQuery({
    queryKey: ['medicalCard', patientId],
    queryFn: async () => {
      try { return await medicalCardService.getMedicalCard(patientId!) } catch { return null }
    },
    enabled: !!patientId,
    retry: false,
  })

  const { data: profileData } = useQuery({
    queryKey: ['patientProfile', patientId],
    queryFn: async () => {
      try { return await patientProfileService.getProfile(patientId!) } catch { return null }
    },
    enabled: !!patientId,
    retry: false,
  })

  const { data: episodesData, isLoading: episodesLoading, refetch: refetchEpisodes } = useQuery({
    queryKey: ['episodes', patientId],
    queryFn: async () => {
      try { return await medicalCardService.getEpisodes(patientId!) } catch { return { data: [] } }
    },
    enabled: !!patientId,
    retry: false,
  })

  const { data: appointmentData } = useQuery({
    queryKey: ['appointmentContext', appointmentIdFromUrl],
    queryFn: async () => {
      try { return await appointmentService.get(appointmentIdFromUrl!) } catch { return null }
    },
    enabled: !!appointmentIdFromUrl,
    retry: false,
  })

  const { data: episodeByApptData, refetch: refetchEpisodeByAppt } = useQuery({
    queryKey: ['episodeByAppointment', appointmentIdFromUrl],
    queryFn: async () => {
      try { return await appointmentService.getEpisode(appointmentIdFromUrl!) } catch { return { data: null } }
    },
    enabled: !!appointmentIdFromUrl,
    retry: false,
  })

  const episodeByAppt = episodeByApptData?.data
  const episodes = episodesData?.data || []
  const activeEpisode = episodeByAppt || episodes?.[0] || null
  const selectedEpisodeId = activeEpisode?.id || null
  const hasActiveEpisode = !!activeEpisode
  const isEpisodeCompleted = activeEpisode?.status === 'completed'

  // Episode examination data - safe: returns null on error
  const { data: examinationData, refetch: refetchExam } = useQuery({
    queryKey: ['episodeExamination', selectedEpisodeId],
    queryFn: async () => {
      try { return await medicalCardService.getEpisodeExamination(selectedEpisodeId!) } catch { return null }
    },
    enabled: !!selectedEpisodeId,
    refetchInterval: false,
    retry: false,
  })

  // Episode recommendations - safe: returns [] on error
  const { data: recommendationsData } = useQuery({
    queryKey: ['episodeRecommendations', selectedEpisodeId],
    queryFn: async () => {
      try { return await medicalCardService.getEpisodeRecommendations(selectedEpisodeId!) } catch { return { data: [] } }
    },
    enabled: !!selectedEpisodeId,
    refetchInterval: false,
    retry: false,
  })

  // Episode diagnoses - safe: returns [] on error
  const { data: diagnosesData } = useQuery({
    queryKey: ['episodeDiagnoses', selectedEpisodeId],
    queryFn: async () => {
      try { return await medicalCardService.getEpisodeDiagnoses(selectedEpisodeId!) } catch { return { data: [] } }
    },
    enabled: !!selectedEpisodeId,
    refetchInterval: false,
    retry: false,
  })

  // Episode details - safe: returns null on error
  const { data: episodeDetailData } = useQuery({
    queryKey: ['episodeDetail', selectedEpisodeId],
    queryFn: async () => {
      try { return await medicalCardService.getEpisode(selectedEpisodeId!) } catch { return null }
    },
    enabled: !!selectedEpisodeId,
    refetchInterval: false,
    retry: false,
  })

  // Patient vitals history (for Anthropometry tab) - safe: returns [] on error
  const { data: vitalsHistoryData, refetch: refetchVitalsHistory } = useQuery({
    queryKey: ['patientVitalsHistory', patientId],
    queryFn: async () => {
      try { return await medicalCardService.getPatientVitalsHistory(patientId!, 50) } catch { return { data: [] } }
    },
    enabled: !!patientId && activeTab === 'anthropometry',
    retry: false,
  })

  // Doctors for episode creation - safe
  const { data: doctorsData } = useQuery({
    queryKey: ['staff-doctors'],
    queryFn: async () => {
      try { return await staffService.listDoctors() } catch { return { data: [] } }
    },
    retry: false,
  })
  const doctors = Array.isArray(doctorsData) ? doctorsData : (doctorsData?.data || [])

  const vitalsHistory = vitalsHistoryData?.data || []
  const examination = examinationData?.data
  const recommendations = recommendationsData?.data || []
  const diagnoses = diagnosesData?.data || []
  const episodeDetail = episodeDetailData?.data
  const medicalCard = medicalCardData?.data
  const profile = profileData
  const appointment = appointmentData

  // ============ MODALS ============
  const [createEpisodeModalOpen, setCreateEpisodeModalOpen] = useState(false)
  const [createEpisodeForm] = Form.useForm()
  const [anthropometryForm] = Form.useForm()

  // ============ EXAMINATION FORM STATE ============
  const [examForm] = Form.useForm()
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // ============ ANTHROPOMETRY FORM STATE ============
  // NOTE: showAddForm must be at component top level — NOT inside renderAnthropometry
  // (React error #310: hooks cannot be called inside plain render functions)
  const [showAddForm, setShowAddForm] = useState(false)

  // Populate examination form when data loads
  useEffect(() => {
    if (examination) {
      examForm.setFieldsValue({
        complaints: examination.complaints || '',
        examination: examination.examination || '',
        recommendations: examination.recommendations || '',
        conclusion: examination.conclusion || '',
        notes: examination.notes || '',
      })
      if (examination.updated_at) {
        setLastSaved(new Date(examination.updated_at))
      }
    }
  }, [examination])

  // ============ MUTATIONS ============
  const createEpisodeMutation = useMutation({
    mutationFn: (data: { title: string; doctor_id: string }) =>
      medicalCardService.createEpisode(patientId!, {
        ...data,
        appointment_id: appointmentIdFromUrl || undefined,
      }),
    onSuccess: (response) => {
      message.success('Epizod muvaffaqiyatli yaratildi')
      setCreateEpisodeModalOpen(false)
      createEpisodeForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['episodes', patientId] })
      queryClient.invalidateQueries({ queryKey: ['episodeByAppointment', appointmentIdFromUrl] })
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error || 'Xatolik yuz berdi')
    },
  })

  const saveExaminationMutation = useMutation({
    mutationFn: (data: { complaints: string; examination: string; recommendations: string; conclusion: string; notes: string }) =>
      medicalCardService.saveExamination(selectedEpisodeId!, data),
    onSuccess: (response: any) => {
      message.success('Ko\'rik saqlandi')
      setLastSaved(new Date())
      queryClient.invalidateQueries({ queryKey: ['episodeExamination', selectedEpisodeId] })
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error || 'Xatolik yuz berdi')
    },
  })

  const completeEpisodeMutation = useMutation({
    mutationFn: (conclusion: string) =>
      medicalCardService.completeEpisode(selectedEpisodeId!, conclusion),
    onSuccess: () => {
      message.success('Ko\'rik tugallandi')
      queryClient.invalidateQueries({ queryKey: ['episodeByAppointment', appointmentIdFromUrl] })
      queryClient.invalidateQueries({ queryKey: ['episodes', patientId] })
      queryClient.invalidateQueries({ queryKey: ['episodeExamination', selectedEpisodeId] })
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error || 'Xatolik yuz berdi')
    },
  })

  const saveVitalsMutation = useMutation({
    mutationFn: (data: any) =>
      medicalCardService.saveEpisodeVitals(selectedEpisodeId!, data),
    onSuccess: () => {
      message.success('Antropometriya saqlandi')
      queryClient.invalidateQueries({ queryKey: ['patientVitalsHistory', patientId] })
      queryClient.invalidateQueries({ queryKey: ['episodeVitals', selectedEpisodeId] })
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error || 'Xatolik yuz berdi')
    },
  })

  // ============ HANDLERS ============
  const handleSaveExamination = async () => {
    if (!hasActiveEpisode) {
      message.warning('Avval epizod yarating')
      return
    }
    const values = examForm.getFieldsValue()
    if (!values.examination?.trim()) {
      message.warning('Ko\'rik matni bo\'sh bo\'lishi mumkin emas')
      return
    }
    setIsSaving(true)
    try {
      await saveExaminationMutation.mutateAsync({
        complaints: values.complaints || '',
        examination: values.examination || '',
        recommendations: values.recommendations || '',
        conclusion: values.conclusion || '',
        notes: values.notes || '',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCompleteExamination = async () => {
    if (!hasActiveEpisode) {
      message.warning('Avval epizod yarating')
      return
    }
    if (!isEpisodeCompleted) {
      const values = examForm.getFieldsValue()
      if (!values.examination?.trim()) {
        message.warning('Ko\'rik matni kiritilishi kerak')
        return
      }
      // Save first
      await saveExaminationMutation.mutateAsync({
        complaints: values.complaints || '',
        examination: values.examination || '',
        recommendations: values.recommendations || '',
        conclusion: values.conclusion || '',
        notes: values.notes || '',
      })
    }
    await completeEpisodeMutation.mutateAsync(examForm.getFieldValue('conclusion') || '')
  }

  const handleSaveAnthropometry = async () => {
    if (!hasActiveEpisode) {
      message.warning('Avval epizod yarating')
      return
    }
    const values = anthropometryForm.getFieldsValue()
    await saveVitalsMutation.mutateAsync({
      height: values.height ?? null,
      weight: values.weight ?? null,
      temperature: values.temperature ?? null,
      bp_systolic: values.bp_systolic ?? null,
      bp_diastolic: values.bp_diastolic ?? null,
      pulse: values.pulse ?? null,
      blood_sugar: values.blood_sugar ?? null,
      waist: values.waist ?? null,
      comments: values.comments || null,
    })
    anthropometryForm.resetFields()
  }

  // ============ LOADING STATE ============
  if (patientLoading) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: 'rgba(255,255,255,0.5)' }}>Yuklanmoqda...</div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div style={{ padding: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/patients')} style={{ marginBottom: 16 }}>
          Bemorlar ro'yxati
        </Button>
        <Card><Empty description="Bemor topilmadi" /></Card>
      </div>
    )
  }

  // ============ MEDICAL CARD HEADER ============
  const renderHeader = () => {
    const bloodGroup = medicalCard?.blood_type || profile?.blood_type || '-'
    const rhFactor = medicalCard?.rh_factor || profile?.rh_factor || ''
    const allergies = medicalCard?.allergies || profile?.allergies
    const allergyCount = Array.isArray(allergies) ? allergies.length : (allergies ? 1 : 0)

    return (
      <div style={{
        background: 'linear-gradient(135deg, #081423 0%, #0d1f35 100%)',
        borderBottom: '1px solid rgba(212,175,55,0.15)',
        padding: '16px 24px',
      }}>
        <div style={{ marginBottom: 12 }}>
          <Space wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/patients/${patientId}`)} style={{ marginRight: 8 }}>
              Profilga qaytish
            </Button>
            <Button icon={<UserOutlined />} onClick={() => navigate(`/patients/${patientId}`)}
              style={{ background: 'rgba(212,175,55,0.15)', borderColor: '#d4af37', color: '#d4af37' }}>
              Bemor profili
            </Button>
          </Space>
        </div>
        <Row gutter={24} align="middle">
          <Col flex="none">
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(212,175,55,0.15)', border: '2px solid #d4af37',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, color: '#d4af37', fontWeight: 700,
            }}>
              {patient.first_name?.[0]}{patient.last_name?.[0]}
            </div>
          </Col>
          <Col flex="auto">
            <Space direction="vertical" size={2}>
              <Space>
                <Title level={3} style={{ color: '#fff', margin: 0 }}>
                  {patient.last_name} {patient.first_name} {patient.patronymic || ''}
                </Title>
                {patient.med_id && (
                  <Tag color="gold" style={{ fontWeight: 600 }}>MED-ID: {patient.med_id}</Tag>
                )}
              </Space>
              <Space wrap>
                <Text style={{ color: 'rgba(255,255,255,0.6)' }}>
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  {formatDate(patient.birth_date)} · {patient.gender === 'male' ? 'Erkak' : 'Ayol'}
                </Text>
                {patient.phone && (
                  <Text style={{ color: 'rgba(255,255,255,0.6)' }}>
                    <PhoneOutlined style={{ marginRight: 4 }} />{patient.phone}
                  </Text>
                )}
              </Space>
            </Space>
          </Col>
          <Col flex="none">
            <Space direction="vertical" size={4} align="end">
              <Tag color={bloodGroup !== '-' ? 'red' : 'default'} style={{ fontSize: 13, padding: '2px 10px', minWidth: 80, textAlign: 'center' }}>
                {bloodGroup !== '-' ? `${bloodGroup} ${rhFactor}` : 'Qon: -'}
              </Tag>
              {allergyCount > 0 && (
                <Tag color="warning" icon={<WarningOutlined />}>Allergiya: {allergyCount} ta</Tag>
              )}
              {appointment && (
                <Tag color={statusColor(appointment.status)}>{statusLabel(appointment.status)}</Tag>
              )}
            </Space>
          </Col>
        </Row>

        {/* Appointment context alert */}
        {appointment && (
          <Alert type="info" icon={<CalendarOutlined />} style={{ marginTop: 12, background: 'rgba(24,144,255,0.15)', border: '1px solid rgba(24,144,255,0.3)' }}
            message={
              <Space>
                <Text strong style={{ color: '#fff' }}>
                  Qabul: {appointment.service?.name || 'Xizmat ko\'rsatilmagan'}
                  {' · '}Dr. {appointment.doctor?.last_name} {appointment.doctor?.first_name}
                  {' · '}{formatDate(appointment.appointment_date)} {appointment.start_time}
                  {' · '}
                  <Badge status={statusColor(appointment.status) as any} text={<Text style={{ color: '#fff' }}>{statusLabel(appointment.status)}</Text>} />
                </Text>
              </Space>
            }
          />
        )}

        {/* Invalid or not-found appointment context warning */}
        {rawAppointmentId && !appointment && (
          <Alert
            type="warning"
            icon={<WarningOutlined />}
            message="Appointment context is invalid or not found"
            description="Tibbiy karta qabul ma'lumotlarisiz ochildi. Barcha funksiyalar mavjud."
            style={{ marginTop: 12 }}
            showIcon
          />
        )}
      </div>
    )
  }

  // ============ CURRENT EXAMINATION TAB (PHASE 4) ============
  const renderCurrentExamination = () => {
    const isReadOnly = isEpisodeCompleted

    return (
      <div>
        {/* Episode status bar */}
        <Card size="small" style={{ marginBottom: 16, background: 'rgba(13,26,48,0.6)' }} bodyStyle={{ padding: '12px 16px' }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              {hasActiveEpisode ? (
                <>
                  <Tag color={statusColor(activeEpisode.status)} style={{ fontWeight: 600 }}>
                    {statusLabel(activeEpisode.status)} epizod
                  </Tag>
                  {episodeByAppt && <Tag color="blue" icon={<CalendarOutlined />}>Qabulga bog'langan</Tag>}
                  <Text style={{ color: 'rgba(255,255,255,0.65)' }}>
                    {activeEpisode.title} · {formatDate(activeEpisode.started_at)}
                    {activeEpisode.doctor && <> · Dr. {activeEpisode.doctor.last_name} {activeEpisode.doctor.first_name}</>}
                  </Text>
                </>
              ) : (
                <Text style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <WarningOutlined style={{ marginRight: 6 }} />
                  Bu bemorda faol tibbiy epizod yo'q
                </Text>
              )}
            </Space>
            {!hasActiveEpisode && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateEpisodeModalOpen(true)}
                style={{ background: '#d4af37', borderColor: '#d4af37' }}>
                Epizod yaratish
              </Button>
            )}
            {hasActiveEpisode && (
              <Space>
                {lastSaved && (
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {lastSaved.toLocaleTimeString()}
                  </Text>
                )}
                {!isReadOnly && (
                  <>
                    <Button icon={<SaveOutlined />} loading={isSaving || saveExaminationMutation.isPending}
                      onClick={handleSaveExamination}>
                      Saqlash
                    </Button>
                    <Popconfirm title="Ko'rikni tugallaysizmi?" onConfirm={handleCompleteExamination}
                      okText="Ha, tugallash" cancelText="Bekor qilish"
                      okButtonProps={{ style: { background: '#52c41a' } }}>
                      <Button type="primary" icon={<CheckCircleOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a' }}>
                        Tugallash
                      </Button>
                    </Popconfirm>
                  </>
                )}
                {isReadOnly && (
                  <Tag color="success" icon={<CheckCircleOutlined />}>Tugallangan ko'rik</Tag>
                )}
              </Space>
            )}
          </Space>
        </Card>

        {/* Examination editor */}
        {hasActiveEpisode ? (
          <Card
            title="Ko'rik ma'lumotlari"
            size="small"
            style={{ background: 'rgba(13,26,48,0.6)' }}
            extra={
              isReadOnly && <Tag color="success">Faqat o'qish uchun</Tag>
            }
          >
            <Form form={examForm} layout="vertical" disabled={isReadOnly}>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item label="Shikoyatlar" name="complaints">
                    <TextArea rows={2} placeholder="Bemor shikoyatlari..." disabled={isReadOnly} />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    label="Tibbiy ko'rik"
                    name="examination"
                    rules={[{ required: false, message: '' }]}
                  >
                    <TextArea rows={6} placeholder="Umumiy holat, teri, shilliq pardalar, oshqozon-ichak, nafas olish, yurak-qon tomir tizimlari bo'yicha ko'rik natijalari..." disabled={isReadOnly} />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label="Tavsiyalar" name="recommendations">
                    <TextArea rows={3} placeholder="Davolash bo'yicha tavsiyalar, qo'shimcha tekshiruvlar..." disabled={isReadOnly} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Xulosa" name="conclusion">
                    <Input placeholder="Tashxis xulosasi..." disabled={isReadOnly} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Izoh" name="notes">
                    <Input placeholder="Qo'shimcha izohlar..." disabled={isReadOnly} />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>
        ) : (
          <Card style={{ background: 'rgba(13,26,48,0.6)', textAlign: 'center', padding: 40 }}>
            <Empty description={
              <Space direction="vertical" size={8}>
                <Text style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Tibbiy ko'rikni boshlash uchun avval epizod yarating
                </Text>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateEpisodeModalOpen(true)}
                  style={{ background: '#d4af37', borderColor: '#d4af37' }}>
                  Epizod yaratish
                </Button>
              </Space>
            } />
          </Card>
        )}

        {/* Episode history */}
        <Card title="Epizodlar tarixi" size="small" style={{ background: 'rgba(13,26,48,0.6)', marginTop: 16 }}
          extra={<Button size="small" icon={<ReloadOutlined />} onClick={() => refetchEpisodes()}>Yangilash</Button>}>
          {episodesLoading ? (
            <div style={{ textAlign: 'center', padding: 20 }}><Spin /></div>
          ) : episodes.length > 0 ? (
            <Table size="small" dataSource={episodes} rowKey="id" pagination={{ pageSize: 10, showSizeChanger: false }}
              columns={[
                { title: 'Sana', dataIndex: 'started_at', key: 'started_at', render: (d: string) => formatDate(d) },
                { title: 'Sarlavha', dataIndex: 'title', key: 'title' },
                { title: 'Shifokor', key: 'doctor', render: (_: any, r: any) => r.doctor ? `${r.doctor.last_name} ${r.doctor.first_name}` : '-' },
                { title: 'Holat', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={statusColor(s)}>{statusLabel(s)}</Tag> },
              ]}
            />
          ) : (
            <Empty description="Tibbiy epizodlar mavjud emas" />
          )}
        </Card>
      </div>
    )
  }

  // ============ ANTHROPOMETRY TAB (PHASE 5) ============
  const renderAnthropometry = () => {
    return (
      <div>
        {/* Add new measurement form */}
        {hasActiveEpisode && (
          <Card size="small" style={{ marginBottom: 16, background: 'rgba(13,26,48,0.6)' }}
            title="O'lchov qo'shish"
            extra={
              !showAddForm ? (
                <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setShowAddForm(true)}
                  style={{ background: '#d4af37', borderColor: '#d4af37' }}>
                  Yangi o'lchov
                </Button>
              ) : (
                <Button size="small" onClick={() => { setShowAddForm(false); anthropometryForm.resetFields() }}>Bekor qilish</Button>
              )
            }>
            {showAddForm && (
              <Form form={anthropometryForm} layout="vertical" onFinish={handleSaveAnthropometry}>
                <Row gutter={12}>
                  <Col xs={12} sm={8} md={6}>
                    <Form.Item label="Bo'y (sm)" name="height">
                      <InputNumber min={30} max={250} precision={1} style={{ width: '100%' }} placeholder="175" />
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={8} md={6}>
                    <Form.Item label="Vazn (kg)" name="weight">
                      <InputNumber min={1} max={500} precision={1} style={{ width: '100%' }} placeholder="80" />
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={8} md={6}>
                    <Form.Item label="Harorat (°C)" name="temperature">
                      <InputNumber min={30} max={45} precision={1} style={{ width: '100%' }} placeholder="36.6" />
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={8} md={6}>
                    <Form.Item label="Qon bosimi sistolik" name="bp_systolic">
                      <InputNumber min={60} max={300} style={{ width: '100%' }} placeholder="120" />
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={8} md={6}>
                    <Form.Item label="Qon bosimi diastolik" name="bp_diastolic">
                      <InputNumber min={40} max={200} style={{ width: '100%' }} placeholder="80" />
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={8} md={6}>
                    <Form.Item label="Puls (daq/min)" name="pulse">
                      <InputNumber min={30} max={250} style={{ width: '100%' }} placeholder="72" />
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={8} md={6}>
                    <Form.Item label="Qon shakari (mmol/L)" name="blood_sugar">
                      <InputNumber min={1} max={50} precision={1} style={{ width: '100%' }} placeholder="5.5" />
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={8} md={6}>
                    <Form.Item label="Bel aylana (sm)" name="waist">
                      <InputNumber min={30} max={200} precision={1} style={{ width: '100%' }} placeholder="90" />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item label="Izoh" name="comments">
                      <Input placeholder="Qo'shimcha izohlar..." />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />}
                      loading={saveVitalsMutation.isPending}
                      style={{ background: '#d4af37', borderColor: '#d4af37' }}>
                      Saqlash
                    </Button>
                  </Col>
                </Row>
              </Form>
            )}
          </Card>
        )}

        {!hasActiveEpisode && (
          <Alert type="warning" message="Antropometrik ma'lumotlarni kiritish uchun avval epizod yarating" style={{ marginBottom: 16 }} />
        )}

        {/* Vitals history table */}
        <Card title="O'lchovlar tarixi" size="small" style={{ background: 'rgba(13,26,48,0.6)' }}
          extra={<Button size="small" icon={<ReloadOutlined />} onClick={() => refetchVitalsHistory()}>Yangilash</Button>}>
          {!hasActiveEpisode ? (
            <Empty description="Epizod yaratilganda ma'lumotlar shu yerda ko'rsatiladi" />
          ) : vitalsHistory.length === 0 ? (
            <Empty description="Antropometrik ma'lumotlar hali kiritilmagan" />
          ) : (
            <Table
              size="small"
              dataSource={vitalsHistory}
              rowKey="id"
              pagination={{ pageSize: 10, showSizeChanger: false }}
              scroll={{ x: 900 }}
              columns={[
                {
                  title: 'Sana',
                  dataIndex: 'recorded_at',
                  key: 'recorded_at',
                  width: 150,
                  render: (d: string) => d ? formatDate(d) : '-',
                },
                {
                  title: 'Epizod',
                  key: 'episode',
                  width: 180,
                  render: (_: any, r: any) => (
                    <Space direction="vertical" size={0}>
                      <Text style={{ fontSize: 12 }}>{r.episode_title || '-'}</Text>
                      <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{r.doctor_name || '-'}</Text>
                    </Space>
                  ),
                },
                {
                  title: 'Bo\'y',
                  dataIndex: 'height',
                  key: 'height',
                  width: 80,
                  render: (v: number) => v ? `${v} sm` : '-',
                },
                {
                  title: 'Vazn',
                  dataIndex: 'weight',
                  key: 'weight',
                  width: 80,
                  render: (v: number) => v ? `${v} kg` : '-',
                },
                {
                  title: 'BMI',
                  key: 'bmi',
                  width: 80,
                  render: (_: any, r: any) => {
                    const bmi = calcBMI(r.height, r.weight)
                    return bmi !== '-' ? (
                      <Tag color={parseFloat(bmi) >= 25 ? 'orange' : parseFloat(bmi) < 18.5 ? 'blue' : 'green'}>
                        {bmi}
                      </Tag>
                    ) : '-'
                  },
                },
                {
                  title: 'Harorat',
                  dataIndex: 'temperature',
                  key: 'temperature',
                  width: 90,
                  render: (v: number) => v ? `${v}°C` : '-',
                },
                {
                  title: 'Qon bosimi',
                  key: 'bp',
                  width: 110,
                  render: (_: any, r: any) =>
                    r.bp_systolic ? `${r.bp_systolic}/${r.bp_diastolic || '-'} mmHg` : '-',
                },
                {
                  title: 'Puls',
                  dataIndex: 'pulse',
                  key: 'pulse',
                  width: 90,
                  render: (v: number) => v ? `${v} /daq` : '-',
                },
                {
                  title: 'Qon shakari',
                  dataIndex: 'blood_sugar',
                  key: 'blood_sugar',
                  width: 100,
                  render: (v: number) => v ? `${v} mmol/L` : '-',
                },
                {
                  title: 'Bel',
                  dataIndex: 'waist',
                  key: 'waist',
                  width: 80,
                  render: (v: number) => v ? `${v} sm` : '-',
                },
                {
                  title: 'Izoh',
                  dataIndex: 'comments',
                  key: 'comments',
                  width: 150,
                  ellipsis: true,
                  render: (t: string) => t || '-',
                },
              ]}
            />
          )}
        </Card>
      </div>
    )
  }

  // ============ DIAGNOSES TAB ============
  const renderDiagnoses = () => (
    <Card title="Tashxislar tarixi (ICD-10)" size="small" style={{ background: 'rgba(13,26,48,0.6)' }}>
      {selectedEpisodeId ? (
        diagnoses.length > 0 ? (
          <Table size="small" dataSource={diagnoses} rowKey="id" pagination={false}
            columns={[
              { title: 'Sana', dataIndex: 'created_at', key: 'created_at', render: (d: string) => formatDate(d) },
              { title: 'ICD-10', dataIndex: 'icd_code', key: 'icd_code', render: (c: string) => <Tag color="blue">{c}</Tag> },
              { title: 'Tashxis', dataIndex: 'icd_name', key: 'icd_name' },
              { title: 'Turi', dataIndex: 'type', key: 'type', render: (t: string) => <Tag color={t === 'main' ? 'red' : 'orange'}>{t === 'main' ? 'Asosiy' : "Qo'shimcha"}</Tag> },
              { title: 'Holat', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'preliminary' ? 'orange' : 'success'}>{s === 'preliminary' ? 'Dastlabki' : 'Tasdiqlangan'}</Tag> },
            ]}
          />
        ) : <Empty description="Tashxislar mavjud emas" />
      ) : <Empty description="Epizod tanlang" />}
    </Card>
  )

  // ============ EXAMINATIONS TAB ============
  const renderExaminations = () => (
    <Card title="Ko'rik natijalari" size="small" style={{ background: 'rgba(13,26,48,0.6)' }}>
      {selectedEpisodeId ? (
        episodeDetail?.Encounters && episodeDetail.Encounters.length > 0 ? (
          <div>
            {episodeDetail.Encounters.map((enc: any) => (
              <Card key={enc.id} size="small" style={{ marginBottom: 12, background: 'rgba(26,42,74,0.5)' }}
                title={formatDate(enc.visit_date || enc.VisitDate)}>
                {enc.examination || enc.Examination ? (
                  <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit', fontSize: 13 }}>
                    {enc.examination || enc.Examination}
                  </pre>
                ) : (
                  <Text type="secondary">Ko'rik matni kiritilmagan</Text>
                )}
              </Card>
            ))}
          </div>
        ) : <Empty description="Ko'rik natijalari mavjud emas" />
      ) : <Empty description="Epizod tanlang" />}
    </Card>
  )

  // ============ ANALYSES TAB ============
  const renderAnalyses = () => (
    <Card title="Analizlar" size="small" style={{ background: 'rgba(13,26,48,0.6)' }}>
      <Empty description="Analizlar natijalari tez orada qo'shiladi" />
    </Card>
  )

  // ============ DIAGNOSTICS TAB ============
  const renderDiagnostics = () => (
    <Card title="Diagnostika" size="small" style={{ background: 'rgba(13,26,48,0.6)' }}>
      <Empty description="Diagnostika natijalari tez orada qo'shiladi" />
    </Card>
  )

  // ============ PRESCRIPTIONS TAB ============
  const renderPrescriptions = () => (
    <Card title="Retseptlar" size="small" style={{ background: 'rgba(13,26,48,0.6)' }}>
      <Empty description="Retseptlar tez orada qo'shiladi" />
    </Card>
  )

  // ============ TREATMENT TAB ============
  const renderTreatment = () => (
    <Card title="Davolash kurslari" size="small" style={{ background: 'rgba(13,26,48,0.6)' }}>
      {selectedEpisodeId && recommendations.length > 0 ? (
        <Table size="small" dataSource={recommendations} rowKey="id" pagination={false}
          columns={[
            { title: 'Sana', dataIndex: 'created_at', key: 'created_at', render: (d: string) => formatDate(d) },
            { title: 'Turi', dataIndex: 'type', key: 'type', render: (t: string) => <Tag>{t}</Tag> },
            { title: 'Tavsif', dataIndex: 'description', key: 'description' },
            { title: "Ko'rsatma", dataIndex: 'instructions', key: 'instructions', render: (i: string) => i || '-' },
          ]}
        />
      ) : <Empty description="Davolash kurslari tez orada qo'shiladi" />}
    </Card>
  )

  // ============ TAB CONTENT MAP ============
  const tabContents: Record<string, React.ReactNode> = {
    'current-examination': renderCurrentExamination(),
    'anthropometry': renderAnthropometry(),
    'diagnoses': renderDiagnoses(),
    'examinations': renderExaminations(),
    'analyses': renderAnalyses(),
    'diagnostics': renderDiagnostics(),
    'prescriptions': renderPrescriptions(),
    'treatment': renderTreatment(),
  }

  // ============ CREATE EPISODE MODAL ============
  return (
    <div>
      {renderHeader()}

      <div style={{ padding: '16px 24px 24px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={TAB_ORDER.map(tab => ({
            key: tab.key,
            label: <Space>{tab.icon}<span>{tab.label}</span></Space>,
            children: tabContents[tab.key],
          }))}
        />
      </div>

      {/* Create Episode Modal */}
      <Modal
        title="Yangi tibbiy epizod"
        open={createEpisodeModalOpen}
        onCancel={() => { setCreateEpisodeModalOpen(false); createEpisodeForm.resetFields() }}
        onOk={() => createEpisodeForm.submit()}
        confirmLoading={createEpisodeMutation.isPending}
        okText="Yaratish"
        okButtonProps={{ style: { background: '#d4af37' } }}
      >
        {appointment && (
          <Alert type="info" message={
            <Text>
              Bu epizod quyidagi qabulga bog'lanadi: <strong>{appointment.service?.name || 'Xizmat'}</strong> · Dr. {appointment.doctor?.last_name} {appointment.doctor?.first_name} · {formatDate(appointment.appointment_date)} {appointment.start_time}
            </Text>
          } style={{ marginBottom: 16 }} />
        )}
        <Form form={createEpisodeForm} layout="vertical" onFinish={(values) => createEpisodeMutation.mutate(values)}
          initialValues={{
            title: appointment?.service?.name ? `Qabul: ${appointment.service.name}` : 'Shikoyat',
            doctor_id: appointment?.doctor?.id || '',
          }}>
          <Form.Item label="Epizod sarlavhasi" name="title" rules={[{ required: true, message: 'Sarlavha kiritish majburiy' }]}>
            <Input placeholder="Shikoyat nomi" />
          </Form.Item>
          <Form.Item label="Shifokor" name="doctor_id" rules={[{ required: true, message: 'Shifokor tanlash majburiy' }]}>
            <Select placeholder="Shifokor tanlang" showSearch optionFilterProp="children"
              options={doctors.map((d: any) => ({
                value: d.id,
                label: `${d.last_name} ${d.first_name}${d.specialty ? ` — ${d.specialty}` : ''}`,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
