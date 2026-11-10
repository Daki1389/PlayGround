import { useId } from 'react'

function readableText(hex) {
  const value = String(hex || '').replace('#', '')
  if (value.length !== 6) return '#08100a'
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.62 ? '#07100a' : '#ffffff'
}

export default function ClubBadge({ team, size = 48, className = '' }) {
  const id = useId().replace(/[:]/g, '')
  const primary = team?.primary_color || '#c9f75c'
  const secondary = team?.secondary_color || '#0b0f14'
  const code = team?.short_name || 'FC'
  const textColor = readableText(primary)

  return (
    <svg
      width={size}
      height={size * 1.1}
      viewBox="0 0 64 70"
      className={className}
      aria-label={`${team?.name || 'Club'} badge`}
      role="img"
    >
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor={primary} />
          <stop offset="58%" stopColor={primary} />
          <stop offset="100%" stopColor={secondary} />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="42%" stopColor="#ffffff" stopOpacity="0.03" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M32 1.8 60.5 10v23.7c0 17.2-12.4 28.8-28.5 34.6C15.9 62.5 3.5 50.9 3.5 33.7V10Z"
        fill={`url(#${id}-fill)`}
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="1.1"
      />
      <path
        d="M32 5.8 56.5 13v20.6c0 14.4-10.4 24.3-24.5 29.7C17.9 57.9 7.5 48 7.5 33.6V13Z"
        fill="none"
        stroke={textColor}
        strokeOpacity="0.25"
        strokeWidth="1"
      />
      <path d="M12 45.5c10.8-8.7 28.8-11.4 46-6.5v6.8C40.7 40.2 24.1 43 12 52Z" fill={secondary} fillOpacity="0.42" />
      <path
        d="M32 5.8 56.5 13v20.6c0 14.4-10.4 24.3-24.5 29.7C17.9 57.9 7.5 48 7.5 33.6V13Z"
        fill={`url(#${id}-shine)`}
      />
      <text
        x="32"
        y="34.5"
        textAnchor="middle"
        fontFamily="'Barlow Condensed', Impact, sans-serif"
        fontSize={code.length > 2 ? 17 : 20}
        fontWeight="700"
        letterSpacing="0.06em"
        fill={textColor}
      >
        {code}
      </text>
      <path d="M28 43.2h8" stroke={textColor} strokeOpacity="0.55" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M32 46.2l1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4Z" fill={textColor} fillOpacity="0.6" />
    </svg>
  )
}
