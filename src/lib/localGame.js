import initial from '../data/initial-state.json'
import { getFormation, getStyle, PLAY_STYLES } from '../../shared/formations.js'
import { pickLineup, simulateMatch, teamMetrics } from '../../server/engine.js'

const STORAGE_KEY = 'touchline:local-state:v1'
const MAX_FACILITY_LEVEL = 8

export class LocalGameError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.name = 'LocalGameError'
    this.status = status
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function loadState() {
  try {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed.teams) && parsed.teams.length && Array.isArray(parsed.players) && parsed.players.length) {
        return parsed
      }
    }
  } catch {
    // A corrupt save should never stop the game from opening.
  }
  return clone(initial)
}

let state = loadState()
let nextStatId = Math.max(0, ...state.match_player_stats.map(stat => Number(stat.id) || 0)) + 1

function persist() {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Private mode / full storage: the current session still works.
  }
}

export function resetLocalGame() {
  state = clone(initial)
  nextStatId = Math.max(0, ...state.match_player_stats.map(stat => Number(stat.id) || 0)) + 1
  persist()
}

const allTeams = () => state.teams
const allPlayers = () => state.players
const allMatchesRaw = () => state.matches
const teamById = id => state.teams.find(team => team.id === Number(id))
const userTeam = () => state.teams.find(team => Number(team.is_user) === 1)
const playersByTeam = teamId =>
  state.players
    .filter(player => player.team_id === Number(teamId))
    .sort((a, b) => b.overall_rating - a.overall_rating || a.name.localeCompare(b.name))

function playerById(id) {
  const player = state.players.find(item => item.id === Number(id))
  if (!player) return null
  const team = teamById(player.team_id)
  return {
    ...player,
    team_name: team?.name,
    team_short_name: team?.short_name,
    team_color: team?.primary_color,
    team_secondary_color: team?.secondary_color
  }
}

function matchWithTeams(match) {
  if (!match) return null
  return {
    ...match,
    home_team: teamById(match.home_team_id),
    away_team: teamById(match.away_team_id)
  }
}

const matchById = id => state.matches.find(match => match.id === Number(id))

function matchesForTeam(teamId, { status, limit } = {}) {
  let rows = state.matches.filter(match => match.home_team_id === Number(teamId) || match.away_team_id === Number(teamId))
  if (status) rows = rows.filter(match => match.status === status)
  rows.sort((a, b) => a.round - b.round || String(a.match_date).localeCompare(String(b.match_date)) || a.id - b.id)
  if (limit) rows = rows.slice(0, Number(limit))
  return rows.map(matchWithTeams)
}

const allMatches = () =>
  state.matches
    .slice()
    .sort((a, b) => a.round - b.round || String(a.match_date).localeCompare(String(b.match_date)) || a.id - b.id)
    .map(matchWithTeams)

function nextUserMatch(teamId) {
  const row = state.matches
    .filter(match => (match.home_team_id === Number(teamId) || match.away_team_id === Number(teamId)) && match.status === 'scheduled')
    .sort((a, b) => a.round - b.round || String(a.match_date).localeCompare(String(b.match_date)) || a.id - b.id)[0]
  return matchWithTeams(row)
}

function recentUserMatches(teamId, limit = 5) {
  return state.matches
    .filter(match => (match.home_team_id === Number(teamId) || match.away_team_id === Number(teamId)) && match.status === 'finished')
    .sort((a, b) => b.round - a.round || b.id - a.id)
    .slice(0, Number(limit))
    .map(matchWithTeams)
}

const roundMatches = round =>
  state.matches
    .filter(match => match.round === Number(round))
    .sort((a, b) => a.id - b.id)
    .map(matchWithTeams)

function saveSimulation(match, sim, { timeline = true, attendance } = {}) {
  const stored = state.matches.find(item => item.id === match.id)
  if (!stored) throw new LocalGameError('Match not found', 404)
  const gate = attendance ?? Math.round(14000 + match.home_team.stadium_level * 6200 + match.home_team.reputation * 130 + Math.random() * 1800)
  stored.home_score = sim.homeGoals
  stored.away_score = sim.awayGoals
  stored.status = 'finished'
  stored.attendance = gate
  stored.events_json = timeline ? JSON.stringify(sim.events) : null
  stored.played_at = new Date().toISOString()

  state.match_player_stats = state.match_player_stats.filter(stat => stat.match_id !== stored.id)
  for (const stat of sim.stats) {
    state.match_player_stats.push({
      id: nextStatId++,
      match_id: stored.id,
      player_id: stat.player_id,
      team_id: stat.team_id,
      goals: stat.goals,
      assists: stat.assists,
      rating: stat.rating,
      minutes_played: stat.minutes_played
    })
  }
  persist()
  return matchWithTeams(stored)
}

function getStandings() {
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

function leadingPlayers({ teamId, limit = 5 } = {}) {
  const groups = new Map()
  for (const stat of state.match_player_stats) {
    if (teamId && stat.team_id !== Number(teamId)) continue
    const player = state.players.find(item => item.id === stat.player_id)
    const team = teamById(stat.team_id)
    if (!player || !team) continue
    if (!groups.has(player.id)) {
      groups.set(player.id, {
        id: player.id,
        name: player.name,
        position: player.position,
        overall_rating: player.overall_rating,
        team_id: player.team_id,
        team_name: team.name,
        short_name: team.short_name,
        primary_color: team.primary_color,
        secondary_color: team.secondary_color,
        goals: 0,
        assists: 0,
        rating_total: 0,
        appearances: 0
      })
    }
    const row = groups.get(player.id)
    row.goals += stat.goals || 0
    row.assists += stat.assists || 0
    row.rating_total += Number(stat.rating) || 0
    row.appearances += 1
  }

  return [...groups.values()]
    .map(row => ({
      ...row,
      average_rating: row.appearances ? Math.round((row.rating_total / row.appearances) * 100) / 100 : 0
    }))
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists || b.average_rating - a.average_rating)
    .slice(0, Number(limit))
    .map(({ rating_total, ...row }) => row)
}

function matchPlayerStats(matchId) {
  return state.match_player_stats
    .filter(stat => stat.match_id === Number(matchId))
    .map(stat => {
      const player = state.players.find(item => item.id === stat.player_id)
      const team = teamById(stat.team_id)
      return {
        ...stat,
        name: player?.name,
        position: player?.position,
        overall_rating: player?.overall_rating,
        shirt_number: player?.shirt_number,
        team_name: team?.name,
        short_name: team?.short_name,
        primary_color: team?.primary_color,
        secondary_color: team?.secondary_color
      }
    })
    .sort((a, b) => b.rating - a.rating)
}

function matchDetails(matchId) {
  const match = matchWithTeams(matchById(matchId))
  if (!match) return null
  let events = []
  try {
    events = match.events_json ? JSON.parse(match.events_json) : []
  } catch {
    events = []
  }
  return { ...match, events, stats: matchPlayerStats(match.id) }
}

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

function previewMatch(match) {
  if (!match) return null
  const homePlayers = playersByTeam(match.home_team_id)
  const awayPlayers = playersByTeam(match.away_team_id)
  const home = teamMetrics(match.home_team, homePlayers)
  const away = teamMetrics(match.away_team, awayPlayers)
  const brief = metrics => ({
    formation: metrics.formation.id,
    lineup: metrics.lineup,
    rating: Math.round(metrics.rating * 10) / 10,
    attack: Math.round(metrics.attack * 10) / 10,
    defence: Math.round(metrics.defence * 10) / 10,
    style: metrics.style.name
  })
  return { ...match, preview: { home: brief(home), away: brief(away) } }
}

function hydrateTeam(team) {
  if (!team) return null
  return { ...team, summary: squadSummary(playersByTeam(team.id)) }
}

function formatMoneyShort(value) {
  if (Math.abs(value) >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `€${Math.round(value / 1_000)}K`
  return `€${Math.round(value)}`
}

function getBootstrap() {
  const user = userTeam()
  if (!user) throw new LocalGameError('No user club found', 500)
  const squad = playersByTeam(user.id)
  const standings = getStandings()
  const nextMatch = previewMatch(nextUserMatch(user.id))
  const recentMatches = recentUserMatches(user.id, 6)
  const userRow = standings.find(row => row.team_id === user.id)
  const leaders = leadingPlayers({ teamId: user.id, limit: 5 })
  const leagueTopScorers = leadingPlayers({ limit: 8 })
  const teams = state.teams.map(team => ({ ...team, summary: squadSummary(playersByTeam(team.id)) }))

  return {
    user: { ...hydrateTeam(user), league_position: userRow?.position || 1, points: userRow?.points || 0 },
    squad,
    teams,
    standings,
    next_match: nextMatch,
    recent_matches: recentMatches,
    fixtures: allMatches(),
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

function getMarket({ search = '', position = '', minRating = 0, minValue = 0, maxValue = 0, sort = 'rating', limit = 120 } = {}) {
  const user = userTeam()
  let players = state.players
    .filter(player => player.team_id !== user.id)
    .map(player => {
      const team = teamById(player.team_id)
      return {
        ...player,
        team_name: team?.name,
        team_short_name: team?.short_name,
        team_color: team?.primary_color,
        team_secondary_color: team?.secondary_color
      }
    })

  if (search) {
    const term = String(search).toLowerCase()
    players = players.filter(player => player.name.toLowerCase().includes(term) || String(player.team_name || '').toLowerCase().includes(term))
  }
  if (position && ['GK', 'DEF', 'MID', 'ATT'].includes(position)) players = players.filter(player => player.position === position)
  if (Number(minRating) > 0) players = players.filter(player => player.overall_rating >= Number(minRating))
  if (Number(minValue) > 0) players = players.filter(player => player.market_value >= Number(minValue))
  if (Number(maxValue) > 0) players = players.filter(player => player.market_value <= Number(maxValue))

  const order = {
    value: (a, b) => a.market_value - b.market_value || b.overall_rating - a.overall_rating,
    value_desc: (a, b) => b.market_value - a.market_value || b.overall_rating - a.overall_rating,
    age: (a, b) => a.age - b.age || b.overall_rating - a.overall_rating,
    potential: (a, b) => b.potential_rating - a.potential_rating || b.overall_rating - a.overall_rating
  }[sort] || ((a, b) => b.overall_rating - a.overall_rating || b.potential_rating - a.potential_rating)

  players.sort(order)
  players = players.slice(0, Math.min(200, Math.max(1, Number(limit))))

  return {
    players,
    total: players.length,
    budget: user.budget,
    squad_size: playersByTeam(user.id).length
  }
}

function buyPlayer(playerId, buyerTeamId) {
  const player = playerById(playerId)
  if (!player) throw new LocalGameError('Player not found', 404)
  const buyer = teamById(buyerTeamId)
  if (!buyer) throw new LocalGameError('Club not found', 404)
  if (player.team_id === buyer.id) throw new LocalGameError('This player is already in your squad')
  if (buyer.budget < player.market_value) {
    throw new LocalGameError(`Insufficient transfer budget. You need ${formatMoneyShort(player.market_value - buyer.budget)} more.`, 422)
  }

  buyer.budget -= player.market_value
  const stored = state.players.find(item => item.id === player.id)
  stored.team_id = buyer.id
  stored.morale = Math.max(stored.morale, 82)
  persist()

  return {
    player: playerById(player.id),
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
  const column = FACILITY_COLUMNS[facility]
  if (!column) throw new LocalGameError('Unknown facility', 400)
  const team = teamById(teamId)
  if (!team) throw new LocalGameError('Club not found', 404)
  const level = Number(team[column])
  if (level >= MAX_FACILITY_LEVEL) throw new LocalGameError(`${FACILITY_LABELS[facility]} is already at maximum level`, 422)
  const cost = level * 2000000
  if (team.budget < cost) throw new LocalGameError(`Insufficient funds. ${formatMoneyShort(cost - team.budget)} more is required.`, 422)

  team.budget -= cost
  team[column] = level + 1
  persist()

  return {
    team: { ...team },
    cost,
    message: `${FACILITY_LABELS[facility]} upgraded to level ${level + 1}.`
  }
}

function saveTactics(teamId, { formation, play_style, tempo }) {
  const team = teamById(teamId)
  if (!team) throw new LocalGameError('Club not found', 404)
  if (!getFormation(formation)) throw new LocalGameError('Unknown formation', 400)
  if (!PLAY_STYLES.some(style => style.id === play_style)) throw new LocalGameError('Unknown play style', 400)
  const numericTempo = Number(tempo)
  if (!Number.isInteger(numericTempo) || numericTempo < 1 || numericTempo > 5) throw new LocalGameError('Tempo must be between 1 and 5', 400)

  team.formation = formation
  team.play_style = play_style
  team.tempo = numericTempo
  persist()
  return { team: { ...team }, message: 'Tactics locked in.' }
}

function simulateUserMatch(matchId) {
  const match = matchWithTeams(matchById(matchId))
  if (!match) throw new LocalGameError('Match not found', 404)
  const user = userTeam()
  if (![match.home_team_id, match.away_team_id].includes(user.id)) throw new LocalGameError('This is not your fixture', 403)
  if (match.status === 'finished') throw new LocalGameError('This match has already been played', 409)
  if (match.status === 'live') throw new LocalGameError('This match is already live', 409)

  const simulation = simulateMatch({
    homeTeam: match.home_team,
    awayTeam: match.away_team,
    homePlayers: playersByTeam(match.home_team_id),
    awayPlayers: playersByTeam(match.away_team_id),
    seed: Math.floor(Math.random() * 1_000_000_000),
    includeTimeline: true
  })
  saveSimulation(match, simulation, { timeline: true })

  const round = match.round
  const otherResults = []
  for (const other of roundMatches(round)) {
    if (other.id === match.id || other.status !== 'scheduled') continue
    const otherSim = simulateMatch({
      homeTeam: other.home_team,
      awayTeam: other.away_team,
      homePlayers: playersByTeam(other.home_team_id),
      awayPlayers: playersByTeam(other.away_team_id),
      seed: Math.floor(Math.random() * 1_000_000_000),
      includeTimeline: false
    })
    saveSimulation(other, otherSim, { timeline: false })
    otherResults.push({
      id: other.id,
      home_team: other.home_team.short_name,
      away_team: other.away_team.short_name,
      home_score: otherSim.homeGoals,
      away_score: otherSim.awayGoals
    })
  }

  return { match: matchDetails(match.id), simulation, round, other_results: otherResults }
}

const getMatch = matchId => {
  const match = matchDetails(matchId)
  if (!match) throw new LocalGameError('Match not found', 404)
  return match
}

const getMeta = () => ({
  formations: ['4-3-3', '4-2-3-1', '3-5-2'],
  play_styles: PLAY_STYLES.map(style => ({ id: style.id, name: style.name })),
  facility_max_level: MAX_FACILITY_LEVEL,
  facility_cost_per_level: 2000000
})

export const localApi = {
  bootstrap: getBootstrap,
  market: getMarket,
  buyPlayer,
  upgradeFacility,
  updateTactics: saveTactics,
  simulateMatch: simulateUserMatch,
  match: getMatch,
  meta: getMeta,
  reset: resetLocalGame
}
