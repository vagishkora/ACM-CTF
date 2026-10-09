import { Announcement, AnnouncementPriority, AnnouncementCategory } from '../types'
import { mockFetch, ApiError } from './apiClient'
import { MOCK_ANNOUNCEMENTS } from '../data/mockData'

const ANNOUNCEMENTS_STORAGE_KEY = 'acm_ctf_announcements_state'

class AnnouncementService {
  private announcements: Announcement[] = []

  constructor() {
    const saved = localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY)
    if (saved) {
      try {
        this.announcements = JSON.parse(saved)
      } catch {
        this.announcements = structuredClone(MOCK_ANNOUNCEMENTS)
      }
    } else {
      this.announcements = structuredClone(MOCK_ANNOUNCEMENTS)
      this.saveState()
    }
  }

  private saveState() {
    localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(this.announcements))
  }

  async getAnnouncements(): Promise<Announcement[]> {
    return mockFetch(this.announcements, 120)
  }

  async markAllAsRead(): Promise<void> {
    this.announcements = this.announcements.map(a => ({ ...a, isRead: true }))
    this.saveState()
    await mockFetch(true, 80)
  }

  async markAsRead(id: string): Promise<void> {
    const item = this.announcements.find(a => a.id === id)
    if (item) {
      item.isRead = true
      this.saveState()
    }
    await mockFetch(true, 50)
  }

  async createAnnouncement(
    title: string, 
    content: string, 
    priority: AnnouncementPriority = 'info', 
    category: AnnouncementCategory = 'general',
    author: string = 'ACM Organizer'
  ): Promise<Announcement> {
    if (!title.trim() || !content.trim()) {
      throw new ApiError('Title and content are required.', 400)
    }

    const newAnnouncement: Announcement = {
      id: `ann-${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      priority,
      category,
      timestamp: 'Just now',
      author,
      isRead: false
    }

    this.announcements.unshift(newAnnouncement)
    this.saveState()
    return mockFetch(newAnnouncement, 180)
  }

  async deleteAnnouncement(id: string): Promise<void> {
    this.announcements = this.announcements.filter(a => a.id !== id)
    this.saveState()
    await mockFetch(true, 100)
  }

  async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement> {
    const idx = this.announcements.findIndex(a => a.id === id)
    if (idx === -1) throw new ApiError('Announcement not found', 404)
    this.announcements[idx] = { ...this.announcements[idx], ...updates }
    this.saveState()
    return mockFetch(this.announcements[idx], 150)
  }

  async resetAnnouncements(): Promise<void> {
    this.announcements = structuredClone(MOCK_ANNOUNCEMENTS)
    this.saveState()
    await mockFetch(true, 100)
  }
}

export const announcementService = new AnnouncementService()
