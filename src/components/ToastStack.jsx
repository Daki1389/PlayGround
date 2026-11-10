import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { useGame } from '../context/GameContext'

const TONES = {
  success: { icon: CheckCircle2, ring: 'ring-lime/25', iconClass: 'text-lime', bar: 'bg-lime' },
  error: { icon: AlertTriangle, ring: 'ring-red-400/25', iconClass: 'text-red-300', bar: 'bg-red-400' },
  info: { icon: Info, ring: 'ring-sky-400/25', iconClass: 'text-sky-300', bar: 'bg-sky-400' }
}

export default function ToastStack() {
  const { toasts, dismissToast } = useGame()

  return (
    <div className="pointer-events-none fixed inset-x-3 top-3 z-[90] flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:top-auto sm:items-end">
      <AnimatePresence>
        {toasts.map(toast => {
          const tone = TONES[toast.tone] || TONES.info
          const Icon = tone.icon
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className={`pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-xl border border-white/10 bg-ink-800/95 p-3.5 pr-10 shadow-2xl ring-1 ${tone.ring} backdrop-blur-xl`}
            >
              <div className="flex items-start gap-3">
                <Icon size={18} className={`mt-0.5 shrink-0 ${tone.iconClass}`} />
                <p className="text-sm leading-snug text-slate-200">{toast.message}</p>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="absolute right-2 top-2 rounded-md p-1 text-mist-dim transition hover:bg-white/5 hover:text-white"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: 0 }}
                transition={{ duration: 4.8, ease: 'linear' }}
                className={`absolute inset-x-0 bottom-0 h-0.5 ${tone.bar} opacity-70`}
              />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
