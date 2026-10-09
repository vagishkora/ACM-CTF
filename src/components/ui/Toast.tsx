import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react'
import { cn } from '../../lib/utils'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
  id: string
  type: ToastType
  title: string
  description?: string
  durationMs?: number
}

interface ToastContextType {
  toast: (options: { type?: ToastType; title: string; description?: string; durationMs?: number }) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback(({
    type = 'info',
    title,
    description,
    durationMs = 4000
  }: {
    type?: ToastType
    title: string
    description?: string
    durationMs?: number
  }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    const newToast: ToastMessage = { id, type, title, description, durationMs }
    
    setToasts(prev => [...prev, newToast])

    if (durationMs > 0) {
      setTimeout(() => {
        removeToast(id)
      }, durationMs)
    }
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container floating in bottom-right */}
      <div 
        aria-live="polite" 
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-3.5 rounded-md border shadow-lg shadow-black/60 bg-[#121520] transition-all animate-in fade-in slide-in-from-bottom-2',
              t.type === 'success' && 'border-emerald-500/40 text-emerald-300',
              t.type === 'error' && 'border-rose-500/40 text-rose-300',
              t.type === 'info' && 'border-blue-500/40 text-blue-300',
              t.type === 'warning' && 'border-amber-500/40 text-amber-300'
            )}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {t.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
              {t.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
              {t.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs font-semibold text-zinc-100">{t.title}</p>
              {t.description && <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{t.description}</p>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 text-zinc-500 hover:text-zinc-300 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
