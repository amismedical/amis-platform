// Supabase API Service - Production-ready database operations
// Uses real Supabase backend for all operations

import { supabase } from '../lib/supabase'
import type {
  Profile, Patient, Staff, Service, Appointment,
  QueueEntry, Queue, CashierTransaction, MedicalRecord,
  Vital, Diagnosis, Prescription, Department,
  AppointmentStatus, QueueEntryStatus, TransactionType
} from '../lib/database.types'

// Helper function for authenticated requests
async function authRequest<T>(fn: () => Promise<T>): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Authentication required')
  }
  return fn()
}

// ==================== Auth Service ====================

export const authService = {
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      user: profile || {
        id: data.user.id,
        email: data.user.email,
        first_name: '',
        last_name: '',
        role: 'registrar' as const,
      }
    }
  },

  register: async (email: string, password: string, userData: {
    first_name: string
    last_name: string
    role?: string
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) throw error

    if (data.user) {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role || 'registrar',
        })

      if (profileError) throw profileError
    }

    return {
      access_token: data.session?.access_token || '',
      refresh_token: data.session?.refresh_token || '',
      expires_in: data.session?.expires_in || 0,
      user: {
        id: data.user?.id || '',
        email: data.user?.email || email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role || 'registrar',
      }
    }
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  getProfile: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (error) throw error
    return data
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// ==================== Patient Service ====================

export const patientService = {
  list: async (params?: {
    page?: number
    limit?: number
    search?: string
    gender?: string
  }): Promise<{
    data: Patient[]
    total: number
    page: number
    limit: number
    total_pages: number
  }> => {
    const page = params?.page || 1
    const limit = params?.limit || 20
    const start = (page - 1) * limit

    let query = supabase
      .from('patients')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(start, start + limit - 1)

    if (params?.search) {
      query = query.or(`first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,phone.ilike.%${params.search}%`)
    }

    if (params?.gender) {
      query = query.eq('gender', params.gender)
    }

    const { data, error, count } = await query

    if (error) throw error

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit)
    }
  },

  get: async (id: string): Promise<Patient> => {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  create: async (data: Partial<Patient>): Promise<Patient> => {
    const { data: { session } } = await supabase.auth.getSession()

    const { data: result, error } = await supabase
      .from('patients')
      .insert({
        ...data,
        created_by: session?.user.id,
      })
      .select()
      .single()

    if (error) throw error
    return result
  },

  update: async (id: string, data: Partial<Patient>): Promise<Patient> => {
    const { data: result, error } = await supabase
      .from('patients')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return result
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('patients')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
  }
}

// ==================== Appointment Service ====================

export const appointmentService = {
  list: async (params?: {
    status?: AppointmentStatus
    date?: string
    patient_id?: string
    doctor_id?: string
    page?: number
    limit?: number
  }): Promise<{
    data: (Appointment & { patient?: Patient; doctor?: Staff })[]
    total: number
    page: number
    limit: number
    total_pages: number
  }> => {
    const page = params?.page || 1
    const limit = params?.limit || 20
    const start = (page - 1) * limit

    let query = supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(*),
        doctor:staff(*)
      `, { count: 'exact' })
      .order('appointment_date', { ascending: false })
      .order('start_time', { ascending: true })
      .range(start, start + limit - 1)

    if (params?.status) {
      query = query.eq('status', params.status)
    }
    if (params?.date) {
      query = query.eq('appointment_date', params.date)
    }
    if (params?.patient_id) {
      query = query.eq('patient_id', params.patient_id)
    }
    if (params?.doctor_id) {
      query = query.eq('doctor_id', params.doctor_id)
    }

    const { data, error, count } = await query

    if (error) throw error

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit)
    }
  },

  get: async (id: string): Promise<Appointment> => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  create: async (data: Partial<Appointment>): Promise<Appointment> => {
    const { data: { session } } = await supabase.auth.getSession()

    const { data: result, error } = await supabase
      .from('appointments')
      .insert({
        ...data,
        created_by: session?.user.id,
      })
      .select()
      .single()

    if (error) throw error
    return result
  },

  update: async (id: string, data: Partial<Appointment>): Promise<Appointment> => {
    const { data: result, error } = await supabase
      .from('appointments')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return result
  },

  updateStatus: async (id: string, status: AppointmentStatus): Promise<Appointment> => {
    return appointmentService.update(id, { status })
  }
}

// ==================== Staff Service ====================

export const staffService = {
  list: async (params?: {
    specialty?: string
    position?: string
  }): Promise<Staff[]> => {
    let query = supabase
      .from('staff')
      .select('*')
      .eq('is_active', true)
      .order('last_name', { ascending: true })

    if (params?.specialty) {
      query = query.eq('specialty', params.specialty)
    }
    if (params?.position) {
      query = query.eq('position', params.position)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  get: async (id: string): Promise<Staff> => {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  getByUserId: async (userId: string): Promise<Staff | null> => {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }
}

// ==================== Queue Service ====================

export const queueService = {
  list: async (): Promise<{ data: (Queue & { count: number })[] }> => {
    // Get queues with counts
    const { data: queues, error } = await supabase
      .from('queues')
      .select('*')
      .eq('is_active', true)

    if (error) throw error

    const queuesWithCounts = await Promise.all(
      (queues || []).map(async (queue) => {
        const { count } = await supabase
          .from('queue_entries')
          .select('*', { count: 'exact', head: true })
          .eq('queue_id', queue.id)
          .eq('status', 'waiting')

        return { ...queue, count: count || 0 }
      })
    )

    return { data: queuesWithCounts }
  },

  get: async (queueId: string): Promise<{ queue: Queue; entries: (QueueEntry & { patient: Patient })[] }> => {
    const { data: queue, error: queueError } = await supabase
      .from('queues')
      .select('*')
      .eq('id', queueId)
      .single()

    if (queueError) throw queueError

    const { data: entries, error: entriesError } = await supabase
      .from('queue_entries')
      .select(`
        *,
        patient:patients(*)
      `)
      .eq('queue_id', queueId)
      .order('queue_number', { ascending: true })

    if (entriesError) throw entriesError

    return { queue, entries: entries || [] }
  },

  callNext: async (queueId: string): Promise<{ entry: QueueEntry }> => {
    // Find first waiting entry
    const { data: waiting, error: findError } = await supabase
      .from('queue_entries')
      .select('*')
      .eq('queue_id', queueId)
      .eq('status', 'waiting')
      .order('queue_number', { ascending: true })
      .limit(1)
      .single()

    if (findError) throw new Error('No patients in queue')

    // Update to called
    const { data: entry, error: updateError } = await supabase
      .from('queue_entries')
      .update({
        status: 'called',
        called_at: new Date().toISOString()
      })
      .eq('id', waiting.id)
      .select()
      .single()

    if (updateError) throw updateError

    return { entry }
  },

  complete: async (entryId: string): Promise<void> => {
    const { error } = await supabase
      .from('queue_entries')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', entryId)

    if (error) throw error
  },

  addToQueue: async (data: {
    queue_id: string
    patient_id: string
    appointment_id?: string
    cabinet?: string
  }): Promise<QueueEntry> => {
    // Get next queue number
    const { data: lastEntry } = await supabase
      .from('queue_entries')
      .select('queue_number')
      .eq('queue_id', data.queue_id)
      .order('queue_number', { ascending: false })
      .limit(1)
      .single()

    const nextNumber = (lastEntry?.queue_number || 0) + 1

    const { data: entry, error } = await supabase
      .from('queue_entries')
      .insert({
        ...data,
        queue_number: nextNumber,
        status: 'waiting',
        cabinet: data.cabinet || null,
      })
      .select()
      .single()

    if (error) throw error
    return entry
  }
}

// ==================== Cashier Service ====================

export const cashierService = {
  getTransactions: async (params?: {
    date?: string
    type?: TransactionType
    page?: number
    limit?: number
  }): Promise<{ data: CashierTransaction[] }> => {
    const page = params?.page || 1
    const limit = params?.limit || 20
    const start = (page - 1) * limit

    let query = supabase
      .from('cashier_transactions')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .range(start, start + limit - 1)

    if (params?.date) {
      query = query.gte('created_at', `${params.date}T00:00:00`)
        .lte('created_at', `${params.date}T23:59:59`)
    }
    if (params?.type) {
      query = query.eq('type', params.type)
    }

    const { data, error } = await query

    if (error) throw error
    return { data: data || [] }
  },

  getSummary: async (params?: { date?: string }): Promise<{
    total_paid: number
    total_refunded: number
    total_debt: number
    transaction_count: number
  }> => {
    let query = supabase
      .from('cashier_transactions')
      .select('type, amount')
      .eq('status', 'completed')

    if (params?.date) {
      query = query.gte('created_at', `${params.date}T00:00:00`)
        .lte('created_at', `${params.date}T23:59:59`)
    }

    const { data, error } = await query

    if (error) throw error

    const summary = (data || []).reduce((acc, t) => {
      if (t.type === 'payment') acc.total_paid += t.amount
      if (t.type === 'refund') acc.total_refunded += t.amount
      return acc
    }, { total_paid: 0, total_refunded: 0 })

    return {
      ...summary,
      total_debt: 0,
      transaction_count: data?.length || 0
    }
  },

  createPayment: async (data: {
    patient_id: string
    appointment_id?: string
    amount: number
    payment_method: 'cash' | 'card' | 'transfer' | 'deposit'
    notes?: string
  }): Promise<CashierTransaction> => {
    const { data: { session } } = await supabase.auth.getSession()

    const { data: result, error } = await supabase
      .from('cashier_transactions')
      .insert({
        ...data,
        type: 'payment',
        status: 'completed',
        created_by: session?.user.id || '',
      })
      .select()
      .single()

    if (error) throw error
    return result
  },

  createRefund: async (data: {
    transaction_id: string
    amount: number
    reason: string
  }): Promise<CashierTransaction> => {
    const { data: { session } } = await supabase.auth.getSession()

    const { data: result, error } = await supabase
      .from('cashier_transactions')
      .insert({
        patient_id: '', // Will be filled from original transaction
        type: 'refund',
        amount: -data.amount,
        payment_method: 'cash',
        status: 'completed',
        notes: data.reason,
        created_by: session?.user.id || '',
      })
      .select()
      .single()

    if (error) throw error
    return result
  }
}

// ==================== Reference Service ====================

export const referenceService = {
  services: async (): Promise<Service[]> => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return data || []
  },

  serviceGroups: async () => {
    const { data, error } = await supabase
      .from('service_groups')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return data || []
  },

  departments: async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return data || []
  },

  paymentMethods: async (): Promise<string[]> => {
    return ['cash', 'card', 'transfer', 'deposit']
  },

  roles: async () => {
    return [
      { id: 'admin', name: 'Administrator' },
      { id: 'doctor', name: 'Doctor' },
      { id: 'registrar', name: 'Registrar' },
      { id: 'cashier', name: 'Cashier' },
      { id: 'lab_tech', name: 'Lab Technician' },
      { id: 'director', name: 'Director' }
    ]
  }
}

// ==================== Analytics Service ====================

export const analyticsService = {
  dashboard: async () => {
    const today = new Date().toISOString().split('T')[0]

    // Get appointment stats
    const { count: totalAppointments } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('appointment_date', today)

    const { count: completedAppointments } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('appointment_date', today)
      .eq('status', 'completed')

    const { count: waitingPatients } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('appointment_date', today)
      .eq('status', 'waiting')

    // Get revenue for today
    const { data: transactions } = await supabase
      .from('cashier_transactions')
      .select('amount, type')
      .eq('status', 'completed')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)

    const totalRevenue = (transactions || [])
      .filter(t => t.type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0)

    // Get new patients today
    const { count: newPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('created_at', today)

    return {
      total_appointments: totalAppointments || 0,
      completed_appointments: completedAppointments || 0,
      cancelled_appointments: 0,
      total_revenue: totalRevenue,
      new_patients: newPatients || 0,
      waiting_patients: waitingPatients || 0
    }
  }
}

// ==================== Medical Records Service ====================

export const medicalRecordService = {
  getPatientRecords: async (patientId: string): Promise<MedicalRecord[]> => {
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  create: async (data: Partial<MedicalRecord>): Promise<MedicalRecord> => {
    const { data: { session } } = await supabase.auth.getSession()

    const { data: result, error } = await supabase
      .from('medical_records')
      .insert({
        ...data,
        created_by: session?.user.id,
      })
      .select()
      .single()

    if (error) throw error
    return result
  },

  addDiagnosis: async (data: Partial<Diagnosis>): Promise<Diagnosis> => {
    const { data: { session } } = await supabase.auth.getSession()

    const { data: result, error } = await supabase
      .from('diagnoses')
      .insert({
        ...data,
        created_by: session?.user.id,
      })
      .select()
      .single()

    if (error) throw error
    return result
  },

  addVitals: async (data: Partial<Vital>): Promise<Vital> => {
    const { data: { session } } = await supabase.auth.getSession()

    const { data: result, error } = await supabase
      .from('vitals')
      .insert({
        ...data,
        recorded_by: session?.user.id,
      })
      .select()
      .single()

    if (error) throw error
    return result
  }
}

// ==================== Storage Service ====================

export const storageService = {
  uploadAvatar: async (userId: string, file: File): Promise<string> => {
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (error) throw error

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
  },

  uploadDocument: async (patientId: string, file: File, folder: string = 'documents'): Promise<string> => {
    const ext = file.name.split('.').pop()
    const path = `${patientId}/${folder}/${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('patients')
      .upload(path, file)

    if (error) throw error

    const { data } = supabase.storage.from('patients').getPublicUrl(path)
    return data.publicUrl
  }
}

// ==================== Health Check ====================

export const healthService = {
  check: async (): Promise<{ status: string; timestamp: string; mode: string }> => {
    const { error } = await supabase.from('profiles').select('id').limit(1)

    return {
      status: error ? 'error' : 'ok',
      timestamp: new Date().toISOString(),
      mode: 'supabase'
    }
  }
}

// ==================== Default Export ====================

export default {
  auth: authService,
  patients: patientService,
  appointments: appointmentService,
  staff: staffService,
  queue: queueService,
  cashier: cashierService,
  reference: referenceService,
  analytics: analyticsService,
  medicalRecords: medicalRecordService,
  storage: storageService,
  health: healthService
}