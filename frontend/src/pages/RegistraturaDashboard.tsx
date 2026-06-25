/**
 * AMIS - Registratura Ish Stoli (Module 1 - Dashboard)
 * Clean premium redesign: no video, sharp contrast, bee premium
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table, Tag, Button, Space,
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

// Bee premium color tokens
const C = {
  bg: '#0b1628',
  bgCard: 'rgba(13,28,48,0.95)',
  bgCardHover: 'rgba(20,40,70,0.97)',
  border: 'rgba(212,175,55,0.28)',
  borderHover: 'rgba(212,175,55,0.55)',
  gold: '#d4af37',
  goldDim: 'rgba(212,175,55,0.18)',
  goldMid: 'rgba(212,175,55,0.45)',
  green: '#1a9a69',
  greenDim: 'rgba(26,154,105,0.18)',
  textPrimary: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  searchBg: '#f8fafc',
  searchText: '#111827',
  searchPlaceholder: '#64748b',
  searchBorder: '#d4af37',
  moduleBg: 'rgba(13,28,48,0.88)',
  tableHead: 'rgba(212,175,55,0.12)',
  tableRow: 'rgba(212,175,55,0.04)',
  tableRowHover: 'rgba(212,175,55,0.09)',
  kpiBg: 'rgba(13,28,48,0.85)',
}

// Status color map
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

// 6 Module definitions — compact right panel
const MODULES = [
  { key: 'patient-register', title: 'Bemor ro\'yxatga olish', icon: <UserAddOutlined />, color: '#d4af37', route: '/patients/new', external: false },
  { key: 'patient-360', title: 'Patient 360', icon: <UserOutlined />, color: '#1890ff', route: '/patients', external: false },
  { key: 'appointments', title: 'Qabullar', icon: <CalendarOutlined />, color: '#a78bfa', route: '/appointments', external: false },
  { key: 'queue', title: 'Elektron navbat', icon: <TeamOutlined />, color: '#f59e0b', route: '/queue', external: false },
  { key: 'queue-display', title: 'Navbat displeyi', icon: <DesktopOutlined />, color: '#34d399', route: '/queue-display', external: true },
  { key: 'history', title: 'Qabullar tarixi', icon: <HistoryOutlined />, color: '#94a3b8', route: '/registration-history', external: false },
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

  const today = dayjs().format('YYYY-MM-DD')
  const { data: todayAppts } = useQuery({
    queryKey: ['registratura-today-appts'],
    queryFn: () => appointmentService.list({ date_from: today, date_to: today, limit: 1000 }),
  })
  const { data: openInvoices } = useQuery({
    queryKey: ['registratura-invoices'],
    queryFn: () => cashierService.invoices({ status: 'open', limit: 100 }),
  })
  const { data: patientsData } = useQuery({
    queryKey: ['registratura-new-patients'],
    queryFn: () => patientService.list({ limit: 1 }),
  })
  const { data: allQueueEntries } = useQuery({
    queryKey: ['registratura-queue-entries'],
    queryFn: () => queueService.listAllEntries(),
  })

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
    const entries = allQueueEntries?.data || []
    const queueWaiting = entries.filter((e: any) => e.status === 'waiting').length
    setStats({
      todayAppointments: total,
      waitingPatients: queueWaiting || waiting,
      latePatients: late,
      completedToday: completed,
      paymentWaiting: (openInvoices?.data || []).length,
      registeredToday: patientsData?.total || 0,
    })
  }, [todayAppts, openInvoices, patientsData, allQueueEntries])

  const appointments = todayAppts?.data || []
  const displayAppts = [...appointments]
    .sort((a: any, b: any) => (a.start_time || '').localeCompare(b.start_time || ''))
    .slice(0, 4)

  const queueEntries = (allQueueEntries?.data || [])
    .filter((e: any) => e.status === 'waiting')
    .slice(0, 4)

  // Appointments table columns
  const apptColumns = [
    {
      title: 'Vaqt',
      dataIndex: 'start_time',
      key: 'start_time',
      width: 65,
      render: (t: string) => (
        <Text style={{ color: C.gold, fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
          {t || '-'}
        </Text>
      ),
    },
    {
      title: 'Bemor',
      key: 'patient',
      render: (_: any, r: any) => {
        const p = r.patient
        const name = p ? `${p.last_name || ''} ${p.first_name || ''}`.trim() : '-'
        return (
          <div>
            <Text style={{ color: C.textPrimary, fontSize: 13, fontWeight: 600, display: 'block', lineHeight: 1.3 }}>
              {name || '-'}
            </Text>
            {p?.med_id && (
              <Text style={{ color: C.gold, fontSize: 10, fontFamily: 'monospace', opacity: 0.85 }}>
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
        if (!d) return <Text style={{ color: C.textMuted, fontSize: 12 }}>-</Text>
        return (
          <Text style={{ color: C.textSecondary, fontSize: 12 }}>
            {`${d.last_name || ''} ${d.first_name || ''}`.trim() || '-'}
          </Text>
        )
      },
    },
    {
      title: 'Xizmat',
      key: 'service',
      render: (_: any, r: any) => (
        <Text style={{ color: C.textSecondary, fontSize: 12 }}>{r.service?.name || '-'}</Text>
      ),
    },
    {
      title: 'Holat',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s: string) => (
        <Tag color={statusColors[s] || 'default'} style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
          {statusTranslations[s] || s}
        </Tag>
      ),
    },
  ]

  // Queue table columns
  const queueColumns = [
    {
      title: '#',
      dataIndex: 'queue_number',
      key: 'queue_number',
      width: 40,
      render: (n: number | string) => (
        <Text style={{ color: C.gold, fontWeight: 800, fontSize: 15, fontFamily: 'monospace' }}>
          {n || '-'}
        </Text>
      ),
    },
    {
      title: 'Bemor',
      key: 'patient',
      render: (_: any, r: any) => {
        // Try nested Patient first, then flat fields
        const p = r.Patient || r.patient
        const flatName = r.patient_name || r.patient_first_name
          ? `${r.patient_last_name || ''} ${r.patient_first_name || ''}`.trim()
          : null
        const name = p
          ? `${p.last_name || ''} ${p.first_name || ''}`.trim()
          : (flatName || '-')
        return (
          <div>
            <Text style={{ color: C.textPrimary, fontSize: 12, fontWeight: 600, display: 'block', lineHeight: 1.3 }}>
              {name || '-'}
            </Text>
            {p?.med_id && (
              <Text style={{ color: C.gold, fontSize: 9, fontFamily: 'monospace', opacity: 0.85 }}>
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
        <Text style={{ color: C.textSecondary, fontSize: 12 }}>{r || '-'}</Text>
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
          <Tag color={map[s] || 'default'} style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
            {statusTranslations[s] || s}
          </Tag>
        )
      },
    },
  ]

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .dash-root {
          min-height: 100vh;
          background-color: ${C.bg};
          background-image:
            radial-gradient(ellipse at 15% 85%, rgba(212,175,55,0.04) 0%, transparent 50%),
            radial-gradient(ellipse at 85% 15%, rgba(26,154,105,0.04) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(212,175,55,0.02) 0%, transparent 70%);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .glass-card {
          background: ${C.bgCard} !important;
          border: 1px solid ${C.border} !important;
          border-radius: 10px !important;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .glass-card:hover {
          border-color: ${C.borderHover} !important;
          box-shadow: 0 0 20px rgba(212,175,55,0.07);
        }
        .kpi-card {
          background: ${C.kpiBg} !important;
          border: 1px solid ${C.border} !important;
          border-radius: 8px !important;
          transition: border-color 0.2s ease;
          cursor: default;
        }
        .kpi-card:hover {
          border-color: ${C.borderHover} !important;
        }
        .module-item {
          background: ${C.moduleBg} !important;
          border: 1px solid ${C.border} !important;
          border-radius: 8px !important;
          padding: 9px 10px !important;
          cursor: pointer;
          transition: all 0.15s ease;
          animation: slideIn 0.4s ease both;
        }
        .module-item:hover {
          background: ${C.bgCardHover} !important;
          border-color: ${C.borderHover} !important;
          box-shadow: 0 0 16px rgba(212,175,55,0.1);
        }
        .module-item:hover .module-icon {
          transform: scale(1.08);
        }
        .module-icon {
          transition: transform 0.15s ease;
        }
        .search-input {
          background: ${C.searchBg} !important;
          color: ${C.searchText} !important;
          border: 1.5px solid #e2e8f0 !important;
          border-radius: 8px !important;
          font-size: 13px !important;
          height: 36px !important;
        }
        .search-input::placeholder {
          color: ${C.searchPlaceholder} !important;
        }
        .search-input:focus {
          border-color: ${C.gold} !important;
          box-shadow: 0 0 0 3px rgba(212,175,55,0.15) !important;
          outline: none !important;
        }
        .search-prefix {
          color: ${C.goldDim} !important;
        }
        .quick-btn {
          background: ${C.bgCard} !important;
          border: 1px solid ${C.border} !important;
          color: ${C.textPrimary} !important;
          border-radius: 8px !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          height: 36px !important;
          padding: 0 14px !important;
          transition: all 0.15s ease !important;
          white-space: nowrap !important;
        }
        .quick-btn:hover {
          background: ${C.goldDim} !important;
          border-color: ${C.borderHover} !important;
          color: ${C.gold} !important;
        }
        .quick-btn-primary {
          background: ${C.goldDim} !important;
          border: 1px solid ${C.goldMid} !important;
          color: ${C.gold} !important;
          font-weight: 700 !important;
        }
        .quick-btn-primary:hover {
          background: rgba(212,175,55,0.28) !important;
          border-color: ${C.gold} !important;
          box-shadow: 0 0 12px rgba(212,175,55,0.15);
        }
        .section-title {
          color: ${C.gold} !important;
          font-size: 10px !important;
          font-weight: 800 !important;
          letter-spacing: 1.5px !important;
          text-transform: uppercase !important;
        }
        .view-link {
          color: ${C.gold} !important;
          font-size: 11px !important;
          opacity: 0.8;
          cursor: pointer;
          text-decoration: none;
          transition: opacity 0.15s;
        }
        .view-link:hover {
          opacity: 1;
          text-decoration: underline;
        }
        .wf-dot {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          flex-shrink: 0;
        }
        .wf-line {
          height: 2px;
          flex: 1;
          background: linear-gradient(90deg, ${C.goldMid} 0%, rgba(212,175,55,0.12) 100%);
          margin: 0 3px;
          margin-top: -6px;
        }
        /* Table styles */
        .dash-table .ant-table {
          background: transparent !important;
          font-size: 12px;
        }
        .dash-table .ant-table-thead > tr > th {
          background: ${C.tableHead} !important;
          color: ${C.gold} !important;
          border-bottom: 1px solid ${C.border} !important;
          font-size: 10px !important;
          font-weight: 700 !important;
          letter-spacing: 0.8px !important;
          padding: 5px 8px !important;
          text-transform: uppercase;
        }
        .dash-table .ant-table-tbody > tr > td {
          background: ${C.tableRow} !important;
          border-bottom: 1px solid rgba(212,175,55,0.06) !important;
          padding: 5px 8px !important;
        }
        .dash-table .ant-table-tbody > tr:hover > td {
          background: ${C.tableRowHover} !important;
        }
        .dash-table .ant-table-wrapper .ant-table {
          border-radius: 0 !important;
        }
        .dash-table .ant-empty-description {
          color: ${C.textMuted} !important;
        }
        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
      `}</style>

      <div className="dash-root" style={{ padding: '0 10px 8px' }}>

        {/* ===== HEADER ===== */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 0 7px',
          borderBottom: `1px solid ${C.border}`,
          marginBottom: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <DashboardOutlined style={{ fontSize: 20, color: C.gold }} />
            <div>
              <div style={{ color: C.textPrimary, fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>
                Registratura
              </div>
              <div style={{ color: C.textMuted, fontSize: 11 }}>
                {dayjs().format('dddd, D-MMMM, YYYY')}
              </div>
            </div>
          </div>
          {/* Navbat badge in header */}
          <Badge
            count={stats.waitingPatients}
            style={{ backgroundColor: '#f59e0b', fontSize: 10 }}
            showZero
          >
            <div style={{
              background: C.moduleBg,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <TeamOutlined style={{ color: '#f59e0b', fontSize: 12 }} />
              <span style={{ color: C.textPrimary, fontSize: 12, fontWeight: 600 }}>Navbat</span>
            </div>
          </Badge>
        </div>

        {/* ===== MAIN: LEFT + RIGHT ===== */}
        <div style={{ display: 'flex', gap: 8, flex: 1, minHeight: 0, overflow: 'hidden' }}>

          {/* ====== LEFT PANEL ====== */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0, overflow: 'hidden' }}>

            {/* KPI Row — 5 cards */}
            <div style={{ display: 'flex', gap: 6 }}>
              <div className="kpi-card" style={{ flex: 1, padding: '7px 9px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: C.gold, lineHeight: 1, fontFamily: 'monospace' }}>
                      {stats.todayAppointments}
                    </div>
                    <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 3 }}>
                      Qabullar
                    </div>
                  </div>
                  <CalendarOutlined style={{ color: C.goldMid, fontSize: 16, opacity: 0.8 }} />
                </div>
              </div>
              <div className="kpi-card" style={{ flex: 1, padding: '7px 9px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b', lineHeight: 1, fontFamily: 'monospace' }}>
                      {stats.waitingPatients}
                    </div>
                    <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 3 }}>
                      Kutmoqda
                    </div>
                  </div>
                  <ClockCircleOutlined style={{ color: 'rgba(245,158,11,0.4)', fontSize: 16 }} />
                </div>
              </div>
              <div className="kpi-card" style={{ flex: 1, padding: '7px 9px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#f87171', lineHeight: 1, fontFamily: 'monospace' }}>
                      {stats.latePatients}
                    </div>
                    <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 3 }}>
                      Kechikgan
                    </div>
                  </div>
                  <ExclamationCircleOutlined style={{ color: 'rgba(248,113,113,0.4)', fontSize: 16 }} />
                </div>
              </div>
              <div className="kpi-card" style={{ flex: 1, padding: '7px 9px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#34d399', lineHeight: 1, fontFamily: 'monospace' }}>
                      {stats.completedToday}
                    </div>
                    <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 3 }}>
                      Tugallandi
                    </div>
                  </div>
                  <CheckCircleOutlined style={{ color: 'rgba(52,211,153,0.4)', fontSize: 16 }} />
                </div>
              </div>
              <div className="kpi-card" style={{ flex: 1, padding: '7px 9px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: C.green, lineHeight: 1, fontFamily: 'monospace' }}>
                      {stats.paymentWaiting}
                    </div>
                    <div style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 3 }}>
                      To'lov
                    </div>
                  </div>
                  <MoneyCollectOutlined style={{ color: C.greenDim, fontSize: 16 }} />
                </div>
              </div>
            </div>

            {/* Search + Quick Actions */}
            <div className="glass-card" style={{ padding: '7px 10px' }}>
              <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                <Input
                  className="search-input"
                  placeholder="Bemor qidirish — MED-ID, telefon, FIO..."
                  prefix={<SearchOutlined className="search-prefix" />}
                  size="small"
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && searchVal.trim()) {
                      navigate(`/patients?search=${encodeURIComponent(searchVal.trim())}`)
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <Tooltip title="Yangi bemor">
                  <Button
                    className="quick-btn quick-btn-primary"
                    icon={<UserAddOutlined />}
                    onClick={() => navigate('/patients/new')}
                  >
                    Yangi bemor
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

            {/* Workflow Line — compact */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 2px' }}>
              {[
                { icon: <UserAddOutlined />, label: 'Bemor', color: C.gold, bg: C.goldDim },
                { icon: <CalendarOutlined />, label: 'Qabul', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
                { icon: <TeamOutlined />, label: 'Navbat', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
                { icon: <MedicineBoxOutlined />, label: 'Qabul', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
                { icon: <MoneyCollectOutlined />, label: "To'lov", color: C.green, bg: C.greenDim },
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 4 ? 1 : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div className="wf-dot" style={{ background: step.bg, color: step.color, border: `1px solid ${step.color}50` }}>
                      {step.icon}
                    </div>
                    <span style={{ fontSize: 9, color: step.color, opacity: 0.8, whiteSpace: 'nowrap' }}>
                      {step.label}
                    </span>
                  </div>
                  {i < 4 && <div className="wf-line" />}
                </div>
              ))}
            </div>

            {/* ===== PREVIEW BLOCKS ===== */}
            <div style={{ display: 'flex', gap: 7, flex: 1, minHeight: 0, overflow: 'hidden' }}>

              {/* LEFT: Bugungi Qabullar */}
              <div className="glass-card" style={{ flex: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderBottom: `1px solid ${C.border}`,
                  flexShrink: 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CalendarOutlined style={{ color: C.gold, fontSize: 12 }} />
                    <span className="section-title">Bugungi qabullar</span>
                    <Badge count={stats.todayAppointments} style={{ backgroundColor: C.gold, fontSize: 9 }} />
                  </div>
                  <a className="view-link" onClick={() => navigate('/appointments')}>
                    Barchasi <ArrowRightOutlined style={{ fontSize: 9 }} />
                  </a>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }} className="dash-table">
                  {displayAppts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 18, color: C.textMuted }}>
                      <CalendarOutlined style={{ fontSize: 22, marginBottom: 5 }} />
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
                      scroll={{ y: 150 }}
                      onRow={(record) => ({
                        style: { cursor: record.patient_id ? 'pointer' : 'default' },
                        onClick: () => record.patient_id && navigate(`/patients/${record.patient_id}`),
                      })}
                    />
                  )}
                </div>
              </div>

              {/* RIGHT: Queue + Payment */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>

                {/* Jonli Navbat */}
                <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 10px',
                    borderBottom: `1px solid ${C.border}`,
                    flexShrink: 0,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <TeamOutlined style={{ color: '#f59e0b', fontSize: 12 }} />
                      <span className="section-title">Jonli navbat</span>
                      <Badge count={stats.waitingPatients} style={{ backgroundColor: '#f59e0b', fontSize: 9 }} />
                    </div>
                    <a className="view-link" onClick={() => navigate('/queue')}>
                      Boshqar <ArrowRightOutlined style={{ fontSize: 9 }} />
                    </a>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto' }} className="dash-table">
                    {queueEntries.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 14, color: C.textMuted }}>
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
                        onRow={() => ({
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
                    borderBottom: `1px solid ${C.border}`,
                    flexShrink: 0,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MoneyCollectOutlined style={{ color: C.green, fontSize: 12 }} />
                      <span className="section-title">To'lov</span>
                      <Badge count={stats.paymentWaiting} style={{ backgroundColor: C.green, fontSize: 9 }} />
                    </div>
                    <a className="view-link" onClick={() => navigate('/cashier')}>
                      Kassa <ArrowRightOutlined style={{ fontSize: 9 }} />
                    </a>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '3px 0' }}>
                    {(openInvoices?.data || []).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 14, color: C.textMuted }}>
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
                            borderBottom: '1px solid rgba(212,175,55,0.06)',
                            cursor: 'pointer',
                          }}
                          onClick={() => navigate('/cashier')}
                        >
                          <div>
                            <Text style={{ color: C.textPrimary, fontSize: 12, fontWeight: 600, display: 'block', lineHeight: 1.3 }}>
                              {item.patient?.last_name || ''} {item.patient?.first_name || ''}
                            </Text>
                            {item.patient?.med_id && (
                              <Text style={{ color: C.gold, fontSize: 9, fontFamily: 'monospace', opacity: 0.85 }}>
                                {item.patient.med_id}
                              </Text>
                            )}
                          </div>
                          <Text style={{ color: C.green, fontSize: 11, fontWeight: 700 }}>
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

          {/* ====== RIGHT PANEL: 6 Compact Modules ====== */}
          <div style={{ width: 158, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{
              color: C.gold,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              padding: '0 2px 3px',
            }}>
              Modullar
            </div>
            {MODULES.map((mod, i) => (
              <div
                key={mod.key}
                className="module-item"
                style={{ animationDelay: `${i * 55}ms` }}
                onClick={() => {
                  if (mod.external) {
                    window.open(mod.route, '_blank')
                  } else {
                    navigate(mod.route)
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    className="module-icon"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: `${mod.color}18`,
                      border: `1px solid ${mod.color}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: mod.color,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    {mod.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: C.textPrimary, fontSize: 11, fontWeight: 600, lineHeight: 1.3 }}>
                      {mod.title}
                    </div>
                  </div>
                  <RightOutlined style={{ color: C.goldMid, fontSize: 10, flexShrink: 0 }} />
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          padding: '4px 0 0',
          color: C.textMuted,
          fontSize: 10,
          borderTop: `1px solid ${C.border}`,
          opacity: 0.6,
          marginTop: 6,
        }}>
          AMIS — Asalari Tibbiy Axborot Tizimi
        </div>

      </div>
    </>
  )
}
