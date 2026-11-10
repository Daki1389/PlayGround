import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, ChevronRight, LayoutGrid, List, Sparkles, UsersRound } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatBar from '../components/StatBar'
import { useGame } from '../context/GameContext'
import { selectXI } from '../lib/lineup'
import { initials, money, positionTone } from '../lib/format'
import { getFormation, getStyle } from '../../shared/formations.js'

function HorizontalPitch({ lineup, team, onPlayerClick }) {
  const color = team?.primary_color || '#c9f75c'
  return (
    <div className="pitch-surface relative w-full overflow-hidden rounded-xl border border-white/10">
      <div className="pitch-stripes absolute inset-0" />
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 40% 90% at 85% 50%, ${color}16, transparent 65%)` }} />
      <svg viewBox="0 0 1000 625" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <g fill="none" stroke="rgba(255,255,255,0.27)" strokeWidth="2.4">
          <rect x="24" y="24" width="952" height="577" />
          <line x1="500" y1="24" x2="500" y2="601" />
          <circle cx="500" cy="312.5" r="64" />
          <circle cx="500" cy="312.5" r="4" fill="rgba(255,255,255,0.45)" stroke="none" />
          <rect x="24" y="150" width="132" height="325" />
          <rect x="844" y="150" width="132" height="325" />
          <rect x="24" y="238" width="52" height="149" />
          <rect x="924" y="238" width="52" height="149" />
          <circle cx="112" cy="312.5" r="4" fill="rgba(255,255,255,0.45)" stroke="none" />
          <circle cx="888" cy="312.5" r="4" fill="rgba(255,255,255,0.45)" stroke="none" />
          <path d="M156 258 A62 62 0 0 1 156 367" />
          <path d="M844 258 A62 62 0 0 0 844 367" />
        </g>
        <g fill="rgba(255,255,255,0.09)">
          <rect x="8" y="252" width="16" height="121" rx="2" />
          <rect x="976" y="252" width="16" height="121" rx="2" />
        </g>
        <g stroke="rgba(255,255,255,0.11)" strokeWidth="1">
          <line x1="24" y1="24" x2="24" y2="601" />
          <line x1="976" y1="24" x2="976" y2="601" />
        </g>
        <text x="50" y="55" fontFamily="'Barlow Condensed', Impact, sans-serif" fontSize="20" fontWeight="700" letterSpacing="3" fill="rgba(255,255,255,0.16)">
          {team?.short_name} · STARTING XI
        </text>
        <text x="500" y="333" textAnchor="middle" fontFamily="'Barlow Condensed', Impact, sans-serif" fontSize="52" fontWeight="700" letterSpacing="6" fill="rgba(255,255,255,0.035)">
          TOUCHLINE
        </text>
      </svg>
      <div className="relative aspect-[16/10] w-full">
        {lineup.map((player, index) => {
          const left = 5 + ((100 - Number(player.y)) / 100) * 90
          const top = 7 + (Number(player.x) / 100) * 86
          return (
            <motion.button
              key={player.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.035, type: 'spring', stiffness: 320, damping: 26 }}
              whileHover={{ scale: 1.08, zIndex: 30 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onPlayerClick?.(player)}
              className="group absolute z-10 w-[60px] -translate-x-1/2 -translate-y-1/2 text-left sm:w-[78px] lg:w-[88px]"
              style={{ left: `${left}%`, top: `${top}%` }}
            >
              <div className="relative overflow-hidden rounded-lg border border-white/15 bg-ink-950/92 shadow-[0_10px_24px_rgba(0,0,0,0.45)] backdrop-blur-sm transition group-hover:border-lime/55">
                <div className="h-[2px] w-full" style={{ backgroundColor: color }} />
                <div className="px-1 pb-1 pt-0.5 sm:px-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="num rounded-sm bg-lime px-1 text-[9px] font-bold leading-[14px] text-ink-950 sm:text-[10px]">
                      {player.overall_rating}
                    </span>
                    <span className={`rounded-sm px-1 text-[7px] font-bold uppercase leading-[13px] ring-1 ring-inset ${positionTone(player.position)}`}>
                      {player.slot}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[8px] font-semibold leading-tight text-white sm:text-[9.5px]">
                    {player.name.split(' ').slice(-1)[0]}
                  </p>
                  <div className="mt-0.5 h-0.5 overflow-hidden rounded-full bg-white/15">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${player.stamina || 90}%`,
                        backgroundColor: player.stamina >= 85 ? '#c9f75c' : player.stamina >= 72 ? '#fbbf24' : '#fb7185'
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
      <div className="pointer-events-none absolute inset-x-3 bottom-2 flex items-center justify-between text-[8px] font-semibold uppercase tracking-[0.18em] text-white/25">
        <span>Defend</span>
        <span>Attack</span>
      </div>
    </div>
  )
}

function SquadOverview({ squad, lineup }) {
  const counts = squad.reduce((acc, player) => {
    acc[player.position] = (acc[player.position] || 0) + 1
    return acc
  }, { GK: 0, DEF: 0, MID: 0, ATT: 0 })
  const average = position => {
    const rows = squad.filter(player => player.position === position)
    if (!rows.length) return 0
    return Math.round(rows.reduce((sum, player) => sum + player.overall_rating, 0) / rows.length)
  }
  const xiRating = lineup.length
    ? (lineup.reduce((sum, player) => sum + player.overall_rating, 0) / lineup.length).toFixed(1)
    : '—'
  const wageBill = squad.reduce((sum, player) => sum + player.wage, 0)

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Squad overview</p>
          <h2 className="display-title mt-0.5 text-xl">Depth chart</h2>
        </div>
        <span className="chip-lime"><Sparkles size={11} /> XI {xiRating}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2.5">
          <p className="text-[9px] uppercase tracking-wider text-mist-dim">Squad size</p>
          <p className="num mt-0.5 text-2xl font-semibold text-white">{squad.length}</p>
        </div>
        <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2.5">
          <p className="text-[9px] uppercase tracking-wider text-mist-dim">Wage bill</p>
          <p className="num mt-0.5 text-2xl font-semibold text-white">{money(wageBill)}</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-[9px] uppercase tracking-wider text-mist-dim">
          <span>Position balance</span>
          <span>{counts.GK} GK · {counts.DEF} DEF · {counts.MID} MID · {counts.ATT} ATT</span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full bg-amber-400" style={{ width: `${(counts.GK / squad.length) * 100}%` }} />
          <div className="h-full bg-sky-400" style={{ width: `${(counts.DEF / squad.length) * 100}%` }} />
          <div className="h-full bg-lime" style={{ width: `${(counts.MID / squad.length) * 100}%` }} />
          <div className="h-full bg-rose-400" style={{ width: `${(counts.ATT / squad.length) * 100}%` }} />
        </div>
      </div>
      <div className="mt-4 space-y-2.5">
        {[
          { label: 'Attack', value: average('ATT'), tone: 'rose' },
          { label: 'Midfield', value: average('MID'), tone: 'lime' },
          { label: 'Defence', value: average('DEF'), tone: 'sky' },
          { label: 'Goalkeeping', value: average('GK'), tone: 'amber' }
        ].map(row => <StatBar key={row.label} label={row.label} value={row.value} tone={row.tone} compact />)}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-lg border border-white/[0.05] bg-ink-950/45 px-3 py-2 text-[10px]">
        <span className="text-mist-dim">Squad value</span>
        <span className="num font-semibold text-lime">{money(squad.reduce((sum, player) => sum + player.market_value, 0))}</span>
      </div>
    </div>
  )
}

function Bench({ bench, onPlayerClick }) {
  return (
    <div className="panel flex flex-col p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="eyebrow">On the bench</p>
          <h2 className="display-title mt-0.5 text-xl">The supporting cast</h2>
        </div>
        <span className="chip">{bench.length} players</span>
      </div>
      <div className="max-h-[300px] space-y-1 overflow-y-auto pr-1 scroll-slim">
        {bench.map((player, index) => (
          <button
            key={player.id}
            onClick={() => onPlayerClick?.(player)}
            className="group flex w-full items-center gap-2.5 rounded-lg border border-transparent px-1.5 py-1.5 text-left transition hover:border-white/[0.07] hover:bg-white/[0.03]"
          >
            <span className="num w-3 text-[9px] text-mist-dim">{index + 1}</span>
            <span className={`flex h-6 w-6 items-center justify-center rounded text-[8px] font-bold ring-1 ring-inset ${positionTone(player.position)}`}>{player.position}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-slate-200 group-hover:text-white">{player.name}</p>
              <p className="text-[9px] text-mist-dim">{player.age} yrs · {money(player.wage)}/wk</p>
            </div>
            <span className="num rounded bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-semibold text-white">{player.overall_rating}</span>
            <ChevronRight size={13} className="text-mist-dim group-hover:text-lime" />
          </button>
        ))}
      </div>
    </div>
  )
}

function SquadList({ squad, lineup, filter, setFilter, onPlayerClick }) {
  const starterIds = new Set(lineup.map(player => player.id))
  const rows = filter === 'ALL' ? squad : squad.filter(player => player.position === filter)
  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.055] p-4">
        <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-ink-950/60 p-1">
          {['ALL', 'GK', 'DEF', 'MID', 'ATT'].map(position => (
            <button
              key={position}
              onClick={() => setFilter(position)}
              className={`rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition ${filter === position ? 'bg-lime text-ink-950' : 'text-mist hover:text-white'}`}
            >
              {position === 'ALL' ? 'All' : position}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-mist-dim">{rows.length} players · tap for full profile</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px]">
          <thead>
            <tr className="border-b border-white/[0.055] bg-white/[0.02]">
              <th className="table-head px-4 py-2.5 text-left">Player</th>
              <th className="table-head px-2 py-2.5 text-center">Pos</th>
              <th className="table-head px-2 py-2.5 text-center">Age</th>
              <th className="table-head px-2 py-2.5 text-center">OVR</th>
              <th className="table-head px-2 py-2.5 text-center">POT</th>
              <th className="table-head px-2 py-2.5 text-center">Stamina</th>
              <th className="table-head px-2 py-2.5 text-center">Morale</th>
              <th className="table-head px-4 py-2.5 text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(player => (
              <tr
                key={player.id}
                onClick={() => onPlayerClick?.(player)}
                className="cursor-pointer border-b border-white/[0.04] transition hover:bg-white/[0.03]"
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-md text-[9px] font-bold ${starterIds.has(player.id) ? 'bg-lime/15 text-lime ring-1 ring-inset ring-lime/20' : 'bg-white/[0.05] text-mist'}`}>
                      {initials(player.name)}
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-white">{player.name}</p>
                      <p className="text-[9px] text-mist-dim">{starterIds.has(player.id) ? 'Starting XI' : 'Bench'} · #{player.shirt_number}</p>
                    </div>
                  </div>
                </td>
                <td className="px-2 py-2.5 text-center"><span className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold ring-1 ring-inset ${positionTone(player.position)}`}>{player.position}</span></td>
                <td className="num px-2 py-2.5 text-center text-xs text-mist">{player.age}</td>
                <td className="num px-2 py-2.5 text-center"><span className="rounded bg-lime/10 px-1.5 py-0.5 text-xs font-bold text-lime">{player.overall_rating}</span></td>
                <td className="num px-2 py-2.5 text-center text-xs text-mist">{player.potential_rating}</td>
                <td className="px-2 py-2.5">
                  <div className="mx-auto w-16">
                    <div className="h-1 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full" style={{ width: `${player.stamina}%`, background: player.stamina >= 85 ? '#c9f75c' : player.stamina >= 72 ? '#fbbf24' : '#fb7185' }} />
                    </div>
                  </div>
                </td>
                <td className="px-2 py-2.5 text-center">
                  <span className={`inline-block h-2 w-2 rounded-full ${player.morale >= 80 ? 'bg-lime' : player.morale >= 65 ? 'bg-amber-400' : 'bg-rose-400'}`} />
                </td>
                <td className="num px-4 py-2.5 text-right text-xs font-semibold text-slate-200">{money(player.market_value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Squad() {
  const { data, openPlayer, setView } = useGame()
  const [mode, setMode] = useState('pitch')
  const [filter, setFilter] = useState('ALL')
  const user = data.user
  const formationId = user.formation || '4-3-3'
  const formation = getFormation(formationId)
  const style = getStyle(user.play_style)
  const { lineup, bench } = useMemo(() => selectXI(data.squad, formationId), [data.squad, formationId])
  const xiRating = lineup.length ? (lineup.reduce((sum, player) => sum + player.overall_rating, 0) / lineup.length).toFixed(1) : '—'

  return (
    <div>
      <PageHeader
        eyebrow="First team · squad hub"
        title="Squad"
        description={`${data.squad.length} players at ${user.name}. The best XI is selected automatically — tap any player to inspect their profile.`}
      >
        <div className="flex items-center rounded-xl border border-white/[0.07] bg-ink-900 p-1">
          <button onClick={() => setMode('pitch')} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${mode === 'pitch' ? 'bg-lime text-ink-950' : 'text-mist hover:text-white'}`}>
            <LayoutGrid size={13} /> Tactical
          </button>
          <button onClick={() => setMode('list')} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${mode === 'list' ? 'bg-lime text-ink-950' : 'text-mist hover:text-white'}`}>
            <List size={13} /> List
          </button>
        </div>
        <button onClick={() => setView('tactics')} className="btn-secondary">
          <ArrowUpRight size={14} /> Tactics
        </button>
      </PageHeader>

      {mode === 'pitch' ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="xl:col-span-8">
            <div className="panel p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">Starting XI · {formation.name}</p>
                  <h2 className="display-title mt-0.5 text-2xl">{formation.label} shape</h2>
                  <p className="mt-1 max-w-md text-[11px] text-mist">{formation.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="chip-lime"><Sparkles size={11} /> Auto-picked</span>
                  <span className="chip">XI {xiRating}</span>
                  <span className="chip"><UsersRound size={11} /> {style.name}</span>
                </div>
              </div>
              <HorizontalPitch lineup={lineup} team={user} onPlayerClick={player => openPlayer(player)} />
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-mist-dim">
                <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-lime" /> 86+ stamina</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Needs rotation</span>
                <span className="ml-auto hidden sm:inline">Tap a player card for attributes and contract details</span>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="space-y-4 xl:col-span-4">
            <SquadOverview squad={data.squad} lineup={lineup} />
            <Bench bench={bench} onPlayerClick={player => openPlayer(player)} />
          </motion.div>
        </div>
      ) : (
        <SquadList squad={data.squad} lineup={lineup} filter={filter} setFilter={setFilter} onPlayerClick={player => openPlayer(player)} />
      )}
    </div>
  )
}
