import { useId } from 'react'
import { cn } from '../lib/format'

function hashTeam(value) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) % 997
  return hash
}

const SHIELD = 'M32 2 L59.5 10.5 V37 C59.5 54.5 47 65.5 32 72 C17 65.5 4.5 54.5 4.5 37 V10.5 Z'

export default function TeamCrest({ team, size = 42, className, glow = false }) {
  const gradientId = useId().replace(/:/g, '')
  const clipId = useId().replace(/:/g, '')
  const variant = hashTeam(team.id) % 4
  const accent = team.secondary || '#ffffff'
  const primary = team.primary || '#0d5c3f'

  return (
    <svg
      width={size}
      height={size * 1.14}
      viewBox="0 0 64 74"
      className={cn('shrink-0', glow && 'drop-shadow-[0_4px_14px_rgba(0,0,0,0.45)]', className)}
      role="img"
      aria-label={`${team.name} crest`}
    >
      <defs>
        <linearGradient id={gradientId} x1="10" y1="3" x2="54" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={primary} />
          <stop offset="100%" stopColor="#06130d" />
        </linearGradient>
        <clipPath id={clipId}>
          <path d={SHIELD} />
        </clipPath>
      </defs>
      <path d={SHIELD} fill={`url(#${gradientId})`} stroke="rgba(255,255,255,0.28)" strokeWidth="1.3" />
      <g clipPath={`url(#${clipId})`}>
        {variant === 0 && (
          <>
            <rect x="4" y="31" width="56" height="13" fill={accent} opacity="0.16" />
            <rect x="4" y="34.5" width="56" height="1.2" fill={accent} opacity="0.4" />
            <rect x="4" y="39" width="56" height="1.2" fill={accent} opacity="0.4" />
          </>
        )}
        {variant === 1 && (
          <path d="M-8 58 L48 -4 L60 -4 L4 64 Z" fill={accent} opacity="0.13" />
        )}
        {variant === 2 && (
          <>
            <rect x="25" y="0" width="14" height="74" fill={accent} opacity="0.12" />
            <rect x="28.5" y="0" width="1" height="74" fill={accent} opacity="0.38" />
            <rect x="34.5" y="0" width="1" height="74" fill={accent} opacity="0.38" />
          </>
        )}
        {variant === 3 && (
          <>
            <path d="M4 45 L32 25 L60 45 V55 L32 35 L4 55 Z" fill={accent} opacity="0.12" />
            <circle cx="32" cy="22" r="15" fill={accent} opacity="0.06" />
          </>
        )}
        <rect x="4" y="58" width="56" height="14" fill="#000000" opacity="0.12" />
      </g>
      <path d={SHIELD} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="0.8" />
      {team.overall >= 80 && (
        <path d="M32 9.6l1.5 4.4 4.6.2-3.6 2.9 1.2 4.5-3.7-2.7-3.7 2.7 1.2-4.5-3.6-2.9 4.6-.2z" fill={accent} opacity="0.95" />
      )}
      <text
        x="32"
        y={team.overall >= 80 ? 41 : 40}
        textAnchor="middle"
        fill={team.text || '#ffffff'}
        fontFamily="'Space Grotesk', 'Manrope', sans-serif"
        fontSize={team.code.length > 2 ? 14 : 18}
        fontWeight="700"
        letterSpacing="0.5"
        opacity="0.98"
      >
        {team.code}
      </text>
      <rect x="19" y="51" width="26" height="1.3" rx="0.65" fill={accent} opacity="0.55" />
    </svg>
  )
}
