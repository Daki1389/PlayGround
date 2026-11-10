// Offline game engine for the Capacitor (Android/iOS) build.
//
// The browser deployment talks to the Express API in server/. A packaged app
// has no Node process, so this module mirrors the same endpoints on top of an
// in-memory store persisted to localStorage. The simulation maths and the club
// generation data are imported from shared/ so both builds behave identically.

import { mulberry32, simulateMatch, teamMetrics } from '../../shared/engine.js'
import { TEAM_SEEDS, buildSchedule, generatePlayers } from '../../shared/club-data.js'
import { getFormation, PLAY_STYLES } from '../../shared/formations.js'

const STORAGE_KEY = 'touchline:local-save:v1'
const SAVE_VERSION = 1
const MAX_FACILITY_LEVEL = 8

export class GameError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.status = status
  }
}

const nowIso = () => new Date().toISOString()
const round1 = value => Math.round(value * 10) / 10

function clone(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value))
}

/* ------------------------------------------------------------------ store */

function teamById(state, id) {
  return state.teams.find(team => team.id === Number(id))
}

function userTeam(state) {
  return state.teams.find(team => team.is_user === 1)
}

function playersByTeam(state, teamId) {
  return state.players
    .filter(player => player.team_id === Number(teamId))
    .sort((a, b) => b.overall_rating - a.overall_rating || a.name.localeCompare(b.name))
}

function playerById(state, id) {
  const player = state.players.find(item => item.id === Number(id))
  if (!player) return undefined
  const team = teamById(state, player.team_id)
  return {
    ...player,
    team_name: team?.name ?? null,
    team_short_name: team?.short_name ?? null,
    team_color: team?.primary_color ?? null,
    team_secondary_color: team?.secondary_color ?? null
  }
}

function attachTeams(state, match) {
  if (!match) return null
  return {
    ...match,
    home_team: teamById(state, match.home_team_id),
    away_team: teamById(state, match.away_team_id)
  }
}

function allMatches(state) {
  return state.matches
    .slice()
    .sort((a, b) => a.round - b.round || String(a.match_date).localeCompare(String(b.match_date)) || a.id - b.id)
    .map(match => attachTeams(state, match))
}

function roundMatches(state, round) {
  return state.matches
    .filter(match => match.round === Number(round))
    .sort((a, b) => a.id - b.id)
    .map(match => attachTeams(state, match))
}

function nextUserMatch(state, teamId) {
  const match = state.matches
    .filter(match => (match.home_team_id === Number(teamId) || match.away_team_id === Number(teamId)) && match.status === 'scheduled')
    .sort((a, b) => a.round - b.round || String(a.match_date).localeCompare(String(b.match_date)) || a.id - b.id)[0]
  return attachTeams(state, match)
}

function recentUserMatches(state, teamId, limit = 5) {
  return state.matches
    .filter(match => (match.home_team_id === Number(teamId) || match.away_team_id === Number(teamId)) && match.status === 'finished')
    .sort((a, b) => b.round - a.round || b.id - a.id)
    .slice(0, Number(limit))
    .map(match => attachTeams(state, match))
}

function matchPlayerStats(state, matchId) {
  return state.stats
    .filter(stat => stat.match_id === Number(matchId))
    .map(stat => {
      const player = state.players.find(item => item.id === stat.player_id)
      const team = teamById(state, stat.team_id)
      return {
        ...stat,
        name: player?.name ?? 'Unknown',
        position: player?.position ?? 'MID',
        overall_rating: player?.overall_rating ?? 0,
        shirt_number: player?.shirt_number ?? null,
        team_name: team?.name ?? null,
        short_name: team?.short_name ?? null,
        primary_color: team?.primary_color ?? null,
        secondary_color: team?.secondary_color ?? null
      }
    })
    .sort((a, b) => b.rating - a.rating)
}

function matchDetails(state, matchId) {
  const match = attachTeams(state, state.matches.find(item => item.id === Number(matchId)))
  if (!match) return null
  let events = []
  try {
    events = match.events_json ? JSON.parse(match.events_json) : []
  } catch {
    events = []
  }
  return {
    ...match,
    events,
    stats: matchPlayerStats(state, match.id)
  }
}

function getStandings(state) {
  const table = new Map(
    state.teams.map(team => [
      team.id,
      {
        team_id: team.id,
        team_name: team.name,
        short_name: team.short_name,
        primary_color: team.primary_color,
        secondary_color: team.secondary_color,
        is_user: team.is_user,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        points: 0,
        form: []
      }
    ])
  )

  for (const match of state.matches) {
    if (match.status !== 'finished') continue
    const home = table.get(match.home_team_id)
    const away = table.get(match.away_team_id)
    if (!home || !away) continue
    home.played += 1
    away.played += 1
    home.goals_for += match.home_score
    home.goals_against += match.away_score
    away.goals_for += match.away_score
    away.goals_against += match.home_score

    if (match.home_score > match.away_score) {
      home.wins += 1
      home.points += 3
      away.losses += 1
      home.form.push('W')
      away.form.push('L')
    } else if (match.home_score < match.away_score) {
      away.wins += 1
      away.points += 3
      home.losses += 1
      home.form.push('L')
      away.form.push('W')
    } else {
      home.draws += 1
      away.draws += 1
      home.points += 1
      away.points += 1
      home.form.push('D')
      away.form.push('D')
    }
  }

  return [...table.values()]
    .map(row => ({
      ...row,
      goal_difference: row.goals_for - row.goals_against,
      form: row.form.slice(-5)
    }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goal_difference - a.goal_difference ||
        b.goals_for - a.goals_for ||
        a.team_name.localeCompare(b.team_name)
    )
    .map((row, index) => ({ ...row, position: index + 1 }))
}

function leadingPlayers(state, { teamId, limit = 5 } = {}) {
  const grouped = new Map()
  for (const stat of state.stats) {
    if (teamId && stat.team_id !== Number(teamId)) continue
    const player = state.players.find(item => item.id === stat.player_id)
    if (!player) continue
    const team = teamById(state, stat.team_id)
    const entry = grouped.get(player.id) || {
      id: player.id,
      name: player.name,
      position: player.position,
      overall_rating: player.overall_rating,
      team_id: player.team_id,
      team_name: team?.name ?? null,
      short_name: team?.short_name ?? null,
      primary_color: team?.primary_color ?? null,
      secondary_color: team?.secondary_color ?? null,
      goals: 0,
      assists: 0,
      ratingSum: 0,
      appearances: 0
    }
    entry.goals += stat.goals
    entry.assists += stat.assists
    entry.ratingSum += Number(stat.rating)
    entry.appearances += 1
    grouped.set(player.id, entry)
  }

  return [...grouped.values()]
    .map(entry => ({
      ...entry,
      average_rating: Math.round((entry.ratingSum / Math.max(1, entry.appearances)) * 100) / 100,
      ratingSum: undefined
    }))
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists || b.average_rating - a.average_rating)
    .slice(0, Number(limit))
}

/* ------------------------------------------------------------------- seed */

function makeInitialState() {
  let teamId = 0
  let playerId = 0
  let matchId = 0

  const teams = TEAM_SEEDS.map(seed => ({
    id: ++teamId,
    name: seed.name,
    short_name: seed.short_name,
    city: seed.city,
    country: seed.country,
    reputation: seed.reputation,
    budget: seed.budget,
    wage_budget: seed.wage_budget,
    stadium_level: 1,
    training_facility_level: 1,
    youth_academy_level: 1,
    stadium_name: seed.stadium_name,
    primary_color: seed.primary_color,
    secondary_color: seed.secondary_color,
    formation: seed.formation,
    play_style: seed.play_style,
    tempo: seed.tempo,
    is_user: seed.is_user,
    founded: seed.founded,
    created_at: nowIso()
  }))

  const players = []
  teams.forEach((team, index) => {
    const rng = mulberry32(7100 + team.id * 131)
    for (const player of generatePlayers(TEAM_SEEDS[index], team.id, rng)) {
      players.push({ ...player, id: ++playerId, created_at: nowIso() })
    }
  })

  const matches = []
  for (const round of buildSchedule(teams.map(team => team.id))) {
    for (const fixture of round.fixtures) {
      matches.push({
        id: ++matchId,
        home_team_id: fixture.home,
        away_team_id: fixture.away,
        home_score: null,
        away_score: null,
        status: 'scheduled',
        round: round.round,
        match_date: round.date,
        season: round.season,
        attendance: null,
        events_json: null,
        played_at: null,
        created_at: nowIso()
      })
    }
  }

  const state = {
    version: SAVE_VERSION,
    teams,
    players,
    matches,
    stats: [],
    nextStatId: 0
  }

  // Replay rounds 1-4 so the new save opens with a league table and form.
  for (let round = 1; round <= 4; round += 1) {
    for (const match of roundMatches(state, round)) {
      const simulation = simulateMatch({
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        homePlayers: playersByTeam(state, match.home_team_id),
        awayPlayers: playersByTeam(state, match.away_team_id),
        seed: 3908 + match.id * 17,
        includeTimeline: false
      })
      saveSimulation(state, match, simulation, { timeline: false })
    }
  }

  return state
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.version === SAVE_VERSION && Array.isArray(parsed.teams) && parsed.teams.length) {
        if (!Number.isInteger(parsed.nextStatId)) {
          parsed.nextStatId = parsed.stats?.length ? Math.max(...parsed.stats.map(stat => stat.id)) : 0
        }
        return parsed
      }
    }
  } catch {
    // Corrupt or unavailable storage: fall back to a fresh save.
  }
  const fresh = makeInitialState()
  persist(fresh)
  return fresh
}

let state = null

function getState() {
  if (!state) state = loadState()
  return state
}

function persist(target = state) {
  if (!target) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(target))
  } catch {
    // Storage may be full or disabled (private mode). The session still works.
  }
}

export function resetLocalGame() {
  state = makeInitialState()
  persist(state)
  return state
}

/* ------------------------------------------------------------- simulation */

function saveSimulation(target, match, simulation, { timeline = true, attendance } = {}) {
  const eventsJson = timeline ? JSON.stringify(simulation.events) : null
  const gate =
    attendance ??
    Math.round(14000 + match.home_team.stadium_level * 6200 + match.home_team.reputation * 130 + Math.random() * 1800)

  const stored = target.matches.find(item => item.id === match.id)
  stored.home_score = simulation.homeGoals
  stored.away_score = simulation.awayGoals
  stored.status = 'finished'
  stored.attendance = gate
  stored.events_json = eventsJson
  stored.played_at = nowIso()

  target.stats = target.stats.filter(stat => stat.match_id !== match.id)
  for (const stat of simulation.stats) {
    target.stats.push({
      id: ++target.nextStatId,
      match_id: match.id,
      player_id: stat.player_id,
      team_id: stat.team_id,
      goals: stat.goals,
      assists: stat.assists,
      rating: stat.rating,
      minutes_played: stat.minutes_played
    })
  }

  return match
}

function simulateFixture(target, match, seed, includeTimeline) {
  const simulation = simulateMatch({
    homeTeam: match.home_team,
    awayTeam: match.away_team,
    homePlayers: playersByTeam(target, match.home_team_id),
    awayPlayers: playersByTeam(target, match.away_team_id),
    seed,
    includeTimeline
  })
  saveSimulation(target, match, simulation, { timeline: includeTimeline })
  return simulation
}

/* -------------------------------------------------------------- endpoints */

function squadSummary(squad) {
  if (!squad.length) {
    return { size: 0, average_rating: 0, average_age: 0, wage_bill: 0, squad_value: 0, positions: {} }
  }
  const positions = squad.reduce((acc, player) => {
    acc[player.position] = (acc[player.position] || 0) + 1
    return acc
  }, {})
  return {
    size: squad.length,
    average_rating: Math.round((squad.reduce((sum, player) => sum + player.overall_rating, 0) / squad.length) * 10) / 10,
    average_age: Math.round((squad.reduce((sum, player) => sum + player.age, 0) / squad.length) * 10) / 10,
    wage_bill: squad.reduce((sum, player) => sum + player.wage, 0),
    squad_value: squad.reduce((sum, player) => sum + player.market_value, 0),
    positions
  }
}

function previewMatch(target, match) {
  if (!match) return null
  const home = teamMetrics(match.home_team, playersByTeam(target, match.home_team_id))
  const away = teamMetrics(match.away_team, playersByTeam(target, match.away_team_id))
  return {
    ...match,
    preview: {
      home: {
        formation: home.formation.id,
        lineup: home.lineup,
        rating: round1(home.rating),
        attack: round1(home.attack),
        defence: round1(home.defence),
        style: home.style.name
      },
      away: {
        formation: away.formation.id,
        lineup: away.lineup,
        rating: round1(away.rating),
        attack: round1(away.attack),
        defence: round1(away.defence),
        style: away.style.name
      }
    }
  }
}

function hydrateTeam(target, team) {
  if (!team) return null
  const squad = playersByTeam(target, team.id)
  return { ...team, summary: squadSummary(squad) }
}

function bootstrap() {
  const target = getState()
  const user = userTeam(target)
  if (!user) throw new GameError('No user club found', 500)
  const squad = playersByTeam(target, user.id)
  const standings = getStandings(target)
  const nextMatch = previewMatch(target, nextUserMatch(target, user.id))
  const recentMatches = recentUserMatches(target, user.id, 6)
  const userRow = standings.find(row => row.team_id === user.id)
  const leaders = leadingPlayers(target, { teamId: user.id, limit: 5 })
  const leagueTopScorers = leadingPlayers(target, { limit: 8 })
  const teams = target.teams.map(team => ({
    ...team,
    summary: squadSummary(playersByTeam(target, team.id))
  }))

  return {
    user: { ...hydrateTeam(target, user), league_position: userRow?.position || 1, points: userRow?.points || 0 },
    squad,
    teams,
    standings,
    next_match: nextMatch,
    recent_matches: recentMatches,
    fixtures: allMatches(target),
    leaders,
    league_top_scorers: leagueTopScorers,
    season: {
      name: '2026/27',
      total_rounds: 14,
      current_round: nextMatch?.round ?? 14,
      is_complete: !nextMatch
    }
  }
}

function market({ search = '', position = '', minRating = 0, minValue = 0, maxValue = 0, sort = 'rating', limit = 120 } = {}) {
  const target = getState()
  const user = userTeam(target)
  const query = String(search).trim().toLowerCase()
  let players = target.players
    .filter(player => player.team_id !== user.id)
    .filter(player => {
      if (!query) return true
      const team = teamById(target, player.team_id)
      return player.name.toLowerCase().includes(query) || (team?.name || '').toLowerCase().includes(query)
    })
    .filter(player => !position || !['GK', 'DEF', 'MID', 'ATT'].includes(position) || player.position === position)
    .filter(player => Number(minRating) <= 0 || player.overall_rating >= Number(minRating))
    .filter(player => Number(minValue) <= 0 || player.market_value >= Number(minValue))
    .filter(player => Number(maxValue) <= 0 || player.market_value <= Number(maxValue))

  const order =
    sort === 'value' ? (a, b) => a.market_value - b.market_value || b.overall_rating - a.overall_rating :
    sort === 'value_desc' ? (a, b) => b.market_value - a.market_value || b.overall_rating - a.overall_rating :
    sort === 'age' ? (a, b) => a.age - b.age || b.overall_rating - a.overall_rating :
    sort === 'potential' ? (a, b) => b.potential_rating - a.potential_rating || b.overall_rating - a.overall_rating :
    (a, b) => b.overall_rating - a.overall_rating || b.potential_rating - a.potential_rating

  players = players.sort(order).slice(0, Math.min(200, Math.max(1, Number(limit))))

  return {
    players: players.map(player => {
      const team = teamById(target, player.team_id)
      return {
        ...player,
        team_name: team?.name ?? null,
        team_short_name: team?.short_name ?? null,
        team_color: team?.primary_color ?? null,
        team_secondary_color: team?.secondary_color ?? null
      }
    }),
    total: players.length,
    budget: user.budget,
    squad_size: playersByTeam(target, user.id).length
  }
}

function buyPlayer(playerId, buyerTeamId) {
  const target = getState()
  const player = playerById(target, playerId)
  if (!player) throw new GameError('Player not found', 404)
  const buyer = teamById(target, buyerTeamId)
  if (!buyer) throw new GameError('Club not found', 404)
  if (player.team_id === buyer.id) throw new GameError('This player is already in your squad')
  if (buyer.budget < player.market_value) {
    throw new GameError(`Insufficient transfer budget. You need ${formatMoneyShort(player.market_value - buyer.budget)} more.`, 422)
  }

  buyer.budget -= player.market_value
  const stored = target.players.find(item => item.id === player.id)
  stored.team_id = buyer.id
  stored.morale = Math.max(stored.morale, 82)
  persist(target)

  return {
    player: playerById(target, player.id),
    budget: buyer.budget,
    message: `${player.name} has signed for ${buyer.name}.`
  }
}

const FACILITY_COLUMNS = {
  stadium: 'stadium_level',
  training: 'training_facility_level',
  youth: 'youth_academy_level'
}

const FACILITY_LABELS = {
  stadium: 'Stadium',
  training: 'Training Centre',
  youth: 'Youth Academy'
}

function upgradeFacility(teamId, facility) {
  const target = getState()
  const column = FACILITY_COLUMNS[facility]
  if (!column) throw new GameError('Unknown facility', 400)
  const team = teamById(target, teamId)
  if (!team) throw new GameError('Club not found', 404)
  const level = Number(team[column])
  if (level >= MAX_FACILITY_LEVEL) throw new GameError(`${FACILITY_LABELS[facility]} is already at maximum level`, 422)
  const cost = level * 2000000
  if (team.budget < cost) throw new GameError(`Insufficient funds. ${formatMoneyShort(cost - team.budget)} more is required.`, 422)

  team.budget -= cost
  team[column] = level + 1
  persist(target)

  return {
    team: clone(team),
    cost,
    message: `${FACILITY_LABELS[facility]} upgraded to level ${level + 1}.`
  }
}

function saveTactics(teamId, { formation, play_style, tempo }) {
  const target = getState()
  const team = teamById(target, teamId)
  if (!team) throw new GameError('Club not found', 404)
  if (!getFormation(formation)) throw new GameError('Unknown formation', 400)
  if (!PLAY_STYLES.some(style => style.id === play_style)) throw new GameError('Unknown play style', 400)
  const numericTempo = Number(tempo)
  if (!Number.isInteger(numericTempo) || numericTempo < 1 || numericTempo > 5) throw new GameError('Tempo must be between 1 and 5', 400)

  team.formation = formation
  team.play_style = play_style
  team.tempo = numericTempo
  persist(target)
  return { team: clone(team), message: 'Tactics locked in.' }
}

function simulateUserMatch(matchId) {
  const target = getState()
  const match = attachTeams(target, target.matches.find(item => item.id === Number(matchId)))
  if (!match) throw new GameError('Match not found', 404)
  const user = userTeam(target)
  if (![match.home_team_id, match.away_team_id].includes(user.id)) throw new GameError('This is not your fixture', 403)
  if (match.status === 'finished') throw new GameError('This match has already been played', 409)
  if (match.status === 'live') throw new GameError('This match is already live', 409)

  const simulation = simulateFixture(target, match, Math.floor(Math.random() * 1_000_000_000), true)

  // Play out the rest of the round so the table always moves together.
  const round = match.round
  const otherResults = []
  for (const other of roundMatches(target, round)) {
    if (other.id === match.id || other.status !== 'scheduled') continue
    const otherSim = simulateFixture(target, other, Math.floor(Math.random() * 1_000_000_000), false)
    otherResults.push({
      id: other.id,
      home_team: other.home_team.short_name,
      away_team: other.away_team.short_name,
      home_score: otherSim.homeGoals,
      away_score: otherSim.awayGoals
    })
  }

  persist(target)

  return {
    match: matchDetails(target, match.id),
    simulation,
    round,
    other_results: otherResults
  }
}

function getMatch(matchId) {
  const match = matchDetails(getState(), matchId)
  if (!match) throw new GameError('Match not found', 404)
  return match
}

function meta() {
  return {
    formations: ['4-3-3', '4-2-3-1', '3-5-2'],
    play_styles: PLAY_STYLES.map(style => ({ id: style.id, name: style.name })),
    facility_max_level: MAX_FACILITY_LEVEL,
    facility_cost_per_level: 2000000
  }
}

export function formatMoneyShort(value) {
  if (Math.abs(value) >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `€${Math.round(value / 1_000)}K`
  return `€${Math.round(value)}`
}

// Mirrors the async surface of src/api.js so the UI can swap transports.
export const localApi = {
  bootstrap: async () => bootstrap(),
  market: async params => market(params),
  buyPlayer: async (playerId, teamId) => buyPlayer(playerId, teamId),
  upgradeFacility: async (teamId, facility) => upgradeFacility(teamId, facility),
  updateTactics: async (teamId, tactics) => saveTactics(teamId, tactics),
  simulateMatch: async matchId => simulateUserMatch(matchId),
  match: async matchId => getMatch(matchId),
  meta: async () => meta()
}
