import React, { createContext, useContext, useState, useEffect } from 'react'
import { Challenge, Hint } from '../types'
import { challengeService, FlagSubmissionResult } from '../services/challengeService'
import { teamService } from '../services/teamService'
import { leaderboardService } from '../services/leaderboardService'
import { announcementService } from '../services/announcementService'
import { useAuth } from './AuthContext'

interface CTFContextType {
  challenges: Challenge[]
  isLoading: boolean
  solvedCount: number
  totalChallenges: number
  totalPointsAvailable: number
  earnedPoints: number
  unreadAnnouncementsCount: number
  submitFlag: (challengeId: string, flag: string) => Promise<FlagSubmissionResult>
  unlockHint: (challengeId: string, hintId: string) => Promise<Hint>
  startInstance: (challengeId: string) => Promise<Challenge>
  stopInstance: (challengeId: string) => Promise<Challenge>
  refreshChallenges: () => Promise<void>
  refreshAnnouncementsCount: () => Promise<void>
}

const CTFContext = createContext<CTFContextType | undefined>(undefined)

export const CTFProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(2)

  const refreshChallenges = async () => {
    try {
      const data = await challengeService.getChallenges()
      setChallenges(data)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshAnnouncementsCount = async () => {
    try {
      const anns = await announcementService.getAnnouncements()
      setUnreadAnnouncementsCount(anns.filter(a => !a.isRead).length)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    refreshChallenges()
    refreshAnnouncementsCount()
  }, [])

  const solvedCount = challenges.filter(c => c.isSolved).length
  const totalChallenges = challenges.length
  const totalPointsAvailable = challenges.reduce((acc, c) => acc + c.points, 0)
  const earnedPoints = challenges.filter(c => c.isSolved).reduce((acc, c) => acc + c.points, 0)

  const submitFlag = async (challengeId: string, flag: string): Promise<FlagSubmissionResult> => {
    const res = await challengeService.submitFlag(challengeId, flag)
    if (res.status === 'correct') {
      const ch = challenges.find(c => c.id === challengeId)
      if (ch) {
        // Record solve on team
        await teamService.recordSolve(
          ch.title, 
          ch.category, 
          res.pointsAwarded, 
          user?.username || 'alex_c'
        )
        // Add to leaderboard
        await leaderboardService.addPointsToTeam(
          user?.teamId || 'team-me', 
          res.pointsAwarded, 
          ch.title
        )
      }
      await refreshChallenges()
    }
    return res
  }

  const unlockHint = async (challengeId: string, hintId: string): Promise<Hint> => {
    const hint = await challengeService.unlockHint(challengeId, hintId)
    await refreshChallenges()
    return hint
  }

  const startInstance = async (challengeId: string): Promise<Challenge> => {
    const ch = await challengeService.startInstance(challengeId)
    await refreshChallenges()
    return ch
  }

  const stopInstance = async (challengeId: string): Promise<Challenge> => {
    const ch = await challengeService.stopInstance(challengeId)
    await refreshChallenges()
    return ch
  }

  return (
    <CTFContext.Provider
      value={{
        challenges,
        isLoading,
        solvedCount,
        totalChallenges,
        totalPointsAvailable,
        earnedPoints,
        unreadAnnouncementsCount,
        submitFlag,
        unlockHint,
        startInstance,
        stopInstance,
        refreshChallenges,
        refreshAnnouncementsCount
      }}
    >
      {children}
    </CTFContext.Provider>
  )
}

export const useCTF = () => {
  const ctx = useContext(CTFContext)
  if (!ctx) throw new Error('useCTF must be used within a CTFProvider')
  return ctx
}
