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
    localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(this.config))
  }

  async getEventConfig(): Promise<EventConfig> {
    return mockFetch(this.config, 80)
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

  async resetEvent(): Promise<void> {
    this.config = structuredClone(INITIAL_EVENT_CONFIG)
    this.saveState()
    await mockFetch(true, 50)
  }
}

export const eventService = new EventService()
