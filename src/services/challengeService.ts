import { Challenge, Hint, ReleaseWaveConfig } from '../types'
import { mockFetch, ApiError } from './apiClient'
import { MOCK_CHALLENGES } from '../data/mockData'
import { supabase } from '../lib/supabase'
import { realtimeSync } from './realtimeSync'
import { announcementService } from './announcementService'

const CHALLENGES_STORAGE_KEY = 'acm_ctf_challenges_state'
const TEAM_SOLVES_STORAGE_KEY = 'acm_ctf_team_solves_map'
const WAVES_CONFIG_STORAGE_KEY = 'acm_ctf_release_waves_config'

const MOCK_SERVER_FLAG_HASHES: Record<string, string> = {
  'ch-web-01': 'ACM{x_forwarded_admin_bypass_2026}',
  'ch-rev-01': 'ACM{crc32_seed_unlocked_99a8}',
  'ch-near-01': 'ACM{near_ai_evaluator_adversarial_jailbreak}',
  'ch-crypto-01': 'ACM{lfsr_berlekamp_massey_recovered}',
  'ch-pwn-01': 'ACM{rop_gadget_stack_pivot_win}',
  'ch-forensics-01': 'ACM{journal_inode_carved_flag_2026}',
  'ch-near-02': 'ACM{wasm_invariant_arithmetic_overflow}',
  'ch-osint-01': 'ACM{doppler_grid_locator_fn20xj}',
  'ch-web-02': 'ACM{jwt_kid_dev_null_key_bypass}',
  'ch-near-03': 'ACM{attention_weights_stego_parity}',
  'ch-pwn-02': 'ACM{dlmalloc_unlink_chunk_overlap}',
  'ch-forensics-02': 'ACM{volatility_vad_dll_extracted}',
  'ch-rev-02': 'ACM{vm_accumulator_opcode_solved}',
  'ch-misc-01': 'ACM{spi_cpha1_logic_tap_decoded}'
}

const FLAGS_STORAGE_KEY = 'acm_ctf_flags_state'

export interface FlagSubmissionResult {
  status: 'correct' | 'incorrect' | 'already_solved' | 'rate_limited'
  message: string
  pointsAwarded: number
  challengeId: string
}

class ChallengeService {
  private challenges: Challenge[] = []
  private flags: Record<string, string> = {}
  private submissionAttempts: { timestamp: number }[] = []
  // Map of teamName (lowercased) -> Set of solved challenge IDs
  private teamSolves: Record<string, string[]> = {}
  private waves: ReleaseWaveConfig[] = []

  constructor() {
    const saved = localStorage.getItem(CHALLENGES_STORAGE_KEY)
    if (saved) {
      try {
        const parsed: Challenge[] = JSON.parse(saved)
        this.challenges = parsed.map((c, i) => ({
          ...c,
          releaseWave: c.releaseWave || (i < 6 ? 1 : i < 10 ? 2 : 3)
        }))
      } catch {
        this.challenges = structuredClone(MOCK_CHALLENGES)
      }
    } else {
      this.challenges = structuredClone(MOCK_CHALLENGES)
      this.saveState()
    }

    const savedWavesConfig = localStorage.getItem(WAVES_CONFIG_STORAGE_KEY)
    if (savedWavesConfig) {
      try {
        this.waves = JSON.parse(savedWavesConfig)
      } catch {
        this.initDefaultWaves()
      }
    } else {
      this.initDefaultWaves()
    }

    const savedFlags = localStorage.getItem(FLAGS_STORAGE_KEY)
    if (savedFlags) {
      try {
        this.flags = JSON.parse(savedFlags)
      } catch {
        this.flags = { ...MOCK_SERVER_FLAG_HASHES }
      }
    } else {
      this.flags = { ...MOCK_SERVER_FLAG_HASHES }
      this.saveFlags()
    }

    const savedSolves = localStorage.getItem(TEAM_SOLVES_STORAGE_KEY)
    if (savedSolves) {
      try {
        this.teamSolves = JSON.parse(savedSolves)
      } catch {
        this.teamSolves = {}
      }
    }

    // Auto-balance challenges across all configured waves if higher waves are currently empty
    const maxWave = this.waves.length > 0 ? Math.max(...this.waves.map(w => w.waveNumber)) : 1
    const hasHigherEmptyWaves = maxWave > 3 && this.challenges.length > 0 && this.challenges.every(c => (c.releaseWave || 1) <= 3)
    if (hasHigherEmptyWaves) {
      this.distributeChallengesAcrossWaves(maxWave)
    }

    // Sync from Supabase team_solves
    this.syncSolvesFromSupabase()

    // Listen for realtime solves
    realtimeSync.subscribe((msg) => {
      if (msg.type === 'TEAM_SOLVE') {
        const { teamName, challengeId } = msg.payload
        if (teamName && challengeId) {
          const tKey = teamName.toLowerCase()
          if (!this.teamSolves[tKey]) {
            this.teamSolves[tKey] = []
          }
          if (!this.teamSolves[tKey].includes(challengeId)) {
            this.teamSolves[tKey].push(challengeId)
            this.saveSolves()
          }
        }
      }
    })
  }

  private initDefaultWaves() {
    const now = new Date()
    this.waves = [
      {
        id: 'wave-1',
        waveNumber: 1,
        title: 'Wave 1: Launch Phase (Initial Drop)',
        unlockAt: now.toISOString(),
        isUnlocked: true
      },
      {
        id: 'wave-2',
        waveNumber: 2,
        title: 'Wave 2: Mid-Game Surge',
        unlockAt: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
        isUnlocked: false
      },
      {
        id: 'wave-3',
        waveNumber: 3,
        title: 'Wave 3: Final Challenge Drop',
        unlockAt: new Date(now.getTime() + 120 * 60 * 1000).toISOString(),
        isUnlocked: false
      }
    ]
    this.saveWavesConfig()
  }

  private saveState() {
    localStorage.setItem(CHALLENGES_STORAGE_KEY, JSON.stringify(this.challenges))
  }

  private saveFlags() {
    localStorage.setItem(FLAGS_STORAGE_KEY, JSON.stringify(this.flags))
  }

  private saveSolves() {
    localStorage.setItem(TEAM_SOLVES_STORAGE_KEY, JSON.stringify(this.teamSolves))
  }

  private saveWavesConfig() {
    localStorage.setItem(WAVES_CONFIG_STORAGE_KEY, JSON.stringify(this.waves))
    try {
      const bc = new BroadcastChannel('acm_ctf_waves_channel')
      bc.postMessage({ type: 'WAVES_UPDATED', waves: this.waves })
      bc.close()
    } catch {
      // fallback
    }
  }

  private async syncSolvesFromSupabase() {
    try {
      const { data, error } = await supabase.from('team_solves').select('*')
      if (!error && data) {
        data.forEach((row: any) => {
          const tKey = (row.team_name || '').toLowerCase()
          if (tKey && row.challenge_id) {
            if (!this.teamSolves[tKey]) {
              this.teamSolves[tKey] = []
            }
            if (!this.teamSolves[tKey].includes(row.challenge_id)) {
              this.teamSolves[tKey].push(row.challenge_id)
            }
          }
        })
        this.saveSolves()
      }
    } catch {
      // Supabase table may not exist yet, fallback gracefully
    }
  }

  isWaveUnlocked(waveNumber: number): boolean {
    if (waveNumber <= 1) return true
    const wave = this.waves.find(w => w.waveNumber === waveNumber)
    if (!wave) return false
    if (wave.isUnlocked) return true
    if (wave.unlockAt && new Date(wave.unlockAt).getTime() <= Date.now()) {
      wave.isUnlocked = true
      this.saveWavesConfig()
      return true
    }
    return false
  }

  getUnlockedWaves(): number[] {
    const unlocked: number[] = [1]
    this.waves.forEach(w => {
      if (this.isWaveUnlocked(w.waveNumber) && !unlocked.includes(w.waveNumber)) {
        unlocked.push(w.waveNumber)
      }
    })
    return unlocked.sort((a, b) => a - b)
  }

  getWaves(): ReleaseWaveConfig[] {
    let changed = false
    const now = Date.now()
    this.waves.forEach(w => {
      if (!w.isUnlocked && w.unlockAt && new Date(w.unlockAt).getTime() <= now) {
        w.isUnlocked = true
        changed = true
      }
    })
    if (changed) {
      this.saveWavesConfig()
    }
    return [...this.waves].sort((a, b) => a.waveNumber - b.waveNumber)
  }

  async addWave(title: string, unlockAt: string): Promise<ReleaseWaveConfig> {
    const nextNumber = this.waves.length > 0 
      ? Math.max(...this.waves.map(w => w.waveNumber)) + 1 
      : 1
    const newWave: ReleaseWaveConfig = {
      id: `wave-${Date.now()}-${nextNumber}`,
      waveNumber: nextNumber,
      title: title.trim() || `Wave ${nextNumber}`,
      unlockAt,
      isUnlocked: new Date(unlockAt).getTime() <= Date.now()
    }
    this.waves.push(newWave)
    this.saveWavesConfig()
    realtimeSync.broadcast('CHALLENGES_UPDATED', { newWave })
    return newWave
  }

  async updateWave(id: string, updates: Partial<ReleaseWaveConfig>): Promise<ReleaseWaveConfig> {
    const idx = this.waves.findIndex(w => w.id === id)
    if (idx === -1) throw new ApiError('Wave not found', 404)
    this.waves[idx] = { ...this.waves[idx], ...updates }
    this.saveWavesConfig()
    realtimeSync.broadcast('CHALLENGES_UPDATED', { updatedWave: this.waves[idx] })
    return this.waves[idx]
  }

  async deleteWave(id: string): Promise<void> {
    this.waves = this.waves.filter(w => w.id !== id)
    this.saveWavesConfig()
    realtimeSync.broadcast('CHALLENGES_UPDATED', { deletedWaveId: id })
  }

  distributeChallengesAcrossWaves(waveCount?: number): void {
    const availableWaves = this.waves.map(w => w.waveNumber)
    const count = waveCount || (availableWaves.length > 0 ? Math.max(...availableWaves) : 1)
    if (count <= 0 || this.challenges.length === 0) return

    this.challenges.forEach((ch, idx) => {
      const assignedWave = (idx % count) + 1
      ch.releaseWave = assignedWave
    })
    this.saveState()
    realtimeSync.broadcast('CHALLENGES_UPDATED', { redistributed: true })
  }

  async generateWavesForCTF(totalDurationHours: number, waveCount: number, startTime?: string): Promise<ReleaseWaveConfig[]> {
    const startMs = startTime ? new Date(startTime).getTime() : Date.now()
    const totalDurationMs = Math.max(0.5, totalDurationHours) * 3600 * 1000
    const count = Math.max(1, Math.min(12, waveCount))
    const intervalMs = count > 1 ? totalDurationMs / (count - 1) : 0

    const newWaves: ReleaseWaveConfig[] = []
    for (let i = 1; i <= count; i++) {
      const unlockTime = new Date(startMs + (i - 1) * intervalMs).toISOString()
      const isPastOrNow = new Date(unlockTime).getTime() <= Date.now()
      newWaves.push({
        id: `wave-${Date.now()}-${i}`,
        waveNumber: i,
        title: i === 1 
          ? `Wave 1: CTF Opening Drop` 
          : i === count 
          ? `Wave ${i}: Final Sprint Release` 
          : `Wave ${i}: Hour ${Math.round(((i - 1) * intervalMs) / (3600 * 1000) * 10) / 10} Drop`,
        unlockAt: unlockTime,
        isUnlocked: i === 1 || isPastOrNow
      })
    }

    this.waves = newWaves
    this.saveWavesConfig()
    this.distributeChallengesAcrossWaves(count)
    realtimeSync.broadcast('CHALLENGES_UPDATED', { regeneratedWaves: true })
    return this.waves
  }

  async getChallenges(teamName?: string): Promise<Challenge[]> {
    await this.syncSolvesFromSupabase()
    const tKey = (teamName || 'rootaccess').toLowerCase()
    const solvedSet = new Set(this.teamSolves[tKey] || [])

    // Return challenges mapped to team's solved state and wave unlock state
    return mockFetch(
      this.challenges.map(c => {
        const wave = c.releaseWave || 1
        const isLocked = !this.isWaveUnlocked(wave)
        return {
          ...c,
          releaseWave: wave,
          isLocked,
          lockReason: isLocked ? `Locked • Scheduled for Wave ${wave}` : undefined,
          isSolved: solvedSet.has(c.id)
        }
      }), 
      100
    )
  }

  async getChallengeByIdOrSlug(idOrSlug: string, teamName?: string): Promise<Challenge> {
    const found = this.challenges.find(c => c.id === idOrSlug || c.slug === idOrSlug)
    if (!found) {
      throw new ApiError(`Challenge with ID or slug '${idOrSlug}' not found.`, 404, 'NOT_FOUND')
    }
    const tKey = (teamName || 'rootaccess').toLowerCase()
    const isSolved = (this.teamSolves[tKey] || []).includes(found.id)
    const wave = found.releaseWave || 1
    const isLocked = !this.isWaveUnlocked(wave)
    return mockFetch({ 
      ...found, 
      releaseWave: wave,
      isLocked,
      lockReason: isLocked ? `Locked • Scheduled for Wave ${wave}` : undefined,
      isSolved 
    }, 100)
  }

  async submitFlag(
    challengeId: string, 
    flag: string, 
    teamName: string = 'RootAccess', 
    username: string = 'alex_c'
  ): Promise<FlagSubmissionResult> {
    const now = Date.now()
    this.submissionAttempts = this.submissionAttempts.filter(a => now - a.timestamp < 30000)
    if (this.submissionAttempts.length >= 6) {
      return mockFetch({
        status: 'rate_limited',
        message: 'Rate limit exceeded: Please wait 15 seconds before submitting another flag.',
        pointsAwarded: 0,
        challengeId
      }, 150)
    }

    this.submissionAttempts.push({ timestamp: now })

    const challenge = this.challenges.find(c => c.id === challengeId)
    if (!challenge) {
      throw new ApiError('Challenge not found', 404, 'NOT_FOUND')
    }

    // Guard against submitting flags to locked wave challenges
    const wave = challenge.releaseWave || 1
    if (!this.isWaveUnlocked(wave)) {
      return mockFetch({
        status: 'incorrect',
        message: `This challenge is locked until Wave ${wave}. Submissions are not open yet.`,
        pointsAwarded: 0,
        challengeId
      }, 150)
    }

    const tKey = teamName.toLowerCase()
    const currentSolves = this.teamSolves[tKey] || []

    if (currentSolves.includes(challengeId)) {
      return mockFetch({
        status: 'already_solved',
        message: 'This challenge has already been solved by your team.',
        pointsAwarded: 0,
        challengeId
      }, 200)
    }

    const cleanInput = flag.trim()
    const targetFlag = this.flags[challengeId] || MOCK_SERVER_FLAG_HASHES[challengeId]

    const isMatch = targetFlag && (cleanInput === targetFlag || cleanInput.toLowerCase() === targetFlag.toLowerCase())

    if (isMatch) {
      // Record team solve locally
      if (!this.teamSolves[tKey]) {
        this.teamSolves[tKey] = []
      }
      this.teamSolves[tKey].push(challengeId)
      this.saveSolves()

      challenge.solvesCount += 1
      this.saveState()

      // Record to Supabase
      try {
        await supabase.from('team_solves').insert({
          team_name: teamName,
          challenge_id: challenge.id,
          challenge_title: challenge.title,
          category: challenge.category,
          points: challenge.points,
          solved_by: username
        })
      } catch {
        // fallback
      }

      // Realtime Broadcast across devices and tabs!
      realtimeSync.broadcast('TEAM_SOLVE', {
        teamName,
        challengeId: challenge.id,
        challengeTitle: challenge.title,
        category: challenge.category,
        points: challenge.points,
        solvedBy: username
      })

      return mockFetch({
        status: 'correct',
        message: `Flag accepted! +${challenge.points} points awarded to team ${teamName}.`,
        pointsAwarded: challenge.points,
        challengeId
      }, 200)
    } else {
      return mockFetch({
        status: 'incorrect',
        message: 'Incorrect flag. Check your approach and try again.',
        pointsAwarded: 0,
        challengeId
      }, 200)
    }
  }

  async unlockHint(challengeId: string, hintId: string): Promise<Hint> {
    const challenge = this.challenges.find(c => c.id === challengeId)
    if (!challenge) {
      throw new ApiError('Challenge not found', 404)
    }
    const hint = challenge.hints.find(h => h.id === hintId)
    if (!hint) {
      throw new ApiError('Hint not found', 404)
    }
    hint.isUnlocked = true
    this.saveState()
    return mockFetch(hint, 150)
  }

  async startInstance(challengeId: string): Promise<Challenge> {
    const challenge = this.challenges.find(c => c.id === challengeId)
    if (!challenge || !challenge.target) {
      throw new ApiError('Target instance not available for this challenge', 400)
    }
    challenge.target.status = 'running'
    challenge.target.expiresInSeconds = 2700
    this.saveState()
    return mockFetch(challenge, 350)
  }

  async stopInstance(challengeId: string): Promise<Challenge> {
    const challenge = this.challenges.find(c => c.id === challengeId)
    if (!challenge || !challenge.target) {
      throw new ApiError('Target instance not available for this challenge', 400)
    }
    challenge.target.status = 'stopped'
    challenge.target.expiresInSeconds = 0
    this.saveState()
    return mockFetch(challenge, 200)
  }

  getFlag(challengeId: string): string {
    return this.flags[challengeId] || MOCK_SERVER_FLAG_HASHES[challengeId] || 'ACM{demo_flag_evaluator}'
  }

  // Wave Release & Hourly Drop Control Methods
  async unlockWave(waveNumber: number, autoAnnounce: boolean = true): Promise<{ count: number; challenges: Challenge[] }> {
    const wave = this.waves.find(w => w.waveNumber === waveNumber)
    if (wave) {
      wave.isUnlocked = true
      this.saveWavesConfig()
    } else {
      this.waves.push({
        id: `wave-${Date.now()}-${waveNumber}`,
        waveNumber,
        title: `Wave ${waveNumber}`,
        unlockAt: new Date().toISOString(),
        isUnlocked: true
      })
      this.saveWavesConfig()
    }

    const matching = this.challenges.filter(c => (c.releaseWave || 1) === waveNumber)

    // Broadcast realtime event
    realtimeSync.broadcast('WAVE_UNLOCKED', { waveNumber, count: matching.length })
    realtimeSync.broadcast('CHALLENGES_UPDATED', { waveNumber, unlocked: true })

    if (autoAnnounce && matching.length > 0) {
      const categories = [...new Set(matching.map(c => c.category))].join(', ')
      try {
        await announcementService.createAnnouncement(
          `🚀 Wave ${waveNumber} Challenges Released!`,
          `${matching.length} new challenges across ${categories} are now live on the competition board! Jump in and submit your flags.`,
          'update',
          'challenges'
        )
      } catch (err) {
        console.warn('Auto announcement failed:', err)
      }
    }

    return { count: matching.length, challenges: matching }
  }

  async lockWave(waveNumber: number): Promise<void> {
    const wave = this.waves.find(w => w.waveNumber === waveNumber)
    if (wave) {
      wave.isUnlocked = false
      this.saveWavesConfig()
    }
    realtimeSync.broadcast('CHALLENGES_UPDATED', { waveNumber, locked: true })
  }

  async setChallengeWave(challengeId: string, wave: number): Promise<Challenge> {
    const ch = this.challenges.find(c => c.id === challengeId)
    if (!ch) throw new ApiError('Challenge not found', 404)
    ch.releaseWave = wave
    this.saveState()
    realtimeSync.broadcast('CHALLENGES_UPDATED', { challengeId, wave })
    return ch
  }

  async toggleChallengeLock(challengeId: string): Promise<Challenge> {
    const ch = this.challenges.find(c => c.id === challengeId)
    if (!ch) throw new ApiError('Challenge not found', 404)
    const currentWave = ch.releaseWave || 1
    if (this.isWaveUnlocked(currentWave)) {
      ch.releaseWave = 99
    } else {
      ch.releaseWave = 1
    }
    this.saveState()
    realtimeSync.broadcast('CHALLENGES_UPDATED', { challengeId })
    return ch
  }

  // Admin methods
  async createChallenge(challenge: Challenge, flag?: string): Promise<Challenge> {
    this.challenges.push(challenge)
    if (flag) {
      this.flags[challenge.id] = flag.trim()
      this.saveFlags()
    }
    this.saveState()
    return mockFetch(challenge, 200)
  }

  async updateChallenge(
    challengeOrId: Challenge | string, 
    updatesOrFlag?: Partial<Challenge> | string, 
    flag?: string
  ): Promise<Challenge> {
    let targetId: string
    let updates: Partial<Challenge> = {}
    let targetFlag = flag

    if (typeof challengeOrId === 'string') {
      targetId = challengeOrId
      if (typeof updatesOrFlag === 'object') {
        updates = updatesOrFlag
      }
    } else {
      targetId = challengeOrId.id
      updates = challengeOrId
      if (typeof updatesOrFlag === 'string') {
        targetFlag = updatesOrFlag
      }
    }

    const index = this.challenges.findIndex(c => c.id === targetId)
    if (index === -1) {
      throw new ApiError('Challenge not found', 404)
    }
    this.challenges[index] = { ...this.challenges[index], ...updates }
    if (targetFlag) {
      this.flags[targetId] = targetFlag.trim()
      this.saveFlags()
    }
    this.saveState()
    return mockFetch(this.challenges[index], 200)
  }

  async deleteChallenge(challengeId: string): Promise<void> {
    this.challenges = this.challenges.filter(c => c.id !== challengeId)
    delete this.flags[challengeId]
    this.saveState()
    this.saveFlags()
    await mockFetch(true, 150)
  }

  async resetChallenges(): Promise<void> {
    this.challenges = structuredClone(MOCK_CHALLENGES)
    this.flags = { ...MOCK_SERVER_FLAG_HASHES }
    this.teamSolves = {}
    this.saveState()
    this.saveFlags()
    this.saveSolves()
    await mockFetch(true, 200)
  }
}

export const challengeService = new ChallengeService()
