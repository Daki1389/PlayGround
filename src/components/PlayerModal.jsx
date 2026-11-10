import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BadgeCheck, CalendarDays, HeartPulse, Shirt, Sparkles, TrendingUp, Wallet } from 'lucide-react'
import ClubBadge from './ClubBadge'
import Modal from './Modal'
import StatBar from './StatBar'
import { useGame } from '../context/GameContext'
import { initials, money, positionTone } from '../lib/format'

const ATTRIBUTES = [
  { key: 'pace', label: 'Pace', tone: 'sky' },
  { key: 'shooting', label: 'Finishing', tone: 'rose' },
  { key: 'passing', label: 'Passing', tone: 'lime' },
  { key: 'dribbling', label: 'Dribbling', tone: 'violet' },
  { key: 'defending', label: 'Defending', tone: 'amber' },
  { key: 'physical', label: 'Physical', tone: 'white' }
]

export default function PlayerModal() {
  const { playerModal, closePlayer, purchasePlayer, data } = useGame()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const player = playerModal?.player
  const signable = Boolean(playerModal?.signable)

  useEffect(() => {
    setConfirming(false)
    setBusy(false)
  }, [player?.id])

  if (!player) return null

  const isOwn = Number(player.team_id) === Number(data?.user?.id)
  const affordable = Number(data?.user?.budget || 0) >= Number(player.market_value || 0)
  const shortfall = Number(player.market_value || 0) - Number(data?.user?.budget || 0)
  const teamColor = player.team_color || player.primary_color || '#c9f75c'

  async function handleSign() {
    if (!confirming) {
      setConfirming(true)
      return
    }
    setBusy(true)
    try {
      await purchasePlayer(player.id)
      closePlayer()
    } catch {
      setBusy(false)
      setConfirming(false)
    }
  }

  return (
    <Modal open={Boolean(player)} onClose={closePlayer} width="max-w-2xl" labelledBy="player-modal-title">
      <div
        className="relative border-b border-white/[0.07] px-5 pb-5 pt-6 sm:px-7"
        style={{
          background: `radial-gradient(ellipse 90% 120% at 20% -20%, ${teamColor}2e, transparent 62%), linear-gradient(180deg, rgba(255,255,255,0.03), transparent)`
        }}
      >
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-ink-950/70">
              <span className="display-title text-2xl text-white">{initials(player.name)}</span>
            </div>
            <span className={`absolute -bottom-2 -right-2 rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1 ring-inset ${positionTone(player.position)}`}>
              {player.position}
            </span>
          </div>
          <div className="min-w-0 pr-8">
            <div className="mb-1 flex items-center gap-2">
              <span className="eyebrow text-white/50">Player profile</span>
              <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold text-mist">#{player.shirt_number || '—'}</span>
            </div>
            <h2 id="player-modal-title" className="display-title truncate text-3xl">{player.name}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mist">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={13} /> {player.age} years
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Shirt size={13} /> {player.nationality || '—'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ClubBadge team={{ name: player.team_name, short_name: player.team_short_name, primary_color: player.team_color }} size={12} />
                {player.team_name || 'Free agent'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-7">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="rounded-xl border border-lime/20 bg-lime/[0.06] p-3">
            <p className="eyebrow text-[9px] text-lime/60">Overall</p>
            <p className="num text-3xl font-semibold text-lime">{player.overall_rating}</p>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
            <p className="eyebrow text-[9px]">Potential</p>
            <p className="num text-3xl font-semibold text-white">{player.potential_rating}</p>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
            <p className="eyebrow text-[9px]">Value</p>
            <p className="num text-2xl font-semibold text-white">{money(player.market_value)}</p>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
            <p className="eyebrow text-[9px]">Wage</p>
            <p className="num text-2xl font-semibold text-white">{money(player.wage)}<span className="ml-0.5 text-[10px] font-sans font-medium text-mist">/wk</span></p>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-slate-300">Attributes</h3>
            <span className="text-[10px] text-mist-dim">Rating out of 99</span>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-3.5 sm:grid-cols-2">
            {ATTRIBUTES.map(attribute => (
              <StatBar
                key={attribute.key}
                label={attribute.label}
                value={player[attribute.key] ?? 0}
                tone={attribute.tone}
                compact
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:grid-cols-2">
          <StatBar label="Stamina" value={player.stamina} tone="lime" compact />
          <StatBar label="Morale" value={player.morale} tone="sky" compact />
          <div className="flex items-center gap-2 text-[11px] text-mist sm:col-span-2">
            <HeartPulse size={13} className="text-lime" />
            {player.morale >= 85 ? 'Feeling great and ready to start.' : player.morale >= 70 ? 'In good spirits around the training ground.' : 'Could use a run of games to lift morale.'}
          </div>
        </div>

        {signable && !isOwn && (
          <div className="rounded-xl border border-white/[0.07] bg-ink-950/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="eyebrow text-[9px]">Asking price</p>
                <p className="num text-3xl font-semibold text-white">{money(player.market_value)}</p>
              </div>
              <div className="text-right">
                <p className="eyebrow text-[9px]">Your budget</p>
                <p className={`num text-xl font-semibold ${affordable ? 'text-lime' : 'text-red-300'}`}>{money(data?.user?.budget)}</p>
              </div>
            </div>
            {!affordable && (
              <p className="mb-3 flex items-center gap-2 text-xs text-red-300">
                <Wallet size={13} /> You are {money(shortfall)} short of this transfer fee.
              </p>
            )}
            <div className="flex gap-2">
              <button onClick={closePlayer} className="btn-secondary flex-1">Keep scouting</button>
              <button
                onClick={handleSign}
                disabled={!affordable || busy}
                className={`btn flex-[1.4] ${confirming ? 'bg-lime text-ink-950 ring-2 ring-lime/40' : 'btn-primary'}`}
              >
                {busy ? 'Completing medical…' : confirming ? `Confirm ${money(player.market_value)} signing` : 'Sign player'}
              </button>
            </div>
          </div>
        )}

        {isOwn && (
          <div className="flex items-center gap-2 rounded-xl border border-lime/15 bg-lime/[0.04] px-4 py-3 text-xs text-lime/90">
            <BadgeCheck size={15} /> Contracted to {data?.user?.name}. Available for selection.
          </div>
        )}

        {!signable && !isOwn && (
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs text-mist">
            <Sparkles size={14} className="text-lime" /> Scout report sealed. Open the transfer market to make a move.
          </div>
        )}

        <div className="flex items-center gap-2 text-[10px] text-mist-dim">
          <TrendingUp size={12} /> Potential {player.potential_rating >= 85 ? 'elite' : player.potential_rating >= 78 ? 'high' : 'steady'} · {player.age <= 21 ? 'One for the future' : player.age <= 28 ? 'In peak years' : 'Experienced head'}
        </div>
      </div>
    </Modal>
  )
}
