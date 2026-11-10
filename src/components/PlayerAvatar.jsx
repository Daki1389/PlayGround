import { cn, initials } from '../lib/format'

const POSITION_TONES = {
  GK: 'from-amber-400/40 via-amber-500/15 to-ink-900 text-amber-100 border-amber-300/25',
  CB: 'from-sky-400/35 via-sky-500/12 to-ink-900 text-sky-100 border-sky-300/20',
  RB: 'from-sky-400/35 via-sky-500/12 to-ink-900 text-sky-100 border-sky-300/20',
  LB: 'from-sky-400/35 via-sky-500/12 to-ink-900 text-sky-100 border-sky-300/20',
  DM: 'from-emerald-400/35 via-emerald-500/12 to-ink-900 text-emerald-100 border-emerald-300/20',
  CM: 'from-emerald-400/35 via-emerald-500/12 to-ink-900 text-emerald-100 border-emerald-300/20',
  AM: 'from-violet-400/38 via-violet-500/12 to-ink-900 text-violet-100 border-violet-300/22',
  RW: 'from-violet-400/38 via-violet-500/12 to-ink-900 text-violet-100 border-violet-300/22',
  LW: 'from-violet-400/38 via-violet-500/12 to-ink-900 text-violet-100 border-violet-300/22',
  ST: 'from-rose-400/38 via-rose-500/12 to-ink-900 text-rose-100 border-rose-300/22',
}

export default function PlayerAvatar({ player, size = 38, className, showRing = true }) {
  const tone = POSITION_TONES[player?.pos] || 'from-white/15 to-ink-900 text-mist-100 border-white/15'
  return (
    <span
      className={cn(
        'relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full border bg-gradient-to-br font-display font-bold tracking-[-0.02em]',
        tone,
        showRing && 'ring-1 ring-white/[0.05] ring-offset-1 ring-offset-ink-900',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      <span className="relative z-10 opacity-90">{initials(player?.name)}</span>
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.18),transparent_52%)]" />
      <span className="absolute -right-1/3 bottom-0 h-1/2 w-full rounded-full bg-black/20 blur-sm" />
    </span>
  )
}
