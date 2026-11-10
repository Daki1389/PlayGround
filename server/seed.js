import { db, transaction } from './db.js'
import { allTeams, playersByTeam, roundMatches, saveSimulation } from './store.js'
import { mulberry32, simulateMatch } from './engine.js'

const NAMES = {
  NUN: [
    'Elliot Marsh', 'Aaron Pike', 'Freddie Lowe',
    'Callum Reed', 'Mason Cole', 'Harry Dawson', 'Liam Bennett', 'Jack Turner', 'Noah Sinclair', 'George Hughes',
    'Oliver Hart', 'James Whitmore', 'Ethan Shaw', 'Alfie Grant', 'Ryan Mercer', 'Finley Brooks',
    'Leo Ashford', 'Charlie Ward', 'Lewis Fletcher', 'Tom Harlow'
  ],
  KBC: [
    'Sam Pritchard', 'Danny Keane', 'Owen Barrett',
    'Marcus Vale', 'Joel Stanton', 'Toby Mercer', 'Kieran Doyle', 'Aaron Beck', 'Nathan Croft', 'Riley Dunn',
    'Declan Moore', 'Isaac Frost', 'Harvey Lane', 'Joshua Penn', 'Ellis Ward', 'Connor Hayes',
    'Theo Sinclair', 'Max Kingsley', 'Jude Foster', 'Evan Blake'
  ],
  AUR: [
    'Matteo Bellini', 'Luca Ferraro', 'Davide Conti',
    'Alessandro Ricci', 'Marco De Luca', 'Simone Gallo', 'Riccardo Esposito', 'Tommaso Greco', 'Federico Rizzo', 'Andrea Moretti',
    'Lorenzo Bianchi', 'Nicolo Romano', 'Giulio Marchetti', 'Edoardo Villa', 'Pietro Lombardi', 'Sergio Fontana',
    'Rafael Costa', 'Diego Serra', 'Nico Barbieri', 'Enzo Fabbri'
  ],
  RHE: [
    'Lukas Brandt', 'Felix Neumann', 'Jonas Kruger',
    'Maximilian Wolf', 'Niklas Bauer', 'Tim Schneider', 'Julian Fuchs', 'Fabian Vogel', 'Leon Hartmann', 'Erik Schuler',
    'Moritz Adler', 'Paul Winkler', 'Finn Becker', 'Emil Roth', 'David Kern', 'Tobias Lang',
    'Dominik Haas', 'Lennart Krause', 'Yannick Stolz', 'Marvin Ott'
  ],
  SOL: [
    'Diego Salas', 'Iker Montoya', 'Ruben Pardo',
    'Adrian Vega', 'Pablo Serrano', 'Hugo Campos', 'Marcos Rivas', 'Alvaro Nieto', 'Sergio Luna', 'Ivan Cortes',
    'Mateo Silva', 'Nico Ferrer', 'Alejandro Rey', 'Javier Moya', 'Bruno Ortega', 'Dani Crespo',
    'Rafa Duarte', 'Gonzalo Marin', 'Lucas Prieto', 'Emilio Santos'
  ],
  AZU: [
    'Hugo Lemaire', 'Theo Garnier', 'Mathis Roux',
    'Lucas Morel', 'Enzo Girard', 'Nathan Perrin', 'Adrien Fontaine', 'Jules Chevalier', 'Maxime Robin', 'Clement Faure',
    'Yanis Benali', 'Rayan Diallo', 'Arthur Mercier', 'Noe Lambert', 'Ilyes Mansouri', 'Baptiste Andre',
    'Kylian Vasseur', 'Amine Traore', 'Malo Renard', 'Samir Ouedraogo'
  ],
  SPA: [
    'Rui Tavares', 'Nuno Freitas', 'Vitor Moura',
    'Tiago Fonseca', 'Andre Lopes', 'Goncalo Pinto', 'Diogo Matos', 'Bruno Teixeira', 'Miguel Araujo', 'Rafael Nunes',
    'Joao Mendes', 'Pedro Carvalho', 'Francisco Alves', 'Duarte Pires', 'Henrique Costa', 'Vasco Lima',
    'Rodrigo Neves', 'Afonso Castro', 'Gabriel Souza', 'Tomas Barros'
  ],
  ORA: [
    'Bram de Vries', 'Sven Bakker', 'Jesper Visser',
    'Daan Smit', 'Ruben van Dijk', 'Finn Jansen', 'Milan de Boer', 'Sem Mulder', 'Lars Bosch', 'Kees van Loon',
    'Noah van Berg', 'Thijs Hendriks', 'Zion Vermeer', 'Joris Dekker', 'Mees van Dam', 'Rayan El Amrani',
    'Timo van Es', 'Jaylen Roos', 'Stijn Koster', 'Odin de Wit'
  ]
}

const POSITION_PATTERN = [
  'GK', 'GK', 'GK',
  'DEF', 'DEF', 'DEF', 'DEF', 'DEF', 'DEF', 'DEF',
  'MID', 'MID', 'MID', 'MID', 'MID', 'MID',
  'ATT', 'ATT', 'ATT', 'ATT'
]

const SHIRT_NUMBERS = {
  GK: [1, 13, 25],
  DEF: [2, 3, 4, 5, 6, 15, 22],
  MID: [8, 10, 14, 16, 18, 20],
  ATT: [7, 9, 11, 17]
}

const TEAM_SEEDS = [
  {
    name: 'Northgate United', short_name: 'NUN', city: 'Northgate', country: 'England',
    reputation: 77, budget: 32000000, wage_budget: 1350000, stadium_name: 'Northgate Park',
    primary_color: '#c9f75c', secondary_color: '#0a1005', formation: '4-3-3',
    play_style: 'gegenpressing', tempo: 4, is_user: 1, founded: 1898
  },
  {
    name: 'Kingsbridge City', short_name: 'KBC', city: 'Kingsbridge', country: 'England',
    reputation: 81, budget: 58000000, wage_budget: 1900000, stadium_name: 'Kingsbridge Arena',
    primary_color: '#6ea8ff', secondary_color: '#08111f', formation: '4-2-3-1',
    play_style: 'tiki-taka', tempo: 3, is_user: 0, founded: 1904
  },
  {
    name: 'Aurora Milano', short_name: 'AUR', city: 'Milano', country: 'Italy',
    reputation: 84, budget: 74000000, wage_budget: 2350000, stadium_name: 'Stadio Aurora',
    primary_color: '#ff5d73', secondary_color: '#190a0f', formation: '4-3-3',
    play_style: 'gegenpressing', tempo: 4, is_user: 0, founded: 1901
  },
  {
    name: 'Rheinberg 04', short_name: 'RHE', city: 'Rheinberg', country: 'Germany',
    reputation: 79, budget: 46000000, wage_budget: 1650000, stadium_name: 'Rheinberg Arena',
    primary_color: '#ffc857', secondary_color: '#141005', formation: '4-2-3-1',
    play_style: 'gegenpressing', tempo: 4, is_user: 0, founded: 1904
  },
  {
    name: 'Atletico Sol', short_name: 'SOL', city: 'Sevilla', country: 'Spain',
    reputation: 82, budget: 62000000, wage_budget: 2100000, stadium_name: 'Estadio del Sol',
    primary_color: '#ff8a3d', secondary_color: '#160d08', formation: '4-3-3',
    play_style: 'counter', tempo: 3, is_user: 0, founded: 1907
  },
  {
    name: 'Olympique Azur', short_name: 'AZU', city: 'Nice', country: 'France',
    reputation: 78, budget: 44000000, wage_budget: 1550000, stadium_name: 'Stade Azur',
    primary_color: '#62e6d5', secondary_color: '#061412', formation: '3-5-2',
    play_style: 'counter', tempo: 4, is_user: 0, founded: 1912
  },
  {
    name: 'Sporting Atlantico', short_name: 'SPA', city: 'Lisboa', country: 'Portugal',
    reputation: 74, budget: 26000000, wage_budget: 1100000, stadium_name: 'Estadio Atlantico',
    primary_color: '#a78bfa', secondary_color: '#0e0a1a', formation: '4-2-3-1',
    play_style: 'tiki-taka', tempo: 2, is_user: 0, founded: 1919
  },
  {
    name: 'AFC Oranje', short_name: 'ORA', city: 'Amsterdam', country: 'Netherlands',
    reputation: 73, budget: 22000000, wage_budget: 980000, stadium_name: 'Oranje Dome',
    primary_color: '#fb7185', secondary_color: '#170a0e', formation: '3-5-2',
    play_style: 'gegenpressing', tempo: 5, is_user: 0, founded: 1923
  }
]

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const roundTo = (value, step) => Math.round(value / step) * step

function generateAttributes(rng, position, overall) {
  const r = (min, max) => Math.round(min + rng() * (max - min))
  if (position === 'GK') {
    return {
      pace: r(48, 64), shooting: r(18, 35), passing: r(55, 76), dribbling: r(28, 48),
      defending: r(28, 45), physical: r(72, 88)
    }
  }
  if (position === 'DEF') {
    return {
      pace: r(64, 84), shooting: r(30, 55), passing: r(58, 78), dribbling: r(52, 73),
      defending: clamp(overall + r(1, 5), 55, 95), physical: r(74, 90)
    }
  }
  if (position === 'MID') {
    return {
      pace: r(66, 86), shooting: r(63, 83), passing: clamp(overall + r(1, 5), 55, 95),
      dribbling: r(70, 89), defending: r(52, 79), physical: r(64, 82)
    }
  }
  return {
    pace: r(76, 93), shooting: clamp(overall + r(1, 5), 55, 95), passing: r(64, 83),
    dribbling: r(74, 92), defending: r(28, 54), physical: r(66, 85)
  }
}

function generatePlayers(teamSeed, teamId, rng) {
  const names = NAMES[teamSeed.short_name]
  const usedNumbers = new Set()
  const players = []

  POSITION_PATTERN.forEach((position, index) => {
    const age = index < 3 ? Math.round(23 + rng() * 11) : Math.round(18 + rng() * 15)
    const starBoost = index < 2 ? 3 : index < 5 ? 1 : 0
    const overall = clamp(Math.round(teamSeed.reputation - 7 + rng() * 14) + starBoost, 59, 91)
    const potentialBonus =
      age <= 20 ? Math.round(7 + rng() * 8) :
      age <= 23 ? Math.round(4 + rng() * 7) :
      age <= 26 ? Math.round(1 + rng() * 5) :
      Math.round(rng() * 2)
    const potential = clamp(Math.max(overall, overall + potentialBonus), overall, 95)
    const ageFactor = age <= 21 ? 1.45 : age <= 25 ? 1.22 : age <= 29 ? 1 : age <= 32 ? 0.68 : 0.38
    const marketValue = roundTo(Math.max(400000, Math.pow(overall - 40, 3) * 380 * ageFactor), 100000)
    const wage = clamp(roundTo(marketValue * 0.00062, 500), 3500, 145000)
    const numbers = SHIRT_NUMBERS[position]
    const shirt = numbers.find(number => !usedNumbers.has(number)) ?? numbers[0]
    usedNumbers.add(shirt)

    players.push({
      team_id: teamId,
      name: names[index],
      position,
      age,
      overall_rating: overall,
      potential_rating: potential,
      market_value: marketValue,
      wage,
      stamina: Math.round(78 + rng() * 21),
      morale: Math.round(64 + rng() * 32),
      ...generateAttributes(rng, position, overall),
      shirt_number: shirt,
      nationality: teamSeed.country
    })
  })

  return players
}

function buildSchedule(teamIds, season = '2026/27') {
  const rotation = teamIds.slice()
  const rounds = []
  const n = rotation.length
  const baseDate = new Date('2026-10-17T15:00:00Z')

  for (let round = 0; round < n - 1; round += 1) {
    const fixtures = []
    for (let i = 0; i < n / 2; i += 1) {
      let home = rotation[i]
      let away = rotation[n - 1 - i]
      if (round % 2 === 1) [home, away] = [away, home]
      fixtures.push({ home, away })
    }
    rounds.push(fixtures)
    rotation.splice(1, 0, rotation.pop())
  }

  const firstLeg = rounds.map(fixtures => fixtures.map(fixture => ({ ...fixture })))
  const secondLeg = firstLeg.map(fixtures => fixtures.map(fixture => ({ home: fixture.away, away: fixture.home })))

  return [...firstLeg, ...secondLeg].map((fixtures, index) => {
    const date = new Date(baseDate.getTime() + index * 7 * 24 * 60 * 60 * 1000)
    return {
      round: index + 1,
      season,
      date: date.toISOString().slice(0, 10),
      fixtures
    }
  })
}

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
