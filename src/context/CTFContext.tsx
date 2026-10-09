import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Challenge, Hint, ReleaseWaveConfig } from '../types'
import { challengeService, FlagSubmissionResult } from '../services/challengeService'
import { teamService } from '../services/teamService'
import { leaderboardService } from '../services/leaderboardService'
import { announcementService } from '../services/announcementService'
import { realtimeSync } from '../services/realtimeSync'
import { useAuth } from './AuthContext'
import { useToast } from '../components/ui/Toast'

interface CTFContextType {
  challenges: Challenge[]
  isLoading: boolean
  solvedCount: number
  totalChallenges: number
  totalPointsAvailable: number
  earnedPoints: number
  unreadAnnouncementsCount: number
  unlockedWaves: number[]
  waves: ReleaseWaveConfig[]
  submitFlag: (challengeId: string, flag: string) => Promise<FlagSubmissionResult>
  unlockHint: (challengeId: string, hintId: string) => Promise<Hint>
  startInstance: (challengeId: string) => Promise<Challenge>
  stopInstance: (challengeId: string) => Promise<Challenge>
  refreshChallenges: () => Promise<void>
  refreshAnnouncementsCount: () => Promise<void>
  unlockWave: (waveNumber: number) => Promise<void>
  lockWave: (waveNumber: number) => Promise<void>
  setChallengeWave: (challengeId: string, wave: number) => Promise<void>
  addWave: (title: string, unlockAt: string) => Promise<ReleaseWaveConfig>
  updateWave: (id: string, updates: Partial<ReleaseWaveConfig>) => Promise<ReleaseWaveConfig>
  deleteWave: (id: string) => Promise<void>
  generateWavesForCTF: (durationHours: number, waveCount: number, startTime?: string) => Promise<ReleaseWaveConfig[]>
  distributeChallengesEvenly: () => Promise<void>
}

const CTFContext = createContext<CTFContextType | undefined>(undefined)

export const CTFProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [waves, setWaves] = useState<ReleaseWaveConfig[]>(challengeService.getWaves())
  const [unlockedWaves, setUnlockedWaves] = useState<number[]>(challengeService.getUnlockedWaves())
  const [isLoading, setIsLoading] = useState(true)
  const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(2)

  const refreshChallenges = useCallback(async () => {
    try {
      const data = await challengeService.getChallenges(user?.teamName)
      setChallenges(data)
      setWaves(challengeService.getWaves())
      setUnlockedWaves(challengeService.getUnlockedWaves())
    } finally {
      setIsLoading(false)
    }
  }, [user?.teamName])

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
  }, [refreshChallenges])

  // Real-time synchronization listener
  useEffect(() => {
    const unsubscribe = realtimeSync.subscribe(async (msg) => {
      if (msg.type === 'TEAM_SOLVE') {
        const { teamName, challengeTitle, points, solvedBy } = msg.payload
        // Check if this solve is for our team
        const myTeam = user?.teamName?.toLowerCase()
        const eventTeam = (teamName || '').toLowerCase()

        if (myTeam && eventTeam && myTeam === eventTeam) {
          await refreshChallenges()
          
          // If solved by teammate, notify with celebratory toast
          if (solvedBy !== user?.username && solvedBy !== user?.displayName) {
            toast({
              type: 'success',
              title: '🎉 Teammate Solved Challenge!',
              description: `${solvedBy} solved "${challengeTitle}" for +${points} points!`
            })
          }
        }
      }

      if (msg.type === 'WAVE_UNLOCKED') {
        await refreshChallenges()
        await refreshAnnouncementsCount()
        toast({
          type: 'info',
          title: `🚀 Wave ${msg.payload.waveNumber} Unlocked!`,
          description: `${msg.payload.count} new challenges are now active on the board!`
        })
      }

      if (msg.type === 'CHALLENGES_UPDATED') {
        await refreshChallenges()
      }

      if (msg.type === 'ANNOUNCEMENT_NEW') {
        await refreshAnnouncementsCount()
        toast({
          type: 'info',
          title: `📢 New Broadcast: ${msg.payload.title}`,
          description: msg.payload.content
        })
      }
    })

    return () => {
      unsubscribe()
    }
  }, [user?.teamName, user?.username, user?.displayName, refreshChallenges, toast])

  const solvedCount = challenges.filter(c => c.isSolved).length
  const totalChallenges = challenges.length
  const totalPointsAvailable = challenges.reduce((acc, c) => acc + c.points, 0)
  const earnedPoints = challenges.filter(c => c.isSolved).reduce((acc, c) => acc + c.points, 0)

  const submitFlag = async (challengeId: string, flag: string): Promise<FlagSubmissionResult> => {
    const currentTeam = user?.teamName || 'RootAccess'
    const currentUser = user?.displayName || user?.username || 'alex_c'

    const res = await challengeService.submitFlag(challengeId, flag, currentTeam, currentUser)
    if (res.status === 'correct') {
      const ch = challenges.find(c => c.id === challengeId)
      if (ch) {
        // Record solve on team
        await teamService.recordSolve(
          ch.title, 
          ch.category, 
          res.pointsAwarded, 
          currentUser
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

  // Periodic auto-check for timestamp-based wave unlock
  useEffect(() => {
    const timer = setInterval(() => {
      const currentWaves = challengeService.getWaves()
      const currentUnlocked = challengeService.getUnlockedWaves()
      if (currentUnlocked.length !== unlockedWaves.length) {
        setWaves(currentWaves)
        setUnlockedWaves(currentUnlocked)
        refreshChallenges()
      }
    }, 10000)

    return () => clearInterval(timer)
  }, [unlockedWaves.length, refreshChallenges])

  const unlockWave = async (waveNumber: number) => {
    await challengeService.unlockWave(waveNumber, true)
    await refreshChallenges()
    await refreshAnnouncementsCount()
  }

  const lockWave = async (waveNumber: number) => {
    await challengeService.lockWave(waveNumber)
    await refreshChallenges()
  }

  const setChallengeWave = async (challengeId: string, wave: number) => {
    await challengeService.setChallengeWave(challengeId, wave)
    await refreshChallenges()
  }

  const addWave = async (title: string, unlockAt: string) => {
    const w = await challengeService.addWave(title, unlockAt)
    await refreshChallenges()
    return w
  }

  const updateWave = async (id: string, updates: Partial<ReleaseWaveConfig>) => {
    const w = await challengeService.updateWave(id, updates)
    await refreshChallenges()
    return w
  }

  const deleteWave = async (id: string) => {
    await challengeService.deleteWave(id)
    await refreshChallenges()
  }

  const generateWavesForCTF = async (durationHours: number, waveCount: number, startTime?: string) => {
    const res = await challengeService.generateWavesForCTF(durationHours, waveCount, startTime)
    await refreshChallenges()
    return res
  }

  const distributeChallengesEvenly = async () => {
    challengeService.distributeChallengesAcrossWaves()
    await refreshChallenges()
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
        unlockedWaves,
        waves,
        submitFlag,
        unlockHint,
        startInstance,
        stopInstance,
        refreshChallenges,
        refreshAnnouncementsCount,
        unlockWave,
        lockWave,
        setChallengeWave,
        addWave,
        updateWave,
        deleteWave,
        generateWavesForCTF,
        distributeChallengesEvenly
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
