import React, { createContext, useContext, useState, useEffect } from 'react'
import { EventConfig, EventStatus } from '../types'
import { eventService } from '../services/eventService'
import { formatTimeRemaining } from '../lib/utils'

interface EventContextType {
  config: EventConfig | null
  status: EventStatus
  isLoading: boolean
  timeRemaining: { hours: string; minutes: string; seconds: string; isEnded: boolean }
  setStatus: (status: EventStatus) => Promise<void>
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
  }, [])

  // 1-second countdown ticker
  useEffect(() => {
    if (!config) return

    const tick = () => {
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
        timeRemaining,
        setStatus,
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
