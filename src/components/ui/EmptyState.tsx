import React from 'react'
import { FolderSearch, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './Button'
import { cn } from '../../lib/utils'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className
}) => {
  return (
    <div className={cn('p-8 sm:p-12 text-center rounded-lg border border-dashed border-zinc-800 bg-[#0d0f17] flex flex-col items-center justify-center max-w-xl mx-auto', className)}>
      <div className="w-12 h-12 rounded-full bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center text-zinc-400 mb-3">
        {icon || <FolderSearch className="w-5 h-5" />}
      </div>
      <h4 className="text-sm font-semibold text-zinc-200">{title}</h4>
      <p className="text-xs text-zinc-400 mt-1 max-w-md leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

export interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load telemetry',
  message,
  onRetry,
  className
}) => {
  return (
    <div className={cn('p-6 text-center rounded-lg border border-rose-500/30 bg-rose-950/20 max-w-lg mx-auto', className)}>
      <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-2.5">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-semibold text-rose-200">{title}</h4>
      <p className="text-xs text-rose-300/80 mt-1">{message}</p>
      {onRetry && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry} 
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          className="mt-4 border-rose-500/40 text-rose-200 hover:bg-rose-900/30"
        >
          Try Again
        </Button>
      )}
    </div>
  )
}
