import React, { useState } from 'react'
import { SlidersHorizontal, Shield, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import { useEvent } from '../../context/EventContext'
import { useAuth } from '../../context/AuthContext'
import { useCTF } from '../../context/CTFContext'
import { EventStatus, UserRole } from '../../types'
import { cn } from '../../lib/utils'

export const DemoToolbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { status, setStatus, resetEvent } = useEvent()
  const { user, switchRole } = useAuth()
  const { refreshChallenges } = useCTF()

  const statuses: { label: string; value: EventStatus }[] = [
    { label: 'Upcoming', value: 'BEFORE_EVENT' },
    { label: 'Live (Active)', value: 'LIVE' },
    { label: 'Ending Soon', value: 'ENDING_SOON' },
    { label: 'Concluded', value: 'FINISHED' },
    { label: 'Maintenance', value: 'MAINTENANCE' }
  ]

  const handleReset = async () => {
    localStorage.clear()
    await resetEvent()
    await refreshChallenges()
    window.location.reload()
  }

  return (
    <aside aria-label="Organizer simulation panel" className="relative z-40 bg-[#090b10] border-b border-zinc-800/80 text-xs">
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-blue-400 font-mono text-[11px] font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            ORGANIZER SIMULATOR
          </span>
          <span className="hidden sm:inline text-zinc-600">|</span>
          <span className="hidden sm:inline text-zinc-500 text-[11px]">
            Preview event lifecycles and role switching
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <span className="text-zinc-500">Current State:</span>
            <span className="text-zinc-200 font-medium">{status}</span>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 text-zinc-300 hover:text-white px-2 py-0.5 rounded bg-zinc-800/60 hover:bg-zinc-800 transition-colors"
          >
            <span>{isOpen ? 'Close Controls' : 'Configure'}</span>
            {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-zinc-800/60 bg-[#0c0e15] px-4 py-3 animate-in fade-in slide-in-from-top-1">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            {/* Event State Switcher */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-zinc-400 font-mono text-[11px] mr-1">Event State:</span>
              {statuses.map(s => (
                <button
                  key={s.value}
                  onClick={() => setStatus(s.value)}
                  className={cn(
                    'px-2.5 py-1 rounded text-[11px] font-mono transition-colors border',
                    status === s.value
                      ? 'bg-blue-600 text-white border-blue-500 font-medium'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Role Switcher & Reset */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-400 font-mono text-[11px]">Role:</span>
                <button
                  onClick={() => switchRole('participant' as UserRole)}
                  className={cn(
                    'px-2 py-0.5 rounded text-[11px] font-mono border transition-colors',
                    user?.role === 'participant'
                      ? 'bg-zinc-700 text-white border-zinc-600'
                      : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                  )}
                >
                  Participant
                </button>
                <button
                  onClick={() => switchRole('organizer' as UserRole)}
                  className={cn(
                    'px-2 py-0.5 rounded text-[11px] font-mono border transition-colors',
                    user?.role === 'organizer'
                      ? 'bg-purple-900/60 text-purple-200 border-purple-700'
                      : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                  )}
                >
                  Organizer (Admin)
                </button>
              </div>

              <button
                onClick={handleReset}
                title="Reset all localStorage demo state"
                className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-rose-400 px-2 py-1 rounded border border-zinc-800 hover:border-rose-900/40 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
