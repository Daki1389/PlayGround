import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeftRight,
  Bell,
  Building2,
  ChevronRight,
  LayoutDashboard,
  RotateCcw,
  Search,
  ShieldHalf,
  Swords,
  Trophy,
  Users,
  Wallet,
} from 'lucide-react'
import { useGame } from '../context/GameContext'
import { getTeam } from '../data/gameData'
import { cn, formatDate, formatMoney, greeting, ordinal } from '../lib/format'
import TeamCrest from './TeamCrest'
import PlayerAvatar from './PlayerAvatar'
import PlayerModal from './PlayerModal'
import Modal from './Modal'
import { Badge, ProgressBar } from './ui'
import { useToast } from './Toast'

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/squad', label: 'Squad', icon: Users },
    ],
  },
  {
    label: 'Club',
    items: [
      { to: '/matchday', label: 'Match Day', icon: Swords },
      { to: '/transfers', label: 'Transfer Market', icon: ArrowLeftRight },
      { to: '/facilities', label: 'Facilities', icon: Building2 },
    ],
  },
  {
    label: 'Competition',
    items: [{ to: '/league', label: 'League Table', icon: Trophy }],
  },
]

const FLAT_NAV = NAV_GROUPS.flatMap((group) => group.items)

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/squad': 'Squad',
  '/matchday': 'Match Day',
  '/transfers': 'Transfer Market',
  '/facilities': 'Facilities',
  '/league': 'League Table',
}

function NavItem({ item, onNavigate }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12.5px] font-semibold tracking-[-0.01em] transition-all',
          isActive
            ? 'bg-lime-400/[0.09] text-lime-200 shadow-inner-line'
            : 'text-mist-400 hover:bg-white/[0.035] hover:text-mist-100',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-lime-300 transition-all',
              isActive ? 'opacity-100' : 'opacity-0',
            )}
          />
          <Icon size={16} strokeWidth={isActive ? 2.1 : 1.8} className={isActive ? 'text-lime-300' : 'text-mist-500 group-hover:text-mist-300'} />
          <span className="flex-1">{item.label}</span>
          {item.to === '/matchday' && <span className="h-1.5 w-1.5 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(198,245,109,0.8)]" />}
        </>
      )}
    </NavLink>
  )
}

function SearchPalette({ open, onClose }) {
  const { state } = useGame()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setSelected(null)
    }
  }, [open])

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return []
    const players = [...state.squad, ...state.transferTargets].filter((player) =>
      `${player.name} ${player.pos} ${player.club || ''}`.toLowerCase().includes(needle),
    )
    return players.slice(0, 8)
  }, [query, state.squad, state.transferTargets])

  const openPlayer = (player) => {
    onClose()
    window.setTimeout(() => setSelected(player), 80)
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="Search Touchline" eyebrow="Global search" size="md">
        <div className="p-5">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mist-500" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search players, positions, clubs…"
              className="h-11 w-full rounded-xl border border-white/[0.08] bg-ink-950/60 pl-10 pr-16 text-[13px] text-mist-100 outline-none transition placeholder:text-mist-600 focus:border-lime-400/40 focus:ring-2 focus:ring-lime-400/10"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-bold text-mist-500">ESC</kbd>
          </div>

          {!query && (
            <div className="mt-5">
              <p className="eyebrow mb-2.5">Jump to</p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {FLAT_NAV.map((item) => (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => {
                      onClose()
                      navigate(item.to)
                    }}
                    className="flex items-center gap-2.5 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2.5 text-left text-[12px] text-mist-300 transition hover:border-white/[0.1] hover:bg-white/[0.05] hover:text-white"
                  >
                    <item.icon size={14} className="text-mist-500" />
                    {item.label}
                    <ChevronRight size={12} className="ml-auto text-mist-600" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && (
            <div className="mt-4">
              <p className="eyebrow mb-2.5">{results.length} result{results.length === 1 ? '' : 's'}</p>
              {results.length === 0 && (
                <p className="rounded-lg border border-white/[0.05] px-3 py-6 text-center text-[12px] text-mist-500">No players match “{query}”.</p>
              )}
              <div className="space-y-1">
                {results.map((player) => (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => openPlayer(player)}
                    className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-white/[0.04]"
                  >
                    <PlayerAvatar player={player} size={34} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold text-mist-100">{player.name}</p>
                      <p className="text-[10.5px] text-mist-500">{player.club || 'Ashcombe United'} · {player.pos}</p>
                    </div>
                    <span className="font-display text-[13px] font-bold text-lime-300">{player.rating}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
      <PlayerModal player={selected} onClose={() => setSelected(null)} inLineup={state.lineup.includes(selected?.id)} />
    </>
  )
}

export default function Layout() {
  const { state, dispatch, position, seasonProgress, rating } = useGame()
  const location = useLocation()
  const navigate = useNavigate()
  const { push } = useToast()
  const [newsOpen, setNewsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const nextFixture = state.fixtures.find(
    (fixture) => fixture.round === state.matchday && !fixture.played && (fixture.homeId === 'ashcombe' || fixture.awayId === 'ashcombe'),
  )
  const nextOpponentId = nextFixture ? (nextFixture.homeId === 'ashcombe' ? nextFixture.awayId : nextFixture.homeId) : null
  const nextOpponent = nextOpponentId ? getTeam(nextOpponentId) : null
  const pageTitle = PAGE_TITLES[location.pathname] || 'Touchline'

  const resetCareer = () => {
    if (!window.confirm('Start a new career? Current progress will be lost.')) return
    dispatch({ type: 'RESET_GAME' })
    push('A new career has begun at Fenwick Park.', 'info')
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-ink-975 text-mist-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-white/[0.055] bg-ink-950/95 lg:flex">
        <div className="flex h-[72px] items-center px-5">
          <NavLink to="/" className="group flex items-center gap-3">
            <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-lime-400 text-[#08130e] shadow-[0_8px_30px_-10px_rgba(198,245,109,0.7)]">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M4 20V6.5L12 3l8 3.5V20" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 20v-5.5h8V20M8 10h8" strokeLinecap="round" />
                <path d="M12 3v4" strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 bg-[linear-gradient(120deg,transparent_30%,rgba(255,255,255,0.25),transparent_70%)] opacity-0 transition group-hover:opacity-100" />
            </span>
            <span>
              <span className="flex items-baseline gap-1.5">
                <span className="font-display text-[15px] font-bold tracking-[0.15em] text-mist-50">TOUCHLINE</span>
                <span className="rounded border border-lime-400/30 bg-lime-400/[0.08] px-1 py-0.5 text-[9px] font-bold tracking-[0.02em] text-lime-300">'26</span>
              </span>
              <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.24em] text-mist-600">Football Manager</span>
            </span>
          </NavLink>
        </div>

        <div className="mx-4 mb-5 rounded-xl border border-white/[0.055] bg-white/[0.022] p-3">
          <div className="flex items-center gap-2.5">
            <TeamCrest team={getTeam('ashcombe')} size={34} />
            <div className="min-w-0">
              <p className="truncate text-[12px] font-bold text-mist-100">Ashcombe United</p>
              <p className="text-[10px] font-medium text-mist-500">{ordinal(position)} in the league · OVR {rating.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 scrollbar-thin">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="mb-1.5 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-mist-600">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItem key={item.to} item={item} />
                ))}
              </div>
            </div>
          ))}

          {nextOpponent && (
            <div className="mb-4 rounded-xl border border-lime-400/[0.12] bg-gradient-to-br from-lime-400/[0.055] to-transparent p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-mist-500">Next fixture</p>
                <span className="text-[9px] font-semibold text-lime-300">MD {state.matchday}</span>
              </div>
              <div className="flex items-center gap-2">
                <TeamCrest team={nextOpponent} size={29} />
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold text-mist-100">{nextFixture.homeId === 'ashcombe' ? 'vs' : 'at'} {nextOpponent.short}</p>
                  <p className="text-[9.5px] text-mist-500">{formatDate(nextFixture.date)} · 15:00</p>
                </div>
                <ChevronRight size={13} className="ml-auto text-mist-600" />
              </div>
            </div>
          )}
        </nav>

        <div className="border-t border-white/[0.055] p-4">
          <div className="mb-3">
            <div className="mb-1.5 flex items-center justify-between text-[9.5px] font-semibold">
              <span className="uppercase tracking-[0.15em] text-mist-600">Season {state.season}</span>
              <span className="text-mist-400">{seasonProgress}%</span>
            </div>
            <ProgressBar value={seasonProgress} height="h-1" />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-full border border-lime-400/20 bg-lime-400/10 font-display text-[10px] font-bold text-lime-300">AM</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11.5px] font-semibold text-mist-200">{state.manager.name}</p>
              <p className="text-[9.5px] text-mist-500">First team manager</p>
            </div>
            <button
              type="button"
              onClick={resetCareer}
              className="rounded-lg p-1.5 text-mist-600 transition hover:bg-white/5 hover:text-mist-200"
              title="Start a new career"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 border-b border-white/[0.055] bg-ink-975/80 backdrop-blur-xl">
          <div className="flex h-[64px] items-center gap-3 px-4 sm:px-6 lg:h-[72px] lg:px-8">
            <NavLink to="/" className="flex items-center gap-2 lg:hidden">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-lime-400 text-[#08130e]">
                <ShieldHalf size={17} strokeWidth={2.2} />
              </span>
              <span className="font-display text-[12px] font-bold tracking-[0.12em] text-mist-50">TOUCHLINE <span className="text-lime-300">'26</span></span>
            </NavLink>

            <div className="hidden lg:block">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-mist-600">Ashcombe United · {greeting()}, {state.manager.name.split(' ')[0]}</p>
              <p className="font-display text-[15px] font-semibold tracking-[-0.01em] text-mist-100">{pageTitle}</p>
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="hidden h-9 items-center gap-2.5 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 text-[11.5px] text-mist-500 transition hover:border-white/[0.13] hover:text-mist-300 md:flex"
              >
                <Search size={14} />
                <span>Search players…</span>
                <kbd className="ml-4 rounded border border-white/[0.07] bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-bold text-mist-600">⌘K</kbd>
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.025] text-mist-400 transition hover:text-mist-100 md:hidden"
                aria-label="Search"
              >
                <Search size={15} />
              </button>

              <NavLink
                to="/transfers"
                className="hidden h-9 items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 transition hover:border-lime-400/25 sm:flex"
              >
                <Wallet size={14} className="text-lime-300" />
                <span className="text-[11.5px] font-bold tabular-nums text-mist-100">{formatMoney(state.funds)}</span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-mist-600">budget</span>
              </NavLink>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNewsOpen((open) => !open)}
                  className={cn(
                    'relative grid h-9 w-9 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.025] text-mist-400 transition hover:text-mist-100',
                    newsOpen && 'border-lime-400/25 text-lime-300',
                  )}
                  aria-label="Notifications"
                >
                  <Bell size={15} />
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-lime-400 ring-2 ring-ink-975" />
                </button>
                {newsOpen && (
                  <>
                    <button type="button" aria-label="Close notifications" className="fixed inset-0 z-10 cursor-default" onClick={() => setNewsOpen(false)} />
                    <div className="absolute right-0 top-11 z-20 w-[min(21rem,calc(100vw-2rem))] animate-rise overflow-hidden rounded-xl border border-white/[0.09] bg-ink-900 shadow-[0_24px_70px_-15px_rgba(0,0,0,0.9)]">
                      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                        <p className="font-display text-[12px] font-semibold text-mist-100">Club inbox</p>
                        <Badge variant="lime" dot>{state.news.length} new</Badge>
                      </div>
                      <div className="max-h-80 overflow-y-auto scrollbar-thin">
                        {state.news.slice(0, 4).map((item) => (
                          <div key={item.id} className="border-b border-white/[0.045] px-4 py-3 last:border-0 hover:bg-white/[0.025]">
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-lime-300/80">{item.tag}</span>
                              <span className="text-[9px] text-mist-600">{item.time}</span>
                            </div>
                            <p className="text-[11.5px] font-semibold leading-snug text-mist-200">{item.title}</p>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setNewsOpen(false)
                          navigate('/')
                        }}
                        className="flex w-full items-center justify-center gap-1.5 border-t border-white/[0.06] px-4 py-2.5 text-[10.5px] font-semibold text-mist-400 transition hover:bg-white/[0.03] hover:text-white"
                      >
                        View all club news <ChevronRight size={12} />
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate('/squad')}
                className="grid h-9 w-9 place-items-center rounded-full border border-lime-400/20 bg-lime-400/10 font-display text-[10px] font-bold text-lime-300 transition hover:bg-lime-400/15"
                aria-label="Manager profile"
              >
                AM
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1560px] px-4 pb-28 pt-5 sm:px-6 sm:pt-6 lg:px-8 lg:pb-10 lg:pt-7">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.07] bg-ink-950/95 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-6 px-1 pb-[max(0.45rem,env(safe-area-inset-bottom))] pt-1.5">
          {FLAT_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 rounded-lg px-0.5 py-1.5 text-[8.5px] font-semibold tracking-[0.01em] transition',
                  isActive ? 'text-lime-300' : 'text-mist-500',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cn('grid h-7 w-9 place-items-center rounded-lg transition', isActive && 'bg-lime-400/10')}>
                    <item.icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                  </span>
                  <span className="max-w-full truncate">{item.label === 'Transfer Market' ? 'Transfers' : item.label === 'League Table' ? 'League' : item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
