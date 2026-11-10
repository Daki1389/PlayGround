export function cn(...values) {
  return values.filter(Boolean).join(' ')
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function formatMoney(value, options = {}) {
  const { compact = true, decimals } = options
  if (value == null || Number.isNaN(value)) return '—'
  const abs = Math.abs(value)
  if (abs >= 1_000_000) {
    const digits = decimals ?? (abs >= 10_000_000 ? 1 : compact ? 1 : 2)
    return `€${(value / 1_000_000).toFixed(digits)}M`
  }
  if (abs >= 1_000) return `€${Math.round(value / 1_000)}k`
  return `€${Math.round(value)}`
}

export function formatWageBill(value) {
  return `€${(value / 1_000_000).toFixed(2)}M`
}

export function formatRating(value) {
  return Number(value).toFixed(1)
}

export function formatDate(iso, options = {}) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'TBC'
  return new Intl.DateTimeFormat('en-GB', {
    weekday: options.weekday ?? 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(date)
}

export function formatDateLong(iso) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'TBC'
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function formatTime(iso) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '15:00'
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(date)
}

export function greeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function ordinal(n) {
  const value = Number(n)
  const mod100 = value % 100
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`
  switch (value % 10) {
    case 1:
      return `${value}st`
    case 2:
      return `${value}nd`
    case 3:
      return `${value}rd`
    default:
      return `${value}th`
  }
}

export function positionColor(pos) {
  if (pos === 'GK') return 'amber'
  if (['CB', 'RB', 'LB'].includes(pos)) return 'sky'
  if (['DM', 'CM'].includes(pos)) return 'emerald'
  if (['AM', 'RW', 'LW'].includes(pos)) return 'violet'
  return 'rose'
}

export function shortNation(flag) {
  return flag || '🌍'
}
