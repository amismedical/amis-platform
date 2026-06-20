// API Service Factory - Routes API calls based on environment configuration
// Architecture: React → Go Backend API → Supabase/Postgres (database only)
//
// Environment Configuration:
//   VITE_API_URL - Go Backend URL (e.g., https://api.yourdomain.com)
//   VITE_USE_MOCK=true - Use mock API for development (overrides VITE_API_URL)
//
// Default priority:
//   1. Go Backend API (if VITE_API_URL is set)
//   2. Mock API (for development/demo)

import * as mockApi from './mockApi'
import { realApi } from './realApi'

type ApiType = typeof realApi

// Check if we should use Go Backend API
const hasGoBackend = !!import.meta.env.VITE_API_URL

// Check if we should use mock API (overrides Go Backend)
const useMock = import.meta.env.VITE_USE_MOCK === 'true'

// Export the appropriate API based on environment
export const api: ApiType = useMock || !hasGoBackend ? mockApi.default : realApi

// Also export individual services for direct access
export const authService = api.auth
export const patientService = api.patients
export const appointmentService = api.appointments
export const staffService = api.staff
export const analyticsService = api.analytics
export const queueService = api.queue
export const cashierService = api.cashier
export const referenceService = api.reference
export const medicalRecordService = api.medicalRecords
export const storageService = api.storage
export const healthService = api.health

// Health check - works for all modes
export const checkHealth = async (): Promise<{ status: string; timestamp: string; mode: string }> => {
  if (useMock || !hasGoBackend) {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      mode: 'mock'
    }
  }
  return healthService.check()
}

// API mode info for debugging
export const getApiMode = (): string => {
  if (useMock) return 'mock'
  if (hasGoBackend) return 'go-backend'
  return 'mock'
}

export default api
