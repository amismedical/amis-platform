import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '../services/api'
import type { AuthResponse, User } from '../services/api'

interface AuthUser {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  phone?: string
  avatar_url?: string
}

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Token storage keys
const TOKEN_KEY = 'amis_token'
const REFRESH_TOKEN_KEY = 'amis_refresh_token'
const USER_KEY = 'amis_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if we should use demo/mock mode
  const isDemoMode = import.meta.env.VITE_USE_MOCK === 'true' || !import.meta.env.VITE_API_URL

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/me')
      if (response.data) {
        setUser(response.data)
        localStorage.setItem(USER_KEY, JSON.stringify(response.data))
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      // Clear invalid session
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      setUser(null)
    }
  }

  useEffect(() => {
    let mounted = true

    const checkSession = async () => {
      try {
        // Check for stored token
        const token = localStorage.getItem(TOKEN_KEY)
        const storedUser = localStorage.getItem(USER_KEY)

        if (token && storedUser) {
          // Validate token by fetching profile
          if (mounted) {
            setUser(JSON.parse(storedUser))
            // Background refresh
            fetchUserProfile().catch(() => {})
          }
        } else if (storedUser) {
          // Legacy user data without token
          if (mounted) {
            setUser(JSON.parse(storedUser))
          }
        }

        if (mounted) setIsLoading(false)
      } catch (error) {
        console.error('Session check error:', error)
        if (mounted) {
          setUser(null)
          setIsLoading(false)
        }
      }
    }

    checkSession()

    return () => {
      mounted = false
    }
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      if (isDemoMode) {
        // Demo mode: create a mock user
        const mockUser = {
          id: 'demo-user-1',
          email: email,
          first_name: 'Demo',
          last_name: 'User',
          role: 'clinic_admin',
        }
        setUser(mockUser)
        localStorage.setItem(USER_KEY, JSON.stringify(mockUser))
        localStorage.setItem(TOKEN_KEY, 'demo-token')
        return
      }

      // Production: Use Go Backend API
      const response = await authService.login({ email, password })

      // Store tokens
      localStorage.setItem(TOKEN_KEY, response.access_token)
      if (response.refresh_token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token)
      }

      // Set user from response
      const authUser: AuthUser = {
        id: response.user.id,
        email: response.user.email,
        first_name: response.user.first_name,
        last_name: response.user.last_name,
        role: response.user.role,
      }

      setUser(authUser)
      localStorage.setItem(USER_KEY, JSON.stringify(authUser))
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    setIsLoading(true)
    try {
      if (isDemoMode) {
        // Demo mode
        const mockUser = {
          id: 'new-user-1',
          email: email,
          first_name: firstName,
          last_name: lastName,
          role: 'registrar',
        }
        setUser(mockUser)
        localStorage.setItem(USER_KEY, JSON.stringify(mockUser))
        return
      }

      // Production: Use Go Backend API
      const response = await api.post('/auth/register', {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      })

      if (response.data) {
        const authUser: AuthUser = {
          id: response.data.id,
          email: response.data.email,
          first_name: response.data.first_name,
          last_name: response.data.last_name,
          role: response.data.role,
        }
        setUser(authUser)
        localStorage.setItem(USER_KEY, JSON.stringify(authUser))

        if (response.data.access_token) {
          localStorage.setItem(TOKEN_KEY, response.data.access_token)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      if (!isDemoMode) {
        // Call backend logout endpoint
        await api.post('/auth/logout', {})
      }
    } catch (error) {
      console.warn('Logout API call failed:', error)
    } finally {
      // Always clear local state
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      setUser(null)
    }
  }

  const refreshUser = async () => {
    await fetchUserProfile()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
