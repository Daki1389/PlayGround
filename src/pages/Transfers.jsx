import { useMemo, useState } from 'react'
import {
  ArrowDownUp,
  BadgeEuro,
  ChevronDown,
  CircleDollarSign,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'
import { useGame } from '../context/GameContext'
import { formatMoney, formatWageBill, cn } from '../lib/format'
import PlayerAvatar from '../components/PlayerAvatar'
import Modal from '../components/Modal'
import {
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  PositionBadge,
  ProgressBar,
  RatingBadge,
  SectionTitle,
} from '../components/ui'
import { useToast } from '../components/Toast'
import { getWageBill } from '../lib/engine'

const FILTERS = ['All', 'GK', 'DEF', 'MID', 'ATT']

function matchesFilter(player, filter) {
  if (filter === 'All') return true
  if (filter === 'GK') return player.pos === 'GK'
  if (filter === 'DEF') return ['CB', 'RB', 'LB'].includes(player.pos)
  if (filter === 'MID') return ['DM', 'CM', 'AM', 'RW', 'LW'].includes(player.pos)
  if (filter === 'ATT') return player.pos === 'ST'
  return true
}

function OfferModal({ player, mode, onClose, onSign }) {
  const { state } = useGame()
  const { push } = useToast()
  const [offer, setOffer] = useState(player?.askingPrice ?? 0)
  const [message, setMessage] = useState(null)

  if (!player) return null
  const minimum = Math.round(player.marketValue ?? player.value * 0.6)
  const maximum = Math.round(player.askingPrice * 1.15)
  const remaining = state.funds - offer
  const wageBill = getWageBill(state)

  const sign = (fee, label = 'Transfer complete') => {
    if (fee > state.funds) {
      setMessage({ type: 'error', text: `Not enough funds. You need ${formatMoney(fee - state.funds)} more.` })
      return
    }
    onSign(player, fee)
    push(label, 'success', { title: `${player.name} is a Green!` })
    onClose()
  }

  const submitBid = () => {
    if (offer > state.funds) {
      setMessage({ type: 'error', text: 'That bid exceeds the available transfer budget.' })
      return
    }
    if (offer >= player.askingPrice * 0.985) {
      sign(offer, `Bid accepted at ${formatMoney(offer)}.`)
      return
    }
    if (offer >= player.askingPrice * 0.88 && Math.random() > 0.42) {
      sign(offer, `Bid accepted at ${formatMoney(offer)}.`)
      return
    }
    if (offer >= player.askingPrice * 0.75) {
      setMessage({ type: 'error', text: `${player.club} have rejected the bid but will negotiate around ${formatMoney(Math.round(player.askingPrice * 0.92))}.` })
    } else {
      setMessage({ type: 'error', text: `${player.club} rejected the offer out of hand. It will take a serious bid to land ${player.name}.` })
    }
  }

  return (
    <Modal
      open={Boolean(player)}
      onClose={onClose}
      eyebrow={`${player.club} · ${player.clubCountry}`}
      title={player.name}
      subtitle={`${player.pos} · ${player.age} years · ${player.nation}`}
      size="md"
    >
      <div className="p-5">
        <div className="flex items-center gap-3.5 rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.045] to-transparent p-3.5">
          <PlayerAvatar player={player} size={50} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-display text-[14px] font-semibold text-mist-50">{player.name}</p>
              <PositionBadge pos={player.pos} />
            </div>
            <p className="mt-1 text-[10px] text-mist-500">{player.apps} apps · {player.goals} goals · {player.assists} assists</p>
          </div>
          <RatingBadge value={player.rating} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            ['Market value', formatMoney(player.marketValue || player.value)],
            ['Asking price', formatMoney(player.askingPrice)],
            ['Wage demand', `${formatMoney(player.wage)} / wk`],
            ['Contract', player.contract],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-white/[0.055] bg-white/[0.02] px-3 py-2.5">
              <p className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-mist-600">{label}</p>
              <p className="mt-0.5 text-[11.5px] font-semibold text-mist-200">{value}</p>
            </div>
          ))}
        </div>

        {mode === 'bid' ? (
          <div className="mt-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="eyebrow">Your offer</p>
                <p className="mt-1 font-display text-2xl font-semibold text-lime-300">{formatMoney(offer)}</p>
              </div>
              <span className={cn('text-[10px] font-semibold', remaining >= 0 ? 'text-mist-500' : 'text-rose-300')}>
                {remaining >= 0 ? `${formatMoney(remaining)} budget left` : `${formatMoney(Math.abs(remaining))} over budget`}
              </span>
            </div>
            <input
              type="range"
              min={minimum}
              max={maximum}
              step={100000}
              value={offer}
              onChange={(event) => {
                setOffer(Number(event.target.value))
                setMessage(null)
              }}
              className="range mt-3 w-full"
            />
            <div className="mt-1.5 flex justify-between text-[8.5px] text-mist-600">
              <span>{formatMoney(minimum)}</span>
              <span>Asking {formatMoney(player.askingPrice)}</span>
              <span>{formatMoney(maximum)}</span>
            </div>
            {message && (
              <div className={cn('mt-3 rounded-lg border px-3 py-2 text-[10.5px] leading-relaxed', message.type === 'error' ? 'border-rose-400/20 bg-rose-400/[0.06] text-rose-200' : 'border-lime-400/20 bg-lime-400/[0.06] text-lime-200')}>
                {message.text}
              </div>
            )}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button variant="secondary" size="md" className="flex-1" onClick={submitBid}>Submit bid</Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                icon={ShieldCheck}
                onClick={() => sign(player.askingPrice, `Asking price met at ${formatMoney(player.askingPrice)}.`)}
              >
                Sign at asking
              </Button>
            </div>
            <p className="mt-2.5 text-center text-[9px] text-mist-600">Bids above 88% of the asking price have a strong chance of being accepted.</p>
          </div>
        ) : (
          <div className="mt-5">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-mist-400">Transfer fee</span>
                <span className="font-bold text-mist-100">{formatMoney(player.askingPrice)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-mist-400">Budget after deal</span>
                <span className={cn('font-bold', state.funds - player.askingPrice >= 0 ? 'text-lime-300' : 'text-rose-300')}>
                  {formatMoney(state.funds - player.askingPrice)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-mist-400">New wage bill</span>
                <span className="font-bold text-mist-200">{formatWageBill(wageBill + player.wage)} / wk</span>
              </div>
              <div className="mt-3">
                <ProgressBar value={state.funds ? Math.min(100, (player.askingPrice / state.funds) * 100) : 100} height="h-1" />
                <p className="mt-1.5 text-[8.5px] text-mist-600">Share of the remaining transfer budget</p>
              </div>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="mt-4 w-full"
              icon={UserPlus}
              disabled={player.askingPrice > state.funds}
              onClick={() => sign(player.askingPrice)}
            >
              {player.askingPrice > state.funds ? 'Insufficient funds' : `Confirm signing · ${formatMoney(player.askingPrice)}`}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default function Transfers() {
  const { state, dispatch, wageBill } = useGame()
  const { push } = useToast()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [sortBy, setSortBy] = useState('rating')
  const [affordableOnly, setAffordableOnly] = useState(false)
  const [modal, setModal] = useState(null)

  const targets = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return state.transferTargets
      .filter((player) => matchesFilter(player, filter))
      .filter((player) => !needle || `${player.name} ${player.club} ${player.pos}`.toLowerCase().includes(needle))
      .filter((player) => !affordableOnly || player.askingPrice <= state.funds)
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating
        if (sortBy === 'value') return b.askingPrice - a.askingPrice
        if (sortBy === 'age') return a.age - b.age
        if (sortBy === 'wage') return b.wage - a.wage
        return 0
      })
  }, [state.transferTargets, state.funds, query, filter, sortBy, affordableOnly])

  const marquee = state.transferTargets[0]
  const wageHeadroom = Math.max(0, 2_550_000 - wageBill)
  const positionsOfNeed = ['LB', 'ST', 'DM']

  const signPlayer = (player, fee) => {
    dispatch({ type: 'SIGN_PLAYER', player, fee })
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        eyebrow={`Winter window · ${state.season}`}
        title="Transfer Market"
        description="Find the missing piece. The board has backed you with funds — spend wisely and build a title-winning squad."
        action={
          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2">
              <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-mist-600">Transfer budget</p>
              <p className="font-display text-[16px] font-semibold leading-tight text-lime-300">{formatMoney(state.funds)}</p>
            </div>
            <Badge variant="lime" dot>Window open</Badge>
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-12">
        {marquee ? (
          <Card className="relative flex flex-col overflow-hidden border-lime-400/[0.16] xl:col-span-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_88%_-20%,rgba(198,245,109,0.19),transparent_52%),linear-gradient(120deg,rgba(13,92,63,0.35),transparent_60%)]" />
            <div className="pointer-events-none absolute -right-4 -top-10 select-none font-display text-[190px] font-bold leading-none tracking-[-0.08em] text-white/[0.018]">01</div>
            <div className="relative flex flex-1 flex-col p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative shrink-0">
                  <PlayerAvatar player={marquee} size={78} />
                  <span className="absolute -right-2 -top-2 grid h-7 min-w-7 place-items-center rounded-lg border border-lime-400/25 bg-ink-950 px-1 font-display text-[11px] font-bold text-lime-300">
                    {marquee.rating}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="lime" dot>Priority target</Badge>
                    <PositionBadge pos={marquee.pos} />
                    <span className="text-[10px] text-mist-500">{marquee.flag} {marquee.nation} · {marquee.age} years</span>
                  </div>
                  <h2 className="mt-2 font-display text-[23px] font-semibold tracking-[-0.03em] text-mist-50">{marquee.name}</h2>
                  <p className="mt-1 text-[11px] text-mist-400">{marquee.club} · {marquee.apps} apps · {marquee.goals}G {marquee.assists}A · form {Number(marquee.form).toFixed(1)}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[10.5px]">
                    <span className="text-mist-500">Value <span className="font-semibold text-mist-200">{formatMoney(marquee.marketValue || marquee.value)}</span></span>
                    <span className="text-mist-500">Asking <span className="font-semibold text-lime-300">{formatMoney(marquee.askingPrice)}</span></span>
                    <span className="text-mist-500">Wage <span className="font-semibold text-mist-200">{formatMoney(marquee.wage)}/wk</span></span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-stretch">
                  <Button variant="primary" size="sm" icon={BadgeEuro} onClick={() => setModal({ player: marquee, mode: 'bid' })}>Make bid</Button>
                  <Button variant="secondary" size="sm" icon={UserPlus} onClick={() => setModal({ player: marquee, mode: 'sign' })}>Sign</Button>
                </div>
              </div>

              <div className="mt-5 grid flex-1 content-center gap-3 sm:grid-cols-3">
                {(marquee.pos === 'GK'
                  ? [['Reflexes', 2], ['Handling', 1], ['Distribution', 4]]
                  : [['Pace', 2], ['Technique', 4], ['Game IQ', 1]]
                ).map(([label, bonus]) => {
                  const value = Math.min(99, marquee.rating + bonus)
                  return (
                    <div key={label} className="rounded-lg border border-white/[0.055] bg-white/[0.022] px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-mist-600">{label}</p>
                        <p className="font-display text-[12px] font-semibold tabular-nums text-mist-200">{value}</p>
                      </div>
                      <ProgressBar value={value} height="h-1" className="mt-2" />
                    </div>
                  )
                })}
              </div>

              <div className="pt-5">
                <Divider className="mb-4" />
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  {[
                    ['Apps', marquee.apps],
                    ['Goals', marquee.goals],
                    ['Assists', marquee.assists],
                    ['Form', Number(marquee.form).toFixed(1)],
                    ['Fitness', `${marquee.fitness}%`],
                    ['Morale', `${marquee.morale}`],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[8px] font-bold uppercase tracking-[0.11em] text-mist-600">{label}</p>
                      <p className="mt-0.5 font-display text-[13px] font-semibold tabular-nums text-mist-200">{value}</p>
                    </div>
                  ))}
                  <div className="ml-auto flex items-center gap-2.5 rounded-lg border border-lime-400/[0.18] bg-lime-400/[0.055] px-3 py-2">
                    <Target size={14} className="shrink-0 text-lime-300" />
                    <div>
                      <p className="text-[8px] font-bold uppercase tracking-[0.11em] text-lime-300/80">Scout verdict</p>
                      <p className="mt-0.5 text-[10px] font-medium text-mist-300">Elite creator · top 3% for chances created</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="xl:col-span-8">
            <EmptyState icon={UserPlus} title="Shortlist complete" description="You have signed every player on the shortlist. New targets will arrive when the window reopens." />
          </Card>
        )}

        <Card className="xl:col-span-4">
          <div className="border-b border-white/[0.055] px-5 py-4">
            <p className="eyebrow">Window dashboard</p>
            <h2 className="mt-1 font-display text-[16px] font-semibold text-mist-50">Deal room</h2>
          </div>
          <div className="p-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-mist-600">Time remaining</p>
                <p className="mt-1 font-display text-2xl font-semibold text-mist-50">18 <span className="text-[11px] font-semibold text-mist-500">days</span></p>
              </div>
              <Badge variant="amber">Deadline: 31 Jan</Badge>
            </div>
            <ProgressBar value={38} height="h-1.5" className="mt-3" tone="amber" />
            <div className="mt-5 grid grid-cols-2 gap-2">
              {[
                ['Targets', state.transferTargets.length, Users],
                ['Wage room', formatMoney(wageHeadroom), CircleDollarSign],
                ['Squad size', state.squad.length, Users],
                ['Deals done', state.transfersCompleted, ArrowDownUp],
              ].map(([label, value, Icon]) => (
                <div key={label} className="rounded-lg border border-white/[0.055] bg-white/[0.02] p-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-mist-600">{label}</p>
                    <Icon size={11} className="text-mist-600" />
                  </div>
                  <p className="mt-1 font-display text-[14px] font-semibold text-mist-200">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-white/[0.055] bg-white/[0.02] p-3">
              <div className="flex items-center justify-between">
                <p className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-mist-600">Scouting priority</p>
                <span className="text-[9px] font-semibold text-lime-300">Level 2</span>
              </div>
              <div className="mt-2 flex gap-1.5">
                {positionsOfNeed.map((pos) => <PositionBadge key={pos} pos={pos} />)}
              </div>
              <p className="mt-2 text-[9px] leading-relaxed text-mist-500">Your scouts recommend adding cover at left-back and a clinical alternative up front.</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 sm:px-6">
          <div>
            <p className="eyebrow">Shortlist</p>
            <h2 className="mt-1 font-display text-[17px] font-semibold text-mist-50">Available players</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-mist-600" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search players or clubs…"
                className="h-8 w-52 rounded-lg border border-white/[0.07] bg-white/[0.03] pl-8 pr-2.5 text-[11px] text-mist-100 outline-none transition placeholder:text-mist-600 focus:border-lime-400/35"
              />
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="h-8 appearance-none rounded-lg border border-white/[0.07] bg-white/[0.03] pl-3 pr-7 text-[10.5px] font-semibold text-mist-300 outline-none focus:border-lime-400/35"
              >
                <option value="rating" className="bg-ink-900">Sort: Rating</option>
                <option value="value" className="bg-ink-900">Sort: Price</option>
                <option value="age" className="bg-ink-900">Sort: Age</option>
                <option value="wage" className="bg-ink-900">Sort: Wage</option>
              </select>
              <ChevronDown size={11} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-mist-500" />
            </div>
            <button
              type="button"
              onClick={() => setAffordableOnly((value) => !value)}
              className={cn(
                'h-8 rounded-lg border px-2.5 text-[10px] font-semibold transition',
                affordableOnly ? 'border-lime-400/25 bg-lime-400/[0.09] text-lime-200' : 'border-white/[0.07] bg-white/[0.03] text-mist-500 hover:text-mist-300',
              )}
            >
              Affordable only
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto px-5 py-3.5 scrollbar-none sm:px-6">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={cn(
                'shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition',
                filter === item ? 'border-lime-400/25 bg-lime-400/[0.1] text-lime-200' : 'border-white/[0.06] bg-white/[0.02] text-mist-500 hover:text-mist-300',
              )}
            >
              {item}
            </button>
          ))}
          <span className="ml-auto shrink-0 text-[9.5px] text-mist-600">{targets.length} players listed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left">
            <thead>
              <tr className="border-y border-white/[0.055] text-[8.5px] font-bold uppercase tracking-[0.12em] text-mist-600">
                <th className="py-2.5 pl-5 pr-2 font-bold sm:pl-6">Player</th>
                <th className="px-2 py-2.5 font-bold">Club</th>
                <th className="px-2 py-2.5 font-bold">Pos</th>
                <th className="px-2 py-2.5 text-center font-bold">Age</th>
                <th className="px-2 py-2.5 text-center font-bold">OVR</th>
                <th className="px-2 py-2.5 text-right font-bold">Value</th>
                <th className="px-2 py-2.5 text-right font-bold">Asking</th>
                <th className="px-2 py-2.5 text-right font-bold">Wage</th>
                <th className="py-2.5 pl-2 pr-5 text-right font-bold sm:pr-6">Action</th>
              </tr>
            </thead>
            <tbody>
              {targets.map((player) => (
                <tr key={player.id} className="group border-b border-white/[0.04] transition last:border-0 hover:bg-white/[0.025]">
                  <td className="py-2 pl-5 pr-2 sm:pl-6">
                    <div className="flex items-center gap-2.5">
                      <PlayerAvatar player={player} size={30} />
                      <div className="min-w-0">
                        <p className="truncate text-[11.5px] font-semibold text-mist-200">{player.name}</p>
                        <p className="text-[9px] text-mist-500">{player.flag} {player.nation} · {player.apps} apps</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-[10.5px] text-mist-400">{player.club}</td>
                  <td className="px-2 py-2"><PositionBadge pos={player.pos} className="min-w-[26px] px-1.5 text-[9px]" /></td>
                  <td className="px-2 py-2 text-center text-[10.5px] tabular-nums text-mist-400">{player.age}</td>
                  <td className="px-2 py-2 text-center"><RatingBadge value={player.rating} size="sm" /></td>
                  <td className="px-2 py-2 text-right text-[10.5px] font-semibold tabular-nums text-mist-300">{formatMoney(player.marketValue || player.value)}</td>
                  <td className="px-2 py-2 text-right text-[10.5px] font-semibold tabular-nums text-lime-300">{formatMoney(player.askingPrice)}</td>
                  <td className="px-2 py-2 text-right text-[10.5px] tabular-nums text-mist-400">{formatMoney(player.wage)}</td>
                  <td className="py-2 pl-2 pr-5 sm:pr-6">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setModal({ player, mode: 'bid' })}
                        className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[9px] font-semibold text-mist-300 transition hover:border-lime-400/30 hover:text-lime-200"
                      >
                        Bid
                      </button>
                      <button
                        type="button"
                        onClick={() => setModal({ player, mode: 'sign' })}
                        className="rounded-md border border-lime-400/25 bg-lime-400/[0.09] px-2 py-1 text-[9px] font-semibold text-lime-200 transition hover:bg-lime-400/[0.16]"
                      >
                        Sign
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {targets.length === 0 && (
          <EmptyState
            icon={Search}
            title="No players match"
            description="Adjust your filters or turn off the affordable-only switch."
            action={<Button variant="secondary" size="sm" onClick={() => { setFilter('All'); setQuery(''); setAffordableOnly(false) }}>Clear filters</Button>}
          />
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: TrendingUp, title: 'Market intelligence', text: 'Premier League clubs are monitoring Rafael Mendes. A strong season could raise his value above €60M.' },
          { icon: Sparkles, title: 'Scout recommendation', text: 'Mateus Silva tops the shortlist. His chance creation numbers are in the top 3% of the league.' },
          { icon: ShieldCheck, title: 'Financial fair play', text: 'Ashcombe remain comfortably within the wage structure with €0.71M of headroom each week.' },
        ].map(({ icon: Icon, title, text }) => (
          <Card key={title} className="p-4">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg border border-white/[0.06] bg-white/[0.035] text-lime-300"><Icon size={13} /></span>
              <p className="text-[11px] font-semibold text-mist-200">{title}</p>
            </div>
            <p className="mt-2 text-[9.5px] leading-relaxed text-mist-500">{text}</p>
          </Card>
        ))}
      </div>

      {modal && (
        <OfferModal
          player={modal.player}
          mode={modal.mode}
          onClose={() => setModal(null)}
          onSign={signPlayer}
        />
      )}
    </div>
  )
}
