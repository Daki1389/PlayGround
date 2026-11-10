import { useMemo } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '../lib/format'

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'relative rounded-2xl border border-white/[0.07] bg-ink-850/85 shadow-card backdrop-blur-sm',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ eyebrow, title, subtitle, action, className, icon: Icon }) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.06] bg-white/[0.035] text-mist-300">
              <Icon size={15} strokeWidth={1.8} />
            </span>
          )}
          <h2 className="font-display text-[17px] font-semibold tracking-[-0.01em] text-mist-50">{title}</h2>
        </div>
        {subtitle && <p className="mt-1 text-[12.5px] leading-relaxed text-mist-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

const BUTTON_VARIANTS = {
  primary:
    'bg-lime-400 text-[#08130e] hover:bg-lime-300 active:bg-lime-500 shadow-[0_8px_30px_-12px_rgba(198,245,109,0.65)]',
  secondary:
    'border border-white/[0.09] bg-white/[0.045] text-mist-100 hover:border-white/[0.16] hover:bg-white/[0.075] active:bg-white/[0.03]',
  ghost: 'text-mist-300 hover:bg-white/[0.055] hover:text-white',
  danger:
    'border border-rose-400/20 bg-rose-400/[0.08] text-rose-300 hover:bg-rose-400/[0.14]',
  dark: 'bg-ink-900 text-mist-200 border border-white/[0.06] hover:border-white/[0.12] hover:text-white',
}

const BUTTON_SIZES = {
  xs: 'h-7 rounded-lg px-2.5 text-[11px] gap-1.5',
  sm: 'h-8 rounded-lg px-3 text-[12px] gap-1.5',
  md: 'h-10 rounded-xl px-4 text-[13px] gap-2',
  lg: 'h-11 rounded-xl px-5 text-[13.5px] gap-2',
}

export function Button({ variant = 'secondary', size = 'md', className, children, icon: Icon, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex select-none items-center justify-center whitespace-nowrap font-semibold tracking-[-0.01em] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/60 disabled:cursor-not-allowed disabled:opacity-35',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
      {...props}
    >
      {Icon && <Icon size={size === 'xs' ? 13 : 15} strokeWidth={2} />}
      {children}
    </button>
  )
}

const BADGE_VARIANTS = {
  lime: 'border-lime-400/20 bg-lime-400/[0.09] text-lime-300',
  emerald: 'border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300',
  sky: 'border-sky-400/20 bg-sky-400/[0.08] text-sky-300',
  amber: 'border-amber-400/20 bg-amber-400/[0.08] text-amber-300',
  rose: 'border-rose-400/20 bg-rose-400/[0.08] text-rose-300',
  violet: 'border-violet-400/20 bg-violet-400/[0.08] text-violet-300',
  slate: 'border-white/[0.08] bg-white/[0.045] text-mist-300',
  dark: 'border-white/[0.05] bg-ink-950/70 text-mist-400',
}

export function Badge({ variant = 'slate', className, children, dot = false }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase leading-4 tracking-[0.08em]',
        BADGE_VARIANTS[variant],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

const POSITION_VARIANTS = {
  GK: 'amber',
  CB: 'sky',
  RB: 'sky',
  LB: 'sky',
  DM: 'emerald',
  CM: 'emerald',
  AM: 'violet',
  RW: 'violet',
  LW: 'violet',
  ST: 'rose',
}

export function PositionBadge({ pos, className }) {
  return (
    <Badge variant={POSITION_VARIANTS[pos] || 'slate'} className={cn('min-w-[28px] justify-center px-1.5', className)}>
      {pos}
    </Badge>
  )
}

export function RatingBadge({ value, className, size = 'md' }) {
  const numeric = Number(value)
  const tone =
    numeric >= 82
      ? 'border-lime-400/30 bg-lime-400/[0.12] text-lime-300'
      : numeric >= 77
        ? 'border-emerald-400/25 bg-emerald-400/[0.09] text-emerald-300'
        : numeric >= 72
          ? 'border-sky-400/20 bg-sky-400/[0.08] text-sky-300'
          : 'border-white/[0.08] bg-white/[0.04] text-mist-300'
  return (
    <span
      className={cn(
        'inline-grid place-items-center rounded-lg border font-display font-bold tabular-nums',
        size === 'sm' ? 'h-6 min-w-7 px-1 text-[11px]' : 'h-8 min-w-9 px-1.5 text-[13px]',
        tone,
        className,
      )}
    >
      {Number(value).toFixed(value % 1 === 0 ? 0 : 1)}
    </span>
  )
}

const FORM_STYLES = {
  W: 'border-lime-400/30 bg-lime-400 text-[#08130e]',
  D: 'border-amber-300/20 bg-amber-300/15 text-amber-200',
  L: 'border-rose-400/20 bg-rose-400/15 text-rose-300',
}

export function FormPips({ form = [], size = 'md', className }) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {form.map((result, index) => (
        <span
          key={`${result}-${index}`}
          title={result === 'W' ? 'Win' : result === 'D' ? 'Draw' : 'Loss'}
          className={cn(
            'grid place-items-center rounded-[5px] border font-bold',
            size === 'sm' ? 'h-5 w-5 text-[9px]' : 'h-6 w-6 text-[10px]',
            FORM_STYLES[result] || FORM_STYLES.D,
          )}
        >
          {result}
        </span>
      ))}
    </div>
  )
}

export function ProgressBar({ value = 0, className, barClassName, height = 'h-1.5', tone = 'lime' }) {
  const tones = {
    lime: 'bg-gradient-to-r from-emerald-500 to-lime-300',
    emerald: 'bg-gradient-to-r from-teal-500 to-emerald-300',
    amber: 'bg-gradient-to-r from-amber-500 to-amber-300',
    rose: 'bg-gradient-to-r from-rose-600 to-rose-400',
    sky: 'bg-gradient-to-r from-sky-600 to-sky-300',
    mist: 'bg-mist-400',
  }
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-white/[0.06]', height, className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-700', tones[tone] || tones.lime, barClassName)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

export function ProbabilityBar({ home, draw, away, homeLabel = 'Home', awayLabel = 'Away', className }) {
  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.12em]">
        <span className="text-lime-300">{homeLabel} {home}%</span>
        <span className="text-mist-400">Draw {draw}%</span>
        <span className="text-rose-300">{awayLabel} {away}%</span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-white/[0.05]">
        <div className="h-full bg-gradient-to-r from-emerald-500 to-lime-300" style={{ width: `${home}%` }} />
        <div className="h-full bg-mist-500/70" style={{ width: `${draw}%` }} />
        <div className="h-full bg-gradient-to-r from-rose-500 to-rose-400" style={{ width: `${away}%` }} />
      </div>
    </div>
  )
}

export function Sparkline({ data = [], className, width = 96, height = 28, color = '#c6f56d' }) {
  const path = useMemo(() => {
    if (!data.length) return ''
    const min = Math.min(...data)
    const max = Math.max(...data)
    const span = max - min || 1
    const step = width / Math.max(1, data.length - 1)
    return data
      .map((value, index) => {
        const x = index * step
        const y = height - 3 - ((value - min) / span) * (height - 6)
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
  }, [data, height, width])

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cn('overflow-visible', className)} aria-hidden="true">
      <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {data.length > 0 && (
        <circle
          cx={width}
          cy={height - 3 - ((data[data.length - 1] - Math.min(...data)) / (Math.max(...data) - Math.min(...data) || 1)) * (height - 6)}
          r="2.5"
          fill={color}
        />
      )}
    </svg>
  )
}

export function Delta({ value, suffix = '', className }) {
  const positive = value > 0
  const neutral = value === 0
  const Icon = neutral ? Minus : positive ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums',
        neutral ? 'text-mist-400' : positive ? 'text-lime-300' : 'text-rose-300',
        className,
      )}
    >
      <Icon size={12} strokeWidth={2.4} />
      {positive ? '+' : ''}
      {value}
      {suffix}
    </span>
  )
}

export function Ring({ value = 0, size = 64, stroke = 5, color = '#c6f56d', track = 'rgba(255,255,255,0.07)', children }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}

export function SectionTitle({ eyebrow, title, description, action, className }) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="font-display text-2xl font-semibold tracking-[-0.03em] text-mist-50 sm:text-[30px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-mist-400">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {Icon && (
        <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-white/[0.07] bg-white/[0.035] text-mist-400">
          <Icon size={21} strokeWidth={1.5} />
        </span>
      )}
      <h3 className="font-display text-[16px] font-semibold text-mist-100">{title}</h3>
      {description && <p className="mt-1.5 max-w-xs text-[12.5px] leading-relaxed text-mist-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Divider({ className }) {
  return <div className={cn('h-px w-full bg-white/[0.055]', className)} />
}
