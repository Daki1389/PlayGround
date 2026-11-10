import { motion } from 'framer-motion'
import {
  ArrowLeftRight,
  ArrowRight,
  Building2,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  MapPin,
  Play,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  UsersRound,
  Wallet
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import ClubBadge from '../components/ClubBadge'
import TeamIdentity from '../components/TeamIdentity'
import FormPills from '../components/FormPills'
import { useGame } from '../context/GameContext'
import { initials, isHome, money, ordinal, opponent, resultFor, scoreFor, shortDate } from '../lib/format'

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }
})

function probability(homeRating, awayRating) {
  const home = 1 / (1 + Math.pow(10, (awayRating - homeRating - 3) / 11))
  const draw = 0.24
  const homeWin = home * (1 - draw)
  const awayWin = (1 - home) * (1 - draw)
  return {
    home: Math.round(homeWin * 100),
    draw: Math.round(draw * 100),
    away: Math.round(awayWin * 100)
  }
}

function NextMatchCard() {
  const { data, setView } = useGame()
  const user = data.user
  const next = data.next_match
  const standings = data.standings

  if (!next) {
    return (
      <motion.section {...reveal(0.04)} className="panel flex flex-col justify-between p-6 sm:p-8">
        <div>
          <div className="chip-lime mb-4"><Trophy size={12} /> Season complete</div>
          <h2 className="display-title text-3xl sm:text-4xl">The campaign is in the books.</h2>
          <p className="mt-2 max-w-lg text-sm text-mist">Every fixture has been played. Review the final table and your squad before the next chapter begins.</p>
        </div>
        <div className="mt-6 flex gap-2">
          <button onClick={() => setView('league')} className="btn-primary">View final table <ArrowRight size={15} /></button>
          <button onClick={() => setView('squad')} className="btn-secondary">Review squad</button>
        </div>
      </motion.section>
    )
  }

  const userHome = isHome(next, user.id)
  const homeTeam = next.home_team
  const awayTeam = next.away_team
  const opp = opponent(next, user.id)
  const userRow = standings.find(row => row.team_id === user.id)
  const oppRow = standings.find(row => row.team_id === opp?.id)
  const homeRow = standings.find(row => row.team_id === homeTeam.id)
  const awayRow = standings.find(row => row.team_id === awayTeam.id)
  const homePreview = next.preview?.home
  const awayPreview = next.preview?.away
  const odds = probability(homePreview?.rating || 75, awayPreview?.rating || 75)
  const userColor = user.primary_color

  return (
    <motion.section {...reveal(0.04)} className="panel">
      <div
        className="relative overflow-hidden p-5 sm:p-6"
        style={{
          background: `radial-gradient(ellipse 65% 100% at 12% 0%, ${homeTeam.primary_color}18, transparent 55%), radial-gradient(ellipse 55% 100% at 88% 10%, ${awayTeam.primary_color}13, transparent 52%)`
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(115deg, white 0, white 1px, transparent 1px, transparent 34px)' }} />
        <div className="relative flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="chip-lime"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime" /> Next fixture</span>
            <span className="chip hidden sm:inline-flex">Matchday {next.round}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-mist">
            <CalendarDays size={13} /> {shortDate(next.match_date)}
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:gap-4 sm:text-left">
            <ClubBadge team={homeTeam} size={52} className="shrink-0 drop-shadow-2xl sm:hidden" />
            <ClubBadge team={homeTeam} size={64} className="hidden shrink-0 drop-shadow-2xl sm:block" />
            <div className="mt-2 min-w-0 sm:mt-0">
              <div className="flex items-center justify-center gap-1.5 sm:justify-start">
                <span className="eyebrow text-[9px]">Home</span>
                {homeTeam.id === user.id && <span className="h-1.5 w-1.5 rounded-full" style={{ background: userColor }} />}
              </div>
              <p className="display-title mt-0.5 line-clamp-2 text-xl leading-[0.95] sm:text-[20px]">{homeTeam.name}</p>
              <div className="mt-1.5 flex items-center justify-center gap-2 sm:justify-start">
                <span className="chip px-1.5 py-0.5 text-[9px]">OVR {homePreview?.rating || '—'}</span>
                <span className="hidden sm:block"><FormPills form={homeRow?.form || []} size="xs" /></span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center px-1 sm:px-4">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-ink-950/70 sm:h-16 sm:w-16">
              <span className="display-title text-xl text-white/90 sm:text-2xl">VS</span>
              <span className="absolute inset-0 rounded-full border border-lime/10" />
            </div>
            <span className="mt-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-mist-dim">15:00</span>
            <span className="mt-0.5 text-[9px] text-mist-dim">League</span>
          </div>

          <div className="flex flex-col items-center text-center sm:flex-row-reverse sm:items-center sm:gap-4 sm:text-right">
            <ClubBadge team={awayTeam} size={52} className="shrink-0 drop-shadow-2xl sm:hidden" />
            <ClubBadge team={awayTeam} size={64} className="hidden shrink-0 drop-shadow-2xl sm:block" />
            <div className="mt-2 min-w-0 sm:mt-0">
              <div className="flex items-center justify-center gap-1.5 sm:justify-end">
                {awayTeam.id === user.id && <span className="h-1.5 w-1.5 rounded-full" style={{ background: userColor }} />}
                <span className="eyebrow text-[9px]">Away</span>
              </div>
              <p className="display-title mt-0.5 line-clamp-2 text-xl leading-[0.95] sm:text-[20px]">{awayTeam.name}</p>
              <div className="mt-1.5 flex items-center justify-center gap-2 sm:justify-end">
                <span className="hidden sm:block"><FormPills form={awayRow?.form || []} size="xs" /></span>
                <span className="chip px-1.5 py-0.5 text-[9px]">OVR {awayPreview?.rating || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-5 rounded-xl border border-white/[0.06] bg-ink-950/50 p-3">
          <div className="mb-2 flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.14em] text-mist-dim">
            <span>Win probability</span>
            <span className="text-mist">{odds.home}% / {odds.draw}% / {odds.away}%</span>
          </div>
          <div className="flex h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full" style={{ width: `${odds.home}%`, background: homeTeam.primary_color }} />
            <div className="h-full bg-white/15" style={{ width: `${odds.draw}%` }} />
            <div className="h-full" style={{ width: `${odds.away}%`, background: awayTeam.primary_color }} />
          </div>
        </div>

        <div className="relative mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-mist">
            <span className="inline-flex items-center gap-1.5"><MapPin size={12} /> {next.home_team.stadium_name}</span>
            <span className="inline-flex items-center gap-1.5"><UsersRound size={12} /> {data.user.name} {userHome ? 'at home' : 'on the road'}</span>
            <span className="hidden items-center gap-1.5 sm:inline-flex"><Trophy size={12} /> {userRow ? `${ordinal(userRow.position)} in the league` : 'League debut'}</span>
          </div>
          <button onClick={() => setView('matchday')} className="btn-primary group w-full sm:w-auto">
            <Play size={15} className="fill-ink-950" /> Enter match day
            <ChevronRight size={15} className="transition group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-white/[0.055] px-5 py-2.5 text-[10px] text-mist-dim">
        <span className="inline-flex items-center gap-1.5"><ShieldCheck size={11} className="text-lime" /> {homePreview?.style || 'Balanced'} vs {awayPreview?.style || 'Balanced'}</span>
        <span>Opponent form: <span className="text-mist">{oppRow?.form?.join(' · ') || 'No matches'}</span></span>
        <span className="ml-auto hidden sm:inline">Matchday {next.round} of {data.season.total_rounds}</span>
      </div>
    </motion.section>
  )
}

function ClubPulse() {
  const { data, setView } = useGame()
  const user = data.user
  const summary = user.summary || {}
  const standing = data.standings.find(row => row.team_id === user.id)
  const wageRatio = Math.min(100, ((summary.wage_bill || 0) / (user.wage_budget || 1)) * 100)

  return (
    <motion.section {...reveal(0.1)} className="panel flex flex-col p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Club pulse</p>
          <h2 className="display-title mt-0.5 text-xl">The boardroom</h2>
        </div>
        <button onClick={() => setView('facilities')} className="icon-btn" aria-label="Manage facilities">
          <Building2 size={15} />
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3.5">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-mist-dim">
          <Wallet size={13} className="text-lime" /> Available funds
        </div>
        <p className="num mt-1 text-[34px] font-semibold leading-none text-white">{money(user.budget)}</p>
        <div className="mt-3 flex items-center justify-between text-[10px]">
          <span className="text-mist-dim">Wage bill</span>
          <span className="text-slate-300">{money(summary.wage_bill || 0)}<span className="text-mist-dim"> / {money(user.wage_budget || 0)}</span></span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.07]">
          <div className={`h-full rounded-full ${wageRatio > 88 ? 'bg-amber-400' : 'bg-lime'}`} style={{ width: `${wageRatio}%` }} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {[
          { label: 'League', value: standing ? ordinal(standing.position) : '—', sub: `${standing?.points || 0} pts`, icon: Trophy, color: 'text-lime' },
          { label: 'Squad', value: summary.average_rating || '—', sub: `${summary.size || 0} players`, icon: UsersRound, color: 'text-sky-300' },
          { label: 'Value', value: money(summary.squad_value || 0, { decimals: 0 }), sub: 'Squad market', icon: CircleDollarSign, color: 'text-violet-300' },
          { label: 'Avg age', value: summary.average_age || '—', sub: 'Years', icon: Sparkles, color: 'text-amber-300' }
        ].map(item => (
          <div key={item.label} className="rounded-lg border border-white/[0.05] bg-ink-950/45 p-2.5">
            <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-mist-dim">
              <item.icon size={11} className={item.color} /> {item.label}
            </div>
            <p className="num mt-1 text-xl font-semibold leading-none text-white">{item.value}</p>
            <p className="mt-1 text-[9px] text-mist-dim">{item.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-auto grid grid-cols-3 gap-2 pt-3">
        {[
          { label: 'Stadium', level: user.stadium_level, icon: Building2 },
          { label: 'Training', level: user.training_facility_level, icon: ShieldCheck },
          { label: 'Academy', level: user.youth_academy_level, icon: Sparkles }
        ].map(item => (
          <button key={item.label} onClick={() => setView('facilities')} className="rounded-lg border border-white/[0.05] bg-ink-950/40 p-2 text-left transition hover:border-lime/20">
            <item.icon size={12} className="text-mist" />
            <p className="mt-1.5 text-[9px] text-mist-dim">{item.label}</p>
            <p className="font-display text-sm font-semibold text-white">LVL {item.level}</p>
          </button>
        ))}
      </div>
    </motion.section>
  )
}

function LeagueSnapshot() {
  const { data, setView } = useGame()
  const user = data.user
  const top = data.standings.slice(0, 5)
  const userIndex = data.standings.findIndex(row => row.team_id === user.id)
  const rows = userIndex > 4 ? [...top, data.standings[userIndex]] : top

  return (
    <motion.section {...reveal(0.16)} className="panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="eyebrow">League table</p>
          <h2 className="display-title mt-0.5 text-xl">The chase</h2>
        </div>
        <button onClick={() => setView('league')} className="inline-flex items-center gap-1 text-[11px] font-semibold text-mist transition hover:text-lime">
          Full table <ChevronRight size={13} />
        </button>
      </div>
      <div className="overflow-hidden rounded-lg border border-white/[0.05]">
        <div className="grid grid-cols-[24px_1fr_30px_34px_40px] items-center gap-1 bg-white/[0.025] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-mist-dim sm:grid-cols-[24px_1fr_30px_34px_34px_44px]">
          <span>#</span><span>Club</span><span className="text-center">P</span><span className="text-center">GD</span><span className="hidden text-center sm:block">Form</span><span className="text-right">Pts</span>
        </div>
        {rows.map(row => {
          const isUser = row.team_id === user.id
          const team = data.teams.find(item => item.id === row.team_id) || row
          return (
            <div
              key={row.team_id}
              className={`grid grid-cols-[24px_1fr_30px_34px_40px] items-center gap-1 border-t border-white/[0.045] px-3 py-2 text-[11px] sm:grid-cols-[24px_1fr_30px_34px_34px_44px] ${isUser ? 'bg-lime/[0.055]' : 'hover:bg-white/[0.025]'}`}
            >
              <span className={`num text-xs ${isUser ? 'text-lime' : 'text-mist-dim'}`}>{row.position}</span>
              <div className="flex min-w-0 items-center gap-2">
                <ClubBadge team={team} size={18} />
                <span className={`truncate ${isUser ? 'font-semibold text-white' : 'text-slate-300'}`}>{row.team_name}</span>
                {isUser && <span className="hidden rounded bg-lime/15 px-1 text-[8px] font-bold text-lime sm:inline">YOU</span>}
              </div>
              <span className="num text-center text-mist">{row.played}</span>
              <span className={`num text-center ${row.goal_difference > 0 ? 'text-lime/80' : row.goal_difference < 0 ? 'text-red-300/80' : 'text-mist'}`}>{row.goal_difference > 0 ? '+' : ''}{row.goal_difference}</span>
              <span className="hidden justify-center sm:flex"><FormPills form={row.form.slice(-3)} size="xs" /></span>
              <span className={`num text-right font-semibold ${isUser ? 'text-lime' : 'text-white'}`}>{row.points}</span>
            </div>
          )
        })}
      </div>
      <div className="mt-2.5 flex items-center justify-between text-[9px] text-mist-dim">
        <span>After matchday {Math.max(...data.standings.map(row => row.played)) || 0} of 14</span>
        <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-lime" /> Champions race</span>
      </div>
    </motion.section>
  )
}

function DifferenceMakers() {
  const { data, setView } = useGame()
  const leaders = data.leaders?.length
    ? data.leaders.slice(0, 3)
    : data.squad.slice(0, 3).map(player => ({ ...player, goals: 0, assists: 0, average_rating: player.overall_rating }))
  const topScorer = data.league_top_scorers?.[0]

  return (
    <motion.section {...reveal(0.22)} className="panel flex flex-col p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="eyebrow">Difference makers</p>
          <h2 className="display-title mt-0.5 text-xl">Your matchwinners</h2>
        </div>
        <button onClick={() => setView('squad')} className="inline-flex items-center gap-1 text-[11px] font-semibold text-mist transition hover:text-lime">
          Squad <ChevronRight size={13} />
        </button>
      </div>
      <div className="space-y-1.5">
        {leaders.map((player, index) => (
          <div key={player.id} className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-2 ${index === 0 ? 'border-lime/15 bg-lime/[0.045]' : 'border-white/[0.045] bg-white/[0.018]'}`}>
            <span className="num w-4 text-[10px] text-mist-dim">0{index + 1}</span>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${index === 0 ? 'bg-lime text-ink-950' : 'bg-white/[0.07] text-white'}`}>
              {initials(player.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold text-white">{player.name}</p>
              <p className="text-[9px] text-mist-dim">{player.position} · {player.team_short_name || data.user.short_name}</p>
            </div>
            <div className="flex items-center gap-3 text-right">
              <div>
                <p className="num text-sm font-semibold text-white">{player.goals || 0}<span className="text-[8px] font-sans text-mist-dim"> G</span></p>
              </div>
              <div className="hidden sm:block">
                <p className="num text-sm font-semibold text-white">{player.assists || 0}<span className="text-[8px] font-sans text-mist-dim"> A</span></p>
              </div>
              <span className={`num rounded-md px-1.5 py-0.5 text-[11px] font-bold ${Number(player.average_rating) >= 7.5 ? 'bg-lime/15 text-lime' : 'bg-white/[0.06] text-slate-200'}`}>
                {Number(player.average_rating || player.overall_rating).toFixed(1)}
              </span>
            </div>
          </div>
        ))}
      </div>
      {topScorer && (
        <div className="mt-auto flex items-center gap-2.5 rounded-lg border border-white/[0.05] bg-ink-950/50 p-2.5">
          <Trophy size={14} className="text-amber-300" />
          <div className="min-w-0 flex-1">
            <p className="text-[9px] uppercase tracking-wider text-mist-dim">League golden boot</p>
            <p className="truncate text-[11px] font-semibold text-white">{topScorer.name} <span className="font-normal text-mist">· {topScorer.team_short_name}</span></p>
          </div>
          <span className="num text-lg font-semibold text-amber-300">{topScorer.goals}<span className="text-[9px] font-sans text-mist-dim"> goals</span></span>
        </div>
      )}
    </motion.section>
  )
}

function RecentResults() {
  const { data, setView } = useGame()
  const user = data.user
  const matches = data.recent_matches.slice(0, 4)
  const userRow = data.standings.find(row => row.team_id === user.id)

  return (
    <motion.section {...reveal(0.28)} className="panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="eyebrow">Recent form</p>
          <h2 className="display-title mt-0.5 text-xl">Last time out</h2>
        </div>
        <div className="flex items-center gap-2">
          <FormPills form={userRow?.form || []} size="sm" />
          <button onClick={() => setView('league')} className="icon-btn" aria-label="View fixtures"><ChevronRight size={15} /></button>
        </div>
      </div>
      {matches.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 p-6 text-center text-xs text-mist">No matches played yet. Your first fixture awaits.</div>
      ) : (
        <div className="divide-y divide-white/[0.05]">
          {matches.map(match => {
            const result = resultFor(match, user.id)
            const opp = opponent(match, user.id)
            const home = isHome(match, user.id)
            return (
              <div key={match.id} className="flex items-center gap-2.5 py-2.5">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold form-${result}`}>{result}</span>
                <ClubBadge team={opp} size={22} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-slate-200">{opp?.name}</p>
                  <p className="text-[9px] text-mist-dim">{home ? 'Home' : 'Away'} · MD {match.round}</p>
                </div>
                <span className="num text-base font-semibold text-white">{scoreFor(match, user.id)}</span>
                <span className="hidden w-16 text-right text-[9px] text-mist-dim sm:block">{shortDate(match.match_date, { weekday: false })}</span>
              </div>
            )
          })}
        </div>
      )}
    </motion.section>
  )
}

function QuickActions() {
  const { setView } = useGame()
  const actions = [
    { view: 'transfers', title: 'Scout the market', description: 'Find the missing piece', icon: ArrowLeftRight, tone: 'text-lime bg-lime/10' },
    { view: 'tactics', title: 'Tune the model', description: 'Shape your game plan', icon: SlidersHorizontal, tone: 'text-sky-300 bg-sky-400/10' },
    { view: 'facilities', title: 'Invest in the club', description: 'Build for the future', icon: Building2, tone: 'text-violet-300 bg-violet-400/10' },
    { view: 'squad', title: 'Manage the squad', description: 'Pick your best XI', icon: UsersRound, tone: 'text-amber-300 bg-amber-400/10' }
  ]
  return (
    <motion.section {...reveal(0.34)} className="panel p-5">
      <div className="mb-3">
        <p className="eyebrow">Quick actions</p>
        <h2 className="display-title mt-0.5 text-xl">Run the club</h2>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {actions.map(action => (
          <button
            key={action.view}
            onClick={() => setView(action.view)}
            className="group flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.018] p-3 text-left transition hover:border-white/[0.12] hover:bg-white/[0.04]"
          >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${action.tone}`}>
              <action.icon size={17} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-semibold text-white">{action.title}</span>
              <span className="block truncate text-[10px] text-mist-dim">{action.description}</span>
            </span>
            <ArrowRight size={14} className="text-mist-dim transition group-hover:translate-x-0.5 group-hover:text-lime" />
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/[0.05] bg-ink-950/45 px-3 py-2 text-[10px] text-mist-dim">
        <RefreshCw size={11} className="text-lime" />
        Every result updates the table, player ratings and club finances instantly.
      </div>
    </motion.section>
  )
}

export default function Dashboard() {
  const { data, setView, refreshing, refresh } = useGame()
  const user = data.user
  const standing = data.standings.find(row => row.team_id === user.id)

  return (
    <div>
      <PageHeader
        eyebrow={`Dashboard · Season 2026/27${standing ? ` · ${ordinal(standing.position)} in the league` : ''}`}
        title="Good evening, Alex"
        description={`${user.name} are ${standing ? `${ordinal(standing.position)} with ${standing.points} points from ${standing.played} matches` : 'ready for the new season'}. The board is watching — make the next move count.`}
      >
        <button onClick={() => refresh({ silent: true })} disabled={refreshing} className="btn-secondary">
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
        <button onClick={() => setView('matchday')} className="btn-primary">
          <Play size={15} className="fill-ink-950" /> Match day
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8"><NextMatchCard /></div>
        <div className="xl:col-span-4"><ClubPulse /></div>
        <div className="xl:col-span-7"><LeagueSnapshot /></div>
        <div className="xl:col-span-5"><DifferenceMakers /></div>
        <div className="xl:col-span-7"><RecentResults /></div>
        <div className="xl:col-span-5"><QuickActions /></div>
      </div>
    </div>
  )
}
