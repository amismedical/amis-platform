import { useState, useEffect, useRef } from 'react'
// useRef imported for debounce tracking in ICD-10 search
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
  StopOutlined, ClockCircleOutlined, EditOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { formatDate } from '../i18n/uz'
import {
  patientService, medicalCardService, appointmentService, patientProfileService,
  referenceService, staffService, LabOrder
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

  // ============ ACTIVE EPISODE STATE ============
  // Track newly created episode so it becomes active immediately after creation
  // (episodes[0] is the OLDEST, not the newest — we need explicit tracking)
  const [newlyCreatedEpisode, setNewlyCreatedEpisode] = useState<any>(null)

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
  // Priority: newly created episode > appointment-linked episode > newest episode from list
  // episodes[0] is OLDEST in default sort, so we use the reactive newlyCreatedEpisode state
  const activeEpisode = newlyCreatedEpisode || episodeByAppt || episodes?.[0] || null
  const selectedEpisodeId = activeEpisode?.id || null
  const hasActiveEpisode = !!activeEpisode
  // Recognise all terminal/closed statuses as "completed" (not editable)
  const isEpisodeCompleted = (() => {
    const s = activeEpisode?.status
    return s === 'completed' || s === 'cancelled' || s === 'closed'
  })()

  // CRITICAL FIX: Find first ACTIVE episode for anthropometry save
  // Anthropometry must ONLY save to active episodes, NOT completed ones
  const editableEpisodeId = (() => {
    // Priority: newly created > appointment-linked > find first active in list
    if (newlyCreatedEpisode?.status === 'active') return newlyCreatedEpisode.id
    if (episodeByAppt?.status === 'active') return episodeByAppt.id
    const activeEp = episodes.find(e => e.status === 'active')
    return activeEp?.id || null
  })()
  const hasEditableEpisode = !!editableEpisodeId

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

  // Episode diagnoses - FIX: use editableEpisodeId (active episode) for history display
  // This matches the episode used for diagnosis save (editableEpisodeId, not selectedEpisodeId)
  const { data: diagnosesData, refetch: refetchDiagnoses } = useQuery({
    queryKey: ['episodeDiagnoses', editableEpisodeId],
    queryFn: async () => {
      try { return await medicalCardService.getEpisodeDiagnoses(editableEpisodeId!) } catch { return { data: [] } }
    },
    enabled: !!editableEpisodeId,
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

  // Examination history for Ko'rik natijalari tab - loads by patient_id
  const { data: examHistoryData, refetch: refetchExamHistory } = useQuery({
    queryKey: ['patientExaminationsHistory', patientId],
    queryFn: async () => {
      try { return await medicalCardService.getPatientExaminationsHistory(patientId!, 50) } catch { return { data: [] } }
    },
    enabled: !!patientId && activeTab === 'examinations',
    retry: false,
  })
  const examHistory = examHistoryData?.data || []

  // Lab orders for Analizlar tab - loads by patient_id across all episodes
  const { data: labOrdersData, refetch: refetchLabOrders } = useQuery({
    queryKey: ['patientLabOrders', patientId],
    queryFn: async () => {
      try { return await medicalCardService.getPatientLabOrders(patientId!, 50) } catch { return { data: [] } }
    },
    enabled: !!patientId && activeTab === 'analyses',
    retry: false,
  })

  // Create lab order mutation (TASK-008)
  const createLabOrderMutation = useMutation({
    mutationFn: async (data: { analysis_name: string; category: string; priority?: string; clinical_note?: string; doctor_note?: string }) => {
      if (!editableEpisodeId) throw new Error('No active episode')
      return medicalCardService.createLabOrder(editableEpisodeId, data)
    },
    onSuccess: () => {
      message.success('Analiz buyurildi')
      setAddLabOrderModalOpen(false)
      labOrderForm.resetFields()
      refetchLabOrders()
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error || 'Xatolik yuz berdi')
    },
  })

  // Save lab order result mutation (TASK-008 Phase 8C/8D: Natija kiritish)
  // Lab results can be entered even for completed episodes
  const saveLabOrderResultMutation = useMutation({
    mutationFn: async (data: { result_text: string; result_note?: string; result_status: 'normal' | 'abnormal' | 'critical' }) => {
      // selectedLabOrder is set before mutation is called, this is a safety guard
      if (!selectedLabOrder?.id) {
        throw new Error('Lab order ID not found')
      }
      return medicalCardService.saveLabOrderResult(selectedLabOrder.id, data)
    },
    onSuccess: () => {
      message.success('Natija saqlandi')
      setResultEntryModalOpen(false)
      setSelectedLabOrder(null)
      resultEntryForm.resetFields()
      refetchLabOrders()
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error || err?.message || 'Xatolik yuz berdi')
    },
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
  // ============ DIAGNOSIS MODAL ============
  const [addDiagnosisModalOpen, setAddDiagnosisModalOpen] = useState(false)
  const [addDiagnosisForm] = Form.useForm()
  const [icd10Options, setIcd10Options] = useState<Array<{ value: string; label: string; name: string }>>([])
  // Debounce ICD-10 search to avoid flooding the API
  const icd10SearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ============ EXAMINATION FORM STATE ============
  const [examForm] = Form.useForm()
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // ============ ANTHROPOMETRY FORM STATE ============
  // NOTE: showAddForm must be at component top level — NOT inside renderAnthropometry
  // (React error #310: hooks cannot be called inside plain render functions)
  const [showAddForm, setShowAddForm] = useState(false)

  // ============ LAB ORDER MODAL STATE (TASK-008) ============
  const [addLabOrderModalOpen, setAddLabOrderModalOpen] = useState(false)
  const [labOrderForm] = Form.useForm()

  // ============ LAB ORDER RESULT MODAL STATE (TASK-008 Phase 8C/8D) ============
  const [resultEntryModalOpen, setResultEntryModalOpen] = useState(false)
  const [selectedLabOrder, setSelectedLabOrder] = useState<LabOrder | null>(null)
  const [resultEntryForm] = Form.useForm()

  // Ensure labOrders is always an array (null-safe)
  const labOrders = Array.isArray(labOrdersData?.data) ? labOrdersData.data : []

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
    onSuccess: (response: any) => {
      // Extract created episode from response — response.data.data contains the episode
      const created = response?.data?.data || response?.data || null
      if (created?.id) {
        // Set the newly created episode as active immediately
        setNewlyCreatedEpisode(created)
        message.success('Epizod muvaffaqiyatli yaratildi')
      } else {
        message.warning('Epizod yaratildi ammo ma\'lumot to\'liq emas')
      }
      setCreateEpisodeModalOpen(false)
      createEpisodeForm.resetFields()
      // Switch to current-examination tab to show the new episode
      handleTabChange('current-examination')
      // Invalidate queries so the episode list refetches
      queryClient.invalidateQueries({ queryKey: ['episodes', patientId] })
      if (appointmentIdFromUrl) {
        queryClient.invalidateQueries({ queryKey: ['episodeByAppointment', appointmentIdFromUrl] })
      }
    },
    onError: (err: any) => {
      // Handle 409 Conflict — episode already exists for this appointment
      if (err?.response?.status === 409) {
        const existing = err?.response?.data?.data
        if (existing?.id) {
          setNewlyCreatedEpisode(existing)
          message.warning('Bu qabul uchun epizod allaqachon mavjud — ochildi')
          handleTabChange('current-examination')
          setCreateEpisodeModalOpen(false)
          createEpisodeForm.resetFields()
          queryClient.invalidateQueries({ queryKey: ['episodes', patientId] })
          queryClient.invalidateQueries({ queryKey: ['episodeByAppointment', appointmentIdFromUrl] })
          return
        }
      }
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
      medicalCardService.saveEpisodeVitals(editableEpisodeId!, data),
    onSuccess: () => {
      message.success('Antropometriya saqlandi')
      queryClient.invalidateQueries({ queryKey: ['patientVitalsHistory', patientId] })
      queryClient.invalidateQueries({ queryKey: ['episodeVitals', editableEpisodeId] })
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error || 'Xatolik yuz berdi')
    },
  })

  // ============ DIAGNOSIS MUTATIONS ============
  const createDiagnosisMutation = useMutation({
    mutationFn: (data: { icd_code: string; icd_name: string; type: string; status: string; notes: string }) =>
      medicalCardService.createDiagnosis(editableEpisodeId!, data),
    onSuccess: () => {
      message.success('Tashxis qo\'shildi')
      queryClient.invalidateQueries({ queryKey: ['episodeDiagnoses', editableEpisodeId] })
      setAddDiagnosisModalOpen(false)
      addDiagnosisForm.resetFields()
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error || 'Xatolik yuz berdi')
    },
  })

  const deleteDiagnosisMutation = useMutation({
    mutationFn: (diagnosisId: string) =>
      medicalCardService.deleteDiagnosis(editableEpisodeId!, diagnosisId),
    onSuccess: () => {
      message.success('Tashxis o\'chirildi')
      queryClient.invalidateQueries({ queryKey: ['episodeDiagnoses', editableEpisodeId] })
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
    // CRITICAL FIX: Only save to active episodes, not completed ones
    if (!hasEditableEpisode) {
      message.warning('Faol epizod yo‘q. O‘lchov qo‘shish uchun yangi epizod yarating.')
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
    setShowAddForm(false)
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
                    {activeEpisode.doctor_name && <> · Dr. {activeEpisode.doctor_name}</>}
                    {!activeEpisode.doctor_name && activeEpisode.doctor && <> · Dr. {activeEpisode.doctor.last_name} {activeEpisode.doctor.first_name}</>}
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
                { title: 'Shifokor', key: 'doctor', render: (_: any, r: any) => r.doctor_name || r.doctor?.last_name ? (r.doctor ? `${r.doctor.last_name} ${r.doctor.first_name}` : r.doctor_name) : '-' },
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
        {/* Add new measurement form - CRITICAL: only show if editable episode exists */}
        {hasEditableEpisode && (
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

        {!hasEditableEpisode && (
          <Alert type="warning" message="Faol epizod yo‘q. O‘lchov qo‘shish uchun yangi epizod yarating." style={{ marginBottom: 16 }} />
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
    <Card
      title="Tashxislar tarixi (ICD-10)"
      size="small"
      style={{ background: 'rgba(13,26,48,0.6)' }}
      extra={
        hasEditableEpisode && (
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => setAddDiagnosisModalOpen(true)}
            style={{ background: '#d4af37', borderColor: '#d4af37' }}
          >
            Tashxis qo'shish
          </Button>
        )
      }
    >
      {!hasActiveEpisode ? (
        <Empty description="Tashxis qo'shish uchun avval epizod yarating" />
      ) : diagnoses.length === 0 ? (
        <Empty description="Tashxislar mavjud emas. «Tashxis qo'shish» tugmasini bosing." />
      ) : (
        <Table
          size="small"
          dataSource={diagnoses}
          rowKey="id"
          pagination={false}
          columns={[
            { title: 'Sana', dataIndex: 'created_at', key: 'created_at', width: 120, render: (d: string) => formatDate(d) },
            { title: 'ICD-10', dataIndex: 'icd_code', key: 'icd_code', width: 100, render: (c: string) => <Tag color="blue">{c}</Tag> },
            { title: 'Tashxis', dataIndex: 'icd_name', key: 'icd_name' },
            { title: 'Turi', dataIndex: 'type', key: 'type', width: 110, render: (t: string) => <Tag color={t === 'main' ? 'red' : 'orange'}>{t === 'main' ? 'Asosiy' : "Qo'shimcha"}</Tag> },
            { title: 'Holat', dataIndex: 'status', key: 'status', width: 120, render: (s: string) => <Tag color={s === 'preliminary' ? 'orange' : 'success'}>{s === 'preliminary' ? 'Dastlabki' : 'Tasdiqlangan'}</Tag> },
            ...(!isEpisodeCompleted ? [{
              title: '',
              key: 'actions',
              width: 60,
              render: (_: any, record: any) => (
                <Popconfirm
                  title="Tashxisni o'chirishni tasdiqlaysizmi?"
                  onConfirm={() => deleteDiagnosisMutation.mutate(record.id)}
                  okText="Ha" cancelText="Bekor"
                  okButtonProps={{ danger: true }}
                >
                  <Button type="text" danger size="small" icon={<StopOutlined />} loading={deleteDiagnosisMutation.isPending} />
                </Popconfirm>
              ),
            }] : []),
          ]}
        />
      )}
    </Card>
  )

  // ============ EXAMINATIONS TAB ============
  // Ko'rik natijalari - Shows patient examination history from all episodes
  const renderExaminations = () => (
    <Card
      title="Ko'rik natijalari"
      size="small"
      style={{ background: 'rgba(13,26,48,0.6)' }}
      extra={
        <Button size="small" icon={<ReloadOutlined />} onClick={() => refetchExamHistory()}>Yangilash</Button>
      }
    >
      {!patientId ? (
        <Empty description="Bemor tanlang" />
      ) : examHistory.length === 0 ? (
        <Empty description="Ko'rik natijalari mavjud emas" />
      ) : (
        <Table
          size="small"
          dataSource={examHistory}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          columns={[
            {
              title: 'Sana',
              dataIndex: 'visit_date',
              key: 'visit_date',
              width: 120,
              render: (d: string) => formatDate(d),
            },
            {
              title: 'Epizod',
              key: 'episode',
              width: 180,
              render: (_: any, r: any) => (
                <Space direction="vertical" size={0}>
                  <Text style={{ fontSize: 12 }}>{r.episode_title || '-'}</Text>
                  <Tag color={statusColor(r.episode_status)} style={{ fontSize: 10 }}>
                    {statusLabel(r.episode_status)}
                  </Tag>
                </Space>
              ),
            },
            {
              title: 'Shifokor',
              dataIndex: 'doctor_name',
              key: 'doctor_name',
              width: 130,
              render: (n: string) => n || '-',
            },
            {
              title: 'Shikoyatlar',
              dataIndex: 'complaints',
              key: 'complaints',
              ellipsis: true,
              render: (c: string) => c || '-',
            },
            {
              title: 'Ko\'rik',
              dataIndex: 'examination',
              key: 'examination',
              ellipsis: true,
              render: (e: string) => e || '-',
            },
            {
              title: 'Izoh',
              dataIndex: 'notes',
              key: 'notes',
              width: 120,
              ellipsis: true,
              render: (n: string) => n || '-',
            },
          ]}
          expandable={{
            expandedRowRender: (record: any) => (
              <div style={{ padding: '8px 0' }}>
                {record.complaints && (
                  <div style={{ marginBottom: 8 }}>
                    <Text strong style={{ color: '#d4af37' }}>Shikoyatlar: </Text>
                    <Text>{record.complaints}</Text>
                  </div>
                )}
                {record.examination && (
                  <div style={{ marginBottom: 8 }}>
                    <Text strong style={{ color: '#d4af37' }}>Tibbiy ko'rik: </Text>
                    <pre style={{ whiteSpace: 'pre-wrap', margin: '4px 0 0', fontFamily: 'inherit', fontSize: 12 }}>
                      {record.examination}
                    </pre>
                  </div>
                )}
                {record.notes && (
                  <div>
                    <Text strong style={{ color: '#d4af37' }}>Izoh: </Text>
                    <Text>{record.notes}</Text>
                  </div>
                )}
              </div>
            ),
            rowExpandable: (record: any) => !!(record.complaints || record.examination || record.notes),
          }}
        />
      )}
    </Card>
  )

  // ============ ANALYSES TAB (TASK-008: Analizlar) ============
  // Lab category helpers (moved outside renderAnalyses for modal access)
  const getLabCategoryLabel = (category?: string) => {
    const labels: Record<string, string> = {
      blood: 'Qon',
      urine: 'Siydik',
      biochemistry: 'Biokimyo',
      other: 'Boshqa',
    }
    return category ? labels[category] || category : '-'
  }
  const labCategoryColor: Record<string, string> = {
    blood: 'red',
    urine: 'blue',
    biochemistry: 'green',
    other: 'default',
  }
  const labPriorityColor: Record<string, string> = {
    normal: 'default',
    urgent: 'red',
  }
  const labStatusColor: Record<string, string> = {
    pending: 'orange',
    collected: 'blue',
    processing: 'processing',
    completed: 'success',
    cancelled: 'error',
  }
  const labStatusLabel: Record<string, string> = {
    pending: 'Kutilmoqda',
    collected: 'Yig\'ildi',
    processing: 'Qayta ishlanmoqda',
    completed: 'Tayyor',
    cancelled: 'Bekor qilingan',
  }
  const resultStatusColor: Record<string, string> = {
    normal: 'success',
    abnormal: 'warning',
    critical: 'error',
  }
  const resultStatusLabel: Record<string, string> = {
    normal: 'Normal',
    abnormal: 'Anormal',
    critical: 'Kritik',
  }

  const renderAnalyses = () => {
    const isReadOnly = isEpisodeCompleted

    // Handler for opening result entry modal (null-safe)
    const handleOpenResultEntry = (order: LabOrder | any) => {
      if (!order) return
      setSelectedLabOrder(order)
      resultEntryForm.setFieldsValue({
        result_text: order.result_text || '',
        result_note: order.result_note || '',
        result_status: order.result_status || 'normal',
      })
      setResultEntryModalOpen(true)
    }

    return (
      <Card
        title="Analizlar"
        size="small"
        style={{ background: 'rgba(13,26,48,0.6)' }}
        extra={
          <Space>
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => refetchLabOrders()}
            >
              Yangilash
            </Button>
            <Button
              size="small"
              type="primary"
              icon={<PlusOutlined />}
              disabled={!hasEditableEpisode || isReadOnly}
              onClick={() => setAddLabOrderModalOpen(true)}
              style={{ background: '#d4af37', borderColor: '#d4af37' }}
            >
              Analiz buyurish
            </Button>
          </Space>
        }
      >
        {!patientId ? (
          <Empty description="Bemor tanlang" />
        ) : labOrders.length === 0 ? (
          <Empty description="Analizlar mavjud emas" />
        ) : (
          <Table
            size="small"
            dataSource={labOrders}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: false }}
            columns={[
              {
                title: 'Sana',
                dataIndex: 'ordered_at',
                key: 'ordered_at',
                width: 120,
                render: (d: string) => formatDate(d),
              },
              {
                title: 'Epizod',
                key: 'episode',
                width: 150,
                render: (_: any, r: any) => (
                  <Space direction="vertical" size={0}>
                    <Text style={{ fontSize: 12 }}>{r.episode_name || '-'}</Text>
                  </Space>
                ),
              },
              {
                title: 'Tahlil nomi',
                dataIndex: 'analysis_name',
                key: 'analysis_name',
                ellipsis: true,
                render: (n: string) => n || '-',
              },
              {
                title: 'Kategoriya',
                dataIndex: 'category',
                key: 'category',
                width: 110,
                render: (c: string) => (
                  <Tag color={labCategoryColor[c] || 'default'}>
                    {getLabCategoryLabel(c)}
                  </Tag>
                ),
              },
              {
                title: 'Prioritet',
                dataIndex: 'priority',
                key: 'priority',
                width: 90,
                render: (p: string) => (
                  <Tag color={labPriorityColor[p] || 'default'}>
                    {p === 'urgent' ? 'Shoshilinch' : 'Oddiy'}
                  </Tag>
                ),
              },
              {
                title: 'Holat',
                dataIndex: 'status',
                key: 'status',
                width: 130,
                render: (s: string, r: any) => (
                  <Space direction="vertical" size={2}>
                    <Tag color={labStatusColor[s] || 'default'}>
                      {labStatusLabel[s] || s || '-'}
                    </Tag>
                    {s === 'completed' && r?.result_status && (
                      <Tag color={resultStatusColor[r.result_status] || 'default'} style={{ fontSize: 10 }}>
                        {resultStatusLabel[r.result_status] || r.result_status}
                      </Tag>
                    )}
                  </Space>
                ),
              },
              {
                title: 'Shifokor',
                dataIndex: 'doctor_name',
                key: 'doctor_name',
                width: 130,
                render: (n: string) => n || '-',
              },
              {
                title: 'Amal',
                key: 'actions',
                width: 130,
                render: (_: any, r: any) => (
                  r?.status !== 'completed' && r?.status !== 'cancelled' ? (
                    <Button
                      size="small"
                      type="primary"
                      icon={<EditOutlined />}
                      onClick={() => handleOpenResultEntry(r as LabOrder)}
                      style={{ background: '#d4af37', borderColor: '#d4af37' }}
                    >
                      Natija kiritish
                    </Button>
                  ) : (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {r?.status === 'completed' ? 'Tayyor' : r?.status === 'cancelled' ? 'Bekor' : '-'}
                    </Text>
                  )
                ),
              },
            ]}
            expandable={{
              expandedRowRender: (record: any) => (
                <div style={{ padding: '8px 0' }}>
                  {record?.clinical_note && (
                    <div style={{ marginBottom: 8 }}>
                      <Text strong style={{ color: '#d4af37' }}>Klinika izohi: </Text>
                      <Text>{record.clinical_note}</Text>
                    </div>
                  )}
                  {record?.doctor_note && (
                    <div style={{ marginBottom: 8 }}>
                      <Text strong style={{ color: '#d4af37' }}>Shifokor izohi: </Text>
                      <Text>{record.doctor_note}</Text>
                    </div>
                  )}
                  {record?.result_status && (
                    <div style={{ marginBottom: 8 }}>
                      <Text strong style={{ color: '#d4af37' }}>Natija holati: </Text>
                      <Tag color={resultStatusColor[record.result_status] || 'default'} style={{ fontSize: 12 }}>
                        {resultStatusLabel[record.result_status] || record.result_status}
                      </Tag>
                    </div>
                  )}
                  {record?.result_text && (
                    <div style={{ marginBottom: record?.result_note ? 8 : 0 }}>
                      <Text strong style={{ color: '#d4af37' }}>Natija: </Text>
                      <pre style={{ whiteSpace: 'pre-wrap', margin: '4px 0 0', fontFamily: 'inherit', fontSize: 12 }}>
                        {record.result_text}
                      </pre>
                    </div>
                  )}
                  {record?.result_note && (
                    <div>
                      <Text strong style={{ color: '#d4af37' }}>Natija izohi: </Text>
                      <Text>{record.result_note}</Text>
                    </div>
                  )}
                </div>
              ),
              rowExpandable: (record: any) => !!(record?.clinical_note || record?.doctor_note || record?.result_text || record?.result_note || record?.result_status),
            }}
          />
        )}
      </Card>
    )
  }

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

      {/* Add Diagnosis Modal */}
      <Modal
        title="Tashxis qo'shish"
        open={addDiagnosisModalOpen}
        onCancel={() => { setAddDiagnosisModalOpen(false); addDiagnosisForm.resetFields() }}
        onOk={() => addDiagnosisForm.submit()}
        confirmLoading={createDiagnosisMutation.isPending}
        okText="Qo'shish"
        okButtonProps={{ style: { background: '#d4af37' } }}
        width={560}
      >
        <Form
          form={addDiagnosisForm}
          layout="vertical"
          onFinish={(values) => {
            createDiagnosisMutation.mutate({
              icd_code: values.icd_code || '',
              icd_name: values.icd_name || '',
              type: values.type || 'main',
              status: values.status || 'preliminary',
              notes: values.notes || '',
            })
          }}
        >
          <Form.Item
            label="ICD-10 kodi va nomi"
            name="icd_name"
            rules={[{ required: true, message: 'ICD-10 tanlash majburiy' }]}
          >
            <Select
              showSearch
              placeholder="ICD-10 kodini yoki nomini yozing..."
              optionFilterProp="label"
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              notFoundContent={null}
              loading={false}
              onSearch={(value) => {
                if (value.length < 2) return
                if (icd10SearchTimer.current) clearTimeout(icd10SearchTimer.current)
                icd10SearchTimer.current = setTimeout(async () => {
                  try {
                    const result = await referenceService.icd10Search(value, 20)
                    const options = (result?.data || []).map((item: any) => ({
                      value: item.id,
                      label: `${item.code} — ${item.name}`,
                      code: item.code,
                      name: item.name,
                    }))
                    setIcd10Options(options)
                  } catch {
                    setIcd10Options([])
                  }
                }, 350)
              }}
              onChange={(_value, option) => {
                const opt = option as any
                addDiagnosisForm.setFieldsValue({
                  icd_code: opt?.code || '',
                  icd_name: opt?.name || ''
                })
              }}
              options={icd10Options}
            />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.icd_code !== curr.icd_code}>
            {() => (
              <Form.Item name="icd_code" noStyle>
                <Input type="hidden" />
              </Form.Item>
            )}
          </Form.Item>
          <Row gutter={12}>
            <Col xs={12}>
              <Form.Item label="Tashxis turi" name="type" initialValue="main">
                <Select>
                  <Select.Option value="main">Asosiy</Select.Option>
                  <Select.Option value="secondary">Qo'shimcha</Select.Option>
                  <Select.Option value="complication">Asorat</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item label="Holati" name="status" initialValue="preliminary">
                <Select>
                  <Select.Option value="preliminary">Dastlabki</Select.Option>
                  <Select.Option value="confirmed">Tasdiqlangan</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Izoh" name="notes">
            <Input.TextArea rows={2} placeholder="Qo'shimcha izohlar..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Lab Order Modal (TASK-008: Analiz buyurish) */}
      <Modal
        title="Analiz buyurish"
        open={addLabOrderModalOpen}
        onCancel={() => { setAddLabOrderModalOpen(false); labOrderForm.resetFields() }}
        onOk={() => labOrderForm.submit()}
        confirmLoading={createLabOrderMutation.isPending}
        okText="Buyurish"
        okButtonProps={{ style: { background: '#d4af37' } }}
        width={560}
      >
        {isEpisodeCompleted && (
          <Alert
            type="warning"
            message="Bu epizod tugallangan. Analiz buyurish uchun yangi epizod yarating."
            style={{ marginBottom: 16 }}
          />
        )}
        <Form
          form={labOrderForm}
          layout="vertical"
          onFinish={(values) => {
            createLabOrderMutation.mutate({
              analysis_name: values.analysis_name,
              category: values.category,
              priority: values.priority || 'normal',
              clinical_note: values.clinical_note || '',
              doctor_note: values.doctor_note || '',
            })
          }}
        >
          <Form.Item
            label="Tahlil nomi"
            name="analysis_name"
            rules={[{ required: true, message: 'Tahlil nomi kiritish majburiy' }]}
          >
            <Input placeholder="Masalan: Umumiy qon tahlili, Siydik tahlili" />
          </Form.Item>
          <Row gutter={12}>
            <Col xs={12}>
              <Form.Item
                label="Kategoriya"
                name="category"
                rules={[{ required: true, message: 'Kategoriya tanlash majburiy' }]}
              >
                <Select placeholder="Kategoriyani tanlang">
                  <Select.Option value="blood">Qon</Select.Option>
                  <Select.Option value="urine">Siydik</Select.Option>
                  <Select.Option value="biochemistry">Biokimyo</Select.Option>
                  <Select.Option value="other">Boshqa</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={12}>
              <Form.Item label="Prioritet" name="priority" initialValue="normal">
                <Select>
                  <Select.Option value="normal">Oddiy</Select.Option>
                  <Select.Option value="urgent">Shoshilinch</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Klinika izohi" name="clinical_note">
            <Input.TextArea rows={2} placeholder="Klinika uchun qo'shimcha ma'lumotlar..." />
          </Form.Item>
          <Form.Item label="Shifokor izohi" name="doctor_note">
            <Input.TextArea rows={2} placeholder="Shifokor uchun qo'shimcha ma'lumotlar..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Lab Order Result Entry Modal (TASK-008 Phase 8C/8D: Natija kiritish) */}
      <Modal
        title={
          <Space>
            <EditOutlined />
            <span>Natija kiritish</span>
          </Space>
        }
        open={resultEntryModalOpen}
        onCancel={() => { setResultEntryModalOpen(false); setSelectedLabOrder(null); resultEntryForm.resetFields() }}
        onOk={() => {
          if (!selectedLabOrder) {
            message.error('Bemor tanlanmagan')
            return
          }
          resultEntryForm.submit()
        }}
        confirmLoading={saveLabOrderResultMutation.isPending}
        okText="Saqlash"
        okButtonProps={{ style: { background: '#d4af37' }, disabled: !selectedLabOrder }}
        width={560}
      >
        {selectedLabOrder ? (
          <Alert
            type="info"
            message={
              <Space direction="vertical" size={4}>
                <Text strong>{selectedLabOrder?.analysis_name || '-'}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Kategoriya: {getLabCategoryLabel(selectedLabOrder?.category)} |
                  Buyurilgan: {formatDate(selectedLabOrder?.ordered_at || '')}
                </Text>
              </Space>
            }
            style={{ marginBottom: 16 }}
          />
        ) : null}
        <Form
          form={resultEntryForm}
          layout="vertical"
          onFinish={(values) => {
            saveLabOrderResultMutation.mutate({
              result_text: values.result_text,
              result_note: values.result_note || '',
              result_status: values.result_status,
            })
          }}
        >
          <Form.Item
            label="Natija holati"
            name="result_status"
            rules={[{ required: true, message: 'Natija holati tanlash majburiy' }]}
          >
            <Select placeholder="Natija holatini tanlang">
              <Select.Option value="normal">
                <Space>
                  <Tag color="success" style={{ margin: 0 }}>Normal</Tag>
                  <Text>Normal qiymatlar</Text>
                </Space>
              </Select.Option>
              <Select.Option value="abnormal">
                <Space>
                  <Tag color="warning" style={{ margin: 0 }}>Anormal</Tag>
                  <Text>Normaldan og'ishgan</Text>
                </Space>
              </Select.Option>
              <Select.Option value="critical">
                <Space>
                  <Tag color="error" style={{ margin: 0 }}>Kritik</Tag>
                  <Text>Tez tibbiy aralashuv talab qiladi</Text>
                </Space>
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Tahlil natijasi"
            name="result_text"
            rules={[{ required: true, message: 'Tahlil natijasi kiritish majburiy' }]}
          >
            <Input.TextArea rows={6} placeholder="Tahlil natijalarini kiriting..." />
          </Form.Item>
          <Form.Item label="Izoh" name="result_note">
            <Input.TextArea rows={2} placeholder="Qo'shimcha izohlar (ixtiyoriy)..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
