import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

export type ModalMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  maxWidth?: ModalMaxWidth
  size?: ModalMaxWidth | string
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth,
  size
}) => {
  const allowedSizes: ModalMaxWidth[] = ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl']
  const effectiveWidth: ModalMaxWidth = (
    maxWidth ||
    (size && (allowedSizes as string[]).includes(size) ? (size as ModalMaxWidth) : undefined) ||
    'md'
  )
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const maxWidthClasses: Record<ModalMaxWidth, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative w-full bg-[#11131b] border border-zinc-800 rounded-lg shadow-xl shadow-black/80 z-10 overflow-hidden',
          maxWidthClasses[effectiveWidth]
        )}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800">
          <div>
            {title && <h3 className="text-base font-semibold text-zinc-100">{title}</h3>}
            {description && <p className="text-xs text-zinc-400 mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-zinc-400 hover:text-zinc-100 p-1 rounded hover:bg-zinc-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 sm:p-5">
          {children}
        </div>
      </div>
    </div>
  )
}
