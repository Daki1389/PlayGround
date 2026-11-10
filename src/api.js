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
