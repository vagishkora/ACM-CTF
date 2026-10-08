import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeRemaining(targetIsoString: string): { hours: string; minutes: string; seconds: string; isEnded: boolean } {
  const target = new Date(targetIsoString).getTime()
  const now = Date.now()
  const diff = target - now

  if (diff <= 0) {
    return { hours: '00', minutes: '00', seconds: '00', isEnded: true }
  }

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return {
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0'),
    isEnded: false
  }
}

export function formatPoints(points: number): string {
  return `${points} pts`
}

export function getDifficultyColor(difficulty: string): { bg: string; text: string; border: string } {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' }
    case 'medium':
      return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' }
    case 'hard':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' }
    case 'insane':
      return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' }
    default:
      return { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/20' }
  }
}

export function getCategoryBadge(category: string): { bg: string; text: string; border: string } {
  switch (category.toLowerCase()) {
    case 'web':
      return { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' }
    case 'crypto':
      return { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' }
    case 'forensics':
      return { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' }
    case 'reverse engineering':
    case 'reverse':
      return { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' }
    case 'pwn':
      return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' }
    case 'osint':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' }
    default:
      return { bg: 'bg-zinc-500/10', text: 'text-zinc-300', border: 'border-zinc-500/20' }
  }
}
