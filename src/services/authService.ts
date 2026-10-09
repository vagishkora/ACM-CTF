import { User, UserRole, ProvisionedAccount } from '../types'
import { mockFetch, ApiError } from './apiClient'
import { supabase } from '../lib/supabase'
import { realtimeSync } from './realtimeSync'

const AUTH_STORAGE_KEY = 'acm_ctf_auth_user'
const PROVISIONED_ACCOUNTS_KEY = 'acm_ctf_provisioned_accounts'

export interface LoginCredentials {
  teamName?: string
  identifier: string // email or USN or username
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

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false
  return EMAIL_REGEX.test(email.trim())
}

export interface ProfileDetailsPayload {
  name: string
  usn: string
  year: string
  branch: string
  phone: string
}

const DEFAULT_ACCOUNTS: ProvisionedAccount[] = [
  {
    id: 'acc-admin-master',
    teamName: 'ACM Organizers',
    email: 'admin@gmail.com',
    password: 'password',
    role: 'organizer',
    name: 'Lead Administrator',
    usn: 'ADMIN-01',
    isProfileComplete: true,
    createdAt: new Date().toISOString()
  }
]

class AuthService {
  private currentUser: User | null = null
  private accounts: ProvisionedAccount[] = []

  constructor() {
    // 1. Initialize currentUser from localStorage
    const savedUser = localStorage.getItem(AUTH_STORAGE_KEY)
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser)
      } catch {
        this.currentUser = null
      }
    }

    // 2. Initialize accounts from localStorage
    const savedAccounts = localStorage.getItem(PROVISIONED_ACCOUNTS_KEY)
    if (savedAccounts) {
      try {
        this.accounts = JSON.parse(savedAccounts)
      } catch {
        this.accounts = [...DEFAULT_ACCOUNTS]
        this.saveAccounts()
      }
    } else {
      this.accounts = [...DEFAULT_ACCOUNTS]
      this.saveAccounts()
    }

    // Clean out legacy mock test accounts from prior sessions
    this.accounts = this.accounts.filter(a => 
      a.email !== 'alex@rvce.edu.in' && 
      a.email !== 'sarah@rvce.edu.in' && 
      a.email !== 'admin@acm.org'
    )

    // Ensure super admin admin@gmail.com with password 'password' is ALWAYS present
    const existingAdminIdx = this.accounts.findIndex(a => a.email.toLowerCase() === 'admin@gmail.com')
    if (existingAdminIdx === -1) {
      this.accounts.unshift(DEFAULT_ACCOUNTS[0])
      this.saveAccounts()
    } else {
      this.accounts[existingAdminIdx].password = 'password'
      this.accounts[existingAdminIdx].role = 'organizer'
      this.saveAccounts()
    }

    // 3. Sync from Supabase in background if table exists
    this.syncFromSupabase()

    // 4. Listen to realtime and storage changes
    realtimeSync.subscribe((msg) => {
      if (msg.type === 'ACCOUNT_PROVISIONED' || msg.type === 'ROLE_CHANGED' || msg.type === 'PROFILE_UPDATED') {
        this.reloadAccounts()
        this.syncFromSupabase()
      }
    })

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === PROVISIONED_ACCOUNTS_KEY) {
          this.reloadAccounts()
        }
      })
    }
  }

  public reloadAccounts() {
    const savedAccounts = localStorage.getItem(PROVISIONED_ACCOUNTS_KEY)
    if (savedAccounts) {
      try {
        const parsed = JSON.parse(savedAccounts)
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.accounts = parsed
        }
      } catch {
        // ignore
      }
    }

    // Ensure super admin admin@gmail.com with password 'password' is ALWAYS present
    const existingAdminIdx = this.accounts.findIndex(a => a.email.toLowerCase() === 'admin@gmail.com')
    if (existingAdminIdx === -1) {
      this.accounts.unshift(DEFAULT_ACCOUNTS[0])
      this.saveAccounts()
    } else {
      this.accounts[existingAdminIdx].password = 'password'
      this.accounts[existingAdminIdx].role = 'organizer'
      this.saveAccounts()
    }
  }

  private saveAccounts() {
    localStorage.setItem(PROVISIONED_ACCOUNTS_KEY, JSON.stringify(this.accounts))
  }

  private async syncFromSupabase() {
    this.reloadAccounts()
    try {
      const { data, error } = await supabase.from('registered_accounts').select('*')
      if (!error && data && data.length > 0) {
        // Map Supabase rows to ProvisionedAccount format
        const mapped: ProvisionedAccount[] = data.map((row: any) => ({
          id: row.id,
          teamName: row.team_name,
          email: row.email,
          password: row.password,
          role: row.role as UserRole,
          name: row.name || undefined,
          usn: row.usn || undefined,
          year: row.year || undefined,
          branch: row.branch || undefined,
          phone: row.phone || undefined,
          isProfileComplete: !!row.is_profile_complete,
          createdAt: row.created_at || new Date().toISOString()
        }))

        // Merge keeping locally created ones not yet pushed
        const map = new Map<string, ProvisionedAccount>()
        this.accounts.forEach(a => map.set(a.email.toLowerCase(), a))
        mapped.forEach(a => map.set(a.email.toLowerCase(), a))
        this.accounts = Array.from(map.values())
        this.saveAccounts()
      }
    } catch {
      // Supabase table might not exist yet, fallback gracefully to localStorage
    }
  }

  async getCurrentUser(): Promise<User | null> {
    return mockFetch(this.currentUser)
  }

  async getProvisionedAccounts(): Promise<ProvisionedAccount[]> {
    this.reloadAccounts()
    await this.syncFromSupabase()
    this.reloadAccounts()
    return mockFetch([...this.accounts])
  }

  async getRegisteredTeams(): Promise<string[]> {
    this.reloadAccounts()
    await this.syncFromSupabase()
    this.reloadAccounts()
    const teams = Array.from(
      new Set(
        this.accounts
          .filter(a => a.role === 'participant')
          .map(a => a.teamName.trim())
      )
    ).filter(Boolean)
    return mockFetch(teams)
  }

  // Admin function: Admin provides ONLY Team Name, Email, and Password!
  async createStudentAccount(params: { teamName: string; email: string; password: string }): Promise<ProvisionedAccount> {
    const trimmedTeam = params.teamName.trim()
    const trimmedEmail = params.email.trim().toLowerCase()
    const trimmedPassword = params.password.trim()

    if (!trimmedTeam) {
      throw new ApiError('Team Name is required.', 400)
    }
    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      throw new ApiError(`Invalid student email address: "${trimmedEmail}". Email must contain "@" and a valid domain (e.g. student@college.edu).`, 400)
    }
    if (!trimmedPassword || trimmedPassword.length < 4) {
      throw new ApiError('Password must be at least 4 characters.', 400)
    }

    const exists = this.accounts.find(a => a.email.toLowerCase() === trimmedEmail)
    if (exists) {
      throw new ApiError(`An account with email ${trimmedEmail} already exists in team ${exists.teamName}.`, 400)
    }

    const newAccount: ProvisionedAccount = {
      id: `acc-${Date.now().toString(36)}`,
      teamName: trimmedTeam,
      email: trimmedEmail,
      password: trimmedPassword,
      role: 'participant',
      name: '',
      usn: '',
      isProfileComplete: false,
      createdAt: new Date().toISOString()
    }

    this.accounts.unshift(newAccount)
    this.saveAccounts()

    // Try saving to Supabase
    try {
      await supabase.from('registered_accounts').insert({
        team_name: newAccount.teamName,
        email: newAccount.email,
        password: newAccount.password,
        role: newAccount.role,
        is_profile_complete: false
      })
    } catch {
      // fallback
    }

    // Broadcast account creation
    realtimeSync.broadcast('ACCOUNT_PROVISIONED', newAccount)

    return mockFetch(newAccount, 200)
  }

  // Admin function: Provision whole team with multiple members (e.g. 2 members) at once
  async createTeamWithMembers(teamName: string, members: Array<{ email: string; password: string }>): Promise<ProvisionedAccount[]> {
    const trimmedTeam = teamName.trim()
    if (!trimmedTeam) {
      throw new ApiError('Team Name is required.', 400)
    }
    if (!members || members.length === 0) {
      throw new ApiError('At least one member is required.', 400)
    }

    const createdAccounts: ProvisionedAccount[] = []

    for (let i = 0; i < members.length; i++) {
      const m = members[i]
      const email = m.email.trim().toLowerCase()
      const password = m.password.trim()

      if (!email || !isValidEmail(email)) {
        throw new ApiError(`Member ${i + 1} has an invalid email: "${email}". Must contain "@" and a valid domain (e.g. student@college.edu).`, 400)
      }
      if (!password || password.length < 4) {
        throw new ApiError(`Member ${i + 1} password must be at least 4 characters.`, 400)
      }

      const exists = this.accounts.find(a => a.email.toLowerCase() === email)
      if (exists) {
        throw new ApiError(`Email "${email}" is already registered in team "${exists.teamName}".`, 400)
      }

      const newAccount: ProvisionedAccount = {
        id: `acc-${Date.now().toString(36)}-${i}`,
        teamName: trimmedTeam,
        email,
        password,
        role: 'participant',
        name: '',
        usn: '',
        isProfileComplete: false,
        createdAt: new Date().toISOString()
      }

      createdAccounts.push(newAccount)
      this.accounts.unshift(newAccount)
    }

    this.saveAccounts()

    try {
      await supabase.from('registered_accounts').insert(
        createdAccounts.map(a => ({
          team_name: a.teamName,
          email: a.email,
          password: a.password,
          role: a.role,
          is_profile_complete: false
        }))
      )
    } catch {
      // fallback
    }

    realtimeSync.broadcast('ACCOUNT_PROVISIONED', { teamName: trimmedTeam, count: createdAccounts.length })
    return mockFetch(createdAccounts, 200)
  }

  // Admin function: Directly add another co-admin by email and password
  async createAdminAccount(params: { email: string; password: string; name?: string }): Promise<ProvisionedAccount> {
    const trimmedEmail = params.email.trim().toLowerCase()
    const trimmedPass = params.password.trim()
    const trimmedName = params.name?.trim() || 'Co-Admin'

    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      throw new ApiError(`Invalid admin email address: "${trimmedEmail}". Must contain "@" and a valid domain (e.g. admin@gmail.com).`, 400)
    }
    if (!trimmedPass || trimmedPass.length < 4) {
      throw new ApiError('Password must be at least 4 characters.', 400)
    }

    const exists = this.accounts.find(a => a.email.toLowerCase() === trimmedEmail)
    if (exists) {
      throw new ApiError(`An account with email "${trimmedEmail}" already exists.`, 400)
    }

    const newAdmin: ProvisionedAccount = {
      id: `acc-admin-${Date.now().toString(36)}`,
      teamName: 'ACM Organizers',
      email: trimmedEmail,
      password: trimmedPass,
      role: 'organizer',
      name: trimmedName,
      usn: 'ADMIN',
      isProfileComplete: true,
      createdAt: new Date().toISOString()
    }

    this.accounts.unshift(newAdmin)
    this.saveAccounts()

    try {
      await supabase.from('registered_accounts').insert({
        team_name: newAdmin.teamName,
        email: newAdmin.email,
        password: newAdmin.password,
        role: 'organizer',
        name: newAdmin.name,
        is_profile_complete: true
      })
    } catch {
      // fallback
    }

    realtimeSync.broadcast('ACCOUNT_PROVISIONED', newAdmin)
    return mockFetch(newAdmin, 200)
  }

  // Admin function: Grant or revoke admin/organizer access
  async toggleAdminRole(accountId: string): Promise<ProvisionedAccount> {
    const acc = this.accounts.find(a => a.id === accountId)
    if (!acc) {
      throw new ApiError('Account not found.', 404)
    }

    acc.role = acc.role === 'organizer' ? 'participant' : 'organizer'
    this.saveAccounts()

    // Update in Supabase
    try {
      await supabase.from('registered_accounts').update({ role: acc.role }).eq('id', accountId)
    } catch {
      // fallback
    }

    // If current logged in user is this account, update active user session
    if (this.currentUser && this.currentUser.email.toLowerCase() === acc.email.toLowerCase()) {
      this.currentUser.role = acc.role
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.currentUser))
    }

    realtimeSync.broadcast('ROLE_CHANGED', { accountId, role: acc.role })
    return mockFetch({ ...acc }, 150)
  }

  // Admin function: Remove user account
  async deleteAccount(accountId: string): Promise<void> {
    this.accounts = this.accounts.filter(a => a.id !== accountId)
    this.saveAccounts()
    try {
      await supabase.from('registered_accounts').delete().eq('id', accountId)
    } catch {
      // fallback
    }
    realtimeSync.broadcast('ACCOUNT_PROVISIONED', { deletedId: accountId })
  }

  // Login: Student selects team, enters email/USN, and password
  async login(credentials: LoginCredentials): Promise<User> {
    const trimmedId = credentials.identifier.trim().toLowerCase()
    const trimmedPass = credentials.password.trim()
    const trimmedTeam = credentials.teamName?.trim()

    if (!trimmedId || !trimmedPass) {
      throw new ApiError('Please enter both your identifier (email or USN) and password.', 400)
    }

    // Refresh accounts cache from local storage and remote
    this.reloadAccounts()
    await this.syncFromSupabase()
    this.reloadAccounts()

    // Find account matching credentials
    // Check match by email OR by usn
    const matched = this.accounts.find(a => {
      const aEmail = a.email.toLowerCase().trim()
      const aUsn = a.usn ? a.usn.toLowerCase().trim() : ''
      const aPrefix = aEmail.split('@')[0]
      const emailOrUsnMatch = aEmail === trimmedId || aPrefix === trimmedId || aUsn === trimmedId
      const passMatch = a.password.trim() === trimmedPass
      return emailOrUsnMatch && passMatch
    })

    if (!matched) {
      throw new ApiError('Invalid credentials. Check your email/USN and password.', 401)
    }

    // If student selected or typed a specific team name, verify match
    if (trimmedTeam && matched.role !== 'organizer') {
      const matchTeam = matched.teamName.toLowerCase().trim()
      const inputTeam = trimmedTeam.toLowerCase().trim()
      if (matchTeam !== inputTeam) {
        throw new ApiError(`This account belongs to team "${matched.teamName}", not "${trimmedTeam}".`, 400)
      }
    }

    const user: User = {
      id: matched.id,
      username: matched.usn || matched.email.split('@')[0],
      displayName: matched.name || matched.usn || matched.email.split('@')[0],
      email: matched.email,
      role: matched.role,
      teamId: `team-${matched.teamName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      teamName: matched.teamName,
      isTeamCaptain: false,
      score: 0,
      solvedCount: 0,
      createdAt: matched.createdAt,
      usn: matched.usn,
      year: matched.year,
      branch: matched.branch,
      phone: matched.phone,
      isProfileComplete: matched.isProfileComplete ?? (!!matched.name && !!matched.usn)
    }

    this.currentUser = user
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
    return mockFetch(user, 200)
  }

  // Student First Login: Complete Profile details
  async completeProfile(details: ProfileDetailsPayload): Promise<User> {
    if (!this.currentUser) {
      throw new ApiError('You must be logged in to complete your profile.', 401)
    }

    const trimmedName = details.name.trim()
    const trimmedUsn = details.usn.trim().toUpperCase()
    const trimmedYear = details.year.trim()
    const trimmedBranch = details.branch.trim()
    const trimmedPhone = details.phone.trim()

    if (!trimmedName || !trimmedUsn) {
      throw new ApiError('Full name and USN are required.', 400)
    }

    // Update currentUser
    this.currentUser = {
      ...this.currentUser,
      displayName: trimmedName,
      username: trimmedUsn,
      usn: trimmedUsn,
      year: trimmedYear,
      branch: trimmedBranch,
      phone: trimmedPhone,
      isProfileComplete: true
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.currentUser))

    // Update in provisioned accounts
    const acc = this.accounts.find(a => a.email.toLowerCase() === this.currentUser!.email.toLowerCase())
    if (acc) {
      acc.name = trimmedName
      acc.usn = trimmedUsn
      acc.year = trimmedYear
      acc.branch = trimmedBranch
      acc.phone = trimmedPhone
      acc.isProfileComplete = true
      this.saveAccounts()

      // Update in Supabase
      try {
        await supabase.from('registered_accounts').update({
          name: trimmedName,
          usn: trimmedUsn,
          year: trimmedYear,
          branch: trimmedBranch,
          phone: trimmedPhone,
          is_profile_complete: true
        }).eq('email', acc.email)
      } catch {
        // fallback
      }

      realtimeSync.broadcast('PROFILE_UPDATED', {
        email: acc.email,
        teamName: acc.teamName,
        name: trimmedName,
        usn: trimmedUsn
      })
    }

    return mockFetch(this.currentUser, 200)
  }

  // Get teammates for a given team
  async getTeamMembers(teamName: string): Promise<ProvisionedAccount[]> {
    await this.syncFromSupabase()
    const members = this.accounts.filter(a => a.teamName.toLowerCase() === teamName.toLowerCase())
    return mockFetch(members)
  }

  async logout(): Promise<void> {
    this.currentUser = null
    localStorage.removeItem(AUTH_STORAGE_KEY)
    await mockFetch(true, 100)
  }

  async register(payload: RegisterPayload): Promise<User> {
    const acc = await this.createStudentAccount({
      teamName: payload.teamName || 'NewTeam',
      email: payload.email,
      password: payload.password
    })
    const u: User = {
      id: acc.id,
      username: payload.username || acc.email.split('@')[0],
      displayName: payload.displayName || payload.username || acc.email.split('@')[0],
      email: acc.email,
      role: 'participant',
      teamName: acc.teamName,
      teamId: `team-${acc.teamName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      score: 0,
      solvedCount: 0,
      createdAt: acc.createdAt,
      isProfileComplete: false
    }
    this.currentUser = u
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(u))
    return mockFetch(u, 200)
  }

  async switchRole(role: UserRole): Promise<User> {
    if (!this.currentUser) {
      this.currentUser = { ...DEFAULT_ACCOUNTS[0] } as any
    }
    this.currentUser = {
      ...this.currentUser!,
      role
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.currentUser))
    return mockFetch(this.currentUser, 150)
  }
}

export const authService = new AuthService()
