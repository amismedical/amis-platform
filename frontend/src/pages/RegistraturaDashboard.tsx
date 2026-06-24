/**
 * AMIS - Registratura Dashboard (Premium)
 * Module 1: Real KPI cards, quick actions, recent appointments, queue preview
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Row, Col, Card, Statistic, Table, Tag, Button, Space,
  Spin, Typography, Divider, Alert, Badge, List, Avatar
} from 'antd'
import {
  UserAddOutlined, CalendarOutlined, DashboardOutlined,
  ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ExclamationCircleOutlined, MoneyCollectOutlined,
  TeamOutlined, HistoryOutlined, ArrowRightOutlined
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { appointmentService, queueService, cashierService } from '../services/api'
import { i18n, statusTranslations, formatFullDate } from '../i18n/uz'

const { Title, Text } = Typography
const today = dayjs().format('YYYY-MM-DD')

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
}

interface KPIStats {
  todayAppointments: number
  waitingPatients: number
  latePatients: number
  paymentWaiting: number
  cancelled: number
  completedToday: number
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
  })

  // Today's appointments (all statuses)
  const { data: todayAppts, isLoading: loadingAppts } = useQuery({
    queryKey: ['registratura-today-appts'],
    queryFn: () => appointmentService.list({
      date_from: today,
      date_to: today,
      limit: 1000,
    }),
  })

  // Queue waiting count
  const { data: queueData, isLoading: loadingQueue } = useQuery({
    queryKey: ['registratura-queue'],
    queryFn: () => queueService.list(),
  })

  // Open invoices (payment waiting)
  const { data: openInvoices, isLoading: loadingInvoices } = useQuery({
    queryKey: ['registratura-invoices'],
    queryFn: () => cashierService.invoices({ status: 'open', limit: 100 }),
  })

  // Compute stats from API data
  useEffect(() => {
    const appointments = todayAppts?.data || []
    const total = appointments.length
    const waiting = appointments.filter((a: any) => a.status === 'waiting' || a.status === 'scheduled').length
    const completed = appointments.filter((a: any) => a.status === 'completed').length
    const cancelled = appointments.filter((a: any) => a.status === 'cancelled').length

    // Late = scheduled/waiting appointments past current time
    const now = dayjs().format('HH:mm')
    const late = appointments.filter((a: any) => {
      if (a.status !== 'scheduled' && a.status !== 'waiting') return false
      if (!a.start_time) return false
      return a.start_time < now
    }).length

    setStats(prev => ({
      ...prev,
      todayAppointments: total,
      waitingPatients: waiting,
      completedToday: completed,
      cancelled,
      latePatients: late,
    }))
  }, [todayAppts])

  useEffect(() => {
    const queues: any[] = Array.isArray(queueData) ? queueData : (queueData as any)?.data || []
    let waitingCount = 0
    // Sum waiting entries across all queues
    const fetchQueueEntries = async () => {
      for (const queue of queues) {
        if (!queue.id) continue
        try {
          const entries: any = await queueService.get(queue.id)
          const waiting = (entries?.entries || []).filter((e: any) => e.status === 'waiting').length
          waitingCount += waiting
        } catch {
          // ignore individual queue errors
        }
      }
      setStats(prev => ({ ...prev, waitingPatients: waitingCount }))
    }
    if (queues.length > 0) {
      fetchQueueEntries()
    }
  }, [queueData])

  useEffect(() => {
    const invoices: any[] = openInvoices?.data || []
    setStats(prev => ({ ...prev, paymentWaiting: invoices.length }))
  }, [openInvoices])

  const isLoading = loadingAppts || loadingQueue || loadingInvoices
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
        return `${p.last_name || ''} ${p.first_name || ''}`.trim() || '-'
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
      title: 'Kabinet',
      dataIndex: 'cabinet',
      key: 'cabinet',
      width: 80,
      render: (c: string) => c || '-',
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

  const openInvoicesList = (openInvoices?.data || []).slice(0, 5)

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#8c8c8c' }}>Ma'lumotlar yuklanmoqda...</div>
      </div>
    )
  }

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

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={4}>
          <Card
            bordered={false}
            style={{
              background: 'linear-gradient(135deg, #1a2a4a 0%, #0d1a30 100%)',
              border: '1px solid rgba(212,175,55,0.2)',
              borderRadius: 12,
            }}
          >
            <Statistic
              title={<span style={{ color: '#8c8c8c', fontSize: 12 }}>Bugungi qabullar</span>}
              value={stats.todayAppointments}
              prefix={<CalendarOutlined style={{ color: '#d4af37' }} />}
              valueStyle={{ color: '#d4af37', fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card
            bordered={false}
            style={{
              background: 'linear-gradient(135deg, #1a2a4a 0%, #0d1a30 100%)',
              border: '1px solid rgba(212,175,55,0.2)',
              borderRadius: 12,
            }}
          >
            <Statistic
              title={<span style={{ color: '#8c8c8c', fontSize: 12 }}>Kutayotganlar</span>}
              value={stats.waitingPatients}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14', fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card
            bordered={false}
            style={{
              background: 'linear-gradient(135deg, #1a2a4a 0%, #0d1a30 100%)',
              border: '1px solid rgba(212,175,55,0.2)',
              borderRadius: 12,
            }}
          >
            <Statistic
              title={<span style={{ color: '#8c8c8c', fontSize: 12 }}>Kechikkanlar</span>}
              value={stats.latePatients}
              prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f', fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card
            bordered={false}
            style={{
              background: 'linear-gradient(135deg, #1a2a4a 0%, #0d1a30 100%)',
              border: '1px solid rgba(212,175,55,0.2)',
              borderRadius: 12,
            }}
          >
            <Statistic
              title={<span style={{ color: '#8c8c8c', fontSize: 12 }}>To'lov kutayotgan</span>}
              value={stats.paymentWaiting}
              prefix={<MoneyCollectOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card
            bordered={false}
            style={{
              background: 'linear-gradient(135deg, #1a2a4a 0%, #0d1a30 100%)',
              border: '1px solid rgba(212,175,55,0.2)',
              borderRadius: 12,
            }}
          >
            <Statistic
              title={<span style={{ color: '#8c8c8c', fontSize: 12 }}>Tugallangan</span>}
              value={stats.completedToday}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card
            bordered={false}
            style={{
              background: 'linear-gradient(135deg, #1a2a4a 0%, #0d1a30 100%)',
              border: '1px solid rgba(212,175,55,0.2)',
              borderRadius: 12,
            }}
          >
            <Statistic
              title={<span style={{ color: '#8c8c8c', fontSize: 12 }}>Bekor qilingan</span>}
              value={stats.cancelled}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f', fontSize: 28 }}
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
                  onClick: () => navigate('/appointments'),
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
            {openInvoicesList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#8c8c8c' }}>
                <MoneyCollectOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                <div>To'lov kutayotganlar yo'q</div>
              </div>
            ) : (
              <List
                size="small"
                dataSource={openInvoicesList}
                renderItem={(item: any) => (
                  <List.Item
                    style={{ padding: '10px 16px', cursor: 'pointer' }}
                    onClick={() => navigate('/cashier')}
                  >
                    <List.Item.Meta
                      title={
                        <Text style={{ color: '#fff', fontSize: 13 }}>
                          {item.patient?.last_name || ''} {item.patient?.first_name || ''}
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
