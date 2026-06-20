// Mock API Service - Works without backend
// This provides demo data for the AMIS Medical System

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  phone?: string
  is_active: boolean
}

export interface Patient {
  id: string
  first_name: string
  last_name: string
  patronymic?: string
  birth_date: string
  gender: 'male' | 'female'
  phone: string
  phone_2?: string
  email?: string
  citizenship?: string
  address?: string
  deposit_balance: number
  is_active: boolean
  created_at: string
}

export interface Staff {
  id: string
  first_name: string
  last_name: string
  position?: string
  specialty?: string
  cabinet?: string
}

export interface Service {
  id: string
  name: string
  duration: number
  base_price: number
}

export interface Appointment {
  id: string
  patient_id: string
  doctor_id: string
  service_id: string
  status: 'scheduled' | 'waiting' | 'in_progress' | 'completed' | 'cancelled'
  appointment_date: string
  start_time: string
  end_time?: string
  booking_method: string
  notes?: string
  cabinet?: string
  patient?: Patient
  doctor?: Staff
  service?: Service
}

export interface Dashboard {
  total_appointments: number
  completed_appointments: number
  cancelled_appointments: number
  total_revenue: number
  new_patients: number
  waiting_patients: number
}

export interface Service {
  id: string
  name: string
  duration: number
  base_price: number
}

// ==================== Mock Data ====================

const MOCK_USERS: User[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'admin@amis.uz',
    first_name: 'Admin',
    last_name: 'User',
    role: 'clinic_admin',
    phone: '+998901234567',
    is_active: true
  }
]

const MOCK_PATIENTS: Patient[] = [
  {
    id: 'p1',
    first_name: 'John',
    last_name: 'Smith',
    birth_date: '1990-05-15',
    gender: 'male',
    phone: '+998901111111',
    email: 'john@example.com',
    citizenship: 'Uzbekistan',
    address: 'Tashkent, Yunusobod 15',
    deposit_balance: 500000,
    is_active: true,
    created_at: '2026-03-14T10:00:00Z'
  },
  {
    id: 'p2',
    first_name: 'Mary',
    last_name: 'Johnson',
    birth_date: '1985-08-22',
    gender: 'female',
    phone: '+998902222222',
    email: 'mary@example.com',
    citizenship: 'Uzbekistan',
    address: 'Samarkand, Center 5',
    deposit_balance: 250000,
    is_active: true,
    created_at: '2026-05-14T09:30:00Z'
  },
  {
    id: 'p3',
    first_name: 'Bobur',
    last_name: 'Rahimov',
    birth_date: '1995-03-10',
    gender: 'male',
    phone: '+998903333333',
    citizenship: 'Uzbekistan',
    address: 'Bukhara, Navoi 12',
    deposit_balance: 100000,
    is_active: true,
    created_at: '2026-06-14T08:15:00Z'
  },
  {
    id: 'p4',
    first_name: 'Dilshod',
    last_name: 'Karimov',
    birth_date: '1988-11-25',
    gender: 'male',
    phone: '+998904444444',
    email: 'dilshod@example.com',
    citizenship: 'Uzbekistan',
    address: 'Tashkent, Chilonzor 8',
    deposit_balance: 750000,
    is_active: true,
    created_at: '2026-06-01T14:20:00Z'
  },
  {
    id: 'p5',
    first_name: 'Nodira',
    last_name: 'Saidova',
    birth_date: '1992-07-08',
    gender: 'female',
    phone: '+998905555555',
    email: 'nodira@example.com',
    citizenship: 'Uzbekistan',
    address: 'Tashkent, Yakkasaroy 3',
    deposit_balance: 320000,
    is_active: true,
    created_at: '2026-06-10T11:45:00Z'
  }
]

const MOCK_DOCTORS: Staff[] = [
  {
    id: 'd1',
    first_name: 'Ahmedov',
    last_name: 'Botir',
    position: 'Terapevt',
    specialty: 'Umumiy amaliyot',
    cabinet: '101'
  },
  {
    id: 'd2',
    first_name: 'Karimova',
    last_name: 'Nodira',
    position: 'Kardiolog',
    specialty: 'Kardiologiya',
    cabinet: '205'
  },
  {
    id: 'd3',
    first_name: 'Alimov',
    last_name: 'Jasur',
    position: 'Jarroh',
    specialty: 'Jarrohlik',
    cabinet: '302'
  },
  {
    id: 'd4',
    first_name: 'Rustamova',
    last_name: 'Gulshan',
    position: 'Pediatr',
    specialty: 'Pediatriya',
    cabinet: '150'
  },
  {
    id: 'd5',
    first_name: 'Nasimov',
    last_name: 'Sardor',
    position: 'Nevrolog',
    specialty: 'Nevrologiya',
    cabinet: '210'
  }
]

const MOCK_SERVICES: Service[] = [
  { id: 's1', name: 'Umumiy maslahat', duration: 30, base_price: 50000 },
  { id: 's2', name: 'Kardiologiya maslahati', duration: 45, base_price: 80000 },
  { id: 's3', name: 'Jarrohlik maslahati', duration: 60, base_price: 120000 },
  { id: 's4', name: 'Laboratoriya tahlillari', duration: 15, base_price: 30000 },
  { id: 's5', name: 'Rentgen', duration: 20, base_price: 45000 },
  { id: 's6', name: 'UTT', duration: 30, base_price: 60000 },
  { id: 's7', name: 'EKG', duration: 15, base_price: 35000 },
  { id: 's8', name: 'Bolalar tekshiruvi', duration: 30, base_price: 55000 }
]

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    patient_id: 'p1',
    doctor_id: 'd1',
    service_id: 's1',
    status: 'completed',
    appointment_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '09:30',
    booking_method: 'online',
    cabinet: '101',
    patient: MOCK_PATIENTS[0],
    doctor: MOCK_DOCTORS[0],
    service: MOCK_SERVICES[0]
  },
  {
    id: 'a2',
    patient_id: 'p2',
    doctor_id: 'd2',
    service_id: 's2',
    status: 'waiting',
    appointment_date: new Date().toISOString().split('T')[0],
    start_time: '10:00',
    booking_method: 'phone',
    cabinet: '205',
    patient: MOCK_PATIENTS[1],
    doctor: MOCK_DOCTORS[1],
    service: MOCK_SERVICES[1]
  },
  {
    id: 'a3',
    patient_id: 'p3',
    doctor_id: 'd3',
    service_id: 's3',
    status: 'scheduled',
    appointment_date: new Date().toISOString().split('T')[0],
    start_time: '11:00',
    booking_method: 'online',
    cabinet: '302',
    patient: MOCK_PATIENTS[2],
    doctor: MOCK_DOCTORS[2],
    service: MOCK_SERVICES[2]
  },
  {
    id: 'a4',
    patient_id: 'p4',
    doctor_id: 'd4',
    service_id: 's4',
    status: 'in_progress',
    appointment_date: new Date().toISOString().split('T')[0],
    start_time: '10:30',
    booking_method: 'online',
    cabinet: '150',
    patient: MOCK_PATIENTS[3],
    doctor: MOCK_DOCTORS[3],
    service: MOCK_SERVICES[3]
  },
  {
    id: 'a5',
    patient_id: 'p5',
    doctor_id: 'd5',
    service_id: 's5',
    status: 'scheduled',
    appointment_date: new Date().toISOString().split('T')[0],
    start_time: '14:00',
    booking_method: 'phone',
    cabinet: '210',
    patient: MOCK_PATIENTS[4],
    doctor: MOCK_DOCTORS[4],
    service: MOCK_SERVICES[4]
  }
]

const MOCK_DASHBOARD: Dashboard = {
  total_appointments: 12,
  completed_appointments: 5,
  cancelled_appointments: 1,
  total_revenue: 1250000,
  new_patients: 8,
  waiting_patients: 3
}

// ==================== Token Management ====================

let currentUser: User | null = null
let accessToken: string | null = null

const generateToken = (): string => {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// ==================== Auth Service ====================

export const authService = {
  login: async (email: string, password: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user: User
  }> => {
    await new Promise(resolve => setTimeout(resolve, 500)) // Simulate network delay

    const user = MOCK_USERS.find(u => u.email === email)

    // Accept both old and new passwords for testing
    if (user && (password === 'Admin123456' || password === 'admin123')) {
      accessToken = generateToken()
      currentUser = user
      return {
        access_token: accessToken,
        refresh_token: generateToken(),
        expires_in: 900,
        user: user
      }
    }

    throw new Error('Invalid credentials')
  },

  refresh: async (refreshToken: string): Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
  }> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return {
      access_token: generateToken(),
      refresh_token: generateToken(),
      expires_in: 900
    }
  },

  logout: () => {
    accessToken = null
    currentUser = null
  },

  getCurrentUser: (): User | null => currentUser,

  isAuthenticated: (): boolean => currentUser !== null
}

// ==================== Patient Service ====================

export const patientService = {
  list: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    gender?: string
  }): Promise<{
    data: Patient[];
    total: number;
    page: number;
    limit: number;
    total_pages: number
  }> => {
    await new Promise(resolve => setTimeout(resolve, 300))

    let filtered = MOCK_PATIENTS.filter(p => p.is_active)

    if (params?.search) {
      const search = params.search.toLowerCase()
      filtered = filtered.filter(p =>
        p.first_name.toLowerCase().includes(search) ||
        p.last_name.toLowerCase().includes(search) ||
        p.phone.includes(search)
      )
    }

    if (params?.gender) {
      filtered = filtered.filter(p => p.gender === params.gender)
    }

    const page = params?.page || 1
    const limit = params?.limit || 20
    const start = (page - 1) * limit
    const end = start + limit

    return {
      data: filtered.slice(start, end),
      total: filtered.length,
      page,
      limit,
      total_pages: Math.ceil(filtered.length / limit)
    }
  },

  get: async (id: string): Promise<Patient> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    const patient = MOCK_PATIENTS.find(p => p.id === id)
    if (!patient) throw new Error('Patient not found')
    return patient
  },

  create: async (data: Partial<Patient>): Promise<Patient> => {
    await new Promise(resolve => setTimeout(resolve, 400))
    const newPatient: Patient = {
      id: `p${Date.now()}`,
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      birth_date: data.birth_date || '',
      gender: data.gender || 'male',
      phone: data.phone || '',
      email: data.email,
      citizenship: data.citizenship,
      address: data.address,
      deposit_balance: 0,
      is_active: true,
      created_at: new Date().toISOString()
    }
    MOCK_PATIENTS.push(newPatient)
    return newPatient
  },

  update: async (id: string, data: Partial<Patient>): Promise<Patient> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const index = MOCK_PATIENTS.findIndex(p => p.id === id)
    if (index === -1) throw new Error('Patient not found')
    MOCK_PATIENTS[index] = { ...MOCK_PATIENTS[index], ...data }
    return MOCK_PATIENTS[index]
  }
}

// ==================== Appointment Service ====================

export const appointmentService = {
  list: async (params?: {
    status?: string;
    date?: string;
    patient_id?: string;
    doctor_id?: string;
  }): Promise<{
    data: Appointment[];
    total: number;
    page: number;
    limit: number;
    total_pages: number
  }> => {
    await new Promise(resolve => setTimeout(resolve, 300))

    let filtered = [...MOCK_APPOINTMENTS]

    if (params?.status) {
      filtered = filtered.filter(a => a.status === params.status)
    }
    if (params?.date) {
      filtered = filtered.filter(a => a.appointment_date === params.date)
    }
    if (params?.patient_id) {
      filtered = filtered.filter(a => a.patient_id === params.patient_id)
    }
    if (params?.doctor_id) {
      filtered = filtered.filter(a => a.doctor_id === params.doctor_id)
    }

    return {
      data: filtered,
      total: filtered.length,
      page: 1,
      limit: 20,
      total_pages: 1
    }
  },

  get: async (id: string): Promise<Appointment> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    const appointment = MOCK_APPOINTMENTS.find(a => a.id === id)
    if (!appointment) throw new Error('Appointment not found')
    return appointment
  },

  create: async (data: Partial<Appointment>): Promise<Appointment> => {
    await new Promise(resolve => setTimeout(resolve, 400))
    const patient = MOCK_PATIENTS.find(p => p.id === data.patient_id)
    const doctor = MOCK_DOCTORS.find(d => d.id === data.doctor_id)

    const newAppointment: Appointment = {
      id: `a${Date.now()}`,
      patient_id: data.patient_id || '',
      doctor_id: data.doctor_id || '',
      service_id: data.service_id || '',
      status: 'scheduled',
      appointment_date: data.appointment_date || new Date().toISOString().split('T')[0],
      start_time: data.start_time || '09:00',
      booking_method: data.booking_method || 'online',
      notes: data.notes,
      patient,
      doctor
    }
    MOCK_APPOINTMENTS.push(newAppointment)
    return newAppointment
  },

  updateStatus: async (id: string, status: string): Promise<Appointment> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const index = MOCK_APPOINTMENTS.findIndex(a => a.id === id)
    if (index === -1) throw new Error('Appointment not found')
    MOCK_APPOINTMENTS[index].status = status as Appointment['status']
    return MOCK_APPOINTMENTS[index]
  }
}

// ==================== Staff Service ====================

export const staffService = {
  list: async (): Promise<Staff[]> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    return MOCK_DOCTORS
  },

  get: async (id: string): Promise<Staff> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    const staff = MOCK_DOCTORS.find(s => s.id === id)
    if (!staff) throw new Error('Staff not found')
    return staff
  }
}

// ==================== Reference Service ====================

export const referenceService = {
  services: async (): Promise<Service[]> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    return MOCK_SERVICES
  },

  serviceGroups: async (): Promise<{ id: string; name: string }[]> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    return [
      { id: 'g1', name: 'Consultations' },
      { id: 'g2', name: 'Diagnostics' },
      { id: 'g3', name: 'Laboratory' },
      { id: 'g4', name: 'Procedures' }
    ]
  },

  paymentMethods: async (): Promise<string[]> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    return ['cash', 'card', 'transfer', 'deposit']
  },

  roles: async (): Promise<{ id: string; name: string }[]> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    return [
      { id: 'clinic_admin', name: 'Clinic Administrator' },
      { id: 'doctor', name: 'Doctor' },
      { id: 'registrar', name: 'Registrar' },
      { id: 'cashier', name: 'Cashier' },
      { id: 'lab_tech', name: 'Lab Technician' }
    ]
  }
}

// ==================== Analytics Service ====================

export const analyticsService = {
  dashboard: async (): Promise<Dashboard> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return MOCK_DASHBOARD
  },

  appointments: async (): Promise<Appointment[]> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    return MOCK_APPOINTMENTS
  },

  revenue: async (): Promise<{ data: { date: string; amount: number }[] }> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    return {
      data: [
        { date: '2026-06-01', amount: 450000 },
        { date: '2026-06-02', amount: 380000 },
        { date: '2026-06-03', amount: 520000 },
        { date: '2026-06-04', amount: 410000 },
        { date: '2026-06-05', amount: 480000 },
        { date: '2026-06-06', amount: 350000 },
        { date: '2026-06-07', amount: 420000 }
      ]
    }
  }
}

// ==================== Queue Service ====================

// Queue data
let queueEntries = [
  { id: 'qe1', queue_id: 'q1', queue_number: 1, patient_id: 'p1', status: 'waiting', cabinet: '101', called_at: null },
  { id: 'qe2', queue_id: 'q1', queue_number: 2, patient_id: 'p2', status: 'waiting', cabinet: '101', called_at: null },
  { id: 'qe3', queue_id: 'q1', queue_number: 3, patient_id: 'p3', status: 'called', cabinet: '101', called_at: new Date().toISOString() },
  { id: 'qe4', queue_id: 'q2', queue_number: 1, patient_id: 'p4', status: 'waiting', cabinet: '205', called_at: null },
  { id: 'qe5', queue_id: 'q2', queue_number: 2, patient_id: 'p5', status: 'completed', cabinet: '205', called_at: new Date(Date.now() - 1800000).toISOString() },
]

export const queueService = {
  list: async (): Promise<{ data: { id: string; name: string; count: number }[] }> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    return {
      data: [
        { id: 'q1', name: 'Umumiy navbat', count: queueEntries.filter(e => e.queue_id === 'q1' && e.status !== 'completed').length },
        { id: 'q2', name: 'Kardiologiya navbati', count: queueEntries.filter(e => e.queue_id === 'q2' && e.status !== 'completed').length },
        { id: 'q3', name: 'Pediatriya navbati', count: 4 }
      ]
    }
  },

  get: async (queueId: string): Promise<{ queue: any; entries: any[] }> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    const queueNames: Record<string, string> = {
      'q1': 'Umumiy navbat',
      'q2': 'Kardiologiya navbati',
      'q3': 'Pediatriya navbati'
    }
    const entries = queueEntries
      .filter(e => e.queue_id === queueId)
      .map(e => ({
        ...e,
        patient: MOCK_PATIENTS.find(p => p.id === e.patient_id)
      }))

    return {
      queue: { id: queueId, name: queueNames[queueId] || 'Queue' },
      entries
    }
  },

  callNext: async (queueId: string): Promise<{ entry: any }> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const waiting = queueEntries.find(e => e.queue_id === queueId && e.status === 'waiting')
    if (!waiting) throw new Error('No patients in queue')

    const index = queueEntries.findIndex(e => e.id === waiting.id)
    queueEntries[index].status = 'called'
    queueEntries[index].called_at = new Date().toISOString()

    return { entry: queueEntries[index] }
  },

  complete: async (entryId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    const index = queueEntries.findIndex(e => e.id === entryId)
    if (index === -1) throw new Error('Entry not found')
    queueEntries[index].status = 'completed'
  }
}

// ==================== Cashier Service ====================

// Cashier transactions data
const cashierTransactions = [
  { id: 'ct1', patient_name: 'Rahimov Alisher', type: 'payment', amount: 50000, payment_method: 'cash', service_name: 'Umumiy maslahat', cashier_name: 'Admin', time: '09:15', date: new Date().toISOString().split('T')[0] },
  { id: 'ct2', patient_name: 'Tursunova Dilshoda', type: 'payment', amount: 80000, payment_method: 'card', service_name: 'Kardiologiya maslahati', cashier_name: 'Admin', time: '09:30', date: new Date().toISOString().split('T')[0] },
  { id: 'ct3', patient_name: 'Abdullayev Jasur', type: 'payment', amount: 35000, payment_method: 'cash', service_name: 'EKG', cashier_name: 'Admin', time: '10:00', date: new Date().toISOString().split('T')[0] },
  { id: 'ct4', patient_name: 'Nazarova Sevara', type: 'refund', amount: 15000, payment_method: 'cash', service_name: 'Rentgen', cashier_name: 'Admin', time: '10:30', date: new Date().toISOString().split('T')[0] },
  { id: 'ct5', patient_name: 'Qodirov Bekzod', type: 'payment', amount: 60000, payment_method: 'transfer', service_name: 'UTT', cashier_name: 'Admin', time: '11:00', date: new Date().toISOString().split('T')[0] },
]

export const cashierService = {
  getTransactions: async (params?: { date?: string; type?: string }): Promise<{ data: any[] }> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    let filtered = [...cashierTransactions]

    if (params?.date) {
      filtered = filtered.filter(t => t.date === params.date)
    }

    return { data: filtered }
  },

  getSummary: async (params?: { date?: string }): Promise<{ total_paid: number; total_refunded: number; total_debt: number; transaction_count: number }> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    return {
      total_paid: 2450000,
      total_refunded: 120000,
      total_debt: 380000,
      transaction_count: 47
    }
  },

  createPayment: async (data: { patient_id?: string; amount: number; payment_method: string; notes?: string }): Promise<{ id: string }> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const newTransaction = {
      id: `ct${Date.now()}`,
      patient_name: 'Bemor',
      type: 'payment',
      amount: data.amount,
      payment_method: data.payment_method,
      service_name: data.notes || 'Xizmat',
      cashier_name: 'Admin',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      date: new Date().toISOString().split('T')[0]
    }
    cashierTransactions.unshift(newTransaction)
    return { id: newTransaction.id }
  },

  createRefund: async (data: { transaction_id: string; amount: number; reason: string }): Promise<{ id: string }> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const newTransaction = {
      id: `ct${Date.now()}`,
      patient_name: 'Bemor',
      type: 'refund',
      amount: -data.amount,
      payment_method: 'cash',
      service_name: data.reason || 'Qaytarish',
      cashier_name: 'Admin',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      date: new Date().toISOString().split('T')[0]
    }
    cashierTransactions.unshift(newTransaction)
    return { id: newTransaction.id }
  }
}

// Health check
export const healthService = {
  check: async (): Promise<{ status: string; timestamp: string; mode: string }> => {
    await new Promise(resolve => setTimeout(resolve, 100))
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      mode: 'mock'
    }
  }
}

export default {
  auth: authService,
  patients: patientService,
  appointments: appointmentService,
  staff: staffService,
  reference: referenceService,
  analytics: analyticsService,
  queue: queueService,
  cashier: cashierService,
  health: healthService
}