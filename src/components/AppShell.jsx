import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeftRight,
  Bell,
  Building2,
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  Menu,
  Play,
  Settings,
  SlidersHorizontal,
  Trophy,
  UsersRound,
  Wallet,
  X
} from 'lucide-react'
import { VIEWS, useGame } from '../context/GameContext'
import { money, ordinal, shortDate } from '../lib/format'
import ClubBadge from './ClubBadge'

const ICONS = {
  dashboard: LayoutDashboard,
  squad: UsersRound,
  tactics: SlidersHorizontal,
  matchday: Play,
  transfers: ArrowLeftRight,
  facilities: Building2,
  league: Trophy
}

const SECTIONS = [
  { label: 'Club', items: ['dashboard', 'squad', 'tactics', 'matchday'] },
  { label: 'Football', items: ['transfers', 'facilities', 'league'] }
]

function LogoMark() {
  return (
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime shadow-lime">
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-ink-950" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3.2" y="4.2" width="17.6" height="15.6" rx="2" />
        <line x1="12" y1="4.2" x2="12" y2="19.8" />
        <circle cx="12" cy="12" r="2.6" />
        <path d="M3.2 8.2h4.2v7.6H3.2M20.8 8.2h-4.2v7.6h4.2" />
      </svg>
      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-ink-950 bg-lime-300" />
    </div>
  )
}

function NavItem({ item, collapsed, onClick }) {
  const { view, setView } = useGame()
  const Icon = ICONS[item.id]
  const active = view === item.id

  return (
    <button
      type="button"
      title={collapsed ? item.label : undefined}
      onClick={() => {
        setView(item.id)
        onClick?.()
      }}
      className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
        active ? 'nav-active bg-white/[0.065] text-white' : 'text-mist hover:bg-white/[0.04] hover:text-slate-200'
      } ${collapsed ? 'justify-center px-0' : ''}`}
    >
      {active && <motion.span layoutId="active-nav-glow" className="absolute inset-0 rounded-lg bg-lime/[0.055]" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
      <Icon size={18} className={`relative z-10 shrink-0 transition ${active ? 'text-lime' : 'text-mist-dim group-hover:text-slate-300'}`} strokeWidth={active ? 2.2 : 1.8} />
      {!collapsed && <span className="relative z-10 text-[13px] font-semibold tracking-[0.01em]">{item.label}</span>}
      {!collapsed && active && <span className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-lime shadow-lime" />}
    </button>
  )
}

function Sidebar({ collapsed, setCollapsed, mobileOpen, closeMobile }) {
  const { data, setView } = useGame()
  const user = data?.user
  const standing = data?.standings?.find(row => row.team_id === user?.id)
  const next = data?.next_match
  const budgetRatio = user ? Math.min(100, (Number(user.budget) / 40000000) * 100) : 0

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[272px] flex-col border-r border-white/[0.06] bg-ink-950/95 backdrop-blur-xl transition-[width,transform] duration-300 lg:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      } ${collapsed ? 'lg:w-[86px]' : 'lg:w-[258px]'}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_50%_0%,rgba(201,247,92,0.1),transparent_65%)]" />
      <div className="relative flex h-[76px] shrink-0 items-center justify-between px-4">
        <button
          onClick={() => { setView('dashboard'); closeMobile() }}
          className={`flex min-w-0 items-center gap-3 ${collapsed ? 'lg:mx-auto' : ''}`}
          aria-label="Touchline home"
        >
          <LogoMark />
          {!collapsed && (
            <div className="min-w-0 text-left">
              <p className="display-title text-[21px] leading-none tracking-[0.08em]">
                TOUCHLINE<span className="ml-1 text-lime">'26</span>
              </p>
              <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.28em] text-mist-dim">Football Manager</p>
            </div>
          )}
        </button>
        <button onClick={closeMobile} className="icon-btn lg:hidden" aria-label="Close menu">
          <X size={16} />
        </button>
      </div>

      <div className={`relative mx-3 mb-5 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 ${collapsed ? 'lg:mx-auto lg:w-[58px] lg:p-2' : ''}`}>
        <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
          <div className="relative shrink-0">
            <ClubBadge team={user} size={collapsed ? 34 : 38} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold leading-tight text-white">{user?.name}</p>
              <p className="mt-0.5 text-[10px] text-mist">
                {standing ? `${ordinal(standing.position)} · ${standing.points} pts` : 'Pre-season'}
              </p>
            </div>
          )}
        </div>
        {!collapsed && next && (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-ink-950/60 px-2 py-1.5">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-mist-dim">Next</span>
            <span className="text-[10px] font-semibold text-slate-300">{shortDate(next.match_date)}</span>
          </div>
        )}
      </div>

      <nav className="relative flex-1 overflow-y-auto px-3 pb-3 scroll-slim">
        {SECTIONS.map(section => (
          <div key={section.label} className="mb-5">
            {!collapsed && <p className="mb-1.5 px-3 font-display text-[9px] font-semibold uppercase tracking-[0.24em] text-mist-dim/80">{section.label}</p>}
            <div className="space-y-1">
              {section.items.map(id => {
                const item = VIEWS.find(view => view.id === id)
                return <NavItem key={id} item={item} collapsed={collapsed} onClick={closeMobile} />
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className={`relative mx-3 mb-3 rounded-xl border border-lime/15 bg-lime/[0.045] p-3 ${collapsed ? 'lg:mx-auto lg:w-[58px] lg:p-2' : ''}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <div className={`flex items-center gap-2 ${collapsed ? 'hidden' : ''}`}>
            <Wallet size={14} className="text-lime" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-lime/70">Transfer budget</span>
          </div>
          <span className={`num font-semibold text-lime ${collapsed ? 'text-xs' : 'text-sm'}`}>{money(user?.budget)}</span>
        </div>
        {!collapsed && (
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-lime" style={{ width: `${budgetRatio}%` }} />
          </div>
        )}
      </div>

      <div className={`relative mb-3 flex items-center gap-2.5 border-t border-white/[0.06] px-4 pt-3 ${collapsed ? 'lg:justify-center lg:px-2' : ''}`}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-lime/30 to-sky-400/20 text-[10px] font-bold text-lime ring-1 ring-white/10">
          AM
        </div>
        {!collapsed && (
          <>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold text-white">Alex Mercer</p>
              <p className="text-[9px] text-mist-dim">Head Coach</p>
            </div>
            <button className="ml-auto rounded-md p-1.5 text-mist-dim transition hover:bg-white/5 hover:text-white" aria-label="Settings">
              <Settings size={14} />
            </button>
          </>
        )}
      </div>

      <button
        onClick={() => setCollapsed(value => !value)}
        className="absolute -right-3 top-[84px] z-20 hidden h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-ink-800 text-mist shadow-lg transition hover:border-lime/30 hover:text-lime lg:flex"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronsRight size={12} /> : <ChevronsLeft size={12} />}
      </button>
    </aside>
  )
}

function MobileNav() {
  const { view, setView } = useGame()
  const items = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
    { id: 'squad', icon: UsersRound, label: 'Squad' },
    { id: 'matchday', icon: Play, label: 'Match' },
    { id: 'transfers', icon: ArrowLeftRight, label: 'Transfers' },
    { id: 'league', icon: Trophy, label: 'League' }
  ]
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-ink-950/95 backdrop-blur-xl lg:hidden safe-bottom">
      <div className="mx-auto grid max-w-md grid-cols-5 px-2">
        {items.map(item => {
          const Icon = item.icon
          const active = view === item.id
          const isMatch = item.id === 'matchday'
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex flex-col items-center gap-1 py-2.5 text-[9px] font-semibold transition ${active ? 'text-lime' : 'text-mist-dim'}`}
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${active ? 'bg-lime/10' : ''} ${isMatch ? 'bg-lime text-ink-950 shadow-lime' : ''}`}>
                <Icon size={17} strokeWidth={isMatch ? 2.4 : 2} />
              </span>
              {item.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default function AppShell({ children }) {
  const { data, view, notify } = useGame()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('touchline:collapsed') === '1')
  const [mobileOpen, setMobileOpen] = useState(false)
  const current = VIEWS.find(item => item.id === view) || VIEWS[0]
  const user = data?.user
  const next = data?.next_match
  const standing = data?.standings?.find(row => row.team_id === user?.id)

  useEffect(() => {
    localStorage.setItem('touchline:collapsed', collapsed ? '1' : '0')
  }, [collapsed])

  useEffect(() => {
    if (!mobileOpen) return undefined
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [mobileOpen])

  return (
    <div className="min-h-[100dvh]">
      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-[45] bg-ink-950/70 backdrop-blur-sm lg:hidden"
            aria-label="Close menu overlay"
          />
        )}
      </AnimatePresence>

      <Sidebar collapsed={collapsed && !mobileOpen} setCollapsed={setCollapsed} mobileOpen={mobileOpen} closeMobile={() => setMobileOpen(false)} />

      <div className={`min-h-[100dvh] transition-[margin] duration-300 ${collapsed ? 'lg:ml-[86px]' : 'lg:ml-[258px]'}`}>
        <header className="sticky top-0 z-30 flex h-[66px] items-center gap-3 border-b border-white/[0.055] bg-ink-950/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button onClick={() => setMobileOpen(true)} className="icon-btn lg:hidden" aria-label="Open menu">
            <Menu size={17} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="hidden text-[9px] font-semibold uppercase tracking-[0.22em] text-mist-dim sm:block">{current.eyebrow}</p>
            <h2 className="display-title truncate text-lg leading-tight sm:text-xl">{current.label}</h2>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <div className="chip">
              <Trophy size={12} className="text-lime" />
              {data?.season?.current_round ? `Matchday ${data.season.current_round} / ${data.season.total_rounds}` : 'Season 2026/27'}
            </div>
            <div className="chip">
              <CalendarDays size={12} className="text-sky-300" />
              {next ? shortDate(next.match_date) : 'Season complete'}
            </div>
          </div>
          <button
            onClick={() => notify(standing ? `Board update: ${ordinal(standing.position)} in the league — keep the momentum going.` : 'Welcome to Touchline, boss.', 'info')}
            className="chip hidden border-lime/20 bg-lime/[0.06] text-lime sm:inline-flex"
            title="Current league position"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-lime" />
            {standing ? `${ordinal(standing.position)} · ${standing.points} pts` : 'New season'}
          </button>
          <div className="chip border-white/[0.07] bg-white/[0.03]">
            <Wallet size={12} className="text-lime" />
            <span className="num font-semibold text-white">{money(user?.budget)}</span>
          </div>
          <button
            onClick={() => notify('Inbox clear. No new messages from the board or scouting team.', 'info')}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.025] text-mist transition hover:border-white/15 hover:text-white"
            aria-label="Notifications"
          >
            <Bell size={16} />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-lime ring-2 ring-ink-950" />
          </button>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 pb-28 pt-5 sm:px-6 sm:pt-6 lg:px-8 lg:pb-12">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  )
}
