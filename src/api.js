import { localApi } from './lib/localGame'

const API_BASE = String(import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
const nativePlatform =
  typeof window !== 'undefined' &&
  (window.Capacitor?.isNativePlatform?.() === true || window.location.protocol === 'capacitor:')

// A packaged Android/iOS build has no Express server next to the WebView. Use
// the bundled offline game engine unless a backend URL was supplied at build
// time. In the browser we try the real API first and quietly fall back to the
// same engine when the server cannot be reached.
let mode = nativePlatform && !API_BASE ? 'local' : 'remote'

function localRequest(path, options = {}) {
  const url = new URL(path, 'http://touchline.local')
  const params = Object.fromEntries(url.searchParams.entries())
  const body = options.body ? JSON.parse(options.body) : {}
  const method = String(options.method || 'GET').toUpperCase()

  if (method === 'GET' && url.pathname === '/bootstrap') return localApi.bootstrap()
  if (method === 'GET' && url.pathname === '/market') return localApi.market(params)
  if (method === 'GET' && url.pathname === '/meta') return localApi.meta()
  if (method === 'POST' && url.pathname === '/transfers/buy') return localApi.buyPlayer(Number(body.player_id), Number(body.team_id))
  if (method === 'POST' && url.pathname === '/facilities/upgrade') return localApi.upgradeFacility(Number(body.team_id), body.facility)
  if (method === 'POST' && url.pathname === '/tactics') return localApi.updateTactics(Number(body.team_id), body)

  const matchRoute = url.pathname.match(/^\/matches\/(\d+)$/)
  if (matchRoute && method === 'GET') return localApi.match(Number(matchRoute[1]))
  const simulateRoute = url.pathname.match(/^\/matches\/(\d+)\/simulate$/)
  if (simulateRoute && method === 'POST') return localApi.simulateMatch(Number(simulateRoute[1]))

  const error = new Error(`No local route for ${method} ${url.pathname}`)
  error.status = 404
  throw error
}

async function remoteRequest(path, options = {}) {
  const response = await fetch(`${API_BASE || ''}/api${path}`, {
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
    error.serverResponded = true
    throw error
  }
  if (payload === null) {
    const error = new Error('The API returned an unusable response')
    error.status = 503
    throw error
  }
  return payload
}

async function request(path, options = {}) {
  if (mode === 'local') return localRequest(path, options)
  try {
    return await remoteRequest(path, options)
  } catch (error) {
    // Real validation / conflict responses from the server must reach the UI.
    // A missing static API, a dead dev server or a proxy error means the
    // bundled engine should take over instead of showing the error screen.
    if (error.serverResponded && error.status >= 400 && error.status < 500 && error.status !== 404) {
      throw error
    }
    mode = 'local'
    return localRequest(path, options)
  }
}

export const api = {
  bootstrap: () => request('/bootstrap'),
  market: params => {
    const query = new URLSearchParams()
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 0 && value !== '0') {
        query.set(key, value)
      }
    })
    return request(`/market?${query.toString()}`)
  },
  buyPlayer: (playerId, teamId) =>
    request('/transfers/buy', {
      method: 'POST',
      body: JSON.stringify({ player_id: playerId, team_id: teamId })
    }),
  upgradeFacility: (teamId, facility) =>
    request('/facilities/upgrade', {
      method: 'POST',
      body: JSON.stringify({ team_id: teamId, facility })
    }),
  updateTactics: (teamId, tactics) =>
    request('/tactics', {
      method: 'POST',
      body: JSON.stringify({ team_id: teamId, ...tactics })
    }),
  simulateMatch: matchId =>
    request(`/matches/${matchId}/simulate`, {
      method: 'POST',
      body: JSON.stringify({})
    }),
  match: matchId => request(`/matches/${matchId}`)
}
