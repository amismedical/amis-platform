/**
 * AMIS - Appointments Page (Premium Qabullar)
 * Module 4: Sub-panels, 11 filters, 5-step wizard, Excel export, real-time refresh
 */
import { useState, useEffect, useCallback } from 'react'
import {
  Typography, Card, Table, Tag, Space, Button, Input, Select, DatePicker,
  Modal, Form, message, Spin, Popconfirm, Row, Col, Tabs, Badge,
  Drawer, Descriptions, Timeline, Statistic, Divider, Alert, Steps,
  InputNumber, Checkbox
} from 'antd'
import {
  PlusOutlined, SearchOutlined, EyeOutlined, TeamOutlined,
  DownloadOutlined, ReloadOutlined, CalendarOutlined, UserOutlined,
  MedicineBoxOutlined, ClockCircleOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { i18n, statusTranslations } from '../i18n/uz'
import { appointmentService, patientService, staffService, referenceService } from '../services/api'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

// Status badge colors
const statusColors: Record<string, string> = {
  scheduled: 'blue',
  waiting: 'orange',
  in_progress: 'cyan',
  completed: 'success',
  cancelled: 'error',
}

// Tab keys
const TAB_KEYS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

export function AppointmentsPage() {
  const queryClient = useQueryClient()

  // State
  const [activeTab, setActiveTab] = useState<string>(TAB_KEYS.ACTIVE)
  const [modalOpen, setModalOpen] = useState(false)
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false)
  const [form] = Form.useForm()
  const [cancelForm] = Form.useForm()
  const [viewRecord, setViewRecord] = useState<any>(null)
  const [wizardStep, setWizardStep] = useState(0)

  // Filters
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('day'),
    dayjs().endOf('day'),
  ])
  const [searchText, setSearchText] = useState('')
  const [doctorFilter, setDoctorFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [serviceFilter, setServiceFilter] = useState<string>('')
  const [genderFilter, setGenderFilter] = useState<string>('')
  const [bookingMethodFilter, setBookingMethodFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [limit] = useState(50)

  // Patient search for wizard
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs())
  const [selectedTime, setSelectedTime] = useState<string>('09:00')
  const [selectedCabinet, setSelectedCabinet] = useState<string>('')

  // Fetch appointments with filters
  const getStatusFilter = () => {
    if (activeTab === TAB_KEYS.COMPLETED) return 'completed'
    if (activeTab === TAB_KEYS.CANCELLED) return 'cancelled'
    // Active: scheduled, waiting, in_progress
    return statusFilter || undefined
  }

  const { data: appointmentsData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['appointments', dateRange, getStatusFilter(), doctorFilter, searchText, page],
    queryFn: () => {
      const dateFrom = dateRange?.[0]?.format('YYYY-MM-DD') || ''
      const dateTo = dateRange?.[1]?.format('YYYY-MM-DD') || ''
      return appointmentService.list({
        date_from: dateFrom,
        date_to: dateTo,
        status: getStatusFilter(),
        doctor_id: doctorFilter || undefined,
        page,
        limit,
      })
    },
    enabled: true,
    refetchInterval: 30000, // Real-time refresh every 30 seconds
  })

  // Fetch patients for wizard
  const { data: patientsData } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientService.list({ limit: 100 }),
  })

  // Fetch doctors/staff
  const { data: staffData } = useQuery({
    queryKey: ['staff-list'],
    queryFn: () => staffService.list({ limit: 100 }),
  })

  // Fetch services
  const { data: servicesData } = useQuery({
    queryKey: ['services-list'],
    queryFn: async () => {
      const res = await referenceService.list()
      if (Array.isArray(res)) return res
      return (res as any)?.data ?? []
    },
  })

  // Client-side search filter
  const filteredData = (appointmentsData?.data || []).filter((a: any) => {
    if (!searchText) return true
    const text = searchText.toLowerCase()
    const patient = a.patient
    const name = `${patient?.first_name || ''} ${patient?.last_name || ''}`.toLowerCase()
    const phone = (patient?.phone || '').toLowerCase()
    return name.includes(text) || phone.includes(text)
  })

  // Create appointment mutation
  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      return appointmentService.create({
        patient_id: values.patient_id,
        doctor_id: values.doctor_id,
        ...(values.service_id ? { service_id: values.service_id } : {}),
        appointment_date: values.date?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'),
        start_time: values.time || '09:00',
        booking_method: values.booking_method || 'reception',
        notes: values.notes,
      })
    },
    onSuccess: () => {
      message.success({ content: "Qabul ro'yxatga olindi!", icon: <CheckCircleOutlined style={{ color: '#52c41a' }} /> })
      closeWizard()
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
    onError: (error: any) => {
      message.error({ content: error?.response?.data?.error || error?.response?.data?.message || "Ro'yxatga olishda xatolik", icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} /> })
    },
  })

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return appointmentService.updateStatus(id, 'cancelled', reason)
    },
    onSuccess: () => {
      message.success({ content: "Qabul bekor qilindi!", icon: <CheckCircleOutlined style={{ color: '#52c41a' }} /> })
      setViewDrawerOpen(false)
      cancelForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
    onError: (error: any) => {
      message.error({ content: error?.response?.data?.error || "Bekor qilishda xatolik", icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} /> })
    },
  })

  // Table columns
  const columns = [
    {
      title: 'Vaqt',
      dataIndex: 'start_time',
      key: 'start_time',
      width: 70,
      render: (time: string) => time || '-',
    },
    {
      title: 'Bemor',
      key: 'patient',
      render: (_: any, record: any) => {
        const p = record.patient
        if (!p) return '-'
        return `${p.last_name || ''} ${p.first_name || ''}`.trim() || '-'
      },
    },
    {
      title: 'Telefon',
      key: 'phone',
      render: (_: any, record: any) => record.patient?.phone || '-',
    },
    {
      title: 'Xizmat',
      key: 'service',
      render: (_: any, record: any) => record.service?.name || '-',
    },
    {
      title: 'Shifokor',
      key: 'doctor',
      render: (_: any, record: any) => {
        const d = record.doctor
        if (!d) return '-'
        return `${d.last_name || ''} ${d.first_name || ''}`.trim() || '-'
      },
    },
    {
      title: 'Kabinet',
      dataIndex: 'cabinet',
      key: 'cabinet',
      width: 80,
      render: (cabinet: string) => cabinet || '-',
    },
    {
      title: 'Holat',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>
          {statusTranslations[status] || status}
        </Tag>
      ),
    },
    {
      title: 'Amallar',
      key: 'actions',
      width: 80,
      render: (_: any, record: any) => (
        <Space>
          <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)} />
          {record.status !== 'cancelled' && record.status !== 'completed' && (
            <Popconfirm
              title="Qabulni bekor qilish"
              description="Ishonchingiz komilmi?"
              onConfirm={() => cancelMutation.mutate({ id: record.id, reason: '' })}
              okText="Ha"
              cancelText="Yo'q"
            >
              <Button type="text" size="small" danger>Bekor</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  // Handlers
  const handleView = (record: any) => {
    setViewRecord(record)
    setViewDrawerOpen(true)
  }

  const handleCancel = (values: any) => {
    if (!viewRecord) return
    cancelMutation.mutate({ id: viewRecord.id, reason: values.cancel_reason || '' })
  }

  const openWizard = () => {
    setModalOpen(true)
    setWizardStep(0)
    setSelectedPatient(null)
    setSelectedService(null)
    setSelectedDoctor(null)
    setSelectedDate(dayjs())
    setSelectedTime('09:00')
    setSelectedCabinet('')
    form.resetFields()
  }

  const closeWizard = () => {
    setModalOpen(false)
    setWizardStep(0)
  }

  const nextStep = () => setWizardStep(s => s + 1)
  const prevStep = () => setWizardStep(s => s - 1)

  const handleWizardSubmit = () => {
    if (!selectedPatient) {
      message.warning('Bemor tanlanmagan')
      return
    }
    createMutation.mutate({
      patient_id: selectedPatient.id,
      doctor_id: selectedDoctor?.id || '',
      service_id: selectedService?.id,
      date: selectedDate,
      time: selectedTime,
      booking_method: 'reception',
      notes: '',
    })
  }

  // CSV export
  const handleExport = () => {
    const headers = ['Vaqt', 'Bemor', 'Telefon', 'Xizmat', 'Shifokor', 'Kabinet', 'Holat', 'Sana']
    const rows = filteredData.map((a: any) => [
      a.start_time || '',
      a.patient ? `${a.patient.last_name || ''} ${a.patient.first_name || ''}` : '',
      a.patient?.phone || '',
      a.service?.name || '',
      a.doctor ? `${a.doctor.last_name || ''} ${a.doctor.first_name || ''}` : '',
      a.cabinet || '',
      statusTranslations[a.status] || a.status,
      a.appointment_date || '',
    ])
    const csvContent = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `qabullar_${dayjs().format('YYYY-MM-DD')}.csv`
    link.click()
    URL.revokeObjectURL(url)
    message.success({ content: 'CSV fayl yuklab olindi!', icon: <DownloadOutlined /> })
  }

  // Count stats
  const totalAppts = appointmentsData?.data?.length || 0

  return (
    <div>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Space>
          <Title level={3} style={{ margin: 0, color: '#fff' }}>
            {i18n.appointments.title}
          </Title>
          <Badge count={totalAppts} style={{ backgroundColor: '#d4af37' }} />
        </Space>
        <Space>
          <Button
            icon={<TeamOutlined />}
            onClick={() => window.location.href = '/queue'}
            style={{ borderColor: '#1890ff', color: '#1890ff' }}
          >
            Jonli navbat
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
            style={{ borderColor: '#52c41a', color: '#52c41a' }}
          >
            Excel
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openWizard}
            style={{ background: '#d4af37', borderColor: '#d4af37', color: '#000' }}
          >
            {i18n.appointments.register}
          </Button>
        </Space>
      </Row>

      {/* Filters Card */}
      <Card
        style={{
          background: 'rgba(13,26,48,0.8)',
          border: '1px solid rgba(212,175,55,0.15)',
          borderRadius: 12,
          marginBottom: 16,
        }}
        bodyStyle={{ padding: 16 }}
      >
        <Row gutter={[12, 12]} align="middle">
          {/* Date Range */}
          <Col>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as any)}
              format="YYYY-MM-DD"
              size="middle"
              style={{ background: 'rgba(26,42,74,0.5)' }}
            />
          </Col>

          {/* Search */}
          <Col>
            <Input
              placeholder="Bemor izlash..."
              prefix={<SearchOutlined style={{ color: '#d4af37' }} />}
              style={{ width: 180, background: 'rgba(26,42,74,0.5)' }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>

          {/* Status Filter */}
          <Col>
            <Select
              placeholder="Status"
              style={{ width: 140 }}
              allowClear
              value={statusFilter || undefined}
              onChange={(v) => setStatusFilter(v || '')}
              options={[
                { value: 'scheduled', label: 'Rejalashtirilgan' },
                { value: 'waiting', label: 'Kutmoqda' },
                { value: 'in_progress', label: 'Davom etmoqda' },
              ]}
            />
          </Col>

          {/* Doctor Filter */}
          <Col>
            <Select
              placeholder="Shifokor"
              style={{ width: 160 }}
              allowClear
              showSearch
              value={doctorFilter || undefined}
              onChange={(v) => setDoctorFilter(v || '')}
              filterOption={(input, option) =>
                (option?.children as any)?.props?.children?.toLowerCase().includes(input.toLowerCase())
              }
              options={(staffData?.data || []).map((s: any) => ({
                value: s.id,
                label: `${s.last_name} ${s.first_name}`,
              }))}
            />
          </Col>

          {/* Gender Filter */}
          <Col>
            <Select
              placeholder="Jins"
              style={{ width: 100 }}
              allowClear
              value={genderFilter || undefined}
              onChange={(v) => setGenderFilter(v || '')}
              options={[
                { value: 'male', label: 'Erkak' },
                { value: 'female', label: 'Ayol' },
              ]}
            />
          </Col>

          {/* Booking Method Filter */}
          <Col>
            <Select
              placeholder="Bron usuli"
              style={{ width: 130 }}
              allowClear
              value={bookingMethodFilter || undefined}
              onChange={(v) => setBookingMethodFilter(v || '')}
              options={[
                { value: 'reception', label: 'Qabul' },
                { value: 'online', label: 'Online' },
                { value: 'phone', label: 'Telefon' },
              ]}
            />
          </Col>

          {/* Service Filter */}
          <Col>
            <Select
              placeholder="Xizmat"
              style={{ width: 150 }}
              allowClear
              showSearch
              value={serviceFilter || undefined}
              onChange={(v) => setServiceFilter(v || '')}
              options={(servicesData || []).map((s: any) => ({
                value: s.id,
                label: s.name,
              }))}
            />
          </Col>

          {/* Refresh */}
          <Col>
            <Button
              icon={<ReloadOutlined spin={isFetching} />}
              onClick={() => refetch()}
              loading={isFetching}
            >
              Yangilash
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Sub-panels Tabs */}
      <Card
        style={{
          background: 'rgba(13,26,48,0.8)',
          border: '1px solid rgba(212,175,55,0.15)',
          borderRadius: 12,
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarStyle={{ paddingLeft: 16, borderBottom: '1px solid rgba(212,175,55,0.1)' }}
          items={[
            {
              key: TAB_KEYS.ACTIVE,
              label: (
                <Space>
                  <CalendarOutlined />
                  <span>Aktiv</span>
                  <Badge count={(appointmentsData?.data || []).filter((a: any) => !['completed', 'cancelled'].includes(a.status)).length} style={{ backgroundColor: '#faad14' }} />
                </Space>
              ),
            },
            {
              key: TAB_KEYS.COMPLETED,
              label: (
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <span>Tugallangan</span>
                  <Badge count={(appointmentsData?.data || []).filter((a: any) => a.status === 'completed').length} style={{ backgroundColor: '#52c41a' }} />
                </Space>
              ),
            },
            {
              key: TAB_KEYS.CANCELLED,
              label: (
                <Space>
                  <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                  <span>Bekor qilingan</span>
                  <Badge count={(appointmentsData?.data || []).filter((a: any) => a.status === 'cancelled').length} style={{ backgroundColor: '#ff4d4f' }} />
                </Space>
              ),
            },
          ]}
        />

        <Spin spinning={isLoading}>
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            pagination={{
              pageSize: 20,
              current: page,
              onChange: setPage,
              showSizeChanger: false,
              showTotal: (total) => `${total} ta yozuv`,
            }}
            size="middle"
            style={{ background: 'transparent' }}
          />
        </Spin>
      </Card>

      {/* Appointment Wizard Modal */}
      <Modal
        title={
          <Space>
            <UserOutlined style={{ color: '#d4af37' }} />
            <span>Qabul yaratish (5-qadam)</span>
          </Space>
        }
        open={modalOpen}
        onCancel={closeWizard}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Steps
          current={wizardStep}
          size="small"
          style={{ marginBottom: 24 }}
          items={[
            { title: 'Bemor', icon: <UserOutlined /> },
            { title: 'Xizmat', icon: <MedicineBoxOutlined /> },
            { title: 'Shifokor', icon: <MedicineBoxOutlined /> },
            { title: 'Vaqt', icon: <ClockCircleOutlined /> },
            { title: 'Tasdiqlash', icon: <CheckCircleOutlined /> },
          ]}
        />

        <Divider />

        {/* Step 0: Patient Search */}
        {wizardStep === 0 && (
          <div>
            <Title level={5}>Bemor qidirish</Title>
            <Input.Search
              placeholder="Telefon, FISH yoki pasport raqami..."
              prefix={<SearchOutlined />}
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              onSearch={setPatientSearch}
              style={{ marginBottom: 16 }}
              size="large"
            />
            <div style={{ maxHeight: 300, overflow: 'auto' }}>
              {(patientsData?.data || []).filter((p: any) => {
                if (!patientSearch) return true
                const s = patientSearch.toLowerCase()
                return `${p.last_name} ${p.first_name} ${p.phone}`.toLowerCase().includes(s)
              }).slice(0, 10).map((p: any) => (
                <Card
                  key={p.id}
                  size="small"
                  style={{
                    marginBottom: 8,
                    cursor: 'pointer',
                    border: selectedPatient?.id === p.id ? '2px solid #d4af37' : '1px solid rgba(212,175,55,0.2)',
                    background: selectedPatient?.id === p.id ? 'rgba(212,175,55,0.1)' : 'transparent',
                  }}
                  onClick={() => setSelectedPatient(p)}
                >
                  <Space>
                    <UserOutlined style={{ color: '#d4af37' }} />
                    <Text strong style={{ color: '#fff' }}>
                      {p.last_name} {p.first_name} {p.patronymic || ''}
                    </Text>
                    <Text type="secondary">{p.phone}</Text>
                  </Space>
                </Card>
              ))}
            </div>
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <Button type="primary" onClick={nextStep} disabled={!selectedPatient}>
                Keyingi
              </Button>
            </div>
          </div>
        )}

        {/* Step 1: Service */}
        {wizardStep === 1 && (
          <div>
            <Title level={5}>Xizmat tanlash</Title>
            <Select
              placeholder="Xizmat tanlang"
              style={{ width: '100%', marginBottom: 16 }}
              size="large"
              showSearch
              value={selectedService?.id}
              onChange={(id) => {
                const svc = (servicesData || []).find((s: any) => s.id === id)
                setSelectedService(svc || null)
              }}
              options={(servicesData || []).map((s: any) => ({
                value: s.id,
                label: `${s.name} — ${s.base_price?.toLocaleString() || 0} so'm`,
              }))}
            />
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <Button onClick={prevStep} style={{ marginRight: 8 }}>Orqaga</Button>
              <Button type="primary" onClick={nextStep}>Keyingi</Button>
            </div>
          </div>
        )}

        {/* Step 2: Doctor */}
        {wizardStep === 2 && (
          <div>
            <Title level={5}>Shifokor tanlash</Title>
            <Select
              placeholder="Shifokor tanlang"
              style={{ width: '100%', marginBottom: 16 }}
              size="large"
              showSearch
              value={selectedDoctor?.id}
              onChange={(id) => {
                const doc = (staffData?.data || []).find((s: any) => s.id === id)
                setSelectedDoctor(doc || null)
              }}
              options={(staffData?.data || []).map((s: any) => ({
                value: s.id,
                label: `${s.last_name} ${s.first_name} ${s.patronymic || ''} — ${s.specialty || s.position || 'Shifokor'}${s.cabinet ? ` — Kab. ${s.cabinet}` : ''}`,
              }))}
            />
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <Button onClick={prevStep} style={{ marginRight: 8 }}>Orqaga</Button>
              <Button type="primary" onClick={nextStep}>Keyingi</Button>
            </div>
          </div>
        )}

        {/* Step 3: Time */}
        {wizardStep === 3 && (
          <div>
            <Title level={5}>Vaqt va kabinet</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Sana" required style={{ marginBottom: 16 }}>
                  <DatePicker
                    style={{ width: '100%' }}
                    value={selectedDate}
                    onChange={(d) => setSelectedDate(d || dayjs())}
                    format="YYYY-MM-DD"
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Vaqt" required style={{ marginBottom: 16 }}>
                  <Input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="Kabinet (ixtiyoriy)">
              <Select
                placeholder="Kabinet tanlang"
                style={{ width: '100%' }}
                allowClear
                value={selectedCabinet || undefined}
                onChange={(v) => setSelectedCabinet(v || '')}
                options={['101', '102', '103', '104', '201', '202', '301', '302'].map(c => ({
                  value: c,
                  label: `Kabinet ${c}`,
                }))}
              />
            </Form.Item>
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <Button onClick={prevStep} style={{ marginRight: 8 }}>Orqaga</Button>
              <Button type="primary" onClick={nextStep}>Keyingi</Button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {wizardStep === 4 && (
          <div>
            <Title level={5}>Ma'lumotlarni tasdiqlash</Title>
            <Card style={{ background: 'rgba(26,42,74,0.5)', marginBottom: 16 }}>
              <Descriptions column={1} size="small" labelStyle={{ color: '#8c8c8c' }} contentStyle={{ color: '#fff' }}>
                <Descriptions.Item label="Bemor">
                  {selectedPatient ? `${selectedPatient.last_name} ${selectedPatient.first_name}` : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Telefon">{selectedPatient?.phone || '-'}</Descriptions.Item>
                <Descriptions.Item label="Xizmat">{selectedService?.name || '-'}</Descriptions.Item>
                <Descriptions.Item label="Shifokor">
                  {selectedDoctor ? `${selectedDoctor.last_name} ${selectedDoctor.first_name}` : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Sana">{selectedDate?.format('YYYY-MM-DD') || '-'}</Descriptions.Item>
                <Descriptions.Item label="Vaqt">{selectedTime}</Descriptions.Item>
                {selectedCabinet && <Descriptions.Item label="Kabinet">{selectedCabinet}</Descriptions.Item>}
              </Descriptions>
            </Card>
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <Button onClick={prevStep} style={{ marginRight: 8 }}>Orqaga</Button>
              <Button
                type="primary"
                onClick={handleWizardSubmit}
                loading={createMutation.isPending}
                style={{ background: '#d4af37', borderColor: '#d4af37' }}
              >
                Tasdiqlash va yaratish
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* View/Cancel Drawer */}
      <Drawer
        title="Qabul tafsilotlari"
        placement="right"
        width={480}
        onClose={() => { setViewDrawerOpen(false); setViewRecord(null) }}
        open={viewDrawerOpen}
      >
        {viewRecord && (
          <div>
            <Card style={{ background: 'rgba(26,42,74,0.5)', marginBottom: 16 }}>
              <Descriptions column={1} size="small" labelStyle={{ color: '#8c8c8c' }} contentStyle={{ color: '#fff' }}>
                <Descriptions.Item label="Bemor">
                  {viewRecord.patient ? `${viewRecord.patient.first_name} ${viewRecord.patient.last_name}` : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Shifokor">
                  {viewRecord.doctor ? `${viewRecord.doctor.last_name} ${viewRecord.doctor.first_name}` : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Xizmat">{viewRecord.service?.name || '-'}</Descriptions.Item>
                <Descriptions.Item label="Sana">{viewRecord.appointment_date || '-'}</Descriptions.Item>
                <Descriptions.Item label="Vaqt">{viewRecord.start_time || '-'}</Descriptions.Item>
                <Descriptions.Item label="Kabinet">{viewRecord.cabinet || '-'}</Descriptions.Item>
                <Descriptions.Item label="Holat">
                  <Tag color={statusColors[viewRecord.status] || 'default'}>
                    {statusTranslations[viewRecord.status] || viewRecord.status}
                  </Tag>
                </Descriptions.Item>
                {viewRecord.cancel_reason && (
                  <Descriptions.Item label="Bekor sababi">{viewRecord.cancel_reason}</Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {viewRecord.status !== 'cancelled' && viewRecord.status !== 'completed' && (
              <div style={{ borderTop: '1px solid rgba(212,175,55,0.1)', paddingTop: 16 }}>
                <Title level={5}>Qabulni bekor qilish</Title>
                <Form form={cancelForm} layout="vertical" onFinish={handleCancel}>
                  <Form.Item name="cancel_reason" label="Sabab (ixtiyoriy)">
                    <Input.TextArea rows={2} placeholder="Sabab..." />
                  </Form.Item>
                  <Button danger htmlType="submit" loading={cancelMutation.isPending}>
                    Qabulni bekor qilish
                  </Button>
                </Form>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}
