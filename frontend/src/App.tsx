import { useState } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { LoadingPage } from './pages/LoadingPage'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { PatientsPage } from './pages/PatientsPage'
import { PatientDetailPage } from './pages/PatientDetailPage'
import { AppointmentsPage } from './pages/AppointmentsPage'
import { QueuePage } from './pages/QueuePage'
import { CashierPage } from './pages/CashierPage'
import { DoctorPage } from './pages/DoctorPage'
import { MedicalCardPage } from './pages/MedicalCardPage'
import { LISPage } from './pages/LISPage'
import { RadiologyPage } from './pages/RadiologyPage'
import { PharmacyPage } from './pages/PharmacyPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { ReportsPage } from './pages/ReportsPage'
import { AuditLogPage } from './pages/AuditLogPage'
import { MultiClinicPage } from './pages/MultiClinicPage'
import { UserManagementPage } from './pages/UserManagementPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { IntegrationsPage } from './pages/IntegrationsPage'
import { AIModulesPage } from './pages/AIModulesPage'
import { SettingsPage } from './pages/SettingsPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingPage />
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/" element={
        <PrivateRoute>
          <CommandCenterLayout />
        </PrivateRoute>
      }>
        <Route index element={<DashboardPage />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="patients/:id" element={<PatientDetailPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="queue" element={<QueuePage />} />
        <Route path="cashier" element={<CashierPage />} />
        <Route path="doctor" element={<DoctorPage />} />
        <Route path="medical-card/:patientId" element={<MedicalCardPage />} />
        <Route path="lis" element={<LISPage />} />
        <Route path="radiology" element={<RadiologyPage />} />
        <Route path="pharmacy" element={<PharmacyPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="audit-log" element={<AuditLogPage />} />
        <Route path="clinics" element={<MultiClinicPage />} />
        <Route path="users" element={<UserManagementPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="integrations" element={<IntegrationsPage />} />
        <Route path="ai-modules" element={<AIModulesPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// Command Center Premium Layout
function CommandCenterLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const menuGroups = [
    {
      title: 'ASOSIY',
      items: [
        { key: '/', label: 'Bosh sahifa', icon: '◆' },
        { key: '/patients', label: 'Patient 360', icon: '◈' },
        { key: '/appointments', label: 'Qabullar', icon: '◇' },
        { key: '/queue', label: 'Elektron navbat', icon: '○' },
      ]
    },
    {
      title: 'TIBBIYOT',
      items: [
        { key: '/doctor', label: 'Shifokor ish joyi', icon: '✦' },
        { key: '/medical-card', label: 'EMR', icon: '✧' },
        { key: '/lis', label: 'Laboratoriya', icon: '★' },
        { key: '/radiology', label: 'Radiologiya', icon: '◎' },
        { key: '/pharmacy', label: 'Dorixona', icon: '◉' },
      ]
    },
    {
      title: 'MOLIYA',
      items: [
        { key: '/cashier', label: 'Kassa', icon: '◈' },
        { key: '/analytics', label: 'Analitika', icon: '◆' },
        { key: '/reports', label: 'Hisobotlar', icon: '◇' },
      ]
    },
    {
      title: 'AI TIZIMLAR',
      items: [
        { key: '/ai-modules', label: 'AI Scribe', icon: '⏣' },
        { key: '/ai-modules', label: 'AI Xulosa', icon: '⏢' },
        { key: '/ai-modules', label: 'AI Tavsiyalar', icon: '⏥' },
      ]
    },
    {
      title: 'INTEGRATSIYA',
      items: [
        { key: '/integrations', label: 'Integratsiyalar', icon: '⬡' },
        { key: '/notifications', label: 'Bildirishnomalar', icon: '⬢' },
        { key: '/audit-log', label: 'Audit log', icon: '◇' },
      ]
    },
    {
      title: 'BOSHQARUV',
      items: [
        { key: '/clinics', label: 'Klinikalar', icon: '◈' },
        { key: '/users', label: 'Foydalanuvchilar', icon: '◆' },
        { key: '/settings', label: 'Sozlamalar', icon: '◇' },
      ]
    },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div style={styles.layout}>
      {/* Premium Sidebar */}
      <aside style={{
        ...styles.sidebar,
        width: collapsed ? '80px' : '300px',
      }}>
        {/* Logo Section */}
        <div style={styles.logoSection}>
          <div style={styles.logoContainer}>
            {/* Official AMIS Logo - Full Size */}
            {!collapsed ? (
              <>
                <img
                  src="/amis-logo.svg"
                  alt="AMIS Logo"
                  style={{
                    width: '200px',
                    maxWidth: '220px',
                    height: 'auto',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 0 25px rgba(0,242,255,0.6))',
                    animation: 'logo-pulse 3s ease-in-out infinite',
                  }}
                />
                <div style={styles.logoText}>
                  <div style={styles.logoTitle}>AMIS</div>
                  <div style={styles.logoSubtitle}>Advanced Medical Information System</div>
                </div>
                <div style={styles.tagline}>Tibbiy Axborot Tizimi</div>
              </>
            ) : (
              <img
                src="/amis-logo.svg"
                alt="AMIS Logo"
                style={{
                  width: '50px',
                  height: 'auto',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 20px rgba(0,242,255,0.6))',
                  animation: 'logo-pulse 3s ease-in-out infinite',
                }}
              />
            )}
          </div>
        </div>

        {/* Menu Groups */}
        <nav style={styles.menuNav}>
          {menuGroups.map((group, idx) => (
            <div key={idx} style={styles.menuGroup}>
              {!collapsed && (
                <div style={styles.menuGroupTitle}>{group.title}</div>
              )}
              {group.items.map((item, iidx) => (
                <div
                  key={iidx}
                  style={{
                    ...styles.menuItem,
                    ...(isActive(item.key) ? styles.menuItemActive : {}),
                  }}
                  onClick={() => navigate(item.key)}
                >
                  <span style={styles.menuIcon}>{item.icon}</span>
                  {!collapsed && <span style={styles.menuLabel}>{item.label}</span>}
                </div>
              ))}
            </div>
          ))}
        </nav>

        {/* User Profile Card */}
        <div style={{
          ...styles.userCard,
          padding: collapsed ? '12px' : '16px',
        }}>
          <div style={styles.userAvatar}>
            {user?.first_name?.[0] || 'D'}{user?.last_name?.[0] || 'U'}
          </div>
          {!collapsed && (
            <div style={styles.userInfo}>
              <div style={styles.userName}>
                {user?.first_name || 'Doktor'} {user?.last_name || 'User'}
              </div>
              <div style={styles.userRole}>Tizim administratori</div>
              <div style={styles.userStatus}>
                <span style={styles.statusDot}></span>
                Online
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content - Uses Outlet for nested routes */}
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

// Premium Command Center Styles
const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    background: '#050a12',
  },
  sidebar: {
    background: 'linear-gradient(180deg, #081423 0%, #0a1829 50%, #0d1f35 100%)',
    borderRight: '1px solid rgba(0, 212, 170, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    transition: 'width 0.3s ease',
    overflow: 'hidden',
    zIndex: 100,
    boxShadow: '4px 0 20px rgba(0, 0, 0, 0.5)',
  },
  logoSection: {
    padding: '24px 0',
    marginTop: '24px',
    marginBottom: '28px',
    borderBottom: '1px solid rgba(0, 212, 170, 0.1)',
    textAlign: 'center',
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '0 16px',
  },
  logo: {
    filter: 'drop-shadow(0 0 10px rgba(0, 212, 170, 0.5))',
    animation: 'pulse 3s ease-in-out infinite',
  },
  logoText: {
    textAlign: 'left',
  },
  logoTitle: {
    color: '#00d4aa',
    fontSize: '18px',
    fontWeight: 800,
    letterSpacing: '3px',
    textShadow: '0 0 20px rgba(0, 212, 170, 0.5)',
  },
  logoSubtitle: {
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    letterSpacing: '6px',
    opacity: 0.9,
  },
  tagline: {
    color: 'rgba(0, 212, 170, 0.7)',
    fontSize: '10px',
    letterSpacing: '2px',
    marginTop: '8px',
    textTransform: 'uppercase',
  },
  menuNav: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 0',
  },
  menuGroup: {
    marginBottom: '20px',
  },
  menuGroupTitle: {
    color: 'rgba(0, 212, 170, 0.5)',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '2px',
    padding: '0 20px',
    marginBottom: '8px',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    color: 'rgba(255, 255, 255, 0.7)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '14px',
    gap: '12px',
  },
  menuItemActive: {
    background: 'linear-gradient(90deg, rgba(0, 212, 170, 0.2) 0%, rgba(0, 212, 170, 0.05) 100%)',
    color: '#00d4aa',
    borderLeft: '3px solid #00d4aa',
    boxShadow: '0 0 20px rgba(0, 212, 170, 0.1)',
  },
  menuIcon: {
    fontSize: '16px',
    width: '24px',
    textAlign: 'center',
  },
  menuLabel: {
    fontWeight: 500,
  },
  userCard: {
    borderTop: '1px solid rgba(0, 212, 170, 0.1)',
    background: 'rgba(0, 0, 0, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userAvatar: {
    width: '45px',
    height: '45px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #00d4aa 0%, #0891b2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 700,
    fontSize: '16px',
    boxShadow: '0 4px 15px rgba(0, 212, 170, 0.3)',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
  },
  userRole: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '11px',
    marginTop: '2px',
  },
  userStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#00d4aa',
    fontSize: '11px',
    marginTop: '4px',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#00d4aa',
    boxShadow: '0 0 10px rgba(0, 212, 170, 0.5)',
    animation: 'blink 2s infinite',
  },
  main: {
    flex: 1,
    marginLeft: '300px',
    minHeight: '100vh',
    background: '#050a12',
  },
}

export default App
