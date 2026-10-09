export type EventStatus = 'BEFORE_EVENT' | 'LIVE' | 'ENDING_SOON' | 'FINISHED' | 'MAINTENANCE'

export interface EventConfig {
  id: string
  title: string
  edition: string
  organizer: string
  collaborator: string
  durationHours: number
  startTime: string
  endTime: string
  status: EventStatus
  isRegistrationOpen: boolean
  totalChallengesMock: number
  acmContributionPercent: number
  nearAiContributionPercent: number
  isPaused?: boolean
  pausedRemainingSeconds?: number
}

export interface ReleaseWaveConfig {
  id: string
  waveNumber: number
  title: string
  unlockAt: string // ISO timestamp or date-time string
  isUnlocked: boolean
}

export type ChallengeCategory = 
  | 'Web'
  | 'Crypto'
  | 'Forensics'
  | 'OSINT'
  | 'Reverse Engineering'
  | 'Pwn'
  | 'Miscellaneous'

export type ChallengeDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Insane'

export type ChallengeSource = 'ACM' | 'NEAR.AI'

export interface FileAttachment {
  name: string
  size?: string
  sha256?: string
  downloadUrl?: string
  url?: string
  isLink?: boolean
  type?: 'file' | 'link' | 'gdrive'
}

export interface InstanceTarget {
  id: string
  host: string
  port: number
  protocol: 'tcp' | 'http' | 'ssh'
  status: 'stopped' | 'starting' | 'running' | 'terminated'
  expiresInSeconds?: number
}

export interface Hint {
  id: string
  order: number
  content: string
  cost: number
  isUnlocked?: boolean
}

export interface Challenge {
  id: string
  slug: string
  title: string
  category: ChallengeCategory
  difficulty: ChallengeDifficulty
  points: number
  source: ChallengeSource
  author: string
  description: string
  files?: FileAttachment[]
  hints: Hint[]
  target?: InstanceTarget
  solvesCount: number
  isSolved?: boolean
  solvedAt?: string
  isLocked?: boolean
  lockReason?: string
  releaseWave?: number // Wave number: 1 = Initial (Start of CTF), 2 = Hour 1, 3 = Hour 2, etc.
  unlockAt?: string    // Optional exact ISO timestamp
}

export type UserRole = 'participant' | 'organizer'

export interface User {
  id: string
  username: string
  displayName: string
  email: string
  role: UserRole
  teamId?: string
  teamName?: string
  isTeamCaptain?: boolean
  score: number
  solvedCount: number
  createdAt: string
  usn?: string
  year?: string
  branch?: string
  phone?: string
  isProfileComplete?: boolean
}

export interface ProvisionedAccount {
  id: string
  teamName: string
  email: string
  password: string
  role: UserRole
  name?: string
  usn?: string
  year?: string
  branch?: string
  phone?: string
  isProfileComplete?: boolean
  createdAt: string
}

export interface TeamMember {
  id: string
  username: string
  displayName: string
  isCaptain: boolean
  solvesCount: number
  pointsContributed: number
  joinedAt: string
}

export interface TeamSolve {
  challengeId: string
  slug?: string
  challengeTitle: string
  category: ChallengeCategory
  points: number
  solvedAt: string
  solvedByUsername: string
}

export interface Team {
  id: string
  name: string
  rank: number
  score: number
  inviteCode: string
  members: TeamMember[]
  solves: TeamSolve[]
  createdAt: string
}

export interface Submission {
  id: string
  challengeId: string
  challengeTitle: string
  teamId: string
  teamName: string
  userId: string
  username: string
  flagMasked: string
  status: 'correct' | 'incorrect' | 'already_solved' | 'rate_limited'
  timestamp: string
  pointsAwarded: number
}

export interface LeaderboardEntry {
  rank: number
  prevRank: number
  teamId: string
  teamName: string
  score: number
  solvesCount: number
  lastSolveTime: string
  membersCount: number
  isCurrentTeam?: boolean
  scoreTimeline: { minuteOffset: number; score: number }[]
}

export type AnnouncementPriority = 'urgent' | 'update' | 'info'
export type AnnouncementCategory = 'general' | 'challenges' | 'infrastructure' | 'rules'

export interface Announcement {
  id: string
  title: string
  content: string
  priority: AnnouncementPriority
  category: AnnouncementCategory
  timestamp: string
  author: string
  isRead?: boolean
}
