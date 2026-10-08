import React from 'react'
import { cn } from '../../lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  className,
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  id,
  disabled,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-zinc-300">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-zinc-500 pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full bg-[#11131a] border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500',
            'transition-colors focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50',
            'disabled:opacity-50 disabled:bg-zinc-900/50 disabled:cursor-not-allowed',
            leftIcon && 'pl-9',
            rightIcon && 'pr-9',
            error && 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/40',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 text-zinc-500 pointer-events-none flex items-center justify-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
      {!error && helperText && <p className="text-xs text-zinc-500">{helperText}</p>}
    </div>
  )
})

Input.displayName = 'Input'
