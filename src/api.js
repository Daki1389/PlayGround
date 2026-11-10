import { Capacitor } from '@capacitor/core'

// The Capacitor app ships without the Express server, so it runs the shared
// simulation engine locally. The web deployment keeps using the API.
const useLocalEngine = Capacitor.isNativePlatform() || import.meta.env.VITE_LOCAL_ENGINE === '1'

let localApiPromise = null

function localApi() {
  if (!localApiPromise) {
    localApiPromise = import('./lib/localGame.js').then(module => module.localApi)
  }
  return localApiPromise
}

async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  })
  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }
  if (!response.ok) {
    const error = new Error(payload?.error || `Request failed (${response.status})`)
    error.status = response.status
    throw error
  }
  return payload
}

async function callLocal(method, ...args) {
  const engine = await localApi()
  return engine[method](...args)
}

export const api = {
  bootstrap: () => (useLocalEngine ? callLocal('bootstrap') : request('/bootstrap')),
  market: params => (useLocalEngine ? callLocal('market', params) : (() => {
    const query = new URLSearchParams()
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 0 && value !== '0') {
        query.set(key, value)
      }
    })
    return request(`/market?${query.toString()}`)
  })()),
  buyPlayer: (playerId, teamId) =>
    useLocalEngine
      ? callLocal('buyPlayer', playerId, teamId)
      : request('/transfers/buy', {
          method: 'POST',
          body: JSON.stringify({ player_id: playerId, team_id: teamId })
        }),
  upgradeFacility: (teamId, facility) =>
    useLocalEngine
      ? callLocal('upgradeFacility', teamId, facility)
      : request('/facilities/upgrade', {
          method: 'POST',
          body: JSON.stringify({ team_id: teamId, facility })
        }),
  updateTactics: (teamId, tactics) =>
    useLocalEngine
      ? callLocal('updateTactics', teamId, tactics)
      : request('/tactics', {
          method: 'POST',
          body: JSON.stringify({ team_id: teamId, ...tactics })
        }),
  simulateMatch: matchId =>
    useLocalEngine
      ? callLocal('simulateMatch', matchId)
      : request(`/matches/${matchId}/simulate`, {
          method: 'POST',
          body: JSON.stringify({})
        }),
  match: matchId => (useLocalEngine ? callLocal('match', matchId) : request(`/matches/${matchId}`)),
  meta: () => (useLocalEngine ? callLocal('meta') : request('/meta'))
}

export { useLocalEngine }
