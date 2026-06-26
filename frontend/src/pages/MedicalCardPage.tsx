import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Typography, Card, Tabs, Table, Tag, Button, Space, Modal, Form,
  Input, Select, message, Row, Col, Descriptions, Divider, Empty,
  Spin, Alert, DescriptionsProps, Badge, Tooltip
} from 'antd'
import {
  ArrowLeftOutlined, UserOutlined, HeartOutlined, MedicineBoxOutlined,
  ExperimentOutlined, FileTextOutlined, PlusOutlined, ReloadOutlined,
  BugOutlined, ExperimentOutlined as LabOutlined, ScanOutlined,
  MedicineBoxOutlined as PillOutlined, ThunderboltOutlined, CalendarOutlined,
  PhoneOutlined, EnvironmentOutlined, WarningOutlined
} from '@ant-design/icons'
import { formatDate } from '../i18n/uz'
import {
  patientService, medicalCardService, appointmentService, patientProfileService
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

export function MedicalCardPage() {
  const { id, patientId: legacyPatientId } = useParams()
  const patientId = id || legacyPatientId
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  // Stable tab from URL query param
  const [activeTab, setActiveTab] = useState(() =>
    searchParams.get('tab') || 'current-examination'
  )

  const appointmentIdFromUrl = searchParams.get('appointment_id')
  const tabFromUrl = searchParams.get('tab')

  // Sync tab changes to URL query param
  const handleTabChange = (key: string) => {
    setActiveTab(key)
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('tab', key)
      return next
    })
  }

  // Apply tab from URL on mount
  useEffect(() => {
    if (tabFromUrl && TAB_ORDER.some(t => t.key === tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  // ============ DATA QUERIES ============

  // Patient data
  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientService.get(patientId!),
    enabled: !!patientId,
  })

  // Medical card
  const { data: medicalCardData } = useQuery({
    queryKey: ['medicalCard', patientId],
    queryFn: () => medicalCardService.getMedicalCard(patientId!),
    enabled: !!patientId,
  })

  // Patient profile (for allergies, blood type, etc.)
  const { data: profileData } = useQuery({
    queryKey: ['patientProfile', patientId],
    queryFn: () => patientProfileService.getProfile(patientId!),
    enabled: !!patientId,
  })

  // Patient episodes
  const { data: episodesData, isLoading: episodesLoading, refetch: refetchEpisodes } = useQuery({
    queryKey: ['episodes', patientId],
    queryFn: () => medicalCardService.getEpisodes(patientId!),
    enabled: !!patientId,
  })

  // Appointment context (if opened from Appointments/Doctor)
  const { data: appointmentData, isLoading: appointmentLoading } = useQuery({
    queryKey: ['appointmentContext', appointmentIdFromUrl],
    queryFn: () => appointmentService.get(appointmentIdFromUrl!),
    enabled: !!appointmentIdFromUrl,
  })

  // Episode by appointment (for duplicate prevention)
  const { data: episodeByApptData, refetch: refetchEpisodeByAppt } = useQuery({
    queryKey: ['episodeByAppointment', appointmentIdFromUrl],
    queryFn: () => appointmentService.getEpisode(appointmentIdFromUrl!),
    enabled: !!appointmentIdFromUrl,
  })

  // Selected episode details
  const selectedEpisodeId = episodeByApptData?.data?.id
    || episodesData?.data?.[0]?.id
    || null

  // Episode vitals
  const { data: vitalsData } = useQuery({
    queryKey: ['episodeVitals', selectedEpisodeId],
    queryFn: () => medicalCardService.getEpisodeVitals(selectedEpisodeId!),
    enabled: !!selectedEpisodeId,
    refetchInterval: false,
  })

  // Episode diagnoses
  const { data: diagnosesData } = useQuery({
    queryKey: ['episodeDiagnoses', selectedEpisodeId],
    queryFn: () => medicalCardService.getEpisodeDiagnoses(selectedEpisodeId!),
    enabled: !!selectedEpisodeId,
    refetchInterval: false,
  })

  // Episode recommendations
  const { data: recommendationsData } = useQuery({
    queryKey: ['episodeRecommendations', selectedEpisodeId],
    queryFn: () => medicalCardService.getEpisodeRecommendations(selectedEpisodeId!),
    enabled: !!selectedEpisodeId,
    refetchInterval: false,
  })

  // Episode details
  const { data: episodeDetailData } = useQuery({
    queryKey: ['episodeDetail', selectedEpisodeId],
    queryFn: () => medicalCardService.getEpisode(selectedEpisodeId!),
    enabled: !!selectedEpisodeId,
    refetchInterval: false,
  })

  // ============ MODALS ============
  const [createEpisodeModalOpen, setCreateEpisodeModalOpen] = useState(false)
  const [createEpisodeForm] = Form.useForm()

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

  // ============ DERIVED DATA ============
  const medicalCard = medicalCardData?.data
  const profile = profileData
  const episodes = episodesData?.data || []
  const appointment = appointmentData
  const episodeByAppt = episodeByApptData?.data
  const vitals = vitalsData?.data
  const diagnoses = diagnosesData?.data || []
  const recommendations = recommendationsData?.data || []
  const episodeDetail = episodeDetailData?.data

  // Active episode (either from appointment or latest)
  const activeEpisode = episodeByAppt || episodes?.[0] || null
  const hasActiveEpisode = !!activeEpisode
  const episodeLinkedToAppointment = !!episodeByAppt

  // ============ STATUS HELPERS ============
  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      active: 'processing', completed: 'success', cancelled: 'error',
      scheduled: 'blue', waiting: 'orange', in_progress: 'cyan',
    }
    return map[s] || 'default'
  }

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      active: 'Faol', completed: 'Tugallangan', cancelled: 'Bekor',
      scheduled: 'Rejalashtirilgan', waiting: 'Kutmoqda', in_progress: 'Davom etmoqda',
    }
    return map[s] || s
  }

  // ============ LOADING STATE ============
  if (patientLoading) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#8c8c8c' }}>Yuklanmoqda...</div>
      </div>
    )
  }

  // ============ ERROR STATE ============
  if (!patient) {
    return (
      <div style={{ padding: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/patients')}
          style={{ marginBottom: 16 }}
        >
          Bemorlar ro'yxati
        </Button>
        <Card>
          <Empty description="Bemor topilmadi" />
        </Card>
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
      <div
        style={{
          background: 'linear-gradient(135deg, #081423 0%, #0d1f35 100%)',
          borderBottom: '1px solid rgba(212,175,55,0.15)',
          padding: '16px 24px',
        }}
      >
        {/* Back + Patient Profile button */}
        <div style={{ marginBottom: 12 }}>
          <Space wrap>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(`/patients/${patientId}`)}
              style={{ marginRight: 8 }}
            >
              Profilga qaytish
            </Button>
            <Button
              icon={<UserOutlined />}
              onClick={() => navigate(`/patients/${patientId}`)}
              style={{ background: 'rgba(212,175,55,0.15)', borderColor: '#d4af37', color: '#d4af37' }}
            >
              Bemor profili
            </Button>
          </Space>
        </div>

        {/* Patient info row */}
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
                  <Tag color="gold" style={{ fontWeight: 600 }}>
                    MED-ID: {patient.med_id}
                  </Tag>
                )}
              </Space>
              <Space wrap>
                <Text style={{ color: 'rgba(255,255,255,0.6)' }}>
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  {formatDate(patient.birth_date)}
                  {' · '}
                  {patient.gender === 'male' ? 'Erkak' : 'Ayol'}
                </Text>
                {patient.phone && (
                  <Text style={{ color: 'rgba(255,255,255,0.6)' }}>
                    <PhoneOutlined style={{ marginRight: 4 }} />
                    {patient.phone}
                  </Text>
                )}
              </Space>
            </Space>
          </Col>
          <Col flex="none">
            <Space direction="vertical" size={4} align="end">
              {/* Blood Group */}
              <Tag
                color={bloodGroup !== '-' ? 'red' : 'default'}
                style={{ fontSize: 13, padding: '2px 10px', minWidth: 80, textAlign: 'center' }}
              >
                {bloodGroup !== '-' ? `${bloodGroup} ${rhFactor}` : 'Qon: -'}
              </Tag>
              {/* Allergies */}
              {allergyCount > 0 && (
                <Tag color="warning" icon={<WarningOutlined />}>
                  Allergiya: {allergyCount} ta
                </Tag>
              )}
              {/* Appointment badge */}
              {appointment && (
                <Tag color={statusColor(appointment.status)}>
                  {statusLabel(appointment.status)}
                </Tag>
              )}
            </Space>
          </Col>
        </Row>

        {/* Appointment info card (if opened from appointment) */}
        {appointment && (
          <Alert
            type="info"
            icon={<CalendarOutlined />}
            message={
              <Space>
                <Text strong style={{ color: '#fff' }}>
                  Qabul konteksti:{' '}
                  {appointment.service?.name || 'Xizmat ko\'rsatilmagan'}
                  {' · '}
                  Dr. {appointment.doctor?.last_name} {appointment.doctor?.first_name}
                  {' · '}
                  {formatDate(appointment.appointment_date)} {appointment.start_time}
                  {' · '}
                  <Badge status={statusColor(appointment.status) as any} text={
                    <Text style={{ color: '#fff' }}>{statusLabel(appointment.status)}</Text>
                  } />
                </Text>
              </Space>
            }
            style={{
              marginTop: 12,
              background: 'rgba(24,144,255,0.15)',
              border: '1px solid rgba(24,144,255,0.3)',
            }}
          />
        )}
      </div>
    )
  }

  // ============ CURRENT EXAMINATION TAB ============
  const renderCurrentExamination = () => {
    return (
      <div>
        {/* Episode action bar */}
        <Card
          size="small"
          style={{ marginBottom: 16, background: 'rgba(13,26,48,0.6)' }}
          bodyStyle={{ padding: '12px 16px' }}
        >
          <Space>
            {hasActiveEpisode ? (
              <>
                <Tag color={statusColor(activeEpisode.status)}>
                  {statusLabel(activeEpisode.status)} epizod
                </Tag>
                {episodeLinkedToAppointment && (
                  <Tag color="blue" icon={<CalendarOutlined />}>
                    Qabulga bog'langan
                  </Tag>
                )}
                <Text type="secondary">
                  {activeEpisode.title} · {formatDate(activeEpisode.started_at)}
                  {activeEpisode.doctor && (
                    <> · Dr. {activeEpisode.doctor.last_name} {activeEpisode.doctor.first_name}</>
                  )}
                </Text>
              </>
            ) : (
              <Text type="secondary">Bu bemorda faol epizod yo'q</Text>
            )}
          </Space>

          {!hasActiveEpisode && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateEpisodeModalOpen(true)}
              style={{ marginLeft: 'auto', background: '#d4af37', borderColor: '#d4af37' }}
            >
              Epizod yaratish
            </Button>
          )}
        </Card>

        {/* Episode details card */}
        {activeEpisode && (
          <Card
            title={`Epizod: ${activeEpisode.title}`}
            size="small"
            style={{ marginBottom: 16, background: 'rgba(13,26,48,0.6)' }}
            extra={
              <Space>
                <Tag color={statusColor(activeEpisode.status)}>{statusLabel(activeEpisode.status)}</Tag>
                {activeEpisode.conclusion && (
                  <Text type="secondary">Xulosa: {activeEpisode.conclusion}</Text>
                )}
              </Space>
            }
          >
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="Boshlandi">{formatDate(activeEpisode.started_at)}</Descriptions.Item>
              <Descriptions.Item label="Holati">{statusLabel(activeEpisode.status)}</Descriptions.Item>
              {activeEpisode.doctor && (
                <Descriptions.Item label="Shifokor">
                  {activeEpisode.doctor.last_name} {activeEpisode.doctor.first_name}
                </Descriptions.Item>
              )}
              {activeEpisode.AppointmentID && (
                <Descriptions.Item label="Qabul ID">
                  <Tag>{activeEpisode.AppointmentID}</Tag>
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Encounters list */}
            {episodeDetail?.Encounters && episodeDetail.Encounters.length > 0 && (
              <>
                <Divider orientation="left" plain style={{ margin: '12px 0' }}>
                  Ko'riklar tarixi
                </Divider>
                <Table
                  size="small"
                  dataSource={episodeDetail.Encounters}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    { title: 'Sana', dataIndex: 'VisitDate', key: 'VisitDate', render: (d: string) => d ? formatDate(d) : '-' },
                    { title: 'Shikoyat', dataIndex: 'Complaints', key: 'Complaints', render: (t: string) => t || '-' },
                    { title: 'Ko\'rik', dataIndex: 'Examination', key: 'Examination', render: (t: string) => t || '-' },
                    { title: 'Holat', dataIndex: 'Status', key: 'Status', render: (s: string) => <Tag>{statusLabel(s)}</Tag> },
                  ]}
                />
              </>
            )}
          </Card>
        )}

        {/* Episode history */}
        <Card
          title="Epizodlar tarixi"
          size="small"
          style={{ background: 'rgba(13,26,48,0.6)' }}
          extra={
            <Button size="small" icon={<ReloadOutlined />} onClick={() => refetchEpisodes()}>
              Yangilash
            </Button>
          }
        >
          {episodesLoading ? (
            <div style={{ textAlign: 'center', padding: 20 }}><Spin /></div>
          ) : episodes.length > 0 ? (
            <Table
              size="small"
              dataSource={episodes}
              rowKey="id"
              pagination={{ pageSize: 10, showSizeChanger: false }}
              columns={[
                { title: 'Sana', dataIndex: 'started_at', key: 'started_at', render: (d: string) => formatDate(d) },
                { title: 'Sarlavha', dataIndex: 'title', key: 'title' },
                {
                  title: 'Shifokor', key: 'doctor',
                  render: (_: any, r: any) =>
                    r.doctor ? `${r.doctor.last_name} ${r.doctor.first_name}` : '-'
                },
                {
                  title: 'Holat', dataIndex: 'status', key: 'status',
                  render: (s: string) => <Tag color={statusColor(s)}>{statusLabel(s)}</Tag>
                },
              ]}
            />
          ) : (
            <Empty description="Tibbiy epizodlar mavjud emas" />
          )}
        </Card>
      </div>
    )
  }

  // ============ ANTHROPOMETRY TAB ============
  const renderAnthropometry = () => (
    <Card
      title="Antropometrik ko'rsatkichlar"
      size="small"
      style={{ background: 'rgba(13,26,48,0.6)' }}
      extra={
        hasActiveEpisode ? (
          <Tag color="processing">Faol epizodga bog'langan</Tag>
        ) : (
          <Tag type="secondary">Epizod tanlang</Tag>
        )
      }
    >
      {selectedEpisodeId ? (
        vitals ? (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Bo'y">{vitals.height ? `${vitals.height} sm` : '-'}</Descriptions.Item>
            <Descriptions.Item label="Vazn">{vitals.weight ? `${vitals.weight} kg` : '-'}</Descriptions.Item>
            <Descriptions.Item label="Harorat">{vitals.temperature ? `${vitals.temperature}°C` : '-'}</Descriptions.Item>
            <Descriptions.Item label="Qon bosimi">
              {vitals.bp_systolic ? `${vitals.bp_systolic}/${vitals.bp_diastolic} mmHg` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Puls">{vitals.pulse ? `${vitals.pulse} /daqiqa` : '-'}</Descriptions.Item>
            <Descriptions.Item label="Qon shakari">
              {vitals.blood_sugar ? `${vitals.blood_sugar} mmol/L` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="BMI">
              {vitals.weight && vitals.height
                ? (vitals.weight / ((vitals.height / 100) ** 2)).toFixed(1)
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Bel aylana">
              {vitals.waist ? `${vitals.waist} sm` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Sana">
              {vitals.recorded_at ? formatDate(vitals.recorded_at) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Izoh" span={2}>{vitals.comments || '-'}</Descriptions.Item>
          </Descriptions>
        ) : (
          <Empty description="Antropometrik ma'lumotlar kiritilmagan" />
        )
      ) : (
        <Empty description="Epizod tanlang — ma'lumotlar shu yerda ko'rsatiladi" />
      )}
    </Card>
  )

  // ============ DIAGNOSES TAB ============
  const renderDiagnoses = () => (
    <Card
      title="Tashxislar tarixi (ICD-10)"
      size="small"
      style={{ background: 'rgba(13,26,48,0.6)' }}
    >
      {selectedEpisodeId ? (
        diagnoses.length > 0 ? (
          <Table
            size="small"
            dataSource={diagnoses}
            rowKey="id"
            pagination={false}
            columns={[
              { title: 'Sana', dataIndex: 'created_at', key: 'created_at', render: (d: string) => formatDate(d) },
              { title: 'ICD-10', dataIndex: 'icd_code', key: 'icd_code', render: (c: string) => <Tag color="blue">{c}</Tag> },
              { title: 'Tashxis', dataIndex: 'icd_name', key: 'icd_name' },
              {
                title: 'Turi', dataIndex: 'type', key: 'type',
                render: (t: string) => (
                  <Tag color={t === 'main' ? 'red' : 'orange'}>
                    {t === 'main' ? 'Asosiy' : "Qo'shimcha"}
                  </Tag>
                )
              },
              {
                title: 'Holat', dataIndex: 'status', key: 'status',
                render: (s: string) => (
                  <Tag color={s === 'preliminary' ? 'orange' : 'success'}>
                    {s === 'preliminary' ? 'Dastlabki' : 'Tasdiqlangan'}
                  </Tag>
                )
              },
            ]}
          />
        ) : (
          <Empty description="Tashxislar mavjud emas" />
        )
      ) : (
        <Empty description="Epizod tanlang" />
      )}
    </Card>
  )

  // ============ EXAMINATIONS TAB ============
  const renderExaminations = () => (
    <Card
      title="Ko'rik natijalari"
      size="small"
      style={{ background: 'rgba(13,26,48,0.6)' }}
    >
      {selectedEpisodeId ? (
        episodeDetail?.Encounters && episodeDetail.Encounters.length > 0 ? (
          <div>
            {episodeDetail.Encounters.map((enc: any) => (
              <Card
                key={enc.id}
                size="small"
                style={{ marginBottom: 12, background: 'rgba(26,42,74,0.5)' }}
                title={formatDate(enc.VisitDate || enc.visit_date)}
              >
                {enc.Examination || enc.examination ? (
                  <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit', fontSize: 13 }}>
                    {enc.Examination || enc.examination}
                  </pre>
                ) : (
                  <Text type="secondary">Ko'rik matni kiritilmagan</Text>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Empty description="Ko'rik natijalari mavjud emas" />
        )
      ) : (
        <Empty description="Epizod tanlang" />
      )}
    </Card>
  )

  // ============ ANALYSES TAB ============
  const renderAnalyses = () => (
    <Card
      title="Analizlar"
      size="small"
      style={{ background: 'rgba(13,26,48,0.6)' }}
    >
      <Empty description="Analizlar natijalari tez orada qo'shiladi" />
    </Card>
  )

  // ============ DIAGNOSTICS TAB ============
  const renderDiagnostics = () => (
    <Card
      title="Diagnostika"
      size="small"
      style={{ background: 'rgba(13,26,48,0.6)' }}
    >
      <Empty description="Diagnostika natijalari tez orada qo'shiladi" />
    </Card>
  )

  // ============ PRESCRIPTIONS TAB ============
  const renderPrescriptions = () => (
    <Card
      title="Retseptlar"
      size="small"
      style={{ background: 'rgba(13,26,48,0.6)' }}
    >
      <Empty description="Retseptlar tez orada qo'shiladi" />
    </Card>
  )

  // ============ TREATMENT TAB ============
  const renderTreatment = () => (
    <Card
      title="Davolash kurslari"
      size="small"
      style={{ background: 'rgba(13,26,48,0.6)' }}
    >
      {selectedEpisodeId && recommendations.length > 0 ? (
        <Table
          size="small"
          dataSource={recommendations}
          rowKey="id"
          pagination={false}
          columns={[
            { title: 'Sana', dataIndex: 'created_at', key: 'created_at', render: (d: string) => formatDate(d) },
            { title: 'Turi', dataIndex: 'type', key: 'type', render: (t: string) => <Tag>{t}</Tag> },
            { title: 'Tavsif', dataIndex: 'description', key: 'description' },
            { title: "Ko'rsatma", dataIndex: 'instructions', key: 'instructions', render: (i: string) => i || '-' },
          ]}
        />
      ) : (
        <Empty description="Davolash kurslari tez orada qo'shiladi" />
      )}
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

  // ============ DOCTORS LIST FOR MODAL ============
  const { data: doctorsData } = useQuery({
    queryKey: ['staff-doctors'],
    queryFn: () => {
      const { staffService } = require('../services/api')
      return staffService.listDoctors()
    },
  })
  const doctors = doctorsData?.data || []

  return (
    <div>
      {/* Medical Card Header */}
      {renderHeader()}

      {/* 8 Tabs */}
      <div style={{ padding: '16px 24px 24px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={TAB_ORDER.map(tab => ({
            key: tab.key,
            label: (
              <Space>
                {tab.icon}
                <span>{tab.label}</span>
              </Space>
            ),
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
          <Alert
            type="info"
            message={
              <Text>
                Bu epizod quyidagi qabulga bog'lanadi:{' '}
                <strong>{appointment.service?.name || 'Xizmat'}</strong> ·{' '}
                Dr. {appointment.doctor?.last_name} {appointment.doctor?.first_name} ·{' '}
                {formatDate(appointment.appointment_date)} {appointment.start_time}
              </Text>
            }
            style={{ marginBottom: 16 }}
          />
        )}
        <Form
          form={createEpisodeForm}
          layout="vertical"
          onFinish={(values) => createEpisodeMutation.mutate(values)}
          initialValues={{
            title: appointment?.service?.name
              ? `Qabul: ${appointment.service.name}`
              : 'Shikoyat',
            doctor_id: appointment?.doctor?.id || '',
          }}
        >
          <Form.Item
            label="Epizod sarlavhasi"
            name="title"
            rules={[{ required: true, message: 'Sarlavha kiritish majburiy' }]}
          >
            <Input placeholder="Shikoyat nomi" />
          </Form.Item>
          <Form.Item
            label="Shifokor"
            name="doctor_id"
            rules={[{ required: true, message: 'Shifokor tanlash majburiy' }]}
          >
            <Select
              placeholder="Shifokor tanlang"
              showSearch
              optionFilterProp="children"
              options={doctors.map((d: any) => ({
                value: d.id,
                label: `${d.last_name} ${d.first_name} ${d.specialty ? `— ${d.specialty}` : ''}`,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
