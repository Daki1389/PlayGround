import { useState } from 'react'
import {
  ArrowUpRight,
  Building2,
  Check,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  Radar,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Warehouse,
} from 'lucide-react'
import { useGame } from '../context/GameContext'
import { facilityUpgradeCost, getTeam } from '../data/gameData'
import { facilityScore } from '../lib/engine'
import { cn, formatMoney } from '../lib/format'
import TeamCrest from '../components/TeamCrest'
import {
  Badge,
  Button,
  Card,
  Divider,
  ProgressBar,
  Ring,
  SectionTitle,
} from '../components/ui'
import { useToast } from '../components/Toast'

const FACILITY_ICONS = {
  stadium: Warehouse,
  training: Dumbbell,
  medical: HeartPulse,
  youth: GraduationCap,
  scouting: Radar,
}

const FOCUS_OPTIONS = [
  { key: 'Attacking', icon: TrendingUp, description: 'Finishing, movement and final-third combinations.' },
  { key: 'Defensive', icon: ShieldCheck, description: 'Shape, pressing triggers and defensive duels.' },
  { key: 'Physical', icon: Dumbbell, description: 'Stamina, strength and injury resilience.' },
  { key: 'Balanced', icon: Sparkles, description: 'An even programme across all disciplines.' },
]

function StadiumVision() {
  return (
    <svg viewBox="0 0 460 230" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c3123" />
          <stop offset="100%" stopColor="#050d09" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c6f56d" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#c6f56d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pitch" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1a6b4c" />
          <stop offset="100%" stopColor="#0f4b36" />
        </linearGradient>
        <pattern id="crowd" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="0.9" fill="#9bb7a6" opacity="0.35" />
          <circle cx="4.5" cy="3.5" r="0.7" fill="#c6f56d" opacity="0.18" />
        </pattern>
      </defs>
      <rect width="460" height="230" fill="url(#sky)" />
      <ellipse cx="230" cy="118" rx="190" ry="82" fill="#0b2a1e" />
      <ellipse cx="230" cy="112" rx="178" ry="72" fill="#103a2a" stroke="#2d5c46" strokeWidth="0.7" />
      <ellipse cx="230" cy="110" rx="160" ry="60" fill="url(#crowd)" />
      <ellipse cx="230" cy="108" rx="150" ry="53" fill="#071a12" />
      <rect x="96" y="80" width="268" height="92" rx="4" fill="url(#pitch)" stroke="#b9e5ca" strokeOpacity="0.55" strokeWidth="0.8" />
      {Array.from({ length: 13 }).map((_, index) => (
        <rect key={index} x={96 + index * 20.6} y="80" width="10.3" height="92" fill="#ffffff" opacity={index % 2 === 0 ? 0.025 : 0} />
      ))}
      <line x1="96" y1="126" x2="364" y2="126" stroke="#d8f5e3" strokeOpacity="0.68" strokeWidth="0.8" />
      <circle cx="230" cy="126" r="15" fill="none" stroke="#d8f5e3" strokeOpacity="0.62" strokeWidth="0.8" />
      <rect x="176" y="80" width="108" height="18" fill="none" stroke="#d8f5e3" strokeOpacity="0.55" strokeWidth="0.8" />
      <rect x="176" y="154" width="108" height="18" fill="none" stroke="#d8f5e3" strokeOpacity="0.55" strokeWidth="0.8" />
      <rect x="202" y="80" width="56" height="7" fill="none" stroke="#d8f5e3" strokeOpacity="0.45" strokeWidth="0.8" />
      <rect x="202" y="165" width="56" height="7" fill="none" stroke="#d8f5e3" strokeOpacity="0.45" strokeWidth="0.8" />
      {[38, 124, 336, 422].map((x, index) => (
        <g key={x}>
          <line x1={x} y1={index % 2 === 0 ? 10 : 16} x2={x} y2="82" stroke="#d7ff8a" strokeOpacity="0.12" strokeWidth="1" />
          <circle cx={x} cy={index % 2 === 0 ? 8 : 14} r="2" fill="#d7ff8a" opacity="0.85" />
        </g>
      ))}
      <ellipse cx="230" cy="100" rx="190" ry="82" fill="url(#glow)" />
      <rect x="80" y="62" width="300" height="126" rx="60" fill="none" stroke="#c6f56d" strokeOpacity="0.08" strokeWidth="1" />
    </svg>
  )
}

export default function Facilities() {
  const { state, dispatch, wageBill } = useGame()
  const { push } = useToast()
  const [focusOpen, setFocusOpen] = useState(false)
  const score = facilityScore(state.facilities)
  const facilityList = Object.entries(state.facilities)
  const stadium = state.facilities.stadium
  const stadiumCost = facilityUpgradeCost(stadium)

  const upgrade = (key) => {
    const facility = state.facilities[key]
    const cost = facilityUpgradeCost(facility)
    if (facility.level >= facility.max) {
      push(`${facility.name} is already at maximum level.`, 'info')
      return
    }
    if (cost > state.funds) {
      push(`You need ${formatMoney(cost - state.funds)} more to upgrade ${facility.name}.`, 'error')
      return
    }
    dispatch({ type: 'UPGRADE_FACILITY', key })
    push(`${facility.name} upgraded to level ${facility.level + 1}.`, 'success')
  }

  const setFocus = (focus) => {
    dispatch({ type: 'SET_TACTIC', key: 'trainingFocus', value: focus })
    push(`Training focus set to ${focus.toLowerCase()}.`, 'info')
    setFocusOpen(false)
  }

  const effectLabel = (key, level) => {
    if (key === 'stadium') return `Matchday income +${level * 7}% · capacity ${state.stadiumCapacity.toLocaleString('en-GB')}`
    if (key === 'training') return `Fitness recovery +${level * 4}% · development speed +${level * 5}%`
    if (key === 'medical') return `Injury risk −${level * 5}% · recovery speed +${level * 6}%`
    if (key === 'youth') return `Academy quality ${level * 20}/100 · prospect ceiling +${level * 3}`
    if (key === 'scouting') return `Scouting accuracy +${level * 6}% · shortlist quality +${level * 4}%`
    return ''
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        eyebrow={`Club infrastructure · ${state.season}`}
        title="Facilities"
        description="Invest in the foundations. Every upgrade improves the club on and off the pitch — and the board is watching."
        action={
          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2">
              <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-mist-600">Available funds</p>
              <p className="font-display text-[16px] font-semibold leading-tight text-lime-300">{formatMoney(state.funds)}</p>
            </div>
            <Badge variant="lime" dot>Investment ready</Badge>
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-12">
        <Card className="relative overflow-hidden xl:col-span-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_-10%,rgba(198,245,109,0.12),transparent_50%)]" />
          <div className="relative grid h-full md:grid-cols-[1.05fr_0.95fr]">
            <div className="flex flex-col justify-between p-5 sm:p-6">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="lime" dot>Stadium</Badge>
                  <Badge variant="dark">Level {stadium.level} of {stadium.max}</Badge>
                </div>
                <h2 className="mt-4 font-display text-[29px] font-semibold tracking-[-0.04em] text-mist-50">{getTeam('ashcombe').stadium}</h2>
                <p className="mt-2 max-w-sm text-[12px] leading-relaxed text-mist-400">
                  The historic home of the Green. A wall of noise on matchdays and one of the most feared venues in the division.
                </p>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  ['Capacity', state.stadiumCapacity.toLocaleString('en-GB')],
                  ['Avg. attendance', (state.stadiumCapacity - 1400).toLocaleString('en-GB')],
                  ['Atmosphere', `${72 + stadium.level * 4}/100`],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-mist-600">{label}</p>
                    <p className="mt-1 font-display text-[14px] font-semibold text-mist-200">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <div className="mb-1.5 flex items-center justify-between text-[9px] font-semibold">
                  <span className="uppercase tracking-[0.12em] text-mist-600">Expansion progress</span>
                  <span className="text-mist-400">{stadium.level}/{stadium.max}</span>
                </div>
                <ProgressBar value={(stadium.level / stadium.max) * 100} height="h-1.5" />
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Building2}
                  onClick={() => upgrade('stadium')}
                  disabled={stadium.level >= stadium.max || stadiumCost > state.funds}
                >
                  {stadium.level >= stadium.max ? 'Fully expanded' : `Expand · ${formatMoney(stadiumCost)}`}
                </Button>
                <span className="text-[9.5px] text-mist-500">+2,400 seats next phase</span>
              </div>
            </div>
            <div className="relative min-h-[230px] overflow-hidden border-t border-white/[0.06] md:border-l md:border-t-0">
              <div className="absolute inset-0 opacity-90"><StadiumVision /></div>
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-ink-950/90 to-transparent px-4 pb-3 pt-8">
                <div className="flex items-center gap-2">
                  <TeamCrest team={getTeam('ashcombe')} size={28} />
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-lime-300/80">Fortress</p>
                    <p className="text-[10px] font-semibold text-mist-100">4 wins in 7 home games</p>
                  </div>
                </div>
                <span className="text-[8.5px] font-semibold uppercase tracking-[0.1em] text-mist-500">Est. 1897</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-5 xl:col-span-4">
          <Card className="p-5">
            <div className="flex items-center gap-5">
              <Ring value={score} size={78} stroke={6}>
                <div className="text-center">
                  <p className="font-display text-xl font-bold text-mist-50">{score}</p>
                  <p className="text-[7.5px] font-bold uppercase tracking-[0.1em] text-mist-600">Score</p>
                </div>
              </Ring>
              <div>
                <p className="eyebrow">Infrastructure</p>
                <h3 className="mt-1 font-display text-[16px] font-semibold text-mist-50">Established base</h3>
                <p className="mt-1 text-[10px] leading-relaxed text-mist-500">The board sees strong foundations and room to invest further.</p>
              </div>
            </div>
            <Divider className="my-4" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-mist-600">Wage bill</p>
                <p className="mt-1 font-display text-[13px] font-semibold text-mist-200">{formatMoney(wageBill)}<span className="text-[8px] text-mist-500"> /wk</span></p>
              </div>
              <div>
                <p className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-mist-600">Projects</p>
                <p className="mt-1 font-display text-[13px] font-semibold text-mist-200">{facilityList.filter(([, facility]) => facility.level < facility.max).length} available</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between p-4">
              <div>
                <p className="eyebrow">Weekly programme</p>
                <h3 className="mt-1 font-display text-[15px] font-semibold text-mist-50">Training focus</h3>
              </div>
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-lime-400/15 bg-lime-400/[0.07] text-lime-300"><Dumbbell size={15} /></span>
            </div>
            <div className="px-4 pb-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFocusOpen((value) => !value)}
                  className="flex w-full items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-left transition hover:border-white/[0.14]"
                >
                  <div>
                    <p className="text-[10.5px] font-semibold text-mist-100">{state.tactics.trainingFocus}</p>
                    <p className="text-[8.5px] text-mist-500">Applied to all outfield players</p>
                  </div>
                  <Check size={13} className="text-lime-300" />
                </button>
                {focusOpen && (
                  <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 overflow-hidden rounded-xl border border-white/[0.09] bg-ink-900 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.9)]">
                    {FOCUS_OPTIONS.map((option) => {
                      const Icon = option.icon
                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => setFocus(option.key)}
                          className="flex w-full items-start gap-2.5 border-b border-white/[0.045] px-3 py-2.5 text-left last:border-0 hover:bg-white/[0.035]"
                        >
                          <Icon size={13} className="mt-0.5 shrink-0 text-lime-300" />
                          <div>
                            <p className="text-[10.5px] font-semibold text-mist-200">{option.key}</p>
                            <p className="text-[8.5px] leading-relaxed text-mist-500">{option.description}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="eyebrow">Club campus</p>
            <h2 className="mt-1 font-display text-[19px] font-semibold tracking-[-0.02em] text-mist-50">Facility upgrades</h2>
          </div>
          <span className="text-[9.5px] text-mist-500">Costs scale with level</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {facilityList.map(([key, facility]) => {
            const Icon = FACILITY_ICONS[key] || Building2
            const cost = facilityUpgradeCost(facility)
            const maxed = facility.level >= facility.max
            const canAfford = cost <= state.funds
            const progress = (facility.level / facility.max) * 100
            return (
              <Card key={key} className="group p-4 transition hover:border-white/[0.12]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.035] text-lime-300"><Icon size={16} strokeWidth={1.8} /></span>
                    <div>
                      <p className="text-[12px] font-semibold text-mist-100">{facility.name}</p>
                      <p className="text-[8.5px] font-semibold uppercase tracking-[0.1em] text-mist-600">Level {facility.level} / {facility.max}</p>
                    </div>
                  </div>
                  <Badge variant={facility.level >= 4 ? 'lime' : facility.level >= 3 ? 'emerald' : 'slate'}>
                    {facility.level >= 4 ? 'Elite' : facility.level >= 3 ? 'Strong' : 'Developing'}
                  </Badge>
                </div>
                <p className="mt-3 min-h-[28px] text-[9.5px] leading-relaxed text-mist-500">{facility.description}</p>
                <div className="mt-3 flex gap-1">
                  {Array.from({ length: facility.max }).map((_, index) => (
                    <span key={index} className={cn('h-1 flex-1 rounded-full', index < facility.level ? 'bg-lime-400' : 'bg-white/[0.07]')} />
                  ))}
                </div>
                <div className="mt-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-2">
                  <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-mist-600">Current effect</p>
                  <p className="mt-1 text-[9px] leading-relaxed text-mist-300">{effectLabel(key, facility.level)}</p>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-mist-600">{maxed ? 'Upgrade' : 'Next level'}</p>
                    <p className={cn('text-[11px] font-semibold', maxed ? 'text-mist-500' : canAfford ? 'text-lime-300' : 'text-mist-500')}>
                      {maxed ? 'Maxed out' : formatMoney(cost)}
                    </p>
                  </div>
                  <Button
                    variant={maxed ? 'ghost' : canAfford ? 'secondary' : 'ghost'}
                    size="xs"
                    onClick={() => upgrade(key)}
                    disabled={maxed}
                    icon={maxed ? Check : ArrowUpRight}
                  >
                    {maxed ? 'Complete' : canAfford ? 'Upgrade' : 'Low funds'}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.035] text-mist-300"><Users size={17} /></span>
          <div>
            <p className="text-[11.5px] font-semibold text-mist-100">The board reviews infrastructure every month.</p>
            <p className="text-[9.5px] text-mist-500">Sustained investment improves board confidence and helps attract elite players.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-mist-500">
          <span className="inline-flex items-center gap-1.5"><Wallet size={12} className="text-lime-300" /> {formatMoney(state.funds)} available</span>
          <span className="inline-flex items-center gap-1.5"><ShieldCheck size={12} className="text-emerald-300" /> {score}/100 score</span>
        </div>
      </Card>
    </div>
  )
}
