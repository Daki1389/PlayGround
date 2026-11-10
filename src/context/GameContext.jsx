import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../api'

const GameContext = createContext(null)

const VIEW_KEY = 'touchline:view'

export const VIEWS = [
  { id: 'dashboard', label: 'Dashboard', eyebrow: 'Club overview' },
  { id: 'squad', label: 'Squad', eyebrow: 'First team' },
  { id: 'tactics', label: 'Tactics', eyebrow: 'Game model' },
  { id: 'matchday', label: 'Match Day', eyebrow: 'Live match' },
  { id: 'transfers', label: 'Transfer Market', eyebrow: 'Recruitment' },
  { id: 'facilities', label: 'Facilities', eyebrow: 'Club infrastructure' },
  { id: 'league', label: 'League', eyebrow: 'Standings & fixtures' }
]

export function GameProvider({ children }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [toasts, setToasts] = useState([])
  const [playerModal, setPlayerModal] = useState(null)
  const [view, setViewState] = useState(() => {
    const saved = localStorage.getItem(VIEW_KEY)
    return VIEWS.some(item => item.id === saved) ? saved : 'dashboard'
  })
  const mounted = useRef(true)
  const toastTimers = useRef(new Map())

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      toastTimers.current.forEach(timer => clearTimeout(timer))
    }
  }, [])

  const notify = useCallback((message, tone = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setToasts(current => [...current.slice(-2), { id, message, tone }])
    const timer = setTimeout(() => {
      setToasts(current => current.filter(toast => toast.id !== id))
      toastTimers.current.delete(id)
    }, 4800)
    toastTimers.current.set(id, timer)
  }, [])

  const dismissToast = useCallback(id => {
    setToasts(current => current.filter(toast => toast.id !== id))
    const timer = toastTimers.current.get(id)
    if (timer) clearTimeout(timer)
    toastTimers.current.delete(id)
  }, [])

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const payload = await api.bootstrap()
      if (!mounted.current) return payload
      setData(payload)
      setError(null)
      return payload
    } catch (err) {
      if (mounted.current) setError(err)
      if (!silent) notify(err.message || 'Could not load your club.', 'error')
      return null
    } finally {
      if (mounted.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [notify])

  useEffect(() => {
    refresh()
  }, [refresh])

  const setView = useCallback(id => {
    if (!VIEWS.some(item => item.id === id)) return
    setViewState(id)
    localStorage.setItem(VIEW_KEY, id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const purchasePlayer = useCallback(async playerId => {
    try {
      const result = await api.buyPlayer(playerId, data?.user?.id)
      notify(result.message, 'success')
      await refresh({ silent: true })
      return result
    } catch (err) {
      notify(err.message || 'The transfer could not be completed.', 'error')
      throw err
    }
  }, [data?.user?.id, notify, refresh])

  const upgradeFacility = useCallback(async facility => {
    try {
      const result = await api.upgradeFacility(data?.user?.id, facility)
      notify(result.message, 'success')
      await refresh({ silent: true })
      return result
    } catch (err) {
      notify(err.message || 'Upgrade failed.', 'error')
      throw err
    }
  }, [data?.user?.id, notify, refresh])

  const updateTactics = useCallback(async tactics => {
    try {
      const result = await api.updateTactics(data?.user?.id, tactics)
      notify(result.message, 'success')
      await refresh({ silent: true })
      return result
    } catch (err) {
      notify(err.message || 'Could not save tactics.', 'error')
      throw err
    }
  }, [data?.user?.id, notify, refresh])

  const simulateMatch = useCallback(async matchId => {
    try {
      return await api.simulateMatch(matchId)
    } catch (err) {
      notify(err.message || 'The match could not be simulated.', 'error')
      throw err
    }
  }, [notify])

  const openPlayer = useCallback((player, options = {}) => {
    setPlayerModal({ player, ...options })
  }, [])

  const closePlayer = useCallback(() => setPlayerModal(null), [])

  const value = useMemo(() => ({
    data,
    loading,
    refreshing,
    error,
    toasts,
    view,
    setView,
    refresh,
    notify,
    dismissToast,
    purchasePlayer,
    upgradeFacility,
    updateTactics,
    simulateMatch,
    playerModal,
    openPlayer,
    closePlayer
  }), [
    data, loading, refreshing, error, toasts, view, setView, refresh, notify, dismissToast,
    purchasePlayer, upgradeFacility, updateTactics, simulateMatch, playerModal, openPlayer, closePlayer
  ])

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) throw new Error('useGame must be used inside GameProvider')
  return context
}
