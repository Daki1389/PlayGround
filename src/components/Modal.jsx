import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../lib/format'

export default function Modal({ open, onClose, title, eyebrow, subtitle, children, footer, size = 'md', className }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-5">
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-ink-975/80 backdrop-blur-md"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative z-10 max-h-[92vh] w-full animate-rise overflow-hidden rounded-t-2xl border border-white/[0.09] bg-ink-900 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.9)] sm:rounded-2xl',
          sizes[size],
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-4 sm:px-6">
          <div>
            {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
            <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-mist-50">{title}</h2>
            {subtitle && <p className="mt-1 text-[12px] text-mist-400">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/[0.06] bg-white/[0.035] text-mist-400 transition hover:border-white/[0.12] hover:text-white"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>
        <div className="max-h-[calc(92vh-9.5rem)] overflow-y-auto scrollbar-thin">{children}</div>
        {footer && <div className="border-t border-white/[0.06] px-5 py-3.5 sm:px-6">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
