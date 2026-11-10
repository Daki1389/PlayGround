import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import {
  INITIAL_FACILITIES,
  INITIAL_FIXTURES,
  INITIAL_LINEUP,
  INITIAL_NEWS,
  INITIAL_TABLE,
  INITIAL_TACTICS,
  INITIAL_FUNDS,
  RECENT_RESULTS,
  SEASON,
  SQUAD,
  START_MATCHDAY,
  TEAMS,
  TOTAL_ROUNDS,
  TRANSFER_TARGETS,
  facilityUpgradeCost,
  getTeam,
} from '../data/gameData'
import {
  buildResult,
  facilityScore,
  getStartingRating,
  getStandings,
  getWageBill,
  pickBestLineup,
  progressPercent,
  resultLetter,
  simulateQuickScore,
} from '../lib/engine'
import { clamp } from '../lib/format'

const STORAGE_KEY = 'touchline26.save.v1'
const GameContext = createContext(null)

function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value))
}

export function createInitialState() {
  return {
    version: 1,
    manager: { name: 'Alex Mercer', initials: 'AM', nationality: 'English' },
    clubId: 'ashcombe',
    season: SEASON,
    matchday: START_MATCHDAY,
    funds: INITIAL_FUNDS,
    boardConfidence: 86,
    squad: clone(SQUAD),
    lineup: [...INITIAL_LINEUP],
    formation: '4-2-3-1',
    tactics: clone(INITIAL_TACTICS),
    matchPlan: 'Balanced',
    fixtures: clone(INITIAL_FIXTURES),
    table: clone(INITIAL_TABLE),
    transferTargets: clone(TRANSFER_TARGETS),
    facilities: clone(INITIAL_FACILITIES),
    news: clone(INITIAL_NEWS),
    recentResults: clone(RECENT_RESULTS),
    lastResult: null,
    stadiumCapacity: 48600,
    transfersCompleted: 0,
    honours: [
      { label: 'League titles', value: 4 },
      { label: 'Domestic cups', value: 3 },
      { label: 'European nights', value: 6 },
    ],
  }
}

function hydrate() {
  if (typeof window === 'undefined') return createInitialState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.version !== 1) return createInitialState()
    // Merge in any new static fields without destroying a live save.
    return { ...createInitialState(), ...parsed }
  } catch {
    return createInitialState()
  }
}

function updateTableRow(row, goalsFor, goalsAgainst) {
  const won = goalsFor > goalsAgainst
  const drawn = goalsFor === goalsAgainst
  const letter = resultLetter(goalsFor, goalsAgainst)
  return {
    ...row,
    played: row.played + 1,
    won: row.won + (won ? 1 : 0),
    drawn: row.drawn + (drawn ? 1 : 0),
    lost: row.lost + (won || drawn ? 0 : 1),
    gf: row.gf + goalsFor,
    ga: row.ga + goalsAgainst,
    gd: row.gf + goalsFor - (row.ga + goalsAgainst),
    points: row.points + (won ? 3 : drawn ? 1 : 0),
    form: [...row.form, letter].slice(-5),
  }
}

function dayLabel(iso) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    }).format(new Date(iso))
  } catch {
    return 'Matchday'
  }
}

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_FORMATION': {
      if (!action.formation) return state
      return {
        ...state,
        formation: action.formation,
        lineup: pickBestLineup(state.squad, action.formation),
      }
    }

    case 'SWAP_LINEUP': {
      const { starterId, benchId } = action
      if (!starterId || !benchId || !state.lineup.includes(starterId)) return state
      if (state.lineup.includes(benchId)) return state
      return {
        ...state,
        lineup: state.lineup.map((id) => (id === starterId ? benchId : id)),
      }
    }

    case 'SET_TACTIC': {
      return {
        ...state,
        tactics: { ...state.tactics, [action.key]: action.value },
      }
    }

    case 'SET_PLAN': {
      return { ...state, matchPlan: action.plan }
    }

    case 'SIGN_PLAYER': {
      const { player, fee } = action
      if (!player || !state.transferTargets.some((target) => target.id === player.id)) return state
      if (fee > state.funds) return state
      const newPlayer = {
        ...player,
        club: 'Ashcombe United',
        contract: '2030',
        apps: 0,
        goals: 0,
        assists: 0,
        cleanSheets: 0,
      }
      return {
        ...state,
        funds: state.funds - fee,
        squad: [...state.squad, newPlayer],
        transferTargets: state.transferTargets.filter((target) => target.id !== player.id),
        transfersCompleted: state.transfersCompleted + 1,
        news: [
          {
            id: `signing-${player.id}`,
            type: 'transfer',
            tag: 'Transfer',
            title: `${player.name} signs for Ashcombe`,
            body: `A €${(fee / 1_000_000).toFixed(1)}M deal is completed for the ${player.age}-year-old ${player.pos}.`,
            time: 'Just now',
          },
          ...state.news,
        ],
      }
    }

    case 'UPGRADE_FACILITY': {
      const facility = state.facilities[action.key]
      if (!facility || facility.level >= facility.max) return state
      const cost = facilityUpgradeCost(facility)
      if (cost > state.funds) return state
      return {
        ...state,
        funds: state.funds - cost,
        stadiumCapacity:
          action.key === 'stadium' ? state.stadiumCapacity + 2400 : state.stadiumCapacity,
        facilities: {
          ...state.facilities,
          [action.key]: { ...facility, level: facility.level + 1 },
        },
        news: [
          {
            id: `facility-${action.key}-${facility.level + 1}`,
            type: 'stadium',
            tag: 'Facilities',
            title: `${facility.name} upgraded to level ${facility.level + 1}`,
            body: `The board has approved a €${(cost / 1_000_000).toFixed(1)}M investment in club infrastructure.`,
            time: 'Just now',
          },
          ...state.news,
        ],
      }
    }

    case 'COMPLETE_MATCH': {
      const { result } = action
      if (!result) return state
      const fixture = state.fixtures.find((item) => item.id === result.fixtureId)
      if (!fixture || fixture.played) return state

      const roundFixtures = state.fixtures.filter((item) => item.round === state.matchday)
      const completed = new Map()
      const table = { ...state.table }
      let updatedFixtures = state.fixtures.map((item) => {
        if (item.round !== state.matchday || item.played) return item
        let homeGoals
        let awayGoals
        if (item.id === result.fixtureId) {
          homeGoals = result.homeGoals
          awayGoals = result.awayGoals
        } else {
          const sim = simulateQuickScore(getTeam(item.homeId), getTeam(item.awayId))
          homeGoals = sim.homeGoals
          awayGoals = sim.awayGoals
        }
        completed.set(item.id, { homeGoals, awayGoals })
        const homeRow = table[item.homeId]
        const awayRow = table[item.awayId]
        if (homeRow) table[item.homeId] = updateTableRow(homeRow, homeGoals, awayGoals)
        if (awayRow) table[item.awayId] = updateTableRow(awayRow, awayGoals, homeGoals)
        return { ...item, played: true, homeGoals, awayGoals }
      })

      const won = result.goalsFor > result.goalsAgainst
      const drew = result.goalsFor === result.goalsAgainst
      const revenue = (result.home ? 1_900_000 : 950_000) + (won ? 400_000 : drew ? 160_000 : 0)

      const ratingsByPlayer = Object.fromEntries((result.ratings || []).map((rating) => [rating.id, rating.rating]))
      const goalsByPlayer = {}
      const assistsByPlayer = {}
      for (const event of result.events || []) {
        if (event.teamId !== 'ashcombe') continue
        if (event.type === 'goal' && event.playerId) {
          goalsByPlayer[event.playerId] = (goalsByPlayer[event.playerId] || 0) + 1
        }
      }

      const squad = state.squad.map((player) => {
        const started = state.lineup.includes(player.id)
        const matchRating = ratingsByPlayer[player.id]
        const goals = goalsByPlayer[player.id] || 0
        const moraleShift = won ? 6 : drew ? 1 : -7
        if (started) {
          return {
            ...player,
            apps: player.apps + 1,
            goals: player.goals + goals,
            assists: player.assists + (assistsByPlayer[player.id] || 0),
            fitness: clamp(player.fitness - (9 + Math.round(Math.random() * 7)), 38, 100),
            morale: clamp(player.morale + moraleShift, 25, 100),
            form: matchRating ? Math.round(matchRating * 10) / 10 : player.form,
          }
        }
        return {
          ...player,
          fitness: clamp(player.fitness + 6 + Math.floor(Math.random() * 6), 40, 100),
          morale: clamp(player.morale + (won ? 2 : drew ? 0 : -2), 25, 100),
        }
      })

      const opponent = getTeam(result.opponentId)
      const scoreTitle = `${result.home ? 'Ashcombe' : opponent.short} ${result.homeGoals}–${result.awayGoals} ${result.home ? opponent.short : 'Ashcombe'}`
      const recentEntry = {
        id: result.fixtureId,
        opponent: result.opponentId,
        home: result.home,
        goalsFor: result.goalsFor,
        goalsAgainst: result.goalsAgainst,
        date: result.date,
        competition: 'League',
      }

      const nextMatchday = state.matchday >= TOTAL_ROUNDS ? TOTAL_ROUNDS + 1 : state.matchday + 1

      return {
        ...state,
        funds: state.funds + revenue,
        squad,
        fixtures: updatedFixtures,
        table,
        matchday: nextMatchday,
        boardConfidence: clamp(state.boardConfidence + (won ? 2 : drew ? 0 : -5), 20, 99),
        lastResult: { ...result, recentEntry },
        recentResults: [recentEntry, ...state.recentResults].slice(0, 6),
        news: [
          {
            id: `match-${result.fixtureId}`,
            type: 'match',
            tag: 'Matchday',
            title: `${scoreTitle} — ${won ? 'victory' : drew ? 'draw' : 'defeat'}`,
            body: won
              ? `A strong performance at ${result.home ? result.venue : opponent.stadium} keeps the title push on track.`
              : drew
                ? `Ashcombe are made to settle for a share of the spoils on matchday ${result.round}.`
                : `A frustrating afternoon for the Green, who will look to respond immediately.`,
            time: 'Just now',
          },
          ...state.news,
        ].slice(0, 12),
        _completed: completed.size,
      }
    }

    case 'CLEAR_RESULT':
      return { ...state, lastResult: null }

    case 'RESET_GAME':
      return createInitialState()

    default:
      return state
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, hydrate)
  const remoteTimer = useRef(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch {
        // Storage can be full or disabled; the game continues in memory.
      }
    }, 250)
    return () => window.clearTimeout(timer)
  }, [state])

  // In local development the optional Express backend keeps a cloud copy.
  useEffect(() => {
    if (!import.meta.env.DEV) return undefined
    window.clearTimeout(remoteTimer.current)
    remoteTimer.current = window.setTimeout(() => {
      fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
      }).catch(() => {})
    }, 1400)
    return () => window.clearTimeout(remoteTimer.current)
  }, [state])

  const standings = useMemo(() => getStandings(state), [state])
  const position = standings.find((row) => row.teamId === 'ashcombe')?.position ?? 20
  const rating = getStartingRating(state)
  const wageBill = getWageBill(state)
  const seasonProgress = progressPercent(state.matchday)
  const infrastructure = facilityScore(state.facilities)

  const value = useMemo(
    () => ({
      state,
      dispatch,
      standings,
      position,
      rating,
      wageBill,
      seasonProgress,
      infrastructure,
    }),
    [state, standings, position, rating, wageBill, seasonProgress, infrastructure],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) throw new Error('useGame must be used inside a GameProvider')
  return context
}

export { buildResult, TEAMS }
