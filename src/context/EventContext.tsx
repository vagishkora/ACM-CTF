import React, { createContext, useContext, useState, useEffect } from 'react'
import { EventConfig, EventStatus } from '../types'
import { eventService } from '../services/eventService'
import { formatTimeRemaining } from '../lib/utils'

interface EventContextType {
  config: EventConfig | null
  status: EventStatus
  isLoading: boolean
  isPaused: boolean
  timeRemaining: { hours: string; minutes: string; seconds: string; isEnded: boolean }
  setStatus: (status: EventStatus) => Promise<void>
  setCustomTimer: (hours: number, minutes: number, seconds?: number) => Promise<void>
  adjustTimerMinutes: (deltaMinutes: number) => Promise<void>
  setEventTimes: (startTime: string, endTime: string) => Promise<void>
  togglePauseTimer: () => Promise<void>
  resetEvent: () => Promise<void>
}

const EventContext = createContext<EventContextType | undefined>(undefined)

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<EventConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState({ hours: '06', minutes: '00', seconds: '00', isEnded: false })

  const refreshConfig = async () => {
    try {
      const data = await eventService.getEventConfig()
      setConfig(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshConfig()

    // 1. Cross-tab storage event listener
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'acm_ctf_event_config' && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue)
          setConfig(updated)
        } catch {
          // ignore parsing error
        }
      }
    }
    window.addEventListener('storage', handleStorage)

    // 2. In-window custom event listener
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<EventConfig>
      if (customEvent.detail) {
        setConfig(customEvent.detail)
      }
    }
    window.addEventListener('acm_event_config_changed', handleCustomEvent)

    // 3. BroadcastChannel cross-tab realtime messaging
    let channel: BroadcastChannel | null = null
    try {
      channel = new BroadcastChannel('acm_ctf_event_channel')
      channel.onmessage = (event) => {
        if (event.data?.type === 'EVENT_CONFIG_UPDATED' && event.data.config) {
          setConfig(event.data.config)
        }
      }
    } catch {
      // BroadcastChannel unsupported fallback
    }

    // 4. Polling fallback every 2 seconds to ensure participants never miss changes
    const pollInterval = setInterval(() => {
      const saved = localStorage.getItem('acm_ctf_event_config')
      if (saved) {
        try {
          const parsed: EventConfig = JSON.parse(saved)
          setConfig(prev => {
            if (
              !prev ||
              prev.endTime !== parsed.endTime ||
              prev.status !== parsed.status ||
              prev.isPaused !== parsed.isPaused ||
              prev.pausedRemainingSeconds !== parsed.pausedRemainingSeconds
            ) {
              return parsed
            }
            return prev
          })
        } catch {
          // ignore error
        }
      }
    }, 2000)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('acm_event_config_changed', handleCustomEvent)
      if (channel) channel.close()
      clearInterval(pollInterval)
    }
  }, [])

  // 1-second countdown ticker
  useEffect(() => {
    if (!config) return

    const tick = () => {
      if (config.isPaused && config.pausedRemainingSeconds !== undefined) {
        const sec = config.pausedRemainingSeconds
        const h = Math.floor(sec / 3600)
        const m = Math.floor((sec % 3600) / 60)
        const s = sec % 60
        setTimeRemaining({
          hours: String(h).padStart(2, '0'),
          minutes: String(m).padStart(2, '0'),
          seconds: String(s).padStart(2, '0'),
          isEnded: sec <= 0
        })
        return
      }

      if (config.status === 'BEFORE_EVENT') {
        // Countdown to start
        const res = formatTimeRemaining(config.startTime)
        setTimeRemaining(res)
      } else if (config.status === 'LIVE' || config.status === 'ENDING_SOON') {
        // Countdown to end
        const res = formatTimeRemaining(config.endTime)
        setTimeRemaining(res)
      } else if (config.status === 'FINISHED') {
        setTimeRemaining({ hours: '00', minutes: '00', seconds: '00', isEnded: true })
      } else {
        // MAINTENANCE
        setTimeRemaining({ hours: '--', minutes: '--', seconds: '--', isEnded: false })
      }
    }

    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [config])

  const setStatus = async (status: EventStatus) => {
    const updated = await eventService.setEventStatus(status)
    setConfig(updated)
  }

  const setCustomTimer = async (hours: number, minutes: number, seconds: number = 0) => {
    const updated = await eventService.setCustomTimer(hours, minutes, seconds)
    setConfig(updated)
  }

  const adjustTimerMinutes = async (deltaMinutes: number) => {
    const updated = await eventService.adjustTimerMinutes(deltaMinutes)
    setConfig(updated)
  }

  const setEventTimes = async (startTime: string, endTime: string) => {
    const updated = await eventService.setEventTimes(startTime, endTime)
    setConfig(updated)
  }

  const togglePauseTimer = async () => {
    const updated = await eventService.togglePauseTimer()
    setConfig(updated)
  }

  const resetEvent = async () => {
    await eventService.resetEvent()
    await refreshConfig()
  }

  return (
    <EventContext.Provider
      value={{
        config,
        status: config?.status || 'LIVE',
        isLoading,
        isPaused: Boolean(config?.isPaused),
        timeRemaining,
        setStatus,
        setCustomTimer,
        adjustTimerMinutes,
        setEventTimes,
        togglePauseTimer,
        resetEvent
      }}
    >
      {children}
    </EventContext.Provider>
  )
}

export const useEvent = () => {
  const ctx = useContext(EventContext)
  if (!ctx) throw new Error('useEvent must be used within an EventProvider')
  return ctx
}
