import React, { useState, useEffect } from 'react'
import { 
  Bell, 
  CheckCheck, 
  Filter, 
  AlertTriangle, 
  Info, 
  Radio, 
  Clock, 
  ShieldCheck 
} from 'lucide-react'
import { announcementService } from '../services/announcementService'
import { Announcement, AnnouncementCategory, AnnouncementPriority } from '../types'
import { useCTF } from '../context/CTFContext'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'

export const AnnouncementsPage: React.FC = () => {
  const { refreshAnnouncementsCount } = useCTF()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  const loadAnnouncements = async () => {
    try {
      const data = await announcementService.getAnnouncements()
      setAnnouncements(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAnnouncements()
  }, [])

  const handleMarkAllRead = async () => {
    await announcementService.markAllAsRead()
    setAnnouncements(prev => prev.map(a => ({ ...a, isRead: true })))
    await refreshAnnouncementsCount()
  }

  const handleMarkOneRead = async (id: string) => {
    await announcementService.markAsRead(id)
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a))
    await refreshAnnouncementsCount()
  }

  const categories = ['All', 'general', 'challenges', 'infrastructure', 'rules']

  const filteredAnnouncements = announcements.filter(a => {
    if (selectedCategory !== 'All' && a.category !== selectedCategory) return false
    return true
  })

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Organizer Broadcasts</h1>
            <Badge variant="info" size="sm">LIVE FEED</Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Official announcements, first blood notifications, and infrastructure advisories.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
          onClick={handleMarkAllRead}
        >
          Mark All Read
        </Button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
        <span className="text-zinc-500 text-[11px] mr-1">Filter Channel:</span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded capitalize transition-colors border ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white border-blue-500 font-medium'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <EmptyState
            title="No announcements found"
            description="There are currently no broadcasts posted under this category filter."
            actionLabel="Reset Category Filter"
            onAction={() => setSelectedCategory('All')}
          />
        ) : (
          filteredAnnouncements.map((ann) => {
            const isUrgent = ann.priority === 'urgent'
            const isUpdate = ann.priority === 'update'

            return (
              <Card
                key={ann.id}
                className={`p-5 transition-all ${
                  !ann.isRead 
                    ? 'border-blue-500/40 bg-[#121624]' 
                    : isUrgent 
                    ? 'border-amber-500/30 bg-[#131217]' 
                    : 'border-zinc-800 bg-[#10121a]'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {isUrgent ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          URGENT
                        </span>
                      ) : isUpdate ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                          UPDATE
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                          INFO
                        </span>
                      )}

                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                        #{ann.category}
                      </span>

                      {!ann.isRead && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500 text-white font-bold">
                          NEW
                        </span>
                      )}
                    </div>

                    <h2 className="text-base font-semibold text-zinc-100">
                      {ann.title}
                    </h2>

                    <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                      {ann.content}
                    </p>

                    <div className="flex items-center gap-4 pt-2 text-[11px] font-mono text-zinc-500">
                      <span>Posted by {ann.author}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {ann.timestamp}
                      </span>
                    </div>
                  </div>

                  {!ann.isRead && (
                    <button
                      onClick={() => handleMarkOneRead(ann.id)}
                      className="shrink-0 text-xs font-mono text-blue-400 hover:underline pt-1"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </Card>
            )
          })
        )}
      </div>

    </div>
  )
}
