/**
 * AMIS - Registratura Ish Stoli
 * Reference-accurate Premium Sky-Blue Future Medical Dashboard
 * Full-screen, no sidebar, beveled/hexagon cards, floating glass panels
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Tag, Badge } from 'antd'
import {
  UserAddOutlined, CalendarOutlined, TeamOutlined,
  ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  MoneyCollectOutlined, HistoryOutlined, ArrowRightOutlined,
  UserOutlined, MedicineBoxOutlined, DesktopOutlined,
  RightOutlined, HeartOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { appointmentService, queueService, cashierService, patientService } from '../services/api'
import { statusTranslations } from '../i18n/uz'

dayjs.extend(utc)
dayjs.extend(timezone)

// ===== REFERENCE-EXACT CSS VALUES =====

// KPI beveled card clip-path
const KPI_CLIP = 'polygon(8% 0, 92% 0, 100% 28%, 100% 72%, 92% 100%, 8% 100%, 0 72%, 0 28%)'

// Hexagon module button clip-path
const HEX_CLIP = 'polygon(18% 0, 82% 0, 100% 50%, 82% 100%, 18% 100%, 0 50%)'

// Honeycomb SVG
const HONEYCOMB_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34L28 66zm0-48L6.5 30.3 6.5 69.7 28 84l21.5-14.3V30.3L28 18z' fill='rgba(255,255,255,0.08)' fill-rule='evenodd'/%3E%3C/svg%3E")`

const MODULES = [
  { key: 'patient-register', title: "Bemor ro'yxatga olish", icon: <UserAddOutlined />, color: '#f7c948', bg: 'rgba(212,160,48,0.20)', route: '/patients/new', num: '01' },
  { key: 'patient-360', title: 'Patient 360', icon: <UserOutlined />, color: '#00ccff', bg: 'rgba(0,200,255,0.15)', route: '/patients', num: '02' },
  { key: 'appointments', title: 'Qabullar', icon: <CalendarOutlined />, color: '#9966ff', bg: 'rgba(153,102,255,0.15)', route: '/appointments', num: '03' },
  { key: 'queue', title: 'Elektron navbat', icon: <TeamOutlined />, color: '#ff7f20', bg: 'rgba(255,127,32,0.15)', route: '/queue', num: '04' },
  { key: 'queue-display', title: 'Navbat displeyi', icon: <DesktopOutlined />, color: '#00bb55', bg: 'rgba(0,187,85,0.15)', route: '/queue-display', num: '05' },
  { key: 'history', title: "Qabullar tarixi", icon: <HistoryOutlined />, color: '#448aff', bg: 'rgba(68,138,255,0.15)', route: '/registration-history', num: '06' },
]

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#448aff', confirmed: '#40c4ff', checked_in: '#00bcd4',
  waiting: '#ff8f00', called: '#ffa726', in_progress: '#f0c040',
  completed: '#00bb55', cancelled: '#ee4444',
  open: '#ff8f00', partially_paid: '#f0c040', paid: '#00bb55',
}

interface KPIStats {
  todayAppointments: number
  waitingPatients: number
  latePatients: number
  completedToday: number
  paymentWaiting: number
  registeredToday: number
}

export function RegistraturaDashboard() {
  const navigate = useNavigate()
  const [searchVal, setSearchVal] = useState('')

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
    .slice(0, 5)

  const queueEntries = (allQueueEntries?.data || [])
    .filter((e: any) => e.status === 'waiting')
    .slice(0, 4)

  // ===== TABLE COLUMNS =====
  const apptColumns = [
    {
      title: 'VAQT',
      dataIndex: 'start_time',
      key: 'start_time',
      width: 52,
      render: (t: string) => (
        <span style={{
          color: '#00ccff', fontWeight: 800,
          fontFamily: 'monospace', fontSize: 13,
          textShadow: '0 0 8px rgba(0,204,255,0.5)',
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
            <div style={{ color: '#ffffff', fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>
              {name || '-'}
            </div>
            {p?.med_id && (
              <div style={{ color: '#ffd76a', fontSize: 9, fontFamily: 'monospace', opacity: 0.9 }}>
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
      width: 100,
      render: (_: any, r: any) => {
        const d = r.doctor
        if (!d) return <span style={{ color: 'rgba(255,255,255,0.5)' }}>-</span>
        return (
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
            {`${d.last_name || ''} ${d.first_name || ''}`.trim() || '-'}
          </span>
        )
      },
    },
    {
      title: 'XIZMAT',
      key: 'service',
      width: 110,
      render: (_: any, r: any) => (
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
          {r.service?.name || '-'}
        </span>
      ),
    },
    {
      title: 'HOLAT',
      dataIndex: 'status',
      key: 'status',
      width: 90,
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

  const queueColumns = [
    {
      title: '#',
      dataIndex: 'queue_number',
      key: 'queue_number',
      width: 32,
      render: (n: number | string) => (
        <span style={{
          color: '#f7c948', fontWeight: 900, fontSize: 15,
          fontFamily: 'monospace', textShadow: '0 0 8px rgba(247,201,72,0.5)',
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
            <div style={{ color: '#ffffff', fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>
              {name || '-'}
            </div>
            {p?.med_id && (
              <div style={{ color: '#ffd76a', fontSize: 9, fontFamily: 'monospace', opacity: 0.9 }}>
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
      width: 40,
      render: (r: string) => (
        <span style={{ color: '#00ccff', fontSize: 12, fontWeight: 700, textShadow: '0 0 6px rgba(0,204,255,0.3)' }}>
          {r || '-'}
        </span>
      ),
    },
    {
      title: 'HOLAT',
      dataIndex: 'status',
      key: 'status',
      width: 68,
      render: (s: string) => (
        <Tag color={STATUS_COLORS[s] || 'default'} style={{ fontSize: 10, padding: '0 5px', margin: 0, borderRadius: 12 }}>
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
          from { opacity: 0; transform: translateX(15px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.80); }
        }

        /* Root — FULL SCREEN, NO SCROLL */
        .sky-root {
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          /* Sky gradient per spec */
          background: linear-gradient(180deg,
            #56bfff 0%,
            #8bdcff 45%,
            #dff7ff 100%);
          position: relative;
        }

        /* Cloud effects — layered radial gradients */
        .sky-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            /* Bottom left cloud */
            radial-gradient(ellipse 70% 50% at 5% 95%, rgba(255,255,255,0.65) 0%, transparent 60%),
            /* Bottom right cloud */
            radial-gradient(ellipse 60% 45% at 95% 92%, rgba(255,255,255,0.55) 0%, transparent 58%),
            /* Top center soft glow */
            radial-gradient(ellipse 50% 30% at 50% 0%, rgba(255,255,255,0.35) 0%, transparent 55%),
            /* Bottom center cloud */
            radial-gradient(ellipse 80% 40% at 50% 100%, rgba(220,245,255,0.50) 0%, transparent 65%),
            /* Left side glow */
            radial-gradient(ellipse 40% 60% at 0% 50%, rgba(86,191,255,0.25) 0%, transparent 60%);
          pointer-events: none;
          z-index: 0;
        }

        /* Honeycomb pattern */
        .sky-root::after {
          content: '';
          position: fixed;
          inset: 0;
          background-image: ${HONEYCOMB_SVG};
          opacity: 0.35;
          pointer-events: none;
          z-index: 0;
        }

        /* Glass Panel — floating glass per spec */
        .glass-panel {
          background: rgba(8, 65, 120, 0.68) !important;
          backdrop-filter: blur(18px) saturate(1.3) !important;
          -webkit-backdrop-filter: blur(18px) saturate(1.3) !important;
          border: 1.5px solid rgba(0, 212, 255, 0.55) !important;
          border-radius: 18px !important;
          box-shadow:
            0 18px 45px rgba(0, 90, 180, 0.28),
            0 0 24px rgba(0, 212, 255, 0.18) !important;
          transition: all 0.22s ease !important;
          animation: fadeInUp 0.4s ease both !important;
          position: relative !important;
          overflow: hidden !important;
        }
        /* Gold top accent line */
        .glass-panel::before {
          content: '';
          position: absolute;
          top: 0; left: 10%; right: 10%;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(247,201,72,0.85), transparent);
        }
        .glass-panel:hover {
          background: rgba(10, 75, 140, 0.75) !important;
          border-color: rgba(0, 212, 255, 0.80) !important;
          box-shadow:
            0 22px 50px rgba(0, 100, 200, 0.32),
            0 0 30px rgba(0, 212, 255, 0.25) !important;
          transform: translateY(-2px);
        }

        /* KPI Beveled Card — SPEC: clip-path polygon */
        .kpi-cell {
          background: rgba(9, 75, 140, 0.70) !important;
          border: 2px solid rgba(0, 212, 255, 0.70) !important;
          border-radius: 0 !important;
          clip-path: ${KPI_CLIP} !important;
          padding: 10px 12px 8px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 1px !important;
          position: relative !important;
          overflow: hidden !important;
          box-shadow:
            0 12px 35px rgba(0, 90, 180, 0.32),
            0 0 18px rgba(0, 212, 255, 0.20),
            inset 0 0 20px rgba(0, 212, 255, 0.08) !important;
          transition: all 0.22s cubic-bezier(0.34, 1.4, 0.64, 1) !important;
          animation: fadeInUp 0.4s ease both !important;
          flex: 1 !important;
          min-width: 0 !important;
        }
        .kpi-cell:hover {
          background: rgba(15, 90, 160, 0.80) !important;
          border-color: rgba(247, 201, 72, 0.90) !important;
          box-shadow:
            0 18px 45px rgba(0, 100, 200, 0.38),
            0 0 28px rgba(247, 201, 72, 0.30),
            inset 0 0 25px rgba(247, 201, 72, 0.10) !important;
          transform: translateY(-4px) scale(1.02) !important;
        }
        .kpi-num {
          font-size: 30px;
          font-weight: 900;
          line-height: 1;
          font-family: 'SF Mono', 'Fira Code', monospace;
          letter-spacing: -2px;
          text-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .kpi-label {
          font-size: 7px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          font-weight: 700;
          color: rgba(255,255,255,0.65);
          line-height: 1.2;
        }
        .kpi-icon {
          position: absolute;
          top: 8px; right: 10px;
          opacity: 0.35;
          font-size: 14px;
        }

        /* Search Input — SPEC: large, pill, white glass */
        .sky-search {
          background: rgba(255, 255, 255, 0.92) !important;
          color: #0f172a !important;
          border: 2px solid rgba(0, 212, 255, 0.75) !important;
          border-radius: 18px !important;
          font-size: 13px !important;
          height: 52px !important;
          font-weight: 500 !important;
          box-shadow: 0 8px 22px rgba(0, 90, 180, 0.22), 0 0 0 0 rgba(0,212,255,0) !important;
          padding: 0 18px !important;
          transition: all 0.2s ease !important;
          width: 100% !important;
        }
        .sky-search::placeholder { color: #64748b !important; }
        .sky-search:focus {
          border-color: #ffd76a !important;
          box-shadow: 0 8px 25px rgba(0, 90, 180, 0.28), 0 0 0 4px rgba(255,215,106,0.15) !important;
          outline: none !important;
          background: #ffffff !important;
        }

        /* Primary Button — beveled/hex edge */
        .sky-btn-primary {
          background: linear-gradient(135deg, #00a8dd 0%, #00c8ff 100%) !important;
          border: 2px solid rgba(247, 201, 72, 0.80) !important;
          color: #ffffff !important;
          border-radius: 14px !important;
          clip-path: polygon(8% 0, 92% 0, 100% 30%, 100% 70%, 92% 100%, 8% 100%, 0 70%, 0 30%) !important;
          font-size: 12px !important;
          font-weight: 800 !important;
          height: 52px !important;
          padding: 0 16px !important;
          transition: all 0.18s ease !important;
          white-space: nowrap !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 6px !important;
          box-shadow: 0 6px 18px rgba(0, 160, 220, 0.40), 0 0 14px rgba(247,201,72,0.25) !important;
          letter-spacing: 0.3px;
          flex-shrink: 0 !important;
        }
        .sky-btn-primary:hover {
          background: linear-gradient(135deg, #00bbee 0%, #00ddff 100%) !important;
          box-shadow: 0 8px 25px rgba(0, 180, 255, 0.50), 0 0 22px rgba(247,201,72,0.35) !important;
          transform: translateY(-2px);
        }

        /* Secondary Button */
        .sky-btn {
          background: rgba(10, 65, 120, 0.65) !important;
          border: 1.5px solid rgba(0, 212, 255, 0.60) !important;
          color: #ffffff !important;
          border-radius: 14px !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          height: 52px !important;
          padding: 0 14px !important;
          transition: all 0.18s ease !important;
          white-space: nowrap !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 5px !important;
          box-shadow: 0 6px 16px rgba(0, 60, 140, 0.25) !important;
          flex-shrink: 0 !important;
        }
        .sky-btn:hover {
          background: rgba(15, 80, 145, 0.75) !important;
          border-color: rgba(0, 212, 255, 0.85) !important;
          color: #80e0ff !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(0, 100, 180, 0.35), 0 0 16px rgba(0,212,255,0.25) !important;
        }

        /* Section Title */
        .sky-section-title {
          color: #00ccff !important;
          font-size: 7.5px !important;
          font-weight: 800 !important;
          letter-spacing: 2.5px !important;
          text-transform: uppercase !important;
          text-shadow: 0 0 10px rgba(0,204,255,0.40) !important;
        }
        .sky-view-link {
          color: #ffd76a !important;
          font-size: 9px !important;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          text-shadow: 0 0 6px rgba(255,215,106,0.30);
          letter-spacing: 0.3px;
        }
        .sky-view-link:hover {
          opacity: 0.8;
          text-shadow: 0 0 12px rgba(255,215,106,0.55);
        }

        /* Hex Module Button — SPEC: hexagon clip-path */
        .hex-cell {
          background: rgba(8, 60, 115, 0.72) !important;
          border: 1.5px solid rgba(0, 212, 255, 0.55) !important;
          border-radius: 0 !important;
          clip-path: ${HEX_CLIP} !important;
          padding: 10px 12px !important;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.34, 1.5, 0.64, 1) !important;
          animation: slideInRight 0.4s ease both !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          box-shadow:
            0 10px 28px rgba(0, 80, 170, 0.28),
            0 0 18px rgba(0, 212, 255, 0.15) !important;
          position: relative !important;
          overflow: hidden !important;
          height: 72px !important;
        }
        .hex-cell::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 25% 50%, var(--hex-glow, rgba(0,200,255,0.10)) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .hex-cell:hover::before { opacity: 1; }
        .hex-cell:hover {
          background: rgba(12, 75, 140, 0.82) !important;
          border-color: var(--hex-bc, rgba(0,212,255,0.85)) !important;
          box-shadow:
            0 14px 36px rgba(0, 90, 190, 0.35),
            0 0 24px var(--hex-glow, rgba(0,200,255,0.30)) !important;
          transform: translateY(-4px) scale(1.02) !important;
        }
        .hex-num {
          font-size: 9px;
          font-weight: 900;
          color: var(--hex-c, #f7c948);
          opacity: 0.75;
          font-family: monospace;
          min-width: 20px;
          letter-spacing: 0.5px;
          text-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        .hex-icon-box {
          width: 32px; height: 32px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
          background: var(--hex-bg, rgba(0,200,255,0.15));
          border: 1.5px solid var(--hex-bc, rgba(0,200,255,0.60));
          color: var(--hex-c, #00ccff);
          opacity: 0.95;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 0 8px var(--hex-glow, rgba(0,200,255,0.15));
        }
        .hex-cell:hover .hex-icon-box {
          transform: scale(1.15) rotate(-5deg);
          box-shadow: 0 0 14px var(--hex-glow, rgba(0,200,255,0.30));
        }
        .hex-title {
          flex: 1;
          font-size: 10px;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.3;
          text-shadow: 0 1px 3px rgba(0,0,0,0.25);
        }
        .hex-arrow {
          color: #f7c948;
          font-size: 10px;
          flex-shrink: 0;
          opacity: 0.5;
          transition: all 0.18s ease;
        }
        .hex-cell:hover .hex-arrow {
          transform: translateX(4px);
          opacity: 1;
          color: #ffd76a;
        }

        /* Table */
        .sky-table .ant-table {
          background: transparent !important;
          font-size: 12px;
        }
        .sky-table .ant-table-thead > tr > th {
          background: rgba(0, 120, 200, 0.30) !important;
          color: #00ccff !important;
          border-bottom: 1px solid rgba(0, 212, 255, 0.20) !important;
          font-size: 7.5px !important;
          font-weight: 800 !important;
          letter-spacing: 1.8px !important;
          padding: 4px 8px !important;
          text-transform: uppercase;
          backdrop-filter: blur(4px);
        }
        .sky-table .ant-table-tbody > tr > td {
          background: rgba(255, 255, 255, 0.05) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
          padding: 4px 8px !important;
        }
        .sky-table .ant-table-tbody > tr:hover > td {
          background: rgba(0, 180, 240, 0.10) !important;
        }
        .sky-table .ant-table-wrapper .ant-table-pagination { display: none !important; }
        .sky-table .ant-empty-description { color: rgba(255,255,255,0.45) !important; }

        /* Workflow */
        .wf-dot {
          width: 28px; height: 28px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px;
          flex-shrink: 0;
          border: 1.5px solid currentColor;
          backdrop-filter: blur(4px);
          transition: all 0.15s ease;
        }
        .wf-dot:hover { transform: scale(1.15); box-shadow: 0 0 12px currentColor; }
        .wf-line {
          height: 2px; flex: 1;
          background: linear-gradient(90deg, rgba(0,180,240,0.45) 0%, rgba(255,255,255,0.08) 100%);
          margin: 0 2px; margin-top: -6px;
        }

        /* Live Badge */
        .live-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(180, 30, 30, 0.92);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,100,100,0.70);
          border-radius: 20px;
          padding: 3px 10px;
          font-size: 9px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 1px;
          text-transform: uppercase;
          animation: fadeInUp 0.5s ease;
          box-shadow: 0 2px 10px rgba(180,30,30,0.35);
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
          background: rgba(0,130,60,0.92);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0,187,85,0.65);
          border-radius: 20px;
          padding: 3px 10px;
          box-shadow: 0 2px 10px rgba(0,130,60,0.28);
        }
        .online-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #00bb55;
          animation: pulseDot 2s ease-in-out infinite;
          box-shadow: 0 0 6px #00bb55;
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,180,230,0.35); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,200,255,0.55); }
      `}</style>

      <div className="sky-root">

        {/* ===== HEADER — SPEC: Bold gold title, REGISTRATURA ISH STOLI ===== */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 16px 7px',
          borderBottom: '1px solid rgba(255,255,255,0.30)',
          flexShrink: 0, position: 'relative', zIndex: 2,
          background: 'rgba(5, 30, 75, 0.45)',
          backdropFilter: 'blur(16px)',
        }}>
          {/* Left: Branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Hexagon logo */}
            <div style={{
              width: 44, height: 44,
              clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
              background: 'linear-gradient(135deg, rgba(212,160,48,0.40), rgba(0,200,255,0.20))',
              border: '2px solid rgba(255,255,255,0.50)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 18px rgba(212,160,48,0.50), 0 0 10px rgba(0,200,255,0.35)',
            }}>
              <HeartOutlined style={{ color: '#ffd76a', fontSize: 20 }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* SPEC: Bold gold title */}
                <span style={{
                  color: '#ffd76a',
                  fontSize: 32, fontWeight: 800,
                  letterSpacing: '-0.5px',
                  textShadow: '0 2px 8px rgba(0,0,0,0.35)',
                }}>
                  REGISTRATURA ISH STOLI
                </span>
                <span style={{
                  color: '#ffd76a', fontSize: 9, fontWeight: 800,
                  background: 'rgba(212,160,48,0.30)',
                  border: '1.5px solid rgba(255,215,106,0.50)',
                  borderRadius: 6, padding: '2px 8px',
                  textShadow: '0 0 10px rgba(255,215,106,0.50)',
                  boxShadow: '0 0 10px rgba(212,160,48,0.20)',
                  letterSpacing: '0.5px',
                }}>
                  AMIS PREMIUM
                </span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.70)', fontSize: 9.5, marginTop: 1, fontWeight: 500 }}>
                Smart Medical Registration Dashboard — {dateStr}
              </div>
            </div>
          </div>

          {/* Center: Live Clock */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              color: '#ffffff', fontSize: 28, fontWeight: 900,
              fontFamily: 'monospace', letterSpacing: '3px',
              textShadow: '0 2px 10px rgba(0,200,255,0.70), 0 2px 4px rgba(0,0,0,0.25)',
            }}>
              {nowTimeStr}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 7, textTransform: 'uppercase', letterSpacing: '2.5px', fontWeight: 700 }}>
              Toshkent vaqti
            </div>
          </div>

          {/* Right: Status Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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

        {/* ===== MAIN: 3-COLUMN LAYOUT — SPEC: 78-82% main, 18-22% right ===== */}
        <div style={{
          display: 'flex', gap: 14, flex: 1, minHeight: 0,
          padding: '10px 14px 0',
          position: 'relative', zIndex: 2, overflow: 'hidden',
        }}>

          {/* ===== LEFT + CENTER MAIN CONTENT (80%) ===== */}
          <div style={{
            flex: '0 0 80%', display: 'flex', flexDirection: 'column',
            gap: 8, minWidth: 0, overflow: 'hidden',
          }}>

            {/* KPI ROW — 5 beveled hexagon cards */}
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <div className="kpi-cell" style={{ '--kpi-c': '#00ccff', '--kpi-glow': 'rgba(0,204,255,0.3)' } as any}>
                <CalendarOutlined className="kpi-icon" style={{ color: 'rgba(0,204,255,0.45)' }} />
                <div className="kpi-num" style={{ color: '#00ccff' }}>{stats.todayAppointments}</div>
                <div className="kpi-label">Bugungi qabullar</div>
              </div>
              <div className="kpi-cell" style={{ '--kpi-c': '#ff8f00', '--kpi-glow': 'rgba(255,143,0,0.3)' } as any}>
                <ClockCircleOutlined className="kpi-icon" style={{ color: 'rgba(255,143,0,0.45)' }} />
                <div className="kpi-num" style={{ color: '#ff8f00' }}>{stats.waitingPatients}</div>
                <div className="kpi-label">Kutmoqda</div>
              </div>
              <div className="kpi-cell" style={{ '--kpi-c': '#ee4444', '--kpi-glow': 'rgba(238,68,68,0.3)' } as any}>
                <ExclamationCircleOutlined className="kpi-icon" style={{ color: 'rgba(238,68,68,0.45)' }} />
                <div className="kpi-num" style={{ color: '#ee4444' }}>{stats.latePatients}</div>
                <div className="kpi-label">Kechikganlar</div>
              </div>
              <div className="kpi-cell" style={{ '--kpi-c': '#00bb55', '--kpi-glow': 'rgba(0,187,85,0.3)' } as any}>
                <CheckCircleOutlined className="kpi-icon" style={{ color: 'rgba(0,187,85,0.45)' }} />
                <div className="kpi-num" style={{ color: '#00bb55' }}>{stats.completedToday}</div>
                <div className="kpi-label">Tugallangan</div>
              </div>
              <div className="kpi-cell" style={{ '--kpi-c': '#f7c948', '--kpi-glow': 'rgba(247,201,72,0.3)' } as any}>
                <MoneyCollectOutlined className="kpi-icon" style={{ color: 'rgba(247,201,72,0.45)' }} />
                <div className="kpi-num" style={{ color: '#f7c948' }}>{stats.paymentWaiting}</div>
                <div className="kpi-label">To'lov kutayotgan</div>
              </div>
            </div>

            {/* Search + Quick Actions */}
            <div className="glass-panel" style={{ padding: '10px 14px', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                  className="sky-search"
                  placeholder="Bemor qidirish — MED-ID, FIO, telefon, passport..."
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
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 6px', flexShrink: 0 }}>
              {[
                { icon: <UserAddOutlined />, label: 'Bemor', color: '#f7c948', bg: 'rgba(212,160,48,0.18)' },
                { icon: <CalendarOutlined />, label: 'Qabul', color: '#9966ff', bg: 'rgba(153,102,255,0.15)' },
                { icon: <TeamOutlined />, label: 'Navbat', color: '#ff7f20', bg: 'rgba(255,127,32,0.15)' },
                { icon: <MedicineBoxOutlined />, label: 'Qabul', color: '#00ccff', bg: 'rgba(0,200,255,0.15)' },
                { icon: <MoneyCollectOutlined />, label: "To'lov", color: '#00bb55', bg: 'rgba(0,187,85,0.15)' },
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 4 ? 1 : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div className="wf-dot" style={{ background: step.bg, color: step.color, boxShadow: `0 0 10px ${step.color}50` }}>
                      {step.icon}
                    </div>
                    <span style={{ fontSize: 7.5, color: step.color, fontWeight: 700, whiteSpace: 'nowrap', textShadow: '0 1px 3px rgba(0,0,0,0.20)', letterSpacing: '0.3px' }}>
                      {step.label}
                    </span>
                  </div>
                  {i < 4 && <div className="wf-line" />}
                </div>
              ))}
            </div>

            {/* ===== CONTENT BLOCKS ===== */}
            <div style={{ display: 'flex', gap: 8, flex: 1, minHeight: 0, overflow: 'hidden' }}>

              {/* Bugungi Qabullar — larger panel */}
              <div className="glass-panel" style={{ flex: 2.3, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 12px', borderBottom: '1px solid rgba(0,212,255,0.15)', flexShrink: 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CalendarOutlined style={{ color: '#ffd76a', fontSize: 14 }} />
                    <span className="sky-section-title">Bugungi qabullar</span>
                    <Badge count={stats.todayAppointments} style={{ backgroundColor: '#d4af37', fontSize: 9, boxShadow: '0 0 6px rgba(212,160,48,0.4)' }} />
                  </div>
                  <span className="sky-view-link" onClick={() => navigate('/appointments')}>
                    Barchasi <ArrowRightOutlined style={{ fontSize: 9 }} />
                  </span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }} className="sky-table">
                  {displayAppts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 16, color: 'rgba(255,255,255,0.45)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <CalendarOutlined style={{ fontSize: 22, opacity: 0.30 }} />
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
                      scroll={{ y: 140 }}
                      onRow={(record) => ({
                        style: { cursor: record.patient_id ? 'pointer' : 'default' },
                        onClick: () => record.patient_id && navigate(`/patients/${record.patient_id}`),
                      })}
                    />
                  )}
                </div>
              </div>

              {/* Right stacked: Queue + Payment */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>

                {/* Jonli Navbat */}
                <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 12px', borderBottom: '1px solid rgba(0,212,255,0.15)', flexShrink: 0,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <TeamOutlined style={{ color: '#ff7f20', fontSize: 14 }} />
                      <span className="sky-section-title">Jonli navbat</span>
                      <Badge count={stats.waitingPatients} style={{ backgroundColor: '#e06b00', fontSize: 9, boxShadow: '0 0 6px rgba(224,107,0,0.4)' }} />
                    </div>
                    <span className="sky-view-link" onClick={() => navigate('/queue')}>
                      Boshqar <ArrowRightOutlined style={{ fontSize: 9 }} />
                    </span>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto' }} className="sky-table">
                    {queueEntries.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 10, color: 'rgba(255,255,255,0.45)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <TeamOutlined style={{ fontSize: 18, opacity: 0.28 }} />
                        <div style={{ fontSize: 10, fontWeight: 600 }}>Navbatda yo'q</div>
                      </div>
                    ) : (
                      <Table
                        columns={queueColumns}
                        dataSource={queueEntries}
                        rowKey="id"
                        size="small"
                        pagination={false}
                        style={{ background: 'transparent' }}
                        scroll={{ y: 100 }}
                        onRow={() => ({ style: { cursor: 'pointer' }, onClick: () => navigate('/queue') })}
                      />
                    )}
                  </div>
                </div>

                {/* To'lov */}
                <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 12px', borderBottom: '1px solid rgba(0,212,255,0.15)', flexShrink: 0,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <MoneyCollectOutlined style={{ color: '#00bb55', fontSize: 14 }} />
                      <span className="sky-section-title">To'lov</span>
                      <Badge count={stats.paymentWaiting} style={{ backgroundColor: '#009944', fontSize: 9, boxShadow: '0 0 6px rgba(0,153,68,0.4)' }} />
                    </div>
                    <span className="sky-view-link" onClick={() => navigate('/cashier')}>
                      Kassa <ArrowRightOutlined style={{ fontSize: 9 }} />
                    </span>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '2px 0' }}>
                    {(openInvoices?.data || []).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 10, color: 'rgba(255,255,255,0.45)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <MoneyCollectOutlined style={{ fontSize: 18, opacity: 0.28 }} />
                        <div style={{ fontSize: 10, fontWeight: 600 }}>To'lov kutayotganlar yo'q</div>
                      </div>
                    ) : (
                      (openInvoices?.data || []).slice(0, 3).map((item: any, idx: number) => (
                        <div
                          key={item.id || idx}
                          style={{
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '5px 10px',
                            borderBottom: '1px solid rgba(255,255,255,0.08)',
                            cursor: 'pointer',
                          }}
                          onClick={() => navigate('/cashier')}
                        >
                          <div>
                            <div style={{ color: '#ffffff', fontSize: 11, fontWeight: 600 }}>
                              {item.patient?.last_name || ''} {item.patient?.first_name || ''}
                            </div>
                            {item.patient?.med_id && (
                              <div style={{ color: '#ffd76a', fontSize: 9, fontFamily: 'monospace', opacity: 0.9 }}>
                                {item.patient.med_id}
                              </div>
                            )}
                          </div>
                          <div style={{ color: '#00bb55', fontSize: 11, fontWeight: 800, textShadow: '0 0 6px rgba(0,187,85,0.30)' }}>
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

          {/* ===== RIGHT MODULE PANEL (20%) — SPEC: hexagon buttons ===== */}
          <div style={{
            flex: '0 0 20%', minWidth: 180, maxWidth: 210, flexShrink: 0,
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            {/* Module header */}
            <div style={{
              color: '#00ccff', fontSize: 7.5, fontWeight: 800,
              letterSpacing: '2.8px', textTransform: 'uppercase',
              padding: '0 4px 4px',
              display: 'flex', alignItems: 'center', gap: 6,
              textShadow: '0 0 10px rgba(0,204,255,0.45)',
            }}>
              <DesktopOutlined style={{ fontSize: 11 }} />
              Modullar
            </div>

            {MODULES.map((mod, i) => (
              <div
                key={mod.key}
                className="hex-cell"
                style={{
                  animationDelay: `${i * 70}ms`,
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
              marginTop: 4,
              padding: '8px 12px',
              background: 'rgba(0,200,255,0.12)',
              border: '1.5px solid rgba(0,200,255,0.40)',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 0 12px rgba(0,200,255,0.12)',
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: '#00a8dd', color: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, flexShrink: 0,
              }}>
                <UserOutlined style={{ fontSize: 14 }} />
              </div>
              <div>
                <div style={{ color: '#ffffff', fontSize: 10, fontWeight: 700 }}>
                  Oxirgi tanlangan
                </div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 8 }}>
                  Bemor pasportini oching
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Minimal footer */}
        <div style={{
          textAlign: 'center', padding: '4px 0 6px',
          color: 'rgba(255,255,255,0.45)', fontSize: 8,
          flexShrink: 0, position: 'relative', zIndex: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          borderTop: '1px solid rgba(255,255,255,0.12)',
          letterSpacing: '0.5px',
        }}>
          <HeartOutlined style={{ color: '#f7c948', fontSize: 9 }} />
          <span>AMIS — Asalari Tibbiy Axborot Tizimi</span>
          <span style={{ color: '#00ccff', opacity: 0.50 }}>v2.0</span>
        </div>
      </div>
    </>
  )
}
