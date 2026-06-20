// Real API Service - Connects to actual backend server
// API URL is configured via VITE_API_URL in .env

import type { MockApiType } from './mockApi'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const TOKEN_KEY = 'amis_token'

interface ApiResponse<T> {
  data: T
  message?: string
}

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  page_size: number
}

interface LoginResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: {
    id: string
    email: string
    first_name: string
    last_name: string
    role: string
  }
}

// Helper for authenticated requests
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY)

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

export const realApi = {
  health: {
    check: async (): Promise<{ status: string; timestamp: string; mode: string }> => {
      const data = await fetchApi<{ status: string; timestamp: string }>('/health')
      return { ...data, mode: 'production' }
    }
  },

  auth: {
    login: async (email: string, password: string): Promise<LoginResponse> => {
      return fetchApi<LoginResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
    },
    logout: async (): Promise<void> => {
      localStorage.removeItem(TOKEN_KEY)
    },
    getProfile: async () => {
      return fetchApi<{ data: any }>('/api/v1/auth/me')
    },
  },

  patients: {
    list: async (params?: { page?: number; page_size?: number; search?: string }) => {
      const query = new URLSearchParams()
      if (params?.page) query.set('page', String(params.page))
      if (params?.page_size) query.set('page_size', String(params.page_size))
      if (params?.search) query.set('search', params.search)

      return fetchApi<PaginatedResponse<any>>(`/api/v1/patients?${query}`)
    },
    getById: async (id: string) => {
      return fetchApi<ApiResponse<any>>(`/api/v1/patients/${id}`)
    },
    create: async (data: any) => {
      return fetchApi<ApiResponse<any>>('/api/v1/patients', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    update: async (id: string, data: any) => {
      return fetchApi<ApiResponse<any>>(`/api/v1/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    },
  },

  appointments: {
    list: async (params?: { date?: string; doctor_id?: string }) => {
      const query = new URLSearchParams()
      if (params?.date) query.set('date', params.date)
      if (params?.doctor_id) query.set('doctor_id', params.doctor_id)

      return fetchApi<PaginatedResponse<any>>(`/api/v1/appointments?${query}`)
    },
    create: async (data: any) => {
      return fetchApi<ApiResponse<any>>('/api/v1/appointments', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    update: async (id: string, data: any) => {
      return fetchApi<ApiResponse<any>>(`/api/v1/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    },
  },

  staff: {
    list: async (params?: { specialty?: string; position?: string }) => {
      const query = new URLSearchParams()
      if (params?.specialty) query.set('specialty', params.specialty)
      if (params?.position) query.set('position', params.position)

      return fetchApi<PaginatedResponse<any>>(`/api/v1/staff?${query}`)
    },
    getById: async (id: string) => {
      return fetchApi<ApiResponse<any>>(`/api/v1/staff/${id}`)
    },
  },

  analytics: {
    dashboard: async () => {
      return fetchApi<any>('/api/v1/analytics/dashboard')
    },
  },

  queue: {
    getActive: async () => {
      return fetchApi<any>('/api/v1/queue/active')
    },
    addToQueue: async (data: any) => {
      return fetchApi<ApiResponse<any>>('/api/v1/queue', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    updateStatus: async (id: string, status: string) => {
      return fetchApi<ApiResponse<any>>(`/api/v1/queue/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
    },
  },

  cashier: {
    getTransactions: async (params?: { date?: string; type?: string }) => {
      const query = new URLSearchParams()
      if (params?.date) query.set('date', params.date)
      if (params?.type) query.set('type', params.type)

      return fetchApi<PaginatedResponse<any>>(`/api/v1/cashier/transactions?${query}`)
    },
    createPayment: async (data: any) => {
      return fetchApi<ApiResponse<any>>('/api/v1/cashier/payments', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    createRefund: async (data: any) => {
      return fetchApi<ApiResponse<any>>('/api/v1/cashier/refunds', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
  },

  reference: {
    getServices: async () => {
      return fetchApi<PaginatedResponse<any>>('/api/v1/reference/services')
    },
    getCabinets: async () => {
      return fetchApi<PaginatedResponse<any>>('/api/v1/reference/cabinets')
    },
  },
} as MockApiType // Type assertion for compatibility

export type RealApiType = typeof realApi
