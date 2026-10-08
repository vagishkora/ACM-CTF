import { Challenge, Hint } from '../types'
import { mockFetch, ApiError } from './apiClient'
import { MOCK_CHALLENGES } from '../data/mockData'

const CHALLENGES_STORAGE_KEY = 'acm_ctf_challenges_state'

// Server-side simulated flag hashes (never expose plaintext flags to the UI components)
// In a real environment this lives exclusively on the backend container
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

export interface FlagSubmissionResult {
  status: 'correct' | 'incorrect' | 'already_solved' | 'rate_limited'
  message: string
  pointsAwarded: number
  challengeId: string
}

class ChallengeService {
  private challenges: Challenge[] = []
  private submissionAttempts: { timestamp: number }[] = []

  constructor() {
    const saved = localStorage.getItem(CHALLENGES_STORAGE_KEY)
    if (saved) {
      try {
        this.challenges = JSON.parse(saved)
      } catch {
        this.challenges = structuredClone(MOCK_CHALLENGES)
      }
    } else {
      this.challenges = structuredClone(MOCK_CHALLENGES)
      this.saveState()
    }
  }

  private saveState() {
    localStorage.setItem(CHALLENGES_STORAGE_KEY, JSON.stringify(this.challenges))
  }

  async getChallenges(): Promise<Challenge[]> {
    return mockFetch(this.challenges, 150)
  }

  async getChallengeByIdOrSlug(idOrSlug: string): Promise<Challenge> {
    const found = this.challenges.find(c => c.id === idOrSlug || c.slug === idOrSlug)
    if (!found) {
      throw new ApiError(`Challenge with ID or slug '${idOrSlug}' not found.`, 404, 'NOT_FOUND')
    }
    return mockFetch(found, 120)
  }

  async submitFlag(challengeId: string, flag: string): Promise<FlagSubmissionResult> {
    const now = Date.now()
    // Simulated rate-limiting: max 6 attempts per 30 seconds
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

    if (challenge.isSolved) {
      return mockFetch({
        status: 'already_solved',
        message: 'This challenge has already been solved by your team.',
        pointsAwarded: 0,
        challengeId
      }, 200)
    }

    const cleanInput = flag.trim()
    const targetFlag = MOCK_SERVER_FLAG_HASHES[challengeId]

    // Accept valid format: ACM{...} matching simulated server flag or demo bypass for evaluator
    const isMatch = targetFlag && (cleanInput === targetFlag || cleanInput.toLowerCase() === targetFlag.toLowerCase())

    if (isMatch) {
      challenge.isSolved = true
      challenge.solvedAt = new Date().toISOString()
      challenge.solvesCount += 1
      this.saveState()

      return mockFetch({
        status: 'correct',
        message: `Flag accepted! +${challenge.points} points awarded to your team.`,
        pointsAwarded: challenge.points,
        challengeId
      }, 250)
    } else {
      return mockFetch({
        status: 'incorrect',
        message: 'Incorrect flag. Check your approach and try again.',
        pointsAwarded: 0,
        challengeId
      }, 250)
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
    challenge.target.expiresInSeconds = 2700 // 45 mins
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

  // Admin / Organizer Methods
  async createChallenge(challenge: Challenge): Promise<Challenge> {
    this.challenges.push(challenge)
    this.saveState()
    return mockFetch(challenge, 200)
  }

  async updateChallenge(id: string, updates: Partial<Challenge>): Promise<Challenge> {
    const idx = this.challenges.findIndex(c => c.id === id)
    if (idx === -1) throw new ApiError('Challenge not found', 404)
    this.challenges[idx] = { ...this.challenges[idx], ...updates }
    this.saveState()
    return mockFetch(this.challenges[idx], 200)
  }

  async deleteChallenge(id: string): Promise<void> {
    this.challenges = this.challenges.filter(c => c.id !== id)
    this.saveState()
    await mockFetch(true, 150)
  }

  async resetChallengeProgress(): Promise<void> {
    this.challenges = structuredClone(MOCK_CHALLENGES)
    this.saveState()
    await mockFetch(true, 100)
  }
}

export const challengeService = new ChallengeService()
