import React from 'react'
import { cn } from '../../lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'subtle' | 'interactive'
  active?: boolean
}

export const Card: React.FC<CardProps> = ({
  className,
  variant = 'default',
  active = false,
  children,
  ...props
}) => {
  const baseStyles = 'rounded-md transition-all'

  const variantStyles = {
    default: 'bg-[#10121a] border border-zinc-800/80',
    elevated: 'bg-[#141722] border border-zinc-700/60 shadow-sm shadow-black/40',
    subtle: 'bg-[#0c0e15] border border-zinc-800/40',
    interactive: 'bg-[#10121a] border border-zinc-800/80 hover:border-zinc-700 hover:bg-[#131622] cursor-pointer'
  }

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        active && 'border-blue-500/60 ring-1 ring-blue-500/20 bg-[#121624]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('p-4 sm:p-5 border-b border-zinc-800/60', className)} {...props} />
)

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('p-4 sm:p-5', className)} {...props} />
)

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('p-4 sm:p-5 border-t border-zinc-800/60 bg-zinc-900/30 rounded-b-md', className)} {...props} />
)
