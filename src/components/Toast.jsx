import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '../lib/format'

const ToastContext = createContext(null)

const TONES = {
  success: {
    icon: CheckCircle2,
    wrap: 'border-lime-400/25 bg-[#0d2117]/95',
    iconWrap: 'bg-lime-400/12 text-lime-300',
  },
  error: {
    icon: AlertTriangle,
    wrap: 'border-rose-400/25 bg-[#22100f]/95',
    iconWrap: 'bg-rose-400/12 text-rose-300',
  },
  info: {
    icon: Info,
    wrap: 'border-sky-400/25 bg-[#0a1b22]/95',
    iconWrap: 'bg-sky-400/12 text-sky-300',
  },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (message, type = 'success', options = {}) => {
      counter.current += 1
      const id = counter.current
      setToasts((current) => [...current.slice(-3), { id, message, type, title: options.title }])
      window.setTimeout(() => dismiss(id), options.duration ?? 3600)
      return id
    },
    [dismiss],
  )

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-24 right-4 z-[120] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
        {toasts.map((toast) => {
          const tone = TONES[toast.type] || TONES.info
          const Icon = tone.icon
          return (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto flex animate-slide-in items-start gap-3 rounded-xl border p-3.5 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl',
                tone.wrap,
              )}
            >
              <span className={cn('mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg', tone.iconWrap)}>
                <Icon size={15} />
              </span>
              <div className="min-w-0 pt-0.5">
                {toast.title && <p className="text-[12px] font-bold text-mist-50">{toast.title}</p>}
                <p className="text-[12px] leading-relaxed text-mist-300">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="ml-auto shrink-0 rounded-md p-1 text-mist-500 transition hover:bg-white/5 hover:text-white"
                aria-label="Dismiss notification"
              >
                <X size={13} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
