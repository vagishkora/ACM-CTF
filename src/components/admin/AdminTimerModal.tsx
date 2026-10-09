import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Play, Pause, RotateCcw, AlertTriangle, ExternalLink } from 'lucide-react'
import { useEvent } from '../../context/EventContext'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useToast } from '../ui/Toast'

interface AdminTimerModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AdminTimerModal: React.FC<AdminTimerModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const { 
    status, 
    timeRemaining, 
    isPaused, 
    setCustomTimer, 
    adjustTimerMinutes, 
    togglePauseTimer, 
    resetEvent 
  } = useEvent()
  const { toast } = useToast()

  const [hours, setHours] = useState(timeRemaining.hours ? parseInt(timeRemaining.hours) : 2)
  const [minutes, setMinutes] = useState(timeRemaining.minutes ? parseInt(timeRemaining.minutes) : 0)
  const [seconds, setSeconds] = useState(timeRemaining.seconds ? parseInt(timeRemaining.seconds) : 0)
  const [isApplying, setIsApplying] = useState(false)

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsApplying(true)
    try {
      await setCustomTimer(Number(hours), Number(minutes), Number(seconds))
      toast({
        type: 'success',
        title: 'Competition Clock Updated',
        description: `Set to ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.`
      })
      onClose()
    } finally {
      setIsApplying(false)
    }
  }

  const handleAdjust = async (mins: number) => {
    await adjustTimerMinutes(mins)
    toast({
      type: 'info',
      title: 'Clock Adjusted',
      description: `${mins > 0 ? '+' : ''}${mins} minutes applied.`
    })
  }

  const handleToggle = async () => {
    await togglePauseTimer()
    toast({
      type: isPaused ? 'success' : 'warning',
      title: isPaused ? 'Clock Resumed' : 'Clock Paused',
      description: isPaused ? 'Countdown is running.' : 'Clock paused for all participants.'
    })
  }

  const handleExpire = async () => {
    await setCustomTimer(0, 0, 0)
    toast({
      type: 'warning',
      title: 'Timer Expired',
      description: 'Competition clock set to 00:00:00.'
    })
    onClose()
  }

  const handleReset = async () => {
    await resetEvent()
    toast({
      type: 'info',
      title: 'Clock Reset',
      description: 'Reset back to standard 6-hour duration.'
    })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ADMIN COMPETITION CLOCK OVERRIDE"
      size="md"
    >
      <div className="space-y-4 sm:space-y-5 text-zinc-300 font-sans max-h-[75vh] overflow-y-auto pr-0.5">
        {/* Live synchronized readout */}
        <div className="p-3.5 sm:p-4 rounded-lg bg-[#0b0d14] border border-purple-900/50 flex flex-col items-center justify-center gap-2">
          <div className="flex items-center gap-2 font-mono text-[10px] sm:text-[11px] text-zinc-400">
            <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
            STATUS: <span className="font-semibold text-white">{isPaused ? 'PAUSED' : status}</span>
          </div>

          <div className="text-3xl xs:text-4xl sm:text-5xl font-mono font-bold tracking-wider sm:tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-white to-purple-300 py-0.5 sm:py-1">
            {timeRemaining.hours}:{timeRemaining.minutes}:{timeRemaining.seconds}
          </div>

          <div className="w-full sm:w-auto flex items-center justify-center mt-1">
            <button
              onClick={handleToggle}
              className={`w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-colors border active:scale-95 ${
                isPaused 
                  ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-amber-950/60 border-amber-700/60 text-amber-300 hover:bg-amber-900/60'
              }`}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              {isPaused ? 'Resume Countdown' : 'Freeze / Pause Clock'}
            </button>
          </div>
        </div>

        {/* Quick Delta Buttons */}
        <div>
          <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-2">
            Quick Adjustments
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={() => handleAdjust(15)}
              className="py-2.5 sm:py-2 px-3 rounded bg-zinc-900 border border-zinc-800 hover:border-purple-600/60 hover:bg-purple-950/30 active:bg-purple-900/40 text-purple-200 font-semibold transition-colors text-center active:scale-[0.98]"
            >
              +15m
            </button>
            <button
              type="button"
              onClick={() => handleAdjust(30)}
              className="py-2.5 sm:py-2 px-3 rounded bg-zinc-900 border border-zinc-800 hover:border-purple-600/60 hover:bg-purple-950/30 active:bg-purple-900/40 text-purple-200 font-semibold transition-colors text-center active:scale-[0.98]"
            >
              +30m
            </button>
            <button
              type="button"
              onClick={() => handleAdjust(60)}
              className="py-2.5 sm:py-2 px-3 rounded bg-zinc-900 border border-zinc-800 hover:border-purple-600/60 hover:bg-purple-950/30 active:bg-purple-900/40 text-purple-200 font-semibold transition-colors text-center active:scale-[0.98]"
            >
              +1 Hour
            </button>
            <button
              type="button"
              onClick={() => handleAdjust(-15)}
              className="py-2.5 sm:py-2 px-3 rounded bg-zinc-900 border border-zinc-800 hover:border-rose-600/60 hover:bg-rose-950/30 active:bg-rose-900/40 text-rose-300 font-semibold transition-colors text-center active:scale-[0.98]"
            >
              -15m
            </button>
          </div>
        </div>

        {/* Custom Exact Time Setting */}
        <form onSubmit={handleApply} className="space-y-3 p-3 sm:p-3.5 rounded bg-zinc-900/60 border border-zinc-800">
          <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
            Set Exact Remaining Time
          </label>
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 mb-1 text-center sm:text-left">Hours</label>
              <input
                type="number"
                min="0"
                max="99"
                value={hours}
                onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-[#0d0f17] border border-zinc-700 rounded px-2 sm:px-2.5 py-2 sm:py-1.5 font-mono text-base sm:text-sm text-center text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 mb-1 text-center sm:text-left">Minutes</label>
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                className="w-full bg-[#0d0f17] border border-zinc-700 rounded px-2 sm:px-2.5 py-2 sm:py-1.5 font-mono text-base sm:text-sm text-center text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 mb-1 text-center sm:text-left">Seconds</label>
              <input
                type="number"
                min="0"
                max="59"
                value={seconds}
                onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                className="w-full bg-[#0d0f17] border border-zinc-700 rounded px-2 sm:px-2.5 py-2 sm:py-1.5 font-mono text-base sm:text-sm text-center text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isApplying}
            className="w-full bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-mono text-xs py-2.5 sm:py-2"
          >
            Apply Exact Countdown
          </Button>
        </form>

        {/* Emergency & Reset Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 pt-2.5 border-t border-zinc-800 text-xs font-mono">
          <button
            type="button"
            onClick={handleExpire}
            className="text-rose-400 hover:text-rose-300 active:text-rose-200 flex items-center justify-center sm:justify-start gap-1.5 p-2 sm:p-0 rounded sm:rounded-none bg-rose-950/20 sm:bg-transparent border sm:border-0 border-rose-900/30 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            End CTF Now (00:00:00)
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="text-zinc-400 hover:text-zinc-200 active:text-white flex items-center justify-center sm:justify-start gap-1.5 p-2 sm:p-0 rounded sm:rounded-none bg-zinc-900/50 sm:bg-transparent border sm:border-0 border-zinc-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            Reset 6-Hour Window
          </button>
        </div>

        {/* Link to Full Admin Console */}
        <div className="text-center pt-1 pb-0.5">
          <button
            type="button"
            onClick={() => {
              onClose()
              navigate('/admin')
            }}
            className="text-xs font-mono text-purple-400 hover:text-purple-300 active:text-purple-200 inline-flex items-center justify-center gap-1.5 transition-colors underline underline-offset-4 py-1"
          >
            Open Full Admin Operations Desk <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </Modal>
  )
}
