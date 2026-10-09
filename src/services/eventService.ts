import { EventConfig, EventStatus } from '../types'
import { mockFetch } from './apiClient'
import { INITIAL_EVENT_CONFIG } from '../data/mockData'

const EVENT_STORAGE_KEY = 'acm_ctf_event_config'

class EventService {
  private config: EventConfig

  constructor() {
    const saved = localStorage.getItem(EVENT_STORAGE_KEY)
    if (saved) {
      try {
        this.config = JSON.parse(saved)
      } catch {
        this.config = structuredClone(INITIAL_EVENT_CONFIG)
      }
    } else {
      this.config = structuredClone(INITIAL_EVENT_CONFIG)
      this.saveState()
    }
  }

  private saveState() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(this.config))
        const bc = new BroadcastChannel('acm_ctf_event_channel')
        bc.postMessage({ type: 'EVENT_CONFIG_UPDATED', config: this.config })
        bc.close()
        window.dispatchEvent(new CustomEvent('acm_event_config_changed', { detail: this.config }))
      } catch {
        // Fallback if BroadcastChannel or CustomEvent is unsupported
      }
    }
  }

  async getEventConfig(): Promise<EventConfig> {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(EVENT_STORAGE_KEY)
      if (saved) {
        try {
          this.config = JSON.parse(saved)
        } catch {
          // Keep current in-memory config
        }
      }
    }
    return mockFetch(this.config, 50)
  }

  async setEventStatus(status: EventStatus): Promise<EventConfig> {
    this.config.status = status
    
    // Adjust timestamps realistically when switching state for testing
    const now = Date.now()
    if (status === 'BEFORE_EVENT') {
      this.config.startTime = new Date(now + 2 * 3600 * 1000).toISOString()
      this.config.endTime = new Date(now + 8 * 3600 * 1000).toISOString()
    } else if (status === 'LIVE') {
      this.config.startTime = new Date(now - 2 * 3600 * 1000).toISOString()
      this.config.endTime = new Date(now + 4 * 3600 * 1000).toISOString() // 4 hours remaining
    } else if (status === 'ENDING_SOON') {
      this.config.startTime = new Date(now - 5 * 3600 * 1000 - 45 * 60 * 1000).toISOString()
      this.config.endTime = new Date(now + 15 * 60 * 1000).toISOString() // 15 mins remaining
    } else if (status === 'FINISHED') {
      this.config.startTime = new Date(now - 7 * 3600 * 1000).toISOString()
      this.config.endTime = new Date(now - 1 * 3600 * 1000).toISOString()
    }

    this.saveState()
    return mockFetch(this.config, 100)
  }

  async setCustomTimer(hours: number, minutes: number, seconds: number = 0): Promise<EventConfig> {
    const totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000
    const now = Date.now()
    this.config.isPaused = false
    this.config.startTime = new Date(now - 1000).toISOString()
    this.config.endTime = new Date(now + totalMs).toISOString()
    if (totalMs <= 0) {
      this.config.status = 'FINISHED'
    } else if (totalMs <= 15 * 60 * 1000) {
      this.config.status = 'ENDING_SOON'
    } else {
      this.config.status = 'LIVE'
    }
    this.saveState()
    return mockFetch(this.config, 50)
  }

  async adjustTimerMinutes(deltaMinutes: number): Promise<EventConfig> {
    const now = Date.now()
    const currentEnd = new Date(this.config.endTime).getTime()
    const currentRemaining = Math.max(0, currentEnd - now)
    const newRemaining = Math.max(0, currentRemaining + deltaMinutes * 60 * 1000)
    return this.setCustomTimer(0, 0, Math.floor(newRemaining / 1000))
  }

  async setEventTimes(startTime: string, endTime: string): Promise<EventConfig> {
    this.config.startTime = startTime
    this.config.endTime = endTime
    const now = Date.now()
    const end = new Date(endTime).getTime()
    const start = new Date(startTime).getTime()
    if (now < start) {
      this.config.status = 'BEFORE_EVENT'
    } else if (now >= end) {
      this.config.status = 'FINISHED'
    } else if (end - now <= 15 * 60 * 1000) {
      this.config.status = 'ENDING_SOON'
    } else {
      this.config.status = 'LIVE'
    }
    this.saveState()
    return mockFetch(this.config, 50)
  }

  async togglePauseTimer(): Promise<EventConfig> {
    const now = Date.now()
    if (this.config.isPaused) {
      const remainingSeconds = this.config.pausedRemainingSeconds || 0
      this.config.isPaused = false
      this.config.endTime = new Date(now + remainingSeconds * 1000).toISOString()
      delete this.config.pausedRemainingSeconds
    } else {
      const end = new Date(this.config.endTime).getTime()
      const remainingSec = Math.max(0, Math.round((end - now) / 1000))
      this.config.isPaused = true
      this.config.pausedRemainingSeconds = remainingSec
    }
    this.saveState()
    return mockFetch(this.config, 50)
  }

  async resetEvent(): Promise<void> {
    this.config = structuredClone(INITIAL_EVENT_CONFIG)
    this.saveState()
    await mockFetch(true, 50)
  }
}

export const eventService = new EventService()
