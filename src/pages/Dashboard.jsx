import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CircleDollarSign,
  Clock3,
  MapPin,
  Newspaper,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Wallet,
} from 'lucide-react'
import { useGame } from '../context/GameContext'
import { INITIAL_FUNDS, getTeam } from '../data/gameData'
import {
  getNextFixture,
  getSquadValue,
  getTableRow,
  predictFromState,
} from '../lib/engine'
import {
  cn,
  formatDate,
  formatDateLong,
  formatMoney,
  formatTime,
  formatWageBill,
  greeting,
  ordinal,
} from '../lib/format'
import TeamCrest from '../components/TeamCrest'
import PlayerAvatar from '../components/PlayerAvatar'
import {
  Badge,
  Button,
  Card,
  Divider,
  FormPips,
  PositionBadge,
  ProbabilityBar,
  ProgressBar,
  RatingBadge,
  Ring,
  Sparkline,
} from '../components/ui'

function BoardStat({ icon: Icon, label, value, detail, spark, tone = 'lime', badge }) {
  const toneStyles = {
    lime: 'text-lime-300 bg-lime-400/[0.08] border-lime-400/15',
    sky: 'text-sky-300 bg-sky-400/[0.08] border-sky-400/15',
    violet: 'text-violet-300 bg-violet-400/[0.08] border-violet-400/15',
    amber: 'text-amber-300 bg-amber-400/[0.08] border-amber-400/15',
  }
  return (
    <Card className="group overflow-hidden p-4 transition-colors hover:border-white/[0.12]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-mist-500">{label}</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="font-display text-[26px] font-semibold leading-none tracking-[-0.04em] text-mist-50">{value}</span>
            {badge && <span className="mb-0.5">{badge}</span>}
          </div>
        </div>
        <span className={cn('grid h-8 w-8 place-items-center rounded-lg border', toneStyles[tone])}>
          <Icon size={15} strokeWidth={1.9} />
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-2">
        <p className="max-w-[145px] text-[10.5px] leading-relaxed text-mist-500">{detail}</p>
        {spark && <Sparkline data={spark} width={70} height={22} color={tone === 'lime' ? '#c6f56d' : tone === 'sky' ? '#7dd3fc' : tone === 'violet' ? '#c4b5fd' : '#fcd34d'} />}
      </div>
    </Card>
  )
}

function ResultRow({ result }) {
  const opponent = getTeam(result.opponent)
  const won = result.goalsFor > result.goalsAgainst
  const drew = result.goalsFor === result.goalsAgainst
  return (
    <div className="flex items-center gap-2.5 rounded-lg px-1 py-2 transition hover:bg-white/[0.025]">
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', won ? 'bg-lime-400' : drew ? 'bg-amber-300' : 'bg-rose-400')} />
      <TeamCrest team={opponent} size={22} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11.5px] font-semibold text-mist-200">
          <span className="text-mist-500">{result.home ? 'vs' : 'at'}</span> {opponent.short}
        </p>
        <p className="text-[9px] text-mist-600">{formatDate(result.date)} · League</p>
      </div>
      <span className="font-display text-[12px] font-bold tabular-nums text-mist-100">
        {result.goalsFor}<span className="mx-0.5 text-mist-600">–</span>{result.goalsAgainst}
      </span>
      <span
        className={cn(
          'grid h-5 w-5 place-items-center rounded-md text-[9px] font-bold',
          won ? 'bg-lime-400 text-[#08130e]' : drew ? 'bg-amber-300/15 text-amber-200' : 'bg-rose-400/15 text-rose-300',
        )}
      >
        {won ? 'W' : drew ? 'D' : 'L'}
      </span>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { state, standings, position, rating, wageBill, dispatch } = useGame()

  const fixture = getNextFixture(state)
  const prediction = predictFromState(state)
  const ashcombe = getTeam('ashcombe')
  const row = getTableRow(state, 'ashcombe')
  const squadValue = getSquadValue(state)
  const form = row?.form || state.recentResults.map((result) => (result.goalsFor > result.goalsAgainst ? 'W' : result.goalsFor === result.goalsAgainst ? 'D' : 'L'))
  const topPerformers = [...state.squad].sort((a, b) => b.form - a.form).slice(0, 4)
  const boardTarget = 2_550_000
  const confidence = state.boardConfidence

  const opponentRow = fixture
    ? standings.find((item) => item.teamId === (fixture.homeId === 'ashcombe' ? fixture.awayId : fixture.homeId))
    : null
  const opponent = fixture
    ? getTeam(fixture.homeId === 'ashcombe' ? fixture.awayId : fixture.homeId)
    : null

  const recent = state.recentResults.slice(0, 4)
  const miniTable = standings.slice(0, 6)

  const [homeForm, awayForm] = useMemo(() => {
    if (!fixture) return [[], []]
    const home = standings.find((item) => item.teamId === fixture.homeId)
    const away = standings.find((item) => item.teamId === fixture.awayId)
    return [home?.form || [], away?.form || []]
  }, [fixture, standings])

  if (!fixture) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center">
        <Trophy size={40} className="mx-auto text-lime-300" />
        <h1 className="mt-5 font-display text-3xl font-semibold text-mist-50">Season complete</h1>
        <p className="mt-2 text-sm text-mist-400">The final whistle has gone on the 2026/27 campaign. A new challenge awaits.</p>
        <Button className="mt-6" variant="primary" onClick={() => dispatch({ type: 'RESET_GAME' })}>Start a new career</Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-12">
        <Card className="relative overflow-hidden border-white/[0.085] xl:col-span-7">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_82%_-10%,rgba(198,245,109,0.19),transparent_46%),radial-gradient(ellipse_at_-10%_120%,rgba(16,90,62,0.55),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:42px_42px]" />
          <div className="pointer-events-none absolute -right-8 -top-14 select-none font-display text-[220px] font-bold leading-none tracking-[-0.1em] text-white/[0.018]">26</div>
          <div className="relative p-5 sm:p-6 lg:p-7">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Badge variant="lime" dot>Matchday {state.matchday} · {state.season}</Badge>
              <Badge variant="dark">{formatDateLong(fixture.date)}</Badge>
            </div>
            <h1 className="font-display text-[32px] font-semibold leading-[1.08] tracking-[-0.045em] text-mist-50 sm:text-[42px]">
              {greeting()}, Alex<span className="text-lime-300">.</span>
            </h1>
            <p className="mt-3 max-w-lg text-[13px] leading-relaxed text-mist-300/90">
              Ashcombe are <span className="font-semibold text-lime-200">top of the table</span> and the board believes this squad
              can go all the way. Next up: a {fixture.homeId === 'ashcombe' ? 'home' : 'tricky away'} test against {opponent?.short}.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Button variant="primary" size="md" icon={Swords} onClick={() => navigate('/matchday')}>
                Enter match day
              </Button>
              <Button variant="secondary" size="md" icon={Users} onClick={() => navigate('/squad')}>
                Team tactics
              </Button>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-4 border-t border-white/[0.07] pt-5">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-mist-500">League position</p>
                <p className="mt-1 font-display text-xl font-semibold text-mist-50">{ordinal(position)} <span className="ml-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-lime-300">▲ top</span></p>
              </div>
              <div className="h-8 w-px bg-white/[0.07]" />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-mist-500">Points</p>
                <p className="mt-1 font-display text-xl font-semibold text-mist-50">{row?.points ?? 0} <span className="text-[10px] font-semibold text-mist-500">from {row?.played ?? 0}</span></p>
              </div>
              <div className="h-8 w-px bg-white/[0.07]" />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-mist-500">Last 5</p>
                <FormPips form={form.slice(-5)} size="sm" className="mt-1.5" />
              </div>
              <div className="ml-auto hidden items-center gap-2 sm:flex">
                <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-mist-600">Board</span>
                <div className="flex items-center gap-1.5 rounded-full border border-lime-400/20 bg-lime-400/[0.08] px-2 py-1 text-[10px] font-bold text-lime-300">
                  <ShieldCheck size={12} /> {confidence}%
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden xl:col-span-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(198,245,109,0.1),transparent_55%)]" />
          <div className="relative p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Club overview</p>
                <h2 className="mt-1 font-display text-[21px] font-semibold tracking-[-0.03em] text-mist-50">{ashcombe.name}</h2>
                <p className="mt-1 text-[11px] text-mist-500">Founded {ashcombe.founded} · {ashcombe.stadium}</p>
              </div>
              <Badge variant="lime">Title charge</Badge>
            </div>

            <div className="mt-5 flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.045] to-transparent p-4">
              <TeamCrest team={ashcombe} size={66} glow />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-2xl font-bold leading-none tracking-[-0.04em] text-lime-300">77.5</span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.13em] text-mist-500">team OVR</span>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-mist-400">
                  A balanced, high-floor squad with <span className="text-mist-200">Mendes</span> as the creative heartbeat.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <PositionBadge pos="AM" />
                  <span className="text-[10px] text-mist-500">Rafael Mendes · 8.4 form</span>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 divide-x divide-white/[0.06] rounded-xl border border-white/[0.06] bg-white/[0.02] py-3">
              {[
                ['Squad value', formatMoney(squadValue)],
                ['Wage bill', formatWageBill(wageBill)],
                ['Stadium', state.stadiumCapacity.toLocaleString('en-GB')],
              ].map(([label, value]) => (
                <div key={label} className="px-3 text-center">
                  <p className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-mist-600">{label}</p>
                  <p className="mt-1 truncate font-display text-[13px] font-semibold text-mist-200">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
              <span className="inline-flex items-center gap-2 text-[10.5px] text-mist-400"><Trophy size={13} className="text-amber-300" /> Board objective</span>
              <span className="text-[10.5px] font-semibold text-mist-200">Win the title</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <BoardStat
          icon={Wallet}
          label="Available funds"
          value={formatMoney(state.funds)}
          detail="Transfer budget"
          spark={[23, 25, 24, 27, 29, 31, 32]}
          tone="lime"
          badge={state.funds === INITIAL_FUNDS
            ? <span className="mb-0.5 text-[9px] font-bold text-mist-500">Full budget</span>
            : <span className={cn('mb-0.5 text-[9px] font-bold', state.funds > INITIAL_FUNDS ? 'text-lime-300' : 'text-rose-300')}>{state.funds > INITIAL_FUNDS ? '+' : '−'}{formatMoney(Math.abs(state.funds - INITIAL_FUNDS))}</span>}
        />
        <BoardStat
          icon={CircleDollarSign}
          label="Wage bill"
          value={formatWageBill(wageBill)}
          detail={`${Math.round((wageBill / boardTarget) * 100)}% of board budget`}
          spark={[17, 18, 19, 18, 20, 19, 18]}
          tone="sky"
        />
        <BoardStat
          icon={Trophy}
          label="League position"
          value={ordinal(position)}
          detail={`${row?.points ?? 0} pts · GD ${row?.gd >= 0 ? '+' : ''}${row?.gd ?? 0}`}
          spark={[3, 3, 2, 2, 1, 1, 1]}
          tone="violet"
        />
        <BoardStat
          icon={ShieldCheck}
          label="Team overall"
          value={Number(rating).toFixed(1)}
          detail="Starting XI average"
          spark={[74, 75, 75, 76, 76, 77, 77.5]}
          tone="amber"
          badge={<span className="mb-0.5 text-[9px] font-bold text-amber-300">+0.8</span>}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <Card className="overflow-hidden xl:col-span-7">
          <div className="relative border-b border-white/[0.06] px-5 py-4 sm:px-6">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(198,245,109,0.08),transparent_50%)]" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="eyebrow">Next fixture · Matchday {state.matchday}</p>
                <h2 className="mt-1 font-display text-lg font-semibold tracking-[-0.02em] text-mist-50">Match preview</h2>
              </div>
              <Badge variant={fixture.homeId === 'ashcombe' ? 'lime' : 'slate'}>{fixture.homeId === 'ashcombe' ? 'Home' : 'Away'}</Badge>
            </div>
          </div>
          <div className="relative p-5 sm:p-6">
            <div className="pointer-events-none absolute inset-0 opacity-[0.022] [background-image:repeating-linear-gradient(90deg,#fff_0_1px,transparent_1px_64px)]" />
            <div className="relative grid grid-cols-[1fr_auto_1fr] items-start gap-2 sm:gap-4">
              <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                <TeamCrest team={getTeam(fixture.homeId)} size={64} glow />
                <p className="mt-3 max-w-[150px] truncate font-display text-[14px] font-semibold text-mist-50">{getTeam(fixture.homeId).name}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="font-display text-[13px] font-bold text-lime-300">{prediction ? prediction.homeRating.toFixed(1) : getTeam(fixture.homeId).overall}</span>
                  <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-mist-600">OVR</span>
                </div>
                <FormPips form={homeForm} size="sm" className="mt-2.5" />
              </div>

              <div className="flex flex-col items-center px-1 pt-2 sm:px-4">
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-mist-600">{formatDate(fixture.date)}</span>
                <span className="my-1.5 font-display text-[25px] font-semibold tracking-[-0.04em] text-mist-200">{formatTime(fixture.date)}</span>
                <span className="grid h-8 w-8 place-items-center rounded-full border border-white/[0.08] bg-white/[0.03] text-[10px] font-bold text-mist-500">VS</span>
                <span className="mt-2 inline-flex items-center gap-1 text-[9px] text-mist-500"><MapPin size={9} /> {getTeam(fixture.homeId).stadium}</span>
              </div>

              <div className="flex flex-col items-center text-center sm:items-end sm:text-right">
                <TeamCrest team={getTeam(fixture.awayId)} size={64} glow />
                <p className="mt-3 max-w-[150px] truncate font-display text-[14px] font-semibold text-mist-50">{getTeam(fixture.awayId).name}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="font-display text-[13px] font-bold text-mist-200">{prediction ? prediction.awayRating.toFixed(1) : getTeam(fixture.awayId).overall}</span>
                  <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-mist-600">OVR</span>
                </div>
                <FormPips form={awayForm} size="sm" className="mt-2.5" />
              </div>
            </div>

            <div className="relative mt-6 rounded-xl border border-white/[0.06] bg-ink-950/45 p-4">
              {prediction && (
                <ProbabilityBar
                  home={prediction.home}
                  draw={prediction.draw}
                  away={prediction.away}
                  homeLabel={getTeam(fixture.homeId).code}
                  awayLabel={getTeam(fixture.awayId).code}
                />
              )}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-[10px] text-mist-500">
                  <span className="inline-flex items-center gap-1.5"><Users size={12} /> 48,600 expected</span>
                  <span className="inline-flex items-center gap-1.5"><Clock3 size={12} /> 15:00 kick-off</span>
                </div>
                <Button variant="primary" size="sm" icon={Swords} onClick={() => navigate('/matchday')}>Enter match day</Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-5">
          <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6">
            <div>
              <p className="eyebrow">Boardroom</p>
              <h2 className="mt-1 font-display text-[17px] font-semibold text-mist-50">Confidence & form</h2>
            </div>
            <Badge variant="lime" dot>Very secure</Badge>
          </div>
          <div className="grid gap-5 p-5 sm:grid-cols-[auto_1fr] sm:p-6">
            <div className="flex items-center gap-4 sm:block">
              <Ring value={confidence} size={76} stroke={6}>
                <div className="text-center">
                  <p className="font-display text-xl font-bold text-mist-50">{confidence}%</p>
                  <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-mist-600">Board</p>
                </div>
              </Ring>
              <div className="sm:mt-2 sm:text-center">
                <p className="text-[10.5px] text-mist-400">Confidence</p>
                <p className="text-[9px] text-lime-300">+4 this month</p>
              </div>
            </div>
            <div className="min-w-0 space-y-1">
              {recent.map((result) => (
                <ResultRow key={result.id || `${result.opponent}-${result.date}`} result={result} />
              ))}
            </div>
          </div>
          <Divider />
          <div className="space-y-3 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-mist-500">Board objectives</p>
              <button type="button" onClick={() => navigate('/league')} className="text-[10px] font-semibold text-lime-300 hover:text-lime-200">View table</button>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[10.5px]">
                <span className="text-mist-300">Win the league title</span>
                <span className="font-semibold text-lime-300">On track</span>
              </div>
              <ProgressBar value={78} height="h-1" />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[10.5px]">
                <span className="text-mist-300">Reach the cup semi-final</span>
                <span className="font-semibold text-mist-400">54%</span>
              </div>
              <ProgressBar value={54} height="h-1" tone="sky" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <Card className="xl:col-span-7">
          <div className="flex items-center justify-between px-5 pt-5 sm:px-6">
            <div>
              <p className="eyebrow">Competition</p>
              <h2 className="mt-1 font-display text-[17px] font-semibold text-mist-50">League snapshot</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/league')} icon={ArrowRight} className="flex-row-reverse">Full table</Button>
          </div>
          <div className="px-2 pb-3 pt-4 sm:px-4">
            <div className="grid grid-cols-[26px_1fr_28px_32px_38px_88px] gap-2 px-2 text-[8.5px] font-bold uppercase tracking-[0.12em] text-mist-600">
              <span>#</span>
              <span>Club</span>
              <span className="text-center">P</span>
              <span className="text-center">GD</span>
              <span className="text-center">Pts</span>
              <span className="text-right">Form</span>
            </div>
            <div className="mt-1">
              {miniTable.map((item) => {
                const team = getTeam(item.teamId)
                const isUser = item.teamId === 'ashcombe'
                return (
                  <div
                    key={item.teamId}
                    className={cn(
                      'grid grid-cols-[26px_1fr_28px_32px_38px_88px] items-center gap-2 rounded-lg px-2 py-2 text-[11px] transition hover:bg-white/[0.025]',
                      isUser && 'bg-lime-400/[0.055]',
                    )}
                  >
                    <span className={cn('font-display text-[11px] font-bold', item.position <= 4 ? 'text-lime-300' : 'text-mist-500')}>{item.position}</span>
                    <div className="flex min-w-0 items-center gap-2">
                      <TeamCrest team={team} size={20} />
                      <span className={cn('truncate font-semibold', isUser ? 'text-lime-100' : 'text-mist-200')}>{team.short}</span>
                      {isUser && <Badge variant="lime" className="hidden px-1.5 py-0 text-[8px] sm:inline-flex">You</Badge>}
                    </div>
                    <span className="text-center tabular-nums text-mist-500">{item.played}</span>
                    <span className={cn('text-center tabular-nums', item.gd > 0 ? 'text-lime-300/80' : 'text-mist-400')}>{item.gd > 0 ? '+' : ''}{item.gd}</span>
                    <span className="text-center font-display text-[12px] font-bold tabular-nums text-mist-100">{item.points}</span>
                    <div className="flex justify-end"><FormPips form={item.form} size="sm" /></div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-5">
          <div className="flex items-center justify-between px-5 pt-5 sm:px-6">
            <div>
              <p className="eyebrow">First team</p>
              <h2 className="mt-1 font-display text-[17px] font-semibold text-mist-50">In form</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/squad')} icon={Users}>Squad</Button>
          </div>
          <div className="p-5 sm:p-6">
            <div className="relative overflow-hidden rounded-xl border border-lime-400/[0.15] bg-gradient-to-r from-lime-400/[0.08] via-emerald-500/[0.04] to-transparent p-4">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-lime-400/10 blur-2xl" />
              <div className="relative flex items-center gap-3.5">
                <PlayerAvatar player={topPerformers[0]} size={52} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-display text-[15px] font-semibold text-mist-50">{topPerformers[0].name}</p>
                    <PositionBadge pos={topPerformers[0].pos} />
                  </div>
                  <p className="mt-1 text-[10.5px] text-mist-400">{topPerformers[0].goals} goals · {topPerformers[0].assists} assists this season</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-bold leading-none text-lime-300">{Number(topPerformers[0].form).toFixed(1)}</p>
                  <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-mist-600">Form</p>
                </div>
              </div>
            </div>
            <div className="mt-2">
              {topPerformers.slice(1).map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => navigate('/squad')}
                  className="flex w-full items-center gap-3 rounded-lg px-1 py-2.5 text-left transition hover:bg-white/[0.025]"
                >
                  <PlayerAvatar player={player} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11.5px] font-semibold text-mist-200">{player.name}</p>
                    <p className="text-[9.5px] text-mist-500">{player.pos} · {player.goals}G {player.assists}A</p>
                  </div>
                  <RatingBadge value={player.form} size="sm" />
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/[0.055] bg-white/[0.02] px-3 py-2.5 text-[10px] text-mist-500">
              <Sparkles size={13} className="text-lime-300" />
              Mendes has contributed 16 goals this season.
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between px-5 pt-5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.06] bg-white/[0.035] text-mist-300"><Newspaper size={15} /></span>
            <div>
              <p className="eyebrow">Around the club</p>
              <h2 className="mt-0.5 font-display text-[16px] font-semibold text-mist-50">Latest news</h2>
            </div>
          </div>
          <Badge variant="slate">Live feed</Badge>
        </div>
        <div className="grid gap-0 divide-y divide-white/[0.055] px-5 pb-2 pt-3 sm:px-6 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {state.news.slice(0, 3).map((item, index) => (
            <div key={item.id} className={cn('py-4 lg:py-3', index > 0 && 'lg:pl-5', index < 2 && 'lg:pr-5')}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-[8.5px] font-bold uppercase tracking-[0.14em] text-lime-300/80">{item.tag}</span>
                <span className="text-[9px] text-mist-600">{item.time}</span>
              </div>
              <p className="text-[12px] font-semibold leading-snug text-mist-200">{item.title}</p>
              <p className="mt-1 line-clamp-2 text-[10.5px] leading-relaxed text-mist-500">{item.body}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
