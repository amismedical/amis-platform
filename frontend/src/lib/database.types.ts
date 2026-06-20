// Database Types for Supabase
// Auto-generated types based on database schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          patronymic: string | null
          phone: string | null
          role: 'admin' | 'doctor' | 'registrar' | 'cashier' | 'lab_tech' | 'director'
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name: string
          last_name: string
          patronymic?: string | null
          phone?: string | null
          role?: 'admin' | 'doctor' | 'registrar' | 'cashier' | 'lab_tech' | 'director'
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          patronymic?: string | null
          phone?: string | null
          role?: 'admin' | 'doctor' | 'registrar' | 'cashier' | 'lab_tech' | 'director'
          avatar_url?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          first_name: string
          last_name: string
          patronymic: string | null
          birth_date: string
          gender: 'male' | 'female'
          phone: string
          phone_2: string | null
          email: string | null
          citizenship: string | null
          address: string | null
          passport_series: string | null
          deposit_balance: number
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          patronymic?: string | null
          birth_date: string
          gender: 'male' | 'female'
          phone: string
          phone_2?: string | null
          email?: string | null
          citizenship?: string | null
          address?: string | null
          passport_series?: string | null
          deposit_balance?: number
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          patronymic?: string | null
          birth_date?: string
          gender?: 'male' | 'female'
          phone?: string
          phone_2?: string | null
          email?: string | null
          citizenship?: string | null
          address?: string | null
          passport_series?: string | null
          deposit_balance?: number
          is_active?: boolean
          updated_at?: string
        }
      }
      staff: {
        Row: {
          id: string
          user_id: string | null
          first_name: string
          last_name: string
          patronymic: string | null
          position: string
          specialty: string | null
          cabinet: string | null
          phone: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          first_name: string
          last_name: string
          patronymic?: string | null
          position: string
          specialty?: string | null
          cabinet?: string | null
          phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string | null
          first_name?: string
          last_name?: string
          patronymic?: string | null
          position?: string
          specialty?: string | null
          cabinet?: string | null
          phone?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          name: string
          name_uz: string | null
          name_ru: string | null
          description: string | null
          duration: number
          base_price: number
          service_group_id: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          name_uz?: string | null
          name_ru?: string | null
          description?: string | null
          duration: number
          base_price: number
          service_group_id?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          name_uz?: string | null
          name_ru?: string | null
          description?: string | null
          duration?: number
          base_price?: number
          service_group_id?: string | null
          is_active?: boolean
        }
      }
      appointments: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string
          service_id: string | null
          status: 'scheduled' | 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          appointment_date: string
          start_time: string
          end_time: string | null
          booking_method: 'online' | 'phone' | 'reception' | 'referral'
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          doctor_id: string
          service_id?: string | null
          status?: 'scheduled' | 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          appointment_date: string
          start_time: string
          end_time?: string | null
          booking_method?: 'online' | 'phone' | 'reception' | 'referral'
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          patient_id?: string
          doctor_id?: string
          service_id?: string | null
          status?: 'scheduled' | 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          appointment_date?: string
          start_time?: string
          end_time?: string | null
          booking_method?: 'online' | 'phone' | 'reception' | 'referral'
          notes?: string | null
          updated_at?: string
        }
      }
      queue_entries: {
        Row: {
          id: string
          queue_id: string
          patient_id: string
          appointment_id: string | null
          queue_number: number
          status: 'waiting' | 'called' | 'completed' | 'cancelled' | 'skipped'
          cabinet: string | null
          called_at: string | null
          completed_at: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          queue_id: string
          patient_id: string
          appointment_id?: string | null
          queue_number: number
          status?: 'waiting' | 'called' | 'completed' | 'cancelled' | 'skipped'
          cabinet?: string | null
          called_at?: string | null
          completed_at?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          status?: 'waiting' | 'called' | 'completed' | 'cancelled' | 'skipped'
          cabinet?: string | null
          called_at?: string | null
          completed_at?: string | null
          notes?: string | null
        }
      }
      queues: {
        Row: {
          id: string
          name: string
          name_uz: string | null
          name_ru: string | null
          department_id: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          name_uz?: string | null
          name_ru?: string | null
          department_id?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          name_uz?: string | null
          name_ru?: string | null
          department_id?: string | null
          is_active?: boolean
        }
      }
      cashier_transactions: {
        Row: {
          id: string
          patient_id: string
          appointment_id: string | null
          type: 'payment' | 'refund' | 'deposit' | 'withdrawal'
          amount: number
          payment_method: 'cash' | 'card' | 'transfer' | 'deposit'
          status: 'pending' | 'completed' | 'cancelled'
          notes: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          appointment_id?: string | null
          type: 'payment' | 'refund' | 'deposit' | 'withdrawal'
          amount: number
          payment_method: 'cash' | 'card' | 'transfer' | 'deposit'
          status?: 'pending' | 'completed' | 'cancelled'
          notes?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          type?: 'payment' | 'refund' | 'deposit' | 'withdrawal'
          amount?: number
          payment_method?: 'cash' | 'card' | 'transfer' | 'deposit'
          status?: 'pending' | 'completed' | 'cancelled'
          notes?: string | null
        }
      }
      medical_records: {
        Row: {
          id: string
          patient_id: string
          appointment_id: string | null
          doctor_id: string
          record_type: 'initial' | 'follow_up' | 'emergency' | 'procedure'
          chief_complaint: string | null
          anamnesis: string | null
          diagnosis: string | null
          treatment: string | null
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          appointment_id?: string | null
          doctor_id: string
          record_type?: 'initial' | 'follow_up' | 'emergency' | 'procedure'
          chief_complaint?: string | null
          anamnesis?: string | null
          diagnosis?: string | null
          treatment?: string | null
          notes?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          chief_complaint?: string | null
          anamnesis?: string | null
          diagnosis?: string | null
          treatment?: string | null
          notes?: string | null
          updated_at?: string
        }
      }
      vitals: {
        Row: {
          id: string
          patient_id: string
          medical_record_id: string | null
          blood_pressure_systolic: number | null
          blood_pressure_diastolic: number | null
          heart_rate: number | null
          temperature: number | null
          weight: number | null
          height: number | null
          respiratory_rate: number | null
          notes: string | null
          recorded_by: string
          recorded_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          medical_record_id?: string | null
          blood_pressure_systolic?: number | null
          blood_pressure_diastolic?: number | null
          heart_rate?: number | null
          temperature?: number | null
          weight?: number | null
          height?: number | null
          respiratory_rate?: number | null
          notes?: string | null
          recorded_by: string
          recorded_at?: string
        }
        Update: {
          blood_pressure_systolic?: number | null
          blood_pressure_diastolic?: number | null
          heart_rate?: number | null
          temperature?: number | null
          weight?: number | null
          height?: number | null
          respiratory_rate?: number | null
          notes?: string | null
        }
      }
      diagnoses: {
        Row: {
          id: string
          patient_id: string
          medical_record_id: string | null
          icd_code: string | null
          diagnosis_text: string
          diagnosis_type: 'primary' | 'secondary' | 'concomitant'
          notes: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          medical_record_id?: string | null
          icd_code?: string | null
          diagnosis_text: string
          diagnosis_type?: 'primary' | 'secondary' | 'concomitant'
          notes?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          icd_code?: string | null
          diagnosis_text?: string
          diagnosis_type?: 'primary' | 'secondary' | 'concomitant'
          notes?: string | null
        }
      }
      prescriptions: {
        Row: {
          id: string
          patient_id: string
          medical_record_id: string | null
          medication: string
          dosage: string
          frequency: string
          duration: string
          instructions: string | null
          is_active: boolean
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          medical_record_id?: string | null
          medication: string
          dosage: string
          frequency: string
          duration: string
          instructions?: string | null
          is_active?: boolean
          created_by: string
          created_at?: string
        }
        Update: {
          medication?: string
          dosage?: string
          frequency?: string
          duration?: string
          instructions?: string | null
          is_active?: boolean
        }
      }
      departments: {
        Row: {
          id: string
          name: string
          name_uz: string | null
          name_ru: string | null
          description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          name_uz?: string | null
          name_ru?: string | null
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          name_uz?: string | null
          name_ru?: string | null
          description?: string | null
          is_active?: boolean
        }
      }
      service_groups: {
        Row: {
          id: string
          name: string
          name_uz: string | null
          name_ru: string | null
          description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          name_uz?: string | null
          name_ru?: string | null
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          name_uz?: string | null
          name_ru?: string | null
          description?: string | null
          is_active?: boolean
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string
          type: 'info' | 'success' | 'warning' | 'error'
          is_read: boolean
          data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          body: string
          type?: 'info' | 'success' | 'warning' | 'error'
          is_read?: boolean
          data?: Json | null
          created_at?: string
        }
        Update: {
          title?: string
          body?: string
          type?: 'info' | 'success' | 'warning' | 'error'
          is_read?: boolean
          data?: Json | null
        }
      }
      settings: {
        Row: {
          id: string
          key: string
          value: Json
          description: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: Json
          description?: string | null
          updated_at?: string
        }
        Update: {
          value?: Json
          description?: string | null
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          table_name: string
          record_id: string | null
          old_data: Json | null
          new_data: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          table_name: string
          record_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: never
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'doctor' | 'registrar' | 'cashier' | 'lab_tech' | 'director'
      appointment_status: 'scheduled' | 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
      queue_entry_status: 'waiting' | 'called' | 'completed' | 'cancelled' | 'skipped'
      transaction_type: 'payment' | 'refund' | 'deposit' | 'withdrawal'
      payment_method: 'cash' | 'card' | 'transfer' | 'deposit'
      transaction_status: 'pending' | 'completed' | 'cancelled'
    }
  }
}

// Type exports
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Patient = Database['public']['Tables']['patients']['Row']
export type Staff = Database['public']['Tables']['staff']['Row']
export type Service = Database['public']['Tables']['services']['Row']
export type Appointment = Database['public']['Tables']['appointments']['Row']
export type QueueEntry = Database['public']['Tables']['queue_entries']['Row']
export type Queue = Database['public']['Tables']['queues']['Row']
export type CashierTransaction = Database['public']['Tables']['cashier_transactions']['Row']
export type MedicalRecord = Database['public']['Tables']['medical_records']['Row']
export type Vital = Database['public']['Tables']['vitals']['Row']
export type Diagnosis = Database['public']['Tables']['diagnoses']['Row']
export type Prescription = Database['public']['Tables']['prescriptions']['Row']
export type Department = Database['public']['Tables']['departments']['Row']
export type ServiceGroup = Database['public']['Tables']['service_groups']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type Setting = Database['public']['Tables']['settings']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']

export type UserRole = Database['public']['Enums']['user_role']
export type AppointmentStatus = Database['public']['Enums']['appointment_status']
export type QueueEntryStatus = Database['public']['Enums']['queue_entry_status']
export type TransactionType = Database['public']['Enums']['transaction_type']
export type PaymentMethod = Database['public']['Enums']['payment_method']
export type TransactionStatus = Database['public']['Enums']['transaction_status']