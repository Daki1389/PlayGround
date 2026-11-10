import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Goal,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import { useGame } from '../context/GameContext'
import { getTeam } from '../data/gameData'
import { formatDate, formatTime, ordinal, cn } from '../lib/format'
import TeamCrest from '../components/TeamCrest'
import {
  Badge,
  Button,
  Card,
  FormPips,
  SectionTitle,
} from '../components/ui'

function TableZone({ position }) {
  if (position <= 4) return <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-lime-400" />
  if (position <= 6) return <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-sky-400/80" />
  if (position >= 18) return <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-rose-400/80" />
  return null
}

export default function League() {
  const { state, standings, position } = useGame()
  const navigate = useNavigate()
  const [tab, setTab] = useState('table')
  const rounds = useMemo(() => [...new Set(state.fixtures.map((fixture) => fixture.round))].sort((a, b) => a - b), [state.fixtures])
  const [round, setRound] = useState(state.matchday)

  const row = standings.find((item) => item.teamId === 'ashcombe') || standings[0]
  const second = standings[1]
  const gap = second ? row.points - second.points : 0
  const roundFixtures = state.fixtures.filter((fixture) => fixture.round === round)
  const currentRoundIndex = rounds.indexOf(round)
  const previousRound = rounds[currentRoundIndex - 1]
  const nextRound = rounds[currentRoundIndex + 1]

  const goalsFor = row.gf
  const goalsAgainst = row.ga
  const winRate = row.played ? Math.round((row.won / row.played) * 100) : 0
  const formWins = row.form.filter((item) => item === 'W').length

  const changeRound = (value) => {
    const numeric = Number(value)
    if (rounds.includes(numeric)) setRound(numeric)
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        eyebrow={`League · Season ${state.season}`}
        title="League Table"
        description="The race for the title, the battle for Europe and the fight at the bottom. Every point matters."
        action={
          <div className="flex items-center gap-2">
            <Badge variant="lime" dot>Matchday {Math.min(state.matchday, 38)} of 38</Badge>
            <Button variant="secondary" size="sm" icon={Target} onClick={() => navigate('/matchday')}>Next fixture</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {[
          ['League position', ordinal(position), `${row.points} points from ${row.played}`, <Trophy size={15} />, 'lime'],
          ['Points', row.points, `${row.won}W ${row.drawn}D ${row.lost}L`, <TrendingUp size={15} />, 'sky'],
          ['Goal difference', `${row.gd > 0 ? '+' : ''}${row.gd}`, `${goalsFor} scored · ${goalsAgainst} conceded`, <Goal size={15} />, 'violet'],
          ['Recent form', `${formWins}/5`, 'Wins in the last five', <CircleDot size={15} />, 'amber'],
        ].map(([label, value, detail, icon, tone]) => (
          <Card key={label} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-mist-600">{label}</p>
                <p className="mt-1.5 font-display text-[25px] font-semibold leading-none tracking-[-0.04em] text-mist-50">{value}</p>
              </div>
              <span className={cn('grid h-7 w-7 place-items-center rounded-lg border', tone === 'lime' ? 'border-lime-400/15 bg-lime-400/[0.07] text-lime-300' : tone === 'sky' ? 'border-sky-400/15 bg-sky-400/[0.07] text-sky-300' : tone === 'violet' ? 'border-violet-400/15 bg-violet-400/[0.07] text-violet-300' : 'border-amber-400/15 bg-amber-400/[0.07] text-amber-300')}>{icon}</span>
            </div>
            <p className="mt-3 text-[9.5px] text-mist-500">{detail}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.055] px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-ink-950/40 p-0.5">
            <button
              type="button"
              onClick={() => setTab('table')}
              className={cn('rounded-md px-3 py-1.5 text-[10.5px] font-semibold transition', tab === 'table' ? 'bg-white/[0.08] text-mist-50' : 'text-mist-500 hover:text-mist-300')}
            >
              Standings
            </button>
            <button
              type="button"
              onClick={() => setTab('fixtures')}
              className={cn('rounded-md px-3 py-1.5 text-[10.5px] font-semibold transition', tab === 'fixtures' ? 'bg-white/[0.08] text-mist-50' : 'text-mist-500 hover:text-mist-300')}
            >
              Fixtures & results
            </button>
          </div>
          <div className="flex items-center gap-3 text-[9px] font-semibold text-mist-500">
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-lime-400" /> Champions League</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-sky-400" /> Europe</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> Relegation</span>
          </div>
        </div>

        {tab === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.055] text-[8.5px] font-bold uppercase tracking-[0.12em] text-mist-600">
                  <th className="w-12 py-2.5 pl-6 pr-2 font-bold">Pos</th>
                  <th className="py-2.5 px-2 font-bold">Club</th>
                  <th className="py-2.5 px-2 text-center font-bold">P</th>
                  <th className="py-2.5 px-2 text-center font-bold">W</th>
                  <th className="py-2.5 px-2 text-center font-bold">D</th>
                  <th className="py-2.5 px-2 text-center font-bold">L</th>
                  <th className="py-2.5 px-2 text-center font-bold">GF</th>
                  <th className="py-2.5 px-2 text-center font-bold">GA</th>
                  <th className="py-2.5 px-2 text-center font-bold">GD</th>
                  <th className="py-2.5 px-2 text-center font-bold">Pts</th>
                  <th className="py-2.5 pl-2 pr-6 text-right font-bold">Form</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((item) => {
                  const team = getTeam(item.teamId)
                  const isUser = item.teamId === 'ashcombe'
                  return (
                    <tr
                      key={item.teamId}
                      className={cn('group relative border-b border-white/[0.04] transition last:border-0 hover:bg-white/[0.025]', isUser && 'bg-lime-400/[0.045] hover:bg-lime-400/[0.07]')}
                    >
                      <td className="relative py-2.5 pl-6 pr-2">
                        <TableZone position={item.position} />
                        <span className={cn('font-display text-[12px] font-bold tabular-nums', item.position <= 4 ? 'text-lime-300' : item.position >= 18 ? 'text-rose-300' : 'text-mist-400')}>{item.position}</span>
                      </td>
                      <td className="px-2 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <TeamCrest team={team} size={22} />
                          <div className="min-w-0">
                            <p className={cn('truncate text-[11.5px] font-semibold', isUser ? 'text-lime-100' : 'text-mist-200')}>{team.name}</p>
                            <p className="text-[8.5px] text-mist-600">{team.nickname}</p>
                          </div>
                          {isUser && <Badge variant="lime" className="ml-1 px-1.5 py-0 text-[7.5px]">You</Badge>}
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-center text-[10.5px] tabular-nums text-mist-400">{item.played}</td>
                      <td className="px-2 py-2.5 text-center text-[10.5px] tabular-nums text-mist-300">{item.won}</td>
                      <td className="px-2 py-2.5 text-center text-[10.5px] tabular-nums text-mist-400">{item.drawn}</td>
                      <td className="px-2 py-2.5 text-center text-[10.5px] tabular-nums text-mist-400">{item.lost}</td>
                      <td className="px-2 py-2.5 text-center text-[10.5px] tabular-nums text-mist-400">{item.gf}</td>
                      <td className="px-2 py-2.5 text-center text-[10.5px] tabular-nums text-mist-400">{item.ga}</td>
                      <td className={cn('px-2 py-2.5 text-center text-[10.5px] font-semibold tabular-nums', item.gd > 0 ? 'text-lime-300/90' : item.gd < 0 ? 'text-rose-300/80' : 'text-mist-400')}>{item.gd > 0 ? '+' : ''}{item.gd}</td>
                      <td className="px-2 py-2.5 text-center">
                        <span className="inline grid h-6 min-w-7 place-items-center rounded-md border border-white/[0.06] bg-white/[0.03] px-1 font-display text-[11px] font-bold tabular-nums text-mist-100">{item.points}</span>
                      </td>
                      <td className="py-2.5 pl-2 pr-6">
                        <div className="flex justify-end"><FormPips form={item.form} size="sm" /></div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.055] px-5 py-3 sm:px-6">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="xs" onClick={() => previousRound && setRound(previousRound)} disabled={!previousRound} icon={ChevronLeft}>Prev</Button>
                <div className="relative">
                  <select
                    value={round}
                    onChange={(event) => changeRound(event.target.value)}
                    className="h-8 appearance-none rounded-lg border border-white/[0.07] bg-white/[0.03] pl-3 pr-8 text-[10.5px] font-semibold text-mist-200 outline-none focus:border-lime-400/35"
                  >
                    {rounds.map((item) => (
                      <option key={item} value={item} className="bg-ink-900">Matchday {item}</option>
                    ))}
                  </select>
                  <ChevronDown size={11} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-mist-500" />
                </div>
                <Button variant="ghost" size="xs" onClick={() => nextRound && setRound(nextRound)} disabled={!nextRound}>Next <ChevronRight size={12} /></Button>
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-mist-600">
                {roundFixtures.some((fixture) => fixture.played) ? 'Results' : 'Upcoming fixtures'} · {formatDate(roundFixtures[0]?.date || new Date().toISOString())}
              </span>
            </div>
            <div className="grid gap-2.5 p-4 md:grid-cols-2">
              {roundFixtures.map((fixture) => {
                const home = getTeam(fixture.homeId)
                const away = getTeam(fixture.awayId)
                const isUser = fixture.homeId === 'ashcombe' || fixture.awayId === 'ashcombe'
                return (
                  <div
                    key={fixture.id}
                    className={cn(
                      'rounded-xl border px-3.5 py-3 transition',
                      isUser ? 'border-lime-400/20 bg-lime-400/[0.045]' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]',
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-[8.5px] font-semibold text-mist-500"><CalendarDays size={10} /> {formatDate(fixture.date)} · {formatTime(fixture.date)}</span>
                      {isUser && <Badge variant="lime" className="px-1.5 py-0 text-[7.5px]">Ashcombe</Badge>}
                      {fixture.played && <Badge variant="slate" className="px-1.5 py-0 text-[7.5px]">FT</Badge>}
                    </div>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                      <div className="flex items-center gap-2">
                        <TeamCrest team={home} size={22} />
                        <span className={cn('truncate text-[10.5px] font-semibold', isUser && fixture.homeId === 'ashcombe' ? 'text-lime-200' : 'text-mist-200')}>{home.short}</span>
                      </div>
                      <span className={cn('min-w-[40px] rounded-md px-1.5 py-1 text-center font-display text-[11px] font-bold tabular-nums', fixture.played ? 'bg-white/[0.055] text-mist-100' : 'text-mist-500')}>
                        {fixture.played ? `${fixture.homeGoals} – ${fixture.awayGoals}` : 'vs'}
                      </span>
                      <div className="flex items-center justify-end gap-2">
                        <span className={cn('truncate text-[10.5px] font-semibold', isUser && fixture.awayId === 'ashcombe' ? 'text-lime-200' : 'text-mist-200')}>{away.short}</span>
                        <TeamCrest team={away} size={22} />
                      </div>
                    </div>
                    {!fixture.played && (
                      <p className="mt-2 text-center text-[8.5px] text-mist-600">{home.stadium}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.055] px-5 py-3 text-[9px] text-mist-500 sm:px-6">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-lime-400" /> Champions League</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-sky-400" /> Europa League</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> Relegation</span>
          </div>
          <span>Updated after every matchday</span>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-12">
        <Card className="min-w-0 xl:col-span-7">
          <div className="flex items-center justify-between border-b border-white/[0.055] px-5 py-4">
            <div>
              <p className="eyebrow">Title race</p>
              <h2 className="mt-1 font-display text-[17px] font-semibold text-mist-50">The chase at the top</h2>
            </div>
            <Badge variant={gap >= 0 ? 'lime' : 'rose'}>{gap >= 0 ? `+${gap}` : gap} pts</Badge>
          </div>
          <div className="p-5">
            {standings.slice(0, 4).map((item, index) => {
              const team = getTeam(item.teamId)
              return (
                <div key={item.teamId} className="flex items-center gap-3 border-b border-white/[0.04] py-2.5 last:border-0">
                  <span className="w-4 text-[9px] font-bold text-mist-600">{index + 1}</span>
                  <TeamCrest team={team} size={28} />
                  <div className="min-w-0 flex-1">
                    <p className={cn('truncate text-[11.5px] font-semibold', item.teamId === 'ashcombe' ? 'text-lime-200' : 'text-mist-200')}>{team.name}</p>
                    <p className="text-[9px] text-mist-500">{item.won}W {item.drawn}D {item.lost}L · GD {item.gd > 0 ? '+' : ''}{item.gd}</p>
                  </div>
                  <FormPips form={item.form} size="sm" />
                  <span className="w-8 text-right font-display text-[13px] font-bold text-mist-100">{item.points}</span>
                </div>
              )
            })}
            <div className="mt-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2.5 text-[9.5px] leading-relaxed text-mist-500">
              Ashcombe lead the pack by <span className="font-semibold text-lime-300">{Math.abs(gap)} points</span>. {winRate}% win rate across {row.played} matches.
            </div>
          </div>
        </Card>

        <Card className="min-w-0 xl:col-span-5">
          <div className="border-b border-white/[0.055] px-5 py-4">
            <p className="eyebrow">Season statistics</p>
            <h2 className="mt-1 font-display text-[17px] font-semibold text-mist-50">The numbers</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 p-5">
            {[
              ['Goals scored', row.gf, `${(row.gf / Math.max(1, row.played)).toFixed(2)} per game`],
              ['Goals conceded', row.ga, `${(row.ga / Math.max(1, row.played)).toFixed(2)} per game`],
              ['Win rate', `${winRate}%`, `${row.won} victories`],
              ['Form wins', `${formWins}/5`, 'Last five matches'],
            ].map(([label, value, detail]) => (
              <div key={label} className="rounded-xl border border-white/[0.055] bg-white/[0.02] p-3">
                <p className="text-[8px] font-bold uppercase tracking-[0.11em] text-mist-600">{label}</p>
                <p className="mt-1 font-display text-xl font-semibold text-mist-50">{value}</p>
                <p className="text-[8.5px] text-mist-500">{detail}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
