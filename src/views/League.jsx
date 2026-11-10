import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, ChevronLeft, ChevronRight, Crown, Goal, Shield, Sparkles, Trophy, UsersRound } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import ClubBadge from '../components/ClubBadge'
import FormPills from '../components/FormPills'
import { useGame } from '../context/GameContext'
import { isHome, opponent, ordinal, resultFor, scoreFor, shortDate } from '../lib/format'

function StatCard({ label, children, icon: Icon, accent = 'text-lime', delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="panel p-4">
      <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-mist-dim">
        <Icon size={12} className={accent} /> {label}
      </div>
      <div className="mt-2">{children}</div>
    </motion.div>
  )
}

function StandingsTable() {
  const { data } = useGame()
  const user = data.user
  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.055] p-4 sm:p-5">
        <div>
          <p className="eyebrow">Standings</p>
          <h2 className="display-title mt-0.5 text-2xl">League table</h2>
        </div>
        <div className="flex items-center gap-3 text-[9px] text-mist-dim">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-lime" /> Title race</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-red-400" /> Relegation</span>
          <span className="hidden sm:inline">Matchday {Math.max(...data.standings.map(row => row.played))} of 14</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="border-b border-white/[0.055] bg-white/[0.02]">
              <th className="table-head px-4 py-2.5 text-left">#</th>
              <th className="table-head px-2 py-2.5 text-left">Club</th>
              <th className="table-head px-2 py-2.5 text-center">P</th>
              <th className="table-head px-2 py-2.5 text-center">W</th>
              <th className="table-head px-2 py-2.5 text-center">D</th>
              <th className="table-head px-2 py-2.5 text-center">L</th>
              <th className="table-head hidden px-2 py-2.5 text-center sm:table-cell">GF</th>
              <th className="table-head hidden px-2 py-2.5 text-center sm:table-cell">GA</th>
              <th className="table-head px-2 py-2.5 text-center">GD</th>
              <th className="table-head px-3 py-2.5 text-center">Pts</th>
              <th className="table-head px-4 py-2.5 text-right">Form</th>
            </tr>
          </thead>
          <tbody>
            {data.standings.map(row => {
              const isUser = row.team_id === user.id
              const team = data.teams.find(item => item.id === row.team_id) || row
              const zone = row.position <= 4 ? 'lime' : row.position >= data.standings.length - 1 ? 'red' : 'neutral'
              return (
                <tr key={row.team_id} className={`border-b border-white/[0.04] transition hover:bg-white/[0.03] ${isUser ? 'bg-lime/[0.055]' : ''}`}>
                  <td className={`px-4 py-3 ${zone === 'lime' ? 'border-l-2 border-l-lime' : zone === 'red' ? 'border-l-2 border-l-red-400' : 'border-l-2 border-l-transparent'}`}>
                    <span className={`num inline-flex h-6 min-w-6 items-center justify-center rounded px-1 text-[11px] font-semibold ${zone === 'lime' ? 'bg-lime/10 text-lime' : zone === 'red' ? 'bg-red-400/10 text-red-300' : 'bg-white/[0.04] text-mist'}`}>
                      {row.position}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2.5">
                      <ClubBadge team={team} size={26} />
                      <div className="min-w-0">
                        <p className={`truncate text-[12px] font-semibold ${isUser ? 'text-white' : 'text-slate-200'}`}>{row.team_name}</p>
                        <p className="text-[9px] text-mist-dim">{isUser ? 'Your club' : team.city || '—'}</p>
                      </div>
                      {isUser && <span className="rounded bg-lime/15 px-1 py-0.5 text-[7px] font-bold text-lime">YOU</span>}
                    </div>
                  </td>
                  <td className="num px-2 py-3 text-center text-xs text-mist">{row.played}</td>
                  <td className="num px-2 py-3 text-center text-xs text-slate-300">{row.wins}</td>
                  <td className="num px-2 py-3 text-center text-xs text-slate-300">{row.draws}</td>
                  <td className="num px-2 py-3 text-center text-xs text-slate-300">{row.losses}</td>
                  <td className="num hidden px-2 py-3 text-center text-xs text-mist sm:table-cell">{row.goals_for}</td>
                  <td className="num hidden px-2 py-3 text-center text-xs text-mist sm:table-cell">{row.goals_against}</td>
                  <td className={`num px-2 py-3 text-center text-xs font-semibold ${row.goal_difference > 0 ? 'text-lime' : row.goal_difference < 0 ? 'text-red-300' : 'text-mist'}`}>
                    {row.goal_difference > 0 ? '+' : ''}{row.goal_difference}
                  </td>
                  <td className="num px-3 py-3 text-center">
                    <span className={`inline-flex min-w-7 justify-center rounded-md px-1.5 py-0.5 text-sm font-bold ${isUser ? 'bg-lime text-ink-950' : 'text-white'}`}>{row.points}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end"><FormPills form={row.form} size="xs" /></div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/[0.055] px-4 py-2.5 text-[9px] text-mist-dim">
        <span>P played · W wins · D draws · L losses · GF/GA goals · GD goal difference</span>
        <span className="ml-auto hidden sm:inline">Sorted by points, goal difference, goals scored</span>
      </div>
    </div>
  )
}

function ScorersPanel({ title, eyebrow, players, metric, icon: Icon }) {
  return (
    <section className="panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="display-title mt-0.5 text-xl">{title}</h2>
        </div>
        <Icon size={18} className="text-lime" />
      </div>
      <div className="space-y-1">
        {players.map((player, index) => (
          <div key={player.id} className="flex items-center gap-2.5 rounded-lg border border-transparent px-1.5 py-1.5 transition hover:border-white/[0.05] hover:bg-white/[0.02]">
            <span className="num w-4 text-[10px] text-mist-dim">{index + 1}</span>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/[0.05] text-[8px] font-bold text-white">
              {player.name.split(' ').map(part => part[0]).slice(0, 2).join('')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-slate-200">{player.name}</p>
              <p className="text-[9px] text-mist-dim">{player.team_name} · {player.position}</p>
            </div>
            <span className="num text-base font-semibold text-white">{player[metric]}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function FixturesView() {
  const { data } = useGame()
  const user = data.user
  const next = data.next_match
  const [selectedRound, setSelectedRound] = useState(next?.round || data.season.current_round || 1)
  const allRounds = Array.from({ length: data.season.total_rounds }, (_, index) => index + 1)
  const roundMatches = useMemo(
    () => data.fixtures.filter(match => match.round === selectedRound),
    [data.fixtures, selectedRound]
  )
  const userFixtures = useMemo(
    () => data.fixtures.filter(match => match.home_team_id === user.id || match.away_team_id === user.id),
    [data.fixtures, user.id]
  )
  const selectedNext = roundMatches.find(match => match.id === next?.id)
  const roundDate = roundMatches[0]?.match_date

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="panel overflow-hidden xl:col-span-8">
        <div className="border-b border-white/[0.055] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="eyebrow">Fixture calendar</p>
              <h2 className="display-title mt-0.5 text-2xl">Matchday {selectedRound}</h2>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-mist">
              <CalendarDays size={13} /> {roundDate ? shortDate(roundDate) : 'TBC'}
            </div>
          </div>
          <div className="mt-3 flex gap-1 overflow-x-auto pb-1 no-scrollbar">
            {allRounds.map(round => {
              const matches = data.fixtures.filter(match => match.round === round)
              const complete = matches.every(match => match.status === 'finished')
              const active = round === selectedRound
              const isCurrent = matches.some(match => match.id === next?.id)
              return (
                <button
                  key={round}
                  onClick={() => setSelectedRound(round)}
                  className={`relative flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[10px] font-semibold transition ${active ? 'bg-lime text-ink-950' : complete ? 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]' : 'bg-white/[0.025] text-mist hover:bg-white/[0.06]'}`}
                >
                  {round}
                  {isCurrent && !active && <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-lime" />}
                </button>
              )
            })}
          </div>
        </div>
        <div className="divide-y divide-white/[0.05]">
          {roundMatches.map(match => {
            const isUserMatch = match.id === next?.id
            const userInvolved = match.home_team_id === user.id || match.away_team_id === user.id
            return (
              <div key={match.id} className={`relative px-4 py-3.5 transition sm:px-5 ${isUserMatch ? 'bg-lime/[0.05]' : 'hover:bg-white/[0.02]'}`}>
                {isUserMatch && <span className="absolute inset-y-0 left-0 w-0.5 bg-lime" />}
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 items-center justify-end gap-2 min-w-0">
                    <div className="min-w-0 text-right">
                      <p className={`truncate text-[12px] font-semibold ${match.home_team_id === user.id ? 'text-lime' : 'text-slate-200'}`}>{match.home_team.name}</p>
                      <p className="text-[9px] text-mist-dim">Home</p>
                    </div>
                    <ClubBadge team={match.home_team} size={28} className="shrink-0" />
                  </div>
                  <div className="w-16 shrink-0 text-center">
                    {match.status === 'finished' ? (
                      <>
                        <p className="num text-lg font-semibold text-white">{match.home_score} – {match.away_score}</p>
                        <p className="text-[8px] uppercase tracking-wider text-mist-dim">Full-time</p>
                      </>
                    ) : (
                      <>
                        <p className="num text-sm font-semibold text-white">15:00</p>
                        <p className={`text-[8px] uppercase tracking-wider ${isUserMatch ? 'text-lime' : 'text-mist-dim'}`}>{isUserMatch ? 'Your match' : 'Scheduled'}</p>
                      </>
                    )}
                  </div>
                  <div className="flex flex-1 items-center gap-2 min-w-0">
                    <ClubBadge team={match.away_team} size={28} className="shrink-0" />
                    <div className="min-w-0">
                      <p className={`truncate text-[12px] font-semibold ${match.away_team_id === user.id ? 'text-lime' : 'text-slate-200'}`}>{match.away_team.name}</p>
                      <p className="text-[9px] text-mist-dim">Away</p>
                    </div>
                  </div>
                </div>
                {userInvolved && (
                  <div className="mt-1.5 flex justify-center">
                    {match.status === 'finished' ? (
                      <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold form-${resultFor(match, user.id)}`}>
                        {resultFor(match, user.id) === 'W' ? 'Win' : resultFor(match, user.id) === 'D' ? 'Draw' : 'Loss'} · {scoreFor(match, user.id)}
                      </span>
                    ) : (
                      <span className="chip-lime py-0.5 text-[8px]"><span className="h-1 w-1 rounded-full bg-lime" /> Next up</span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-between border-t border-white/[0.055] px-4 py-2.5 text-[9px] text-mist-dim">
          <span>{roundMatches.filter(match => match.status === 'finished').length} of {roundMatches.length} played</span>
          <div className="flex gap-1">
            <button onClick={() => setSelectedRound(round => Math.max(1, round - 1))} className="icon-btn h-6 w-6"><ChevronLeft size={12} /></button>
            <button onClick={() => setSelectedRound(round => Math.min(data.season.total_rounds, round + 1))} className="icon-btn h-6 w-6"><ChevronRight size={12} /></button>
          </div>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="panel flex flex-col overflow-hidden xl:col-span-4">
        <div className="border-b border-white/[0.055] p-4">
          <p className="eyebrow">Your schedule</p>
          <h2 className="display-title mt-0.5 text-xl">{user.name}</h2>
          <div className="mt-2 flex items-center gap-2">
            <FormPills form={data.standings.find(row => row.team_id === user.id)?.form || []} />
            <span className="text-[9px] text-mist-dim">{userFixtures.filter(match => match.status === 'finished').length} played</span>
          </div>
        </div>
        <div className="max-h-[475px] flex-1 divide-y divide-white/[0.04] overflow-y-auto scroll-slim">
          {userFixtures.map(match => {
            const home = isHome(match, user.id)
            const opp = opponent(match, user.id)
            const result = resultFor(match, user.id)
            return (
              <button key={match.id} onClick={() => setSelectedRound(match.round)} className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition hover:bg-white/[0.03] ${selectedRound === match.round ? 'bg-white/[0.025]' : ''}`}>
                <span className="num w-4 text-[9px] text-mist-dim">{match.round}</span>
                <span className={`flex h-5 w-5 items-center justify-center rounded text-[8px] font-bold ${result ? `form-${result}` : 'bg-white/[0.04] text-mist-dim'}`}>
                  {result || (home ? 'H' : 'A')}
                </span>
                <ClubBadge team={opp} size={18} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10.5px] font-semibold text-slate-200">{opp?.short_name} <span className="font-normal text-mist-dim">· {home ? 'H' : 'A'}</span></p>
                  <p className="text-[8px] text-mist-dim">{shortDate(match.match_date, { weekday: false })}</p>
                </div>
                <span className="num text-[10px] font-semibold text-white">{match.status === 'finished' ? scoreFor(match, user.id) : '—'}</span>
              </button>
            )
          })}
        </div>
      </motion.section>
    </div>
  )
}

export default function League() {
  const { data } = useGame()
  const [tab, setTab] = useState('standings')
  const user = data.user
  const userRow = data.standings.find(row => row.team_id === user.id)
  const leader = data.standings[0]
  const bestDefence = [...data.standings].sort((a, b) => a.goals_against - b.goals_against)[0]
  const topScorer = data.league_top_scorers?.[0]
  const assistLeader = [...(data.league_top_scorers || [])].sort((a, b) => b.assists - a.assists)[0]

  return (
    <div>
      <PageHeader
        eyebrow="Competition · 2026/27 season"
        title="League"
        description="Track the title race, follow every fixture and see where your club sits after each matchday."
      >
        <div className="flex items-center rounded-xl border border-white/[0.07] bg-ink-900 p-1">
          <button onClick={() => setTab('standings')} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${tab === 'standings' ? 'bg-lime text-ink-950' : 'text-mist hover:text-white'}`}>
            <Trophy size={13} /> Standings
          </button>
          <button onClick={() => setTab('fixtures')} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${tab === 'fixtures' ? 'bg-lime text-ink-950' : 'text-mist hover:text-white'}`}>
            <CalendarDays size={13} /> Fixtures
          </button>
        </div>
      </PageHeader>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="League leader" icon={Crown} delay={0.02}>
          <div className="flex items-center gap-2">
            <ClubBadge team={data.teams.find(team => team.id === leader?.team_id) || leader} size={28} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">{leader?.team_name}</p>
              <p className="text-[9px] text-mist-dim">{leader?.points} pts · GD {leader?.goal_difference > 0 ? '+' : ''}{leader?.goal_difference}</p>
            </div>
          </div>
        </StatCard>
        <StatCard label="Your position" icon={Trophy} delay={0.05} accent="text-sky-300">
          <div className="flex items-end gap-2">
            <p className="num text-3xl font-semibold leading-none text-white">{ordinal(userRow?.position)}</p>
            <p className="pb-0.5 text-[10px] text-mist">{userRow?.points} pts · {userRow?.played} played</p>
          </div>
        </StatCard>
        <StatCard label="Golden boot" icon={Goal} delay={0.08} accent="text-amber-300">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{topScorer?.name || '—'}</p>
            <p className="text-[9px] text-mist-dim">{topScorer?.team_short_name || '—'} · {topScorer?.goals || 0} goals</p>
          </div>
        </StatCard>
        <StatCard label="Best defence" icon={Shield} delay={0.11} accent="text-violet-300">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{bestDefence?.team_name || '—'}</p>
            <p className="text-[9px] text-mist-dim">{bestDefence?.goals_against || 0} conceded · {bestDefence?.played || 0} played</p>
          </div>
        </StatCard>
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {tab === 'standings' ? (
          <div className="space-y-4">
            <StandingsTable />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ScorersPanel title="Golden boot race" eyebrow="Goals" players={(data.league_top_scorers || []).slice(0, 5)} metric="goals" icon={Goal} />
              <ScorersPanel title="Assist kings" eyebrow="Creativity" players={[...(data.league_top_scorers || [])].sort((a, b) => b.assists - a.assists).slice(0, 5)} metric="assists" icon={UsersRound} />
            </div>
          </div>
        ) : (
          <FixturesView />
        )}
      </motion.div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-2.5 text-[9px] text-mist-dim">
        <Sparkles size={12} className="text-lime" />
        {assistLeader ? `${assistLeader.name} leads the assist charts with ${assistLeader.assists}.` : 'The season is waiting for its first assist.'}
        <span className="ml-auto hidden sm:inline">14 matchdays · 8 clubs · double round-robin</span>
      </div>
    </div>
  )
}
