/**
 * AMIS - Registratura Ish Stoli
 * Sky-Blue Celestial Future Medical Command Monitor
 * Full-screen, no sidebar, bright sky theme, hexagon modules
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Tag, Badge, Avatar } from 'antd'
import {
  UserAddOutlined, CalendarOutlined, TeamOutlined,
  ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  MoneyCollectOutlined, HistoryOutlined, ArrowRightOutlined,
  UserOutlined, MedicineBoxOutlined, DesktopOutlined,
  SearchOutlined, RightOutlined, HeartOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { appointmentService, queueService, cashierService, patientService } from '../services/api'
import { statusTranslations } from '../i18n/uz'

dayjs.extend(utc)
dayjs.extend(timezone)

// ===== BRIGHT SKY-BLUE CELESTIAL PALETTE =====
const C = {
  // Backgrounds — BRIGHT sky gradient
  bgTop: '#5db7ff',
  bgMid: '#8bd3ff',
  bgBottom: '#b8e0ff',
  bgDeep: '#c8e8ff',

  // Glassmorphism panels
  panelGlass: 'rgba(8, 35, 80, 0.52)',
  panelGlassHover: 'rgba(12, 45, 95, 0.60)',
  panelGlassStrong: 'rgba(5, 25, 65, 0.68)',

  // Borders
  borderGlass: 'rgba(0, 212, 255, 0.50)',
  borderHover: 'rgba(0, 212, 255, 0.78)',
  borderGold: 'rgba(212, 160, 48, 0.65)',
  borderGoldHover: 'rgba(212, 160, 48, 0.90)',

  // Accents
  gold: '#d4af37',
  goldBright: '#f7c948',
  goldDeep: '#b8900a',
  goldGlass: 'rgba(212, 160, 48, 0.20)',
  goldGlassMid: 'rgba(212, 160, 48, 0.35)',
  cyan: '#0099dd',
  cyanBright: '#00b8f8',
  cyanGlass: 'rgba(0, 150, 220, 0.18)',
  cyanGlassMid: 'rgba(0, 150, 220, 0.32)',

  // Status
  green: '#009944',
  greenBright: '#00bb55',
  greenGlass: 'rgba(0, 153, 68, 0.18)',
  orange: '#e06b00',
  orangeBright: '#ff7f20',
  orangeGlass: 'rgba(224, 107, 0, 0.18)',
  red: '#cc2222',
  redBright: '#ee3333',
  redGlass: 'rgba(204, 34, 34, 0.18)',
  blue: '#2266dd',
  blueGlass: 'rgba(34, 102, 221, 0.18)',
  purple: '#7744cc',
  purpleGlass: 'rgba(119, 68, 204, 0.18)',

  // Text — on dark panels (white on blue)
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.82)',
  textMuted: 'rgba(255,255,255,0.55)',
  textGold: '#ffd76a',
  textCyan: '#80e0ff',

  // Search — light on sky
  searchBg: 'rgba(255, 255, 255, 0.92)',
  searchText: '#082d5c',
  searchPlaceholder: '#5a88bb',
  searchBorder: 'rgba(0, 120, 200, 0.35)',

  // Table — glass panels
  tableHead: 'rgba(0, 100, 180, 0.28)',
  tableRow: 'rgba(255, 255, 255, 0.06)',
  tableRowHover: 'rgba(0, 150, 220, 0.14)',
  tableBorder: 'rgba(255, 255, 255, 0.10)',

  // Glow
  glowCyan: '0 0 18px rgba(0, 150, 220, 0.35)',
  glowGold: '0 0 14px rgba(212, 160, 48, 0.35)',
  glowGreen: '0 0 14px rgba(0, 153, 68, 0.35)',
  shadowCard: '0 4px 24px rgba(0, 80, 160, 0.18), 0 1px 4px rgba(0,0,0,0.08)',
  shadowFloating: '0 8px 32px rgba(0, 60, 140, 0.25), 0 2px 8px rgba(0,0,0,0.10)',
}

// ===== ASSETS =====
const HONEYCOMB_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34L28 66zm0-48L6.5 30.3 6.5 69.7 28 84l21.5-14.3V30.3L28 18z' fill='rgba(255,255,255,0.07)' fill-rule='evenodd'/%3E%3C/svg%3E")`

// ===== MODULES =====
const MODULES = [
  { key: 'patient-register', title: 'Bemor ro\'yxatga olish', icon: <UserAddOutlined />, color: C.gold, bg: C.goldGlass, route: '/patients/new', num: '01' },
  { key: 'patient-360', title: 'Patient 360', icon: <UserOutlined />, color: C.cyanBright, bg: C.cyanGlass, route: '/patients', num: '02' },
  { key: 'appointments', title: 'Qabullar', icon: <CalendarOutlined />, color: C.purple, bg: C.purpleGlass, route: '/appointments', num: '03' },
  { key: 'queue', title: 'Elektron navbat', icon: <TeamOutlined />, color: C.orangeBright, bg: C.orangeGlass, route: '/queue', num: '04' },
  { key: 'queue-display', title: 'Navbat displeyi', icon: <DesktopOutlined />, color: C.greenBright, bg: C.greenGlass, route: '/queue-display', num: '05' },
  { key: 'history', title: 'Qabullar tarixi', icon: <HistoryOutlined />, color: C.blue, bg: C.blueGlass, route: '/registration-history', num: '06' },
]

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#448aff', confirmed: '#40c4ff', checked_in: '#00bcd4',
  waiting: '#ff8f00', called: '#ffa726', in_progress: '#f0c040',
  completed: '#00bb55', cancelled: '#ee4444',
  open: '#ff8f00', partially_paid: '#f0c040', paid: '#00bb55',
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

  // Tashkent timezone
  const tz = 'Asia/Tashkent'
  const nowTashkent = dayjs().tz(tz)
  const todayStr = nowTashkent.format('YYYY-MM-DD')
  const nowTimeStr = nowTashkent.format('HH:mm')
  const dateStr = nowTashkent.format('dddd, D-MMMM, YYYY')

  const [stats, setStats] = useState<KPIStats>({
    todayAppointments: 0, waitingPatients: 0, latePatients: 0,
    completedToday: 0, paymentWaiting: 0, registeredToday: 0,
  })

  // ===== DATA QUERIES — using Asia/Tashkent timezone =====
  const { data: todayAppts } = useQuery({
    queryKey: ['dash-today-appts'],
    queryFn: () => appointmentService.list({
      date_from: todayStr,
      date_to: todayStr,
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
    const currentTime = nowTashkent.format('HH:mm')
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
  }, [todayAppts, openInvoices, patientsData, allQueueEntries, nowTashkent])

  const appointments = todayAppts?.data || []
  const displayAppts = [...appointments]
    .sort((a: any, b: any) => (a.start_time || '').localeCompare(b.start_time || ''))
    .slice(0, 4)

  const queueEntries = (allQueueEntries?.data || [])
    .filter((e: any) => e.status === 'waiting')
    .slice(0, 4)

  // ===== TABLE COLUMNS (Appointments) =====
  const apptColumns = [
    {
      title: 'VAQT',
      dataIndex: 'start_time',
      key: 'start_time',
      width: 58,
      render: (t: string) => (
        <span style={{
          color: C.cyanBright, fontWeight: 800,
          fontFamily: 'monospace', fontSize: 13,
          textShadow: '0 0 8px rgba(0,184,248,0.4)',
        }}>
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
              <div style={{ color: C.goldBright, fontSize: 9, fontFamily: 'monospace', opacity: 0.9 }}>
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
      width: 108,
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
      width: 115,
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
      width: 92,
      render: (s: string) => (
        <Tag
          color={STATUS_COLORS[s] || 'default'}
          style={{ fontSize: 10, padding: '0 5px', margin: 0, fontWeight: 700, borderRadius: 12 }}
        >
          {statusTranslations[s] || s}
        </Tag>
      ),
    },
  ]

  // ===== TABLE COLUMNS (Queue) =====
  const queueColumns = [
    {
      title: '#',
      dataIndex: 'queue_number',
      key: 'queue_number',
      width: 36,
      render: (n: number | string) => (
        <span style={{
          color: C.goldBright, fontWeight: 900, fontSize: 16,
          fontFamily: 'monospace', textShadow: '0 0 8px rgba(247,201,72,0.4)',
        }}>
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
              <div style={{ color: C.goldBright, fontSize: 9, fontFamily: 'monospace', opacity: 0.9 }}>
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
        <span style={{
          color: C.cyanBright, fontSize: 12, fontWeight: 700,
          textShadow: '0 0 6px rgba(0,184,248,0.3)',
        }}>
          {r || '-'}
        </span>
      ),
    },
    {
      title: 'HOLAT',
      dataIndex: 'status',
      key: 'status',
      width: 70,
      render: (s: string) => (
        <Tag
          color={STATUS_COLORS[s] || 'default'}
          style={{ fontSize: 10, padding: '0 5px', margin: 0, borderRadius: 12 }}
        >
          {statusTranslations[s] || s}
        </Tag>
      ),
    },
  ]

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(16px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes floatIn {
          0% { opacity: 0; transform: translateY(-6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
        @keyframes liveGlow {
          0%, 100% { box-shadow: 0 0 6px rgba(255,100,100,0.5); }
          50% { box-shadow: 0 0 14px rgba(255,100,100,0.8); }
        }

        /* Root — bright sky gradient */
        .sky-root {
          min-height: 100vh;
          height: 100vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          background:
            linear-gradient(175deg,
              #5db7ff 0%,
              #7ec8f5 15%,
              #98d8ff 30%,
              #b0e2ff 50%,
              #c0e8ff 70%,
              #d0eeff 100%);
          position: relative;
        }
        /* Cloud wisps */
        .sky-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 40% at 10% 8%, rgba(255,255,255,0.55) 0%, transparent 60%),
            radial-gradient(ellipse 60% 30% at 90% 5%, rgba(255,255,255,0.45) 0%, transparent 55%),
            radial-gradient(ellipse 50% 20% at 50% 2%, rgba(255,255,255,0.35) 0%, transparent 50%),
            radial-gradient(ellipse 70% 35% at 75% 12%, rgba(255,255,255,0.30) 0%, transparent 55%),
            radial-gradient(ellipse 40% 15% at 25% 3%, rgba(255,255,255,0.40) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }
        /* Honeycomb overlay */
        .sky-root::after {
          content: '';
          position: fixed;
          inset: 0;
          background-image: ${HONEYCOMB_SVG};
          opacity: 0.4;
          pointer-events: none;
          z-index: 0;
        }

        /* Glass Panel */
        .glass-card {
          background: ${C.panelGlass} !important;
          border: 1px solid ${C.borderGlass} !important;
          border-radius: 14px !important;
          backdrop-filter: blur(16px) saturate(1.4) !important;
          -webkit-backdrop-filter: blur(16px) saturate(1.4) !important;
          box-shadow: ${C.shadowCard} !important;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, transform 0.2s ease !important;
        }
        .glass-card:hover {
          background: ${C.panelGlassHover} !important;
          border-color: ${C.borderHover} !important;
          box-shadow: ${C.shadowFloating}, ${C.glowCyan} !important;
          transform: translateY(-1px);
        }

        /* KPI Cell — floating glass */
        .kpi-cell {
          background: ${C.panelGlass} !important;
          border: 1.5px solid ${C.borderGlass} !important;
          border-radius: 14px !important;
          backdrop-filter: blur(16px) saturate(1.4) !important;
          -webkit-backdrop-filter: blur(16px) saturate(1.4) !important;
          padding: 9px 11px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 2px !important;
          position: relative !important;
          overflow: hidden !important;
          box-shadow: ${C.shadowCard} !important;
          transition: all 0.2s ease !important;
          animation: fadeInUp 0.4s ease both !important;
        }
        .kpi-cell:hover {
          background: ${C.panelGlassHover} !important;
          border-color: ${C.borderHover} !important;
          box-shadow: ${C.shadowFloating}, ${C.glowCyan} !important;
          transform: translateY(-2px) !important;
        }
        .kpi-cell::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, var(--kpi-c, ${C.cyanBright}), transparent);
          opacity: 0.7;
        }
        .kpi-num {
          font-size: 26px;
          font-weight: 900;
          line-height: 1;
          font-family: 'SF Mono', 'Fira Code', monospace;
          letter-spacing: -1.5px;
        }
        .kpi-label {
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: 1.3px;
          font-weight: 700;
          color: ${C.textMuted};
        }

        /* Search Input */
        .sky-search {
          background: ${C.searchBg} !important;
          color: ${C.searchText} !important;
          border: 2px solid ${C.searchBorder} !important;
          border-radius: 12px !important;
          font-size: 13px !important;
          height: 42px !important;
          font-weight: 500 !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important;
        }
        .sky-search::placeholder { color: ${C.searchPlaceholder} !important; }
        .sky-search:focus {
          border-color: ${C.cyan} !important;
          box-shadow: 0 0 0 3px rgba(0,150,220,0.18) !important, 0 2px 8px rgba(0,0,0,0.06) !important;
          outline: none !important;
          background: #ffffff !important;
        }
        .sky-search-icon { color: ${C.cyan} !important; opacity: 0.7; }

        /* Quick Buttons */
        .sky-btn {
          background: ${C.panelGlass} !important;
          border: 1.5px solid ${C.borderGlass} !important;
          color: ${C.textPrimary} !important;
          border-radius: 11px !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          height: 42px !important;
          padding: 0 14px !important;
          transition: all 0.18s ease !important;
          white-space: nowrap !important;
          display: flex !important;
          align-items: center !important;
          gap: 5px !important;
          box-shadow: ${C.shadowCard} !important;
        }
        .sky-btn:hover {
          background: ${C.panelGlassHover} !important;
          border-color: ${C.borderHover} !important;
          color: ${C.textCyan} !important;
          transform: translateY(-1px);
          box-shadow: ${C.shadowFloating}, ${C.glowCyan} !important;
        }
        .sky-btn-primary {
          background: ${C.goldGlassMid} !important;
          border: 1.5px solid ${C.borderGold} !important;
          color: ${C.goldBright} !important;
          box-shadow: ${C.shadowCard}, 0 0 10px rgba(212,160,48,0.2) !important;
        }
        .sky-btn-primary:hover {
          background: rgba(212, 160, 48, 0.50) !important;
          border-color: ${C.borderGoldHover} !important;
          color: ${C.goldBright} !important;
          box-shadow: ${C.shadowFloating}, ${C.glowGold} !important;
          transform: translateY(-1px);
        }

        /* Section Title */
        .sky-section-title {
          color: ${C.textCyan} !important;
          font-size: 8px !important;
          font-weight: 800 !important;
          letter-spacing: 2.2px !important;
          text-transform: uppercase !important;
          text-shadow: 0 0 8px rgba(0,184,248,0.3) !important;
        }
        .sky-view-link {
          color: ${C.goldBright} !important;
          font-size: 10px !important;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.15s, text-shadow 0.15s;
          text-shadow: 0 0 6px rgba(247,201,72,0.25);
        }
        .sky-view-link:hover {
          opacity: 0.8;
          text-shadow: 0 0 10px rgba(247,201,72,0.5);
        }

        /* HEXAGON Module Button */
        .hex-cell {
          background: ${C.panelGlass} !important;
          border: 1.5px solid ${C.borderGlass} !important;
          border-radius: 12px !important;
          backdrop-filter: blur(16px) saturate(1.4) !important;
          -webkit-backdrop-filter: blur(16px) saturate(1.4) !important;
          padding: 8px 10px !important;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
          animation: slideInRight 0.35s ease both !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          box-shadow: ${C.shadowCard} !important;
          position: relative !important;
          overflow: hidden !important;
        }
        .hex-cell::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 30% 50%, var(--hex-glow, rgba(0,150,220,0.08)) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .hex-cell:hover::before { opacity: 1; }
        .hex-cell:hover {
          background: ${C.panelGlassHover} !important;
          border-color: var(--hex-bc, ${C.borderHover}) !important;
          box-shadow: ${C.shadowFloating}, 0 0 16px var(--hex-glow, rgba(0,150,220,0.25)) !important;
          transform: translateY(-3px) translateX(-2px) scale(1.02) !important;
        }
        .hex-num {
          font-size: 8px;
          font-weight: 900;
          color: var(--hex-c, ${C.gold});
          opacity: 0.55;
          font-family: monospace;
          min-width: 18px;
          text-shadow: 0 0 4px var(--hex-glow, rgba(0,0,0,0.2));
        }
        .hex-icon-box {
          width: 30px; height: 30px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
          background: var(--hex-bg, ${C.cyanGlass});
          border: 1.5px solid var(--hex-bc, ${C.cyan});
          color: var(--hex-c, ${C.cyanBright});
          opacity: 0.9;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 0 6px var(--hex-glow, rgba(0,150,220,0.15));
        }
        .hex-cell:hover .hex-icon-box {
          transform: scale(1.12) rotate(-4deg);
          box-shadow: 0 0 12px var(--hex-glow, rgba(0,150,220,0.3));
        }
        .hex-title {
          flex: 1;
          font-size: 10.5px;
          font-weight: 700;
          color: ${C.textPrimary};
          line-height: 1.3;
          text-shadow: 0 1px 2px rgba(0,0,0,0.15);
        }
        .hex-arrow {
          color: ${C.gold};
          font-size: 10px;
          flex-shrink: 0;
          opacity: 0.6;
          transition: transform 0.18s ease, opacity 0.18s ease, color 0.18s ease;
        }
        .hex-cell:hover .hex-arrow {
          transform: translateX(3px);
          opacity: 1;
          color: ${C.goldBright};
        }

        /* Table */
        .sky-table .ant-table {
          background: transparent !important;
          font-size: 12px;
        }
        .sky-table .ant-table-thead > tr > th {
          background: ${C.tableHead} !important;
          color: ${C.textCyan} !important;
          border-bottom: 1px solid ${C.tableBorder} !important;
          font-size: 8px !important;
          font-weight: 800 !important;
          letter-spacing: 1.5px !important;
          padding: 5px 8px !important;
          text-transform: uppercase;
          backdrop-filter: blur(4px);
        }
        .sky-table .ant-table-tbody > tr > td {
          background: ${C.tableRow} !important;
          border-bottom: 1px solid ${C.tableBorder} !important;
          padding: 5px 8px !important;
        }
        .sky-table .ant-table-tbody > tr:hover > td {
          background: ${C.tableRowHover} !important;
        }
        .sky-table .ant-table-wrapper .ant-table-pagination { display: none !important; }
        .sky-table .ant-empty-description { color: ${C.textMuted} !important; }

        /* Workflow */
        .wf-dot {
          width: 28px; height: 28px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px;
          flex-shrink: 0;
          border: 1.5px solid currentColor;
          backdrop-filter: blur(4px);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .wf-dot:hover { transform: scale(1.18); box-shadow: 0 0 10px currentColor; }
        .wf-line {
          height: 2px; flex: 1;
          background: linear-gradient(90deg, rgba(0,150,220,0.45) 0%, rgba(255,255,255,0.08) 100%);
          margin: 0 3px; margin-top: -6px;
        }

        /* Live Badge */
        .live-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(204, 34, 34, 0.88);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,100,100,0.7);
          border-radius: 20px;
          padding: 3px 9px;
          font-size: 9px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 1px;
          text-transform: uppercase;
          animation: floatIn 0.5s ease;
          box-shadow: 0 2px 8px rgba(204,34,34,0.3);
        }
        .live-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #ff6666;
          animation: pulseDot 1.2s ease-in-out infinite;
        }

        /* Online Status */
        .online-status {
          display: flex; align-items: center; gap: 5px;
          background: rgba(0,153,68,0.88);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(0,187,85,0.6);
          border-radius: 20px;
          padding: 3px 9px;
          box-shadow: 0 2px 8px rgba(0,153,68,0.25);
        }
        .online-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: ${C.greenBright};
          animation: pulseDot 2s ease-in-out infinite;
          box-shadow: 0 0 6px ${C.greenBright};
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,150,220,0.35); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,150,220,0.55); }
      `}</style>

      <div className="sky-root">

        {/* ===== PREMIUM HEADER MONITOR BAR ===== */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 14px 8px',
          borderBottom: '1px solid rgba(255,255,255,0.25)',
          flexShrink: 0, position: 'relative', zIndex: 2,
          background: 'rgba(5, 25, 70, 0.38)',
          backdropFilter: 'blur(12px)',
        }}>
          {/* Left: Branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Hexagon logo */}
            <div style={{
              width: 40, height: 40,
              clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
              background: `linear-gradient(135deg, ${C.goldGlassMid}, ${C.cyanGlass})`,
              border: '2px solid rgba(255,255,255,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 14px rgba(212,160,48,0.4), 0 0 6px rgba(0,150,220,0.3)`,
            }}>
              <HeartOutlined style={{ color: C.goldBright, fontSize: 18 }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  color: C.textPrimary, fontSize: 16, fontWeight: 900,
                  letterSpacing: '-0.3px', textShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }}>
                  AMIS
                </span>
                <span style={{
                  color: C.goldBright, fontSize: 10, fontWeight: 800,
                  background: C.goldGlassMid, border: '1.5px solid rgba(255,255,255,0.25)',
                  borderRadius: 6, padding: '1px 7px',
                  textShadow: '0 0 8px rgba(247,201,72,0.4)',
                  boxShadow: '0 0 8px rgba(212,160,48,0.2)',
                }}>
                  REGISTRATURA
                </span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 1, fontWeight: 500 }}>
                {dateStr}
              </div>
            </div>
          </div>

          {/* Center: Live Clock */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              color: '#ffffff', fontSize: 24, fontWeight: 900,
              fontFamily: 'monospace', letterSpacing: '3px',
              textShadow: '0 0 20px rgba(0,184,248,0.6), 0 2px 4px rgba(0,0,0,0.2)',
            }}>
              {nowTimeStr}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 8, textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>
              Toshkent vaqti
            </div>
          </div>

          {/* Right: Status Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div className="live-badge">
              <div className="live-dot" />
              NAVBAT
              <Badge
                count={stats.waitingPatients}
                style={{ backgroundColor: '#ee4444', fontSize: 9, minWidth: 16, height: 16, lineHeight: 16 }}
                showZero
              />
            </div>
            <div className="online-status">
              <div className="online-dot" />
              <span style={{ color: '#ffffff', fontSize: 9, fontWeight: 800, letterSpacing: '0.5px' }}>ONLINE</span>
            </div>
          </div>
        </div>

        {/* ===== MAIN: LEFT + RIGHT ===== */}
        <div style={{
          display: 'flex', gap: 10, flex: 1, minHeight: 0,
          padding: '8px 12px 0',
          position: 'relative', zIndex: 2, overflow: 'hidden',
        }}>

          {/* ===== LEFT PANEL ===== */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            gap: 7, minWidth: 0, overflow: 'hidden',
          }}>

            {/* KPI ROW — 5 floating glass cells */}
            <div style={{ display: 'flex', gap: 6 }}>
              {/* Qabullar */}
              <div className="kpi-cell" style={{ '--kpi-c': C.cyanBright, flex: 1 } as any}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                  <CalendarOutlined style={{ color: 'rgba(0,184,248,0.5)', fontSize: 14 }} />
                </div>
                <div className="kpi-num" style={{ color: C.cyanBright }}>{stats.todayAppointments}</div>
                <div className="kpi-label">Bugungi qabullar</div>
              </div>
              {/* Kutmoqda */}
              <div className="kpi-cell" style={{ '--kpi-c': C.orangeBright, flex: 1 } as any}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                  <ClockCircleOutlined style={{ color: 'rgba(255,127,32,0.5)', fontSize: 14 }} />
                </div>
                <div className="kpi-num" style={{ color: C.orangeBright }}>{stats.waitingPatients}</div>
                <div className="kpi-label">Kutmoqda</div>
              </div>
              {/* Kechikganlar */}
              <div className="kpi-cell" style={{ '--kpi-c': C.redBright, flex: 1 } as any}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                  <ExclamationCircleOutlined style={{ color: 'rgba(238,68,68,0.5)', fontSize: 14 }} />
                </div>
                <div className="kpi-num" style={{ color: C.redBright }}>{stats.latePatients}</div>
                <div className="kpi-label">Kechikganlar</div>
              </div>
              {/* Tugallangan */}
              <div className="kpi-cell" style={{ '--kpi-c': C.greenBright, flex: 1 } as any}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                  <CheckCircleOutlined style={{ color: 'rgba(0,187,85,0.5)', fontSize: 14 }} />
                </div>
                <div className="kpi-num" style={{ color: C.greenBright }}>{stats.completedToday}</div>
                <div className="kpi-label">Tugallangan</div>
              </div>
              {/* To'lov */}
              <div className="kpi-cell" style={{ '--kpi-c': C.goldBright, flex: 1 } as any}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                  <MoneyCollectOutlined style={{ color: 'rgba(247,201,72,0.5)', fontSize: 14 }} />
                </div>
                <div className="kpi-num" style={{ color: C.goldBright }}>{stats.paymentWaiting}</div>
                <div className="kpi-label">To'lov kutayotgan</div>
              </div>
            </div>

            {/* Search + Quick Actions */}
            <div className="glass-card" style={{ padding: '8px 10px' }}>
              <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                <input
                  className="sky-search"
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
                <button className="sky-btn sky-btn-primary" onClick={() => navigate('/patients/new')}>
                  <UserAddOutlined /> Yangi bemor
                </button>
                <button className="sky-btn" onClick={() => navigate('/appointments')}>
                  <CalendarOutlined /> Qabul
                </button>
                <button className="sky-btn" onClick={() => navigate('/queue')}>
                  <TeamOutlined /> Navbat
                </button>
              </div>
            </div>

            {/* Workflow Line */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px' }}>
              {[
                { icon: <UserAddOutlined />, label: 'Bemor', color: C.goldBright, bg: C.goldGlass },
                { icon: <CalendarOutlined />, label: 'Qabul', color: C.purple, bg: C.purpleGlass },
                { icon: <TeamOutlined />, label: 'Navbat', color: C.orangeBright, bg: C.orangeGlass },
                { icon: <MedicineBoxOutlined />, label: 'Qabul', color: C.cyanBright, bg: C.cyanGlass },
                { icon: <MoneyCollectOutlined />, label: "To'lov", color: C.greenBright, bg: C.greenGlass },
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 4 ? 1 : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div className="wf-dot" style={{ background: step.bg, color: step.color, boxShadow: `0 0 8px ${step.color}40` }}>
                      {step.icon}
                    </div>
                    <span style={{ fontSize: 8, color: step.color, fontWeight: 700, whiteSpace: 'nowrap', textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>
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
              <div className="glass-card" style={{ flex: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 10px', borderBottom: `1px solid ${C.tableBorder}`, flexShrink: 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <CalendarOutlined style={{ color: C.goldBright, fontSize: 13 }} />
                    <span className="sky-section-title">Bugungi qabullar</span>
                    <Badge count={stats.todayAppointments}
                      style={{ backgroundColor: C.gold, fontSize: 9, boxShadow: '0 0 6px rgba(212,160,48,0.4)' }} />
                  </div>
                  <span className="sky-view-link" onClick={() => navigate('/appointments')}>
                    Barchasi <ArrowRightOutlined style={{ fontSize: 9 }} />
                  </span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }} className="sky-table">
                  {displayAppts.length === 0 ? (
                    <div style={{
                      textAlign: 'center', padding: 16, color: C.textMuted,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    }}>
                      <CalendarOutlined style={{ fontSize: 22, opacity: 0.35 }} />
                      <div style={{ fontSize: 11, fontWeight: 600 }}>Bugungi qabullar yo'q</div>
                      <div style={{ fontSize: 9, opacity: 0.6 }}>Yangi qabul yaratish uchun "Qabul" tugmasini bosing</div>
                    </div>
                  ) : (
                    <Table
                      columns={apptColumns}
                      dataSource={displayAppts}
                      rowKey="id"
                      size="small"
                      pagination={false}
                      style={{ background: 'transparent' }}
                      scroll={{ y: 140 }}
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
                <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 10px', borderBottom: `1px solid ${C.tableBorder}`, flexShrink: 0,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <TeamOutlined style={{ color: C.orangeBright, fontSize: 13 }} />
                      <span className="sky-section-title">Jonli navbat</span>
                      <Badge count={stats.waitingPatients}
                        style={{ backgroundColor: C.orange, fontSize: 9, boxShadow: '0 0 6px rgba(224,107,0,0.4)' }} />
                    </div>
                    <span className="sky-view-link" onClick={() => navigate('/queue')}>
                      Boshqar <ArrowRightOutlined style={{ fontSize: 9 }} />
                    </span>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto' }} className="sky-table">
                    {queueEntries.length === 0 ? (
                      <div style={{
                        textAlign: 'center', padding: 12, color: C.textMuted,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      }}>
                        <TeamOutlined style={{ fontSize: 18, opacity: 0.35 }} />
                        <div style={{ fontSize: 10, fontWeight: 600 }}>Navbatda yo'q</div>
                        <div style={{ fontSize: 8, opacity: 0.55 }}>Bemorlarni navbatga qo'shing</div>
                      </div>
                    ) : (
                      <Table
                        columns={queueColumns}
                        dataSource={queueEntries}
                        rowKey="id"
                        size="small"
                        pagination={false}
                        style={{ background: 'transparent' }}
                        scroll={{ y: 110 }}
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
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 10px', borderBottom: `1px solid ${C.tableBorder}`, flexShrink: 0,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <MoneyCollectOutlined style={{ color: C.greenBright, fontSize: 13 }} />
                      <span className="sky-section-title">To'lov</span>
                      <Badge count={stats.paymentWaiting}
                        style={{ backgroundColor: C.green, fontSize: 9, boxShadow: '0 0 6px rgba(0,153,68,0.4)' }} />
                    </div>
                    <span className="sky-view-link" onClick={() => navigate('/cashier')}>
                      Kassa <ArrowRightOutlined style={{ fontSize: 9 }} />
                    </span>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '2px 0' }}>
                    {(openInvoices?.data || []).length === 0 ? (
                      <div style={{
                        textAlign: 'center', padding: 12, color: C.textMuted,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      }}>
                        <MoneyCollectOutlined style={{ fontSize: 18, opacity: 0.35 }} />
                        <div style={{ fontSize: 10, fontWeight: 600 }}>To'lov kutayotganlar yo'q</div>
                        <div style={{ fontSize: 8, opacity: 0.55 }}>Barcha to'lovlar bajarilgan</div>
                      </div>
                    ) : (
                      (openInvoices?.data || []).slice(0, 4).map((item: any, idx: number) => (
                        <div
                          key={item.id || idx}
                          style={{
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '5px 10px',
                            borderBottom: `1px solid ${C.tableBorder}`,
                            cursor: 'pointer',
                          }}
                          onClick={() => navigate('/cashier')}
                        >
                          <div>
                            <div style={{ color: C.textPrimary, fontSize: 11, fontWeight: 600 }}>
                              {item.patient?.last_name || ''} {item.patient?.first_name || ''}
                            </div>
                            {item.patient?.med_id && (
                              <div style={{ color: C.goldBright, fontSize: 9, fontFamily: 'monospace', opacity: 0.9 }}>
                                {item.patient.med_id}
                              </div>
                            )}
                          </div>
                          <div style={{ color: C.greenBright, fontSize: 11, fontWeight: 800, textShadow: '0 0 6px rgba(0,187,85,0.3)' }}>
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

          {/* ===== RIGHT PANEL: 6 Hexagon Module Buttons ===== */}
          <div style={{
            width: 178, flexShrink: 0, display: 'flex',
            flexDirection: 'column', gap: 5,
          }}>
            {/* Module header */}
            <div style={{
              color: C.textCyan, fontSize: 8, fontWeight: 800,
              letterSpacing: '2.5px', textTransform: 'uppercase',
              padding: '0 3px 3px',
              display: 'flex', alignItems: 'center', gap: 6,
              textShadow: '0 0 8px rgba(0,184,248,0.4)',
            }}>
              <DesktopOutlined style={{ fontSize: 11 }} />
              Modullar
            </div>
            {MODULES.map((mod, i) => (
              <div
                key={mod.key}
                className="hex-cell"
                style={{
                  animationDelay: `${i * 60}ms`,
                  '--hex-c': mod.color,
                  '--hex-bg': mod.bg,
                  '--hex-bc': mod.color,
                  '--hex-glow': `${mod.color}40`,
                } as any}
                onClick={() => {
                  if (mod.key === 'queue-display') {
                    window.open(mod.route, '_blank')
                  } else {
                    navigate(mod.route)
                  }
                }}
              >
                <div className="hex-num">{mod.num}</div>
                <div className="hex-icon-box"
                  style={{ background: mod.bg, borderColor: `${mod.color}80`, color: mod.color }}
                >
                  {mod.icon}
                </div>
                <div className="hex-title">{mod.title}</div>
                <RightOutlined className="hex-arrow" />
              </div>
            ))}

            {/* Quick patient shortcut */}
            <div style={{
              marginTop: 6,
              padding: '7px 10px',
              background: C.cyanGlass,
              border: `1.5px solid rgba(0,150,220,0.45)`,
              borderRadius: 12,
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: `0 0 10px rgba(0,150,220,0.15)`,
            }}>
              <Avatar
                size={28}
                style={{ background: C.cyan, color: '#ffffff', fontWeight: 800, fontSize: 11, flexShrink: 0 }}
                icon={<UserOutlined />}
              />
              <div>
                <div style={{ color: C.textPrimary, fontSize: 10, fontWeight: 700 }}>
                  Oxirgi tanlangan
                </div>
                <div style={{ color: C.textMuted, fontSize: 8 }}>
                  Bemor pasportini oching
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Minimal footer */}
        <div style={{
          textAlign: 'center', padding: '3px 0 5px',
          color: 'rgba(255,255,255,0.4)', fontSize: 9,
          flexShrink: 0, position: 'relative', zIndex: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          borderTop: '1px solid rgba(255,255,255,0.12)',
          letterSpacing: '0.5px',
        }}>
          <HeartOutlined style={{ color: C.gold, fontSize: 9 }} />
          <span>AMIS — Asalari Tibbiy Axborot Tizimi</span>
          <span style={{ color: C.cyanBright, opacity: 0.5 }}>v2.0</span>
        </div>
      </div>
    </>
  )
}
