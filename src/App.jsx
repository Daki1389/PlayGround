import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import AppShell from './components/AppShell'
import PlayerModal from './components/PlayerModal'
import ToastStack from './components/ToastStack'
import { useGame, VIEWS } from './context/GameContext'
import Dashboard from './views/Dashboard'
import Squad from './views/Squad'
import Tactics from './views/Tactics'
import MatchDay from './views/MatchDay'
import Transfers from './views/Transfers'
import Facilities from './views/Facilities'
import League from './views/League'

const VIEW_COMPONENTS = {
  dashboard: Dashboard,
  squad: Squad,
  tactics: Tactics,
  matchday: MatchDay,
  transfers: Transfers,
  facilities: Facilities,
  league: League
}

function Splash() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-ink-950 px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_10%,rgba(201,247,92,0.14),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '52px 52px' }} />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative flex flex-col items-center">
        <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-lime shadow-lime-lg">
          <svg viewBox="0 0 24 24" className="h-9 w-9 text-ink-950" fill="none" stroke="currentColor" strokeWidth="1.7">
            <rect x="3.2" y="4.2" width="17.6" height="15.6" rx="2" />
            <line x1="12" y1="4.2" x2="12" y2="19.8" />
            <circle cx="12" cy="12" r="2.6" />
            <path d="M3.2 8.2h4.2v7.6H3.2M20.8 8.2h-4.2v7.6h4.2" />
          </svg>
          <span className="absolute inset-0 animate-ping rounded-2xl border border-lime/30" style={{ animationDuration: '2.4s' }} />
        </div>
        <p className="display-title text-4xl tracking-[0.08em]">TOUCHLINE<span className="ml-1 text-lime">'26</span></p>
        <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.32em] text-mist-dim">Football Manager</p>
        <div className="mt-8 h-1 w-48 overflow-hidden rounded-full bg-white/[0.07]">
          <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ repeat: Infinity, duration: 1.3, ease: 'easeInOut' }} className="h-full w-1/2 rounded-full bg-lime" />
        </div>
        <p className="mt-3 text-[10px] text-mist-dim">Preparing the dressing room…</p>
      </motion.div>
    </div>
  )
}

function ErrorScreen() {
  const { error, refresh } = useGame()
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-ink-950 p-6">
      <div className="panel w-full max-w-md p-7 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-400/10 text-red-300">
          <AlertTriangle size={22} />
        </div>
        <h1 className="display-title text-2xl">The dressing room is locked</h1>
        <p className="mt-2 text-sm text-mist">We couldn’t reach the Touchline API. Check that the server is running and try again.</p>
        <p className="mt-3 rounded-lg border border-white/[0.06] bg-ink-950/60 p-2.5 text-[10px] text-mist-dim">{error?.message || 'Unknown connection error'}</p>
        <button onClick={() => refresh()} className="btn-primary mt-5 w-full">
          <RefreshCw size={15} /> Try again
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const { data, loading, error, view } = useGame()
  const ViewComponent = VIEW_COMPONENTS[view] || Dashboard
  const current = VIEWS.find(item => item.id === view)

  useEffect(() => {
    document.title = `Touchline '26 · ${current?.label || 'Football Manager'}`
  }, [current?.label])

  if (loading && !data) return <Splash />
  if (error && !data) return <ErrorScreen />
  if (!data) return <Splash />

  return (
    <>
      <AppShell>
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <ViewComponent />
          </motion.div>
        </AnimatePresence>
      </AppShell>
      <PlayerModal />
      <ToastStack />
    </>
  )
}
