import ClubBadge from './ClubBadge'

export default function TeamIdentity({ team, size = 28, subtitle, className = '', badgeClassName = '', align = 'left' }) {
  return (
    <div className={`flex min-w-0 items-center gap-2.5 ${align === 'right' ? 'flex-row-reverse text-right' : ''} ${className}`}>
      <ClubBadge team={team} size={size} className={`shrink-0 ${badgeClassName}`} />
      <div className={`min-w-0 ${align === 'right' ? 'items-end' : ''}`}>
        <p className="truncate text-sm font-semibold text-white">{team?.name || '—'}</p>
        {subtitle && <p className="truncate text-[10px] text-mist-dim">{subtitle}</p>}
      </div>
    </div>
  )
}
