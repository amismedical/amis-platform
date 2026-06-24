/**
 * AMIS - Registratura Ish Stoli (Module 1 - Dashboard)
 * Redesigned: 6 module cards + workflow line + real KPI counters + quick actions
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Row, Col, Card, Statistic, Table, Tag, Button, Space,
  Spin, Typography, Divider, Alert, Badge, List,
  Steps, Tooltip, message
} from 'antd'
import {
  UserAddOutlined, CalendarOutlined, DashboardOutlined,
  ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ExclamationCircleOutlined, MoneyCollectOutlined,
  TeamOutlined, HistoryOutlined, ArrowRightOutlined,
  UserOutlined, MedicineBoxOutlined, DesktopOutlined,
  PrinterOutlined, SearchOutlined, FileTextOutlined,
  RightOutlined, LockOutlined
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { appointmentService, queueService, cashierService, patientService } from '../services/api'
import { i18n, statusTranslations, formatFullDate } from '../i18n/uz'

const { Title, Text } = Typography

// Status color map
const statusColors: Record<string, string> = {
  scheduled: 'blue',
  waiting: 'orange',
  in_progress: 'processing',
  completed: 'success',
  cancelled: 'error',
  called: 'processing',
  open: 'warning',
  partially_paid: 'processing',
  paid: 'success',
  confirmed: 'blue',
  checked_in: 'cyan',
}

// 6 Module definitions
const MODULES = [
  {
    key: 'patient-register',
    title: 'Bemor ro\'yxatga olish',
    subtitle: 'Yangi bemor qo\'shish',
    icon: <UserAddOutlined />,
    color: '#d4af37',
    bg: 'linear-gradient(135deg, #1a2a4a 0%, #0d1a30 100%)',
    border: 'rgba(212,175,55,0.3)',
    route: '/patients/new',
    badge: null,
  },
  {
    key: 'patient-360',
    title: 'Patient 360',
    subtitle: 'Bemor ma\'lumotlari',
    icon: <UserOutlined />,
    color: '#1890ff',
    bg: 'linear-gradient(135deg, #0d1a3a 0%, #1a2a5a 100%)',
    border: 'rgba(24,144,255,0.3)',
    route: '/patients',
    badge: null,
  },
  {
    key: 'appointments',
    title: 'Qabullar',
    subtitle: 'Qabul yaratish va boshqarish',
    icon: <CalendarOutlined />,
    color: '#722ed1',
    bg: 'linear-gradient(135deg, #1a1a4a 0%, #0d1a30 100%)',
    border: 'rgba(114,46,209,0.3)',
    route: '/appointments',
    badge: null,
  },
  {
    key: 'queue',
    title: 'Elektron navbat',
    subtitle: 'Navbatni boshqarish',
    icon: <TeamOutlined />,
    color: '#faad14',
    bg: 'linear-gradient(135deg, #2a1a0a 0%, #1a1000 100%)',
    border: 'rgba(250,173,20,0.3)',
    route: '/queue',
    badge: null,
  },
  {
    key: 'queue-display',
    title: 'Navbat displeyi',
    subtitle: 'TV ekranda ko\'rsatish',
    icon: <DesktopOutlined />,
    color: '#52c41a',
    bg: 'linear-gradient(135deg, #0a1a0a 0%, #0d2a0d 100%)',
    border: 'rgba(82,196,26,0.3)',
    route: '/queue-display',
    badge: null,
    external: true,
  },
  {
    key: 'history',
    title: 'Qabullar tarixi',
    subtitle: 'Ro\'yxatga olish tarixi',
    icon: <HistoryOutlined />,
    color: '#8c8c8c',
    bg: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)',
    border: 'rgba(140,140,140,0.2)',
    route: '/registration-history',
    badge: null,
  },
]

interface KPIStats {
  todayAppointments: number
  waitingPatients: number
  latePatients: number
  paymentWaiting: number
  cancelled: number
  completedToday: number
  registeredToday: number
}

export function RegistraturaDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<KPIStats>({
    todayAppointments: 0,
    waitingPatients: 0,
    latePatients: 0,
    paymentWaiting: 0,
    cancelled: 0,
    completedToday: 0,
    registeredToday: 0,
  })

  // Today's appointments
  const today = dayjs().format('YYYY-MM-DD')
  const { data: todayAppts } = useQuery({
    queryKey: ['registratura-today-appts'],
    queryFn: () => appointmentService.list({
      date_from: today,
      date_to: today,
      limit: 1000,
    }),
  })

  // Open invoices (payment waiting)
  const { data: openInvoices } = useQuery({
    queryKey: ['registratura-invoices'],
    queryFn: () => cashierService.invoices({ status: 'open', limit: 100 }),
  })

  // Today's new patients
  const { data: patientsData } = useQuery({
    queryKey: ['registratura-new-patients'],
    queryFn: () => patientService.list({ limit: 1 }),
  })

  // Compute stats from API data
  useEffect(() => {
    const appointments = todayAppts?.data || []
    const total = appointments.length
    const waiting = appointments.filter((a: any) =>
      a.status === 'scheduled' || a.status === 'confirmed' || a.status === 'checked_in'
    ).length
    const completed = appointments.filter((a: any) => a.status === 'completed').length
    const cancelled = appointments.filter((a: any) => a.status === 'cancelled').length

    const now = dayjs().format('HH:mm')
    const late = appointments.filter((a: any) => {
      if (a.status !== 'scheduled' && a.status !== 'confirmed' && a.status !== 'checked_in') return false
      if (!a.start_time) return false
      return a.start_time < now
    }).length

    const invoices: any[] = openInvoices?.data || []
    const newPatients = patientsData?.total || 0

    setStats(prev => ({
      ...prev,
      todayAppointments: total,
      waitingPatients: waiting,
      completedToday: completed,
      cancelled,
      latePatients: late,
      paymentWaiting: invoices.length,
      registeredToday: newPatients,
    }))
  }, [todayAppts, openInvoices, patientsData])

  // Queue waiting count — use listAllEntries
  const { data: allQueueEntries } = useQuery({
    queryKey: ['registratura-queue-entries'],
    queryFn: () => queueService.listAllEntries(),
  })

  useEffect(() => {
    const entries = allQueueEntries?.data || []
    const waitingCount = entries.filter((e: any) => e.status === 'waiting').length
    setStats(prev => ({ ...prev, waitingPatients: waitingCount }))
  }, [allQueueEntries])

  const appointments = todayAppts?.data || []
  const recentAppointments = appointments
    .sort((a: any, b: any) => (a.start_time || '').localeCompare(b.start_time || ''))
    .slice(0, 8)

  const appointmentsColumns = [
    {
      title: 'Vaqt',
      dataIndex: 'start_time',
      key: 'start_time',
      width: 70,
      render: (t: string) => t || '-',
    },
    {
      title: 'Bemor',
      key: 'patient',
      render: (_: any, r: any) => {
        const p = r.patient
        if (!p) return '-'
        const name = `${p.last_name || ''} ${p.first_name || ''}`.trim()
        return (
          <div>
            <Text style={{ color: '#fff', display: 'block' }}>{name || '-'}</Text>
            {p.med_id && <Text style={{ color: '#d4af37', fontSize: 11 }}>{p.med_id}</Text>}
          </div>
        )
      },
    },
    {
      title: 'Shifokor',
      key: 'doctor',
      render: (_: any, r: any) => {
        const d = r.doctor
        if (!d) return '-'
        return `${d.last_name || ''} ${d.first_name || ''}`.trim() || '-'
      },
    },
    {
      title: 'Xizmat',
      key: 'service',
      render: (_: any, r: any) => r.service?.name || '-',
    },
    {
      title: 'Holat',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s: string) => (
        <Tag color={statusColors[s] || 'default'}>
          {statusTranslations[s] || s}
        </Tag>
      ),
    },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <DashboardOutlined style={{ fontSize: 28, color: '#d4af37' }} />
              <div>
                <Title level={3} style={{ margin: 0, color: '#fff' }}>
                  Registratura ish stoli
                </Title>
                <Text style={{ color: '#8c8c8c', fontSize: 13 }}>
                  {formatFullDate(new Date())}
                </Text>
              </div>
            </div>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => navigate('/patients/new')}
                style={{ background: '#d4af37', borderColor: '#d4af37', color: '#000' }}
              >
                Yangi bemor
              </Button>
              <Button
                icon={<CalendarOutlined />}
                onClick={() => navigate('/appointments')}
                style={{ borderColor: '#d4af37', color: '#d4af37' }}
              >
                Qabul yaratish
              </Button>
              <Button
                icon={<TeamOutlined />}
                onClick={() => navigate('/queue')}
                style={{ borderColor: '#d4af37', color: '#d4af37' }}
              >
                Jonli navbat
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Module Cards Grid — 6 modules */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {MODULES.map(mod => (
          <Col xs={24} sm={12} lg={4} key={mod.key}>
            <Card
              bordered={false}
              hoverable
              onClick={() => {
                if (mod.external) {
                  window.open(mod.route, '_blank')
                } else {
                  navigate(mod.route)
                }
              }}
              style={{
                background: mod.bg,
                border: `1px solid ${mod.border}`,
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              bodyStyle={{ padding: '20px 16px', textAlign: 'center' }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: `${mod.color}20`,
                border: `1px solid ${mod.color}50`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                fontSize: 22,
                color: mod.color,
              }}>
                {mod.icon}
              </div>
              <Title level={5} style={{ color: '#fff', margin: '0 0 4px', fontSize: 14 }}>
                {mod.title}
              </Title>
              <Text style={{ color: '#8c8c8c', fontSize: 12 }}>
                {mod.subtitle}
              </Text>
              <div style={{ marginTop: 12 }}>
                <RightOutlined style={{ color: mod.color, fontSize: 12 }} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Workflow Line */}
      <Card
        bordered={false}
        style={{
          background: 'rgba(13,26,48,0.5)',
          border: '1px solid rgba(212,175,55,0.1)',
          borderRadius: 12,
          marginBottom: 24,
        }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <Row align="middle">
          <Col flex="none">
            <Text style={{ color: '#8c8c8c', fontSize: 13, marginRight: 16 }}>
              Ish jarayoni:
            </Text>
          </Col>
          <Col flex="auto">
            <Steps
              size="small"
              current={0}
              style={{ marginBottom: 0 }}
              items={[
                { title: 'Bemor ro\'yxatga olish', icon: <UserAddOutlined style={{ color: '#d4af37' }} /> },
                { title: 'Qabul yaratish', icon: <CalendarOutlined style={{ color: '#722ed1' }} /> },
                { title: 'Navbatga qo\'shish', icon: <TeamOutlined style={{ color: '#faad14' }} /> },
                { title: 'Qabul olish', icon: <MedicineBoxOutlined style={{ color: '#1890ff' }} /> },
                { title: 'To\'lov', icon: <MoneyCollectOutlined style={{ color: '#52c41a' }} /> },
              ]}
            />
          </Col>
        </Row>
      </Card>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={4}>
          <Card bordered={false} style={{
            background: 'linear-gradient(135deg, #1a2a4a 0%, #0d1a30 100%)',
            border: '1px solid rgba(212,175,55,0.2)',
            borderRadius: 12,
          }}>
            <Statistic
              title={<span style={{ color: '#8c8c8c', fontSize: 12 }}>Bugungi qabullar</span>}
              value={stats.todayAppointments}
              prefix={<CalendarOutlined style={{ color: '#d4af37' }} />}
              valueStyle={{ color: '#d4af37', fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card bordered={false} style={{
            background: 'linear-gradient(135deg, #1a2a4a 0%, #0d1a30 100%)',
            border: '1px solid rgba(212,175,55,0.2)',
            borderRadius: 12,
          }}>
            <Statistic
              title={<span style={{ color: '#8c8c8c', fontSize: 12 }}>Ro'yxatga olindi</span>}
              value={stats.registeredToday}
              prefix={<UserAddOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff', fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card bordered={false} style={{
            background: 'linear-gradient(135deg, #1a2a4a 0%, #0d1a30 100%)',
            border: '1px solid rgba(212,175,55,0.2)',
            borderRadius: 12,
          }}>
            <Statistic
              title={<span style={{ color: '#8c8c8c', fontSize: 12 }}>Navbatda kutmoqda</span>}
              value={stats.waitingPatients}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14', fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card bordered={false} style={{
            background: 'linear-gradient(135deg, #1a2a4a 0%, #0d1a30 100%)',
            border: '1px solid rgba(212,175,55,0.2)',
            borderRadius: 12,
          }}>
            <Statistic
              title={<span style={{ color: '#8c8c8c', fontSize: 12 }}>Kechikkanlar</span>}
              value={stats.latePatients}
              prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f', fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card bordered={false} style={{
            background: 'linear-gradient(135deg, #1a2a4a 0%, #0d1a30 100%)',
            border: '1px solid rgba(212,175,55,0.2)',
            borderRadius: 12,
          }}>
            <Statistic
              title={<span style={{ color: '#8c8c8c', fontSize: 12 }}>To'lov kutayotgan</span>}
              value={stats.paymentWaiting}
              prefix={<MoneyCollectOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card bordered={false} style={{
            background: 'linear-gradient(135deg, #1a2a4a 0%, #0d1a30 100%)',
            border: '1px solid rgba(212,175,55,0.2)',
            borderRadius: 12,
          }}>
            <Statistic
              title={<span style={{ color: '#8c8c8c', fontSize: 12 }}>Tugallangan</span>}
              value={stats.completedToday}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontSize: 28 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={[16, 16]}>
        {/* Recent Appointments Table */}
        <Col xs={24} xl={16}>
          <Card
            title={
              <Space>
                <HistoryOutlined style={{ color: '#d4af37' }} />
                <span>Bugungi qabullar ro'yxati</span>
                <Badge count={stats.todayAppointments} style={{ backgroundColor: '#d4af37' }} />
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate('/appointments')} style={{ color: '#d4af37' }}>
                Barchasini ko'rish <ArrowRightOutlined />
              </Button>
            }
            bordered={false}
            style={{
              background: 'rgba(13,26,48,0.8)',
              border: '1px solid rgba(212,175,55,0.15)',
              borderRadius: 12,
            }}
            headStyle={{ borderBottom: '1px solid rgba(212,175,55,0.1)', color: '#fff' }}
            bodyStyle={{ padding: 0 }}
          >
            {recentAppointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#8c8c8c' }}>
                <CalendarOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <div>Bugungi qabullar yo'q</div>
              </div>
            ) : (
              <Table
                columns={appointmentsColumns}
                dataSource={recentAppointments}
                rowKey="id"
                size="small"
                pagination={false}
                style={{ background: 'transparent' }}
                onRow={(record) => ({
                  style: { cursor: 'pointer' },
                  onClick: () => navigate(`/patients/${record.patient_id}`),
                })}
              />
            )}
          </Card>
        </Col>

        {/* Right sidebar */}
        <Col xs={24} xl={8}>
          {/* Payment Waiting */}
          <Card
            title={
              <Space>
                <MoneyCollectOutlined style={{ color: '#52c41a' }} />
                <span>To'lov kutayotganlar</span>
                <Badge count={stats.paymentWaiting} style={{ backgroundColor: '#52c41a' }} />
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate('/cashier')} style={{ color: '#52c41a', fontSize: 12 }}>
                Kassa <ArrowRightOutlined />
              </Button>
            }
            bordered={false}
            style={{
              background: 'rgba(13,26,48,0.8)',
              border: '1px solid rgba(212,175,55,0.15)',
              borderRadius: 12,
              marginBottom: 16,
            }}
            headStyle={{ borderBottom: '1px solid rgba(212,175,55,0.1)', color: '#fff' }}
            bodyStyle={{ padding: 0 }}
          >
            {(openInvoices?.data || []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#8c8c8c' }}>
                <MoneyCollectOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                <div>To'lov kutayotganlar yo'q</div>
              </div>
            ) : (
              <List
                size="small"
                dataSource={(openInvoices?.data || []).slice(0, 5)}
                renderItem={(item: any) => (
                  <List.Item
                    style={{ padding: '10px 16px', cursor: 'pointer' }}
                    onClick={() => navigate('/cashier')}
                  >
                    <List.Item.Meta
                      title={
                        <Text style={{ color: '#fff', fontSize: 13 }}>
                          {item.patient?.last_name || ''} {item.patient?.first_name || ''}
                          {item.patient?.med_id && (
                            <Text style={{ color: '#d4af37', fontSize: 11, marginLeft: 8 }}>
                              {item.patient.med_id}
                            </Text>
                          )}
                        </Text>
                      }
                      description={
                        <Space>
                          <Text style={{ color: '#8c8c8c', fontSize: 12 }}>
                            {item.total_amount?.toLocaleString()} so'm
                          </Text>
                          <Tag color="warning" style={{ fontSize: 11 }}>open</Tag>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>

          {/* Queue Preview */}
          <Card
            title={
              <Space>
                <TeamOutlined style={{ color: '#1890ff' }} />
                <span>Jonli navbat</span>
                <Badge count={stats.waitingPatients} style={{ backgroundColor: '#1890ff' }} />
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate('/queue')} style={{ color: '#1890ff', fontSize: 12 }}>
                Boshqarish <ArrowRightOutlined />
              </Button>
            }
            bordered={false}
            style={{
              background: 'rgba(13,26,48,0.8)',
              border: '1px solid rgba(212,175,55,0.15)',
              borderRadius: 12,
            }}
            headStyle={{ borderBottom: '1px solid rgba(212,175,55,0.1)', color: '#fff' }}
            bodyStyle={{ padding: 0 }}
          >
            {stats.waitingPatients === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#8c8c8c' }}>
                <TeamOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                <div>Navbatda bemorlar yo'q</div>
              </div>
            ) : (
              <div style={{ padding: 16 }}>
                <Alert
                  message={`${stats.waitingPatients} ta bemor kutmoqda`}
                  type="info"
                  showIcon
                  icon={<ClockCircleOutlined />}
                  style={{ marginBottom: 12, background: 'rgba(24,144,255,0.1)', border: '1px solid rgba(24,144,255,0.3)' }}
                />
                <Button
                  type="primary"
                  block
                  icon={<TeamOutlined />}
                  onClick={() => navigate('/queue')}
                  style={{ background: '#1890ff', borderColor: '#1890ff' }}
                >
                  Navbatni boshqarish
                </Button>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
