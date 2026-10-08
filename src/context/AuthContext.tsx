import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, UserRole } from '../types'
import { authService, LoginCredentials, RegisterPayload } from '../services/authService'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<User>
  register: (payload: RegisterPayload) => Promise<User>
  logout: () => Promise<void>
  switchRole: (role: UserRole) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    authService.getCurrentUser()
      .then(u => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true)
    try {
      const loggedIn = await authService.login(credentials)
      setUser(loggedIn)
      return loggedIn
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true)
    try {
      const registered = await authService.register(payload)
      setUser(registered)
      return registered
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await authService.logout()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const switchRole = async (role: UserRole) => {
    const updated = await authService.switchRole(role)
    setUser(updated)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        switchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
