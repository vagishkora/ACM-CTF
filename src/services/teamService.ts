import { Team } from '../types'
import { mockFetch, ApiError } from './apiClient'
import { MOCK_CURRENT_TEAM } from '../data/mockData'

const TEAM_STORAGE_KEY = 'acm_ctf_team_state'

class TeamService {
  private team: Team

  constructor() {
    const saved = localStorage.getItem(TEAM_STORAGE_KEY)
    if (saved) {
      try {
        this.team = JSON.parse(saved)
      } catch {
        this.team = structuredClone(MOCK_CURRENT_TEAM)
      }
    } else {
      this.team = structuredClone(MOCK_CURRENT_TEAM)
      this.saveState()
    }
  }

  private saveState() {
    localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(this.team))
  }

  async getMyTeam(): Promise<Team> {
    return mockFetch(this.team, 150)
  }

  async updateTeamName(newName: string): Promise<Team> {
    const trimmed = newName.trim()
    if (!trimmed || trimmed.length < 3) {
      throw new ApiError('Team name must be at least 3 characters.', 400)
    }
    this.team.name = trimmed
    this.saveState()
    return mockFetch(this.team, 200)
  }

  async inviteMember(email: string): Promise<{ success: boolean; message: string }> {
    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@')) {
      throw new ApiError('Please enter a valid email address.', 400)
    }
    return mockFetch({
      success: true,
      message: `Invitation dispatch dispatched to ${trimmed}. They can also join directly using invite code: ${this.team.inviteCode}`
    }, 250)
  }

  async regenerateInviteCode(): Promise<string> {
    const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase()
    this.team.inviteCode = `ROOT-${randomHex}-ACM`
    this.saveState()
    return mockFetch(this.team.inviteCode, 150)
  }

  async recordSolve(challengeTitle: string, category: any, points: number, username: string): Promise<void> {
    this.team.score += points
    this.team.solves.unshift({
      challengeId: `ch-${Date.now()}`,
      challengeTitle,
      category,
      points,
      solvedAt: new Date().toISOString(),
      solvedByUsername: username
    })
    const member = this.team.members.find(m => m.username === username)
    if (member) {
      member.solvesCount += 1
      member.pointsContributed += points
    }
    this.saveState()
  }

  async resetTeam(): Promise<void> {
    this.team = structuredClone(MOCK_CURRENT_TEAM)
    this.saveState()
    await mockFetch(true, 100)
  }
}

export const teamService = new TeamService()
