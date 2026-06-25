/**
 * AMIS - Registratura Ish Stoli (Module 1 - Dashboard)
 * Redesigned: Single-screen, video bg, bee premium, left content + right modules
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Row, Col, Card, Statistic, Table, Tag, Button, Space,
  Typography, Input, Badge, Tooltip
} from 'antd'
import {
  UserAddOutlined, CalendarOutlined, DashboardOutlined,
  ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  MoneyCollectOutlined, TeamOutlined, HistoryOutlined,
  ArrowRightOutlined, UserOutlined, MedicineBoxOutlined,
  DesktopOutlined, SearchOutlined, RightOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import {
  appointmentService, queueService, cashierService, patientService
} from '../services/api'
import { statusTranslations } from '../i18n/uz'

const { Text } = Typography

// Status color map — bee premium
const statusColors: Record<string, string> = {
  scheduled: 'blue',
  waiting: 'orange',
  in_progress: 'gold',
  completed: 'green',
  cancelled: 'red',
  called: 'gold',
  open: 'orange',
  partially_paid: 'gold',
  paid: 'green',
  confirmed: 'blue',
  checked_in: 'cyan',
}

// 6 Module definitions — compact for right panel
const MODULES = [
  {
    key: 'patient-register',
    title: 'Bemor ro\'yxatga olish',
    icon: <UserAddOutlined />,
    color: '#d4af37',
    route: '/patients/new',
    external: false,
  },
  {
    key: 'patient-360',
    title: 'Patient 360',
    icon: <UserOutlined />,
    color: '#1890ff',
    route: '/patients',
    external: false,
  },
  {
    key: 'appointments',
    title: 'Qabullar',
    icon: <CalendarOutlined />,
    color: '#722ed1',
    route: '/appointments',
    external: false,
  },
  {
    key: 'queue',
    title: 'Elektron navbat',
    icon: <TeamOutlined />,
    color: '#faad14',
    route: '/queue',
    external: false,
  },
  {
    key: 'queue-display',
    title: 'Navbat displeyi',
    icon: <DesktopOutlined />,
    color: '#52c41a',
    route: '/queue-display',
    external: true,
  },
  {
    key: 'history',
    title: 'Qabullar tarixi',
    icon: <HistoryOutlined />,
    color: '#8c8c8c',
    route: '/registration-history',
    external: false,
  },
]

interface KPIStats {
  todayAppointments: number
  waitingPatients: number
  latePatients: number
  paymentWaiting: number
  completedToday: number
  registeredToday: number
}

export function RegistraturaDashboard() {
  const navigate = useNavigate()
  const [searchVal, setSearchVal] = useState('')
  const [stats, setStats] = useState<KPIStats>({
    todayAppointments: 0,
    waitingPatients: 0,
    latePatients: 0,
    paymentWaiting: 0,
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

  // Open invoices
  const { data: openInvoices } = useQuery({
    queryKey: ['registratura-invoices'],
    queryFn: () => cashierService.invoices({ status: 'open', limit: 100 }),
  })

  // Today's new patients
  const { data: patientsData } = useQuery({
    queryKey: ['registratura-new-patients'],
    queryFn: () => patientService.list({ limit: 1 }),
  })

  // Queue entries
  const { data: allQueueEntries } = useQuery({
    queryKey: ['registratura-queue-entries'],
    queryFn: () => queueService.listAllEntries(),
  })

  // Compute stats
  useEffect(() => {
    const appointments = todayAppts?.data || []
    const total = appointments.length
    const waiting = appointments.filter((a: any) =>
      a.status === 'scheduled' || a.status === 'confirmed' || a.status === 'checked_in'
    ).length
    const completed = appointments.filter((a: any) => a.status === 'completed').length
    const now = dayjs().format('HH:mm')
    const late = appointments.filter((a: any) => {
      if (a.status !== 'scheduled' && a.status !== 'confirmed' && a.status !== 'checked_in') return false
      if (!a.start_time) return false
      return a.start_time < now
    }).length
    const invoices: any[] = openInvoices?.data || []
    const entries = allQueueEntries?.data || []
    const queueWaiting = entries.filter((e: any) => e.status === 'waiting').length

    setStats({
      todayAppointments: total,
      waitingPatients: queueWaiting || waiting,
      latePatients: late,
      completedToday: completed,
      paymentWaiting: invoices.length,
      registeredToday: patientsData?.total || 0,
    })
  }, [todayAppts, openInvoices, patientsData, allQueueEntries])

  const appointments = todayAppts?.data || []
  const displayAppts = [...appointments]
    .sort((a: any, b: any) => (a.start_time || '').localeCompare(b.start_time || ''))
    .slice(0, 5)

  const queueEntries = (allQueueEntries?.data || [])
    .filter((e: any) => e.status === 'waiting')
    .slice(0, 5)

  // Table columns
  const apptColumns = [
    {
      title: 'Vaqt',
      dataIndex: 'start_time',
      key: 'start_time',
      width: 60,
      render: (t: string) => <Text style={{ color: '#e8d5a3', fontSize: 12 }}>{t || '-'}</Text>,
    },
    {
      title: 'Bemor',
      key: 'patient',
      render: (_: any, r: any) => {
        const p = r.patient
        const name = p ? `${p.last_name || ''} ${p.first_name || ''}`.trim() : '-'
        return (
          <div>
            <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: 500, display: 'block' }}>
              {name || '-'}
            </Text>
            {p?.med_id && (
              <Text style={{ color: '#d4af37', fontSize: 10, fontFamily: 'monospace' }}>
                {p.med_id}
              </Text>
            )}
          </div>
        )
      },
    },
    {
      title: 'Shifokor',
      key: 'doctor',
      render: (_: any, r: any) => {
        const d = r.doctor
        if (!d) return <Text style={{ color: '#6b6b6b', fontSize: 12 }}>-</Text>
        const name = `${d.last_name || ''} ${d.first_name || ''}`.trim()
        return <Text style={{ color: '#e8d5a3', fontSize: 12 }}>{name || '-'}</Text>
      },
    },
    {
      title: 'Holat',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s: string) => (
        <Tag
          color={statusColors[s] || 'default'}
          style={{ fontSize: 10, padding: '0 4px', margin: 0 }}
        >
          {statusTranslations[s] || s}
        </Tag>
      ),
    },
  ]

  const queueColumns = [
    {
      title: '#',
      key: 'queue_number',
      width: 40,
      render: (_: any, r: any) => (
        <Text style={{ color: '#d4af37', fontWeight: 700, fontSize: 14 }}>
          {r.queue_number || '-'}
        </Text>
      ),
    },
    {
      title: 'Bemor',
      key: 'patient',
      render: (_: any, r: any) => {
        const p = r.Patient
        const name = p ? `${p.last_name || ''} ${p.first_name || ''}`.trim() : '-'
        return (
          <div>
            <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: 500, display: 'block' }}>
              {name || r.patient_name || '-'}
            </Text>
            {p?.med_id && (
              <Text style={{ color: '#d4af37', fontSize: 9, fontFamily: 'monospace' }}>
                {p.med_id}
              </Text>
            )}
          </div>
        )
      },
    },
    {
      title: 'Kabinet',
      dataIndex: 'room',
      key: 'room',
      width: 60,
      render: (r: string) => (
        <Text style={{ color: '#e8d5a3', fontSize: 12 }}>{r || '-'}</Text>
      ),
    },
    {
      title: 'Holat',
      dataIndex: 'status',
      key: 'status',
      width: 70,
      render: (s: string) => {
        const map: Record<string, string> = {
          waiting: 'orange', called: 'gold', in_progress: 'gold',
          completed: 'green', cancelled: 'red',
        }
        return (
          <Tag
            color={map[s] || 'default'}
            style={{ fontSize: 10, padding: '0 4px', margin: 0 }}
          >
            {statusTranslations[s] || s}
          </Tag>
        )
      },
    },
  ]

  return (
    <>
      {/* Honeycomb CSS pattern — injected once */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .honey-bg {
          background-image:
            radial-gradient(circle at 20% 80%, rgba(212,175,55,0.04) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(26,154,105,0.04) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(13,26,48,0.97) 0%, rgba(5,10,18,0.99) 100%);
        }
        .glass-card {
          background: rgba(13, 26, 48, 0.72) !important;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(212,175,55,0.18) !important;
          border-radius: 10px !important;
        }
        .glass-card:hover {
          border-color: rgba(212,175,55,0.35) !important;
          box-shadow: 0 0 20px rgba(212,175,55,0.08);
        }
        .glass-module {
          background: rgba(13, 26, 48, 0.6) !important;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(212,175,55,0.12) !important;
          border-radius: 8px !important;
          transition: all 0.2s ease;
        }
        .glass-module:hover {
          background: rgba(26, 48, 80, 0.7) !important;
          border-color: rgba(212,175,55,0.3) !important;
          box-shadow: 0 0 16px rgba(212,175,55,0.1);
        }
        .kpi-card {
          background: rgba(13, 26, 48, 0.6) !important;
          border: 1px solid rgba(212,175,55,0.15) !important;
          border-radius: 8px !important;
          transition: all 0.2s ease;
        }
        .kpi-card:hover {
          border-color: rgba(212,175,55,0.3) !important;
        }
        .module-list-item {
          border-radius: 8px;
          padding: 8px 10px;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.15s ease;
          animation: slideIn 0.4s ease both;
        }
        .module-list-item:hover {
          background: rgba(212,175,55,0.08) !important;
          border-color: rgba(212,175,55,0.25) !important;
        }
        .video-overlay {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }
        .video-overlay video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .video-overlay .overlay {
          position: absolute;
          inset: 0;
          background: rgba(5, 10, 18, 0.78);
        }
        .video-overlay .gradient {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 20% 50%, rgba(5,10,18,0.3) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(212,175,55,0.05) 0%, transparent 50%);
        }
        .dashboard-root {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
        }
        .dashboard-content {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .search-glass input {
          background: rgba(13,26,48,0.6) !important;
          border: 1px solid rgba(212,175,55,0.2) !important;
          color: #fff !important;
          border-radius: 8px !important;
        }
        .search-glass input::placeholder {
          color: #6b6b6b !important;
        }
        .search-glass .ant-input-prefix {
          color: rgba(212,175,55,0.6) !important;
        }
        .search-glass input:focus {
          border-color: rgba(212,175,55,0.5) !important;
          box-shadow: 0 0 12px rgba(212,175,55,0.15) !important;
        }
        .quick-btn {
          background: rgba(13,26,48,0.5) !important;
          border: 1px solid rgba(212,175,55,0.2) !important;
          color: #e8d5a3 !important;
          border-radius: 8px !important;
          font-size: 12px !important;
          padding: 4px 10px !important;
          height: 32px !important;
          transition: all 0.2s ease !important;
        }
        .quick-btn:hover {
          background: rgba(212,175,55,0.15) !important;
          border-color: rgba(212,175,55,0.4) !important;
          color: #d4af37 !important;
          box-shadow: 0 0 12px rgba(212,175,55,0.1);
        }
        .quick-btn-primary {
          background: rgba(212,175,55,0.2) !important;
          border: 1px solid rgba(212,175,55,0.4) !important;
          color: #d4af37 !important;
          font-weight: 600 !important;
        }
        .quick-btn-primary:hover {
          background: rgba(212,175,55,0.3) !important;
          border-color: #d4af37 !important;
          box-shadow: 0 0 16px rgba(212,175,55,0.2);
        }
        .section-title {
          color: #d4af37 !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          letter-spacing: 1.5px !important;
          text-transform: uppercase !important;
        }
        .workflow-dot {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          flex-shrink: 0;
        }
        .workflow-line {
          height: 2px;
          flex: 1;
          background: linear-gradient(90deg, rgba(212,175,55,0.4) 0%, rgba(212,175,55,0.15) 100%);
          margin: 0 4px;
          margin-top: -8px;
        }
        .ant-table {
          background: transparent !important;
          font-size: 12px;
        }
        .ant-table-thead > tr > th {
          background: rgba(212,175,55,0.08) !important;
          color: #d4af37 !important;
          border-bottom: 1px solid rgba(212,175,55,0.15) !important;
          font-size: 10px !important;
          font-weight: 700 !important;
          letter-spacing: 0.5px !important;
          padding: 6px 8px !important;
        }
        .ant-table-tbody > tr > td {
          background: transparent !important;
          border-bottom: 1px solid rgba(212,175,55,0.07) !important;
          padding: 6px 8px !important;
        }
        .ant-table-tbody > tr:hover > td {
          background: rgba(212,175,55,0.05) !important;
        }
        .ant-table-wrapper .ant-table {
          border-radius: 0 !important;
        }
        .view-all-link {
          color: #d4af37 !important;
          font-size: 11px !important;
          opacity: 0.8;
          transition: opacity 0.2s;
        }
        .view-all-link:hover {
          opacity: 1;
          text-decoration: underline;
        }
        .right-panel {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
      `}</style>

      {/* Video Background */}
      <div className="video-overlay">
        <video
          autoPlay
          loop
          muted
          playsInline
          onError={(e) => {
            const parent = (e.target as HTMLVideoElement).parentElement
            if (parent) parent.style.display = 'none'
          }}
        >
          <source src="/dashboard-bg.mp4" type="video/mp4" />
        </video>
        <div className="overlay" />
        <div className="gradient" />
      </div>

      <div className="dashboard-root">
        <div className="dashboard-content honey-bg" style={{ padding: '0 12px 12px' }}>

          {/* ===== HEADER ===== */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 0 8px',
            borderBottom: '1px solid rgba(212,175,55,0.1)',
            marginBottom: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <DashboardOutlined style={{ fontSize: 22, color: '#d4af37' }} />
              <div>
                <div style={{ color: '#ffffff', fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>
                  Registratura
                </div>
                <div style={{ color: '#6b6b6b', fontSize: 11 }}>
                  {dayjs().format('dddd, D-MMMM, YYYY')}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Badge
                count={stats.waitingPatients}
                style={{ backgroundColor: '#faad14', fontSize: 10 }}
                showZero
              >
                <div style={{
                  background: 'rgba(13,26,48,0.6)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  borderRadius: 8,
                  padding: '4px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <TeamOutlined style={{ color: '#faad14', fontSize: 13 }} />
                  <span style={{ color: '#faad14', fontSize: 12, fontWeight: 600 }}>Navbat</span>
                </div>
              </Badge>
            </div>
          </div>

          {/* ===== MAIN LAYOUT: LEFT (content) + RIGHT (modules) ===== */}
          <div style={{ display: 'flex', gap: 10, flex: 1, minHeight: 0 }}>

            {/* ====== LEFT PANEL ====== */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>

              {/* KPI Cards Row */}
              <div style={{ display: 'flex', gap: 6 }}>
                {/* 1 — Qabullar */}
                <div className="kpi-card" style={{ flex: 1, padding: '8px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#d4af37', lineHeight: 1, fontFamily: 'monospace' }}>
                        {stats.todayAppointments}
                      </div>
                      <div style={{ fontSize: 9, color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 2 }}>
                        Qabullar
                      </div>
                    </div>
                    <CalendarOutlined style={{ color: 'rgba(212,175,55,0.4)', fontSize: 18 }} />
                  </div>
                </div>
                {/* 2 — Kutmoqda */}
                <div className="kpi-card" style={{ flex: 1, padding: '8px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#faad14', lineHeight: 1, fontFamily: 'monospace' }}>
                        {stats.waitingPatients}
                      </div>
                      <div style={{ fontSize: 9, color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 2 }}>
                        Kutmoqda
                      </div>
                    </div>
                    <ClockCircleOutlined style={{ color: 'rgba(250,173,20,0.4)', fontSize: 18 }} />
                  </div>
                </div>
                {/* 3 — Kechikgan */}
                <div className="kpi-card" style={{ flex: 1, padding: '8px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#ff4d4f', lineHeight: 1, fontFamily: 'monospace' }}>
                        {stats.latePatients}
                      </div>
                      <div style={{ fontSize: 9, color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 2 }}>
                        Kechikgan
                      </div>
                    </div>
                    <ExclamationCircleOutlined style={{ color: 'rgba(255,77,79,0.4)', fontSize: 18 }} />
                  </div>
                </div>
                {/* 4 — Tugallangan */}
                <div className="kpi-card" style={{ flex: 1, padding: '8px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#52c41a', lineHeight: 1, fontFamily: 'monospace' }}>
                        {stats.completedToday}
                      </div>
                      <div style={{ fontSize: 9, color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 2 }}>
                        Tugallandi
                      </div>
                    </div>
                    <CheckCircleOutlined style={{ color: 'rgba(82,196,26,0.4)', fontSize: 18 }} />
                  </div>
                </div>
                {/* 5 — To'lov */}
                <div className="kpi-card" style={{ flex: 1, padding: '8px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#1a9a69', lineHeight: 1, fontFamily: 'monospace' }}>
                        {stats.paymentWaiting}
                      </div>
                      <div style={{ fontSize: 9, color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 2 }}>
                        To'lov
                      </div>
                    </div>
                    <MoneyCollectOutlined style={{ color: 'rgba(26,154,105,0.4)', fontSize: 18 }} />
                  </div>
                </div>
              </div>

              {/* Quick Search + Actions */}
              <div className="glass-card" style={{ padding: '8px 12px' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <Input
                      className="search-glass"
                      placeholder="Bemor qidirish — MED-ID, telefon, FIO..."
                      prefix={<SearchOutlined />}
                      size="small"
                      value={searchVal}
                      onChange={e => setSearchVal(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && searchVal.trim()) {
                          navigate(`/patients?search=${encodeURIComponent(searchVal.trim())}`)
                        }
                      }}
                      style={{ height: 32 }}
                    />
                  </div>
                  <Tooltip title="Yangi bemor">
                    <Button
                      className="quick-btn quick-btn-primary"
                      icon={<UserAddOutlined />}
                      onClick={() => navigate('/patients/new')}
                    >
                      Yangi
                    </Button>
                  </Tooltip>
                  <Tooltip title="Qabul yaratish">
                    <Button
                      className="quick-btn"
                      icon={<CalendarOutlined />}
                      onClick={() => navigate('/appointments')}
                    >
                      Qabul
                    </Button>
                  </Tooltip>
                  <Tooltip title="Jonli navbat">
                    <Button
                      className="quick-btn"
                      icon={<TeamOutlined />}
                      onClick={() => navigate('/queue')}
                    >
                      Navbat
                    </Button>
                  </Tooltip>
                </div>
              </div>

              {/* Compact Workflow Line */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                {[
                  { icon: <UserAddOutlined />, label: 'Bemor', color: '#d4af37', bg: 'rgba(212,175,55,0.12)' },
                  { icon: <CalendarOutlined />, label: 'Qabul', color: '#722ed1', bg: 'rgba(114,46,209,0.12)' },
                  { icon: <TeamOutlined />, label: 'Navbat', color: '#faad14', bg: 'rgba(250,173,20,0.12)' },
                  { icon: <MedicineBoxOutlined />, label: 'Qabul', color: '#1890ff', bg: 'rgba(24,144,255,0.12)' },
                  { icon: <MoneyCollectOutlined />, label: "To'lov", color: '#1a9a69', bg: 'rgba(26,154,105,0.12)' },
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 4 ? 1 : 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <div className="workflow-dot" style={{ background: step.bg, color: step.color, border: `1px solid ${step.color}40` }}>
                        {step.icon}
                      </div>
                      <span style={{ fontSize: 9, color: step.color, opacity: 0.7, whiteSpace: 'nowrap' }}>{step.label}</span>
                    </div>
                    {i < 4 && <div className="workflow-line" />}
                  </div>
                ))}
              </div>

              {/* ===== MAIN PREVIEW BLOCKS ===== */}
              <div style={{ display: 'flex', gap: 8, flex: 1, minHeight: 0 }}>

                {/* LEFT: Bugungi Qabullar Table */}
                <div className="glass-card" style={{ flex: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 10px',
                    borderBottom: '1px solid rgba(212,175,55,0.1)',
                    flexShrink: 0,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CalendarOutlined style={{ color: '#d4af37', fontSize: 12 }} />
                      <span className="section-title">Bugungi qabullar</span>
                      <Badge count={stats.todayAppointments} style={{ backgroundColor: '#d4af37', fontSize: 9 }} />
                    </div>
                    <a className="view-all-link" onClick={() => navigate('/appointments')}>
                      Barchasi <ArrowRightOutlined style={{ fontSize: 10 }} />
                    </a>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {displayAppts.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 20, color: '#6b6b6b' }}>
                        <CalendarOutlined style={{ fontSize: 24, marginBottom: 6 }} />
                        <div style={{ fontSize: 12 }}>Bugungi qabullar yo'q</div>
                      </div>
                    ) : (
                      <Table
                        columns={apptColumns}
                        dataSource={displayAppts}
                        rowKey="id"
                        size="small"
                        pagination={false}
                        style={{ background: 'transparent' }}
                        scroll={{ y: 160 }}
                        onRow={(record) => ({
                          style: { cursor: 'pointer' },
                          onClick: () => record.patient_id && navigate(`/patients/${record.patient_id}`),
                        })}
                      />
                    )}
                  </div>
                </div>

                {/* RIGHT: Queue + Payment Previews */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>

                  {/* Jonli Navbat */}
                  <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderBottom: '1px solid rgba(212,175,55,0.1)',
                      flexShrink: 0,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <TeamOutlined style={{ color: '#faad14', fontSize: 12 }} />
                        <span className="section-title">Jonli navbat</span>
                        <Badge count={stats.waitingPatients} style={{ backgroundColor: '#faad14', fontSize: 9 }} />
                      </div>
                      <a className="view-all-link" onClick={() => navigate('/queue')}>
                        Boshqar <ArrowRightOutlined style={{ fontSize: 10 }} />
                      </a>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                      {queueEntries.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 14, color: '#6b6b6b' }}>
                          <TeamOutlined style={{ fontSize: 20, marginBottom: 4 }} />
                          <div style={{ fontSize: 11 }}>Navbatda yo'q</div>
                        </div>
                      ) : (
                        <Table
                          columns={queueColumns}
                          dataSource={queueEntries}
                          rowKey="id"
                          size="small"
                          pagination={false}
                          style={{ background: 'transparent' }}
                          scroll={{ y: 120 }}
                          onRow={(record) => ({
                            style: { cursor: 'pointer' },
                            onClick: () => navigate('/queue'),
                          })}
                        />
                      )}
                    </div>
                  </div>

                  {/* To'lov kutayotganlar */}
                  <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderBottom: '1px solid rgba(212,175,55,0.1)',
                      flexShrink: 0,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MoneyCollectOutlined style={{ color: '#1a9a69', fontSize: 12 }} />
                        <span className="section-title">To'lov</span>
                        <Badge count={stats.paymentWaiting} style={{ backgroundColor: '#1a9a69', fontSize: 9 }} />
                      </div>
                      <a className="view-all-link" onClick={() => navigate('/cashier')}>
                        Kassa <ArrowRightOutlined style={{ fontSize: 10 }} />
                      </a>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
                      {(openInvoices?.data || []).length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 14, color: '#6b6b6b' }}>
                          <MoneyCollectOutlined style={{ fontSize: 20, marginBottom: 4 }} />
                          <div style={{ fontSize: 11 }}>To'lov kutayotganlar yo'q</div>
                        </div>
                      ) : (
                        (openInvoices?.data || []).slice(0, 4).map((item: any, idx: number) => (
                          <div
                            key={item.id || idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '5px 10px',
                              borderBottom: '1px solid rgba(212,175,55,0.05)',
                              cursor: 'pointer',
                            }}
                            onClick={() => navigate('/cashier')}
                          >
                            <div>
                              <Text style={{ color: '#fff', fontSize: 12, display: 'block' }}>
                                {item.patient?.last_name || ''} {item.patient?.first_name || ''}
                              </Text>
                              {item.patient?.med_id && (
                                <Text style={{ color: '#d4af37', fontSize: 9, fontFamily: 'monospace' }}>
                                  {item.patient.med_id}
                                </Text>
                              )}
                            </div>
                            <Text style={{ color: '#1a9a69', fontSize: 11, fontWeight: 600 }}>
                              {item.total_amount?.toLocaleString()} so'm
                            </Text>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* ====== RIGHT PANEL: 6 Compact Module Buttons ====== */}
            <div className="right-panel" style={{ width: 160, flexShrink: 0 }}>
              <div style={{
                color: '#d4af37',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                padding: '0 4px 4px',
              }}>
                Modullar
              </div>
              {MODULES.map((mod, i) => (
                <div
                  key={mod.key}
                  className="module-list-item"
                  style={{
                    animationDelay: `${i * 60}ms`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                  }}
                  onClick={() => {
                    if (mod.external) {
                      window.open(mod.route, '_blank')
                    } else {
                      navigate(mod.route)
                    }
                  }}
                >
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: `${mod.color}18`,
                    border: `1px solid ${mod.color}35`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: mod.color,
                    fontSize: 13,
                    flexShrink: 0,
                  }}>
                    {mod.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#e8d5a3', fontSize: 12, fontWeight: 600, lineHeight: 1.2 }}>
                      {mod.title}
                    </div>
                  </div>
                  <RightOutlined style={{ color: 'rgba(212,175,55,0.4)', fontSize: 10, flexShrink: 0 }} />
                </div>
              ))}
            </div>

          </div>

          {/* Bottom: compact workflow label */}
          <div style={{
            textAlign: 'center',
            padding: '4px 0 0',
            color: '#4a4a4a',
            fontSize: 10,
            borderTop: '1px solid rgba(212,175,55,0.06)',
          }}>
            AMIS — Asalari Tibbiy axborot tizimi
          </div>

        </div>
      </div>
    </>
  )
}
