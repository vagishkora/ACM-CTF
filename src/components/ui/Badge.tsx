import React from 'react'
import { cn } from '../../lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'acm' | 'near'
  size?: 'sm' | 'md'
  dot?: boolean
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium font-mono uppercase tracking-wider rounded border'

  const sizeStyles = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-0.5 gap-1.5'
  }

  const variantStyles = {
    default: 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60',
    neutral: 'bg-zinc-900/60 text-zinc-400 border-zinc-800',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    acm: 'bg-blue-950/40 text-blue-300 border-blue-500/30',
    near: 'bg-cyan-950/40 text-cyan-300 border-cyan-500/30'
  }

  const dotColors = {
    default: 'bg-zinc-400',
    neutral: 'bg-zinc-500',
    success: 'bg-emerald-400 animate-pulse',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    info: 'bg-blue-400',
    acm: 'bg-blue-400',
    near: 'bg-cyan-400'
  }

  return (
    <span className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)} {...props}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  )
}
