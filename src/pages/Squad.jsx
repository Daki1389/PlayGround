import { useMemo, useState } from 'react'
import {
  ArrowLeftRight,
  ArrowUpDown,
  ChevronDown,
  CircleDot,
  Crosshair,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { useGame } from '../context/GameContext'
import { FORMATIONS } from '../data/gameData'
import { getSquadValue } from '../lib/engine'
import { cn, formatMoney, formatWageBill } from '../lib/format'
import PlayerAvatar from '../components/PlayerAvatar'
import PlayerModal from '../components/PlayerModal'
import {
  Button,
  Card,
  EmptyState,
  PositionBadge,
  ProgressBar,
  RatingBadge,
  Ring,
  SectionTitle,
} from '../components/ui'
import { useToast } from '../components/Toast'

const POSITION_FILTERS = ['All', 'GK', 'DEF', 'MID', 'ATT']

function matchesPosition(player, filter) {
  if (filter === 'All') return true
  if (filter === 'GK') return player.pos === 'GK'
  if (filter === 'DEF') return ['CB', 'RB', 'LB'].includes(player.pos)
  if (filter === 'MID') return ['DM', 'CM', 'AM', 'RW', 'LW'].includes(player.pos)
  if (filter === 'ATT') return player.pos === 'ST'
  return true
}

function PitchToken({ player, slot, index, onClick, dimmed, selected }) {
  if (!player) return null
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
      className={cn(
        'group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center transition-all duration-200 hover:z-20 hover:scale-[1.06]',
        dimmed && 'opacity-30 grayscale',
      )}
    >
      <span className={cn(
        'relative grid place-items-center rounded-full border-2 shadow-[0_8px_18px_-6px_rgba(0,0,0,0.8)] transition',
        selected
          ? 'border-lime-300 bg-lime-400 text-[#08130e]'
          : 'border-white/25 bg-gradient-to-br from-emerald-800 to-ink-950 text-mist-50 group-hover:border-lime-300/70',
      )} style={{ width: 40, height: 40 }}>
        <span className="font-display text-[11px] font-bold">{player.shirt || index + 1}</span>
        <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-md border border-lime-300/30 bg-ink-950 px-1 font-display text-[9px] font-bold text-lime-300">
          {player.rating}
        </span>
      </span>
      <span className="mt-1 max-w-[84px] truncate rounded-md bg-ink-950/80 px-1.5 py-0.5 text-[9px] font-semibold leading-tight text-mist-100 backdrop-blur-sm">
        {player.name.split(' ').slice(-1)[0]}
      </span>
      <span className="mt-0.5 rounded bg-white/[0.06] px-1 py-px text-[7.5px] font-bold uppercase tracking-[0.08em] text-mist-500">{slot.role}</span>
    </button>
  )
}

function LineupRow({ player, slot, isPending, onSelect, onSwap, onOpen }) {
  return (
    <div className={cn('group flex items-center gap-2.5 rounded-lg px-2 py-2 transition', isPending && 'bg-lime-400/[0.06]')}>
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-white/[0.05] text-[8px] font-bold text-mist-500">{slot}</span>
        <PlayerAvatar player={player} size={29} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11.5px] font-semibold text-mist-200 group-hover:text-mist-50">{player.name}</p>
          <div className="mt-0.5 flex items-center gap-1.5 text-[9px] text-mist-500">
            <span>{player.pos}</span>
            <span className="text-mist-700">·</span>
            <span className={cn(player.fitness >= 85 ? 'text-lime-300/80' : player.fitness >= 70 ? 'text-amber-300/80' : 'text-rose-300/80')}>{player.fitness}%</span>
          </div>
        </div>
      </button>
      <RatingBadge value={player.rating} size="sm" />
      {isPending ? (
        <button
          type="button"
          onClick={onSwap}
          className="grid h-6 w-6 place-items-center rounded-md border border-lime-400/30 bg-lime-400/10 text-lime-300 transition hover:bg-lime-400/20"
          title="Swap into XI"
        >
          <ArrowLeftRight size={11} />
        </button>
      ) : (
        <button type="button" onClick={onOpen} className="rounded p-1 text-mist-600 opacity-0 transition group-hover:opacity-100 hover:text-mist-200">
          <CircleDot size={12} />
        </button>
      )}
    </div>
  )
}

export default function Squad() {
  const { state, dispatch, rating, wageBill } = useGame()
  const { push } = useToast()
  const [tab, setTab] = useState('xi')
  const [selected, setSelected] = useState(null)
  const [pendingBench, setPendingBench] = useState(null)
  const [query, setQuery] = useState('')
  const [positionFilter, setPositionFilter] = useState('All')
  const [sortBy, setSortBy] = useState('rating')

  const formation = FORMATIONS[state.formation] || FORMATIONS['4-2-3-1']
  const squadMap = useMemo(() => new Map(state.squad.map((player) => [player.id, player])), [state.squad])
  const starters = state.lineup.map((id) => squadMap.get(id)).filter(Boolean)
  const bench = state.squad.filter((player) => !state.lineup.includes(player.id))
  const pendingPlayer = pendingBench ? squadMap.get(pendingBench) : null

  const avgAge = state.squad.reduce((sum, player) => sum + player.age, 0) / state.squad.length
  const squadValue = getSquadValue(state)

  const filteredSquad = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return [...state.squad]
      .filter((player) => matchesPosition(player, positionFilter))
      .filter((player) => !needle || `${player.name} ${player.pos} ${player.nation}`.toLowerCase().includes(needle))
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating
        if (sortBy === 'age') return a.age - b.age
        if (sortBy === 'value') return b.value - a.value
        if (sortBy === 'fitness') return b.fitness - a.fitness
        if (sortBy === 'form') return b.form - a.form
        return a.name.localeCompare(b.name)
      })
  }, [state.squad, query, positionFilter, sortBy])

  const handleSwap = (starterId) => {
    if (!pendingBench) return
    const benchPlayer = squadMap.get(pendingBench)
    dispatch({ type: 'SWAP_LINEUP', starterId, benchId: pendingBench })
    push(`${benchPlayer?.name} moves into the starting XI.`, 'success')
    setPendingBench(null)
  }

  const chooseForXI = (player) => {
    setPendingBench(player.id)
    setTab('xi')
    setSelected(null)
    push(`Select a starter to replace with ${player.name}.`, 'info')
  }

  const autoPick = () => {
    dispatch({ type: 'SET_FORMATION', formation: state.formation })
    push('Best available XI selected.', 'success')
    setPendingBench(null)
  }

  const changeFormation = (value) => {
    dispatch({ type: 'SET_FORMATION', formation: value })
    setPendingBench(null)
    push(`Formation switched to ${value}.`, 'info')
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        eyebrow={`Season ${state.season} · ${state.formation}`}
        title="Squad"
        description="Manage your starting XI, rotate tired legs and fine-tune the tactical approach before match day."
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={RotateCcw} onClick={autoPick}>Auto pick</Button>
            <Button variant="primary" size="sm" icon={Users} onClick={() => setTab('bench')}>Bench & rotation</Button>
          </div>
        }
      />

      <Card className="grid grid-cols-2 divide-x divide-white/[0.055] px-2 py-3.5 sm:grid-cols-4">
        {[
          ['Squad size', state.squad.length, 'players'],
          ['Starting XI avg', Number(rating).toFixed(1), 'team OVR'],
          ['Wage bill', formatWageBill(wageBill), 'per week'],
          ['Squad value', formatMoney(squadValue), 'market estimate'],
        ].map(([label, value, sub]) => (
          <div key={label} className="px-3 sm:px-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-mist-600">{label}</p>
            <p className="mt-1.5 font-display text-lg font-semibold tracking-[-0.03em] text-mist-50">{value}</p>
            <p className="text-[9.5px] text-mist-500">{sub}</p>
          </div>
        ))}
      </Card>

      <div className="grid gap-5 xl:grid-cols-12">
        <Card className="xl:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.055] px-4 py-3.5 sm:px-5">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-lime-400/15 bg-lime-400/[0.07] text-lime-300"><Crosshair size={15} /></span>
              <div>
                <p className="font-display text-[13px] font-semibold text-mist-100">Formation board</p>
                <p className="text-[9.5px] text-mist-500">{formation.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={state.formation}
                  onChange={(event) => changeFormation(event.target.value)}
                  className="h-8 appearance-none rounded-lg border border-white/[0.08] bg-white/[0.04] pl-3 pr-8 text-[11px] font-semibold text-mist-200 outline-none transition hover:border-white/[0.14] focus:border-lime-400/40"
                >
                  {Object.keys(FORMATIONS).map((key) => (
                    <option key={key} value={key} className="bg-ink-900">{key}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-mist-500" />
              </div>
              <Button variant="ghost" size="sm" icon={SlidersHorizontal} onClick={() => document.getElementById('tactics-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>Tactics</Button>
            </div>
          </div>

          <div className="p-3 sm:p-4">
            {pendingPlayer && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-lime-400/20 bg-lime-400/[0.07] px-3 py-2 text-[10.5px] text-lime-100">
                <ArrowLeftRight size={13} />
                Select a starter to replace with <span className="font-bold">{pendingPlayer.name}</span>
                <button type="button" onClick={() => setPendingBench(null)} className="ml-auto rounded p-0.5 text-lime-300 hover:bg-white/5"><X size={12} /></button>
              </div>
            )}
            <div id="squad-pitch" className="relative mx-auto h-[480px] w-full max-w-[540px] overflow-hidden rounded-xl border border-white/[0.09] bg-[#0d3b2a] sm:h-[560px]">
              <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.035)_0_1px,transparent_1px_52px)]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(198,245,109,0.12),transparent_60%),linear-gradient(180deg,rgba(0,0,0,0.14),rgba(0,0,0,0.38))]" />
              <div className="pitch-lines absolute inset-[3%] rounded-sm border border-white/20">
                <div className="absolute left-1/2 top-1/2 h-[18%] w-[24%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />
                <div className="absolute left-1/2 top-1/2 h-px w-full -translate-x-1/2 -translate-y-1/2 bg-white/20" />
                <div className="absolute left-1/2 top-0 h-[15%] w-[46%] -translate-x-1/2 border-x border-b border-white/20" />
                <div className="absolute left-1/2 top-0 h-[6%] w-[24%] -translate-x-1/2 border-x border-b border-white/20" />
                <div className="absolute bottom-0 left-1/2 h-[15%] w-[46%] -translate-x-1/2 border-x border-t border-white/20" />
                <div className="absolute bottom-0 left-1/2 h-[6%] w-[24%] -translate-x-1/2 border-x border-t border-white/20" />
                <div className="absolute left-1/2 top-0 h-[2%] w-[12%] -translate-x-1/2 rounded-b-sm border-x border-b border-white/20" />
                <div className="absolute bottom-0 left-1/2 h-[2%] w-[12%] -translate-x-1/2 rounded-t-sm border-x border-t border-white/20" />
                <div className="absolute left-0 top-1/2 h-10 w-4 -translate-y-1/2 rounded-r-full border-y border-r border-white/20" />
                <div className="absolute right-0 top-1/2 h-10 w-4 -translate-y-1/2 rounded-l-full border-y border-l border-white/20" />
              </div>
              <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none font-display text-[80px] font-bold tracking-[-0.08em] text-white/[0.025]">AU</div>

              {formation.slots.map((slot, index) => {
                const player = squadMap.get(state.lineup[index])
                return (
                  <PitchToken
                    key={`${state.formation}-${slot.role}-${index}`}
                    player={player}
                    slot={slot}
                    index={index}
                    selected={false}
                    dimmed={false}
                    onClick={() => {
                      if (pendingBench) handleSwap(player.id)
                      else if (player) setSelected(player)
                    }}
                  />
                )
              })}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[9.5px] text-mist-500">
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-lime-400" /> Click a player to view profile</span>
              <span className="inline-flex items-center gap-1.5"><Sparkles size={11} className="text-lime-300" /> Tactical familiarity {state.tactics.familiarity}%</span>
            </div>
          </div>
        </Card>

        <div className="space-y-5 xl:col-span-5">
          <Card>
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.055] px-4 py-3">
              <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-ink-950/40 p-0.5">
                {[
                  ['xi', `Starting XI · ${starters.length}`],
                  ['bench', `Bench · ${bench.length}`],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={cn(
                      'rounded-md px-2.5 py-1.5 text-[10.5px] font-semibold transition',
                      tab === key ? 'bg-white/[0.08] text-mist-50 shadow-sm' : 'text-mist-500 hover:text-mist-300',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-mist-600">OVR {Number(rating).toFixed(1)}</span>
            </div>
            <div className="max-h-[356px] overflow-y-auto p-2 scrollbar-thin">
              {tab !== 'bench' && formation.slots.map((slot, index) => {
                const player = squadMap.get(state.lineup[index])
                if (!player) return null
                return (
                  <LineupRow
                    key={`${slot.role}-${player.id}`}
                    player={player}
                    slot={slot.role}
                    isPending={Boolean(pendingBench)}
                    onSwap={() => handleSwap(player.id)}
                    onOpen={() => (pendingBench ? handleSwap(player.id) : setSelected(player))}
                  />
                )
              })}
              {tab === 'bench' && (
                <div className="space-y-0.5">
                  {bench.map((player) => (
                    <div key={player.id} className={cn('group flex items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-white/[0.03]', pendingBench === player.id && 'bg-lime-400/[0.06]')}>
                      <button type="button" onClick={() => setSelected(player)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                        <PlayerAvatar player={player} size={29} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11.5px] font-semibold text-mist-200">{player.name}</p>
                          <p className="text-[9px] text-mist-500">{player.pos} · {player.age}y · {formatMoney(player.value)}</p>
                        </div>
                      </button>
                      <RatingBadge value={player.rating} size="sm" />
                      <button
                        type="button"
                        onClick={() => {
                          setPendingBench(player.id)
                          setTab('xi')
                          push(`Select a starter to replace with ${player.name}.`, 'info')
                        }}
                        className="grid h-6 w-6 place-items-center rounded-md border border-white/[0.08] bg-white/[0.03] text-mist-400 transition hover:border-lime-400/30 hover:text-lime-300"
                        title="Move into starting XI"
                      >
                        <ArrowLeftRight size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.055] px-4 py-2.5">
              <span className="inline-flex items-center gap-1.5 text-[9.5px] text-mist-500"><CircleDot size={11} className="text-lime-300" /> Fitness above 85% is optimal</span>
              <span className="text-[9px] font-semibold text-mist-500">Avg age {avgAge.toFixed(1)}</span>
            </div>
          </Card>

          <Card id="tactics-card">
            <div className="flex items-start justify-between gap-4 p-4 pb-3">
              <div>
                <p className="eyebrow">Match plan</p>
                <h3 className="mt-1 font-display text-[15px] font-semibold text-mist-50">Tactical approach</h3>
              </div>
              <Ring value={state.tactics.familiarity} size={46} stroke={4}>
                <span className="font-display text-[10px] font-bold text-mist-100">{state.tactics.familiarity}%</span>
              </Ring>
            </div>
            <div className="px-4 pb-4">
              <div className="grid grid-cols-3 gap-1.5">
                {['Cautious', 'Balanced', 'Attacking'].map((mentality) => (
                  <button
                    key={mentality}
                    type="button"
                    onClick={() => {
                      dispatch({ type: 'SET_TACTIC', key: 'mentality', value: mentality })
                      push(`Mentality set to ${mentality.toLowerCase()}.`, 'info')
                    }}
                    className={cn(
                      'rounded-lg border px-1 py-2 text-[10px] font-semibold transition',
                      state.tactics.mentality === mentality
                        ? 'border-lime-400/30 bg-lime-400/[0.1] text-lime-200'
                        : 'border-white/[0.06] bg-white/[0.02] text-mist-500 hover:border-white/[0.12] hover:text-mist-300',
                    )}
                  >
                    {mentality}
                  </button>
                ))}
              </div>
              <div className="mt-4 space-y-3.5">
                {[
                  ['Pressing intensity', 'pressing', state.tactics.pressing],
                  ['Tempo', 'tempo', state.tactics.tempo],
                  ['Defensive line', 'line', state.tactics.line],
                ].map(([label, key, value]) => (
                  <label key={key} className="block">
                    <span className="mb-1.5 flex items-center justify-between text-[10px]">
                      <span className="text-mist-400">{label}</span>
                      <span className="font-bold tabular-nums text-mist-300">{value}</span>
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={value}
                      onChange={(event) => dispatch({ type: 'SET_TACTIC', key, value: Number(event.target.value) })}
                      className="range w-full"
                    />
                  </label>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3 px-5 pt-5 sm:px-6">
          <div>
            <p className="eyebrow">Full squad</p>
            <h2 className="mt-1 font-display text-[17px] font-semibold text-mist-50">Player list</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-mist-600" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search squad…"
                className="h-8 w-44 rounded-lg border border-white/[0.07] bg-white/[0.03] pl-8 pr-2.5 text-[11px] text-mist-100 outline-none transition placeholder:text-mist-600 focus:border-lime-400/35"
              />
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="h-8 appearance-none rounded-lg border border-white/[0.07] bg-white/[0.03] pl-3 pr-7 text-[10.5px] font-semibold text-mist-300 outline-none focus:border-lime-400/35"
              >
                <option value="rating" className="bg-ink-900">Sort: Rating</option>
                <option value="form" className="bg-ink-900">Sort: Form</option>
                <option value="value" className="bg-ink-900">Sort: Value</option>
                <option value="age" className="bg-ink-900">Sort: Age</option>
                <option value="fitness" className="bg-ink-900">Sort: Fitness</option>
                <option value="name" className="bg-ink-900">Sort: Name</option>
              </select>
              <ArrowUpDown size={11} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-mist-500" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto px-5 py-3 scrollbar-none sm:px-6">
          {POSITION_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setPositionFilter(filter)}
              className={cn(
                'shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition',
                positionFilter === filter
                  ? 'border-lime-400/25 bg-lime-400/[0.1] text-lime-200'
                  : 'border-white/[0.06] bg-white/[0.02] text-mist-500 hover:text-mist-300',
              )}
            >
              {filter}
            </button>
          ))}
          <span className="ml-auto shrink-0 text-[9.5px] text-mist-600">{filteredSquad.length} players</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <thead>
              <tr className="border-y border-white/[0.055] text-[8.5px] font-bold uppercase tracking-[0.12em] text-mist-600">
                <th className="py-2.5 pl-5 pr-2 font-bold sm:pl-6">Player</th>
                <th className="px-2 py-2.5 font-bold">Pos</th>
                <th className="px-2 py-2.5 text-center font-bold">OVR</th>
                <th className="px-2 py-2.5 font-bold">Fitness</th>
                <th className="px-2 py-2.5 text-center font-bold">Form</th>
                <th className="px-2 py-2.5 text-center font-bold">Apps</th>
                <th className="px-2 py-2.5 text-center font-bold">G / A</th>
                <th className="px-2 py-2.5 text-right font-bold">Value</th>
                <th className="py-2.5 pl-2 pr-5 text-right font-bold sm:pr-6"> </th>
              </tr>
            </thead>
            <tbody>
              {filteredSquad.map((player) => {
                const inXI = state.lineup.includes(player.id)
                return (
                  <tr
                    key={player.id}
                    className={cn('group border-b border-white/[0.04] transition last:border-0 hover:bg-white/[0.025]', inXI && 'bg-lime-400/[0.018]')}
                  >
                    <td className="py-2 pl-5 pr-2 sm:pl-6">
                      <button type="button" onClick={() => setSelected(player)} className="flex items-center gap-2.5 text-left">
                        <div className="relative">
                          <PlayerAvatar player={player} size={30} />
                          {inXI && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-ink-850 bg-lime-400" />}
                        </div>
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 truncate text-[11.5px] font-semibold text-mist-200 group-hover:text-mist-50">
                            {player.name}
                            {inXI && <span className="text-[8px] font-bold uppercase tracking-[0.08em] text-lime-300/80">XI</span>}
                          </p>
                          <p className="text-[9px] text-mist-500">{player.flag} {player.nation} · {player.age}y</p>
                        </div>
                      </button>
                    </td>
                    <td className="px-2 py-2"><PositionBadge pos={player.pos} className="min-w-[26px] px-1.5 text-[9px]" /></td>
                    <td className="px-2 py-2 text-center"><RatingBadge value={player.rating} size="sm" /></td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={player.fitness} height="h-1" tone={player.fitness >= 85 ? 'lime' : player.fitness >= 70 ? 'amber' : 'rose'} className="w-14" />
                        <span className="text-[9.5px] font-semibold tabular-nums text-mist-400">{player.fitness}%</span>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className="font-display text-[11px] font-bold text-mist-200">{Number(player.form).toFixed(1)}</span>
                    </td>
                    <td className="px-2 py-2 text-center text-[10.5px] tabular-nums text-mist-400">{player.apps}</td>
                    <td className="px-2 py-2 text-center text-[10.5px] tabular-nums text-mist-400">{player.goals} / {player.assists}</td>
                    <td className="px-2 py-2 text-right text-[10.5px] font-semibold tabular-nums text-mist-300">{formatMoney(player.value)}</td>
                    <td className="py-2 pl-2 pr-5 text-right sm:pr-6">
                      {!inXI ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPendingBench(player.id)
                            document.getElementById('squad-pitch')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                            push(`Select a starter to replace with ${player.name}.`, 'info')
                          }}
                          className="rounded-md border border-white/[0.06] bg-white/[0.025] px-2 py-1 text-[9px] font-semibold text-mist-400 opacity-0 transition group-hover:opacity-100 hover:border-lime-400/30 hover:text-lime-300"
                        >
                          Swap in
                        </button>
                      ) : (
                        <span className="text-[8.5px] font-bold uppercase tracking-[0.08em] text-lime-300/60">Starter</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filteredSquad.length === 0 && (
          <EmptyState icon={Search} title="No players found" description="Try a different name or position filter." />
        )}
      </Card>

      <PlayerModal
        player={selected}
        onClose={() => setSelected(null)}
        inLineup={selected ? state.lineup.includes(selected.id) : false}
        action={
          selected && !state.lineup.includes(selected.id) ? (
            <Button variant="primary" size="sm" icon={ArrowLeftRight} onClick={() => chooseForXI(selected)}>Select for XI</Button>
          ) : null
        }
      />
    </div>
  )
}
