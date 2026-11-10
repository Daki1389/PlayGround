import { BadgeCheck, CalendarDays, HeartPulse, Shirt, Sparkles, TrendingUp, Wallet } from 'lucide-react'
import Modal from './Modal'
import PlayerAvatar from './PlayerAvatar'
import { Badge, Button, Divider, PositionBadge, ProgressBar } from './ui'
import { getPlayerAttributes } from '../lib/engine'
import { formatMoney } from '../lib/format'

const ATTRIBUTE_LABELS = [
  ['pace', 'Pace'],
  ['shooting', 'Shooting'],
  ['passing', 'Passing'],
  ['defending', 'Defending'],
  ['physical', 'Physical'],
  ['goalkeeping', 'Goalkeeping'],
]

export default function PlayerModal({ player, onClose, action, extraActions, inLineup = false }) {
  if (!player) return null
  const attributes = getPlayerAttributes(player)
  const visibleAttributes = player.pos === 'GK'
    ? ATTRIBUTE_LABELS.filter(([key]) => ['goalkeeping', 'passing', 'physical', 'pace'].includes(key))
    : ATTRIBUTE_LABELS.filter(([key]) => key !== 'goalkeeping')

  return (
    <Modal
      open={Boolean(player)}
      onClose={onClose}
      eyebrow={player.club || 'Ashcombe United'}
      title={player.name}
      subtitle={`${player.flag || ''} ${player.nation || '—'} · ${player.age} years old · ${player.foot || 'Right'}-footed`}
      size="lg"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-[11px] text-mist-400">
            <span className="inline-flex items-center gap-1.5"><Wallet size={13} /> {formatMoney(player.value)}</span>
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} /> Contract {player.contract || '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            {extraActions}
            {action}
            <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
          </div>
        </div>
      }
    >
      <div className="p-5 sm:p-6">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-emerald-950/60 via-ink-850 to-ink-900 p-5">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-lime-400/[0.07] blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="relative">
                <PlayerAvatar player={player} size={76} />
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-md border border-white/10 bg-ink-950 px-1.5 text-[9px] font-bold text-mist-300">
                  #{player.shirt || '—'}
                </span>
              </div>
              <div className="sm:hidden">
                <h3 className="font-display text-xl font-semibold text-mist-50">{player.name}</h3>
                <div className="mt-2 flex items-center gap-2">
                  <PositionBadge pos={player.pos} />
                  {inLineup && <Badge variant="lime">Starting XI</Badge>}
                </div>
              </div>
            </div>
            <div className="hidden min-w-0 flex-1 sm:block">
              <div className="mb-2 flex items-center gap-2">
                <PositionBadge pos={player.pos} />
                {inLineup ? <Badge variant="lime">Starting XI</Badge> : <Badge variant="slate">Squad player</Badge>}
                {player.rating >= 82 && <Badge variant="violet"><Sparkles size={10} /> Key player</Badge>}
              </div>
              <p className="max-w-md text-[12.5px] leading-relaxed text-mist-400">
                {player.name.split(' ')[0]} is a {player.rating >= 80 ? 'elite' : 'valuable'} {player.pos} option for
                Ashcombe, known for {attributes.passing >= attributes.physical ? 'composure in possession' : 'a powerful physical presence'} and
                {' '}{attributes.pace >= 70 ? 'dangerous movement' : 'intelligent positioning'}.
              </p>
            </div>
            <div className="flex items-center gap-4 sm:ml-auto sm:block sm:text-right">
              <p className="eyebrow">Overall</p>
              <div className="mt-1 flex items-baseline gap-1 sm:justify-end">
                <span className="font-display text-4xl font-bold tracking-[-0.04em] text-lime-300">{player.rating}</span>
                <span className="text-[11px] font-semibold text-mist-500">/ 99</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            ['Apps', player.apps ?? 0, 'Season'],
            ['Goals', player.goals ?? 0, 'Season'],
            ['Assists', player.assists ?? 0, 'Season'],
            ['Avg. rating', Number(player.form || 6.5).toFixed(1), 'Last 5'],
          ].map(([label, value, sub]) => (
            <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-mist-500">{label}</p>
              <p className="mt-1 font-display text-xl font-semibold text-mist-100">{value}</p>
              <p className="text-[10px] text-mist-500">{sub}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-6 sm:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-display text-[13px] font-semibold text-mist-100">Attributes</h4>
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mist-500">Role profile</span>
            </div>
            <div className="space-y-3">
              {visibleAttributes.map(([key, label]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-[74px] shrink-0 text-[11px] text-mist-400">{label}</span>
                  <ProgressBar
                    value={attributes[key]}
                    height="h-1.5"
                    tone={attributes[key] >= 80 ? 'lime' : attributes[key] >= 70 ? 'emerald' : 'sky'}
                    className="flex-1"
                  />
                  <span className="w-6 text-right text-[11px] font-bold tabular-nums text-mist-200">{attributes[key]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-display text-[13px] font-semibold text-mist-100">Condition</h4>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-mist-400"><HeartPulse size={13} /> Fitness</span>
                <span className="text-[11px] font-bold text-lime-300">{player.fitness}%</span>
              </div>
              <ProgressBar value={player.fitness} height="h-1.5" tone={player.fitness >= 85 ? 'lime' : player.fitness >= 70 ? 'amber' : 'rose'} />
              <div className="mt-4 mb-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-mist-400"><BadgeCheck size={13} /> Morale</span>
                <span className="text-[11px] font-bold text-mist-200">{player.morale}%</span>
              </div>
              <ProgressBar value={player.morale} height="h-1.5" tone="sky" />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 py-3">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-mist-400"><Wallet size={13} /> Weekly wage</span>
              <span className="text-[11px] font-bold text-mist-100">{formatMoney(player.wage)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 py-3">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-mist-400"><TrendingUp size={13} /> Market value</span>
              <span className="text-[11px] font-bold text-mist-100">{formatMoney(player.value)}</span>
            </div>
          </div>
        </div>

        <Divider className="my-5" />
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-mist-500">
          <span className="inline-flex items-center gap-1.5"><Shirt size={12} /> {player.height || '—'} · #{player.shirt}</span>
          <span>Ashcombe United · {player.contract ? `Contract until ${player.contract}` : 'Squad member'}</span>
        </div>
      </div>
    </Modal>
  )
}
