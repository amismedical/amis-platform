/**
 * AMIS - Registratura Ish Stoli
 * Reference-based Premium Sky-Blue Celestial Future Medical Dashboard
 * Full-screen, no sidebar, sky-blue gradient, floating glass panels, hexagon modules
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Tag, Badge } from 'antd'
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

// ===== REFERENCE-ACCURATE PREMIUM PALETTE =====
const C = {
  // Sky-blue gradient background (matching reference)
  bgTop: '#63bfff',
  bgMid: '#8fd8ff',
  bgBottom: '#d8f4ff',

  // Deep panel blue — glass panels (reference: rgba(8, 45, 90, 0.72–0.86))
  panelGlass: 'rgba(8, 45, 90, 0.72)',
  panelGlassLight: 'rgba(8, 45, 90, 0.60)',
  panelGlassHover: 'rgba(10, 55, 105, 0.80)',
  panelGlassDeep: 'rgba(5, 30, 75, 0.82)',

  // Borders — glowing cyan + amber
  borderGlass: 'rgba(0, 200, 255, 0.45)',
  borderHover: 'rgba(0, 200, 255, 0.75)',
  borderGold: 'rgba(212, 160, 48, 0.75)',
  borderGoldHover: 'rgba(247, 201, 72, 0.95)',

  // Accents
  gold: '#d4af37',
  goldBright: '#f7c948',
  goldLight: '#ffd76a',
  goldGlass: 'rgba(212, 160, 48, 0.18)',
  goldGlassMid: 'rgba(212, 160, 48, 0.30)',
  cyan: '#00aadd',
  cyanBright: '#00ccff',
  cyanGlow: 'rgba(0, 200, 255, 0.5)',
  cyanGlass: 'rgba(0, 150, 220, 0.15)',

  // Status
  green: '#009944',
  greenBright: '#00bb55',
  greenGlass: 'rgba(0, 153, 68, 0.15)',
  orange: '#e06b00',
  orangeBright: '#ff7f20',
  orangeGlass: 'rgba(224, 107, 0, 0.15)',
  red: '#cc2222',
  redBright: '#ee3333',
  redGlass: 'rgba(204, 34, 34, 0.15)',
  purple: '#7744cc',
  purpleGlass: 'rgba(119, 68, 204, 0.15)',
  blue: '#2266dd',
  blueGlass: 'rgba(34, 102, 221, 0.15)',

  // Text — white on deep blue panels
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.85)',
  textMuted: 'rgba(255,255,255,0.55)',
  textGold: '#ffd76a',
  textCyan: '#80e0ff',

  // Search — light pill style
  searchBg: 'rgba(255, 255, 255, 0.92)',
  searchText: '#082d5c',
  searchPlaceholder: '#5a88bb',
  searchBorder: 'rgba(0, 140, 210, 0.40)',

  // Table
  tableHead: 'rgba(0, 120, 200, 0.25)',
  tableRow: 'rgba(255, 255, 255, 0.05)',
  tableRowHover: 'rgba(0, 160, 230, 0.12)',
  tableBorder: 'rgba(255, 255, 255, 0.08)',

  // Glow effects
  glowCyan: '0 0 20px rgba(0, 200, 255, 0.40)',
  glowGold: '0 0 18px rgba(212, 160, 48, 0.45)',
  glowGreen: '0 0 16px rgba(0, 187, 85, 0.40)',
  shadowCard: '0 6px 28px rgba(0, 60, 140, 0.22), 0 2px 6px rgba(0,0,0,0.10)',
  shadowFloating: '0 10px 36px rgba(0, 50, 130, 0.30), 0 3px 10px rgba(0,0,0,0.12)',
}

// ===== ASSETS =====
const HONEYCOMB_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34L28 66zm0-48L6.5 30.3 6.5 69.7 28 84l21.5-14.3V30.3L28 18z' fill='rgba(255,255,255,0.06)' fill-rule='evenodd'/%3E%3C/svg%3E")`

// ===== MODULES =====
const MODULES = [
  { key: 'patient-register', title: "Bemor ro'yxatga olish", icon: <UserAddOutlined />, color: C.goldBright, bg: C.goldGlass, route: '/patients/new', num: '01' },
  { key: 'patient-360', title: 'Patient 360', icon: <UserOutlined />, color: C.cyanBright, bg: C.cyanGlass, route: '/patients', num: '02' },
  { key: 'appointments', title: 'Qabullar', icon: <CalendarOutlined />, color: '#9966ff', bg: C.purpleGlass, route: '/appointments', num: '03' },
  { key: 'queue', title: 'Elektron navbat', icon: <TeamOutlined />, color: C.orangeBright, bg: C.orangeGlass, route: '/queue', num: '04' },
  { key: 'queue-display', title: 'Navbat displeyi', icon: <DesktopOutlined />, color: C.greenBright, bg: C.greenGlass, route: '/queue-display', num: '05' },
  { key: 'history', title: "Qabullar tarixi", icon: <HistoryOutlined />, color: C.blue, bg: C.blueGlass, route: '/registration-history', num: '06' },
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

  // Asia/Tashkent timezone
  const tz = 'Asia/Tashkent'
  const nowTashkent = dayjs().tz(tz)
  const todayStr = nowTashkent.format('YYYY-MM-DD')
  const nowTimeStr = nowTashkent.format('HH:mm')
  const dateStr = nowTashkent.format('dddd, D-MMMM, YYYY')

  const [stats, setStats] = useState<KPIStats>({
    todayAppointments: 0, waitingPatients: 0, latePatients: 0,
    completedToday: 0, paymentWaiting: 0, registeredToday: 0,
  })

  // ===== DATA QUERIES =====
  const { data: todayAppts } = useQuery({
    queryKey: ['dash-today-appts'],
    queryFn: () => appointmentService.list({ date_from: todayStr, date_to: todayStr, limit: 1000 }),
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
      todayAppointments: appts.length,
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
    .slice(0, 6)

  const queueEntries = (allQueueEntries?.data || [])
    .filter((e: any) => e.status === 'waiting')
    .slice(0, 5)

  // ===== TABLE COLUMNS (Appointments) =====
  const apptColumns = [
    {
      title: 'VAQT',
      dataIndex: 'start_time',
      key: 'start_time',
      width: 56,
      render: (t: string) => (
        <span style={{
          color: C.cyanBright, fontWeight: 800,
          fontFamily: 'monospace', fontSize: 13,
          textShadow: '0 0 8px rgba(0,200,255,0.4)',
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
              <div style={{ color: C.goldLight, fontSize: 9, fontFamily: 'monospace', opacity: 0.9 }}>
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
      width: 95,
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
      width: 34,
      render: (n: number | string) => (
        <span style={{
          color: C.goldBright, fontWeight: 900, fontSize: 15,
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
              <div style={{ color: C.goldLight, fontSize: 9, fontFamily: 'monospace', opacity: 0.9 }}>
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
      width: 42,
      render: (r: string) => (
        <span style={{
          color: C.cyanBright, fontSize: 12, fontWeight: 700,
          textShadow: '0 0 6px rgba(0,200,255,0.3)',
        }}>
          {r || '-'}
        </span>
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
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(18px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes floatIn {
          0% { opacity: 0; transform: translateY(-6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.80); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 6px rgba(255,80,80,0.5); }
          50% { box-shadow: 0 0 14px rgba(255,80,80,0.85); }
        }

        /* Root — reference-accurate sky gradient */
        .sky-root {
          min-height: 100vh;
          height: 100vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          background: linear-gradient(172deg,
            #63bfff 0%,
            #7ec8f0 12%,
            #9fd6ff 28%,
            #b8e2ff 48%,
            #cceaff 68%,
            #d8f4ff 100%);
          position: relative;
        }
        /* Cloud wisps — 5 soft radial gradients */
        .sky-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 90% 42% at 8% 6%, rgba(255,255,255,0.60) 0%, transparent 58%),
            radial-gradient(ellipse 65% 32% at 92% 4%, rgba(255,255,255,0.50) 0%, transparent 55%),
            radial-gradient(ellipse 55% 22% at 48% 1%, rgba(255,255,255,0.40) 0%, transparent 50%),
            radial-gradient(ellipse 75% 38% at 78% 10%, rgba(255,255,255,0.32) 0%, transparent 55%),
            radial-gradient(ellipse 45% 18% at 22% 2%, rgba(255,255,255,0.45) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }
        /* Honeycomb SVG overlay */
        .sky-root::after {
          content: '';
          position: fixed;
          inset: 0;
          background-image: ${HONEYCOMB_SVG};
          opacity: 0.35;
          pointer-events: none;
          z-index: 0;
        }

        /* Glass Panel — deep blue with reference opacity */
        .glass-panel {
          background: ${C.panelGlass} !important;
          border: 1px solid ${C.borderGlass} !important;
          border-radius: 16px !important;
          backdrop-filter: blur(18px) saturate(1.5) !important;
          -webkit-backdrop-filter: blur(18px) saturate(1.5) !important;
          box-shadow: ${C.shadowCard} !important;
          transition: border-color 0.22s ease, box-shadow 0.22s ease, background 0.22s ease, transform 0.22s ease !important;
          animation: fadeInUp 0.45s ease both !important;
        }
        .glass-panel:hover {
          background: ${C.panelGlassHover} !important;
          border-color: ${C.borderHover} !important;
          box-shadow: ${C.shadowFloating}, ${C.glowCyan} !important;
          transform: translateY(-1px) !important;
        }

        /* KPI Cell — beveled hexagonal futuristic card */
        .kpi-cell {
          background: ${C.panelGlass} !important;
          border: 2px solid ${C.borderGold} !important;
          border-radius: 10px !important;
          backdrop-filter: blur(18px) saturate(1.5) !important;
          -webkit-backdrop-filter: blur(18px) saturate(1.5) !important;
          padding: 10px 12px 8px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 2px !important;
          position: relative !important;
          overflow: hidden !important;
          box-shadow: ${C.shadowCard}, 0 0 12px rgba(212,160,48,0.15) !important;
          transition: all 0.22s cubic-bezier(0.34, 1.4, 0.64, 1) !important;
          animation: fadeInUp 0.4s ease both !important;
        }
        .kpi-cell:hover {
          background: ${C.panelGlassHover} !important;
          border-color: ${C.borderGoldHover} !important;
          box-shadow: ${C.shadowFloating}, 0 0 22px rgba(247,201,72,0.35) !important;
          transform: translateY(-3px) scale(1.02) !important;
        }
        /* Top color bar */
        .kpi-cell::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, var(--kpi-c, ${C.goldBright}), transparent);
          opacity: 0.85;
        }
        .kpi-num {
          font-size: 28px;
          font-weight: 900;
          line-height: 1;
          font-family: 'SF Mono', 'Fira Code', monospace;
          letter-spacing: -2px;
        }
        .kpi-label {
          font-size: 7.5px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          font-weight: 800;
          color: ${C.textMuted};
          line-height: 1.2;
        }
        .kpi-icon {
          position: absolute;
          top: 8px; right: 8px;
          opacity: 0.35;
          font-size: 14px;
        }

        /* Search Input — pill style with glowing border */
        .sky-search {
          background: ${C.searchBg} !important;
          color: ${C.searchText} !important;
          border: 2px solid ${C.searchBorder} !important;
          border-radius: 50px !important;
          font-size: 13px !important;
          height: 44px !important;
          font-weight: 500 !important;
          box-shadow: 0 2px 10px rgba(0,0,0,0.06), 0 0 0 0 rgba(0,140,210,0) !important;
          transition: border-color 0.2s, box-shadow 0.2s !important;
        }
        .sky-search::placeholder { color: ${C.searchPlaceholder} !important; }
        .sky-search:focus {
          border-color: ${C.cyan} !important;
          box-shadow: 0 0 0 4px rgba(0,170,230,0.12), 0 3px 12px rgba(0,0,0,0.08) !important;
          outline: none !important;
          background: #ffffff !important;
        }
        .sky-search-icon { color: ${C.cyan} !important; opacity: 0.7; }

        /* Primary Button — gradient blue-to-cyan */
        .sky-btn-primary {
          background: linear-gradient(135deg, #0099dd 0%, #00c8ff 100%) !important;
          border: 1.5px solid rgba(0,200,255,0.5) !important;
          color: #ffffff !important;
          border-radius: 50px !important;
          font-size: 12px !important;
          font-weight: 800 !important;
          height: 44px !important;
          padding: 0 18px !important;
          transition: all 0.18s ease !important;
          white-space: nowrap !important;
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
          box-shadow: 0 4px 14px rgba(0,150,220,0.35), 0 0 12px rgba(0,200,255,0.2) !important;
          letter-spacing: 0.3px;
        }
        .sky-btn-primary:hover {
          background: linear-gradient(135deg, #00aadd 0%, #00ddff 100%) !important;
          box-shadow: 0 6px 20px rgba(0,180,255,0.45), 0 0 20px rgba(0,200,255,0.35) !important;
          transform: translateY(-1px);
        }

        /* Secondary Button */
        .sky-btn {
          background: ${C.panelGlass} !important;
          border: 1.5px solid ${C.borderGlass} !important;
          color: ${C.textPrimary} !important;
          border-radius: 50px !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          height: 44px !important;
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

        /* Section Title */
        .sky-section-title {
          color: ${C.textCyan} !important;
          font-size: 7.5px !important;
          font-weight: 800 !important;
          letter-spacing: 2.5px !important;
          text-transform: uppercase !important;
          text-shadow: 0 0 8px rgba(0,200,255,0.35) !important;
        }
        .sky-view-link {
          color: ${C.goldBright} !important;
          font-size: 9px !important;
          fontWeight: 700;
          cursor: pointer;
          transition: opacity 0.15s, text-shadow 0.15s;
          text-shadow: 0 0 6px rgba(247,201,72,0.25);
          letter-spacing: 0.3px;
        }
        .sky-view-link:hover {
          opacity: 0.8;
          text-shadow: 0 0 12px rgba(247,201,72,0.55);
        }

        /* Hex Module Button — futuristic beveled style */
        .hex-cell {
          background: ${C.panelGlassDeep} !important;
          border: 1.5px solid ${C.borderGlass} !important;
          border-radius: 12px !important;
          backdrop-filter: blur(18px) saturate(1.5) !important;
          -webkit-backdrop-filter: blur(18px) saturate(1.5) !important;
          padding: 9px 11px !important;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.34, 1.5, 0.64, 1) !important;
          animation: slideInRight 0.4s ease both !important;
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
          background: radial-gradient(circle at 30% 50%, var(--hex-glow, rgba(0,200,255,0.08)) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .hex-cell:hover::before { opacity: 1; }
        .hex-cell:hover {
          background: ${C.panelGlassHover} !important;
          border-color: var(--hex-bc, ${C.borderHover}) !important;
          box-shadow: ${C.shadowFloating}, 0 0 20px var(--hex-glow, rgba(0,200,255,0.30)) !important;
          transform: translateY(-3px) scale(1.03) !important;
        }
        .hex-num {
          font-size: 8px;
          font-weight: 900;
          color: var(--hex-c, ${C.gold});
          opacity: 0.65;
          font-family: monospace;
          min-width: 18px;
          text-shadow: 0 0 4px var(--hex-glow, rgba(0,0,0,0.2));
          letter-spacing: 0.5px;
        }
        .hex-icon-box {
          width: 30px; height: 30px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px;
          flex-shrink: 0;
          background: var(--hex-bg, ${C.cyanGlass});
          border: 1.5px solid var(--hex-bc, ${C.cyan});
          color: var(--hex-c, ${C.cyanBright});
          opacity: 0.95;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 0 8px var(--hex-glow, rgba(0,200,255,0.15));
        }
        .hex-cell:hover .hex-icon-box {
          transform: scale(1.15) rotate(-4deg);
          box-shadow: 0 0 14px var(--hex-glow, rgba(0,200,255,0.30));
        }
        .hex-title {
          flex: 1;
          font-size: 10.5px;
          font-weight: 700;
          color: ${C.textPrimary};
          line-height: 1.3;
          text-shadow: 0 1px 3px rgba(0,0,0,0.20);
        }
        .hex-arrow {
          color: ${C.gold};
          font-size: 10px;
          flex-shrink: 0;
          opacity: 0.5;
          transition: transform 0.18s ease, opacity 0.18s ease, color 0.18s ease;
        }
        .hex-cell:hover .hex-arrow {
          transform: translateX(4px);
          opacity: 1;
          color: ${C.goldBright};
        }

        /* Table — glass panel style */
        .sky-table .ant-table {
          background: transparent !important;
          font-size: 12px;
        }
        .sky-table .ant-table-thead > tr > th {
          background: ${C.tableHead} !important;
          color: ${C.textCyan} !important;
          border-bottom: 1px solid ${C.tableBorder} !important;
          font-size: 7.5px !important;
          font-weight: 800 !important;
          letter-spacing: 1.8px !important;
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
          width: 30px; height: 30px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px;
          flex-shrink: 0;
          border: 1.5px solid currentColor;
          backdrop-filter: blur(4px);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .wf-dot:hover { transform: scale(1.18); box-shadow: 0 0 12px currentColor; }
        .wf-line {
          height: 2px; flex: 1;
          background: linear-gradient(90deg, rgba(0,180,240,0.45) 0%, rgba(255,255,255,0.08) 100%);
          margin: 0 3px; margin-top: -7px;
        }

        /* Live Badge — pulsing red dot */
        .live-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(180, 30, 30, 0.90);
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
          box-shadow: 0 2px 8px rgba(180,30,30,0.3);
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
          background: rgba(0,130,60,0.90);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(0,187,85,0.6);
          border-radius: 20px;
          padding: 3px 9px;
          box-shadow: 0 2px 8px rgba(0,130,60,0.25);
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
        ::-webkit-scrollbar-thumb { background: rgba(0,180,230,0.35); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,200,255,0.55); }
      `}</style>

      <div className="sky-root">

        {/* ===== PREMIUM HEADER — "REGISTRATURA ISH STOLI" + subtitle ===== */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 14px 7px',
          borderBottom: '1px solid rgba(255,255,255,0.30)',
          flexShrink: 0, position: 'relative', zIndex: 2,
          background: 'rgba(5, 28, 72, 0.42)',
          backdropFilter: 'blur(14px)',
        }}>
          {/* Left: Branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Hexagon logo */}
            <div style={{
              width: 42, height: 42,
              clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
              background: `linear-gradient(135deg, ${C.goldGlassMid}, ${C.cyanGlass})`,
              border: '2px solid rgba(255,255,255,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 16px rgba(212,160,48,0.45), 0 0 8px rgba(0,200,255,0.30)`,
            }}>
              <HeartOutlined style={{ color: C.goldBright, fontSize: 19 }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  color: '#ffffff', fontSize: 17, fontWeight: 900,
                  letterSpacing: '-0.3px', textShadow: '0 1px 4px rgba(0,0,0,0.25)',
                }}>
                  REGISTRATURA ISH STOLI
                </span>
                <span style={{
                  color: C.goldBright, fontSize: 9, fontWeight: 800,
                  background: C.goldGlassMid, border: '1.5px solid rgba(255,255,255,0.25)',
                  borderRadius: 6, padding: '2px 8px',
                  textShadow: '0 0 10px rgba(247,201,72,0.45)',
                  boxShadow: '0 0 10px rgba(212,160,48,0.20)',
                  letterSpacing: '0.5px',
                }}>
                  AMIS PREMIUM
                </span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 9.5, marginTop: 1, fontWeight: 500 }}>
                Smart Medical Registration Dashboard — {dateStr}
              </div>
            </div>
          </div>

          {/* Center: Live Clock */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              color: '#ffffff', fontSize: 26, fontWeight: 900,
              fontFamily: 'monospace', letterSpacing: '3px',
              textShadow: '0 0 22px rgba(0,200,255,0.65), 0 2px 4px rgba(0,0,0,0.20)',
            }}>
              {nowTimeStr}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.50)', fontSize: 7.5, textTransform: 'uppercase', letterSpacing: '2.5px', fontWeight: 700 }}>
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
                style={{ backgroundColor: '#cc2222', fontSize: 9, minWidth: 16, height: 16, lineHeight: 16 }}
                showZero
              />
            </div>
            <div className="online-status">
              <div className="online-dot" />
              <span style={{ color: '#ffffff', fontSize: 9, fontWeight: 800, letterSpacing: '0.5px' }}>ONLINE</span>
            </div>
          </div>
        </div>

        {/* ===== MAIN: LEFT CONTENT + RIGHT MODULES ===== */}
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

            {/* KPI ROW — 5 beveled futuristic cells with gold borders */}
            <div style={{ display: 'flex', gap: 6 }}>
              <div className="kpi-cell" style={{ '--kpi-c': C.cyanBright, flex: 1 } as any}>
                <CalendarOutlined className="kpi-icon" style={{ color: 'rgba(0,200,255,0.4)' }} />
                <div className="kpi-num" style={{ color: C.cyanBright }}>{stats.todayAppointments}</div>
                <div className="kpi-label">Bugungi qabullar</div>
              </div>
              <div className="kpi-cell" style={{ '--kpi-c': C.orangeBright, flex: 1 } as any}>
                <ClockCircleOutlined className="kpi-icon" style={{ color: 'rgba(255,127,32,0.4)' }} />
                <div className="kpi-num" style={{ color: C.orangeBright }}>{stats.waitingPatients}</div>
                <div className="kpi-label">Kutmoqda</div>
              </div>
              <div className="kpi-cell" style={{ '--kpi-c': C.redBright, flex: 1 } as any}>
                <ExclamationCircleOutlined className="kpi-icon" style={{ color: 'rgba(238,68,68,0.4)' }} />
                <div className="kpi-num" style={{ color: C.redBright }}>{stats.latePatients}</div>
                <div className="kpi-label">Kechikganlar</div>
              </div>
              <div className="kpi-cell" style={{ '--kpi-c': C.greenBright, flex: 1 } as any}>
                <CheckCircleOutlined className="kpi-icon" style={{ color: 'rgba(0,187,85,0.4)' }} />
                <div className="kpi-num" style={{ color: C.greenBright }}>{stats.completedToday}</div>
                <div className="kpi-label">Tugallangan</div>
              </div>
              <div className="kpi-cell" style={{ '--kpi-c': C.goldBright, flex: 1 } as any}>
                <MoneyCollectOutlined className="kpi-icon" style={{ color: 'rgba(247,201,72,0.4)' }} />
                <div className="kpi-num" style={{ color: C.goldBright }}>{stats.paymentWaiting}</div>
                <div className="kpi-label">To'lov kutayotgan</div>
              </div>
            </div>

            {/* Search + Quick Actions — pill style */}
            <div className="glass-panel" style={{ padding: '8px 11px' }}>
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
                <button className="sky-btn-primary" onClick={() => navigate('/patients/new')}>
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
                { icon: <CalendarOutlined />, label: 'Qabul', color: '#9966ff', bg: C.purpleGlass },
                { icon: <TeamOutlined />, label: 'Navbat', color: C.orangeBright, bg: C.orangeGlass },
                { icon: <MedicineBoxOutlined />, label: 'Qabul', color: C.cyanBright, bg: C.cyanGlass },
                { icon: <MoneyCollectOutlined />, label: "To'lov", color: C.greenBright, bg: C.greenGlass },
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 4 ? 1 : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div className="wf-dot" style={{ background: step.bg, color: step.color, boxShadow: `0 0 10px ${step.color}50` }}>
                      {step.icon}
                    </div>
                    <span style={{ fontSize: 7.5, color: step.color, fontWeight: 700, whiteSpace: 'nowrap', textShadow: '0 1px 3px rgba(0,0,0,0.15)', letterSpacing: '0.3px' }}>
                      {step.label}
                    </span>
                  </div>
                  {i < 4 && <div className="wf-line" />}
                </div>
              ))}
            </div>

            {/* ===== MAIN CONTENT BLOCKS ===== */}
            <div style={{ display: 'flex', gap: 7, flex: 1, minHeight: 0, overflow: 'hidden' }}>

              {/* Bugungi Qabullar — wider */}
              <div className="glass-panel" style={{ flex: 2.2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
                      textAlign: 'center', padding: 20, color: C.textMuted,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    }}>
                      <CalendarOutlined style={{ fontSize: 24, opacity: 0.30 }} />
                      <div style={{ fontSize: 11, fontWeight: 600 }}>Bugungi qabullar yo'q</div>
                      <div style={{ fontSize: 9, opacity: 0.55 }}>Yangi qabul yaratish uchun "Qabul" tugmasini bosing</div>
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

              {/* Right side: Queue + Payment */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>

                {/* Jonli Navbat */}
                <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
                        <TeamOutlined style={{ fontSize: 18, opacity: 0.30 }} />
                        <div style={{ fontSize: 10, fontWeight: 600 }}>Navbatda yo'q</div>
                        <div style={{ fontSize: 8, opacity: 0.50 }}>Bemorlarni navbatga qo'shing</div>
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

                {/* To'lov preview */}
                <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
                        <MoneyCollectOutlined style={{ fontSize: 18, opacity: 0.30 }} />
                        <div style={{ fontSize: 10, fontWeight: 600 }}>To'lov kutayotganlar yo'q</div>
                        <div style={{ fontSize: 8, opacity: 0.50 }}>Barcha to'lovlar bajarilgan</div>
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
                              <div style={{ color: C.goldLight, fontSize: 9, fontFamily: 'monospace', opacity: 0.9 }}>
                                {item.patient.med_id}
                              </div>
                            )}
                          </div>
                          <div style={{ color: C.greenBright, fontSize: 11, fontWeight: 800, textShadow: '0 0 6px rgba(0,187,85,0.30)' }}>
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

          {/* ===== RIGHT PANEL: 6 Hexagon Module Buttons (01-06) ===== */}
          <div style={{
            width: 182, flexShrink: 0, display: 'flex',
            flexDirection: 'column', gap: 5,
          }}>
            {/* Module header */}
            <div style={{
              color: C.textCyan, fontSize: 7.5, fontWeight: 800,
              letterSpacing: '2.8px', textTransform: 'uppercase',
              padding: '0 3px 4px',
              display: 'flex', alignItems: 'center', gap: 6,
              textShadow: '0 0 10px rgba(0,200,255,0.40)',
            }}>
              <DesktopOutlined style={{ fontSize: 11 }} />
              Modullar
            </div>

            {MODULES.map((mod, i) => (
              <div
                key={mod.key}
                className="hex-cell"
                style={{
                  animationDelay: `${i * 65}ms`,
                  '--hex-c': mod.color,
                  '--hex-bg': mod.bg,
                  '--hex-bc': mod.color,
                  '--hex-glow': `${mod.color}50`,
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
                  style={{ background: mod.bg, borderColor: `${mod.color}70`, color: mod.color }}
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
              padding: '7px 11px',
              background: C.cyanGlass,
              border: `1.5px solid rgba(0,180,230,0.45)`,
              borderRadius: 12,
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: `0 0 12px rgba(0,180,230,0.15)`,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: C.cyan, color: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, flexShrink: 0,
              }}>
                <UserOutlined style={{ fontSize: 14 }} />
              </div>
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
          color: 'rgba(255,255,255,0.40)', fontSize: 8.5,
          flexShrink: 0, position: 'relative', zIndex: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          borderTop: '1px solid rgba(255,255,255,0.12)',
          letterSpacing: '0.5px',
        }}>
          <HeartOutlined style={{ color: C.gold, fontSize: 9 }} />
          <span>AMIS — Asalari Tibbiy Axborot Tizimi</span>
          <span style={{ color: C.cyanBright, opacity: 0.50 }}>v2.0</span>
        </div>
      </div>
    </>
  )
}
