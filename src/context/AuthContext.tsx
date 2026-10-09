import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { User, UserRole } from '../types'
import { authService, LoginCredentials, RegisterPayload, ProfileDetailsPayload } from '../services/authService'
import { realtimeSync } from '../services/realtimeSync'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<User>
  register: (payload: RegisterPayload) => Promise<User>
  logout: () => Promise<void>
  switchRole: (role: UserRole) => Promise<void>
  completeProfile: (details: ProfileDetailsPayload) => Promise<User>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const u = await authService.getCurrentUser()
      setUser(u)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()

    // Listen for realtime role changes or profile updates affecting this user
    const unsubscribe = realtimeSync.subscribe((msg) => {
      if (msg.type === 'ROLE_CHANGED' || msg.type === 'PROFILE_UPDATED') {
        refreshUser()
      }
    })

    return () => {
      unsubscribe()
    }
  }, [refreshUser])

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

  const completeProfile = async (details: ProfileDetailsPayload) => {
    const updated = await authService.completeProfile(details)
    setUser(updated)
    return updated
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
        switchRole,
        completeProfile,
        refreshUser
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
