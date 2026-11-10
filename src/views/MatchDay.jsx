import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CircleDot,
  Clock3,
  Crosshair,
  Flag,
  Gauge,
  MapPin,
  Pause,
  Play,
  Shield,
  Sparkles,
  Square,
  Star,
  Target,
  Trophy,
  UsersRound,
  Zap
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import ClubBadge from '../components/ClubBadge'
import FormPills from '../components/FormPills'
import LivePitch, { computeBall } from '../components/LivePitch'
import { useGame } from '../context/GameContext'
import { isHome, initials, money, ordinal, positionTone, ratingTone, resultFor, scoreFor, shortDate } from '../lib/format'

const EVENT_META = {
  goal: { icon: Target, color: 'text-lime', ring: 'border-lime/25 bg-lime/[0.07]', label: 'Goal' },
  chance: { icon: Crosshair, color: 'text-sky-300', ring: 'border-sky-400/20 bg-sky-400/[0.05]', label: 'Chance' },
  save: { icon: Shield, color: 'text-violet-300', ring: 'border-violet-400/20 bg-violet-400/[0.05]', label: 'Save' },
  card: { icon: Square, color: 'text-amber-300', ring: 'border-amber-400/20 bg-amber-400/[0.05]', label: 'Card' },
  kickoff: { icon: Play, color: 'text-lime', ring: 'border-white/10 bg-white/[0.03]', label: 'Kick-off' },
  halftime: { icon: Clock3, color: 'text-mist', ring: 'border-white/10 bg-white/[0.03]', label: 'Half-time' },
  fulltime: { icon: Flag, color: 'text-lime', ring: 'border-lime/20 bg-lime/[0.05]', label: 'Full-time' }
}

const SPEEDS = [1, 2, 4]

function TeamSheet({ team, lineup, formation, isUser, accent }) {
  return (
    <div className={`rounded-xl border p-3.5 ${isUser ? 'border-lime/20 bg-lime/[0.025]' : 'border-white/[0.06] bg-white/[0.018]'}`}>
      <div className="mb-2.5 flex items-center gap-2.5">
        <ClubBadge team={team} size={32} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[12px] font-bold text-white">{team?.name}</p>
            {isUser && <span className="rounded bg-lime/15 px-1 py-0.5 text-[7px] font-bold text-lime">YOU</span>}
          </div>
          <p className="text-[9px] text-mist-dim">{formation} · Predicted XI</p>
        </div>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
      </div>
      <div className="space-y-0.5">
        {(lineup || []).map(player => (
          <div key={player.id} className="flex items-center gap-2 rounded px-1 py-1 transition hover:bg-white/[0.03]">
            <span className="num w-4 text-[9px] text-mist-dim">{player.shirt_number}</span>
            <span className={`inline-flex w-7 justify-center rounded px-1 py-0.5 text-[8px] font-bold ring-1 ring-inset ${positionTone(player.position)}`}>{player.slot || player.position}</span>
            <span className="min-w-0 flex-1 truncate text-[10.5px] text-slate-300">{player.name}</span>
            <span className="num rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold text-white">{player.overall_rating}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ComparisonRow({ label, homeValue, awayValue, homeColor, awayColor, max = 100 }) {
  const home = Math.max(0, Math.min(100, (Number(homeValue) / max) * 100))
  const away = Math.max(0, Math.min(100, (Number(awayValue) / max) * 100))
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[10px]">
        <span className="num font-semibold text-white">{homeValue}</span>
        <span className="text-mist-dim">{label}</span>
        <span className="num font-semibold text-white">{awayValue}</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="flex h-1.5 flex-1 justify-end overflow-hidden rounded-l-full bg-white/[0.06]">
          <div className="h-full rounded-l-full" style={{ width: `${home}%`, backgroundColor: homeColor }} />
        </div>
        <div className="flex h-1.5 flex-1 overflow-hidden rounded-r-full bg-white/[0.06]">
          <div className="h-full rounded-r-full" style={{ width: `${away}%`, backgroundColor: awayColor }} />
        </div>
      </div>
    </div>
  )
}

function PreMatch({ next, user, onKickoff }) {
  const { data, setView, refresh } = useGame()
  const [starting, setStarting] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [error, setError] = useState(null)

  if (!next) {
    const last = data.recent_matches[0]
    return (
      <div className="panel p-6 sm:p-8">
        <div className="chip-lime mb-3"><Trophy size={12} /> Season complete</div>
        <h2 className="display-title text-3xl">No fixture on the horizon.</h2>
        <p className="mt-2 max-w-xl text-sm text-mist">The league campaign is finished. Head to the table to see how the season shook out, or review the squad before next year.</p>
        {last && (
          <div className="mt-5 max-w-md rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="eyebrow mb-2">Final match</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-200">{last.home_team.short_name} {last.home_score}</span>
              <span className="text-xs text-mist-dim">—</span>
              <span className="text-sm text-slate-200">{last.away_score} {last.away_team.short_name}</span>
            </div>
          </div>
        )}
        <div className="mt-5 flex gap-2">
          <button onClick={() => setView('league')} className="btn-primary">View final table <ArrowRight size={15} /></button>
          <button onClick={() => setView('squad')} className="btn-secondary">Review squad</button>
        </div>
      </div>
    )
  }

  const homeTeam = next.home_team
  const awayTeam = next.away_team
  const userHome = isHome(next, user.id)
  const preview = next.preview
  const homeRow = data.standings.find(row => row.team_id === homeTeam.id)
  const awayRow = data.standings.find(row => row.team_id === awayTeam.id)
  const userRow = data.standings.find(row => row.team_id === user.id)
  const capacity = 18000 + homeTeam.stadium_level * 7500

  async function kickoff() {
    setStarting(true)
    setError(null)
    try {
      await onKickoff(next.id, speed)
    } catch (err) {
      if (err.status === 409) {
        await refresh({ silent: true })
        return
      }
      setError(err.message)
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="space-y-4">
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="panel">
        <div
          className="relative p-5 sm:p-7"
          style={{ background: `radial-gradient(ellipse 60% 120% at 10% 0%, ${homeTeam.primary_color}18, transparent 55%), radial-gradient(ellipse 55% 120% at 90% 0%, ${awayTeam.primary_color}14, transparent 55%)` }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="chip-lime"><span className="h-1.5 w-1.5 rounded-full bg-lime" /> Matchday {next.round}</span>
              <span className="chip">League · 2026/27</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-mist">
              <CalendarDays size={13} /> {shortDate(next.match_date)} · 15:00
            </div>
          </div>

          <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-6">
            <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:gap-4 sm:text-left">
              <ClubBadge team={homeTeam} size={58} className="sm:hidden" />
              <ClubBadge team={homeTeam} size={82} className="hidden sm:block" />
              <div className="min-w-0">
                <p className="eyebrow text-[9px]">Home</p>
                <p className="display-title mt-0.5 line-clamp-2 text-xl leading-[0.95] sm:text-3xl">{homeTeam.name}</p>
                <div className="mt-2 flex items-center justify-center gap-2 sm:justify-start">
                  <span className="chip">{homeRow ? `${ordinal(homeRow.position)} · ${homeRow.points} pts` : '—'}</span>
                  <span className="hidden sm:block"><FormPills form={homeRow?.form || []} size="xs" /></span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <span className="display-title text-3xl text-white/20 sm:text-4xl">VS</span>
              <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-mist-dim">15:00</span>
            </div>

            <div className="flex flex-col items-center gap-2 text-center sm:flex-row-reverse sm:gap-4 sm:text-right">
              <ClubBadge team={awayTeam} size={58} className="sm:hidden" />
              <ClubBadge team={awayTeam} size={82} className="hidden sm:block" />
              <div className="min-w-0">
                <p className="eyebrow text-[9px]">Away</p>
                <p className="display-title mt-0.5 line-clamp-2 text-xl leading-[0.95] sm:text-3xl">{awayTeam.name}</p>
                <div className="mt-2 flex items-center justify-center gap-2 sm:justify-end">
                  <span className="hidden sm:block"><FormPills form={awayRow?.form || []} size="xs" /></span>
                  <span className="chip">{awayRow ? `${ordinal(awayRow.position)} · ${awayRow.points} pts` : '—'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-ink-950/50 p-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-mist">
              <span className="inline-flex items-center gap-1.5"><MapPin size={12} /> {homeTeam.stadium_name}</span>
              <span className="inline-flex items-center gap-1.5"><UsersRound size={12} /> {capacity.toLocaleString('en-GB')} capacity</span>
              <span className="inline-flex items-center gap-1.5"><Trophy size={12} /> {userHome ? 'Home advantage' : 'Away day'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg border border-white/[0.07] bg-ink-900 p-0.5">
                {SPEEDS.map(value => (
                  <button key={value} onClick={() => setSpeed(value)} className={`rounded-md px-2 py-1 text-[10px] font-semibold transition ${speed === value ? 'bg-lime text-ink-950' : 'text-mist hover:text-white'}`}>
                    {value}×
                  </button>
                ))}
              </div>
              <button onClick={kickoff} disabled={starting} className="btn-primary flex-1 sm:flex-none">
                {starting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" /> : <Play size={16} className="fill-ink-950" />}
                {starting ? 'Preparing…' : 'Kick off'}
              </button>
            </div>
          </div>
          {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-white/[0.055] px-5 py-2.5 text-[10px] text-mist-dim">
          <span>Your position: <span className="text-slate-300">{userRow ? `${ordinal(userRow.position)} · ${userRow.points} pts` : '—'}</span></span>
          <span>Last result: <span className="text-slate-300">{data.recent_matches[0] ? scoreFor(data.recent_matches[0], user.id) : '—'}</span></span>
          <span className="ml-auto hidden sm:inline">Simulation speed can be changed mid-match</span>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="panel p-5 xl:col-span-7">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="eyebrow">Team sheets</p>
              <h2 className="display-title mt-0.5 text-xl">The starting line-ups</h2>
            </div>
            <span className="chip"><UsersRound size={11} /> 22 players</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TeamSheet team={homeTeam} lineup={preview?.home?.lineup} formation={preview?.home?.formation} isUser={homeTeam.id === user.id} accent={homeTeam.primary_color} />
            <TeamSheet team={awayTeam} lineup={preview?.away?.lineup} formation={preview?.away?.formation} isUser={awayTeam.id === user.id} accent={awayTeam.primary_color} />
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="panel p-5 xl:col-span-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="eyebrow">Match preview</p>
              <h2 className="display-title mt-0.5 text-xl">The tactical view</h2>
            </div>
            <span className="chip-lime"><Activity size={11} /> Live model</span>
          </div>
          <div className="space-y-4">
            <ComparisonRow label="Attack" homeValue={preview?.home?.attack} awayValue={preview?.away?.attack} homeColor={homeTeam.primary_color} awayColor={awayTeam.primary_color} />
            <ComparisonRow label="Defence" homeValue={preview?.home?.defence} awayValue={preview?.away?.defence} homeColor={homeTeam.primary_color} awayColor={awayTeam.primary_color} />
            <ComparisonRow label="Overall" homeValue={preview?.home?.rating} awayValue={preview?.away?.rating} homeColor={homeTeam.primary_color} awayColor={awayTeam.primary_color} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
              <p className="text-[9px] uppercase tracking-wider text-mist-dim">Home style</p>
              <p className="mt-0.5 text-[12px] font-bold text-white">{preview?.home?.style || 'Balanced'}</p>
              <p className="mt-0.5 text-[9px] text-mist-dim">{preview?.home?.formation} · {homeTeam.formation}</p>
            </div>
            <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
              <p className="text-[9px] uppercase tracking-wider text-mist-dim">Away style</p>
              <p className="mt-0.5 text-[12px] font-bold text-white">{preview?.away?.style || 'Balanced'}</p>
              <p className="mt-0.5 text-[9px] text-mist-dim">{preview?.away?.formation} · {awayTeam.formation}</p>
            </div>
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-lime/15 bg-lime/[0.04] p-3">
            <Sparkles size={14} className="mt-0.5 shrink-0 text-lime" />
            <p className="text-[10px] leading-relaxed text-mist">
              {preview?.home?.attack > preview?.away?.defence
                ? `${homeTeam.short_name} hold the attacking edge. ${awayTeam.short_name} will need a disciplined block to survive sustained pressure.`
                : `${awayTeam.short_name} look dangerous going forward. ${homeTeam.short_name} must protect the space behind their midfield.`}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-lg border border-white/[0.05] bg-ink-950/45 px-3 py-2 text-[10px]">
            <span className="text-mist-dim">Predicted gate</span>
            <span className="num font-semibold text-slate-200">{Math.round(capacity * 0.94).toLocaleString('en-GB')}</span>
          </div>
        </motion.section>
      </div>
    </div>
  )
}

function LiveMatch({ bundle, user, onFinish }) {
  const { refresh } = useGame()
  const { result, speed: initialSpeed } = bundle
  const simulation = result.simulation
  const match = result.match
  const [minute, setMinute] = useState(0)
  const [running, setRunning] = useState(true)
  const [speed, setSpeed] = useState(initialSpeed || 1)
  const [phase, setPhase] = useState('live')
  const refreshed = useRef(false)
  const homeTeam = match.home_team
  const awayTeam = match.away_team
  const userHome = isHome(match, user.id)

  useEffect(() => {
    if (phase !== 'live' || !running) return undefined
    const interval = setInterval(() => {
      setMinute(value => Math.min(90, value + 1))
    }, Math.max(45, 220 / speed))
    return () => clearInterval(interval)
  }, [phase, running, speed])

  useEffect(() => {
    if (phase !== 'live' || minute < 90) return undefined
    setRunning(false)
    const timer = setTimeout(() => setPhase('post'), 1000)
    return () => clearTimeout(timer)
  }, [minute, phase])

  useEffect(() => {
    if (phase === 'post' && !refreshed.current) {
      refreshed.current = true
      refresh({ silent: true })
    }
  }, [phase, refresh])

  const events = simulation.events || []
  const visibleEvents = useMemo(() => events.filter(event => event.minute <= minute), [events, minute])
  const latestEvent = visibleEvents[visibleEvents.length - 1]
  const homeScore = latestEvent?.homeScore ?? 0
  const awayScore = latestEvent?.awayScore ?? 0
  const ball = computeBall(latestEvent)
  const homeShots = events.filter(event => event.side === 'home' && ['goal', 'chance', 'save'].includes(event.type) && event.minute <= minute).length
  const awayShots = events.filter(event => event.side === 'away' && ['goal', 'chance', 'save'].includes(event.type) && event.minute <= minute).length
  const possession = Math.max(30, Math.min(70, Math.round(50 + ((simulation.home.metrics.mid || 75) - (simulation.away.metrics.mid || 75)) * 0.7)))
  const lineups = phase === 'post'
    ? { home: simulation.lineups.home, away: simulation.lineups.away }
    : { home: simulation.lineups.home, away: simulation.lineups.away }

  if (phase === 'post') {
    return <PostMatch result={result} simulation={simulation} match={match} user={user} onFinish={onFinish} />
  }

  return (
    <div className="space-y-4">
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="panel">
        <div className="relative p-4 sm:p-5" style={{ background: `radial-gradient(ellipse 55% 140% at 8% 0%, ${homeTeam.primary_color}18, transparent 55%), radial-gradient(ellipse 55% 140% at 92% 0%, ${awayTeam.primary_color}12, transparent 55%)` }}>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-5">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <ClubBadge team={homeTeam} size={44} className="sm:hidden" />
              <ClubBadge team={homeTeam} size={56} className="hidden sm:block" />
              <div className="min-w-0">
                <p className="truncate text-[12px] font-bold text-white sm:text-base">{homeTeam.name}</p>
                <p className="text-[9px] text-mist-dim">{homeTeam.short_name} · Home</p>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="num text-3xl font-bold leading-none text-white sm:text-5xl">{homeScore}</span>
                <span className="num text-lg text-mist-dim sm:text-2xl">:</span>
                <span className="num text-3xl font-bold leading-none text-white sm:text-5xl">{awayScore}</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 rounded-full border border-lime/25 bg-lime/[0.08] px-2 py-0.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime" />
                <span className="num text-[10px] font-bold text-lime">{minute}′ LIVE</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 text-right sm:gap-3">
              <div className="min-w-0">
                <p className="truncate text-[12px] font-bold text-white sm:text-base">{awayTeam.name}</p>
                <p className="text-[9px] text-mist-dim">Away · {awayTeam.short_name}</p>
              </div>
              <ClubBadge team={awayTeam} size={44} className="sm:hidden" />
              <ClubBadge team={awayTeam} size={56} className="hidden sm:block" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[10px] text-mist-dim">
              <span className="inline-flex items-center gap-1.5"><CalendarDays size={11} /> Matchday {match.round}</span>
              <span className="hidden items-center gap-1.5 sm:inline-flex"><MapPin size={11} /> {homeTeam.stadium_name}</span>
              {latestEvent && <span className="hidden items-center gap-1.5 sm:inline-flex"><Activity size={11} /> {latestEvent.homeScore}-{latestEvent.awayScore} on the board</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setRunning(value => !value)} className="icon-btn h-8 w-8" aria-label={running ? 'Pause simulation' : 'Resume simulation'}>
                {running ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <div className="flex items-center rounded-lg border border-white/[0.07] bg-ink-950/60 p-0.5">
                {SPEEDS.map(value => (
                  <button key={value} onClick={() => setSpeed(value)} className={`rounded px-1.5 py-1 text-[9px] font-semibold transition ${speed === value ? 'bg-lime text-ink-950' : 'text-mist hover:text-white'}`}>{value}×</button>
                ))}
              </div>
              <button onClick={() => { setMinute(90); setRunning(false); setPhase('post') }} className="btn-secondary h-8 px-2.5 text-[10px]">Skip <ArrowRight size={12} /></button>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="panel p-3 sm:p-4 xl:col-span-8">
          <div className="mb-2.5 flex items-center justify-between px-1">
            <div>
              <p className="eyebrow">Live pitch</p>
              <p className="text-[11px] font-semibold text-white">{homeTeam.short_name} vs {awayTeam.short_name}</p>
            </div>
            <div className="flex items-center gap-3 text-[9px] text-mist-dim">
              <span>xG <span className="num font-semibold text-white">{simulation.home.xg}</span> — <span className="num font-semibold text-white">{simulation.away.xg}</span></span>
              <span className="hidden sm:inline">Ball follows the action</span>
            </div>
          </div>
          <LivePitch lineups={lineups} homeTeam={homeTeam} awayTeam={awayTeam} minute={minute} ball={ball} latestEvent={latestEvent} />
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { label: 'Possession', home: `${possession}%`, away: `${100 - possession}%` },
              { label: 'Shots', home: homeShots, away: awayShots },
              { label: 'xG', home: simulation.home.xg, away: simulation.away.xg }
            ].map(stat => (
              <div key={stat.label} className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-2 text-center">
                <p className="text-[8px] uppercase tracking-wider text-mist-dim">{stat.label}</p>
                <p className="num mt-0.5 text-sm font-semibold text-white"><span className="text-lime">{stat.home}</span> <span className="text-mist-dim">·</span> <span>{stat.away}</span></p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="panel flex flex-col xl:col-span-4">
          <div className="flex items-center justify-between border-b border-white/[0.055] px-4 py-3">
            <div>
              <p className="eyebrow">Commentary</p>
              <p className="text-[11px] font-semibold text-white">Live feed</p>
            </div>
            <span className="chip-lime"><CircleDot size={11} className="animate-pulse" /> {visibleEvents.length} events</span>
          </div>
          <div className="max-h-[518px] min-h-[360px] flex-1 overflow-y-auto p-2.5 scroll-slim">
            <AnimatePresence initial={false}>
              {visibleEvents.slice().reverse().map(event => {
                const meta = EVENT_META[event.type] || EVENT_META.chance
                const Icon = meta.icon
                const isLatest = latestEvent && event.minute === latestEvent.minute && event.text === latestEvent.text
                return (
                  <motion.div
                    key={`${event.minute}-${event.type}-${event.playerId || event.text.slice(0, 10)}`}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className={`mb-1.5 rounded-lg border p-2.5 ${meta.ring} ${isLatest ? 'ring-1 ring-inset ring-white/10' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/10 bg-ink-950/50 ${meta.color}`}>
                        <Icon size={12} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="num text-[9px] font-bold text-mist">{event.minute}′</span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${meta.color}`}>{event.headline || meta.label}</span>
                          {event.type === 'goal' && (
                            <span className="ml-auto rounded bg-white/[0.08] px-1.5 py-0.5 text-[9px] font-bold text-white">{event.homeScore}–{event.awayScore}</span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[10px] leading-relaxed text-slate-300">{event.text}</p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            {minute === 0 && visibleEvents.length === 0 && (
              <div className="flex h-48 flex-col items-center justify-center text-center">
                <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-lime/10 text-lime"><Play size={16} /></span>
                <p className="text-xs font-semibold text-white">Waiting for kick-off…</p>
                <p className="mt-1 text-[10px] text-mist-dim">The players are in the tunnel.</p>
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </div>
  )
}

function RatingRow({ stat, isMotm }) {
  const percent = Math.max(0, Math.min(100, ((stat.rating - 4) / 6) * 100))
  return (
    <div className={`rounded-lg border px-2.5 py-2 ${isMotm ? 'border-lime/20 bg-lime/[0.04]' : 'border-white/[0.04] bg-white/[0.015]'}`}>
      <div className="flex items-center gap-2">
        <span className={`inline-flex w-7 justify-center rounded px-1 py-0.5 text-[8px] font-bold ring-1 ring-inset ${positionTone(stat.position)}`}>{stat.position}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold text-slate-200">
            {stat.name}
            {isMotm && <Star size={10} className="ml-1 inline fill-lime text-lime" />}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
              <div className="h-full rounded-full bg-lime" style={{ width: `${percent}%` }} />
            </div>
            <span className="text-[8px] text-mist-dim">{stat.goals ? `${stat.goals}G` : ''}{stat.goals && stat.assists ? ' · ' : ''}{stat.assists ? `${stat.assists}A` : ''}</span>
          </div>
        </div>
        <span className={`num rounded-md px-1.5 py-0.5 text-[11px] font-bold ${ratingTone(stat.rating)}`}>{Number(stat.rating).toFixed(1)}</span>
      </div>
    </div>
  )
}

function PostMatch({ result, simulation, match, user, onFinish }) {
  const { setView } = useGame()
  const homeTeam = match.home_team
  const awayTeam = match.away_team
  const userHome = isHome(match, user.id)
  const homeStats = simulation.stats.filter(stat => stat.side === 'home').sort((a, b) => b.rating - a.rating)
  const awayStats = simulation.stats.filter(stat => stat.side === 'away').sort((a, b) => b.rating - a.rating)
  const motm = simulation.motm
  const motmTeam = motm?.side === 'home' ? homeTeam : awayTeam
  const userResult = userHome
    ? match.home_score > match.away_score ? 'W' : match.home_score < match.away_score ? 'L' : 'D'
    : match.away_score > match.home_score ? 'W' : match.away_score < match.home_score ? 'L' : 'D'
  const goals = simulation.events.filter(event => event.type === 'goal')
  const homePossession = Math.max(30, Math.min(70, Math.round(50 + ((simulation.home.metrics.mid || 75) - (simulation.away.metrics.mid || 75)) * 0.7)))
  const homeShots = simulation.events.filter(event => event.side === 'home' && ['goal', 'chance', 'save'].includes(event.type)).length
  const awayShots = simulation.events.filter(event => event.side === 'away' && ['goal', 'chance', 'save'].includes(event.type)).length

  return (
    <div className="space-y-4">
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="panel">
        <div className="relative p-5 sm:p-7" style={{ background: `radial-gradient(ellipse 60% 120% at 12% 0%, ${homeTeam.primary_color}1f, transparent 55%), radial-gradient(ellipse 60% 120% at 88% 0%, ${awayTeam.primary_color}16, transparent 55%)` }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="chip-lime"><Flag size={11} /> Full-time</span>
              <span className="chip">Matchday {match.round}</span>
              <span className={`inline-flex h-5 items-center rounded px-2 text-[9px] font-bold form-${userResult}`}>You {userResult === 'W' ? 'won' : userResult === 'D' ? 'drew' : 'lost'}</span>
            </div>
            <span className="text-[10px] text-mist-dim">Attendance {Number(match.attendance || 0).toLocaleString('en-GB')}</span>
          </div>

          <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-6">
            <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:gap-4 sm:text-left">
              <ClubBadge team={homeTeam} size={56} className="sm:hidden" />
              <ClubBadge team={homeTeam} size={78} className="hidden sm:block" />
              <div className="min-w-0">
                <p className="display-title line-clamp-2 text-lg leading-[0.95] sm:text-2xl">{homeTeam.name}</p>
                <p className="mt-1 text-[9px] uppercase tracking-wider text-mist-dim">Home</p>
              </div>
            </div>
            <div className="flex flex-col items-center px-1">
              <div className="num flex items-center gap-2 text-4xl font-bold text-white sm:text-6xl">
                <span className={userHome && match.home_score > match.away_score ? 'text-lime' : ''}>{match.home_score}</span>
                <span className="text-xl text-mist-dim sm:text-3xl">–</span>
                <span className={!userHome && match.away_score > match.home_score ? 'text-lime' : ''}>{match.away_score}</span>
              </div>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-mist-dim">Full-time</p>
            </div>
            <div className="flex flex-col items-center gap-2 text-center sm:flex-row-reverse sm:gap-4 sm:text-right">
              <ClubBadge team={awayTeam} size={56} className="sm:hidden" />
              <ClubBadge team={awayTeam} size={78} className="hidden sm:block" />
              <div className="min-w-0">
                <p className="display-title line-clamp-2 text-lg leading-[0.95] sm:text-2xl">{awayTeam.name}</p>
                <p className="mt-1 text-[9px] uppercase tracking-wider text-mist-dim">Away</p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl border border-white/[0.06] bg-ink-950/55 p-3 sm:grid-cols-4">
            <div className="text-center">
              <p className="text-[8px] uppercase tracking-wider text-mist-dim">Possession</p>
              <p className="num mt-0.5 text-sm font-semibold text-white"><span className="text-lime">{homePossession}%</span> · {100 - homePossession}%</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] uppercase tracking-wider text-mist-dim">Shots</p>
              <p className="num mt-0.5 text-sm font-semibold text-white"><span className="text-lime">{homeShots}</span> · {awayShots}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] uppercase tracking-wider text-mist-dim">Expected goals</p>
              <p className="num mt-0.5 text-sm font-semibold text-white"><span className="text-lime">{simulation.home.xg}</span> · {simulation.away.xg}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] uppercase tracking-wider text-mist-dim">Player of the match</p>
              <p className="mt-0.5 truncate text-[11px] font-semibold text-white">{motm?.name}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-ink-950"><Star size={14} className="fill-ink-950" /></div>
              <div>
                <p className="text-[8px] uppercase tracking-wider text-mist-dim">Man of the match</p>
                <p className="text-[11px] font-bold text-white">{motm?.name} <span className="font-normal text-mist-dim">· {motmTeam.short_name} · {Number(motm?.rating || 0).toFixed(1)}</span></p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setView('dashboard')} className="btn-secondary flex-1 sm:flex-none">Dashboard</button>
              <button onClick={onFinish} className="btn-primary flex-1 sm:flex-none">
                Continue <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="panel p-4 xl:col-span-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClubBadge team={homeTeam} size={26} />
              <div>
                <p className="eyebrow">{homeTeam.short_name}</p>
                <h3 className="display-title text-lg">{homeTeam.name} ratings</h3>
              </div>
            </div>
            <span className="chip">Avg {average(homeStats)}</span>
          </div>
          <div className="space-y-1">
            {homeStats.map(stat => <RatingRow key={stat.player_id} stat={stat} isMotm={stat.player_id === motm?.player_id} />)}
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="panel p-4 xl:col-span-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClubBadge team={awayTeam} size={26} />
              <div>
                <p className="eyebrow">{awayTeam.short_name}</p>
                <h3 className="display-title text-lg">{awayTeam.name} ratings</h3>
              </div>
            </div>
            <span className="chip">Avg {average(awayStats)}</span>
          </div>
          <div className="space-y-1">
            {awayStats.map(stat => <RatingRow key={stat.player_id} stat={stat} isMotm={stat.player_id === motm?.player_id} />)}
          </div>
        </motion.section>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="panel p-5 xl:col-span-7">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="eyebrow">Match story</p>
              <h2 className="display-title mt-0.5 text-xl">The goals</h2>
            </div>
            <span className="chip">{goals.length} goals</span>
          </div>
          {goals.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/10 p-6 text-center text-xs text-mist">A goalless afternoon. The defences came out on top.</p>
          ) : (
            <div className="space-y-1.5">
              {goals.map((goal, index) => (
                <div key={`${goal.minute}-${index}`} className="flex items-center gap-2.5 rounded-lg border border-white/[0.045] bg-white/[0.015] px-3 py-2">
                  <span className="num w-7 text-[10px] text-mist-dim">{goal.minute}′</span>
                  <ClubBadge team={goal.side === 'home' ? homeTeam : awayTeam} size={20} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-white">{goal.playerName}</p>
                    <p className="text-[9px] text-mist-dim">{goal.assistName ? `Assist: ${goal.assistName}` : 'Unassisted'}</p>
                  </div>
                  <span className="num rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold text-slate-200">{goal.homeScore}–{goal.awayScore}</span>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="panel p-5 xl:col-span-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="eyebrow">Elsewhere</p>
              <h2 className="display-title mt-0.5 text-xl">Matchday {match.round}</h2>
            </div>
            <button onClick={() => setView('league')} className="text-[10px] font-semibold text-mist transition hover:text-lime">Table <ArrowRight size={12} className="inline" /></button>
          </div>
          <div className="space-y-1.5">
            {result.other_results.length === 0 ? (
              <p className="text-xs text-mist-dim">No other fixtures this round.</p>
            ) : result.other_results.map(other => (
              <div key={other.id} className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2">
                <span className="text-[10px] text-slate-200">{other.home_team}</span>
                <span className="num rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold text-white">{other.home_score}–{other.away_score}</span>
                <span className="text-[10px] text-slate-200">{other.away_team}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/[0.05] bg-ink-950/45 px-3 py-2 text-[10px] text-mist-dim">
            <Trophy size={12} className="text-lime" /> The table has been updated live.
          </div>
        </motion.section>
      </div>
    </div>
  )
}

function average(stats) {
  if (!stats.length) return '—'
  return (stats.reduce((sum, stat) => sum + stat.rating, 0) / stats.length).toFixed(1)
}

export default function MatchDay() {
  const { data, simulateMatch, notify, refresh } = useGame()
  const [bundle, setBundle] = useState(null)
  const user = data.user
  const next = data.next_match

  async function kickoff(matchId, speed) {
    const result = await simulateMatch(matchId)
    setBundle({ result, speed })
  }

  const lastMatch = data.recent_matches?.[0]
  const lastResult = lastMatch ? resultFor(lastMatch, user.id) : null

  return (
    <div>
      <PageHeader
        eyebrow="Match day · live simulation"
        title={bundle ? 'Match Day' : next ? `Matchday ${next.round}` : 'Season complete'}
        description={bundle ? 'Follow the ball, the commentary and every rating swing. The result is written to the table the moment the whistle goes.' : next ? `Final preparations at ${next.home_team.stadium_name}. Confirm the team sheet and kick off.` : 'Every fixture is complete. Review the table or start planning next season.'}
      >
        <span className="chip"><Activity size={11} className="text-lime" /> Engine v2.6</span>
        {lastMatch && (
          <span className="chip">Last: <span className={`font-bold ${lastResult === 'W' ? 'text-lime' : lastResult === 'L' ? 'text-red-300' : 'text-slate-200'}`}>{lastResult}</span> {scoreFor(lastMatch, user.id)}</span>
        )}
        <button
          onClick={() => {
            if (bundle) refresh({ silent: true })
            setBundle(null)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className="btn-secondary"
        >
          <ArrowLeft size={14} /> Pre-match
        </button>
      </PageHeader>

      <AnimatePresence mode="wait">
        {bundle ? (
          <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LiveMatch bundle={bundle} user={user} onFinish={() => { setBundle(null); notify('Back to the dugout. Your next fixture is ready.', 'info') }} />
          </motion.div>
        ) : (
          <motion.div key="pre" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PreMatch next={next} user={user} onKickoff={kickoff} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
