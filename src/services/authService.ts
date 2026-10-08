import { User, UserRole } from '../types'
import { mockFetch, ApiError } from './apiClient'
import { MOCK_CURRENT_USER } from '../data/mockData'

const AUTH_STORAGE_KEY = 'acm_ctf_auth_user'

export interface LoginCredentials {
  identifier: string // email or username
  password: string
}

export interface RegisterPayload {
  username: string
  displayName: string
  email: string
  password: string
  teamMode: 'create' | 'join' | 'individual'
  teamName?: string
  inviteCode?: string
}

class AuthService {
  private currentUser: User | null = null

  constructor() {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY)
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved)
      } catch {
        this.currentUser = MOCK_CURRENT_USER
      }
    } else {
      this.currentUser = MOCK_CURRENT_USER
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.currentUser))
    }
  }

  async getCurrentUser(): Promise<User | null> {
    return mockFetch(this.currentUser)
  }

  async login(credentials: LoginCredentials): Promise<User> {
    const trimmedId = credentials.identifier.trim()
    if (!trimmedId || !credentials.password) {
      throw new ApiError('Please enter both identifier and password.', 400, 'VALIDATION_ERROR')
    }

    if (credentials.password.length < 6) {
      throw new ApiError('Password must be at least 6 characters.', 400, 'INVALID_CREDENTIALS')
    }

    // Realistic simulation:
    // Organizer shortcut if identifier contains 'admin' or 'organizer'
    const isOrganizer = trimmedId.toLowerCase().includes('admin') || trimmedId.toLowerCase().includes('organizer')
    
    const user: User = {
      id: isOrganizer ? 'usr-admin' : 'usr-01',
      username: isOrganizer ? 'acm_lead' : (trimmedId.includes('@') ? trimmedId.split('@')[0] : trimmedId),
      displayName: isOrganizer ? 'ACM Lead Organizer' : 'Alex Chen',
      email: trimmedId.includes('@') ? trimmedId : `${trimmedId}@student.acm.org`,
      role: isOrganizer ? 'organizer' : 'participant',
      teamId: isOrganizer ? undefined : 'team-me',
      teamName: isOrganizer ? undefined : 'RootAccess',
      isTeamCaptain: !isOrganizer,
      score: isOrganizer ? 0 : 975,
      solvedCount: isOrganizer ? 0 : 5,
      createdAt: new Date().toISOString()
    }

    this.currentUser = user
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
    return mockFetch(user, 300)
  }

  async register(payload: RegisterPayload): Promise<User> {
    if (!payload.username || !payload.email || !payload.password) {
      throw new ApiError('Required fields are missing.', 400, 'VALIDATION_ERROR')
    }

    const user: User = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      username: payload.username.trim(),
      displayName: payload.displayName.trim() || payload.username.trim(),
      email: payload.email.trim(),
      role: 'participant',
      teamId: payload.teamMode === 'individual' ? undefined : 'team-new',
      teamName: payload.teamName || (payload.teamMode === 'join' ? 'RootAccess' : 'NewTeam'),
      isTeamCaptain: payload.teamMode === 'create',
      score: 0,
      solvedCount: 0,
      createdAt: new Date().toISOString()
    }

    this.currentUser = user
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
    return mockFetch(user, 350)
  }

  async logout(): Promise<void> {
    this.currentUser = null
    localStorage.removeItem(AUTH_STORAGE_KEY)
    await mockFetch(true, 100)
  }

  async switchRole(role: UserRole): Promise<User> {
    if (!this.currentUser) {
      this.currentUser = { ...MOCK_CURRENT_USER }
    }
    this.currentUser = {
      ...this.currentUser,
      role,
      displayName: role === 'organizer' ? 'ACM Lead Organizer' : 'Alex Chen'
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.currentUser))
    return mockFetch(this.currentUser, 150)
  }
}

export const authService = new AuthService()
