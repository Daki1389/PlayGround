import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { positionTone } from '../lib/format'

function PitchLines() {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <g fill="none" stroke="rgba(255,255,255,0.26)" strokeWidth="0.32">
        <rect x="3.5" y="2.5" width="93" height="95" />
        <line x1="3.5" y1="50" x2="96.5" y2="50" />
        <circle cx="50" cy="50" r="9.2" />
        <circle cx="50" cy="50" r="0.7" fill="rgba(255,255,255,0.4)" stroke="none" />
        <rect x="22" y="2.5" width="56" height="14.5" />
        <rect x="35" y="2.5" width="30" height="6.2" />
        <rect x="22" y="83" width="56" height="14.5" />
        <rect x="35" y="91.3" width="30" height="6.2" />
        <circle cx="50" cy="12.2" r="0.7" fill="rgba(255,255,255,0.4)" stroke="none" />
        <circle cx="50" cy="87.8" r="0.7" fill="rgba(255,255,255,0.4)" stroke="none" />
        <path d="M22 21.5 A16 16 0 0 1 22 34" />
        <path d="M78 78.5 A16 16 0 0 0 78 66" />
        <path d="M3.5 3.5 L7.5 3.5 M3.5 3.5 L3.5 7.5" />
        <path d="M96.5 3.5 L92.5 3.5 M96.5 3.5 L96.5 7.5" />
        <path d="M3.5 96.5 L7.5 96.5 M3.5 96.5 L3.5 92.5" />
        <path d="M96.5 96.5 L92.5 96.5 M96.5 96.5 L96.5 92.5" />
      </g>
      <g fill="rgba(255,255,255,0.08)">
        <rect x="41.5" y="0" width="17" height="2.5" />
        <rect x="41.5" y="97.5" width="17" height="2.5" />
      </g>
      <g stroke="rgba(255,255,255,0.12)" strokeWidth="0.18">
        <line x1="44" y1="0.2" x2="44" y2="2.4" />
        <line x1="47" y1="0.2" x2="47" y2="2.4" />
        <line x1="50" y1="0.2" x2="50" y2="2.4" />
        <line x1="53" y1="0.2" x2="53" y2="2.4" />
        <line x1="56" y1="0.2" x2="56" y2="2.4" />
        <line x1="44" y1="97.6" x2="44" y2="99.8" />
        <line x1="47" y1="97.6" x2="47" y2="99.8" />
        <line x1="50" y1="97.6" x2="50" y2="99.8" />
        <line x1="53" y1="97.6" x2="53" y2="99.8" />
        <line x1="56" y1="97.6" x2="56" y2="99.8" />
      </g>
      <text
        x="50"
        y="56"
        textAnchor="middle"
        fontFamily="'Barlow Condensed', Impact, sans-serif"
        fontSize="7"
        fontWeight="700"
        letterSpacing="1.1"
        fill="rgba(255,255,255,0.045)"
      >
        TOUCHLINE
      </text>
    </svg>
  )
}

export default function TacticalPitch({ lineup = [], team, onPlayerClick, className = '' }) {
  const color = team?.primary_color || '#c9f75c'
  const players = useMemo(() => lineup.filter(Boolean), [lineup])

  return (
    <div className={`pitch-surface relative w-full overflow-hidden rounded-xl border border-white/10 ${className}`}>
      <div className="pitch-stripes absolute inset-0" />
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(ellipse 70% 35% at 50% 100%, ${color}14, transparent 70%)` }}
      />
      <PitchLines />
      <div className="relative aspect-[2/3] w-full">
        {players.map((player, index) => (
          <motion.button
            key={player.id || `${player.slot}-${index}`}
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.035, type: 'spring', stiffness: 300, damping: 24 }}
            whileHover={{ scale: 1.06, zIndex: 30 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onPlayerClick?.(player)}
            className="absolute z-10 w-[62px] -translate-x-1/2 -translate-y-1/2 text-left sm:w-[82px] lg:w-[94px]"
            style={{ left: `${player.x}%`, top: `${player.y}%` }}
            aria-label={`${player.name}, ${player.slot || player.position}, rating ${player.overall_rating}`}
          >
            <div className="relative overflow-hidden rounded-md border border-white/15 bg-ink-950/90 shadow-[0_8px_20px_rgba(0,0,0,0.42)] backdrop-blur-[2px] transition group-hover:border-lime/50">
              <div className="h-[2px] w-full" style={{ backgroundColor: color }} />
              <div className="px-1 pb-1 pt-0.5 sm:px-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="num rounded-sm bg-lime px-1 text-[10px] font-bold leading-[15px] text-ink-950 sm:text-[11px]">
                    {player.overall_rating}
                  </span>
                  <span className={`rounded-sm px-1 text-[8px] font-bold uppercase leading-[14px] ring-1 ring-inset ${positionTone(player.position)}`}>
                    {player.slot || player.position}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[7.5px] font-semibold leading-tight text-white sm:text-[9px] lg:text-[10px]">
                  {player.name?.split(' ').slice(-1)[0] || player.name}
                </p>
                <div className="mt-0.5 flex items-center gap-1">
                  <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/15">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${player.stamina || 90}%`,
                        backgroundColor: player.stamina >= 85 ? '#c9f75c' : player.stamina >= 72 ? '#fbbf24' : '#fb7185'
                      }}
                    />
                  </div>
                  <span className="hidden text-[7px] font-medium text-white/45 sm:inline">{player.stamina}</span>
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
