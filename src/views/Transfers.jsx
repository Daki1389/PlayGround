import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  ChevronDown,
  Filter,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  UsersRound,
  Wallet,
  X
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import ClubBadge from '../components/ClubBadge'
import { api } from '../api'
import { useGame } from '../context/GameContext'
import { initials, money, positionTone } from '../lib/format'

const POSITIONS = [
  { id: '', label: 'All' },
  { id: 'GK', label: 'GK' },
  { id: 'DEF', label: 'DEF' },
  { id: 'MID', label: 'MID' },
  { id: 'ATT', label: 'ATT' }
]

const SORTS = [
  { id: 'rating', label: 'Overall rating' },
  { id: 'potential', label: 'Potential' },
  { id: 'value', label: 'Value: low to high' },
  { id: 'value_desc', label: 'Value: high to low' },
  { id: 'age', label: 'Age: youngest' }
]

const MAX_VALUES = [
  { id: '', label: 'Any fee' },
  { id: '10000000', label: 'Up to €10M' },
  { id: '25000000', label: 'Up to €25M' },
  { id: '50000000', label: 'Up to €50M' }
]

export default function Transfers() {
  const { data, openPlayer } = useGame()
  const user = data.user
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [position, setPosition] = useState('')
  const [minRating, setMinRating] = useState(0)
  const [maxValue, setMaxValue] = useState('')
  const [sort, setSort] = useState('rating')
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 260)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let alive = true
    setRefreshing(true)
    api.market({ search: debouncedSearch, position, minRating, maxValue, sort })
      .then(payload => {
        if (!alive) return
        setPlayers(payload.players)
        setError(null)
      })
      .catch(err => {
        if (alive) setError(err.message)
      })
      .finally(() => {
        if (alive) {
          setLoading(false)
          setRefreshing(false)
        }
      })
    return () => { alive = false }
  }, [debouncedSearch, position, minRating, maxValue, sort, data.user.budget])

  const recommended = useMemo(
    () => players
      .filter(player => player.market_value <= data.user.budget)
      .sort((a, b) => b.potential_rating - a.potential_rating || b.overall_rating - a.overall_rating)
      .slice(0, 3),
    [players, data.user.budget]
  )

  const averageRating = players.length
    ? (players.reduce((sum, player) => sum + player.overall_rating, 0) / players.length).toFixed(1)
    : '—'
  const filtersActive = Boolean(search || position || minRating || maxValue || sort !== 'rating')

  function resetFilters() {
    setSearch('')
    setPosition('')
    setMinRating(0)
    setMaxValue('')
    setSort('rating')
  }

  return (
    <div>
      <PageHeader
        eyebrow="Recruitment · transfer market"
        title="Transfer Market"
        description="Scout every club in the league, compare attributes and strengthen the squad. Fees are deducted from your transfer budget instantly."
      >
        <span className="chip-lime"><span className="h-1.5 w-1.5 rounded-full bg-lime" /> Window open</span>
        <button onClick={resetFilters} disabled={!filtersActive} className="btn-secondary">
          <RefreshCw size={14} /> Reset filters
        </button>
      </PageHeader>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Transfer budget', value: money(user.budget), icon: Wallet, accent: 'text-lime', sub: 'Available to spend' },
          { label: 'Your squad', value: data.squad.length, icon: UsersRound, accent: 'text-sky-300', sub: `${data.squad.filter(p => p.position === 'ATT').length} forwards` },
          { label: 'Targets found', value: players.length, icon: Filter, accent: 'text-violet-300', sub: loading ? 'Scanning…' : 'Matching filters' },
          { label: 'Average rating', value: averageRating, icon: TrendingUp, accent: 'text-amber-300', sub: 'Across the shortlist' }
        ].map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="panel p-4">
            <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-mist-dim">
              <stat.icon size={12} className={stat.accent} /> {stat.label}
            </div>
            <p className="num mt-1.5 text-2xl font-semibold text-white">{stat.value}</p>
            <p className="mt-0.5 text-[9px] text-mist-dim">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {recommended.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="panel mb-4 p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="eyebrow">Scout shortlist</p>
              <h2 className="display-title mt-0.5 text-xl">Within reach</h2>
            </div>
            <span className="chip"><Sparkles size={11} className="text-lime" /> Best potential you can afford</span>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {recommended.map(player => (
              <button
                key={player.id}
                onClick={() => openPlayer(player, { signable: true })}
                className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition hover:border-lime/25 hover:bg-lime/[0.035]"
              >
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-ink-950/60 text-[11px] font-bold text-white">
                  {initials(player.name)}
                  <span className={`absolute -bottom-1.5 -right-1.5 rounded px-1 py-0.5 text-[7px] font-bold ring-1 ring-inset ${positionTone(player.position)}`}>{player.position}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-bold text-white group-hover:text-lime">{player.name}</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <ClubBadge team={{ name: player.team_name, short_name: player.team_short_name, primary_color: player.team_color }} size={12} />
                    <span className="truncate text-[9px] text-mist-dim">{player.team_name}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[9px]">
                    <span className="num font-semibold text-white">OVR {player.overall_rating}</span>
                    <span className="num text-mist-dim">POT {player.potential_rating}</span>
                    <span className="num text-lime">{money(player.market_value)}</span>
                  </div>
                </div>
                <ArrowRight size={15} className="text-mist-dim transition group-hover:translate-x-0.5 group-hover:text-lime" />
              </button>
            ))}
          </div>
        </motion.section>
      )}

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="panel overflow-hidden">
        <div className="border-b border-white/[0.055] p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative flex-1">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist-dim" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search players or clubs..."
                className="input-dark pl-9 pr-9"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-mist-dim hover:text-white" aria-label="Clear search">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-white/[0.07] bg-ink-950/60 p-1">
              {POSITIONS.map(item => (
                <button
                  key={item.id || 'all'}
                  onClick={() => setPosition(item.id)}
                  className={`rounded-lg px-3 py-1.5 text-[10px] font-semibold transition ${position === item.id ? 'bg-lime text-ink-950' : 'text-mist hover:text-white'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <select value={sort} onChange={event => setSort(event.target.value)} className="select-dark min-w-[150px] text-[11px]">
                {SORTS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
              <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-mist-dim" />
            </div>
            <div className="relative">
              <select value={maxValue} onChange={event => setMaxValue(event.target.value)} className="select-dark min-w-[130px] text-[11px]">
                {MAX_VALUES.map(option => <option key={option.id || 'any'} value={option.id}>{option.label}</option>)}
              </select>
              <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-mist-dim" />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={12} className="text-mist-dim" />
              <span className="text-[10px] text-mist-dim">Min rating</span>
              <span className="num rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold text-white">{minRating || 'Any'}</span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="1"
              value={minRating}
              onChange={event => setMinRating(Number(event.target.value))}
              className="w-36"
              aria-label="Minimum overall rating"
            />
            <span className="ml-auto text-[10px] text-mist-dim">
              {refreshing ? 'Updating shortlist…' : `${players.length} players listed · ${money(user.budget)} available`}
            </span>
          </div>
        </div>

        {error ? (
          <div className="p-10 text-center text-sm text-red-300">{error}</div>
        ) : loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="shimmer h-12 rounded-lg" />
            ))}
          </div>
        ) : players.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.05] text-mist"><Search size={20} /></div>
            <p className="text-sm font-semibold text-white">No players match those filters</p>
            <p className="mt-1 max-w-sm text-xs text-mist">Try widening your rating range or clearing the position filter.</p>
            <button onClick={resetFilters} className="btn-secondary mt-4">Reset filters</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-white/[0.055] bg-white/[0.02]">
                  <th className="table-head px-4 py-2.5 text-left">Player</th>
                  <th className="table-head px-2 py-2.5 text-center">Pos</th>
                  <th className="table-head px-2 py-2.5 text-center">Age</th>
                  <th className="table-head px-2 py-2.5 text-center">OVR</th>
                  <th className="hidden px-2 py-2.5 text-center sm:table-cell">POT</th>
                  <th className="table-head px-2 py-2.5 text-right">Value</th>
                  <th className="table-head hidden px-2 py-2.5 text-right md:table-cell">Wage</th>
                  <th className="table-head px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {players.map(player => {
                  const affordable = player.market_value <= user.budget
                  return (
                    <tr
                      key={player.id}
                      onClick={() => openPlayer(player, { signable: true })}
                      className="group cursor-pointer border-b border-white/[0.04] transition hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/[0.07] bg-white/[0.025] text-[9px] font-bold text-slate-200">
                            {initials(player.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[12px] font-semibold text-white group-hover:text-lime">{player.name}</p>
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <ClubBadge team={{ name: player.team_name, short_name: player.team_short_name, primary_color: player.team_color }} size={11} />
                              <span className="truncate text-[9px] text-mist-dim">{player.team_name}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-center"><span className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold ring-1 ring-inset ${positionTone(player.position)}`}>{player.position}</span></td>
                      <td className="num px-2 py-2.5 text-center text-xs text-mist">{player.age}</td>
                      <td className="num px-2 py-2.5 text-center"><span className="rounded bg-lime/10 px-1.5 py-0.5 text-xs font-bold text-lime">{player.overall_rating}</span></td>
                      <td className="num hidden px-2 py-2.5 text-center text-xs text-mist sm:table-cell">{player.potential_rating}</td>
                      <td className={`num px-2 py-2.5 text-right text-xs font-semibold ${affordable ? 'text-white' : 'text-red-300'}`}>{money(player.market_value)}</td>
                      <td className="num hidden px-2 py-2.5 text-right text-[11px] text-mist md:table-cell">{money(player.wage)}<span className="text-[8px]">/wk</span></td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={event => { event.stopPropagation(); openPlayer(player, { signable: true }) }}
                          disabled={!affordable}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition ${affordable ? 'bg-lime text-ink-950 hover:bg-lime-400' : 'cursor-not-allowed bg-white/[0.04] text-mist-dim'}`}
                        >
                          {affordable ? 'Sign' : 'Short'} <ArrowRight size={11} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-white/[0.055] px-4 py-2.5 text-[9px] text-mist-dim">
          <span>Showing {players.length} players · prices equal to market value</span>
          <span className="hidden sm:inline">Budget validation is instant and server-side</span>
        </div>
      </motion.section>
    </div>
  )
}
