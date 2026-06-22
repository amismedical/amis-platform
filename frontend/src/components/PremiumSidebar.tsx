import { useState } from 'react'
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

// Premium color palette - Shield Premium Theme
const COLORS = {
  sidebarBg: '#071827',
  sidebarBgLight: '#0a2134',
  groupBg: '#0d2a42',
  // Active states
  activeBg: 'linear-gradient(145deg, #7A1020, rgba(122,16,32,0.65))',
  activeBorder: '#D4AF37',
  activeText: '#F5D76E',
  activeIcon: '#D4AF37',
  // Gold palette
  gold: '#D4AF37',
  softGold: '#F5D76E',
  // Cream text colors
  textPrimary: '#EADFA3',    // Main cream text
  textSecondary: '#B8A96A',  // Secondary muted text
  textMuted: '#8B7D4D',      // Muted text
  // Backgrounds and borders
  hoverBg: 'rgba(212,175,55,0.08)',
  hoverBorder: '#D4AF37',
  border: 'rgba(212,175,55,0.12)',
  divider: 'rgba(212,175,55,0.06)',
  // Tile/card background
  tileBg: 'rgba(255,255,255,0.03)',
  tileBorder: 'rgba(212,175,55,0.08)',
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

// Menu structure with collapsible groups
interface MenuItem {
  key: string
  label: string
  icon?: string
  // For route matching - if this item should be active for certain paths
  activeFor?: string[] // Array of paths that make this item active
}

interface MenuGroup {
  title: string
  items: MenuItem[]
}

const menuGroups: MenuGroup[] = [
  {
    title: 'ASOSIY',
    items: [
      { key: '/', label: 'Bosh sahifa', icon: 'DashboardOutlined' },
      { key: '/notifications', label: 'Bildirishnomalar', icon: 'BellOutlined' },
    ],
  },
  {
    title: 'REGISTRATURA',
    items: [
      { key: '/patients/new', label: "Ro'yxatga olish", icon: 'UserOutlined', activeFor: ['/patients/new'] },
      { key: '/patients', label: 'Patient 360', icon: 'TeamOutlined', activeFor: ['/patients', '/patients/', '/medical-card/'] },
      { key: '/appointments', label: 'Qabullar', icon: 'CalendarOutlined' },
      { key: '/queue', label: 'Elektron navbat', icon: 'MedicineBoxOutlined' },
      { key: '/queue-display', label: 'Queue Display', icon: 'AppstoreOutlined' },
    ],
  },
  {
    title: 'TIBBIYOT',
    items: [
      { key: '/doctor', label: 'Shifokor ish joyi', icon: 'MedicineBoxOutlined' },
      { key: '/emr', label: 'EMR', icon: 'FileTextOutlined', activeFor: ['/emr'] },
      { key: '/diagnoses', label: 'Tashxislar', icon: 'HeartOutlined' },
      { key: '/prescriptions', label: 'Retseptlar', icon: 'SnippetsOutlined' },
      { key: '/vitals', label: 'Vitals', icon: 'ExperimentOutlined' },
      { key: '/referrals', label: "Yo'llanmalar", icon: 'SendOutlined' },
    ],
  },
  {
    title: 'DIAGNOSTIKA',
    items: [
      { key: '/lis', label: 'Laboratoriya', icon: 'ExperimentOutlined' },
      { key: '/radiology', label: 'Radiologiya', icon: 'AppstoreOutlined' },
      { key: '/results', label: 'Natijalar', icon: 'DatabaseOutlined' },
    ],
  },
  {
    title: 'MOLIYA',
    items: [
      { key: '/cashier', label: 'Kassa', icon: 'DollarOutlined' },
      { key: '/payments', label: "To'lovlar", icon: 'ShoppingOutlined' },
      { key: '/invoices', label: 'Invoice', icon: 'FileTextOutlined' },
      { key: '/deposits', label: 'Depozitlar', icon: 'DatabaseOutlined' },
      { key: '/debtors', label: 'Qarzdorlar', icon: 'WarningOutlined' },
      { key: '/reports', label: 'Hisobotlar', icon: 'AuditOutlined' },
    ],
  },
  {
    title: 'DORIXONA / OMBOR',
    items: [
      { key: '/pharmacy', label: 'Dorixona', icon: 'MedicineBoxOutlined' },
      { key: '/warehouse', label: 'Ombor', icon: 'ContainerOutlined' },
      { key: '/products', label: 'Mahsulotlar', icon: 'AppstoreOutlined' },
      { key: '/inventory', label: 'Kirim-chiqim', icon: 'HistoryOutlined' },
      { key: '/stock', label: 'Qoldiq', icon: 'DatabaseOutlined' },
    ],
  },
  {
    title: 'AI TIZIMLAR',
    items: [
      { key: '/ai-scribe', label: 'AI Scribe', icon: 'RobotOutlined' },
      { key: '/ai-summary', label: 'AI Xulosa', icon: 'FileTextOutlined' },
      { key: '/ai-recommendations', label: 'AI Tavsiyalar', icon: 'SafetyOutlined' },
      { key: '/ai-risk', label: 'Risk Detection', icon: 'WarningOutlined' },
    ],
  },
  {
    title: 'INTEGRATSIYA',
    items: [
      { key: '/integrations', label: 'Integratsiyalar', icon: 'AppstoreOutlined' },
      { key: '/telegram-sms', label: 'Telegram/SMS', icon: 'MessageOutlined' },
      { key: '/audit-log', label: 'Audit log', icon: 'AuditOutlined' },
    ],
  },
  {
    title: 'BOSHQARUV',
    items: [
      { key: '/clinics', label: 'Klinikalar', icon: 'BankOutlined' },
      { key: '/branches', label: 'Filiallar', icon: 'BranchesOutlined' },
      { key: '/departments', label: "Bo'limlar", icon: 'AppstoreOutlined' },
      { key: '/staff', label: 'Xodimlar', icon: 'TeamOutlined' },
      { key: '/doctors', label: 'Shifokorlar', icon: 'MedicineBoxOutlined' },
      { key: '/cabinets', label: 'Kabinetlar', icon: 'ContainerOutlined' },
      { key: '/services-prices', label: 'Xizmatlar va narxlar', icon: 'DollarOutlined' },
      { key: '/schedule', label: 'Ish grafigi', icon: 'ScheduleOutlined' },
    ],
  },
  {
    title: 'TIZIM',
    items: [
      { key: '/users', label: 'Foydalanuvchilar', icon: 'UserOutlined' },
      { key: '/roles', label: 'Rol va ruxsatlar', icon: 'LockOutlined' },
      { key: '/templates', label: 'Hujjat shablonlari', icon: 'FileTextOutlined' },
      { key: '/settings', label: 'Sozlamalar', icon: 'SettingOutlined' },
      { key: '/backup', label: 'Backup', icon: 'BackupOutlined' },
    ],
  },
]

interface PremiumSidebarProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
}

export function PremiumSidebar({ collapsed, onCollapse }: PremiumSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {}
    menuGroups.forEach((_, idx) => { initial[idx] = true })
    return initial
  })

  const toggleGroup = (idx: number) => {
    setExpandedGroups(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }))
  }

  // Smart route matching - only one item active at a time
  const isActive = (item: MenuItem): boolean => {
    const path = location.pathname

    // Check if item has custom activeFor patterns
    if (item.activeFor && item.activeFor.length > 0) {
      return item.activeFor.some(pattern => {
        if (pattern.endsWith('/')) {
          // Pattern like /patients/ - match any path starting with this
          return path.startsWith(pattern) || path === pattern.slice(0, -1)
        }
        if (pattern === path) return true
        // Check if pattern is a prefix match
        if (path.startsWith(pattern)) return true
        return false
      })
    }

    // Default behavior for items without activeFor
    if (item.key === '/') return path === '/'
    return path.startsWith(item.key)
  }

  const handleItemClick = (key: string) => {
    navigate(key)
  }

  // Split items into 2 columns for grid layout
  const splitIntoColumns = (items: MenuItem[], columns: number = 2): MenuItem[][] => {
    const result: MenuItem[][] = Array.from({ length: columns }, () => [])
    items.forEach((item, idx) => {
      result[idx % columns].push(item)
    })
    return result
  }

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={300}
      collapsedWidth={80}
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
      {/* Logo Section */}
      <div style={{
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '0' : '0 14px',
        borderBottom: `1px solid ${COLORS.divider}`,
        flexShrink: 0,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.softGold})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 18px rgba(212,175,55,0.35)`,
            }}>
              <span style={{ color: COLORS.sidebarBg, fontWeight: 800, fontSize: 15 }}>A</span>
            </div>
            <div>
              <div style={{
                color: COLORS.gold,
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: '2px',
                textShadow: `0 0 10px rgba(212,175,55,0.25)`,
              }}>AMIS</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.softGold})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 18px rgba(212,175,55,0.35)`,
          }}>
            <span style={{ color: COLORS.sidebarBg, fontWeight: 800, fontSize: 15 }}>A</span>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => onCollapse(true)}
            style={{
              background: 'transparent',
              border: `1px solid ${COLORS.border}`,
              borderRadius: 6,
              color: COLORS.gold,
              cursor: 'pointer',
              padding: '5px 7px',
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
            <MenuFoldOutlined />
          </button>
        )}
      </div>

      {/* Menu Section - Scrollable */}
      <nav style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '8px 0',
        scrollbarWidth: 'thin',
        scrollbarColor: `${COLORS.gold} ${COLORS.sidebarBg}`,
      }}>
        <style>{`
          nav::-webkit-scrollbar { width: 4px; }
          nav::-webkit-scrollbar-track { background: ${COLORS.sidebarBg}; }
          nav::-webkit-scrollbar-thumb { background: ${COLORS.gold}; border-radius: 2px; }
          .shield-tile:hover {
            background: ${COLORS.hoverBg} !important;
            border-color: ${COLORS.gold} !important;
            box-shadow: 0 0 12px rgba(212,175,55,0.15) !important;
          }
          .shield-tile:hover .tile-icon { color: ${COLORS.gold} !important; }
          .shield-tile:hover .tile-label { color: ${COLORS.softGold} !important; }
        `}</style>

        {menuGroups.map((group, idx) => (
          <div key={idx} style={{ marginBottom: 6 }}>
            {/* Group Header */}
            <div
              onClick={() => toggleGroup(idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
                padding: collapsed ? '6px 0' : '6px 14px',
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
                    fontSize: 8,
                    fontWeight: 600,
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                  }}>
                    {group.title}
                  </span>
                  <span style={{ color: COLORS.textMuted }}>
                    {expandedGroups[idx] ? <DownOutlined style={{ fontSize: 9 }} /> : <RightOutlined style={{ fontSize: 9 }} />}
                  </span>
                </>
              )}
              {collapsed && (
                <div style={{
                  width: 20,
                  height: 2,
                  background: COLORS.gold,
                  borderRadius: 1,
                  opacity: 0.5,
                }} />
              )}
            </div>

            {/* Menu Items - 2 Column Grid Layout */}
            {(!collapsed && expandedGroups[idx]) && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 6,
                padding: '4px 10px',
              }}>
                {group.items.map((item) => {
                  const active = isActive(item)
                  return (
                    <Tooltip key={item.key} title={collapsed ? item.label : ''} placement="right">
                      <div
                        className="shield-tile"
                        onClick={() => handleItemClick(item.key)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '12px 8px',
                          borderRadius: 10,
                          cursor: 'pointer',
                          transition: 'all 0.25s ease',
                          background: active
                            ? COLORS.activeBg
                            : COLORS.tileBg,
                          border: active
                            ? `1px solid ${COLORS.activeBorder}`
                            : `1px solid ${COLORS.tileBorder}`,
                          boxShadow: active
                            ? `0 0 18px rgba(212,175,55,0.18), inset 0 0 15px rgba(212,175,55,0.03)`
                            : 'none',
                          minHeight: 70,
                        }}
                      >
                        <span
                          className="tile-icon"
                          style={{
                            fontSize: 20,
                            color: active ? COLORS.activeIcon : COLORS.textSecondary,
                            marginBottom: 6,
                            transition: 'color 0.2s',
                          }}
                        >
                          {iconMap[item.icon || 'AppstoreOutlined'] || <AppstoreOutlined />}
                        </span>
                        <span
                          className="tile-label"
                          style={{
                            fontSize: 10,
                            fontWeight: active ? 600 : 500,
                            color: active ? COLORS.activeText : COLORS.textSecondary,
                            textAlign: 'center',
                            lineHeight: 1.3,
                            transition: 'all 0.2s',
                            wordBreak: 'break-word',
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
        padding: collapsed ? '10px 0' : '14px',
        flexShrink: 0,
      }}>
        {collapsed ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.softGold})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: COLORS.sidebarBg,
              fontWeight: 700,
              fontSize: 13,
              boxShadow: `0 0 12px rgba(212,175,55,0.25)`,
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
                padding: 4,
              }}
            >
              <MenuUnfoldOutlined />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.softGold})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: COLORS.sidebarBg,
              fontWeight: 700,
              fontSize: 14,
              boxShadow: `0 0 12px rgba(212,175,55,0.25)`,
            }}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: COLORS.textPrimary,
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {user?.first_name} {user?.last_name}
              </div>
              <div style={{
                color: COLORS.textMuted,
                fontSize: 10,
                marginTop: 2,
              }}>
                {user?.role || 'Administrator'}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 3,
              }}>
                <span style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: '#4ade80',
                  boxShadow: '0 0 6px rgba(74,222,128,0.4)',
                }} />
                <span style={{ color: '#4ade80', fontSize: 9 }}>Online</span>
              </div>
            </div>
            <button
              onClick={() => onCollapse(true)}
              style={{
                background: 'transparent',
                border: `1px solid ${COLORS.border}`,
                borderRadius: 6,
                color: COLORS.textSecondary,
                cursor: 'pointer',
                padding: '5px 7px',
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
              <MenuFoldOutlined />
            </button>
          </div>
        )}
      </div>
    </Sider>
  )
}
