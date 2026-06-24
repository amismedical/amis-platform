import { useState } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { LoadingPage } from './pages/LoadingPage'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { PatientsPage } from './pages/PatientsPage'
import { PatientDetailPage } from './pages/PatientDetailPage'
import { PatientRegistrationPage } from './pages/PatientRegistrationPage'
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
import { PlaceholderPage } from './pages/PlaceholderPage'
import { StaffManagementPage } from './pages/StaffManagementPage'
import { DoctorsPage } from './pages/DoctorsPage'
import { RegistraturaDashboard } from './pages/RegistraturaDashboard'
import { PremiumSidebar } from './components/PremiumSidebar'

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
        {/* Existing routes */}
        <Route index element={<DashboardPage />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="patients/new" element={<PatientRegistrationPage />} />
        <Route path="patients/:id" element={<PatientDetailPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="registratura" element={<RegistraturaDashboard />} />
        <Route path="queue" element={<QueuePage />} />
        <Route path="queue-display" element={<PlaceholderPage moduleName="Queue Display" description="Ekran rejimi - ekranda navbat ko'rsatadi" />} />
        <Route path="cashier" element={<CashierPage />} />
        <Route path="doctor" element={<DoctorPage />} />
        <Route path="medical-card/:patientId" element={<MedicalCardPage />} />
        <Route path="emr" element={<PlaceholderPage moduleName="EMR" description="Elektron tibbiyot yozuvlari" />} />
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

        {/* New placeholder routes */}
        <Route path="diagnoses" element={<PlaceholderPage moduleName="Tashxislar" description="Tashxis tarixi va boshqaruv" />} />
        <Route path="prescriptions" element={<PlaceholderPage moduleName="Retseptlar" description="Retseptlar boshqaruvi" />} />
        <Route path="vitals" element={<PlaceholderPage moduleName="Vitals" description="Hayotiy ko'rsatkichlar" />} />
        <Route path="referrals" element={<PlaceholderPage moduleName="Yo'llanmalar" description="Boshqa shifokorlarga yo'llanmalar" />} />
        <Route path="results" element={<PlaceholderPage moduleName="Natijalar" description="Tashxis natijalari" />} />
        <Route path="payments" element={<PlaceholderPage moduleName="To'lovlar" description="To'lovlar tarixi" />} />
        <Route path="invoices" element={<PlaceholderPage moduleName="Invoice" description="Invoice va чекlar" />} />
        <Route path="deposits" element={<PlaceholderPage moduleName="Depozitlar" description="Bemor deposutlari" />} />
        <Route path="debtors" element={<PlaceholderPage moduleName="Qarzdorlar" description="Qarzdor bemorlar ro'yxati" />} />
        <Route path="warehouse" element={<PlaceholderPage moduleName="Ombor" description="Ombor boshqaruvi" />} />
        <Route path="products" element={<PlaceholderPage moduleName="Mahsulotlar" description="Dorilar va mahsulotlar" />} />
        <Route path="inventory" element={<PlaceholderPage moduleName="Kirim-chiqim" description="Kirim va chiqim yozuvlari" />} />
        <Route path="stock" element={<PlaceholderPage moduleName="Qoldiq" description="Ombordagi qoldiq" />} />
        <Route path="ai-scribe" element={<PlaceholderPage moduleName="AI Scribe" description="AI bilan hujjat yaratish" />} />
        <Route path="ai-summary" element={<PlaceholderPage moduleName="AI Xulosa" description="AI xulosa chiqarish" />} />
        <Route path="ai-recommendations" element={<PlaceholderPage moduleName="AI Tavsiyalar" description="AI tavsiyalar tizimi" />} />
        <Route path="ai-risk" element={<PlaceholderPage moduleName="Risk Detection" description="Xavfni aniqlash tizimi" />} />
        <Route path="telegram-sms" element={<PlaceholderPage moduleName="Telegram/SMS" description="Telegram va SMS integratsiyasi" />} />
        <Route path="branches" element={<PlaceholderPage moduleName="Filiallar" description="Klinika filiallari" />} />
        <Route path="departments" element={<PlaceholderPage moduleName="Bo'limlar" description="Bo'limlar boshqaruvi" />} />
        <Route path="staff" element={<StaffManagementPage />} />
        <Route path="doctors" element={<DoctorsPage />} />
        <Route path="cabinets" element={<PlaceholderPage moduleName="Kabinetlar" description="Kabinetlar boshqaruvi" />} />
        <Route path="services-prices" element={<PlaceholderPage moduleName="Xizmatlar va narxlar" description="Xizmatlar va ularning narxlari" />} />
        <Route path="schedule" element={<PlaceholderPage moduleName="Ish grafigi" description="Shifokorlar ish grafigi" />} />
        <Route path="roles" element={<PlaceholderPage moduleName="Rol va ruxsatlar" description="Foydalanuvchi rollari va ruxsatlari" />} />
        <Route path="templates" element={<PlaceholderPage moduleName="Hujjat shablonlari" description="Hujjat shablonlari" />} />
        <Route path="backup" element={<PlaceholderPage moduleName="Backup" description="Ma'lumotlar rezerv nusxasi" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// Premium Command Center Layout with Gold/Burgundy Theme
function CommandCenterLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#050a12',
    }}>
      <PremiumSidebar collapsed={collapsed} onCollapse={setCollapsed} />

      <main style={{
        flex: 1,
        marginLeft: collapsed ? 80 : 280,
        minHeight: '100vh',
        background: '#050a12',
        transition: 'margin-left 0.3s ease',
        overflow: 'auto',
      }}>
        <div style={{
          padding: 24,
          minHeight: '100vh',
        }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default App
