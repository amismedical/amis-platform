/**
 * AMIS - Registratura Ish Stoli
 * Sky-blue Celestial Future Medical Command Monitor
 * Full-screen dashboard, no sidebar, hexagon module panel
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Tag, Button, Badge, Tooltip, Avatar } from 'antd'
import {
  UserAddOutlined, CalendarOutlined, TeamOutlined,
  ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  MoneyCollectOutlined, HistoryOutlined, ArrowRightOutlined,
  UserOutlined, MedicineBoxOutlined, DesktopOutlined,
  SearchOutlined, RightOutlined, VideoCameraOutlined,
  HeartOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { appointmentService, queueService, cashierService, patientService } from '../services/api'
import { statusTranslations } from '../i18n/uz'

// ===== SKY-BLUE CELESTIAL COLOR PALETTE =====
const C = {
  // Backgrounds
  bg: '#04091a',
  bgDeep: '#020810',
  bgPanel: 'rgba(8, 18, 42, 0.94)',
  bgPanelHover: 'rgba(12, 28, 58, 0.96)',
  bgCard: 'rgba(10, 24, 52, 0.92)',
  bgCardHover: 'rgba(16, 35, 70, 0.96)',
  // Borders
  border: 'rgba(0, 212, 255, 0.18)',
  borderHover: 'rgba(0, 212, 255, 0.42)',
  borderGold: 'rgba(212, 160, 48, 0.35)',
  borderGoldHover: 'rgba(212, 160, 48, 0.6)',
  // Accents
  gold: '#d4a030',
  goldBright: '#f0c040',
  goldDim: 'rgba(212, 160, 48, 0.14)',
  goldMid: 'rgba(212, 160, 48, 0.38)',
  cyan: '#00d4ff',
  cyanDim: 'rgba(0, 212, 255, 0.12)',
  cyanMid: 'rgba(0, 212, 255, 0.28)',
  // Status
  green: '#00c853',
  greenDim: 'rgba(0, 200, 83, 0.14)',
  orange: '#ff8f00',
  orangeDim: 'rgba(255, 143, 0, 0.14)',
  red: '#ff5252',
  redDim: 'rgba(255, 82, 82, 0.14)',
  blue: '#448aff',
  blueDim: 'rgba(68, 138, 255, 0.14)',
  // Text
  textPrimary: '#f0f4ff',
  textSecondary: '#c8d4e8',
  textMuted: '#7a8ba8',
  textGold: '#d4a030',
  // Search
  searchBg: '#e8f0fe',
  searchText: '#0a1628',
  searchPlaceholder: '#4a6080',
  searchBorder: '#90b8e8',
  // Table
  tableHead: 'rgba(0, 212, 255, 0.1)',
  tableRow: 'rgba(0, 212, 255, 0.03)',
  tableRowHover: 'rgba(0, 212, 255, 0.08)',
  // Glow
  glowCyan: '0 0 16px rgba(0, 212, 255, 0.2)',
  glowGold: '0 0 12px rgba(212, 160, 48, 0.2)',
  glowGreen: '0 0 12px rgba(0, 200, 83, 0.2)',
}

// ===== HONEYCOMB SVG PATTERN =====
const HONEYCOMB_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34L28 66zm0-48L6.5 30.3 6.5 69.7 28 84l21.5-14.3V30.3L28 18z' fill='rgba(0,212,255,0.025)' fill-rule='evenodd'/%3E%3C/svg%3E")`

// ===== MODULES =====
const MODULES = [
  { key: 'patient-register', title: 'Bemor ro\'yxatga olish', icon: <UserAddOutlined />, color: C.gold, bg: C.goldDim, route: '/patients/new', num: '01' },
  { key: 'patient-360', title: 'Patient 360', icon: <UserOutlined />, color: C.cyan, bg: C.cyanDim, route: '/patients', num: '02' },
  { key: 'appointments', title: 'Qabullar', icon: <CalendarOutlined />, color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', route: '/appointments', num: '03' },
  { key: 'queue', title: 'Elektron navbat', icon: <TeamOutlined />, color: C.orange, bg: C.orangeDim, route: '/queue', num: '04' },
  { key: 'queue-display', title: 'Navbat displeyi', icon: <DesktopOutlined />, color: C.green, bg: C.greenDim, route: '/queue-display', num: '05' },
  { key: 'history', title: 'Qabullar tarixi', icon: <HistoryOutlined />, color: C.blue, bg: C.blueDim, route: '/registration-history', num: '06' },
]

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#448aff', confirmed: '#40c4ff', checked_in: '#00bcd4',
  waiting: '#ff8f00', called: '#ffa726', in_progress: '#f0c040',
  completed: '#00c853', cancelled: '#ff5252',
  open: '#ff8f00', partially_paid: '#f0c040', paid: '#00c853',
}

// ===== INTERFACE =====
interface KPIStats {
  todayAppointments: number
  waitingPatients: number
  latePatients: number
  completedToday: number
  paymentWaiting: number
  registeredToday: number
}

// ===== COMPONENT =====
export function RegistraturaDashboard() {
  const navigate = useNavigate()
  const [searchVal, setSearchVal] = useState('')
  const [stats, setStats] = useState<KPIStats>({
    todayAppointments: 0, waitingPatients: 0, latePatients: 0,
    completedToday: 0, paymentWaiting: 0, registeredToday: 0,
  })
  const now = dayjs()

  // ===== DATA QUERIES =====
  const { data: todayAppts } = useQuery({
    queryKey: ['dash-today-appts'],
    queryFn: () => appointmentService.list({
      date_from: now.format('YYYY-MM-DD'),
      date_to: now.format('YYYY-MM-DD'),
      limit: 1000,
    }),
  })
  const { data: openInvoices } = useQuery({
    queryKey: ['dash-invoices'],
    queryFn: () => cashierService.invoices({ status: 'open', limit: 100 }),
  })
  const { data: patientsData } = useQuery({
    queryKey: ['dash-new-patients'],
    queryFn: () => patientService.list({ limit: 1 }),
  })
  const { data: allQueueEntries } = useQuery({
    queryKey: ['dash-queue-entries'],
    queryFn: () => queueService.listAllEntries(),
  })

  // ===== COMPUTE STATS =====
  useEffect(() => {
    const appts = todayAppts?.data || []
    const total = appts.length
    const waiting = appts.filter((a: any) =>
      ['scheduled', 'confirmed', 'checked_in'].includes(a.status)
    ).length
    const completed = appts.filter((a: any) => a.status === 'completed').length
    const currentTime = now.format('HH:mm')
    const late = appts.filter((a: any) => {
      if (!['scheduled', 'confirmed', 'checked_in'].includes(a.status)) return false
      if (!a.start_time) return false
      return a.start_time < currentTime
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
  }, [todayAppts, openInvoices, patientsData, allQueueEntries, now])

  const appointments = todayAppts?.data || []
  const displayAppts = [...appointments]
    .sort((a: any, b: any) => (a.start_time || '').localeCompare(b.start_time || ''))
    .slice(0, 5)

  const queueEntries = (allQueueEntries?.data || [])
    .filter((e: any) => e.status === 'waiting')
    .slice(0, 5)

  // ===== TABLE COLUMNS =====
  const apptColumns = [
    {
      title: 'VAQT',
      dataIndex: 'start_time',
      key: 'start_time',
      width: 60,
      render: (t: string) => (
        <span style={{ color: C.cyan, fontWeight: 800, fontFamily: 'monospace', fontSize: 13 }}>
          {t || '-'}
        </span>
      ),
    },
    {
      title: 'BEMOR',
      key: 'patient',
      render: (_: any, r: any) => {
        const p = r.patient
        const name = p ? `${p.last_name || ''} ${p.first_name || ''}`.trim() : '-'
        return (
          <div>
            <div style={{ color: C.textPrimary, fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>
              {name || '-'}
            </div>
            {p?.med_id && (
              <div style={{ color: C.gold, fontSize: 9, fontFamily: 'monospace', opacity: 0.85 }}>
                {p.med_id}
              </div>
            )}
          </div>
        )
      },
    },
    {
      title: 'SHIFOKOR',
      key: 'doctor',
      width: 110,
      render: (_: any, r: any) => {
        const d = r.doctor
        if (!d) return <span style={{ color: C.textMuted }}>-</span>
        return (
          <span style={{ color: C.textSecondary, fontSize: 12 }}>
            {`${d.last_name || ''} ${d.first_name || ''}`.trim() || '-'}
          </span>
        )
      },
    },
    {
      title: 'XIZMAT',
      key: 'service',
      width: 120,
      render: (_: any, r: any) => (
        <span style={{ color: C.textMuted, fontSize: 12 }}>
          {r.service?.name || '-'}
        </span>
      ),
    },
    {
      title: 'HOLAT',
      dataIndex: 'status',
      key: 'status',
      width: 95,
      render: (s: string) => (
        <Tag
          color={STATUS_COLORS[s] || 'default'}
          style={{ fontSize: 10, padding: '0 5px', margin: 0, fontWeight: 600 }}
        >
          {statusTranslations[s] || s}
        </Tag>
      ),
    },
  ]

  const queueColumns = [
    {
      title: '#',
      dataIndex: 'queue_number',
      key: 'queue_number',
      width: 38,
      render: (n: number | string) => (
        <span style={{ color: C.gold, fontWeight: 900, fontSize: 16, fontFamily: 'monospace' }}>
          {n || '-'}
        </span>
      ),
    },
    {
      title: 'BEMOR',
      key: 'patient',
      render: (_: any, r: any) => {
        const p = r.Patient || r.patient
        const flatName = r.patient_name || (r.patient_last_name || r.patient_first_name
          ? `${r.patient_last_name || ''} ${r.patient_first_name || ''}`.trim()
          : null)
        const name = p
          ? `${p.last_name || ''} ${p.first_name || ''}`.trim()
          : (flatName || '-')
        return (
          <div>
            <div style={{ color: C.textPrimary, fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>
              {name || '-'}
            </div>
            {p?.med_id && (
              <div style={{ color: C.gold, fontSize: 9, fontFamily: 'monospace', opacity: 0.85 }}>
                {p.med_id}
              </div>
            )}
          </div>
        )
      },
    },
    {
      title: 'KAB',
      dataIndex: 'room',
      key: 'room',
      width: 44,
      render: (r: string) => (
        <span style={{ color: C.cyan, fontSize: 12, fontWeight: 700 }}>{r || '-'}</span>
      ),
    },
    {
      title: 'HOLAT',
      dataIndex: 'status',
      key: 'status',
      width: 72,
      render: (s: string) => (
        <Tag
          color={STATUS_COLORS[s] || 'default'}
          style={{ fontSize: 10, padding: '0 5px', margin: 0 }}
        >
          {statusTranslations[s] || s}
        </Tag>
      ),
    },
  ]

  const nowStr = now.format('HH:mm')
  const dateStr = now.format('dddd, D-MMMM, YYYY')

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(14px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulseCyan {
          0%, 100% { box-shadow: 0 0 8px rgba(0,212,255,0.25); }
          50% { box-shadow: 0 0 18px rgba(0,212,255,0.5); }
        }
        @keyframes pulseGold {
          0%, 100% { box-shadow: 0 0 6px rgba(212,160,48,0.2); }
          50% { box-shadow: 0 0 14px rgba(212,160,48,0.45); }
        }
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }

        .celestial-root {
          min-height: 100vh;
          height: 100vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          background-color: ${C.bg};
          background-image:
            radial-gradient(ellipse at 20% 0%, rgba(0, 150, 255, 0.06) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 100%, rgba(0, 212, 255, 0.05) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(0, 80, 180, 0.04) 0%, transparent 70%),
            ${HONEYCOMB_BG};
        }
        .celestial-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background: linear-gradient(180deg,
            rgba(0, 100, 220, 0.04) 0%,
            transparent 30%,
            transparent 70%,
            rgba(0, 212, 255, 0.03) 100%);
          pointer-events: none;
          z-index: 0;
        }

        /* Panel */
        .cel-panel {
          background: ${C.bgPanel};
          border: 1px solid ${C.border};
          border-radius: 12px;
          backdrop-filter: blur(12px);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .cel-panel:hover {
          border-color: ${C.borderHover};
          box-shadow: ${C.glowCyan};
        }

        /* KPI card */
        .kpi-cell {
          background: ${C.bgCard};
          border: 1px solid ${C.border};
          border-radius: 10px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          animation: fadeIn 0.4s ease both;
          position: relative;
          overflow: hidden;
        }
        .kpi-cell::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--kpi-color, ${C.cyan}), transparent);
          opacity: 0.6;
        }
        .kpi-cell:hover {
          border-color: ${C.borderHover};
          box-shadow: var(--kpi-glow, ${C.glowCyan});
        }
        .kpi-num {
          font-size: 28px;
          font-weight: 900;
          line-height: 1;
          font-family: 'SF Mono', 'Fira Code', monospace;
          letter-spacing: -1px;
        }
        .kpi-label {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          font-weight: 700;
          color: ${C.textMuted};
        }

        /* Search */
        .cel-search {
          background: ${C.searchBg} !important;
          color: ${C.searchText} !important;
          border: 1.5px solid ${C.searchBorder} !important;
          border-radius: 10px !important;
          font-size: 13px !important;
          height: 40px !important;
        }
        .cel-search::placeholder { color: ${C.searchPlaceholder} !important; }
        .cel-search:focus {
          border-color: ${C.cyan} !important;
          box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.15) !important;
          outline: none !important;
        }

        /* Quick buttons */
        .cel-btn {
          background: ${C.bgCard} !important;
          border: 1px solid ${C.border} !important;
          color: ${C.textPrimary} !important;
          border-radius: 9px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          height: 40px !important;
          padding: 0 14px !important;
          transition: all 0.18s ease !important;
          white-space: nowrap !important;
          display: flex !important;
          align-items: center !important;
          gap: 5px !important;
        }
        .cel-btn:hover {
          background: ${C.cyanDim} !important;
          border-color: ${C.borderHover} !important;
          color: ${C.cyan} !important;
          transform: translateY(-1px);
        }
        .cel-btn-primary {
          background: ${C.goldDim} !important;
          border: 1px solid ${C.borderGold} !important;
          color: ${C.goldBright} !important;
          font-weight: 700 !important;
        }
        .cel-btn-primary:hover {
          background: rgba(212, 160, 48, 0.28) !important;
          border-color: ${C.borderGoldHover} !important;
          color: ${C.goldBright} !important;
          box-shadow: ${C.glowGold};
          transform: translateY(-1px);
        }

        /* Section title */
        .cel-section-title {
          color: ${C.cyan} !important;
          font-size: 9px !important;
          font-weight: 800 !important;
          letter-spacing: 2px !important;
          text-transform: uppercase !important;
        }

        /* View all link */
        .cel-view {
          color: ${C.gold} !important;
          font-size: 11px !important;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .cel-view:hover { opacity: 0.75; text-decoration: underline; }

        /* Module item */
        .mod-cell {
          background: ${C.bgPanel};
          border: 1px solid ${C.border};
          border-radius: 10px;
          padding: 9px 10px;
          cursor: pointer;
          transition: all 0.18s ease;
          animation: slideInRight 0.35s ease both;
          display: flex;
          align-items: center;
          gap: 9px;
        }
        .mod-cell:hover {
          background: ${C.bgPanelHover};
          border-color: var(--mod-color, ${C.borderHover});
          box-shadow: 0 0 14px var(--mod-glow, rgba(0,212,255,0.15));
          transform: translateX(-3px);
        }
        .mod-num {
          font-size: 9px;
          font-weight: 900;
          color: var(--mod-color, ${C.gold});
          opacity: 0.5;
          font-family: monospace;
          min-width: 18px;
        }
        .mod-icon-box {
          width: 30px; height: 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
          background: var(--mod-bg, ${C.cyanDim});
          border: 1px solid var(--mod-color, ${C.cyan})40;
          color: var(--mod-color, ${C.cyan});
          transition: transform 0.15s ease;
        }
        .mod-cell:hover .mod-icon-box { transform: scale(1.1) rotate(-3deg); }
        .mod-title {
          flex: 1;
          font-size: 11px;
          font-weight: 700;
          color: ${C.textPrimary};
          line-height: 1.3;
        }
        .mod-arrow {
          color: ${C.goldMid};
          font-size: 11px;
          flex-shrink: 0;
          transition: transform 0.15s ease, color 0.15s ease;
        }
        .mod-cell:hover .mod-arrow {
          transform: translateX(3px);
          color: ${C.goldBright};
        }

        /* Table */
        .cel-table .ant-table {
          background: transparent !important;
          font-size: 12px;
        }
        .cel-table .ant-table-thead > tr > th {
          background: ${C.tableHead} !important;
          color: ${C.cyan} !important;
          border-bottom: 1px solid ${C.border} !important;
          font-size: 9px !important;
          font-weight: 800 !important;
          letter-spacing: 1.2px !important;
          padding: 5px 8px !important;
          text-transform: uppercase;
        }
        .cel-table .ant-table-tbody > tr > td {
          background: ${C.tableRow} !important;
          border-bottom: 1px solid rgba(0, 212, 255, 0.05) !important;
          padding: 5px 8px !important;
        }
        .cel-table .ant-table-tbody > tr:hover > td {
          background: ${C.tableRowHover} !important;
        }
        .cel-table .ant-table-wrapper .ant-table-pagination {
          display: none !important;
        }
        .cel-table .ant-empty-description { color: ${C.textMuted} !important; }

        /* Workflow */
        .wf-dot {
          width: 28px; height: 28px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px;
          flex-shrink: 0;
          border: 1.5px solid currentColor;
          transition: transform 0.15s ease;
        }
        .wf-dot:hover { transform: scale(1.15); }
        .wf-line {
          height: 2px; flex: 1;
          background: linear-gradient(90deg, ${C.cyanMid} 0%, rgba(0,212,255,0.08) 100%);
          margin: 0 4px; margin-top: -6px;
        }

        /* Live badge */
        .live-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: ${C.redDim};
          border: 1px solid ${C.red};
          border-radius: 20px;
          padding: 3px 8px;
          font-size: 10px;
          font-weight: 700;
          color: ${C.red};
          letter-spacing: 1px;
          text-transform: uppercase;
          animation: floatBadge 2s ease-in-out infinite;
        }
        .live-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: ${C.red};
          animation: pulseCyan 1.5s ease-in-out infinite;
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.borderHover}; }
      `}</style>

      <div className="celestial-root">

        {/* ===== HEADER ===== */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px 8px',
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0, position: 'relative', zIndex: 1,
        }}>
          {/* Left: Branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Logo hexagon */}
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: `linear-gradient(135deg, ${C.goldDim}, ${C.cyanDim})`,
              border: `1.5px solid ${C.borderGold}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: C.glowGold,
            }}>
              <HeartOutlined style={{ color: C.goldBright, fontSize: 18 }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  color: C.textPrimary, fontSize: 15, fontWeight: 900,
                  letterSpacing: '-0.3px',
                }}>
                  AMIS
                </span>
                <span style={{
                  color: C.gold, fontSize: 11, fontWeight: 700,
                  background: C.goldDim, border: `1px solid ${C.borderGold}`,
                  borderRadius: 5, padding: '1px 6px',
                }}>
                  REGISTRATURA
                </span>
              </div>
              <div style={{ color: C.textMuted, fontSize: 11, marginTop: 1 }}>
                {dateStr}
              </div>
            </div>
          </div>

          {/* Center: Live time */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              color: C.cyan, fontSize: 22, fontWeight: 900,
              fontFamily: 'monospace', letterSpacing: '2px',
              textShadow: '0 0 20px rgba(0,212,255,0.4)',
            }}>
              {nowStr}
            </div>
            <div style={{ color: C.textMuted, fontSize: 9, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              Toshkent vaqti
            </div>
          </div>

          {/* Right: Status badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Live queue badge */}
            <div className="live-badge">
              <div className="live-dot" style={{ background: '#ff5252' }} />
              NAVBAT
              <Badge
                count={stats.waitingPatients}
                style={{ backgroundColor: C.red, fontSize: 9, minWidth: 16, height: 16, lineHeight: 16 }}
                showZero
              />
            </div>
            {/* System status */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: C.greenDim, border: `1px solid ${C.green}`,
              borderRadius: 8, padding: '4px 9px',
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: C.green, boxShadow: C.glowGreen,
                animation: 'pulseCyan 2s ease-in-out infinite',
              }} />
              <span style={{ color: C.green, fontSize: 10, fontWeight: 700 }}>ONLINE</span>
            </div>
          </div>
        </div>

        {/* ===== MAIN LAYOUT: LEFT + RIGHT ===== */}
        <div style={{
          display: 'flex', gap: 10, flex: 1, minHeight: 0,
          padding: '8px 12px 8px',
          position: 'relative', zIndex: 1, overflow: 'hidden',
        }}>

          {/* ===== LEFT PANEL ===== */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            gap: 7, minWidth: 0, overflow: 'hidden',
          }}>

            {/* KPI ROW — 5 futuristic cells */}
            <div style={{ display: 'flex', gap: 6 }}>
              {/* Qabullar */}
              <div className="kpi-cell" style={{ '--kpi-color': C.cyan, '--kpi-glow': C.glowCyan } as any}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <CalendarOutlined style={{ color: C.cyanMid, fontSize: 16 }} />
                </div>
                <div className="kpi-num" style={{ color: C.cyan }}>{stats.todayAppointments}</div>
                <div className="kpi-label">Bugungi qabullar</div>
              </div>
              {/* Kutmoqda */}
              <div className="kpi-cell" style={{ '--kpi-color': C.orange, '--kpi-glow': '0 0 12px rgba(255,143,0,0.2)' } as any}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <ClockCircleOutlined style={{ color: 'rgba(255,143,0,0.35)', fontSize: 16 }} />
                </div>
                <div className="kpi-num" style={{ color: C.orange }}>{stats.waitingPatients}</div>
                <div className="kpi-label">Kutmoqda</div>
              </div>
              {/* Kechikganlar */}
              <div className="kpi-cell" style={{ '--kpi-color': C.red, '--kpi-glow': '0 0 12px rgba(255,82,82,0.2)' } as any}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <ExclamationCircleOutlined style={{ color: 'rgba(255,82,82,0.35)', fontSize: 16 }} />
                </div>
                <div className="kpi-num" style={{ color: C.red }}>{stats.latePatients}</div>
                <div className="kpi-label">Kechikganlar</div>
              </div>
              {/* Tugallangan */}
              <div className="kpi-cell" style={{ '--kpi-color': C.green, '--kpi-glow': C.glowGreen } as any}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <CheckCircleOutlined style={{ color: 'rgba(0,200,83,0.35)', fontSize: 16 }} />
                </div>
                <div className="kpi-num" style={{ color: C.green }}>{stats.completedToday}</div>
                <div className="kpi-label">Tugallangan</div>
              </div>
              {/* To'lov */}
              <div className="kpi-cell" style={{ '--kpi-color': C.gold, '--kpi-glow': C.glowGold } as any}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <MoneyCollectOutlined style={{ color: C.goldMid, fontSize: 16 }} />
                </div>
                <div className="kpi-num" style={{ color: C.gold }}>{stats.paymentWaiting}</div>
                <div className="kpi-label">To'lov kutayotgan</div>
              </div>
            </div>

            {/* Search + Quick Actions */}
            <div className="cel-panel" style={{ padding: '8px 10px' }}>
              <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                <input
                  className="cel-search"
                  placeholder="Bemor qidirish — MED-ID, telefon, FIO..."
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && searchVal.trim()) {
                      navigate(`/patients?search=${encodeURIComponent(searchVal.trim())}`)
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <button className="cel-btn cel-btn-primary" onClick={() => navigate('/patients/new')}>
                  <UserAddOutlined /> Yangi bemor
                </button>
                <button className="cel-btn" onClick={() => navigate('/appointments')}>
                  <CalendarOutlined /> Qabul
                </button>
                <button className="cel-btn" onClick={() => navigate('/queue')}>
                  <TeamOutlined /> Navbat
                </button>
              </div>
            </div>

            {/* Workflow Line */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px' }}>
              {[
                { icon: <UserAddOutlined />, label: 'Bemor', color: C.gold, bg: C.goldDim },
                { icon: <CalendarOutlined />, label: 'Qabul', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
                { icon: <TeamOutlined />, label: 'Navbat', color: C.orange, bg: C.orangeDim },
                { icon: <MedicineBoxOutlined />, label: 'Qabul', color: C.cyan, bg: C.cyanDim },
                { icon: <MoneyCollectOutlined />, label: "To'lov", color: C.green, bg: C.greenDim },
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 4 ? 1 : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div className="wf-dot" style={{ background: step.bg, color: step.color }}>
                      {step.icon}
                    </div>
                    <span style={{ fontSize: 9, color: step.color, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {step.label}
                    </span>
                  </div>
                  {i < 4 && <div className="wf-line" />}
                </div>
              ))}
            </div>

            {/* ===== PREVIEW BLOCKS ===== */}
            <div style={{ display: 'flex', gap: 7, flex: 1, minHeight: 0, overflow: 'hidden' }}>

              {/* Bugungi Qabullar — wider */}
              <div className="cel-panel" style={{ flex: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '7px 10px', borderBottom: `1px solid ${C.border}`, flexShrink: 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <CalendarOutlined style={{ color: C.gold, fontSize: 13 }} />
                    <span className="cel-section-title">Bugungi qabullar</span>
                    <Badge count={stats.todayAppointments}
                      style={{ backgroundColor: C.gold, fontSize: 9 }} />
                  </div>
                  <span className="cel-view" onClick={() => navigate('/appointments')}>
                    Barchasi <ArrowRightOutlined style={{ fontSize: 9 }} />
                  </span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }} className="cel-table">
                  {displayAppts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 20, color: C.textMuted }}>
                      <CalendarOutlined style={{ fontSize: 24, marginBottom: 6, opacity: 0.4 }} />
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
                        style: { cursor: record.patient_id ? 'pointer' : 'default' },
                        onClick: () => record.patient_id && navigate(`/patients/${record.patient_id}`),
                      })}
                    />
                  )}
                </div>
              </div>

              {/* Queue + Payment — narrower */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>

                {/* Jonli Navbat */}
                <div className="cel-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 10px', borderBottom: `1px solid ${C.border}`, flexShrink: 0,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <TeamOutlined style={{ color: C.orange, fontSize: 13 }} />
                      <span className="cel-section-title">Jonli navbat</span>
                      <Badge count={stats.waitingPatients}
                        style={{ backgroundColor: C.orange, fontSize: 9 }} />
                    </div>
                    <span className="cel-view" onClick={() => navigate('/queue')}>
                      Boshqar <ArrowRightOutlined style={{ fontSize: 9 }} />
                    </span>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto' }} className="cel-table">
                    {queueEntries.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 14, color: C.textMuted }}>
                        <TeamOutlined style={{ fontSize: 20, opacity: 0.4, marginBottom: 4 }} />
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
                <div className="cel-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 10px', borderBottom: `1px solid ${C.border}`, flexShrink: 0,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <MoneyCollectOutlined style={{ color: C.green, fontSize: 13 }} />
                      <span className="cel-section-title">To'lov</span>
                      <Badge count={stats.paymentWaiting}
                        style={{ backgroundColor: C.green, fontSize: 9 }} />
                    </div>
                    <span className="cel-view" onClick={() => navigate('/cashier')}>
                      Kassa <ArrowRightOutlined style={{ fontSize: 9 }} />
                    </span>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '2px 0' }}>
                    {(openInvoices?.data || []).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 14, color: C.textMuted }}>
                        <MoneyCollectOutlined style={{ fontSize: 20, opacity: 0.4, marginBottom: 4 }} />
                        <div style={{ fontSize: 11 }}>To'lov kutayotganlar yo'q</div>
                      </div>
                    ) : (
                      (openInvoices?.data || []).slice(0, 4).map((item: any, idx: number) => (
                        <div
                          key={item.id || idx}
                          style={{
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            borderBottom: `1px solid rgba(0,212,255,0.05)`,
                            cursor: 'pointer',
                          }}
                          onClick={() => navigate('/cashier')}
                        >
                          <div>
                            <div style={{ color: C.textPrimary, fontSize: 12, fontWeight: 600 }}>
                              {item.patient?.last_name || ''} {item.patient?.first_name || ''}
                            </div>
                            {item.patient?.med_id && (
                              <div style={{ color: C.gold, fontSize: 9, fontFamily: 'monospace', opacity: 0.85 }}>
                                {item.patient.med_id}
                              </div>
                            )}
                          </div>
                          <div style={{ color: C.green, fontSize: 11, fontWeight: 700 }}>
                            {item.total_amount?.toLocaleString()} so'm
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== RIGHT PANEL: 6 Module Hexagon-Buttons ===== */}
          <div style={{
            width: 175, flexShrink: 0, display: 'flex',
            flexDirection: 'column', gap: 5,
          }}>
            <div style={{
              color: C.cyan, fontSize: 9, fontWeight: 800,
              letterSpacing: '2px', textTransform: 'uppercase',
              padding: '0 3px 4px',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <VideoCameraOutlined style={{ fontSize: 11 }} />
              Modullar
            </div>
            {MODULES.map((mod, i) => (
              <div
                key={mod.key}
                className="mod-cell"
                style={{
                  animationDelay: `${i * 60}ms`,
                  '--mod-color': mod.color,
                  '--mod-bg': mod.bg,
                  '--mod-glow': `0 0 12px ${mod.color}30`,
                } as any}
                onClick={() => {
                  if (mod.key === 'queue-display') {
                    window.open(mod.route, '_blank')
                  } else {
                    navigate(mod.route)
                  }
                }}
              >
                <div className="mod-num">{mod.num}</div>
                <div className="mod-icon-box"
                  style={{ background: mod.bg, borderColor: `${mod.color}40` }}
                >
                  {mod.icon}
                </div>
                <div className="mod-title">{mod.title}</div>
                <RightOutlined className="mod-arrow" />
              </div>
            ))}

            {/* Quick patient lookup */}
            <div style={{
              marginTop: 8, padding: '8px 10px',
              background: C.cyanDim,
              border: `1px solid ${C.cyanMid}`,
              borderRadius: 10, display: 'flex',
              alignItems: 'center', gap: 8,
            }}>
              <Avatar
                size={28}
                style={{ background: C.cyan, color: C.bg, fontWeight: 800, fontSize: 11 }}
                icon={<UserOutlined />}
              />
              <div>
                <div style={{ color: C.textPrimary, fontSize: 11, fontWeight: 700 }}>
                  Oxirgi tanlangan
                </div>
                <div style={{ color: C.textMuted, fontSize: 9 }}>
                  Bemor pasportini oching
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center', padding: '4px 0 6px',
          color: C.textMuted, fontSize: 10,
          borderTop: `1px solid ${C.border}`,
          flexShrink: 0, position: 'relative', zIndex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <HeartOutlined style={{ color: C.gold, fontSize: 10 }} />
          <span>AMIS — Asalari Tibbiy Axborot Tizimi</span>
          <span style={{ color: C.cyan, opacity: 0.5 }}>v2.0</span>
        </div>
      </div>
    </>
  )
}
