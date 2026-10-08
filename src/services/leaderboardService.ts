import { LeaderboardEntry } from '../types'
import { mockFetch } from './apiClient'
import { MOCK_LEADERBOARD } from '../data/mockData'

const LEADERBOARD_STORAGE_KEY = 'acm_ctf_leaderboard_state'

class LeaderboardService {
  private entries: LeaderboardEntry[] = []

  constructor() {
    const saved = localStorage.getItem(LEADERBOARD_STORAGE_KEY)
    if (saved) {
      try {
        this.entries = JSON.parse(saved)
      } catch {
        this.entries = structuredClone(MOCK_LEADERBOARD)
      }
    } else {
      this.entries = structuredClone(MOCK_LEADERBOARD)
      this.saveState()
    }
  }

  private saveState() {
    localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(this.entries))
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    // Sort by score desc, then by solvesCount desc
    const sorted = [...this.entries].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return b.solvesCount - a.solvesCount
    })

    // Assign rank with tie consideration
    let currentRank = 1
    const ranked = sorted.map((entry, index) => {
      if (index > 0 && entry.score < sorted[index - 1].score) {
        currentRank = index + 1
      }
      return {
        ...entry,
        rank: currentRank
      }
    })

    return mockFetch(ranked, 160)
  }

  async addPointsToTeam(teamId: string, points: number, challengeTitle: string): Promise<void> {
    const entry = this.entries.find(e => e.teamId === teamId)
    if (entry) {
      entry.score += points
      entry.solvesCount += 1
      entry.lastSolveTime = 'Just now'
      entry.scoreTimeline.push({
        minuteOffset: Math.floor((Date.now() % 21600000) / 60000),
        score: entry.score
      })
      this.saveState()
    }
  }

  async resetLeaderboard(): Promise<void> {
    this.entries = structuredClone(MOCK_LEADERBOARD)
    this.saveState()
    await mockFetch(true, 100)
  }
}

export const leaderboardService = new LeaderboardService()
