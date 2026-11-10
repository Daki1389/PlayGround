import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  Check,
  CircleAlert,
  Clock3,
  CloudSun,
  Crosshair,
  FastForward,
  Flag,
  Goal,
  Hand,
  HeartPulse,
  MapPin,
  MessageSquare,
  Pause,
  Play,
  Shield,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Volume2,
  Zap,
} from 'lucide-react'
import { useGame } from '../context/GameContext'
import { FORMATIONS, getTeam } from '../data/gameData'
import {
  buildMatchContext,
  buildResult,
  createMatchState,
  getOpponentKeyPlayers,
  getTableRow,
  playerMatchRatings,
  playersForLineup,
  predictFromState,
  simulateMinute,
  skipToFullTime,
} from '../lib/engine'
import {
  cn,
  formatDate,
  formatDateLong,
  formatTime,
} from '../lib/format'
import TeamCrest from '../components/TeamCrest'
import PlayerAvatar from '../components/PlayerAvatar'
import {
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  FormPips,
  PositionBadge,
  ProbabilityBar,
  ProgressBar,
  RatingBadge,
  Ring,
  SectionTitle,
} from '../components/ui'
import { useToast } from '../components/Toast'

const PLANS = [
  { name: 'Cautious', icon: Shield, description: 'Compact block, spring on the counter.', note: '–12% conceded' },
  { name: 'Balanced', icon: ShieldCheck, description: 'Control possession without overcommitting.', note: 'Neutral setup' },
  { name: 'Attacking', icon: Swords, description: 'Push the full-backs high and overload.', note: '+18% threat' },
]

const TALKS = [
  { label: 'Calm and composed', detail: 'Stay disciplined, keep our shape.', icon: Shield, tone: 'sky' },
  { label: 'Show your quality', detail: 'Express yourselves, trust the plan.', icon: Sparkles, tone: 'violet' },
  { label: 'Demand more', detail: 'Raise the tempo and go after them.', icon: Zap, tone: 'amber' },
]

const EVENT_STYLES = {
  goal: { icon: Goal, tone: 'text-[#08130e] bg-lime-400 border-lime-300', row: 'border-lime-400/20 bg-lime-400/[0.055]' },
  card: { icon: CircleAlert, tone: 'text-amber-950 bg-amber-300 border-amber-200', row: 'border-amber-400/10' },
  save: { icon: Hand, tone: 'text-sky-300 bg-sky-400/10 border-sky-400/15', row: 'border-white/[0.04]' },
  shot: { icon: Crosshair, tone: 'text-mist-400 bg-white/[0.04] border-white/[0.07]', row: 'border-white/[0.04]' },
  info: { icon: MessageSquare, tone: 'text-mist-400 bg-white/[0.04] border-white/[0.07]', row: 'border-white/[0.04]' },
  injury: { icon: HeartPulse, tone: 'text-rose-300 bg-rose-400/10 border-rose-400/15', row: 'border-rose-400/10' },
  half: { icon: Flag, tone: 'text-violet-300 bg-violet-400/10 border-violet-400/15', row: 'border-violet-400/15 bg-violet-400/[0.035]' },
  fulltime: { icon: Flag, tone: 'text-lime-300 bg-lime-400/10 border-lime-400/15', row: 'border-lime-400/15 bg-lime-400/[0.035]' },
  kickoff: { icon: Flag, tone: 'text-mist-300 bg-white/[0.05] border-white/[0.08]', row: 'border-white/[0.04]' },
}

function EventItem({ event, homeCode, awayCode }) {
  const style = EVENT_STYLES[event.type] || EVENT_STYLES.info
  const Icon = style.icon
  return (
    <div className={cn('flex gap-3 rounded-xl border px-3 py-2.5 transition animate-slide-in', style.row)}>
      <span className={cn('mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border', style.tone)}>
        <Icon size={12} strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="shrink-0 font-display text-[10px] font-bold tabular-nums text-mist-500">{event.minute}'</span>
          <p className={cn('text-[11.5px] font-semibold leading-snug', event.type === 'goal' ? 'text-lime-100' : event.type === 'fulltime' || event.type === 'half' ? 'text-mist-100' : 'text-mist-200')}>
            {event.text}
          </p>
        </div>
        {event.detail && <p className="mt-0.5 text-[10px] leading-relaxed text-mist-500">{event.detail}</p>}
        {event.teamId && (
          <p className="mt-1 text-[8.5px] font-bold uppercase tracking-[0.12em] text-mist-600">
            {event.teamId === 'ashcombe' ? 'Ashcombe' : event.teamId === homeCode ? 'Home' : event.teamId === awayCode ? 'Away' : ''}
          </p>
        )}
      </div>
    </div>
  )
}

function StatRow({ label, home, away, accent = false }) {
  return (
    <div className="grid grid-cols-[1fr_58px_1fr] items-center gap-2 py-1.5 text-[10.5px]">
      <span className={cn('text-right tabular-nums', accent ? 'font-bold text-lime-300' : 'font-semibold text-mist-300')}>{home}</span>
      <span className="text-center text-[9px] font-semibold uppercase tracking-[0.08em] text-mist-600">{label}</span>
      <span className={cn('tabular-nums', accent ? 'font-bold text-mist-100' : 'font-semibold text-mist-300')}>{away}</span>
    </div>
  )
}

function StatsPanel({ match, homeTeam, awayTeam }) {
  const { stats } = match
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-[10px] font-bold text-mist-300">
        <span>{stats.home.possession}%</span>
        <span className="text-[8.5px] uppercase tracking-[0.12em] text-mist-600">Possession</span>
        <span>{stats.away.possession}%</span>
      </div>
      <div className="mb-4 flex h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full bg-lime-400" style={{ width: `${stats.home.possession}%` }} />
        <div className="h-full bg-mist-500" style={{ width: `${stats.away.possession}%` }} />
      </div>
      <div className="divide-y divide-white/[0.04]">
        <StatRow label="Shots" home={stats.home.shots} away={stats.away.shots} />
        <StatRow label="On target" home={stats.home.onTarget} away={stats.away.onTarget} accent />
        <StatRow label="Expected goals" home={stats.home.xg.toFixed(2)} away={stats.away.xg.toFixed(2)} />
        <StatRow label="Corners" home={stats.home.corners} away={stats.away.corners} />
        <StatRow label="Fouls" home={stats.home.fouls} away={stats.away.fouls} />
        <StatRow label="Yellow cards" home={stats.home.yellow} away={stats.away.yellow} />
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-white/[0.055] pt-3 text-[9px] text-mist-600">
        <span>{homeTeam.code} home</span>
        <span>{awayTeam.code} away</span>
      </div>
    </div>
  )
}

function MatchScoreboard({ match, context, playing, onTogglePlay, speed, setSpeed, onSkip, phase }) {
  const { homeTeam, awayTeam } = context
  const finished = match.finished
  const halftime = match.minute === 45 && !finished
  const goals = match.events.filter((event) => event.type === 'goal')
  return (
    <Card className="relative overflow-hidden border-white/[0.09]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(198,245,109,0.14),transparent_55%),linear-gradient(180deg,rgba(20,70,50,0.25),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:repeating-linear-gradient(90deg,#fff_0_1px,transparent_1px_54px)]" />
      <div className="relative px-4 py-4 sm:px-6 sm:py-5">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em]', finished ? 'border-white/10 bg-white/[0.04] text-mist-400' : 'border-lime-400/25 bg-lime-400/[0.08] text-lime-300')}>
              {!finished && <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-lime-300" />}
              {finished ? 'Full time' : halftime ? 'Half time' : 'Live'}
            </span>
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-mist-600">Matchday {context.fixture.round}</span>
          </div>
          <span className="hidden items-center gap-1.5 text-[9.5px] text-mist-500 sm:inline-flex"><MapPin size={11} /> {context.stadium}</span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
            <TeamCrest team={homeTeam} size={54} glow />
            <div className="text-center sm:text-left">
              <p className="font-display text-[13px] font-semibold leading-tight text-mist-50 sm:text-[16px]">{homeTeam.name}</p>
              <p className="mt-0.5 text-[9.5px] text-mist-500">{homeTeam.nickname} · OVR {context.homeRating.toFixed(1)}</p>
              <div className="mt-1 hidden flex-wrap gap-1 sm:flex">
                {goals.filter((event) => event.teamId === homeTeam.id).map((event) => (
                  <span key={event.id} className="text-[8.5px] text-mist-400">{event.playerName} {event.minute}'</span>
                ))}
              </div>
            </div>
          </div>

          <div className="min-w-[100px] text-center">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <span className="font-display text-[34px] font-bold leading-none tracking-[-0.05em] text-mist-50 sm:text-[44px]">{match.homeGoals}</span>
              <span className="font-display text-[18px] font-medium text-mist-600">:</span>
              <span className="font-display text-[34px] font-bold leading-none tracking-[-0.05em] text-mist-50 sm:text-[44px]">{match.awayGoals}</span>
            </div>
            <div className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-white/[0.07] bg-ink-950/60 px-2 py-0.5 text-[9px] font-bold text-mist-400">
              {finished ? 'FT' : halftime ? 'HT' : <><Clock3 size={9} /> {match.minute}'</>}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-end sm:gap-4">
            <div className="order-2 text-center sm:order-1 sm:text-right">
              <p className="font-display text-[13px] font-semibold leading-tight text-mist-50 sm:text-[16px]">{awayTeam.name}</p>
              <p className="mt-0.5 text-[9.5px] text-mist-500">{awayTeam.nickname} · OVR {context.awayRating.toFixed(1)}</p>
              <div className="mt-1 hidden flex-wrap justify-end gap-1 sm:flex">
                {goals.filter((event) => event.teamId === awayTeam.id).map((event) => (
                  <span key={event.id} className="text-[8.5px] text-mist-400">{event.playerName} {event.minute}'</span>
                ))}
              </div>
            </div>
            <TeamCrest team={awayTeam} size={54} glow className="order-1 sm:order-2" />
          </div>
        </div>

        {phase === 'live' && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2.5 border-t border-white/[0.06] pt-4">
            <div className="flex items-center gap-2">
              <Button variant={playing ? 'secondary' : 'primary'} size="sm" icon={playing ? Pause : Play} onClick={onTogglePlay} disabled={finished}>
                {playing ? 'Pause' : 'Resume'}
              </Button>
              <div className="flex items-center rounded-lg border border-white/[0.07] bg-ink-950/50 p-0.5">
                {[1, 2, 4].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSpeed(option)}
                    className={cn('rounded-md px-2 py-1 text-[9.5px] font-bold transition', speed === option ? 'bg-white/[0.09] text-lime-300' : 'text-mist-500 hover:text-mist-300')}
                  >
                    {option}×
                  </button>
                ))}
              </div>
            </div>
            <Button variant="ghost" size="sm" icon={FastForward} onClick={onSkip} disabled={finished}>Skip to full time</Button>
          </div>
        )}
      </div>
    </Card>
  )
}

export default function MatchDay() {
  const { state, dispatch, standings } = useGame()
  const { push } = useToast()
  const navigate = useNavigate()

  const nextFixture = state.fixtures.find(
    (item) => item.round === state.matchday && !item.played && (item.homeId === 'ashcombe' || item.awayId === 'ashcombe'),
  )
  const prediction = predictFromState(state, state.matchPlan)
  const homeTeam = nextFixture ? getTeam(nextFixture.homeId) : null
  const awayTeam = nextFixture ? getTeam(nextFixture.awayId) : null

  const [phase, setPhase] = useState('preview')
  const [active, setActive] = useState(null)
  const [match, setMatch] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [halftime, setHalftime] = useState(false)
  const [halftimeDone, setHalftimeDone] = useState(false)
  const [teamTalk, setTeamTalk] = useState(null)
  const [resultSummary, setResultSummary] = useState(null)
  const dispatched = useRef(false)

  const activeCtx = active?.ctx

  useEffect(() => {
    if (phase !== 'live' || !playing || !activeCtx) return undefined
    const delay = speed === 4 ? 90 : speed === 2 ? 180 : 320
    const timer = window.setInterval(() => {
      setMatch((current) => {
        if (!current || current.finished) return current
        return simulateMinute(current, activeCtx, state.matchPlan, teamTalk)
      })
    }, delay)
    return () => window.clearInterval(timer)
  }, [phase, playing, speed, activeCtx, state.matchPlan, teamTalk])

  useEffect(() => {
    if (phase === 'live' && match?.minute === 45 && !halftimeDone && !match.finished) {
      setPlaying(false)
      setHalftime(true)
    }
  }, [match?.minute, phase, halftimeDone, match?.finished])

  useEffect(() => {
    if (phase !== 'live' || !match?.finished || !activeCtx || dispatched.current) return
    dispatched.current = true
    setPlaying(false)
    const ratings = playerMatchRatings(match, activeCtx)
    const result = buildResult(match, activeCtx, ratings)
    setResultSummary(result)
    setPhase('result')
    const won = result.goalsFor > result.goalsAgainst
    const drew = result.goalsFor === result.goalsAgainst
    dispatch({ type: 'COMPLETE_MATCH', result })
    const scoreline = result.home
      ? `Ashcombe ${result.goalsFor}–${result.goalsAgainst} ${result.opponentName}`
      : `${result.opponentName} ${result.goalsAgainst}–${result.goalsFor} Ashcombe`
    push(
      `Full time: ${scoreline}. ${won ? 'Victory!' : drew ? 'A point apiece.' : 'Tough result.'}`,
      won ? 'success' : drew ? 'info' : 'error',
    )
  }, [phase, match, activeCtx, dispatch, push])

  const startMatch = () => {
    if (!nextFixture) return
    const ctx = buildMatchContext(state, nextFixture)
    const fresh = createMatchState(ctx)
    setActive({ ctx, fixture: nextFixture })
    setMatch(fresh)
    setPhase('live')
    setPlaying(true)
    setSpeed(1)
    setHalftime(false)
    setHalftimeDone(false)
    setTeamTalk(null)
    setResultSummary(null)
    dispatched.current = false
  }

  const skip = () => {
    if (!match || !activeCtx) return
    setMatch(skipToFullTime(match, activeCtx, state.matchPlan, teamTalk))
    setPlaying(false)
    setHalftime(false)
    setHalftimeDone(true)
  }

  const chooseTalk = (option) => {
    setTeamTalk(option.label)
    setHalftime(false)
    setHalftimeDone(true)
    setPlaying(true)
    push(`Message sent: ${option.label}.`, 'info')
  }

  const changePlan = (plan) => {
    dispatch({ type: 'SET_PLAN', plan })
    push(`Approach set to ${plan.toLowerCase()}.`, 'info')
  }

  if (!nextFixture && phase === 'preview') {
    return (
      <div className="space-y-5">
        <SectionTitle eyebrow={`Season ${state.season}`} title="Match Day" />
        <Card>
          <EmptyState
            icon={Trophy}
            title="Season complete"
            description="Every fixture has been played. Start a new career to take the Green through another campaign."
            action={<Button variant="primary" onClick={() => navigate('/')}>Back to dashboard</Button>}
          />
        </Card>
      </div>
    )
  }

  if (phase === 'preview' && nextFixture) {
    const homeRow = getTableRow(state, nextFixture.homeId)
    const awayRow = getTableRow(state, nextFixture.awayId)
    const userIsHome = nextFixture.homeId === 'ashcombe'
    const opponentId = userIsHome ? nextFixture.awayId : nextFixture.homeId
    const opponent = getTeam(opponentId)
    const opponentRow = getTableRow(state, opponentId)
    const keyPlayers = getOpponentKeyPlayers(opponent)
    const starters = playersForLineup(state)
    const userForm = (userIsHome ? homeRow : awayRow)?.form || []
    const oppForm = opponentRow?.form || []
    const userKeyPlayers = [...starters].filter((player) => player.pos !== 'GK').sort((a, b) => b.form - a.form).slice(0, 3)

    return (
      <div className="space-y-5">
        <SectionTitle
          eyebrow={`Matchday ${state.matchday} of 38 · ${state.season}`}
          title="Match Day"
          description="The team sheet is in. Set your approach, read the opposition and take charge from the touchline."
          action={
            <div className="flex items-center gap-2">
              <Badge variant="lime" dot>Team ready</Badge>
              <Badge variant="slate">{formatDateLong(nextFixture.date)}</Badge>
            </div>
          }
        />

        <Card className="relative overflow-hidden border-white/[0.09]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-30%,rgba(198,245,109,0.16),transparent_56%),radial-gradient(ellipse_at_0%_110%,rgba(16,90,62,0.4),transparent_50%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:repeating-linear-gradient(90deg,#fff_0_1px,transparent_1px_58px)]" />
          <div className="relative p-5 sm:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="lime">League · Matchday {state.matchday}</Badge>
                <span className="text-[10px] font-semibold text-mist-500">{formatDate(nextFixture.date)} · {formatTime(nextFixture.date)}</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] text-mist-500"><MapPin size={12} /> {getTeam(nextFixture.homeId).stadium} · {state.stadiumCapacity.toLocaleString('en-GB')}</span>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-6">
              <div className="flex flex-col items-center text-center sm:items-end sm:text-right">
                <TeamCrest team={homeTeam} size={86} glow />
                <p className="mt-3 font-display text-[16px] font-semibold text-mist-50 sm:text-[19px]">{homeTeam.name}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-mist-500">{homeRow?.position ? `${homeRow.position}${homeRow.position === 1 ? 'st' : homeRow.position === 2 ? 'nd' : homeRow.position === 3 ? 'rd' : 'th'}` : '—'}</span>
                  <span className="text-mist-700">·</span>
                  <span className="font-display text-[13px] font-bold text-lime-300">{prediction.homeRating.toFixed(1)}</span>
                  <span className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-mist-600">OVR</span>
                </div>
                <FormPips form={homeRow?.form || []} size="sm" className="mt-2.5" />
              </div>

              <div className="flex flex-col items-center px-1">
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-mist-500">{formatDate(nextFixture.date)}</span>
                <span className="mt-1 font-display text-[32px] font-semibold leading-none tracking-[-0.05em] text-mist-100 sm:text-[40px]">{formatTime(nextFixture.date)}</span>
                <span className="mt-2 grid h-10 w-10 place-items-center rounded-full border border-white/[0.1] bg-ink-950/50 font-display text-[11px] font-bold text-mist-500">VS</span>
                <span className="mt-2 inline-flex items-center gap-1 text-[9px] text-mist-500"><CloudSun size={11} /> 11°C · Light rain</span>
              </div>

              <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                <TeamCrest team={awayTeam} size={86} glow />
                <p className="mt-3 font-display text-[16px] font-semibold text-mist-50 sm:text-[19px]">{awayTeam.name}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-mist-500">{awayRow?.position ? `${awayRow.position}${awayRow.position === 1 ? 'st' : awayRow.position === 2 ? 'nd' : awayRow.position === 3 ? 'rd' : 'th'}` : '—'}</span>
                  <span className="text-mist-700">·</span>
                  <span className="font-display text-[13px] font-bold text-mist-200">{prediction.awayRating.toFixed(1)}</span>
                  <span className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-mist-600">OVR</span>
                </div>
                <FormPips form={awayRow?.form || []} size="sm" className="mt-2.5" />
              </div>
            </div>

            <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-white/[0.07] bg-ink-950/45 p-4">
              <ProbabilityBar
                home={prediction.home}
                draw={prediction.draw}
                away={prediction.away}
                homeLabel={homeTeam.code}
                awayLabel={awayTeam.code}
              />
              <div className="mt-3 flex items-center justify-between">
                <p className="text-[9.5px] text-mist-500">{userIsHome ? 'Ashcombe are at home' : 'A tough away assignment'} · {opponent.nickname}</p>
                <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-mist-600">Win probability</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-12">
          <Card className="xl:col-span-7">
            <div className="flex items-center justify-between border-b border-white/[0.055] px-5 py-4 sm:px-6">
              <div>
                <p className="eyebrow">Pre-match briefing</p>
                <h2 className="mt-1 font-display text-[17px] font-semibold text-mist-50">Team news & form</h2>
              </div>
              <Badge variant="slate"><Users size={10} /> 48,600 expected</Badge>
            </div>
            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <TeamCrest team={getTeam('ashcombe')} size={24} />
                  <span className="text-[11px] font-bold text-mist-100">Ashcombe United</span>
                  <Badge variant="lime" className="ml-auto">You</Badge>
                </div>
                <div className="space-y-2.5">
                  {userKeyPlayers.map((player) => (
                    <div key={player.id} className="flex items-center gap-2.5">
                      <PlayerAvatar player={player} size={26} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10.5px] font-semibold text-mist-200">{player.name}</p>
                        <p className="text-[8.5px] text-mist-500">{player.pos} · form {Number(player.form).toFixed(1)}</p>
                      </div>
                      <span className="text-[9px] font-semibold text-lime-300">Key</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-lg border border-white/[0.055] bg-white/[0.02] p-3">
                  <p className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-mist-600">Recent form</p>
                  <FormPips form={userForm} size="sm" className="mt-2" />
                  <p className="mt-2 text-[9.5px] leading-relaxed text-mist-500">
                    {userForm.filter((item) => item === 'W').length} wins in the last {userForm.length}. {userIsHome ? 'Fenwick Park has been a fortress.' : 'The away end will be sold out.'}
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2">
                  <TeamCrest team={opponent} size={24} />
                  <span className="text-[11px] font-bold text-mist-100">{opponent.name}</span>
                  <Badge variant={opponentRow?.position <= 6 ? 'amber' : 'slate'} className="ml-auto">{opponentRow?.position ?? '—'}th</Badge>
                </div>
                <div className="space-y-2.5">
                  {keyPlayers.map((player) => (
                    <div key={player.id} className="flex items-center gap-2.5">
                      <span className="grid h-6.5 w-6.5 place-items-center rounded-full border border-white/[0.08] bg-white/[0.04] text-[8.5px] font-bold text-mist-300">{player.rating}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10.5px] font-semibold text-mist-200">{player.name}</p>
                        <p className="text-[8.5px] text-mist-500">{player.pos} · danger man</p>
                      </div>
                      <PositionBadge pos={player.pos} className="text-[8px]" />
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-lg border border-white/[0.055] bg-white/[0.02] p-3">
                  <p className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-mist-600">Opposition form</p>
                  <FormPips form={oppForm} size="sm" className="mt-2" />
                  <p className="mt-2 text-[9.5px] leading-relaxed text-mist-500">
                    {opponent.short} are {opponentRow?.position ? `${opponentRow.position}th` : 'mid-table'} with {opponentRow?.points ?? 0} points. {opponent.overall > 76 ? 'They will pose a serious threat.' : 'Ashcombe start as clear favourites.'}
                  </p>
                </div>
              </div>
            </div>
            <Divider />
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-[9.5px] text-mist-500 sm:px-6">
              <span className="inline-flex items-center gap-1.5"><CalendarDays size={12} /> Last meeting: Ashcombe 2–1 {opponent.short} · Mar 2026</span>
              <span className="inline-flex items-center gap-1.5"><CloudSun size={12} /> Wet surface, slick passing conditions</span>
            </div>
          </Card>

          <div className="space-y-5 xl:col-span-5">
            <Card>
              <div className="border-b border-white/[0.055] px-5 py-4">
                <p className="eyebrow">Your call</p>
                <h2 className="mt-1 font-display text-[17px] font-semibold text-mist-50">Match plan</h2>
              </div>
              <div className="space-y-2 p-4">
                {PLANS.map((plan) => {
                  const Icon = plan.icon
                  const selected = state.matchPlan === plan.name
                  return (
                    <button
                      key={plan.name}
                      type="button"
                      onClick={() => changePlan(plan.name)}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-xl border p-3 text-left transition',
                        selected
                          ? 'border-lime-400/30 bg-lime-400/[0.075] shadow-[inset_0_0_0_1px_rgba(198,245,109,0.08)]'
                          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.035]',
                      )}
                    >
                      <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg border', selected ? 'border-lime-400/25 bg-lime-400/10 text-lime-300' : 'border-white/[0.06] bg-white/[0.03] text-mist-400')}>
                        <Icon size={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className={cn('text-[11.5px] font-bold', selected ? 'text-lime-100' : 'text-mist-200')}>{plan.name}</p>
                          <span className="ml-auto text-[8.5px] font-semibold uppercase tracking-[0.08em] text-mist-600">{plan.note}</span>
                        </div>
                        <p className="mt-0.5 text-[9.5px] leading-relaxed text-mist-500">{plan.description}</p>
                      </div>
                      {selected && <Check size={13} className="mt-0.5 shrink-0 text-lime-300" />}
                    </button>
                  )
                })}
              </div>
              <div className="px-4 pb-4">
                <div className="mb-3 flex items-center justify-between rounded-lg border border-white/[0.055] bg-white/[0.02] px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-[8px] font-bold text-mist-300">{starRatingLabel(state)}</span>
                    <div>
                      <p className="text-[9.5px] font-semibold text-mist-200">Starting XI confirmed</p>
                      <p className="text-[8.5px] text-mist-500">{FORMATIONS[state.formation]?.label} · {state.tactics.mentality}</p>
                    </div>
                  </div>
                  <Ring value={state.tactics.familiarity} size={34} stroke={3}>
                    <span className="text-[7px] font-bold text-mist-300">{state.tactics.familiarity}%</span>
                  </Ring>
                </div>
                <Button variant="primary" size="lg" icon={Swords} onClick={startMatch} className="w-full">
                  Kick off
                </Button>
                <p className="mt-2 text-center text-[9px] text-mist-600">You can adjust instructions from the touchline during the match.</p>
              </div>
            </Card>

            <Card className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg border border-white/[0.06] bg-white/[0.035] text-mist-400"><Volume2 size={13} /></span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-mist-500">Matchday info</p>
                  <p className="text-[9.5px] text-mist-600">Fenwick Park · League</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['Referee', 'M. Ellery'],
                  ['Attendance', '48,600'],
                  ['Weather', '11°C, rain'],
                  ['Pitch', 'Good'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-2">
                    <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-mist-600">{label}</p>
                    <p className="mt-0.5 text-[10px] font-semibold text-mist-300">{value}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'live' && match && activeCtx) {
    const { homeTeam: liveHome, awayTeam: liveAway } = activeCtx
    const events = [...match.events].reverse()
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Live · Matchday {active.fixture.round}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-[-0.03em] text-mist-50">Touchline</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={match.finished ? 'slate' : 'lime'} dot>{match.finished ? 'Full time' : halftime ? 'Half time' : `${match.minute}'`}</Badge>
            <Button variant="ghost" size="sm" onClick={() => navigate('/squad')} icon={Users}>Team</Button>
          </div>
        </div>

        <MatchScoreboard
          match={match}
          context={activeCtx}
          playing={playing}
          onTogglePlay={() => setPlaying((current) => !current)}
          speed={speed}
          setSpeed={setSpeed}
          onSkip={skip}
          phase={phase}
        />

        {halftime && !match.finished && (
          <Card className="border-lime-400/20 bg-gradient-to-r from-lime-400/[0.06] to-transparent p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="eyebrow">Half-time team talk</p>
                <h3 className="mt-1 font-display text-[16px] font-semibold text-mist-50">What's the message, boss?</h3>
              </div>
              <Badge variant="lime">{match.homeGoals}–{match.awayGoals}</Badge>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {TALKS.map((talk) => {
                const Icon = talk.icon
                return (
                  <button
                    key={talk.label}
                    type="button"
                    onClick={() => chooseTalk(talk)}
                    className="flex items-start gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-left transition hover:border-lime-400/25 hover:bg-lime-400/[0.05]"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.04] text-lime-300"><Icon size={13} /></span>
                    <div>
                      <p className="text-[10.5px] font-bold text-mist-100">{talk.label}</p>
                      <p className="mt-0.5 text-[9px] leading-relaxed text-mist-500">{talk.detail}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>
        )}

        <div className="grid gap-5 xl:grid-cols-12">
          <Card className="xl:col-span-7">
            <div className="flex items-center justify-between border-b border-white/[0.055] px-5 py-3.5">
              <div className="flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full', match.finished ? 'bg-mist-500' : 'animate-pulse-soft bg-lime-400')} />
                <h2 className="font-display text-[14px] font-semibold text-mist-100">Live commentary</h2>
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-mist-600">{match.events.length} moments</span>
            </div>
            <div className="max-h-[500px] space-y-1.5 overflow-y-auto p-3 scrollbar-thin sm:max-h-[560px]">
              {events.map((event) => (
                <EventItem key={event.id} event={event} homeCode={liveHome.id} awayCode={liveAway.id} />
              ))}
            </div>
          </Card>

          <div className="space-y-5 xl:col-span-5">
            <Card>
              <div className="flex items-center justify-between border-b border-white/[0.055] px-5 py-3.5">
                <h2 className="font-display text-[14px] font-semibold text-mist-100">Match stats</h2>
                <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-mist-600">{liveHome.code} · {liveAway.code}</span>
              </div>
              <div className="p-5">
                <StatsPanel match={match} homeTeam={liveHome} awayTeam={liveAway} />
              </div>
            </Card>

            <Card>
              <div className="border-b border-white/[0.055] px-5 py-3.5">
                <p className="eyebrow">Touchline instructions</p>
                <h2 className="mt-1 font-display text-[14px] font-semibold text-mist-100">Change the approach</h2>
              </div>
              <div className="grid grid-cols-3 gap-1.5 p-4">
                {[
                  ['Cautious', Shield, 'Sit deep'],
                  ['Balanced', ShieldCheck, 'Keep shape'],
                  ['Attacking', Swords, 'Push up'],
                ].map(([plan, Icon, label]) => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => changePlan(plan)}
                    disabled={match.finished}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-lg border px-1 py-2.5 text-[9.5px] font-semibold transition disabled:opacity-40',
                      state.matchPlan === plan ? 'border-lime-400/30 bg-lime-400/[0.09] text-lime-200' : 'border-white/[0.06] bg-white/[0.02] text-mist-400 hover:border-white/[0.12]',
                    )}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>
              <div className="px-4 pb-4">
                <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between text-[9px] text-mist-500">
                    <span>Possession</span>
                    <span className="font-semibold text-mist-300">{match.stats.home.possession}% / {match.stats.away.possession}%</span>
                  </div>
                  <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full bg-lime-400" style={{ width: `${match.stats.home.possession}%` }} />
                    <div className="h-full bg-mist-500" style={{ width: `${match.stats.away.possession}%` }} />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'result' && resultSummary && activeCtx) {
    const won = resultSummary.goalsFor > resultSummary.goalsAgainst
    const drew = resultSummary.goalsFor === resultSummary.goalsAgainst
    const { homeTeam: resultHome, awayTeam: resultAway } = activeCtx
    const userPlayers = new Map(state.squad.map((player) => [player.id, player]))
    return (
      <div className="space-y-5">
        <SectionTitle
          eyebrow={`Matchday ${resultSummary.round} · Full time`}
          title={won ? 'A job well done' : drew ? 'A share of the spoils' : 'A day to forget'}
          description={won ? 'Three points secured. The title charge rolls on.' : drew ? 'A point earned, but the performance leaves room for more.' : 'The squad will need to respond quickly on the training ground.'}
          action={<Button variant="secondary" size="sm" onClick={() => navigate('/league')} icon={Trophy}>View table</Button>}
        />

        <Card className="relative overflow-hidden border-white/[0.09]">
          <div className={cn('pointer-events-none absolute inset-0', won ? 'bg-[radial-gradient(ellipse_at_50%_-30%,rgba(198,245,109,0.18),transparent_58%)]' : drew ? 'bg-[radial-gradient(ellipse_at_50%_-30%,rgba(251,191,36,0.11),transparent_58%)]' : 'bg-[radial-gradient(ellipse_at_50%_-30%,rgba(251,113,133,0.1),transparent_58%)]')} />
          <div className="relative p-5 sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge variant={won ? 'lime' : drew ? 'amber' : 'rose'}>{won ? 'Victory' : drew ? 'Draw' : 'Defeat'}</Badge>
                <span className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-mist-600">{formatDate(resultSummary.date)} · {resultSummary.venue}</span>
              </div>
              <RatingBadge value={resultSummary.playerOfMatch?.rating || 7} />
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-6">
              <div className="flex flex-col items-center text-center sm:flex-row sm:justify-end sm:gap-4 sm:text-right">
                <div className="order-2 sm:order-1">
                  <p className="font-display text-[16px] font-semibold text-mist-50 sm:text-[18px]">{resultHome.name}</p>
                  <p className="text-[9.5px] text-mist-500">{resultHome.nickname}</p>
                </div>
                <TeamCrest team={resultHome} size={62} className="order-1 sm:order-2" glow />
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 sm:gap-4">
                  <span className="font-display text-[38px] font-bold leading-none tracking-[-0.05em] text-mist-50 sm:text-[48px]">{resultSummary.homeGoals}</span>
                  <span className="font-display text-[20px] text-mist-600">:</span>
                  <span className="font-display text-[38px] font-bold leading-none tracking-[-0.05em] text-mist-50 sm:text-[48px]">{resultSummary.awayGoals}</span>
                </div>
                <span className="mt-2 inline-block rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.12em] text-mist-400">Full time</span>
              </div>
              <div className="flex flex-col items-center text-center sm:flex-row sm:gap-4 sm:text-left">
                <TeamCrest team={resultAway} size={62} glow />
                <div>
                  <p className="font-display text-[16px] font-semibold text-mist-50 sm:text-[18px]">{resultAway.name}</p>
                  <p className="text-[9.5px] text-mist-500">{resultAway.nickname}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-stretch justify-between gap-3 rounded-xl border border-white/[0.06] bg-ink-950/40 p-3.5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                {resultSummary.playerOfMatch && userPlayers.get(resultSummary.playerOfMatch.id) && (
                  <>
                    <PlayerAvatar player={userPlayers.get(resultSummary.playerOfMatch.id)} size={34} />
                    <div>
                      <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-lime-300/80">Player of the match</p>
                      <p className="text-[11px] font-semibold text-mist-100">{resultSummary.playerOfMatch.name} · {resultSummary.playerOfMatch.rating.toFixed(1)}</p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => navigate('/squad')} icon={Users}>Squad</Button>
                <Button variant="primary" size="sm" onClick={() => navigate('/')} icon={ArrowRight} className="flex-row-reverse">Return to dashboard</Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-12">
          <Card className="xl:col-span-7">
            <div className="border-b border-white/[0.055] px-5 py-3.5">
              <h2 className="font-display text-[14px] font-semibold text-mist-100">Match analysis</h2>
            </div>
            <div className="p-5">
              <StatsPanel match={match} homeTeam={resultHome} awayTeam={resultAway} />
            </div>
          </Card>
          <Card className="xl:col-span-5">
            <div className="border-b border-white/[0.055] px-5 py-3.5">
              <h2 className="font-display text-[14px] font-semibold text-mist-100">Player ratings</h2>
            </div>
            <div className="p-3">
              {(resultSummary.ratings || []).slice(0, 8).map((rating) => {
                const player = userPlayers.get(rating.id)
                if (!player) return null
                return (
                  <div key={rating.id} className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-white/[0.025]">
                    <PlayerAvatar player={player} size={28} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10.5px] font-semibold text-mist-200">{player.name}</p>
                      <p className="text-[8.5px] text-mist-500">{player.pos} {rating.goals > 0 ? `· ${rating.goals} goal${rating.goals > 1 ? 's' : ''}` : ''}</p>
                    </div>
                    <ProgressBar value={rating.rating * 10} height="h-1" tone={rating.rating >= 7.5 ? 'lime' : rating.rating >= 6.5 ? 'sky' : 'rose'} className="w-14" />
                    <RatingBadge value={rating.rating} size="sm" />
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        <Card>
          <div className="flex items-center justify-between border-b border-white/[0.055] px-5 py-3.5">
            <h2 className="font-display text-[14px] font-semibold text-mist-100">Key moments</h2>
            <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-mist-600">{resultSummary.events.filter((event) => event.type === 'goal').length} goals</span>
          </div>
          <div className="grid gap-1.5 p-3 md:grid-cols-2">
            {resultSummary.events.filter((event) => ['goal', 'card', 'half'].includes(event.type)).slice(-8).map((event) => (
              <EventItem key={event.id} event={event} homeCode={resultHome.id} awayCode={resultAway.id} />
            ))}
          </div>
        </Card>
      </div>
    )
  }

  return null
}

function starRatingLabel(state) {
  const rating = state.squad.filter((player) => state.lineup.includes(player.id)).reduce((sum, player) => sum + player.rating, 0) / 11
  return rating.toFixed(1)
}
