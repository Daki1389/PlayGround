import {
  FORMATIONS,
  STAFF_WAGES,
  TOTAL_ROUNDS,
  getTeam,
} from '../data/gameData'
import { clamp } from './format'

// ---------------------------------------------------------------------------
// Selection & table helpers
// ---------------------------------------------------------------------------

const ROLE_FAMILY = {
  GK: ['GK'],
  RB: ['RB', 'RWB'],
  LB: ['LB', 'LWB'],
  CB: ['CB'],
  DM: ['DM', 'CM'],
  CM: ['CM', 'DM', 'AM'],
  AM: ['AM', 'CM', 'RW', 'LW'],
  RW: ['RW', 'AM', 'LW'],
  LW: ['LW', 'AM', 'RW'],
  ST: ['ST', 'AM', 'RW', 'LW'],
}

export function roleFit(player, role) {
  if (!player) return 0
  const family = ROLE_FAMILY[role] || []
  if (player.pos === role) return 5
  if (family.includes(player.pos)) return 3
  if (role === 'RB' && player.pos === 'LB') return 1
  if (role === 'LB' && player.pos === 'RB') return 1
  if ((role === 'DM' || role === 'CM') && player.pos === 'CB') return 1
  return 0
}

export function pickBestLineup(squad, formationKey = '4-2-3-1') {
  const slots = FORMATIONS[formationKey]?.slots || FORMATIONS['4-2-3-1'].slots
  const used = new Set()
  return slots.map((slot) => {
    const candidates = squad
      .filter((player) => !used.has(player.id))
      .map((player) => ({
        player,
        score:
          player.rating +
          roleFit(player, slot.role) * 9 +
          (player.fitness ?? 90) * 0.06 +
          (player.morale ?? 80) * 0.025,
      }))
      .sort((a, b) => b.score - a.score)
    const chosen = candidates[0]?.player
    if (chosen) used.add(chosen.id)
    return chosen?.id
  })
}

export function playersForLineup(state) {
  const squadMap = new Map(state.squad.map((player) => [player.id, player]))
  return state.lineup.map((id) => squadMap.get(id)).filter(Boolean)
}

export function getStartingRating(state) {
  const players = playersForLineup(state)
  if (!players.length) return 75
  return players.reduce((sum, player) => sum + player.rating, 0) / players.length
}

export function getSquadRating(squad) {
  if (!squad.length) return 0
  const best = [...squad].sort((a, b) => b.rating - a.rating).slice(0, 11)
  return best.reduce((sum, player) => sum + player.rating, 0) / best.length
}

export function getWageBill(state) {
  return state.squad.reduce((sum, player) => sum + player.wage, 0) + STAFF_WAGES
}

export function getSquadValue(state) {
  return state.squad.reduce((sum, player) => sum + player.value, 0)
}

export function getStandings(state) {
  return Object.values(state.table)
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.gd !== a.gd) return b.gd - a.gd
      if (b.gf !== a.gf) return b.gf - a.gf
      return getTeam(a.teamId).name.localeCompare(getTeam(b.teamId).name)
    })
    .map((row, index) => ({ ...row, position: index + 1 }))
}

export function getPosition(state, teamId = 'ashcombe') {
  return getStandings(state).find((row) => row.teamId === teamId)?.position ?? 20
}

export function getTableRow(state, teamId) {
  return getStandings(state).find((row) => row.teamId === teamId)
}

export function getUserFixture(state, round = state.matchday) {
  return state.fixtures.find(
    (fixture) => fixture.round === round && (fixture.homeId === 'ashcombe' || fixture.awayId === 'ashcombe'),
  )
}

export function getNextFixture(state) {
  const current = getUserFixture(state, state.matchday)
  if (current) return current
  return state.fixtures.find(
    (fixture) => !fixture.played && (fixture.homeId === 'ashcombe' || fixture.awayId === 'ashcombe'),
  )
}

export function getRoundFixtures(state, round) {
  return state.fixtures.filter((fixture) => fixture.round === round)
}

export function isUserHome(fixture) {
  return fixture?.homeId === 'ashcombe'
}

export function getOpponent(state) {
  const fixture = getNextFixture(state)
  if (!fixture) return null
  const opponentId = fixture.homeId === 'ashcombe' ? fixture.awayId : fixture.homeId
  return getTeam(opponentId)
}

export function nextMatchLabel(state) {
  const fixture = getNextFixture(state)
  if (!fixture) return 'Season complete'
  const opponentId = fixture.homeId === 'ashcombe' ? fixture.awayId : fixture.homeId
  return `${fixture.homeId === 'ashcombe' ? 'vs' : 'away at'} ${getTeam(opponentId).short}`
}

// ---------------------------------------------------------------------------
// Probability
// ---------------------------------------------------------------------------

export function predictOutcome(homeTeam, awayTeam, homeRating, awayRating, plan = 'Balanced') {
  const drawBase = plan === 'Attacking' ? 0.215 : plan === 'Cautious' ? 0.265 : 0.24
  const diff = homeRating + 2.5 - awayRating
  const homeShare = 1 / (1 + Math.exp(-diff / 5.0))
  const home = Math.round((1 - drawBase) * homeShare * 100)
  const draw = Math.round(drawBase * 100)
  const away = 100 - home - draw
  return {
    home: Math.max(3, home),
    draw: Math.max(4, draw),
    away: Math.max(3, 100 - Math.max(3, home) - Math.max(4, draw)),
    homeTeam,
    awayTeam,
  }
}

export function predictFromState(state, plan = 'Balanced') {
  const fixture = getNextFixture(state)
  if (!fixture) return null
  const homeTeam = getTeam(fixture.homeId)
  const awayTeam = getTeam(fixture.awayId)
  const userRating = getStartingRating(state)
  const homeRating = fixture.homeId === 'ashcombe' ? userRating : homeTeam.overall
  const awayRating = fixture.awayId === 'ashcombe' ? userRating : awayTeam.overall
  return {
    ...predictOutcome(homeTeam, awayTeam, homeRating, awayRating, plan),
    fixture,
    homeRating,
    awayRating,
  }
}

// ---------------------------------------------------------------------------
// Quick simulation for the rest of the league
// ---------------------------------------------------------------------------

function poisson(lambda) {
  const limit = Math.exp(-lambda)
  let k = 0
  let p = 1
  do {
    k += 1
    p *= Math.random()
  } while (p > limit && k < 9)
  return k - 1
}

export function simulateQuickScore(homeTeam, awayTeam) {
  const homeXg = clamp(1.38 * Math.exp((homeTeam.overall + 2.5 - awayTeam.overall) / 12), 0.32, 3.1)
  const awayXg = clamp(1.06 * Math.exp((awayTeam.overall - homeTeam.overall - 2.5) / 13), 0.24, 2.7)
  return {
    homeGoals: clamp(poisson(homeXg), 0, 6),
    awayGoals: clamp(poisson(awayXg), 0, 6),
  }
}

// ---------------------------------------------------------------------------
// Live match simulation
// ---------------------------------------------------------------------------

const OPPONENT_SQUADS = {
  northgate: [
    ['Leon Petrov', 'ST'], ['Marcus Bell', 'AM'], ['Diego Santana', 'RW'], ['Owen Visser', 'CM'], ['Tobias Krause', 'CB'], ['Rui Almeida', 'LW'], ['Felix Moreau', 'DM'],
  ],
  kingsport: [
    ['Andre Costa', 'ST'], ['Sam Whitlock', 'RW'], ['Ivan Draganov', 'AM'], ['Callum Price', 'CM'], ['Moussa Cisse', 'CB'], ['Nils Berg', 'LW'], ['Aaron Doyle', 'DM'],
  ],
  ellesmere: [
    ['Jack Rimmer', 'ST'], ['Hugo Salles', 'AM'], ['Ben Farrow', 'LW'], ['Riley Marsh', 'CM'], ['Dario Conti', 'CB'], ['Evan Shaw', 'RW'], ['Kofi Mensah', 'DM'],
  ],
  whitmore: [
    ['Theo Marsh', 'ST'], ['Luis Cabral', 'RW'], ['Finn Oakes', 'AM'], ['Mateo Cruz', 'CM'], ['George Hale', 'CB'], ['Sami Rahimi', 'LW'], ['Anton Vlk', 'DM'],
  ],
  calderton: [
    ['Elliot Vaughn', 'ST'], ['Rocco Bruno', 'AM'], ['Jaylen Moore', 'RW'], ['Pavel Horak', 'CM'], ['Liam Doyle', 'CB'], ['Noa Dupont', 'LW'], ['Tariq Aziz', 'DM'],
  ],
  redcliff: [
    ['Max Tanner', 'ST'], ['Kai Bennett', 'AM'], ['Joel Mensah', 'RW'], ['Arne Dahl', 'CM'], ['Ruben Costa', 'CB'], ['Freddie Lane', 'LW'], ['Ibrahim Sow', 'DM'],
  ],
  ashford: [
    ['Danilo Reis', 'ST'], ['Oliver Finch', 'AM'], ['Ethan Ward', 'RW'], ['Sven Larsen', 'CM'], ['Milan Pavic', 'CB'], ['Toby James', 'LW'], ['Amir Haddadi', 'DM'],
  ],
  marlow: [
    ['Aaron Pike', 'ST'], ['Lucas Neves', 'AM'], ['Billy Nash', 'RW'], ['Henri Blanc', 'CM'], ['Danny Flint', 'CB'], ['Emre Kaya', 'LW'], ['Sam Okoro', 'DM'],
  ],
  bexley: [
    ['Charlie Dunn', 'ST'], ['Reece Palmer', 'AM'], ['Tyrone Ellis', 'RW'], ['Mats Eriksen', 'CM'], ['Frankie Stone', 'CB'], ['Josh Rowe', 'LW'], ['Ayo Balogun', 'DM'],
  ],
  harrowgate: [
    ['Tom Beckett', 'ST'], ['Niall Quinn', 'AM'], ['Aiden Cross', 'RW'], ['Lewis Dean', 'CM'], ['Viktor Novak', 'CB'], ['Sean Byrne', 'LW'], ['Rafa Ortiz', 'DM'],
  ],
  eastvale: [
    ['Jude Carter', 'ST'], ['Milo Jensen', 'AM'], ['Rory Grant', 'RW'], ['Adam Field', 'CM'], ['Kasper Holm', 'CB'], ['Noah Flynn', 'LW'], ['Ade Ojo', 'DM'],
  ],
  stanmore: [
    ['Ben Sterling', 'ST'], ['Mickey Doyle', 'AM'], ['Ollie Banks', 'RW'], ['Piotr Zielinski', 'CM'], ['Craig Mullen', 'CB'], ['Luca Moretti', 'LW'], ['Sami Yilmaz', 'DM'],
  ],
  wrenfield: [
    ['Harry Pike', 'ST'], ['Sonny Mills', 'AM'], ['Kyle Barker', 'RW'], ['Ivo Petrov', 'CM'], ['Rob Foster', 'CB'], ['Jamie Wills', 'LW'], ['Omar Jallow', 'DM'],
  ],
  oakhaven: [
    ['Will Ashton', 'ST'], ['Freddie Moss', 'AM'], ['Luke Hart', 'RW'], ['Igor Sokolov', 'CM'], ['Ned Collins', 'CB'], ['Mason Reid', 'LW'], ['Ebou Ceesay', 'DM'],
  ],
  riverton: [
    ['Danny Moss', 'ST'], ['Alfie Cook', 'AM'], ['Jordan Lake', 'RW'], ['Nico Sanna', 'CM'], ['Brett Walsh', 'CB'], ['Owen Price', 'LW'], ['Ismail Fofana', 'DM'],
  ],
  selby: [
    ['Ryan Booth', 'ST'], ['Cameron Holt', 'AM'], ['Dylan Shaw', 'RW'], ['Marek Nowak', 'CM'], ['Steve Naylor', 'CB'], ['Kian Doyle', 'LW'], ['Tunde Ade', 'DM'],
  ],
  larkspur: [
    ['Ashley Grimes', 'ST'], ['Ewan Blair', 'AM'], ['Liam Fox', 'RW'], ['Tomas Havel', 'CM'], ['Dale Munro', 'CB'], ['Rui Pinto', 'LW'], ['Sekou Keita', 'DM'],
  ],
  dunmore: [
    ['Craig Bolton', 'ST'], ['Ian Mercer', 'AM'], ['Paul Rennie', 'RW'], ['Andrei Popa', 'CM'], ['Gary Stokes', 'CB'], ['Kevin Doyle', 'LW'], ['Yannick Boli', 'DM'],
  ],
  pevensey: [
    ['Lee Curtis', 'ST'], ['Matt Rowe', 'AM'], ['Joe Tanner', 'RW'], ['Elvis Kovac', 'CM'], ['Neil Bishop', 'CB'], ['Alex Penn', 'LW'], ['Mo Sarr', 'DM'],
  ],
}

function opponentSquad(team) {
  const names = OPPONENT_SQUADS[team.id] || [
    [`${team.short} Striker`, 'ST'],
    [`${team.short} Winger`, 'RW'],
    [`${team.short} Playmaker`, 'AM'],
    [`${team.short} Midfielder`, 'CM'],
    [`${team.short} Defender`, 'CB'],
  ]
  return names.map(([name, pos], index) => ({
    id: `${team.id}-op-${index}`,
    name,
    pos,
    role: pos,
    rating: Math.round(team.overall + (pos === 'ST' ? 1.5 : pos === 'CB' ? -0.5 : 0)),
    isOpponent: true,
  }))
}

export function buildMatchContext(state, fixture) {
  const homeTeam = getTeam(fixture.homeId)
  const awayTeam = getTeam(fixture.awayId)
  const userPlayers = playersForLineup(state)
  const userRating = getStartingRating(state)
  const homeIsUser = fixture.homeId === 'ashcombe'
  const homePlayers = homeIsUser ? userPlayers : opponentSquad(homeTeam)
  const awayPlayers = !homeIsUser ? userPlayers : opponentSquad(awayTeam)
  return {
    fixture,
    homeTeam,
    awayTeam,
    homeRating: homeIsUser ? userRating : homeTeam.overall,
    awayRating: !homeIsUser ? userRating : awayTeam.overall,
    homePlayers,
    awayPlayers,
    userIsHome: homeIsUser,
    stadium: homeTeam.stadium,
    plan: state.matchPlan || 'Balanced',
  }
}

const GOAL_FINISHES = [
  'rifles it into the top corner',
  'sweeps it home from close range',
  'plants a header beyond the keeper',
  'curls a beauty into the far side',
  'finishes a lightning counter-attack',
  'drills it low into the bottom corner',
  'dinks it over the onrushing goalkeeper',
]

const GOAL_SETUPS = [
  'a slick one-two opens the defence',
  'the cross is inch-perfect',
  'a defence-splitting pass creates the chance',
  'the press forces a costly turnover',
  'some clever link-up play on the edge of the box',
]

const CHANCE_COMMENTS = [
  'forces a smart save at the near post',
  'drags the effort just wide of the upright',
  'sees the shot blocked by a last-ditch challenge',
  'hits it first time but the keeper is equal to it',
  'tries his luck from range and clears the bar',
  'gets in behind but the angle is too tight',
]

const LIVE_COMMENTS = [
  'The tempo is rising. Both benches are on their feet.',
  'A patient spell of possession from the hosts.',
  'The away side are pressing higher now.',
  'Fenwick Park is in full voice.',
  'A crunching tackle in midfield lifts the crowd.',
  'The referee has a word with the captains.',
  'Good circulation down the left flank.',
  'The manager is barking instructions from the touchline.',
]

function weightedCrash() {
  return Math.random()
}

function scoreWeight(pos) {
  if (pos === 'GK') return 0.05
  if (pos === 'CB') return 0.55
  if (pos === 'RB' || pos === 'LB') return 1.1
  if (pos === 'DM') return 1.0
  if (pos === 'CM') return 1.9
  if (pos === 'AM') return 3.8
  if (pos === 'RW' || pos === 'LW') return 3.4
  return 5.6
}

function assistWeight(pos) {
  if (pos === 'GK' || pos === 'CB') return 0.4
  if (pos === 'RB' || pos === 'LB') return 2.2
  if (pos === 'DM') return 1.5
  if (pos === 'CM') return 2.7
  if (pos === 'AM') return 4
  if (pos === 'RW' || pos === 'LW') return 3.5
  return 1.7
}

function pickWeighted(players, weightFn, excludeId) {
  const pool = players.filter((player) => player.id !== excludeId)
  if (!pool.length) return players[0]
  const total = pool.reduce((sum, player) => sum + weightFn(player.pos), 0)
  let roll = Math.random() * total
  for (const player of pool) {
    roll -= weightFn(player.pos)
    if (roll <= 0) return player
  }
  return pool[pool.length - 1]
}

function sideModifiers(ctx, side, plan, talk) {
  const isUser = side === 'home' ? ctx.userIsHome : !ctx.userIsHome
  let attack = 1
  let defence = 1
  if (isUser) {
    if (plan === 'Attacking') {
      attack *= 1.18
      defence *= 0.9
    } else if (plan === 'Cautious') {
      attack *= 0.84
      defence *= 1.14
    }
    if (talk === 'Demand more') {
      attack *= 1.12
      defence *= 0.95
    } else if (talk === 'Calm and composed') {
      attack *= 0.95
      defence *= 1.1
    } else if (talk === 'Show your quality') {
      attack *= 1.07
      defence *= 1.04
    }
  }
  return { attack, defence, isUser }
}

export function createMatchState(ctx) {
  return {
    minute: 0,
    homeGoals: 0,
    awayGoals: 0,
    finished: false,
    stats: {
      home: { shots: 0, onTarget: 0, corners: 0, fouls: 0, xg: 0, possession: 50, yellow: 0 },
      away: { shots: 0, onTarget: 0, corners: 0, fouls: 0, xg: 0, possession: 50, yellow: 0 },
    },
    possessionTicks: { home: 1, away: 1 },
    events: [
      {
        id: 'kickoff',
        minute: 0,
        type: 'kickoff',
        text: `We're under way at ${ctx.stadium}. ${ctx.homeTeam.name} get us started.`,
        teamId: null,
      },
    ],
  }
}

function possessionShifts(match, ctx, plan) {
  const homeEdge = clamp(0.5 + (ctx.homeRating - ctx.awayRating) / 75, 0.35, 0.66)
  const userTempo = plan === 'Attacking' ? 0.03 : plan === 'Cautious' ? -0.03 : 0
  const edge = ctx.userIsHome ? homeEdge + userTempo : homeEdge - userTempo
  const ticks = { ...match.possessionTicks }
  if (Math.random() < edge) ticks.home += 1
  else ticks.away += 1
  const total = ticks.home + ticks.away
  return { ticks, home: Math.round((ticks.home / total) * 100) }
}

function appendEvent(events, event) {
  return [...events, { id: `${event.minute}-${event.type}-${Math.random().toString(36).slice(2, 7)}`, ...event }]
}

export function simulateMinute(match, ctx, plan = 'Balanced', talk = null) {
  if (match.finished) return match
  const minute = Math.min(90, match.minute + 1)
  const stats = {
    home: { ...match.stats.home },
    away: { ...match.stats.away },
  }
  let homeGoals = match.homeGoals
  let awayGoals = match.awayGoals
  let events = [...match.events]
  const possession = possessionShifts(match, ctx, plan)
  stats.home.possession = possession.home
  stats.away.possession = 100 - possession.home

  const homeMods = sideModifiers(ctx, 'home', plan, talk)
  const awayMods = sideModifiers(ctx, 'away', plan, talk)
  const homeDiff = ctx.homeRating + 2.5 - ctx.awayRating
  const awayDiff = ctx.awayRating - ctx.homeRating - 2.5

  const attempts = [
    {
      side: 'home',
      team: ctx.homeTeam,
      players: ctx.homePlayers,
      mods: homeMods,
      diff: homeDiff,
      teamId: ctx.homeTeam.id,
    },
    {
      side: 'away',
      team: ctx.awayTeam,
      players: ctx.awayPlayers,
      mods: awayMods,
      diff: awayDiff,
      teamId: ctx.awayTeam.id,
    },
  ]

  for (const chance of attempts) {
    const shotChance = clamp(
      0.122 * (1 + chance.diff / 62) * chance.mods.attack,
      0.055,
      0.215,
    )
    if (Math.random() < shotChance) {
      const attackPlayer = pickWeighted(chance.players, scoreWeight)
      const quality = Math.random()
      const sideStats = stats[chance.side]
      sideStats.shots += 1
      sideStats.xg = Math.round((sideStats.xg + 0.06 + quality * 0.32) * 100) / 100
      const onTarget = Math.random() < 0.42 + quality * 0.16
      const opposingRating = chance.side === 'home' ? ctx.awayRating : ctx.homeRating
      const conversion = clamp(
        (0.245 + quality * 0.22) *
          (1 + (chance.mods.attack - 1) * 1.1) *
          (1 + (chance.side === 'home' ? homeDiff : awayDiff) / 70) *
          (1 / chance.mods.defence),
        0.07,
        0.58,
      )
      const isGoal = onTarget && weightedCrash() < conversion
      if (isGoal) {
        if (chance.side === 'home') homeGoals += 1
        else awayGoals += 1
        sideStats.onTarget += 1
        const assister = Math.random() < 0.72 ? pickWeighted(chance.players, assistWeight, attackPlayer.id) : null
        const setup = GOAL_SETUPS[Math.floor(Math.random() * GOAL_SETUPS.length)]
        const finish = GOAL_FINISHES[Math.floor(Math.random() * GOAL_FINISHES.length)]
        events = appendEvent(events, {
          minute,
          type: 'goal',
          teamId: chance.teamId,
          playerId: attackPlayer.id,
          playerName: attackPlayer.name,
          text: `GOAL! ${attackPlayer.name} ${finish}.`,
          detail: assister ? `${setup}, ${assister.name} with the assist.` : 'A moment of individual brilliance.',
        })
      } else if (onTarget) {
        sideStats.onTarget += 1
        const comment = CHANCE_COMMENTS[Math.floor(Math.random() * CHANCE_COMMENTS.length)]
        events = appendEvent(events, {
          minute,
          type: 'save',
          teamId: chance.teamId,
          playerId: attackPlayer.id,
          playerName: attackPlayer.name,
          text: `${attackPlayer.name} ${comment}.`,
          detail: `${chance.team.short} keep the pressure on.`,
        })
      } else {
        if (Math.random() < 0.42) sideStats.corners += 1
        const comment = CHANCE_COMMENTS[Math.floor(Math.random() * CHANCE_COMMENTS.length)]
        events = appendEvent(events, {
          minute,
          type: 'shot',
          teamId: chance.teamId,
          playerId: attackPlayer.id,
          playerName: attackPlayer.name,
          text: `${attackPlayer.name} ${comment}.`,
          detail: `${chance.team.short} work the opening well.`,
        })
      }
    }

    if (Math.random() < 0.023) {
      const offender = pickWeighted(chance.players, (pos) => (pos === 'DM' ? 3 : pos === 'CB' ? 2.5 : 1))
      stats[chance.side].fouls += 1
      stats[chance.side].yellow += 1
      events = appendEvent(events, {
        minute,
        type: 'card',
        teamId: chance.teamId,
        playerId: offender.id,
        playerName: offender.name,
        text: `Yellow card for ${offender.name} after a cynical foul.`,
        detail: 'The referee had a clear view.',
      })
    }

    if (Math.random() < 0.01) {
      const injured = pickWeighted(chance.players, () => 1)
      events = appendEvent(events, {
        minute,
        type: 'injury',
        teamId: chance.teamId,
        playerId: injured.id,
        playerName: injured.name,
        text: `Physio on for ${injured.name}.`,
        detail: 'He looks able to continue after treatment.',
      })
    }
  }

  if (Math.random() < 0.035) {
    const side = Math.random() < 0.5 ? ctx.homeTeam : ctx.awayTeam
    events = appendEvent(events, {
      minute,
      type: 'info',
      teamId: side.id,
      text: LIVE_COMMENTS[Math.floor(Math.random() * LIVE_COMMENTS.length)],
      detail: null,
    })
  }

  if (minute === 45) {
    events = appendEvent(events, {
      minute,
      type: 'half',
      teamId: null,
      text: `Half-time: ${ctx.homeTeam.short} ${homeGoals}–${awayGoals} ${ctx.awayTeam.short}`,
      detail: 'The players head down the tunnel. Time for the manager to have his say.',
    })
  }

  if (minute >= 90) {
    events = appendEvent(events, {
      minute: 90,
      type: 'fulltime',
      teamId: null,
      text: `Full-time: ${ctx.homeTeam.short} ${homeGoals}–${awayGoals} ${ctx.awayTeam.short}`,
      detail: 'The referee brings a compelling contest to an end.',
    })
    return {
      ...match,
      minute: 90,
      homeGoals,
      awayGoals,
      stats,
      possessionTicks: possession.ticks,
      events,
      finished: true,
    }
  }

  return {
    ...match,
    minute,
    homeGoals,
    awayGoals,
    stats,
    possessionTicks: possession.ticks,
    events,
  }
}

export function skipToFullTime(match, ctx, plan = 'Balanced', talk = null) {
  let next = match
  let guard = 0
  while (!next.finished && guard < 100) {
    next = simulateMinute(next, ctx, plan, talk)
    guard += 1
  }
  return next
}

export function playerMatchRatings(match, ctx) {
  const goalsByPlayer = {}
  const assistsByPlayer = {}
  for (const event of match.events) {
    if (event.type === 'goal' && event.playerId) {
      goalsByPlayer[event.playerId] = (goalsByPlayer[event.playerId] || 0) + 1
    }
  }
  const userWon = ctx.userIsHome
    ? match.homeGoals > match.awayGoals
    : match.awayGoals > match.homeGoals
  const userDrew = match.homeGoals === match.awayGoals
  const userPlayers = ctx.userIsHome ? ctx.homePlayers : ctx.awayPlayers
  return userPlayers.map((player) => {
    const base = 6.1 + (player.rating - 74) * 0.038
    const goals = (goalsByPlayer[player.id] || 0) * 1.05
    const resultBonus = userWon ? 0.45 : userDrew ? 0.12 : -0.25
    const rating = clamp(base + goals + resultBonus + Math.random() * 0.35, 4.8, 10)
    return {
      id: player.id,
      name: player.name,
      pos: player.pos,
      rating: Math.round(rating * 10) / 10,
      goals: goalsByPlayer[player.id] || 0,
      assists: assistsByPlayer[player.id] || 0,
    }
  }).sort((a, b) => b.rating - a.rating)
}

export function playerOfTheMatch(match, ctx) {
  const ratings = playerMatchRatings(match, ctx)
  return ratings[0] || null
}

export function buildResult(match, ctx, ratings) {
  const userGoals = ctx.userIsHome ? match.homeGoals : match.awayGoals
  const oppGoals = ctx.userIsHome ? match.awayGoals : match.homeGoals
  const opponent = ctx.userIsHome ? ctx.awayTeam : ctx.homeTeam
  return {
    fixtureId: ctx.fixture.id,
    round: ctx.fixture.round,
    opponentId: opponent.id,
    opponentName: opponent.name,
    home: ctx.userIsHome,
    goalsFor: userGoals,
    goalsAgainst: oppGoals,
    homeGoals: match.homeGoals,
    awayGoals: match.awayGoals,
    homeTeamId: ctx.homeTeam.id,
    awayTeamId: ctx.awayTeam.id,
    events: match.events,
    stats: match.stats,
    ratings,
    playerOfMatch: ratings?.[0] || null,
    date: ctx.fixture.date,
    venue: ctx.stadium,
  }
}

// ---------------------------------------------------------------------------
// Squad / player helpers
// ---------------------------------------------------------------------------

export function getPlayerAttributes(player) {
  const base = player.rating
  let seed = 0
  for (let i = 0; i < player.id.length; i += 1) seed += player.id.charCodeAt(i) * (i + 3)
  const jitter = (salt) => ((seed * (salt + 7)) % 13) - 6
  const pos = player.pos
  const offsets = {
    pace: ['GK', 'CB'].includes(pos) ? -12 : pos === 'ST' ? 2 : ['RW', 'LW', 'RB', 'LB'].includes(pos) ? 7 : 0,
    shooting: pos === 'GK' ? -38 : ['ST', 'AM', 'RW', 'LW'].includes(pos) ? 6 : pos === 'CB' ? -18 : -2,
    passing: ['GK', 'CB'].includes(pos) ? -7 : ['AM', 'CM', 'DM'].includes(pos) ? 7 : 2,
    defending: ['GK'].includes(pos) ? -35 : ['CB', 'DM'].includes(pos) ? 10 : ['RB', 'LB'].includes(pos) ? 4 : -10,
    physical: ['CB', 'ST', 'DM'].includes(pos) ? 7 : 1,
    goalkeeping: pos === 'GK' ? 0 : -35,
  }
  const value = (key) => clamp(Math.round(base + offsets[key] + jitter(key.length + key.charCodeAt(0))), 22, 96)
  return {
    pace: value('pace'),
    shooting: value('shooting'),
    passing: value('passing'),
    defending: value('defending'),
    physical: value('physical'),
    goalkeeping: value('goalkeeping'),
  }
}

export function resultLetter(goalsFor, goalsAgainst) {
  if (goalsFor > goalsAgainst) return 'W'
  if (goalsFor < goalsAgainst) return 'L'
  return 'D'
}

export function progressPercent(matchday) {
  return clamp(Math.round(((matchday - 1) / TOTAL_ROUNDS) * 100), 0, 100)
}

export function facilityScore(facilities) {
  const list = Object.values(facilities)
  const total = list.reduce((sum, item) => sum + item.level, 0)
  const max = list.reduce((sum, item) => sum + item.max, 0)
  return Math.round((total / max) * 100)
}

export function formatForm(form = []) {
  return form.join('')
}

export function getOpponentKeyPlayers(team) {
  return opponentSquad(team).slice(0, 3)
}
