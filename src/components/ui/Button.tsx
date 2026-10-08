import React from 'react'
import { cn } from '../../lib/utils'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  leftIcon,
  rightIcon,
  children,
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090a0f] disabled:opacity-50 disabled:pointer-events-none rounded'

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-sm px-5 py-2.5 gap-2.5'
  }

  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700 shadow-sm border border-blue-500/30',
    secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 active:bg-zinc-900 border border-zinc-700/60',
    outline: 'border border-zinc-700/80 text-zinc-200 hover:bg-zinc-800/60 hover:text-white',
    danger: 'bg-rose-600/90 text-white hover:bg-rose-500 active:bg-rose-700 border border-rose-500/40',
    ghost: 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
  }

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  )
})

Button.displayName = 'Button'
