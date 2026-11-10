import { motion, AnimatePresence } from 'framer-motion'
import { useId } from 'react'

function kitText(hex) {
  const value = String(hex || '').replace('#', '')
  if (value.length !== 6) return '#06100a'
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? '#07100a' : '#ffffff'
}

export function computeBall(event) {
  if (!event) return { x: 500, y: 310 }
  const seed = ((Number(event.minute) || 0) * 37 + (Number(event.playerId) || 5) * 53) % 100
  const y = 150 + (seed / 100) * 320
  if (event.type === 'goal') {
    return event.side === 'away' ? { x: 34, y: 310 } : { x: 966, y: 310 }
  }
  if (event.type === 'save') {
    return event.side === 'away' ? { x: 105, y } : { x: 895, y }
  }
  if (event.type === 'chance') {
    return event.side === 'away' ? { x: 220, y } : { x: 780, y }
  }
  if (event.type === 'card') return { x: 500, y }
  return { x: 500, y: 310 }
}

function mapPosition(player, side) {
  const progress = (100 - Number(player.y || 50)) / 100
  const x = side === 'home' ? 72 + progress * 856 : 928 - progress * 856
  const y = 76 + (Number(player.x || 50) / 100) * 468
  return { x, y }
}

export default function LivePitch({ lineups, homeTeam, awayTeam, minute = 0, ball, latestEvent }) {
  const id = useId().replace(/[:]/g, '')
  const homeColor = homeTeam?.primary_color || '#c9f75c'
  const awayColor = awayTeam?.primary_color || '#ff8a3d'
  const homeText = kitText(homeColor)
  const awayText = kitText(awayColor)

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-[#0a2a1f]">
      <svg viewBox="0 0 1000 620" className="block h-auto w-full" role="img" aria-label="Live match pitch">
        <defs>
          <linearGradient id={`${id}-grass`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#16533c" />
            <stop offset="50%" stopColor="#10402f" />
            <stop offset="100%" stopColor="#0b2e22" />
          </linearGradient>
          <pattern id={`${id}-stripes`} width="100" height="620" patternUnits="userSpaceOnUse">
            <rect width="100" height="620" fill="#0f3a2b" />
            <rect width="50" height="620" fill="#0d3527" />
          </pattern>
          <radialGradient id={`${id}-light`} cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.22)" />
          </radialGradient>
          <filter id={`${id}-glow`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`${id}-shadow`} x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.5" />
          </filter>
          <radialGradient id={`${id}-vig`} cx="50%" cy="50%" r="75%">
            <stop offset="55%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
          </radialGradient>
        </defs>

        <rect width="1000" height="620" fill={`url(#${id}-grass)`} />
        <rect width="1000" height="620" fill={`url(#${id}-stripes)`} opacity="0.85" />

        <g fill="none" stroke="rgba(255,255,255,0.42)" strokeWidth="2.2">
          <rect x="24" y="22" width="952" height="576" />
          <line x1="500" y1="22" x2="500" y2="598" />
          <circle cx="500" cy="310" r="70" />
          <circle cx="500" cy="310" r="4" fill="rgba(255,255,255,0.55)" stroke="none" />
          <rect x="24" y="142" width="145" height="336" />
          <rect x="831" y="142" width="145" height="336" />
          <rect x="24" y="232" width="56" height="156" />
          <rect x="920" y="232" width="56" height="156" />
          <circle cx="120" cy="310" r="4" fill="rgba(255,255,255,0.55)" stroke="none" />
          <circle cx="880" cy="310" r="4" fill="rgba(255,255,255,0.55)" stroke="none" />
          <path d="M169 255 A72 72 0 0 1 169 365" />
          <path d="M831 255 A72 72 0 0 0 831 365" />
          <path d="M24 38 A16 16 0 0 1 40 22" />
          <path d="M976 38 A16 16 0 0 0 960 22" />
          <path d="M24 582 A16 16 0 0 0 40 598" />
          <path d="M976 582 A16 16 0 0 1 960 598" />
        </g>

        <g stroke="rgba(255,255,255,0.24)" strokeWidth="1.4" fill="none">
          <rect x="8" y="262" width="16" height="96" rx="2" />
          <rect x="976" y="262" width="16" height="96" rx="2" />
          {[278, 294, 310, 326, 342].map(y => (
            <line key={`hnet-${y}`} x1="9" y1={y} x2="23" y2={y} />
          ))}
          {[278, 294, 310, 326, 342].map(y => (
            <line key={`anet-${y}`} x1="977" y1={y} x2="991" y2={y} />
          ))}
          {[14, 32, 50, 68, 86, 104, 122, 140, 158, 176, 194, 212, 230, 248, 266, 284, 302, 320, 338, 356, 374, 392, 410, 428, 446, 464, 482, 500, 518, 536, 554, 572].map(x => (
            <line key={`hnet-v-${x}`} x1="8" y1="262" x2="8" y2="358" />
          ))}
        </g>

        <rect width="1000" height="620" fill={`url(#${id}-light)`} />
        <rect width="1000" height="620" fill={`url(#${id}-vig)`} />

        <text x="42" y="54" fontFamily="'Barlow Condensed', Impact, sans-serif" fontSize="21" fontWeight="700" letterSpacing="2" fill="rgba(255,255,255,0.22)">
          {homeTeam?.short_name || 'HOME'}
        </text>
        <text x="958" y="54" textAnchor="end" fontFamily="'Barlow Condensed', Impact, sans-serif" fontSize="21" fontWeight="700" letterSpacing="2" fill="rgba(255,255,255,0.22)">
          {awayTeam?.short_name || 'AWAY'}
        </text>

        {(lineups?.home || []).map((player, index) => {
          const pos = mapPosition(player, 'home')
          return (
            <motion.g
              key={`h-${player.id || index}`}
              initial={false}
              animate={{
                x: pos.x + Math.sin(minute / 3.2 + index * 0.9) * 3,
                y: pos.y + Math.cos(minute / 4.5 + index * 1.3) * 2.4
              }}
              transition={{ type: 'tween', duration: 0.45, ease: 'easeOut' }}
              filter={`url(#${id}-shadow)`}
            >
              <circle r="17" fill={homeColor} stroke="rgba(0,0,0,0.45)" strokeWidth="2" />
              <text
                y="4.4"
                textAnchor="middle"
                fontFamily="'Barlow Condensed', Impact, sans-serif"
                fontSize="14"
                fontWeight="700"
                fill={homeText}
              >
                {player.shirt_number || index + 1}
              </text>
            </motion.g>
          )
        })}

        {(lineups?.away || []).map((player, index) => {
          const pos = mapPosition(player, 'away')
          return (
            <motion.g
              key={`a-${player.id || index}`}
              initial={false}
              animate={{
                x: pos.x + Math.sin(minute / 3.5 + index * 1.1) * 3,
                y: pos.y + Math.cos(minute / 4.2 + index * 0.8) * 2.4
              }}
              transition={{ type: 'tween', duration: 0.45, ease: 'easeOut' }}
              filter={`url(#${id}-shadow)`}
            >
              <circle r="17" fill={awayColor} stroke="rgba(0,0,0,0.45)" strokeWidth="2" />
              <text
                y="4.4"
                textAnchor="middle"
                fontFamily="'Barlow Condensed', Impact, sans-serif"
                fontSize="14"
                fontWeight="700"
                fill={awayText}
              >
                {player.shirt_number || index + 1}
              </text>
            </motion.g>
          )
        })}

        <motion.g
          initial={false}
          animate={{ x: ball?.x ?? 500, y: ball?.y ?? 310 }}
          transition={{ type: 'spring', stiffness: 70, damping: 17, mass: 0.7 }}
        >
          <ellipse cx="0" cy="8" rx="10" ry="4" fill="rgba(0,0,0,0.35)" />
          <circle r="8" fill="rgba(255,255,255,0.18)" filter={`url(#${id}-glow)`} />
          <circle r="5.5" fill="#ffffff" stroke="#c9f75c" strokeWidth="1.4" />
        </motion.g>

        <AnimatePresence>
          {latestEvent?.type === 'goal' && (
            <motion.g
              key={`goal-${latestEvent.minute}`}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0.7, 1.08, 1.08, 1.2] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8, times: [0, 0.18, 0.7, 1] }}
              style={{ transformOrigin: '500px 310px' }}
            >
              <text
                x="500"
                y="322"
                textAnchor="middle"
                fontFamily="'Barlow Condensed', Impact, sans-serif"
                fontSize="86"
                fontWeight="700"
                letterSpacing="6"
                fill={latestEvent.side === 'home' ? homeColor : awayColor}
                stroke="rgba(0,0,0,0.35)"
                strokeWidth="2"
              >
                GOAL!
              </text>
            </motion.g>
          )}
        </AnimatePresence>
      </svg>
      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
    </div>
  )
}
