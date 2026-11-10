import { db, transaction } from './db.js'
import { getFormation, getStyle, PLAY_STYLES } from '../shared/formations.js'
import { pickLineup, simulateMatch, teamMetrics } from '../shared/engine.js'
import {
  allMatches,
  allTeams,
  getStandings,
  leadingPlayers,
  matchDetails,
  matchWithTeams,
  nextUserMatch,
  playerById,
  playersByTeam,
  recentUserMatches,
  roundMatches,
  saveSimulation,
  teamById,
  userTeam
} from './store.js'

export class GameError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.status = status
  }
}

const MAX_FACILITY_LEVEL = 8

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
    average_rating: Math.round((squad.reduce((sum, p) => sum + p.overall_rating, 0) / squad.length) * 10) / 10,
    average_age: Math.round((squad.reduce((sum, p) => sum + p.age, 0) / squad.length) * 10) / 10,
    wage_bill: squad.reduce((sum, p) => sum + p.wage, 0),
    squad_value: squad.reduce((sum, p) => sum + p.market_value, 0),
    positions
  }
}

function previewMatch(match) {
  if (!match) return null
  const homePlayers = playersByTeam(match.home_team_id)
  const awayPlayers = playersByTeam(match.away_team_id)
  const home = teamMetrics(match.home_team, homePlayers)
  const away = teamMetrics(match.away_team, awayPlayers)
  return {
    ...match,
    preview: {
      home: {
        formation: home.formation.id,
        lineup: home.lineup,
        rating: Math.round(home.rating * 10) / 10,
        attack: Math.round(home.attack * 10) / 10,
        defence: Math.round(home.defence * 10) / 10,
        style: home.style.name
      },
      away: {
        formation: away.formation.id,
        lineup: away.lineup,
        rating: Math.round(away.rating * 10) / 10,
        attack: Math.round(away.attack * 10) / 10,
        defence: Math.round(away.defence * 10) / 10,
        style: away.style.name
      }
    }
  }
}

function hydrateTeam(team) {
  if (!team) return null
  const squad = playersByTeam(team.id)
  return { ...team, summary: squadSummary(squad) }
}

export function getBootstrap() {
  const user = userTeam()
  if (!user) throw new GameError('No user club found', 500)
  const squad = playersByTeam(user.id)
  const standings = getStandings()
  const nextMatch = previewMatch(nextUserMatch(user.id))
  const recentMatches = recentUserMatches(user.id, 6)
  const userRow = standings.find(row => row.team_id === user.id)
  const leaders = leadingPlayers({ teamId: user.id, limit: 5 })
  const leagueTopScorers = leadingPlayers({ limit: 8 })
  const teams = allTeams().map(team => ({
    ...team,
    summary: squadSummary(playersByTeam(team.id))
  }))

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

export function getMarket({ search = '', position = '', minRating = 0, minValue = 0, maxValue = 0, sort = 'rating', limit = 120 } = {}) {
  const user = userTeam()
  let sql = `
    SELECT p.*, t.name AS team_name, t.short_name AS team_short_name,
           t.primary_color AS team_color, t.secondary_color AS team_secondary_color
    FROM players p
    JOIN teams t ON t.id = p.team_id
    WHERE p.team_id != ?
  `
  const params = [user.id]
  if (search) {
    sql += ' AND (LOWER(p.name) LIKE ? OR LOWER(t.name) LIKE ?)'
    params.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`)
  }
  if (position && ['GK', 'DEF', 'MID', 'ATT'].includes(position)) {
    sql += ' AND p.position = ?'
    params.push(position)
  }
  if (Number(minRating) > 0) {
    sql += ' AND p.overall_rating >= ?'
    params.push(Number(minRating))
  }
  if (Number(minValue) > 0) {
    sql += ' AND p.market_value >= ?'
    params.push(Number(minValue))
  }
  if (Number(maxValue) > 0) {
    sql += ' AND p.market_value <= ?'
    params.push(Number(maxValue))
  }
  const order =
    sort === 'value' ? 'p.market_value ASC, p.overall_rating DESC' :
    sort === 'value_desc' ? 'p.market_value DESC, p.overall_rating DESC' :
    sort === 'age' ? 'p.age ASC, p.overall_rating DESC' :
    sort === 'potential' ? 'p.potential_rating DESC, p.overall_rating DESC' :
    'p.overall_rating DESC, p.potential_rating DESC'
  sql += ` ORDER BY ${order} LIMIT ?`
  params.push(Math.min(200, Math.max(1, Number(limit))))

  const players = db.prepare(sql).all(...params)
  return {
    players,
    total: players.length,
    budget: user.budget,
    squad_size: playersByTeam(user.id).length
  }
}

export function buyPlayer(playerId, buyerTeamId) {
  const player = playerById(playerId)
  if (!player) throw new GameError('Player not found', 404)
  const buyer = teamById(buyerTeamId)
  if (!buyer) throw new GameError('Club not found', 404)
  if (player.team_id === buyer.id) throw new GameError('This player is already in your squad')
  if (buyer.budget < player.market_value) {
    throw new GameError(`Insufficient transfer budget. You need ${formatMoneyShort(player.market_value - buyer.budget)} more.`, 422)
  }

  transaction(() => {
    db.prepare('UPDATE teams SET budget = budget - ? WHERE id = ?').run(player.market_value, buyer.id)
    db.prepare('UPDATE players SET team_id = ?, morale = MAX(morale, 82) WHERE id = ?').run(buyer.id, player.id)
  })

  return {
    player: playerById(player.id),
    budget: teamById(buyer.id).budget,
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

export function upgradeFacility(teamId, facility) {
  const column = FACILITY_COLUMNS[facility]
  if (!column) throw new GameError('Unknown facility', 400)
  const team = teamById(teamId)
  if (!team) throw new GameError('Club not found', 404)
  const level = Number(team[column])
  if (level >= MAX_FACILITY_LEVEL) throw new GameError(`${FACILITY_LABELS[facility]} is already at maximum level`, 422)
  const cost = level * 2000000
  if (team.budget < cost) throw new GameError(`Insufficient funds. ${formatMoneyShort(cost - team.budget)} more is required.`, 422)

  transaction(() => {
    db.prepare('UPDATE teams SET budget = budget - ? WHERE id = ?').run(cost, team.id)
    db.prepare(`UPDATE teams SET ${column} = ${column} + 1 WHERE id = ?`).run(team.id)
  })

  return {
    team: teamById(team.id),
    cost,
    message: `${FACILITY_LABELS[facility]} upgraded to level ${level + 1}.`
  }
}

export function saveTactics(teamId, { formation, play_style, tempo }) {
  const team = teamById(teamId)
  if (!team) throw new GameError('Club not found', 404)
  if (!getFormation(formation)) throw new GameError('Unknown formation', 400)
  if (!PLAY_STYLES.some(style => style.id === play_style)) throw new GameError('Unknown play style', 400)
  const numericTempo = Number(tempo)
  if (!Number.isInteger(numericTempo) || numericTempo < 1 || numericTempo > 5) throw new GameError('Tempo must be between 1 and 5', 400)

  db.prepare('UPDATE teams SET formation = ?, play_style = ?, tempo = ? WHERE id = ?').run(
    formation, play_style, numericTempo, team.id
  )
  return { team: teamById(team.id), message: 'Tactics locked in.' }
}

export function simulateUserMatch(matchId) {
  const match = matchWithTeams(matchId)
  if (!match) throw new GameError('Match not found', 404)
  const user = userTeam()
  if (![match.home_team_id, match.away_team_id].includes(user.id)) throw new GameError('This is not your fixture', 403)
  if (match.status === 'finished') throw new GameError('This match has already been played', 409)
  if (match.status === 'live') throw new GameError('This match is already live', 409)

  const homePlayers = playersByTeam(match.home_team_id)
  const awayPlayers = playersByTeam(match.away_team_id)
  const simulation = simulateMatch({
    homeTeam: match.home_team,
    awayTeam: match.away_team,
    homePlayers,
    awayPlayers,
    seed: Math.floor(Math.random() * 1_000_000_000),
    includeTimeline: true
  })
  saveSimulation(match, simulation, { timeline: true })

  // Play out the rest of the round so the table always moves together.
  const round = match.round
  const otherResults = []
  for (const other of roundMatches(round)) {
    if (other.id === match.id || other.status !== 'scheduled') continue
    const otherHome = playersByTeam(other.home_team_id)
    const otherAway = playersByTeam(other.away_team_id)
    const otherSim = simulateMatch({
      homeTeam: other.home_team,
      awayTeam: other.away_team,
      homePlayers: otherHome,
      awayPlayers: otherAway,
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

  return {
    match: matchDetails(match.id),
    simulation,
    round,
    other_results: otherResults
  }
}

export function getMatch(matchId) {
  const match = matchDetails(matchId)
  if (!match) throw new GameError('Match not found', 404)
  return match
}

export function formatMoneyShort(value) {
  if (Math.abs(value) >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `€${Math.round(value / 1_000)}K`
  return `€${Math.round(value)}`
}

export function getMeta() {
  return {
    formations: ['4-3-3', '4-2-3-1', '3-5-2'],
    play_styles: PLAY_STYLES.map(style => ({ id: style.id, name: style.name })),
    facility_max_level: MAX_FACILITY_LEVEL,
    facility_cost_per_level: 2000000
  }
}
