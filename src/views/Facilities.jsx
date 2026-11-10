import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, Building2, Check, ChevronRight, Dumbbell, Sparkles, Sprout, TrendingUp, Wallet } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { useGame } from '../context/GameContext'
import { money } from '../lib/format'

const MAX_LEVEL = 8
const COST_PER_LEVEL = 2_000_000

const FACILITIES = [
  {
    id: 'stadium',
    key: 'stadium_level',
    name: 'Stadium',
    icon: Building2,
    accent: '#c9f75c',
    iconClass: 'text-lime',
    tint: 'rgba(201,247,92,0.1)',
    description: 'Expand the stands, improve the matchday experience and grow the club’s revenue ceiling.',
    effect: level => [
      ['Capacity', `${(18000 + level * 7500).toLocaleString('en-GB')} seats`],
      ['Matchday revenue', `€${(1.1 + level * 0.35).toFixed(1)}M / season`],
      ['Atmosphere', `+${level * 2}% home boost`]
    ]
  },
  {
    id: 'training',
    key: 'training_facility_level',
    name: 'Training Centre',
    icon: Dumbbell,
    accent: '#6ea8ff',
    iconClass: 'text-sky-300',
    tint: 'rgba(110,168,255,0.1)',
    description: 'Invest in pitches, recovery suites and coaching. Fresher legs and faster player development.',
    effect: level => [
      ['Development speed', `+${level * 2}%`],
      ['Stamina recovery', `+${level * 3}%`],
      ['Injury prevention', `+${level * 1.5}%`]
    ]
  },
  {
    id: 'youth',
    key: 'youth_academy_level',
    name: 'Youth Academy',
    icon: Sprout,
    accent: '#a78bfa',
    iconClass: 'text-violet-300',
    tint: 'rgba(167,139,250,0.1)',
    description: 'Build a production line of homegrown talent. Better coaching and scouting from the ground up.',
    effect: level => [
      ['Academy rating', `${48 + level * 5} / 100`],
      ['Intake quality', `${Math.min(5, 1 + Math.ceil(level / 2))} star`],
      ['Potential ceiling', `+${level * 2}`]
    ]
  }
]

export default function Facilities() {
  const { data, upgradeFacility } = useGame()
  const user = data.user
  const [upgrading, setUpgrading] = useState(null)

  const totalLevels = FACILITIES.reduce((sum, facility) => sum + Number(user[facility.key]), 0)
  const capacity = 18000 + Number(user.stadium_level) * 7500
  const development = Number(user.training_facility_level) * 2
  const priority = FACILITIES
    .map(facility => {
      const level = Number(user[facility.key])
      return { ...facility, level, cost: level * COST_PER_LEVEL, maxed: level >= MAX_LEVEL }
    })
    .filter(facility => !facility.maxed)
    .sort((a, b) => a.cost - b.cost)[0]

  async function upgrade(facility) {
    setUpgrading(facility.id)
    try {
      await upgradeFacility(facility.id)
    } catch {
      // Error toast is handled by the provider.
    } finally {
      setUpgrading(null)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Club infrastructure · long-term vision"
        title="Facilities"
        description="Upgrade the spine of the club. Every level costs €2M × current level, improves the matchday model and is applied immediately."
      >
        <span className="chip"><Wallet size={11} className="text-lime" /> {money(user.budget)} available</span>
        <span className="chip"><Sparkles size={11} className="text-lime" /> {totalLevels} / {MAX_LEVEL * 3} levels</span>
      </PageHeader>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Available budget', value: money(user.budget), sub: 'Transferable funds', icon: Wallet, accent: 'text-lime' },
          { label: 'Stadium capacity', value: capacity.toLocaleString('en-GB'), sub: `${user.stadium_name}`, icon: Building2, accent: 'text-sky-300' },
          { label: 'Development boost', value: `+${development}%`, sub: 'Training centre effect', icon: Dumbbell, accent: 'text-violet-300' },
          { label: 'Academy rating', value: `${48 + Number(user.youth_academy_level) * 5}`, sub: 'Youth production', icon: Sprout, accent: 'text-amber-300' }
        ].map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="panel p-4">
            <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-mist-dim">
              <stat.icon size={12} className={stat.accent} /> {stat.label}
            </div>
            <p className="num mt-1.5 text-2xl font-semibold text-white">{stat.value}</p>
            <p className="mt-0.5 truncate text-[9px] text-mist-dim">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {FACILITIES.map((facility, index) => {
          const level = Number(user[facility.key])
          const cost = level * COST_PER_LEVEL
          const maxed = level >= MAX_LEVEL
          const affordable = user.budget >= cost
          const Icon = facility.icon
          const currentEffects = facility.effect(level)
          const nextEffects = facility.effect(Math.min(MAX_LEVEL, level + 1))

          return (
            <motion.section
              key={facility.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 + index * 0.05 }}
              className="panel flex flex-col"
            >
              <div className="relative overflow-hidden p-5" style={{ background: `radial-gradient(ellipse 100% 130% at 15% 0%, ${facility.tint}, transparent 68%)` }}>
                <Icon size={110} className="pointer-events-none absolute -right-5 -top-5 opacity-[0.045]" strokeWidth={1.1} />
                <div className="relative flex items-start justify-between">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-ink-950/50 ${facility.iconClass}`} style={{ boxShadow: `0 0 30px -8px ${facility.accent}55` }}>
                    <Icon size={21} />
                  </span>
                  <div className="text-right">
                    <p className="eyebrow text-[8px]">Current level</p>
                    <motion.p key={level} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="num text-4xl font-semibold leading-none text-white">
                      {String(level).padStart(2, '0')}
                    </motion.p>
                  </div>
                </div>
                <h2 className="display-title relative mt-4 text-2xl">{facility.name}</h2>
                <p className="relative mt-1.5 min-h-[48px] text-[10px] leading-relaxed text-mist">{facility.description}</p>
              </div>

              <div className="flex flex-1 flex-col p-5 pt-2">
                <div className="mb-4 flex items-center gap-1">
                  {Array.from({ length: MAX_LEVEL }).map((_, levelIndex) => {
                    const filled = levelIndex < level
                    const next = levelIndex === level
                    return (
                      <div
                        key={levelIndex}
                        className={`h-1.5 flex-1 rounded-full transition ${filled ? '' : next ? 'bg-white/20' : 'bg-white/[0.06]'}`}
                        style={filled ? { backgroundColor: facility.accent } : next ? { outline: `1px solid ${facility.accent}55` } : undefined}
                      />
                    )
                  })}
                </div>

                <div className="space-y-1.5">
                  {currentEffects.map((effect, effectIndex) => (
                    <div key={effect[0]} className="flex items-center justify-between rounded-lg border border-white/[0.045] bg-white/[0.015] px-2.5 py-2">
                      <span className="text-[10px] text-mist-dim">{effect[0]}</span>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="font-semibold text-slate-200">{effect[1]}</span>
                        {!maxed && (
                          <>
                            <ChevronRight size={10} className="text-mist-dim" />
                            <span className="num font-semibold text-lime">{nextEffects[effectIndex][1]}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-[8px] uppercase tracking-wider text-mist-dim">{maxed ? 'Status' : 'Upgrade cost'}</p>
                    <p className={`num text-xl font-semibold ${maxed ? 'text-lime' : affordable ? 'text-white' : 'text-red-300'}`}>
                      {maxed ? 'MAX LEVEL' : money(cost)}
                    </p>
                    <p className="mt-0.5 text-[8px] text-mist-dim">{maxed ? 'Fully developed' : `Level ${level} × €2M`}</p>
                  </div>
                  <button
                    onClick={() => upgrade(facility)}
                    disabled={maxed || !affordable || upgrading === facility.id}
                    className={`btn h-9 px-3 text-[11px] ${maxed ? 'bg-lime/10 text-lime' : affordable ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {upgrading === facility.id ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                    ) : maxed ? (
                      <Check size={13} />
                    ) : (
                      <ArrowUpRight size={13} />
                    )}
                    {upgrading === facility.id ? 'Building' : maxed ? 'Complete' : affordable ? 'Upgrade' : 'No funds'}
                  </button>
                </div>
              </div>
            </motion.section>
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="panel p-5 lg:col-span-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow">Board recommendation</p>
              <h2 className="display-title mt-0.5 text-xl">Build the foundation</h2>
              <p className="mt-1 max-w-lg text-[11px] leading-relaxed text-mist">
                The board wants sustainable growth. A stronger training centre protects the squad across a 14-match season, while stadium upgrades compound matchday revenue.
              </p>
            </div>
            {priority ? (
              <button onClick={() => upgrade(priority)} disabled={Boolean(upgrading) || priority.cost > user.budget} className="btn-secondary shrink-0">
                <ArrowUpRight size={14} className={priority.iconClass} /> Next: {priority.name} · {money(priority.cost)}
              </button>
            ) : (
              <span className="chip-lime"><Check size={12} /> All facilities maxed</span>
            )}
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="panel p-5 lg:col-span-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Investment ladder</p>
              <h2 className="display-title mt-0.5 text-xl">Level timeline</h2>
            </div>
            <TrendingUp size={18} className="text-lime" />
          </div>
          <div className="mt-3 space-y-2">
            {Array.from({ length: MAX_LEVEL }).map((_, index) => {
              const level = index + 1
              const unlocked = totalLevels >= level * 2
              return (
                <div key={level} className="flex items-center gap-2">
                  <span className={`num w-5 text-[9px] ${unlocked ? 'text-lime' : 'text-mist-dim'}`}>{level}</span>
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className={`h-full rounded-full ${unlocked ? 'bg-lime/60' : 'bg-white/10'}`} style={{ width: `${Math.min(100, (totalLevels / (level * 2)) * 100)}%` }} />
                  </div>
                  <span className={`text-[8px] ${unlocked ? 'text-mist' : 'text-mist-dim'}`}>{money((level - 1) * COST_PER_LEVEL)}</span>
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-[9px] leading-relaxed text-mist-dim">Costs scale with the current level of each facility. Level 1 → 2 costs €2M, level 2 → 3 costs €4M, and so on.</p>
        </motion.section>
      </div>
    </div>
  )
}
