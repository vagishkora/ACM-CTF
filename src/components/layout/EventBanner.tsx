import React from 'react'
import { AlertCircle, Clock, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { useEvent } from '../../context/EventContext'
import { cn } from '../../lib/utils'

export const EventBanner: React.FC = () => {
  const { status, timeRemaining } = useEvent()

  if (status === 'LIVE') {
    return null // Normal live state is reflected in navbar timer
  }

  const bannerConfigs = {
    BEFORE_EVENT: {
      bg: 'bg-blue-950/40 border-b border-blue-800/40 text-blue-200',
      icon: <Clock className="w-4 h-4 text-blue-400 shrink-0" />,
      title: 'Competition Starts Soon',
      detail: `Begins in ${timeRemaining.hours}h ${timeRemaining.minutes}m ${timeRemaining.seconds}s. Challenges will unlock at kick-off.`
    },
    ENDING_SOON: {
      bg: 'bg-amber-950/40 border-b border-amber-800/50 text-amber-200',
      icon: <Clock className="w-4 h-4 text-amber-400 shrink-0" />,
      title: 'Final Stretch: 15 Minutes Remaining',
      detail: `Competition clock closing at ${timeRemaining.minutes}m ${timeRemaining.seconds}s. Finalize submissions now.`
    },
    FINISHED: {
      bg: 'bg-zinc-900 border-b border-zinc-800 text-zinc-300',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
      title: 'CTF Competition Concluded',
      detail: 'The 6-hour competition has ended. Submissions are closed. Leaderboard is frozen for review.'
    },
    MAINTENANCE: {
      bg: 'bg-rose-950/40 border-b border-rose-800/50 text-rose-200',
      icon: <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />,
      title: 'Infrastructure Maintenance In Progress',
      detail: 'Challenge container clusters are undergoing brief load rebalancing. Scoreboard remains unaffected.'
    }
  }

  const current = bannerConfigs[status]
  if (!current) return null

  return (
    <div className={cn('w-full py-2 px-4 text-xs font-mono', current.bg)}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {current.icon}
          <span className="font-semibold">{current.title}:</span>
          <span className="text-zinc-400 truncate">{current.detail}</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 shrink-0 uppercase tracking-widest text-[10px] text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          Status: {status.replace('_', ' ')}
        </div>
      </div>
    </div>
  )
}
