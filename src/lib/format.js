export function money(value, { decimals = 1 } = {}) {
  const number = Number(value) || 0
  const sign = number < 0 ? '-' : ''
  const abs = Math.abs(number)
  if (abs >= 1_000_000_000) return `${sign}€${(abs / 1_000_000_000).toFixed(decimals)}B`
  if (abs >= 1_000_000) return `${sign}€${(abs / 1_000_000).toFixed(decimals)}M`
  if (abs >= 1_000) return `${sign}€${Math.round(abs / 1_000)}K`
  return `${sign}€${Math.round(abs)}`
}

export function moneyFull(value) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(Number(value) || 0)
}

export function shortDate(value, { weekday = true } = {}) {
  if (!value) return 'TBC'
  const date = new Date(`${value}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return 'TBC'
  return new Intl.DateTimeFormat('en-GB', {
    weekday: weekday ? 'short' : undefined,
    day: 'numeric',
    month: 'short'
  }).format(date)
}

export function longDate(value) {
  if (!value) return 'TBC'
  const date = new Date(`${value}T12:00:00Z`)
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

export function isHome(match, teamId) {
  return Number(match?.home_team_id) === Number(teamId)
}

export function opponent(match, teamId) {
  if (!match) return null
  return isHome(match, teamId) ? match.away_team : match.home_team
}

export function resultFor(match, teamId) {
  if (!match || match.status !== 'finished') return null
  const home = isHome(match, teamId)
  const mine = home ? match.home_score : match.away_score
  const theirs = home ? match.away_score : match.home_score
  if (mine > theirs) return 'W'
  if (mine < theirs) return 'L'
  return 'D'
}

export function scoreFor(match, teamId) {
  if (!match || match.status !== 'finished') return null
  return isHome(match, teamId)
    ? `${match.home_score}–${match.away_score}`
    : `${match.away_score}–${match.home_score}`
}

export function initials(name, max = 2) {
  return String(name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, max)
    .map(part => part[0])
    .join('')
    .toUpperCase()
}

export function ratingTone(rating) {
  if (rating >= 8) return 'rating-elite'
  if (rating >= 7) return 'rating-good'
  if (rating >= 6) return 'rating-ok'
  return 'rating-poor'
}

export function ratingText(rating) {
  if (rating >= 8.5) return 'text-lime'
  if (rating >= 7.5) return 'text-lime-300'
  if (rating >= 6.5) return 'text-sky-300'
  if (rating >= 5.5) return 'text-amber-300'
  return 'text-red-300'
}

export function positionTone(position) {
  return {
    GK: 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
    DEF: 'bg-sky-400/10 text-sky-300 ring-sky-400/20',
    MID: 'bg-lime/10 text-lime ring-lime/20',
    ATT: 'bg-rose-400/10 text-rose-300 ring-rose-400/20'
  }[position] || 'bg-white/5 text-slate-300 ring-white/10'
}

export function ordinal(number) {
  const value = Number(number)
  const suffix = value % 10 === 1 && value !== 11 ? 'st' : value % 10 === 2 && value !== 12 ? 'nd' : value % 10 === 3 && value !== 13 ? 'rd' : 'th'
  return `${value}${suffix}`
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function formPercent(value) {
  return clamp(Math.round(Number(value) || 0), 0, 100)
}

export function ordinalSuffix(number) {
  return ordinal(number)
}
