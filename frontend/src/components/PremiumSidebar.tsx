import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  TeamOutlined,
  CalendarOutlined,
  MedicineBoxOutlined,
  DollarOutlined,
  ExperimentOutlined,
  UserOutlined,
  FileTextOutlined,
  HistoryOutlined,
  AuditOutlined,
  SettingOutlined,
  BellOutlined,
  DatabaseOutlined,
  LockOutlined,
  ContainerOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  RobotOutlined,
  SafetyOutlined,
  SendOutlined,
  BankOutlined,
  BranchesOutlined,
  ScheduleOutlined,
  SnippetsOutlined,
  HeartOutlined,
  WarningOutlined,
  MessageOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DownOutlined,
  RightOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons'
import { Layout, Tooltip } from 'antd'
import { useAuth } from '../contexts/AuthContext'

const { Sider } = Layout

// Premium color palette - Compact Shield Theme
const COLORS = {
  sidebarBg: '#071827',
  sidebarBgLight: '#0a2134',
  // Active states
  activeBg: 'linear-gradient(145deg, #7A1020, rgba(122,16,32,0.7))',
  activeBorder: '#D4AF37',
  activeText: '#F5D76E',
  activeIcon: '#D4AF37',
  // Gold palette
  gold: '#D4AF37',
  softGold: '#F5D76E',
  // Cream text colors
  textPrimary: '#EADFA3',
  textSecondary: '#B8A96A',
  textMuted: '#8B7D4D',
  // Backgrounds and borders
  hoverBg: 'rgba(212,175,55,0.08)',
  border: 'rgba(212,175,55,0.12)',
  divider: 'rgba(212,175,55,0.06)',
  tileBg: 'rgba(255,255,255,0.02)',
  tileBorder: 'rgba(212,175,55,0.06)',
}

// Icon mapping
const iconMap: Record<string, React.ReactNode> = {
  DashboardOutlined: <DashboardOutlined />,
  TeamOutlined: <TeamOutlined />,
  CalendarOutlined: <CalendarOutlined />,
  MedicineBoxOutlined: <MedicineBoxOutlined />,
  DollarOutlined: <DollarOutlined />,
  ExperimentOutlined: <ExperimentOutlined />,
  UserOutlined: <UserOutlined />,
  FileTextOutlined: <FileTextOutlined />,
  HistoryOutlined: <HistoryOutlined />,
  AuditOutlined: <AuditOutlined />,
  SettingOutlined: <SettingOutlined />,
  BellOutlined: <BellOutlined />,
  DatabaseOutlined: <DatabaseOutlined />,
  LockOutlined: <LockOutlined />,
  ContainerOutlined: <ContainerOutlined />,
  ShoppingOutlined: <ShoppingOutlined />,
  AppstoreOutlined: <AppstoreOutlined />,
  RobotOutlined: <RobotOutlined />,
  SafetyOutlined: <SafetyOutlined />,
  SendOutlined: <SendOutlined />,
  BankOutlined: <BankOutlined />,
  BranchesOutlined: <BranchesOutlined />,
  ScheduleOutlined: <ScheduleOutlined />,
  SnippetsOutlined: <SnippetsOutlined />,
  HeartOutlined: <HeartOutlined />,
  WarningOutlined: <WarningOutlined />,
  MessageOutlined: <MessageOutlined />,
  BackupOutlined: <CloudUploadOutlined />,
}

interface MenuItem {
  key: string
  label: string
  icon?: string
  // Precise route matching - exact paths this item responds to
  matchRoutes?: string[] // Array of exact paths (not patterns)
}

interface MenuGroup {
  title: string
  items: MenuItem[]
}

const menuGroups: MenuGroup[] = [
  {
    title: 'ASOSIY',
    items: [
      { key: '/', label: 'Bosh sahifa', icon: 'DashboardOutlined', matchRoutes: ['/'] },
    ],
  },
  {
    title: 'REGISTRATURA',
    items: [
      { key: '/registratura', label: 'Ish stoli', icon: 'DashboardOutlined', matchRoutes: ['/registratura'] },
      { key: '/patients/new', label: "Ro'yxatga olish", icon: 'UserOutlined', matchRoutes: ['/patients/new'] },
      { key: '/patients', label: 'Patient 360', icon: 'TeamOutlined', matchRoutes: ['/patients', '/patients/:id', '/medical-card/:patientId'] },
      { key: '/appointments', label: 'Qabullar', icon: 'CalendarOutlined', matchRoutes: ['/appointments'] },
      { key: '/queue', label: 'Elektron navbat', icon: 'MedicineBoxOutlined', matchRoutes: ['/queue'] },
      { key: '/queue-display', label: 'Queue Display', icon: 'AppstoreOutlined', matchRoutes: ['/queue-display'] },
      { key: '/registration-history', label: "Qabullar tarixi", icon: 'HistoryOutlined', matchRoutes: ['/registration-history'] },
    ],
  },
  {
    title: 'TIBBIYOT',
    items: [
      { key: '/doctor', label: 'Shifokor ish joyi', icon: 'MedicineBoxOutlined', matchRoutes: ['/doctor'] },
      { key: '/emr', label: 'EMR', icon: 'FileTextOutlined', matchRoutes: ['/emr'] },
      { key: '/diagnoses', label: 'Tashxislar', icon: 'HeartOutlined', matchRoutes: ['/diagnoses'] },
      { key: '/prescriptions', label: 'Retseptlar', icon: 'SnippetsOutlined', matchRoutes: ['/prescriptions'] },
      { key: '/vitals', label: 'Vitals', icon: 'ExperimentOutlined', matchRoutes: ['/vitals'] },
      { key: '/referrals', label: "Yo'llanmalar", icon: 'SendOutlined', matchRoutes: ['/referrals'] },
    ],
  },
  {
    title: 'DIAGNOSTIKA',
    items: [
      { key: '/lis', label: 'Laboratoriya', icon: 'ExperimentOutlined', matchRoutes: ['/lis'] },
      { key: '/radiology', label: 'Radiologiya', icon: 'AppstoreOutlined', matchRoutes: ['/radiology'] },
      { key: '/results', label: 'Natijalar', icon: 'DatabaseOutlined', matchRoutes: ['/results'] },
    ],
  },
  {
    title: 'MOLIYA',
    items: [
      { key: '/cashier', label: 'Kassa', icon: 'DollarOutlined', matchRoutes: ['/cashier'] },
      { key: '/payments', label: "To'lovlar", icon: 'ShoppingOutlined', matchRoutes: ['/payments'] },
      { key: '/invoices', label: 'Invoice', icon: 'FileTextOutlined', matchRoutes: ['/invoices'] },
      { key: '/deposits', label: 'Depozitlar', icon: 'DatabaseOutlined', matchRoutes: ['/deposits'] },
      { key: '/debtors', label: 'Qarzdorlar', icon: 'WarningOutlined', matchRoutes: ['/debtors'] },
      { key: '/reports', label: 'Hisobotlar', icon: 'AuditOutlined', matchRoutes: ['/reports'] },
    ],
  },
  {
    title: 'DORIXONA / OMBOR',
    items: [
      { key: '/pharmacy', label: 'Dorixona', icon: 'MedicineBoxOutlined', matchRoutes: ['/pharmacy'] },
      { key: '/warehouse', label: 'Ombor', icon: 'ContainerOutlined', matchRoutes: ['/warehouse'] },
      { key: '/products', label: 'Mahsulotlar', icon: 'AppstoreOutlined', matchRoutes: ['/products'] },
      { key: '/inventory', label: 'Kirim-chiqim', icon: 'HistoryOutlined', matchRoutes: ['/inventory'] },
      { key: '/stock', label: 'Qoldiq', icon: 'DatabaseOutlined', matchRoutes: ['/stock'] },
    ],
  },
  {
    title: 'AI TIZIMLAR',
    items: [
      { key: '/ai-scribe', label: 'AI Scribe', icon: 'RobotOutlined', matchRoutes: ['/ai-scribe'] },
      { key: '/ai-summary', label: 'AI Xulosa', icon: 'FileTextOutlined', matchRoutes: ['/ai-summary'] },
      { key: '/ai-recommendations', label: 'AI Tavsiyalar', icon: 'SafetyOutlined', matchRoutes: ['/ai-recommendations'] },
      { key: '/ai-risk', label: 'Risk Detection', icon: 'WarningOutlined', matchRoutes: ['/ai-risk'] },
    ],
  },
  {
    title: 'INTEGRATSIYA',
    items: [
      { key: '/integrations', label: 'Integratsiyalar', icon: 'AppstoreOutlined', matchRoutes: ['/integrations'] },
      { key: '/telegram-sms', label: 'Telegram/SMS', icon: 'MessageOutlined', matchRoutes: ['/telegram-sms'] },
      { key: '/audit-log', label: 'Audit log', icon: 'AuditOutlined', matchRoutes: ['/audit-log'] },
    ],
  },
  {
    title: 'BOSHQARUV',
    items: [
      { key: '/clinics', label: 'Klinikalar', icon: 'BankOutlined', matchRoutes: ['/clinics'] },
      { key: '/branches', label: 'Filiallar', icon: 'BranchesOutlined', matchRoutes: ['/branches'] },
      { key: '/departments', label: "Bo'limlar", icon: 'AppstoreOutlined', matchRoutes: ['/departments'] },
      { key: '/staff', label: 'Xodimlar', icon: 'TeamOutlined', matchRoutes: ['/staff'] },
      { key: '/doctors', label: 'Shifokorlar', icon: 'MedicineBoxOutlined', matchRoutes: ['/doctors'] },
      { key: '/cabinets', label: 'Kabinetlar', icon: 'ContainerOutlined', matchRoutes: ['/cabinets'] },
      { key: '/services-prices', label: 'Xizmatlar', icon: 'DollarOutlined', matchRoutes: ['/services-prices'] },
      { key: '/schedule', label: 'Ish grafigi', icon: 'ScheduleOutlined', matchRoutes: ['/schedule'] },
    ],
  },
  {
    title: 'TIZIM',
    items: [
      { key: '/users', label: 'Foydalanuvchilar', icon: 'UserOutlined', matchRoutes: ['/users'] },
      { key: '/roles', label: 'Rol va ruxsatlar', icon: 'LockOutlined', matchRoutes: ['/roles'] },
      { key: '/templates', label: 'Shablonlar', icon: 'FileTextOutlined', matchRoutes: ['/templates'] },
      { key: '/settings', label: 'Sozlamalar', icon: 'SettingOutlined', matchRoutes: ['/settings'] },
      { key: '/backup', label: 'Backup', icon: 'BackupOutlined', matchRoutes: ['/backup'] },
    ],
  },
]

interface PremiumSidebarProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
}

// Helper to match route patterns against current path
const matchRoute = (path: string, patterns: string[]): boolean => {
  return patterns.some(pattern => {
    // Handle :param patterns like /patients/:id
    if (pattern.includes(':')) {
      const patternParts = pattern.split('/')
      const pathParts = path.split('/')

      if (patternParts.length !== pathParts.length) return false

      return patternParts.every((part, i) => {
        if (part.startsWith(':')) return true // Wildcard parameter
        return part === pathParts[i]
      })
    }
    // Exact match
    return path === pattern
  })
}

export function PremiumSidebar({ collapsed, onCollapse }: PremiumSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  // Find which group contains the active item
  const findActiveGroupIndex = (): number => {
    const path = location.pathname
    for (let i = 0; i < menuGroups.length; i++) {
      const group = menuGroups[i]
      for (const item of group.items) {
        if (item.matchRoutes && matchRoute(path, item.matchRoutes)) {
          return i
        }
        // Fallback to key matching
        if (item.key === path || (item.key !== '/' && path.startsWith(item.key))) {
          return i
        }
      }
    }
    return 0 // Default to first group
  }

  // Only expand the group containing the active item
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {}
    const activeGroupIdx = findActiveGroupIndex()
    menuGroups.forEach((_, idx) => {
      initial[idx] = idx === activeGroupIdx
    })
    return initial
  })

  // Update expanded groups when route changes
  useEffect(() => {
    const activeGroupIdx = findActiveGroupIndex()
    setExpandedGroups(prev => {
      const newState: Record<number, boolean> = {}
      menuGroups.forEach((_, idx) => {
        newState[idx] = idx === activeGroupIdx
      })
      return newState
    })
  }, [location.pathname])

  const toggleGroup = (idx: number) => {
    setExpandedGroups(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }))
  }

  // Precise route matching - only one item active at a time
  const isActive = (item: MenuItem): boolean => {
    const path = location.pathname

    // Use matchRoutes if defined for precise matching
    if (item.matchRoutes && item.matchRoutes.length > 0) {
      return matchRoute(path, item.matchRoutes)
    }

    // Fallback to key matching
    if (item.key === '/') return path === '/'
    return path === item.key
  }

  const handleItemClick = (key: string) => {
    navigate(key)
  }

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={280}
      collapsedWidth={72}
      style={{
        background: COLORS.sidebarBg,
        borderRight: `1px solid ${COLORS.border}`,
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo Section - Compact */}
      <div style={{
        height: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '0' : '0 12px',
        borderBottom: `1px solid ${COLORS.divider}`,
        flexShrink: 0,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.softGold})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 12px rgba(212,175,55,0.3)`,
            }}>
              <span style={{ color: COLORS.sidebarBg, fontWeight: 800, fontSize: 13 }}>A</span>
            </div>
            <div style={{
              color: COLORS.gold,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '1.5px',
              textShadow: `0 0 8px rgba(212,175,55,0.2)`,
            }}>AMIS</div>
          </div>
        )}
        {collapsed && (
          <div style={{
            width: 30,
            height: 30,
            borderRadius: 6,
            background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.softGold})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 12px rgba(212,175,55,0.3)`,
          }}>
            <span style={{ color: COLORS.sidebarBg, fontWeight: 800, fontSize: 13 }}>A</span>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => onCollapse(true)}
            style={{
              background: 'transparent',
              border: `1px solid ${COLORS.border}`,
              borderRadius: 4,
              color: COLORS.gold,
              cursor: 'pointer',
              padding: '4px 6px',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = COLORS.hoverBg
              e.currentTarget.style.borderColor = COLORS.gold
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = COLORS.border
            }}
          >
            <MenuFoldOutlined style={{ fontSize: 12 }} />
          </button>
        )}
      </div>

      {/* Menu Section - Scrollable */}
      <nav style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '6px 0',
        scrollbarWidth: 'thin',
        scrollbarColor: `${COLORS.gold} ${COLORS.sidebarBg}`,
      }}>
        <style>{`
          nav::-webkit-scrollbar { width: 3px; }
          nav::-webkit-scrollbar-track { background: ${COLORS.sidebarBg}; }
          nav::-webkit-scrollbar-thumb { background: ${COLORS.gold}; border-radius: 2px; }
          .compact-tile:hover {
            background: ${COLORS.hoverBg} !important;
            border-color: ${COLORS.gold} !important;
          }
          .compact-tile:hover .tile-icon { color: ${COLORS.gold} !important; }
          .compact-tile:hover .tile-label { color: ${COLORS.softGold} !important; }
        `}</style>

        {menuGroups.map((group, idx) => (
          <div key={idx} style={{ marginBottom: 4 }}>
            {/* Group Header */}
            <div
              onClick={() => toggleGroup(idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
                padding: collapsed ? '4px 0' : '4px 10px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!collapsed) e.currentTarget.style.background = COLORS.hoverBg
              }}
              onMouseLeave={(e) => {
                if (!collapsed) e.currentTarget.style.background = 'transparent'
              }}
            >
              {!collapsed && (
                <>
                  <span style={{
                    color: COLORS.gold,
                    fontSize: 7,
                    fontWeight: 600,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}>
                    {group.title}
                  </span>
                  <span style={{ color: COLORS.textMuted }}>
                    {expandedGroups[idx] ? <DownOutlined style={{ fontSize: 8 }} /> : <RightOutlined style={{ fontSize: 8 }} />}
                  </span>
                </>
              )}
              {collapsed && (
                <div style={{
                  width: 16,
                  height: 2,
                  background: COLORS.gold,
                  borderRadius: 1,
                  opacity: 0.4,
                }} />
              )}
            </div>

            {/* Menu Items - Compact 2 Column Grid */}
            {(!collapsed && expandedGroups[idx]) && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 4,
                padding: '2px 8px',
              }}>
                {group.items.map((item) => {
                  const active = isActive(item)
                  return (
                    <Tooltip key={item.key} title={collapsed ? item.label : ''} placement="right">
                      <div
                        className="compact-tile"
                        onClick={() => handleItemClick(item.key)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '6px 4px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          background: active
                            ? COLORS.activeBg
                            : COLORS.tileBg,
                          border: active
                            ? `1px solid ${COLORS.activeBorder}`
                            : `1px solid ${COLORS.tileBorder}`,
                          boxShadow: active
                            ? `0 0 12px rgba(212,175,55,0.15), inset 0 0 8px rgba(212,175,55,0.02)`
                            : 'none',
                          minHeight: 48,
                          maxHeight: 52,
                        }}
                      >
                        <span
                          className="tile-icon"
                          style={{
                            fontSize: 14,
                            color: active ? COLORS.activeIcon : COLORS.textSecondary,
                            marginBottom: 3,
                            transition: 'color 0.2s',
                          }}
                        >
                          {iconMap[item.icon || 'AppstoreOutlined'] || <AppstoreOutlined style={{ fontSize: 14 }} />}
                        </span>
                        <span
                          className="tile-label"
                          style={{
                            fontSize: 9,
                            fontWeight: active ? 600 : 500,
                            color: active ? COLORS.activeText : COLORS.textSecondary,
                            textAlign: 'center',
                            lineHeight: 1.2,
                            transition: 'all 0.2s',
                            wordBreak: 'break-word',
                            maxWidth: '100%',
                          }}
                        >
                          {item.label}
                        </span>
                      </div>
                    </Tooltip>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User Profile Card - Fixed at bottom */}
      <div style={{
        borderTop: `1px solid ${COLORS.divider}`,
        background: COLORS.sidebarBgLight,
        padding: collapsed ? '8px 0' : '10px 12px',
        flexShrink: 0,
      }}>
        {collapsed ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.softGold})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: COLORS.sidebarBg,
              fontWeight: 700,
              fontSize: 12,
              boxShadow: `0 0 10px rgba(212,175,55,0.2)`,
            }}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <button
              onClick={() => onCollapse(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: COLORS.textSecondary,
                cursor: 'pointer',
                padding: 2,
              }}
            >
              <MenuUnfoldOutlined style={{ fontSize: 12 }} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.softGold})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: COLORS.sidebarBg,
              fontWeight: 700,
              fontSize: 12,
              boxShadow: `0 0 10px rgba(212,175,55,0.2)`,
            }}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: COLORS.textPrimary,
                fontSize: 11,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {user?.first_name} {user?.last_name}
              </div>
              <div style={{
                color: COLORS.textMuted,
                fontSize: 9,
                marginTop: 1,
              }}>
                {user?.role || 'Administrator'}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                marginTop: 2,
              }}>
                <span style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: '#4ade80',
                  boxShadow: '0 0 5px rgba(74,222,128,0.4)',
                }} />
                <span style={{ color: '#4ade80', fontSize: 8 }}>Online</span>
              </div>
            </div>
            <button
              onClick={() => onCollapse(true)}
              style={{
                background: 'transparent',
                border: `1px solid ${COLORS.border}`,
                borderRadius: 4,
                color: COLORS.textSecondary,
                cursor: 'pointer',
                padding: '4px 6px',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = COLORS.hoverBg
                e.currentTarget.style.borderColor = COLORS.gold
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = COLORS.border
              }}
            >
              <MenuFoldOutlined style={{ fontSize: 12 }} />
            </button>
          </div>
        )}
      </div>
    </Sider>
  )
}
