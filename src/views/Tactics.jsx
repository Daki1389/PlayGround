import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Gauge, Network, Save, Shield, Sparkles, Timer, Zap } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatBar from '../components/StatBar'
import { useGame } from '../context/GameContext'
import { selectXI, projectedStrength } from '../lib/lineup'
import { FORMATIONS, PLAY_STYLES, TEMPO_LABELS, getFormation, getStyle } from '../../shared/formations.js'

const STYLE_ICONS = { Zap, Network, Timer, Shield }

const TEMPO_COPY = [
  'Sit on the ball, keep the shape and conserve legs for the closing stages.',
  'A measured rhythm. Controlled possession with selective acceleration.',
  'The default setting. Move the ball at a natural match pace.',
  'Quick transitions and early passes. Stretch the opposition before it settles.',
  'Full-throttle chaos. Maximum chances, maximum exposure.'
]

function MiniPitch({ formation, active, color }) {
  return (
    <svg viewBox="0 0 160 100" className="h-auto w-full" aria-hidden="true">
      <rect x="3" y="3" width="154" height="94" rx="2" fill={active ? 'rgba(201,247,92,0.05)' : 'rgba(255,255,255,0.025)'} stroke={active ? 'rgba(201,247,92,0.35)' : 'rgba(255,255,255,0.12)'} />
      <line x1="80" y1="3" x2="80" y2="97" stroke="rgba(255,255,255,0.12)" />
      <circle cx="80" cy="50" r="9" fill="none" stroke="rgba(255,255,255,0.1)" />
      <rect x="3" y="24" width="16" height="52" fill="none" stroke="rgba(255,255,255,0.1)" />
      <rect x="141" y="24" width="16" height="52" fill="none" stroke="rgba(255,255,255,0.1)" />
      {formation.slots.map((slot, index) => {
        const cx = 9 + ((100 - slot.y) / 100) * 82
        const cy = 10 + (slot.x / 100) * 80
        return (
          <g key={`${slot.role}-${index}`}>
            <circle cx={cx} cy={cy} r={active ? 3.6 : 3} fill={active ? color || '#c9f75c' : 'rgba(255,255,255,0.28)'} />
            {active && <circle cx={cx} cy={cy} r="5.6" fill="none" stroke={color || '#c9f75c'} strokeOpacity="0.22" />}
          </g>
        )
      })}
    </svg>
  )
}

function ShapeBoard({ formation, lineup, color }) {
  return (
    <div className="pitch-surface relative overflow-hidden rounded-xl border border-white/10">
      <div className="pitch-stripes absolute inset-0" />
      <svg viewBox="0 0 1000 625" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <g fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.2">
          <rect x="24" y="24" width="952" height="577" />
          <line x1="500" y1="24" x2="500" y2="601" />
          <circle cx="500" cy="312.5" r="63" />
          <rect x="24" y="151" width="132" height="323" />
          <rect x="844" y="151" width="132" height="323" />
          <rect x="24" y="238" width="52" height="149" />
          <rect x="924" y="238" width="52" height="149" />
        </g>
      </svg>
      <div className="relative aspect-[16/9]">
        {formation.slots.map((slot, index) => {
          const player = lineup.find(row => row.slot === slot.role && row.x === slot.x && row.y === slot.y) || lineup[index]
          const left = 6 + ((100 - slot.y) / 100) * 88
          const top = 8 + (slot.x / 100) * 84
          return (
            <motion.div
              key={`${slot.role}-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: `${left}%`, top: `${top}%` }}
            >
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink-950/70 text-[8px] font-bold text-ink-950 shadow-lg sm:h-9 sm:w-9 sm:text-[10px]"
                style={{ backgroundColor: color }}
              >
                {player?.shirt_number || index + 1}
              </div>
              <span className="mt-0.5 rounded bg-ink-950/80 px-1 text-[7px] font-semibold text-white/90 sm:text-[8px]">{slot.role}</span>
              <span className="hidden max-w-[60px] truncate text-[7px] text-white/45 sm:block">{player?.name?.split(' ').slice(-1)[0]}</span>
            </motion.div>
          )
        })}
      </div>
      <div className="pointer-events-none absolute inset-x-3 bottom-2 flex justify-between text-[8px] font-semibold uppercase tracking-[0.18em] text-white/25">
        <span>Build-up</span><span>Final third</span>
      </div>
    </div>
  )
}

export default function Tactics() {
  const { data, updateTactics } = useGame()
  const user = data.user
  const [formationId, setFormationId] = useState(user.formation || '4-3-3')
  const [styleId, setStyleId] = useState(user.play_style || 'tiki-taka')
  const [tempo, setTempo] = useState(Number(user.tempo) || 3)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setFormationId(user.formation || '4-3-3')
    setStyleId(user.play_style || 'tiki-taka')
    setTempo(Number(user.tempo) || 3)
  }, [user.formation, user.play_style, user.tempo])

  const formation = getFormation(formationId)
  const style = getStyle(styleId)
  const { lineup } = useMemo(() => selectXI(data.squad, formationId), [data.squad, formationId])
  const strength = useMemo(() => projectedStrength(data.squad, formationId, style, tempo), [data.squad, formationId, style, tempo])
  const dirty = formationId !== user.formation || styleId !== user.play_style || tempo !== Number(user.tempo)
  const staminaAvg = Math.round(data.squad.reduce((sum, player) => sum + player.stamina, 0) / Math.max(1, data.squad.length))
  const suitability = Math.max(52, Math.min(96, Math.round(staminaAvg * 0.65 + strength.overall * 0.35 + (tempo === 3 ? 4 : 0))))

  async function save() {
    setSaving(true)
    try {
      await updateTactics({ formation: formationId, play_style: styleId, tempo })
    } catch {
      // The provider surfaces the error toast.
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Game model · tactical board"
        title="Tactics"
        description="Set the shape, choose the approach and dial in your tempo. The model feeds directly into the match engine."
      >
        {dirty && <span className="chip border-amber-400/20 bg-amber-400/[0.08] text-amber-300"><span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> Unsaved changes</span>}
        <button onClick={save} disabled={saving || !dirty} className="btn-primary">
          {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" /> : <Save size={15} />}
          {saving ? 'Saving…' : dirty ? 'Save tactics' : 'Tactics saved'}
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-7">
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="panel p-5">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="eyebrow">Formation</p>
                <h2 className="display-title mt-0.5 text-2xl">Choose your shape</h2>
              </div>
              <span className="chip"><Gauge size={11} /> {lineup.length} selected</span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {Object.values(FORMATIONS).map(item => {
                const selected = item.id === formationId
                return (
                  <button
                    key={item.id}
                    onClick={() => setFormationId(item.id)}
                    className={`group rounded-xl border p-3 text-left transition ${selected ? 'border-lime/40 bg-lime/[0.055] shadow-lime' : 'border-white/[0.07] bg-white/[0.018] hover:border-white/15 hover:bg-white/[0.035]'}`}
                  >
                    <MiniPitch formation={item} active={selected} color={user.primary_color} />
                    <div className="mt-2.5 flex items-center justify-between">
                      <div>
                        <p className={`display-title text-lg ${selected ? 'text-lime' : 'text-white'}`}>{item.name}</p>
                        <p className="text-[9px] uppercase tracking-wider text-mist-dim">{item.label}</p>
                      </div>
                      {selected ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lime text-ink-950"><Check size={12} strokeWidth={3} /></span>
                      ) : (
                        <span className="h-5 w-5 rounded-full border border-white/10" />
                      )}
                    </div>
                    <p className="mt-2 line-clamp-2 text-[10px] leading-snug text-mist-dim">{item.description}</p>
                  </button>
                )
              })}
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} className="panel p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="eyebrow">Shape preview</p>
                <h2 className="display-title mt-0.5 text-2xl">{formation.name} · {formation.label}</h2>
              </div>
              <span className="chip-lime"><Sparkles size={11} /> XI {strength.overall}</span>
            </div>
            <ShapeBoard formation={formation} lineup={lineup} color={user.primary_color} />
          </motion.section>
        </div>

        <div className="space-y-4 xl:col-span-5">
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="panel p-5">
            <div className="mb-3">
              <p className="eyebrow">Play style</p>
              <h2 className="display-title mt-0.5 text-2xl">Set the approach</h2>
            </div>
            <div className="space-y-2">
              {PLAY_STYLES.map(item => {
                const Icon = STYLE_ICONS[item.icon] || Zap
                const selected = item.id === styleId
                return (
                  <button
                    key={item.id}
                    onClick={() => setStyleId(item.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${selected ? 'border-lime/35 bg-lime/[0.055]' : 'border-white/[0.06] bg-white/[0.018] hover:border-white/12 hover:bg-white/[0.035]'}`}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-lime text-ink-950' : 'bg-white/[0.06] text-mist'}`}>
                      <Icon size={19} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className={`text-[12px] font-bold ${selected ? 'text-white' : 'text-slate-200'}`}>{item.name}</span>
                        {selected && <span className="rounded bg-lime/15 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-lime">Active</span>}
                      </span>
                      <span className="mt-0.5 block text-[10px] leading-snug text-mist-dim">{item.description}</span>
                    </span>
                    <span className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                      <span className={`num text-[10px] font-semibold ${item.attack >= 0 ? 'text-lime' : 'text-mist-dim'}`}>{item.attack > 0 ? '+' : ''}{item.attack} ATT</span>
                      <span className={`num text-[10px] font-semibold ${item.defence >= 0 ? 'text-sky-300' : 'text-mist-dim'}`}>{item.defence > 0 ? '+' : ''}{item.defence} DEF</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="panel p-5">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="eyebrow">Tempo</p>
                <h2 className="display-title mt-0.5 text-2xl">Match rhythm</h2>
              </div>
              <div className="text-right">
                <p className="num text-3xl font-semibold text-lime">{tempo}</p>
                <p className="text-[9px] uppercase tracking-wider text-mist-dim">{TEMPO_LABELS[tempo - 1]}</p>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={tempo}
              onChange={event => setTempo(Number(event.target.value))}
              className="w-full"
              aria-label="Tempo"
            />
            <div className="mt-2 flex justify-between">
              {TEMPO_LABELS.map((label, index) => (
                <button
                  key={label}
                  onClick={() => setTempo(index + 1)}
                  className={`text-[9px] font-semibold transition ${tempo === index + 1 ? 'text-lime' : 'text-mist-dim hover:text-mist'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-3 rounded-lg border border-white/[0.05] bg-ink-950/40 px-3 py-2 text-[10px] leading-relaxed text-mist">
              {TEMPO_COPY[tempo - 1]}
            </p>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="panel p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Projected profile</p>
                <h2 className="display-title mt-0.5 text-2xl">Your identity</h2>
              </div>
              <div className="relative flex h-14 w-14 items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ background: `conic-gradient(#c9f75c ${suitability}%, rgba(255,255,255,0.07) 0)` }}
                />
                <div className="absolute inset-[4px] rounded-full bg-ink-850" />
                <span className="num relative text-sm font-semibold text-lime">{suitability}%</span>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <StatBar label="Attack" value={strength.attack} tone="rose" compact />
              <StatBar label="Defence" value={strength.defence} tone="sky" compact />
              <StatBar label="Squad suitability" value={suitability} tone="lime" compact />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2 text-center">
                <p className="num text-lg font-semibold text-white">{formation.name}</p>
                <p className="text-[8px] uppercase tracking-wider text-mist-dim">Shape</p>
              </div>
              <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2 text-center">
                <p className="num text-lg font-semibold text-white">{style.short}</p>
                <p className="text-[8px] uppercase tracking-wider text-mist-dim">Style</p>
              </div>
              <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2 text-center">
                <p className="num text-lg font-semibold text-white">{TEMPO_LABELS[tempo - 1]}</p>
                <p className="text-[8px] uppercase tracking-wider text-mist-dim">Tempo</p>
              </div>
            </div>
            <p className="mt-3 text-[9px] leading-relaxed text-mist-dim">Suitability blends squad stamina with the demands of your chosen style. Rotate tired legs to keep the model sharp.</p>
          </motion.section>
        </div>
      </div>
    </div>
  )
}
