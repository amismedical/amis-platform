import { useQuery } from '@tanstack/react-query'
import { Table, Tag, Spin } from 'antd'
import { analyticsService } from '../services/api'
import { i18n, formatFullDate, statusTranslations } from '../i18n/uz'

// Premium Color System - Command Center Theme
const colors = {
  darkBg: '#050a12',
  navy: '#081423',
  navyLight: '#0d1f35',
  teal: '#00d4aa',
  tealDark: '#00b894',
  cyan: '#0891b2',
  purple: '#8b5cf6',
  amber: '#f59e0b',
  rose: '#f43f5e',
  white: '#ffffff',
  glassWhite: 'rgba(255, 255, 255, 0.06)',
  glassBorder: 'rgba(0, 212, 170, 0.15)',
  glassHover: 'rgba(0, 212, 170, 0.12)',
  textPrimary: 'rgba(255, 255, 255, 0.95)',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  textMuted: 'rgba(255, 255, 255, 0.4)',
}

// Glass Panel Component
const GlassPanel = ({ children, style = {}, glow = false }: any) => (
  <div style={{
    background: colors.glassWhite,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${colors.glassBorder}`,
    borderRadius: '16px',
    boxShadow: glow
      ? '0 0 40px rgba(0, 212, 170, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
      : '0 8px 32px rgba(0, 0, 0, 0.4)',
    ...style,
  }}>
    {children}
  </div>
)

// Animated Counter Component
const AnimatedCounter = ({ value, prefix = '', suffix = '' }: any) => {
  // Safely convert value to number and format - avoids Symbol conversion errors
  const numValue = typeof value === 'number' ? value : parseInt(String(value)) || 0
  const formatted = numValue.toLocaleString('en-US')
  return (
    <span style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontVariantNumeric: 'tabular-nums',
    }}>
      {prefix}{formatted}{suffix}
    </span>
  )
}

export function DashboardPage() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsService.dashboard(),
  })

  if (isLoading) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '120px 20px',
        background: `linear-gradient(135deg, ${colors.darkBg} 0%, ${colors.navy} 100%)`,
        minHeight: '100vh',
      }}>
        <div style={{ animation: 'pulse 2s ease-in-out infinite' }}>
          <Spin size="large" />
        </div>
      </div>
    )
  }

  // Uzbek demo data
  const recentAppointments = [
    { key: '1', time: '09:00', patient: 'Rahimov Alisher Hasanovich', service: 'Terapevt maslahati', doctor: 'Karimova Nodira', status: 'completed' },
    { key: '2', time: '09:30', patient: 'Tursunova Dilshoda Obidjon', service: 'Qorin bo\'shlig\'i UTT', doctor: 'Ahmedov Botir', status: 'in_progress' },
    { key: '3', time: '10:00', patient: 'Abdullayev Jasur Alisherovich', service: 'Qon tahlili', doctor: 'Mahmudova Gulshan', status: 'waiting' },
    { key: '4', time: '10:30', patient: 'Nazarova Sevara Bahodir qizi', service: 'Qayta maslahat', doctor: 'Karimova Nodira', status: 'scheduled' },
    { key: '5', time: '11:00', patient: 'Saidov BEkmurod Toshkentovich', service: 'UZI', doctor: 'Rasulov Sardor', status: 'waiting' },
  ]

  // Live Queue Data
  const queueData = [
    { id: 1, number: 12, name: 'Karimova M.', service: 'Terapevt', cabinet: '201', status: 'waiting' },
    { id: 2, number: 13, name: 'Saidov A.', service: 'Kardiolog', cabinet: '305', status: 'called' },
    { id: 3, number: 14, name: 'Tursunova D.', service: 'Nevrolog', cabinet: '412', status: 'waiting' },
  ]

  // AI Activity Data
  const aiActivity = [
    { type: 'Scribe', count: 24, status: 'active', icon: '⏣' },
    { type: 'Xulosa', count: 18, status: 'active', icon: '⏢' },
    { type: 'Tavsiyalar', count: 42, status: 'active', icon: '⏥' },
    { type: 'Risk Detection', count: 3, status: 'alert', icon: '⚠' },
  ]

  // Critical Alerts
  const alerts = [
    { id: 1, type: 'emergency', message: 'Jiddiy holat - Tez yordam chaqirildi', time: '2 daqiqa oldin', priority: 'high' },
    { id: 2, type: 'lab', message: 'Natija tayyor - Qon tahlili #4521', time: '5 daqiqa oldin', priority: 'normal' },
    { id: 3, type: 'queue', message: 'Navbatda 3 nafar kutmoqda', time: 'Hozir', priority: 'low' },
  ]

  const statusColors: Record<string, string> = {
    completed: 'success',
    in_progress: 'processing',
    waiting: 'warning',
    scheduled: 'default',
    cancelled: 'error',
    called: 'processing',
  }

  const columns = [
    { title: 'Vaqt', dataIndex: 'time', key: 'time', width: 70, render: (t: string) => <span style={{ color: colors.teal, fontWeight: 600 }}>{t}</span> },
    { title: 'Bemor', dataIndex: 'patient', key: 'patient', render: (t: string) => <span style={{ color: colors.textPrimary }}>{t}</span> },
    { title: 'Xizmat', dataIndex: 'service', key: 'service', render: (t: string) => <span style={{ color: colors.textSecondary }}>{t}</span> },
    { title: 'Shifokor', dataIndex: 'doctor', key: 'doctor', render: (t: string) => <span style={{ color: colors.textMuted }}>{t}</span> },
    { title: 'Holat', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={statusColors[s]}>{statusTranslations[s]}</Tag> },
  ]

  return (
    <div style={{
      background: `linear-gradient(180deg, ${colors.darkBg} 0%, ${colors.navy} 100%)`,
      minHeight: '100vh',
      padding: '0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Premium CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.98); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(0, 212, 170, 0.3); }
          50% { box-shadow: 0 0 40px rgba(0, 212, 170, 0.5); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .animate-in { animation: slideUp 0.6s ease-out forwards; }
        .glow-effect { animation: glow 3s ease-in-out infinite; }
      `}</style>

      {/* HERO SECTION - Full Width Cinematic */}
      <div style={{
        position: 'relative',
        height: '500px',
        overflow: 'hidden',
        marginBottom: '24px',
      }}>
        {/* Video Background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
          }}
        >
          <source src="/videos/amis-hero.mp4" type="video/mp4" />
        </video>

        {/* Cinematic Gradient Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `
            linear-gradient(180deg,
              rgba(5, 10, 18, 0.9) 0%,
              rgba(8, 20, 35, 0.7) 30%,
              rgba(0, 212, 170, 0.1) 100%
            ),
            radial-gradient(ellipse at 30% 50%, rgba(0, 212, 170, 0.15) 0%, transparent 60%)
          `,
          zIndex: 1,
        }} />

        {/* Hero Content */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '0 40px',
        }}>
          {/* Premium Branding Badge */}
          <div className="glow-effect" style={{
            background: 'rgba(0, 212, 170, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 212, 170, 0.3)',
            borderRadius: '50px',
            padding: '10px 30px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <img src="/amis-logo.svg" alt="AMIS Logo" style={{ width: '45px', height: '45px' }} />
            <span style={{ color: colors.teal, fontWeight: 600, letterSpacing: '3px', fontSize: '14px' }}>
              AMIS
            </span>
          </div>

          {/* Main Title */}
          <h1 style={{
            color: colors.white,
            fontSize: '56px',
            fontWeight: 800,
            margin: 0,
            letterSpacing: '-1px',
            textShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
            lineHeight: 1.1,
          }}>
            TIBBIYOTNING
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #00d4aa 0%, #0891b2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              KELAJAGI
            </span>
          </h1>

          <p style={{
            color: colors.textSecondary,
            fontSize: '18px',
            marginTop: '16px',
            maxWidth: '500px',
          }}>
            Zamonaviy AI texnologiyalari bilan jihozlangan tibbiyot boshqaruv tizimi
          </p>

          {/* Live Stats Panels */}
          <div style={{
            display: 'flex',
            gap: '16px',
            marginTop: '40px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            {[
              { label: 'Bugungi qabullar', value: dashboard?.total_appointments || 0, color: colors.teal },
              { label: 'Faol navbat', value: dashboard?.waiting_patients || 0, color: colors.amber },
              { label: 'Jami bemorlar', value: dashboard?.new_patients || 0, color: colors.purple },
              { label: 'Tushum', value: dashboard?.total_revenue || 0, color: colors.cyan, prefix: 'UZS ' },
            ].map((stat, i) => (
              <GlassPanel key={i} style={{
                padding: '20px 32px',
                minWidth: '160px',
                animationDelay: `${i * 0.1}s`,
              }}>
                <div style={{
                  fontSize: '36px',
                  fontWeight: 700,
                  color: stat.color,
                  lineHeight: 1,
                }}>
                  <AnimatedCounter value={stat.value} prefix={stat.prefix || ''} />
                </div>
                <div style={{
                  fontSize: '12px',
                  color: colors.textMuted,
                  marginTop: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}>
                  {stat.label}
                </div>
              </GlassPanel>
            ))}
          </div>

          {/* Date Badge */}
          <div style={{
            marginTop: '32px',
            padding: '8px 20px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.1)',
            color: colors.textSecondary,
            fontSize: '13px',
          }}>
            {formatFullDate(new Date())} • Toshkent vaqti
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ padding: '0 24px 40px' }}>

        {/* COMMAND CENTER SECTION */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
          }}>
            <div style={{
              width: '4px',
              height: '24px',
              background: 'linear-gradient(180deg, #00d4aa 0%, #0891b2 100%)',
              borderRadius: '2px',
            }} />
            <h2 style={{
              color: colors.textPrimary,
              fontSize: '20px',
              fontWeight: 600,
              margin: 0,
              letterSpacing: '1px',
            }}>
              REALTIME MONITORING
            </h2>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: colors.teal,
              boxShadow: '0 0 10px rgba(0, 212, 170, 0.5)',
              animation: 'blink 2s infinite',
            }} />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
          }}>
            {/* Live Queue Card */}
            <GlassPanel style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: `1px solid ${colors.glassBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>○</span>
                  <span style={{ color: colors.textPrimary, fontWeight: 600 }}>Jonli navbat</span>
                </div>
                <span style={{
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: colors.amber,
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}>
                  {queueData.filter(q => q.status === 'waiting').length} kutyapti
                </span>
              </div>
              <div style={{ padding: '12px' }}>
                {queueData.map((q) => (
                  <div key={q.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: q.status === 'called' ? 'rgba(0, 212, 170, 0.1)' : 'transparent',
                    marginBottom: '4px',
                    transition: 'all 0.2s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: q.status === 'called' ? colors.teal : 'rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.darkBg,
                        fontWeight: 700,
                        fontSize: '14px',
                      }}>
                        {q.number}
                      </div>
                      <div>
                        <div style={{ color: colors.textPrimary, fontSize: '13px', fontWeight: 500 }}>{q.name}</div>
                        <div style={{ color: colors.textMuted, fontSize: '11px' }}>{q.service} • {q.cabinet}</div>
                      </div>
                    </div>
                    <Tag color={q.status === 'called' ? 'processing' : 'warning'} style={{ margin: 0 }}>
                      {q.status === 'called' ? 'Chaqlryapti' : 'Kutyapti'}
                    </Tag>
                  </div>
                ))}
              </div>
            </GlassPanel>

            {/* Critical Alerts Card */}
            <GlassPanel style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: `1px solid ${colors.glassBorder}`,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <span style={{ fontSize: '20px' }}>⚠</span>
                <span style={{ color: colors.textPrimary, fontWeight: 600 }}>Kritik ogohlantirishlar</span>
              </div>
              <div style={{ padding: '12px' }}>
                {alerts.map((alert) => (
                  <div key={alert.id} style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: alert.priority === 'high' ? 'rgba(244, 63, 94, 0.1)' : 'transparent',
                    border: alert.priority === 'high' ? '1px solid rgba(244, 63, 94, 0.3)' : 'none',
                    marginBottom: '8px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {alert.priority === 'high' && (
                        <span style={{ color: colors.rose }}>●</span>
                      )}
                      <span style={{ color: colors.textPrimary, fontSize: '13px' }}>{alert.message}</span>
                    </div>
                    <span style={{ color: colors.textMuted, fontSize: '11px', marginLeft: '16px' }}>{alert.time}</span>
                  </div>
                ))}
              </div>
            </GlassPanel>

            {/* Lab Status Card */}
            <GlassPanel style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: `1px solid ${colors.glassBorder}`,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <span style={{ fontSize: '20px' }}>◎</span>
                <span style={{ color: colors.textPrimary, fontWeight: 600 }}>Laboratoriya holati</span>
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { label: 'Kutilayotgan', value: 12, color: colors.amber },
                    { label: 'Bajarilmoqda', value: 5, color: colors.cyan },
                    { label: 'Tayyor', value: 28, color: colors.teal },
                    { label: 'Shoshilinch', value: 2, color: colors.rose },
                  ].map((item, i) => (
                    <div key={i} style={{
                      padding: '12px',
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: '10px',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: item.color }}>{item.value}</div>
                      <div style={{ fontSize: '10px', color: colors.textMuted, marginTop: '4px', textTransform: 'uppercase' }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </GlassPanel>
          </div>
        </div>

        {/* KPI SECTION */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
          }}>
            <div style={{
              width: '4px',
              height: '24px',
              background: 'linear-gradient(180deg, #8b5cf6 0%, #6366f1 100%)',
              borderRadius: '2px',
            }} />
            <h2 style={{
              color: colors.textPrimary,
              fontSize: '20px',
              fontWeight: 600,
              margin: 0,
              letterSpacing: '1px',
            }}>
              KUNIKU YAKUNIY KO'RSATKICHLAR
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
          }}>
            {[
              { label: 'Jami qabullar', value: dashboard?.total_appointments || 0, icon: '◆', color: colors.teal, change: '+12%' },
              { label: 'Tugallangan', value: dashboard?.completed_appointments || 0, icon: '✓', color: colors.teal, change: '+8%' },
              { label: 'Bekor qilingan', value: dashboard?.cancelled_appointments || 0, icon: '✕', color: colors.rose, change: '-3%' },
              { label: 'Tushum', value: dashboard?.total_revenue || 0, icon: '$', color: colors.amber, change: '+15%', prefix: 'UZS ' },
            ].map((stat, i) => (
              <GlassPanel key={i} glow={i === 0} style={{
                padding: '24px',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Glow effect on top */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: `linear-gradient(90deg, ${stat.color}, transparent)`,
                }} />
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: `${stat.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    color: stat.color,
                  }}>
                    {stat.icon}
                  </div>
                  <span style={{
                    padding: '4px 8px',
                    background: stat.change.startsWith('+') ? 'rgba(34, 197, 94, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                    color: stat.change.startsWith('+') ? '#22c55e' : colors.rose,
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}>
                    {stat.change}
                  </span>
                </div>
                <div style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: colors.textPrimary,
                  lineHeight: 1,
                  marginBottom: '8px',
                }}>
                  <AnimatedCounter value={stat.value} prefix={stat.prefix || ''} />
                </div>
                <div style={{
                  fontSize: '13px',
                  color: colors.textSecondary,
                  fontWeight: 500,
                }}>
                  {stat.label}
                </div>
              </GlassPanel>
            ))}
          </div>
        </div>

        {/* AI SECTION */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
          }}>
            <div style={{
              width: '4px',
              height: '24px',
              background: 'linear-gradient(180deg, #f59e0b 0%, #f97316 100%)',
              borderRadius: '2px',
            }} />
            <h2 style={{
              color: colors.textPrimary,
              fontSize: '20px',
              fontWeight: 600,
              margin: 0,
              letterSpacing: '1px',
            }}>
              AI TIZIMLAR MARKAZI
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
          }}>
            {aiActivity.map((ai, i) => (
              <GlassPanel key={i} style={{
                padding: '20px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Animated background glow */}
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: `radial-gradient(circle, ${ai.status === 'alert' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)'} 0%, transparent 60%)`,
                  animation: 'pulse 4s ease-in-out infinite',
                }} />
                <div style={{
                  fontSize: '36px',
                  marginBottom: '12px',
                  filter: ai.status === 'alert' ? 'hue-rotate(300deg)' : 'none',
                }}>
                  {ai.icon}
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: colors.textPrimary,
                  marginBottom: '8px',
                }}>
                  {ai.count}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: colors.textMuted,
                  marginBottom: '8px',
                }}>
                  {ai.type}
                </div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  background: ai.status === 'alert' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(0, 212, 170, 0.2)',
                  borderRadius: '12px',
                  fontSize: '10px',
                  color: ai.status === 'alert' ? colors.rose : colors.teal,
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: ai.status === 'alert' ? colors.rose : colors.teal,
                    animation: 'blink 1s infinite',
                  }} />
                  {ai.status === 'alert' ? 'Ogohlantirish' : 'Faol'}
                </div>
              </GlassPanel>
            ))}
          </div>
        </div>

        {/* APPOINTMENTS TABLE */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
          }}>
            <div style={{
              width: '4px',
              height: '24px',
              background: 'linear-gradient(180deg, #0891b2 0%, #06b6d4 100%)',
              borderRadius: '2px',
            }} />
            <h2 style={{
              color: colors.textPrimary,
              fontSize: '20px',
              fontWeight: 600,
              margin: 0,
              letterSpacing: '1px',
            }}>
              SO'NGGI QABULLAR
            </h2>
          </div>

          <GlassPanel style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${colors.glassBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ color: colors.textPrimary, fontWeight: 600 }}>Bugungi qabul ro'yxati</span>
              <span style={{
                background: 'rgba(0, 212, 170, 0.15)',
                color: colors.teal,
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600,
              }}>
                {recentAppointments.length} ta
              </span>
            </div>
            <div style={{ padding: '16px' }}>
              <Table
                columns={columns}
                dataSource={recentAppointments}
                pagination={false}
                rowKey="key"
                size="small"
                style={{ background: 'transparent' }}
              />
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  )
}
