import axios from 'axios'

// API Configuration
// For production with nginx proxy: Set VITE_API_URL=/api/v1
// For local dev: Set VITE_API_URL=http://localhost:8080/api/v1
const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  clinic_id?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  user: User
}

export interface Patient {
  id: string
  clinic_id?: string
  med_id?: string  // LIFE-ID
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
  passport?: string
  deposit_balance: number
  is_active: boolean
  created_at: string
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
  cabinet?: string
  notes?: string
  patient?: Patient
  doctor?: Staff
  service?: Service
}

export interface Staff {
  id: string
  first_name: string
  last_name: string
  patronymic?: string
  specialty?: string
  position?: string
  cabinet?: string
  photo_url?: string
}

export interface Service {
  id: string
  name: string
  description?: string
  duration: number
  base_price: number
  group_id: string
}

export interface Invoice {
  id: string
  patient_id: string
  total_amount: number
  discount_amount: number
  paid_amount: number
  status: 'open' | 'partially_paid' | 'paid' | 'cancelled'
  created_at: string
  patient?: Patient
  items?: InvoiceItem[]
}

export interface InvoiceItem {
  id: string
  service_name: string
  quantity: number
  unit_price: number
  discount: number
  total_price: number
}

export interface Queue {
  id: string
  name: string
  queue_type: 'appointment' | 'live'
  is_active: boolean
}

export interface QueueEntry {
  id: string
  queue_id: string
  patient_id: string
  queue_number: number
  status: 'waiting' | 'called' | 'completed' | 'cancelled'
  registered_at: string
  called_at?: string
  cabinet?: string
  patient?: Patient
}

export interface Episode {
  id: string
  patient_id: string
  doctor_id: string
  title: string
  status: 'active' | 'completed' | 'cancelled'
  conclusion?: string
  started_at: string
  completed_at?: string
  doctor?: Staff
}

export interface Dashboard {
  total_appointments: number
  completed_appointments: number
  cancelled_appointments: number
  total_revenue: number
  new_patients: number
  waiting_patients: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('amis_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('amis_refresh_token')
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          })
          localStorage.setItem('amis_token', response.data.access_token)
          localStorage.setItem('amis_refresh_token', response.data.refresh_token)
          error.config.headers.Authorization = `Bearer ${response.data.access_token}`
          return api.request(error.config)
        } catch {
          localStorage.removeItem('amis_token')
          localStorage.removeItem('amis_refresh_token')
          localStorage.removeItem('amis_user')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data)
    return response.data
  },
  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken })
    return response.data
  },
}

export const staffService = {
  list: async (params?: { page?: number; limit?: number; specialty?: string }) => {
    const response = await api.get('/staff', { params })
    return response.data as PaginatedResponse<Staff>
  },
  listDoctors: async () => {
    const response = await api.get('/staff/doctors')
    return response.data as PaginatedResponse<Staff>
  },
  get: async (id: string) => {
    const response = await api.get(`/staff/${id}`)
    return response.data as Staff
  },
  create: async (data: {
    branch_id?: string
    user_id?: string
    first_name: string
    last_name: string
    patronymic?: string
    specialty?: string
    position: string
    phone: string
    cabinet?: string
    schedule?: string
    qualification?: string
    photo_url?: string
  }) => {
    const response = await api.post('/staff', data)
    return response.data as Staff
  },
  update: async (id: string, data: Partial<{
    first_name: string
    last_name: string
    patronymic: string
    specialty: string
    position: string
    phone: string
    cabinet: string
    schedule: string
    qualification: string
    photo_url: string
  }>) => {
    const response = await api.put(`/staff/${id}`, data)
    return response.data as Staff
  },
  deactivate: async (id: string) => {
    const response = await api.delete(`/staff/${id}`)
    return response.data
  },
}

export const patientService = {
  list: async (params?: {
    page?: number
    limit?: number
    search?: string
    gender?: string
    citizenship?: string
  }) => {
    const response = await api.get('/patients', { params })
    return response.data as PaginatedResponse<Patient>
  },
  get: async (id: string) => {
    const response = await api.get(`/patients/${id}`)
    return response.data as Patient
  },
  create: async (data: Partial<Patient>) => {
    const response = await api.post('/patients', data)
    return response.data as Patient
  },
  update: async (id: string, data: Partial<Patient>) => {
    const response = await api.put(`/patients/${id}`, data)
    return response.data as Patient
  },
  medicalCard: async (id: string) => {
    const response = await api.get(`/patients/${id}/medical-card`)
    return response.data
  },
}

// Medical Card Types
export interface MedicalCard {
  id: string
  clinic_id: string
  patient_id: string
  blood_type?: string
  rh_factor?: string
  allergies?: string
  chronic_conditions?: string
  family_history?: string
  created_at: string
  updated_at: string
}

export interface Episode {
  id: string
  patient_id: string
  clinic_id: string
  branch_id?: string
  doctor_id: string
  title: string
  status: 'active' | 'completed' | 'cancelled'
  conclusion?: string
  started_at: string
  completed_at?: string
  created_at: string
  updated_at: string
  doctor?: Staff
}

export interface Vitals {
  id: string
  episode_id: string
  height?: number
  weight?: number
  temperature?: number
  bp_systolic?: number
  bp_diastolic?: number
  pulse?: number
  blood_sugar?: number
  waist?: number
  head_circumference?: number
  chest_circumference?: number
  comments?: string
  recorded_at: string
}

export interface Diagnosis {
  id: string
  episode_id: string
  icd_code: string
  icd_name: string
  type: 'main' | 'secondary'
  status: string
  notes?: string
  created_at: string
}

export interface Recommendation {
  id: string
  episode_id: string
  type: string
  service_id?: string
  description: string
  instructions?: string
  status: string
  created_at: string
}

// Medical Card Services
export const medicalCardService = {
  // Get patient medical card
  getMedicalCard: async (patientId: string) => {
    const response = await api.get(`/patients/${patientId}/medical-card`)
    return response.data as { data: MedicalCard | null }
  },

  // Update medical card
  updateMedicalCard: async (patientId: string, data: Partial<MedicalCard>) => {
    const response = await api.put(`/patients/${patientId}/medical-card`, data)
    return response.data
  },

  // Get patient episodes
  getEpisodes: async (patientId: string, limit = 50) => {
    const response = await api.get(`/patients/${patientId}/episodes`, { params: { limit } })
    return response.data as { data: Episode[] }
  },

  // Create episode
  createEpisode: async (patientId: string, data: {
    title: string
    doctor_id: string
    referral_doctor_id?: string
    appointment_id?: string
  }) => {
    const response = await api.post(`/patients/${patientId}/episodes`, data)
    return response.data as { data: Episode }
  },

  // Get episode by ID
  getEpisode: async (episodeId: string) => {
    const response = await api.get(`/episodes/${episodeId}`)
    return response.data as { data: Episode }
  },

  // Complete episode
  completeEpisode: async (episodeId: string, conclusion?: string) => {
    const response = await api.post(`/episodes/${episodeId}/complete`, { conclusion })
    return response.data
  },

  // Get episode vitals (anthropometry)
  getEpisodeVitals: async (episodeId: string) => {
    const response = await api.get(`/episodes/${episodeId}/anthropometry`)
    return response.data as { data: Vitals | null }
  },

  // Create/update episode vitals
  saveEpisodeVitals: async (episodeId: string, data: {
    height?: number
    weight?: number
    temperature?: number
    bp_systolic?: number
    bp_diastolic?: number
    pulse?: number
    blood_sugar?: number
    waist?: number
    comments?: string
  }) => {
    const response = await api.post(`/episodes/${episodeId}/anthropometry`, data)
    return response.data
  },

  // Get episode diagnoses
  getEpisodeDiagnoses: async (episodeId: string) => {
    const response = await api.get(`/episodes/${episodeId}/diagnoses`)
    return response.data as { data: Diagnosis[] }
  },

  // Create diagnosis
  createDiagnosis: async (episodeId: string, data: {
    icd_code: string
    icd_name: string
    type: string
    status?: string
    notes?: string
  }) => {
    const response = await api.post(`/episodes/${episodeId}/diagnoses`, data)
    return response.data as { data: Diagnosis }
  },

  // Get episode recommendations
  getEpisodeRecommendations: async (episodeId: string) => {
    const response = await api.get(`/episodes/${episodeId}/recommendations`)
    return response.data as { data: Recommendation[] }
  },
}

export const appointmentService = {
  list: async (params?: {
    page?: number
    limit?: number
    patient_id?: string
    doctor_id?: string
    status?: string
    date_from?: string
    date_to?: string
  }) => {
    const response = await api.get('/appointments', { params })
    return response.data as PaginatedResponse<Appointment>
  },
  get: async (id: string) => {
    const response = await api.get(`/appointments/${id}`)
    return response.data as Appointment
  },
  create: async (data: {
    patient_id: string
    doctor_id: string
    service_id: string
    appointment_date: string
    start_time: string
    booking_method?: string
    notes?: string
  }) => {
    const response = await api.post('/appointments', data)
    return response.data as Appointment
  },
  updateStatus: async (id: string, status: string, cancel_reason?: string) => {
    const response = await api.patch(`/appointments/${id}`, { status, cancel_reason })
    return response.data as Appointment
  },
  calendar: async (params: { doctor_id?: string; date: string; branch_id?: string }) => {
    const response = await api.get('/appointments/calendar', { params })
    return response.data
  },
}

export const doctorService = {
  todayAppointments: async (date?: string) => {
    const response = await api.get('/doctor/appointments/today', { params: { date } })
    return response.data
  },
  patients: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/doctor/patients', { params })
    return response.data
  },
  startEncounter: async (data: { appointment_id?: string; episode_id: string; complaints?: string }) => {
    const response = await api.post('/doctor/encounter/start', data)
    return response.data
  },
  completeEncounter: async (data: { episode_id: string; examination?: string; notes?: string; conclusion?: string }) => {
    const response = await api.post('/doctor/encounter/complete', data)
    return response.data
  },
  recordVitals: async (data: {
    episode_id: string
    height?: number
    weight?: number
    temperature?: number
    bp_systolic?: number
    bp_diastolic?: number
    pulse?: number
    blood_sugar?: number
    waist?: number
    comments?: string
  }) => {
    const response = await api.post('/doctor/vitals', data)
    return response.data
  },
  addDiagnosis: async (data: {
    episode_id: string
    icd_code: string
    icd_name: string
    type: string
    status?: string
    notes?: string
  }) => {
    const response = await api.post('/doctor/diagnosis', data)
    return response.data
  },
  addRecommendation: async (data: {
    episode_id: string
    type: string
    service_id?: string
    description: string
    instructions?: string
  }) => {
    const response = await api.post('/doctor/recommendation', data)
    return response.data
  },
  statistics: async () => {
    const response = await api.get('/doctor/statistics')
    return response.data
  },
}

export const cashierService = {
  invoices: async (params?: { page?: number; limit?: number; status?: string; patient_id?: string }) => {
    const response = await api.get('/cashier/invoices', { params })
    return response.data as PaginatedResponse<Invoice>
  },
  invoiceDetails: async (id: string) => {
    const response = await api.get(`/cashier/invoices/${id}`)
    return response.data as Invoice
  },
  pay: async (id: string, data: { payment_method: string; amount: number; reference?: string }) => {
    const response = await api.post(`/cashier/invoices/${id}/pay`, data)
    return response.data
  },
  refund: async (id: string, data: { payment_id: string; amount: number; reason: string }) => {
    const response = await api.post(`/cashier/invoices/${id}/refund`, data)
    return response.data
  },
  statistics: async (params?: { date_from?: string; date_to?: string }) => {
    const response = await api.get('/cashier/statistics', { params })
    return response.data
  },
}

export const queueService = {
  list: async () => {
    const response = await api.get('/queues')
    return response.data
  },
  // List all queue entries across all queues — for dashboard KPI
  listAllEntries: async (status?: string) => {
    const params = status ? { status } : {}
    const response = await api.get('/queues/entries', { params })
    return response.data as { data: any[]; total: number }
  },
  get: async (id: string, status?: string) => {
    const params = status ? { status } : {}
    const response = await api.get(`/queues/${id}`, { params })
    return response.data
  },
  create: async (data: { name: string; queue_type: string; settings?: any }) => {
    const response = await api.post('/queues', data)
    return response.data
  },
  register: async (data: { queue_id: string; patient_id: string; appointment_id?: string; cabinet?: string; doctor_id?: string }) => {
    const response = await api.post('/queues/register', data)
    return response.data
  },
  callNext: async (queueId: string) => {
    const response = await api.post(`/queues/${queueId}/call-next`)
    return response.data
  },
  complete: async (entryId: string) => {
    const response = await api.post(`/queues/complete/${entryId}`)
    return response.data
  },
  // Skip entry — move to skipped status
  skip: async (entryId: string) => {
    const response = await api.patch(`/queues/entries/${entryId}`, { status: 'skipped' })
    return response.data
  },
  // Cancel entry — move to cancelled status
  cancel: async (entryId: string) => {
    const response = await api.patch(`/queues/entries/${entryId}`, { status: 'cancelled' })
    return response.data
  },
  // Call a specific entry
  callSpecific: async (entryId: string, cabinet?: string, doctorId?: string) => {
    const response = await api.patch(`/queues/entries/${entryId}`, {
      status: 'called',
      called_at: new Date().toISOString(),
      cabinet,
      doctor_id: doctorId,
    })
    return response.data
  },
}

export const lisService = {
  orders: async (params?: { page?: number; limit?: number; status?: string; patient_id?: string }) => {
    const response = await api.get('/lis/orders', { params })
    return response.data as PaginatedResponse<any>
  },
  collect: async (orderId: string, sampleType: string) => {
    const response = await api.post(`/lis/orders/${orderId}/collect`, { sample_type: sampleType })
    return response.data
  },
  submitResults: async (orderId: string, items: { item_id: string; result: string }[]) => {
    const response = await api.post(`/lis/orders/${orderId}/results`, { items })
    return response.data
  },
  confirm: async (orderId: string) => {
    const response = await api.post(`/lis/orders/${orderId}/confirm`)
    return response.data
  },
}

export const analyticsService = {
  dashboard: async (params?: { clinic_id?: string; date_from?: string; date_to?: string }) => {
    const response = await api.get('/analytics/dashboard', { params })
    return response.data as Dashboard
  },
  revenue: async (params?: { date_from?: string; date_to?: string; group_by?: string }) => {
    const response = await api.get('/analytics/revenue', { params })
    return response.data
  },
  appointments: async (params?: { date_from?: string; date_to?: string }) => {
    const response = await api.get('/analytics/appointments', { params })
    return response.data
  },
}

// Patient Profile Types
export interface PatientProfile {
  id: string
  patient_id: string
  blood_type?: string
  rh_factor?: string
  height?: number
  weight?: number
  allergies?: string[]
  chronic_diseases?: string[]
  disabilities?: string
  notes?: string
  is_active: boolean
}

export interface PatientDocument {
  id: string
  patient_id: string
  document_type: string
  document_number?: string
  issued_by?: string
  issue_date?: string
  expiry_date?: string
  file_path?: string
  notes?: string
  is_primary: boolean
  is_verified: boolean
  created_at: string
}

export interface PatientContact {
  id: string
  patient_id: string
  contact_name: string
  relationship?: string
  phone?: string
  phone_2?: string
  email?: string
  address?: string
  is_emergency: boolean
  is_primary: boolean
  is_active: boolean
  created_at: string
}

export interface PatientRelative {
  id: string
  patient_id: string
  relative_name: string
  relationship: string
  birth_date?: string
  gender?: string
  phone?: string
  email?: string
  address?: string
  occupation?: string
  is_emergency_contact: boolean
  is_next_of_kin: boolean
  is_active: boolean
  created_at: string
}

export interface PatientAllergy {
  id: string
  patient_id: string
  allergen: string
  allergen_type?: string
  severity?: string
  reaction?: string
  onset_date?: string
  is_verified: boolean
  is_active: boolean
  created_at: string
}

export interface DepositTransaction {
  id: string
  patient_id: string
  transaction_type: string
  amount: number
  balance_before: number
  balance_after: number
  payment_method?: string
  reference?: string
  description?: string
  is_reversed: boolean
  created_at: string
}

export interface DeathInfo {
  id: string
  patient_id: string
  death_date?: string
  death_place?: string
  death_cause?: string
  icd_code?: string
  icd_name?: string
  certificate_number?: string
  certificate_issued_by?: string
  certificate_issued_date?: string
  is_verified: boolean
  created_at: string
}

export interface PatientQuestionnaire {
  id: string
  patient_id: string
  questionnaire_type: string
  questionnaire_name?: string
  responses: Record<string, any>
  score?: number
  risk_level?: string
  completed_at?: string
  is_critical: boolean
  is_active: boolean
  created_at: string
}

// Patient Profile Service
export const patientProfileService = {
  // Patient Profile (basic medical data)
  getProfile: async (patientId: string) => {
    const response = await api.get(`/patients/${patientId}/profile`)
    return response.data as PatientProfile
  },
  updateProfile: async (patientId: string, data: Partial<PatientProfile>) => {
    const response = await api.put(`/patients/${patientId}/profile`, data)
    return response.data
  },

  // Patient Documents
  getDocuments: async (patientId: string) => {
    const response = await api.get(`/patients/${patientId}/documents`)
    return response.data as { data: PatientDocument[] }
  },
  createDocument: async (patientId: string, data: {
    document_type: string
    document_number?: string
    issued_by?: string
    issue_date?: string
    expiry_date?: string
    file_path?: string
    notes?: string
    is_primary?: boolean
  }) => {
    const response = await api.post(`/patients/${patientId}/documents`, data)
    return response.data as PatientDocument
  },
  updateDocument: async (patientId: string, documentId: string, data: Partial<PatientDocument>) => {
    const response = await api.put(`/patients/${patientId}/documents/${documentId}`, data)
    return response.data
  },
  deleteDocument: async (patientId: string, documentId: string) => {
    const response = await api.delete(`/patients/${patientId}/documents/${documentId}`)
    return response.data
  },

  // Patient Contacts
  getContacts: async (patientId: string) => {
    const response = await api.get(`/patients/${patientId}/contacts`)
    return response.data as { data: PatientContact[] }
  },
  createContact: async (patientId: string, data: {
    contact_name: string
    relationship?: string
    phone?: string
    phone_2?: string
    email?: string
    address?: string
    is_emergency?: boolean
    is_primary?: boolean
    notes?: string
  }) => {
    const response = await api.post(`/patients/${patientId}/contacts`, data)
    return response.data as PatientContact
  },
  updateContact: async (patientId: string, contactId: string, data: Partial<PatientContact>) => {
    const response = await api.put(`/patients/${patientId}/contacts/${contactId}`, data)
    return response.data
  },
  deleteContact: async (patientId: string, contactId: string) => {
    const response = await api.delete(`/patients/${patientId}/contacts/${contactId}`)
    return response.data
  },

  // Patient Relatives
  getRelatives: async (patientId: string) => {
    const response = await api.get(`/patients/${patientId}/relatives`)
    return response.data as { data: PatientRelative[] }
  },
  createRelative: async (patientId: string, data: {
    relative_name: string
    relationship: string
    birth_date?: string
    gender?: string
    phone?: string
    email?: string
    address?: string
    occupation?: string
    is_emergency_contact?: boolean
    is_next_of_kin?: boolean
    notes?: string
  }) => {
    const response = await api.post(`/patients/${patientId}/relatives`, data)
    return response.data as PatientRelative
  },
  updateRelative: async (patientId: string, relativeId: string, data: Partial<PatientRelative>) => {
    const response = await api.put(`/patients/${patientId}/relatives/${relativeId}`, data)
    return response.data
  },
  deleteRelative: async (patientId: string, relativeId: string) => {
    const response = await api.delete(`/patients/${patientId}/relatives/${relativeId}`)
    return response.data
  },

  // Patient Allergies
  getAllergies: async (patientId: string) => {
    const response = await api.get(`/patients/${patientId}/allergies`)
    return response.data as { data: PatientAllergy[] }
  },
  createAllergy: async (patientId: string, data: {
    allergen: string
    allergen_type?: string
    severity?: string
    reaction?: string
    onset_date?: string
    is_verified?: boolean
    notes?: string
  }) => {
    const response = await api.post(`/patients/${patientId}/allergies`, data)
    return response.data as PatientAllergy
  },
  updateAllergy: async (patientId: string, allergyId: string, data: Partial<PatientAllergy>) => {
    const response = await api.put(`/patients/${patientId}/allergies/${allergyId}`, data)
    return response.data
  },
  deleteAllergy: async (patientId: string, allergyId: string) => {
    const response = await api.delete(`/patients/${patientId}/allergies/${allergyId}`)
    return response.data
  },

  // Deposit Transactions
  getDepositTransactions: async (patientId: string) => {
    const response = await api.get(`/patients/${patientId}/deposit-transactions`)
    return response.data as { data: DepositTransaction[]; total: number }
  },
  createDepositTransaction: async (patientId: string, data: {
    transaction_type: string
    amount: number
    payment_method?: string
    reference?: string
    description?: string
  }) => {
    const response = await api.post(`/patients/${patientId}/deposit-transactions`, data)
    return response.data as DepositTransaction
  },

  // Death Info
  getDeathInfo: async (patientId: string) => {
    const response = await api.get(`/patients/${patientId}/death-info`)
    return response.data as DeathInfo
  },
  updateDeathInfo: async (patientId: string, data: Partial<DeathInfo>) => {
    const response = await api.put(`/patients/${patientId}/death-info`, data)
    return response.data
  },

  // Questionnaires
  getQuestionnaires: async (patientId: string) => {
    const response = await api.get(`/patients/${patientId}/questionnaires`)
    return response.data as { data: PatientQuestionnaire[] }
  },
  createQuestionnaire: async (patientId: string, data: {
    questionnaire_id: string
    questionnaire_title?: string
    version?: string
    responses: Record<string, any>
    score?: number
    risk_level?: string
    is_complete?: boolean
    completed_at?: string
    expires_at?: string
    notes?: string
  }) => {
    const response = await api.post(`/patients/${patientId}/questionnaires`, data)
    return response.data as PatientQuestionnaire
  },
  updateQuestionnaire: async (patientId: string, questionnaireId: string, data: Partial<PatientQuestionnaire>) => {
    const response = await api.put(`/patients/${patientId}/questionnaires/${questionnaireId}`, data)
    return response.data
  },
  deleteQuestionnaire: async (patientId: string, questionnaireId: string) => {
    const response = await api.delete(`/patients/${patientId}/questionnaires/${questionnaireId}`)
    return response.data
  },
}

export const clinicService = {
  list: async () => {
    const response = await api.get('/clinics')
    return response.data as { data: any[]; total: number }
  },
  get: async (id: string) => {
    const response = await api.get(`/clinics/${id}`)
    return response.data
  },
  create: async (data: any) => {
    const response = await api.post('/clinics', data)
    return response.data
  },
  update: async (id: string, data: any) => {
    const response = await api.put(`/clinics/${id}`, data)
    return response.data
  },
}

export const branchService = {
  list: async () => {
    const response = await api.get('/branches')
    return response.data as { data: any[]; total: number }
  },
  get: async (id: string) => {
    const response = await api.get(`/branches/${id}`)
    return response.data
  },
  create: async (data: any) => {
    const response = await api.post('/branches', data)
    return response.data
  },
  update: async (id: string, data: any) => {
    const response = await api.put(`/branches/${id}`, data)
    return response.data
  },
}

export const userService = {
  list: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/users', { params })
    return response.data as { data: any[]; total: number }
  },
  get: async (id: string) => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },
  create: async (data: any) => {
    const response = await api.post('/users', data)
    return response.data
  },
  update: async (id: string, data: any) => {
    const response = await api.put(`/users/${id}`, data)
    return response.data
  },
  deactivate: async (id: string) => {
    const response = await api.delete(`/users/${id}`)
    return response.data
  },
  profile: async () => {
    const response = await api.get('/users/profile')
    return response.data
  },
}

export const referenceService = {
  // Returns individual service rows from /services (queries services table directly).
  // Use this for the service selection dropdown in appointment forms.
  list: async () => {
    const response = await api.get('/services')
    return response.data as Service[]
  },
  // Legacy /references/services — returns service groups (kept for compatibility)
  services: async (params?: { group_id?: string; search?: string }) => {
    const response = await api.get('/references/services', { params })
    return response.data as Service[]
  },
  serviceGroups: async () => {
    const response = await api.get('/references/services-groups')
    return response.data
  },
  icd10: async (params?: { search?: string; parent_id?: string }) => {
    const response = await api.get('/references/icd10', { params })
    return response.data
  },
  territories: async () => {
    const response = await api.get('/references/territories')
    return response.data
  },
  paymentMethods: async () => {
    const response = await api.get('/references/payment-methods')
    return response.data as string[]
  },
}

export default api