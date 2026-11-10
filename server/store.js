import { db, transaction } from './db.js'

export function allTeams() {
  return db.prepare('SELECT * FROM teams ORDER BY id ASC').all()
}

export function teamById(id) {
  return db.prepare('SELECT * FROM teams WHERE id = ?').get(Number(id))
}

export function userTeam() {
  return db.prepare('SELECT * FROM teams WHERE is_user = 1 ORDER BY id LIMIT 1').get()
}

export function playersByTeam(teamId) {
  return db
    .prepare('SELECT * FROM players WHERE team_id = ? ORDER BY overall_rating DESC, name ASC')
    .all(Number(teamId))
}

export function playerById(id) {
  return db
    .prepare(
      `SELECT p.*, t.name AS team_name, t.short_name AS team_short_name, t.primary_color AS team_color,
              t.secondary_color AS team_secondary_color
       FROM players p LEFT JOIN teams t ON t.id = p.team_id WHERE p.id = ?`
    )
    .get(Number(id))
}

export function matchById(id) {
  return db.prepare('SELECT * FROM matches WHERE id = ?').get(Number(id))
}

function attachTeams(match) {
  if (!match) return null
  return {
    ...match,
    home_team: teamById(match.home_team_id),
    away_team: teamById(match.away_team_id)
  }
}

export function matchWithTeams(id) {
  return attachTeams(matchById(id))
}

export function matchesForTeam(teamId, { status, limit } = {}) {
  let sql = 'SELECT * FROM matches WHERE (home_team_id = ? OR away_team_id = ?)'
  const params = [Number(teamId), Number(teamId)]
  if (status) {
    sql += ' AND status = ?'
    params.push(status)
  }
  sql += ' ORDER BY round ASC, match_date ASC, id ASC'
  if (limit) {
    sql += ' LIMIT ?'
    params.push(Number(limit))
  }
  return db.prepare(sql).all(...params).map(attachTeams)
}

export function allMatches() {
  return db
    .prepare('SELECT * FROM matches ORDER BY round ASC, match_date ASC, id ASC')
    .all()
    .map(attachTeams)
}

export function nextUserMatch(teamId) {
  const row = db
    .prepare(
      `SELECT * FROM matches
       WHERE (home_team_id = ? OR away_team_id = ?) AND status = 'scheduled'
       ORDER BY round ASC, match_date ASC, id ASC LIMIT 1`
    )
    .get(Number(teamId), Number(teamId))
  return attachTeams(row)
}

export function recentUserMatches(teamId, limit = 5) {
  return db
    .prepare(
      `SELECT * FROM matches
       WHERE (home_team_id = ? OR away_team_id = ?) AND status = 'finished'
       ORDER BY round DESC, id DESC LIMIT ?`
    )
    .all(Number(teamId), Number(teamId), Number(limit))
    .map(attachTeams)
}

export function roundMatches(round) {
  return db
    .prepare('SELECT * FROM matches WHERE round = ? ORDER BY id ASC')
    .all(Number(round))
    .map(attachTeams)
}

export function saveSimulation(match, sim, { timeline = true, attendance } = {}) {
  const eventsJson = timeline ? JSON.stringify(sim.events) : null
  const gate =
    attendance ??
    Math.round(14000 + match.home_team.stadium_level * 6200 + match.home_team.reputation * 130 + Math.random() * 1800)

  transaction(() => {
    db.prepare(
      `UPDATE matches
       SET home_score = ?, away_score = ?, status = 'finished', attendance = ?, events_json = ?, played_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(sim.homeGoals, sim.awayGoals, gate, eventsJson, match.id)

    db.prepare('DELETE FROM match_player_stats WHERE match_id = ?').run(match.id)
    const insert = db.prepare(
      `INSERT INTO match_player_stats (match_id, player_id, team_id, goals, assists, rating, minutes_played)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    for (const stat of sim.stats) {
      insert.run(match.id, stat.player_id, stat.team_id, stat.goals, stat.assists, stat.rating, stat.minutes_played)
    }
  })

  return matchWithTeams(match.id)
}

export function getStandings() {
  const teams = allTeams()
  const matches = db.prepare("SELECT * FROM matches WHERE status = 'finished'").all()
  const table = new Map(
    teams.map(team => [
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

  for (const match of matches) {
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

export function leadingPlayers({ teamId, limit = 5 } = {}) {
  let sql = `
    SELECT p.id, p.name, p.position, p.overall_rating, p.team_id, t.name AS team_name,
           t.short_name, t.primary_color, t.secondary_color,
           SUM(s.goals) AS goals, SUM(s.assists) AS assists,
           ROUND(AVG(s.rating), 2) AS average_rating, COUNT(s.id) AS appearances
    FROM match_player_stats s
    JOIN players p ON p.id = s.player_id
    JOIN teams t ON t.id = s.team_id
  `
  const params = []
  if (teamId) {
    sql += ' WHERE s.team_id = ?'
    params.push(Number(teamId))
  }
  sql += `
    GROUP BY p.id
    ORDER BY goals DESC, assists DESC, average_rating DESC
    LIMIT ?
  `
  params.push(Number(limit))
  return db.prepare(sql).all(...params)
}

export function matchPlayerStats(matchId) {
  return db
    .prepare(
      `SELECT s.*, p.name, p.position, p.overall_rating, p.shirt_number, t.name AS team_name,
              t.short_name, t.primary_color, t.secondary_color
       FROM match_player_stats s
       JOIN players p ON p.id = s.player_id
       JOIN teams t ON t.id = s.team_id
       WHERE s.match_id = ?
       ORDER BY s.rating DESC`
    )
    .all(Number(matchId))
}

export function matchDetails(matchId) {
  const match = matchWithTeams(matchId)
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
    stats: matchPlayerStats(match.id)
  }
}
