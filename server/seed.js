import { db, transaction } from './db.js'
import { allTeams, playersByTeam, roundMatches, saveSimulation } from './store.js'
import { mulberry32, simulateMatch } from '../shared/engine.js'
import { TEAM_SEEDS, buildSchedule, generatePlayers } from '../shared/club-data.js'

export function seedDatabase() {
  const existing = db.prepare('SELECT COUNT(*) AS count FROM teams').get()
  if (Number(existing.count) > 0) return { seeded: false }

  transaction(() => {
    const insertTeam = db.prepare(
      `INSERT INTO teams
        (name, short_name, city, country, reputation, budget, wage_budget, stadium_level,
         training_facility_level, youth_academy_level, stadium_name, primary_color, secondary_color,
         formation, play_style, tempo, is_user, founded)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )

    for (const team of TEAM_SEEDS) {
      insertTeam.run(
        team.name, team.short_name, team.city, team.country, team.reputation, team.budget,
        team.wage_budget, 1, 1, 1, team.stadium_name, team.primary_color, team.secondary_color,
        team.formation, team.play_style, team.tempo, team.is_user, team.founded
      )
    }

    const teams = allTeams()
    const insertPlayer = db.prepare(
      `INSERT INTO players
        (team_id, name, position, age, overall_rating, potential_rating, market_value, wage,
         stamina, morale, pace, shooting, passing, dribbling, defending, physical, shirt_number, nationality)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )

    teams.forEach((team, teamIndex) => {
      const rng = mulberry32(7100 + team.id * 131)
      const players = generatePlayers(TEAM_SEEDS[teamIndex], team.id, rng)
      for (const player of players) {
        insertPlayer.run(
          player.team_id, player.name, player.position, player.age, player.overall_rating,
          player.potential_rating, player.market_value, player.wage, player.stamina, player.morale,
          player.pace, player.shooting, player.passing, player.dribbling, player.defending,
          player.physical, player.shirt_number, player.nationality
        )
      }
    })

    const schedule = buildSchedule(teams.map(team => team.id))
    const insertMatch = db.prepare(
      `INSERT INTO matches (home_team_id, away_team_id, status, round, match_date, season)
       VALUES (?, ?, 'scheduled', ?, ?, ?)`
    )
    for (const round of schedule) {
      for (const fixture of round.fixtures) {
        insertMatch.run(fixture.home, fixture.away, round.round, round.date, round.season)
      }
    }
  })

  // Give the league some history: rounds 1-4 are already in the books.
  for (let round = 1; round <= 4; round += 1) {
    for (const match of roundMatches(round)) {
      const homePlayers = playersByTeam(match.home_team_id)
      const awayPlayers = playersByTeam(match.away_team_id)
      const sim = simulateMatch({
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        homePlayers,
        awayPlayers,
        // Fixed historical seed keeps the pre-season results consistent while
        // producing a realistic spread of scorelines (44 goals across 4 rounds).
        seed: 3908 + match.id * 17,
        includeTimeline: false
      })
      saveSimulation(match, sim, { timeline: false })
    }
  }

  return { seeded: true }
}
