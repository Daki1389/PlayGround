import { getFormation, getStyle } from '../shared/formations.js'

export function mulberry32(seed) {
  let a = seed >>> 0
  return function random() {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const randInt = (rng, min, max) => Math.floor(rng() * (max - min + 1)) + min
const round1 = value => Math.round(value * 10) / 10

function roleWeight(role, player) {
  const overall = Number(player.overall_rating || 70)
  const pace = Number(player.pace ?? overall)
  const shooting = Number(player.shooting ?? overall)
  const passing = Number(player.passing ?? overall)
  const dribbling = Number(player.dribbling ?? overall)
  const defending = Number(player.defending ?? overall)
  const physical = Number(player.physical ?? overall)

  if (role === 'GK') return overall
  if (['CB'].includes(role)) return overall * 0.7 + (defending * 0.5 + physical * 0.35 + pace * 0.15) * 0.3
  if (['LB', 'RB', 'LWB', 'RWB'].includes(role)) {
    return overall * 0.72 + (pace * 0.35 + defending * 0.3 + passing * 0.2 + physical * 0.15) * 0.28
  }
  if (role === 'DM') return overall * 0.72 + (defending * 0.45 + passing * 0.3 + physical * 0.25) * 0.28
  if (role === 'AM') return overall * 0.7 + (passing * 0.4 + dribbling * 0.3 + shooting * 0.3) * 0.3
  if (['CM'].includes(role)) {
    return overall * 0.72 + (passing * 0.38 + dribbling * 0.22 + defending * 0.2 + physical * 0.2) * 0.28
  }
  if (['LW', 'RW'].includes(role)) {
    return overall * 0.7 + (pace * 0.34 + dribbling * 0.32 + shooting * 0.22 + passing * 0.12) * 0.3
  }
  if (role === 'ST') return overall * 0.7 + (shooting * 0.45 + pace * 0.2 + physical * 0.2 + dribbling * 0.15) * 0.3
  return overall
}

export function pickLineup(players, formationId) {
  const formation = getFormation(formationId)
  const pool = players.slice()
  const lineup = []

  for (const slot of formation.slots) {
    let candidates = pool.filter(player => player.position === slot.position)
    if (!candidates.length) candidates = pool.slice()
    candidates.sort((a, b) => roleWeight(slot.role, b) - roleWeight(slot.role, a))
    const player = candidates[0]
    if (!player) break
    pool.splice(pool.indexOf(player), 1)
    lineup.push({
      ...player,
      slot: slot.role,
      x: slot.x,
      y: slot.y
    })
  }

  return {
    formation,
    lineup,
    bench: pool.sort((a, b) => b.overall_rating - a.overall_rating)
  }
}

function groupAverage(lineup, position) {
  const group = lineup.filter(player => player.position === position)
  if (!group.length) return lineup.reduce((sum, p) => sum + Number(p.overall_rating), 0) / Math.max(1, lineup.length)
  return group.reduce((sum, p) => sum + Number(p.overall_rating), 0) / group.length
}

export function teamMetrics(team, players) {
  const { lineup, formation, bench } = pickLineup(players, team.formation || '4-3-3')
  const style = getStyle(team.play_style || 'tiki-taka')
  const tempo = Number(team.tempo || 3)
  const gk = groupAverage(lineup, 'GK')
  const def = groupAverage(lineup, 'DEF')
  const mid = groupAverage(lineup, 'MID')
  const att = groupAverage(lineup, 'ATT')
  const tempoAttack = (tempo - 3) * 1.1
  const tempoDefence = (tempo - 3) * 0.65
  const rating = gk * 0.16 + def * 0.3 + mid * 0.3 + att * 0.24

  return {
    team,
    teamId: team.id,
    lineup,
    bench,
    formation,
    style,
    tempo,
    gk,
    def,
    mid,
    att,
    rating,
    attack: att * 0.58 + mid * 0.42 + style.attack + tempoAttack,
    defence: def * 0.58 + gk * 0.42 + style.defence - tempoDefence
  }
}

function poisson(rng, lambda) {
  const limit = Math.exp(-lambda)
  let product = 1
  let count = 0
  do {
    count += 1
    product *= rng()
  } while (product > limit && count < 9)
  return count - 1
}

function pickWeighted(rng, entries) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0)
  let ticket = rng() * total
  for (const entry of entries) {
    ticket -= entry.weight
    if (ticket <= 0) return entry.value
  }
  return entries[entries.length - 1]?.value
}

function scorerWeight(player) {
  const base = { GK: 0.01, DEF: 0.55, MID: 2.2, ATT: 5.6 }[player.position] || 1
  return base * Math.pow(Number(player.overall_rating) / 76, 2.2)
}

function assistWeight(player) {
  const base = { GK: 0.02, DEF: 0.9, MID: 3.8, ATT: 2.7 }[player.position] || 1
  return base * (0.6 + Number(player.passing ?? player.overall_rating) / 100)
}

function chooseScorer(rng, lineup) {
  return pickWeighted(rng, lineup.map(player => ({ value: player, weight: scorerWeight(player) })))
}

function chooseAssist(rng, lineup, scorer) {
  const options = lineup.filter(player => player.id !== scorer.id)
  if (!options.length) return null
  return pickWeighted(rng, options.map(player => ({ value: player, weight: assistWeight(player) })))
}

function uniqueMinutes(rng, count, min = 2, max = 89) {
  const minutes = new Set()
  let guard = 0
  while (minutes.size < count && guard < 200) {
    minutes.add(randInt(rng, min, max))
    guard += 1
  }
  return [...minutes].sort((a, b) => a - b)
}

function makeRatings(rng, home, away, homeGoals, awayGoals, scorers, assisters, saves) {
  const ratingFor = (player, teamGoals, oppGoals, result) => {
    let rating = 6.05 + rng() * 0.75
    rating += (scorers.get(player.id) || 0) * 1.15
    rating += (assisters.get(player.id) || 0) * 0.65
    rating += result === 'W' ? 0.28 : result === 'L' ? -0.24 : 0.02

    if (player.position === 'GK') {
      if (oppGoals === 0) rating += 0.7
      rating -= oppGoals * 0.2
      rating += (saves.get(player.id) || 0) * 0.07
      if (result === 'L' && oppGoals >= 3) rating -= 0.15
    } else if (player.position === 'DEF') {
      if (oppGoals === 0) rating += 0.32
      rating -= oppGoals * 0.11
    } else if (player.position === 'MID') {
      if (oppGoals === 0) rating += 0.08
      rating -= oppGoals * 0.035
    }

    return round1(clamp(rating, 4, 10))
  }

  const homeResult = homeGoals > awayGoals ? 'W' : homeGoals < awayGoals ? 'L' : 'D'
  const awayResult = awayGoals > homeGoals ? 'W' : awayGoals < homeGoals ? 'L' : 'D'

  return [
    ...home.lineup.map(player => ({
      player_id: player.id,
      name: player.name,
      position: player.position,
      slot: player.slot,
      team_id: home.teamId,
      side: 'home',
      goals: scorers.get(player.id) || 0,
      assists: assisters.get(player.id) || 0,
      rating: ratingFor(player, homeGoals, awayGoals, homeResult),
      minutes_played: 90
    })),
    ...away.lineup.map(player => ({
      player_id: player.id,
      name: player.name,
      position: player.position,
      slot: player.slot,
      team_id: away.teamId,
      side: 'away',
      goals: scorers.get(player.id) || 0,
      assists: assisters.get(player.id) || 0,
      rating: ratingFor(player, awayGoals, homeGoals, awayResult),
      minutes_played: 90
    }))
  ]
}

/**
 * Simulates a match and returns a complete, serialisable result.
 * The timeline is minute ordered and every event carries the live score.
 */
export function simulateMatch({ homeTeam, awayTeam, homePlayers, awayPlayers, seed = 2026, includeTimeline = true }) {
  const rng = mulberry32(seed)
  const home = teamMetrics({ ...homeTeam, teamId: homeTeam.id }, homePlayers)
  const away = teamMetrics({ ...awayTeam, teamId: awayTeam.id }, awayPlayers)

  const homeDiff = home.attack - away.defence + 3.4
  const awayDiff = away.attack - home.defence - 0.7
  const homeXg = clamp(1.1 + homeDiff / 10.4, 0.15, 3.8)
  const awayXg = clamp(0.98 + awayDiff / 10.6, 0.1, 3.5)
  const homeGoals = Math.min(6, poisson(rng, homeXg))
  const awayGoals = Math.min(6, poisson(rng, awayXg))

  const scorers = new Map()
  const assisters = new Map()
  const saves = new Map()
  const sides = [
    ...Array.from({ length: homeGoals }, () => 'home'),
    ...Array.from({ length: awayGoals }, () => 'away')
  ].sort(() => rng() - 0.5)

  const goalMinutes = uniqueMinutes(rng, sides.length, 2, 90)
  const goals = goalMinutes.map((minute, index) => {
    const side = sides[index]
    const attack = side === 'home' ? home : away
    const defence = side === 'home' ? away : home
    const scorer = chooseScorer(rng, attack.lineup)
    let assist = null
    if (rng() < 0.7) {
      assist = chooseAssist(rng, attack.lineup, scorer)
    }
    scorers.set(scorer.id, (scorers.get(scorer.id) || 0) + 1)
    if (assist) assisters.set(assist.id, (assisters.get(assist.id) || 0) + 1)
    return { minute, side, scorer, assist, defence, attack }
  })

  let runningHome = 0
  let runningAway = 0
  const goalEvents = []
  for (const goal of goals.sort((a, b) => a.minute - b.minute)) {
    if (goal.side === 'home') runningHome += 1
    else runningAway += 1
    goalEvents.push({
      ...goal,
      homeScore: runningHome,
      awayScore: runningAway
    })
  }

  const scoreAt = minute => {
    let h = 0
    let a = 0
    for (const goal of goalEvents) {
      if (goal.minute <= minute) {
        h = goal.homeScore
        a = goal.awayScore
      }
    }
    return { home: h, away: a }
  }

  const events = []
  if (includeTimeline) {
    events.push({
      minute: 0,
      order: 0,
      type: 'kickoff',
      side: null,
      homeScore: 0,
      awayScore: 0,
      text: `We're under way at ${homeTeam.stadium_name || 'the stadium'}. ${homeTeam.name} host ${awayTeam.name} under the lights.`,
      headline: 'Kick-off'
    })

    for (const goal of goalEvents) {
      const assistText = goal.assist ? ` ${goal.assist.name} supplied the pass.` : ''
      events.push({
        minute: goal.minute,
        order: 2,
        type: 'goal',
        side: goal.side,
        playerId: goal.scorer.id,
        playerName: goal.scorer.name,
        assistName: goal.assist?.name || null,
        homeScore: goal.homeScore,
        awayScore: goal.awayScore,
        headline: 'GOAL!',
        text: `${goal.scorer.name} finds the net for ${goal.attack.team.name}!${assistText} It's ${goal.homeScore}-${goal.awayScore}.`
      })
    }

    const chanceCount = Math.max(2, Math.round(homeXg * 2 + awayXg * 2 + 3))
    const chanceMinutes = uniqueMinutes(rng, chanceCount, 4, 88)
    for (const minute of chanceMinutes) {
      const side = rng() < homeXg / (homeXg + awayXg) ? 'home' : 'away'
      const attack = side === 'home' ? home : away
      const defence = side === 'home' ? away : home
      const attacker = chooseScorer(rng, attack.lineup)
      const keeper = defence.lineup.find(player => player.position === 'GK') || defence.lineup[0]
      const isSave = rng() < 0.58
      if (isSave) {
        saves.set(keeper.id, (saves.get(keeper.id) || 0) + 1)
        events.push({
          minute,
          order: 1,
          type: 'save',
          side,
          playerId: attacker.id,
          playerName: attacker.name,
          homeScore: scoreAt(minute).home,
          awayScore: scoreAt(minute).away,
          headline: 'Save',
          text: `${attacker.name} tests ${keeper.name}, but the keeper holds on. Fine stop from ${attack.team.name}'s pressure.`
        })
      } else {
        events.push({
          minute,
          order: 1,
          type: 'chance',
          side,
          playerId: attacker.id,
          playerName: attacker.name,
          homeScore: scoreAt(minute).home,
          awayScore: scoreAt(minute).away,
          headline: 'Chance',
          text: `${attack.team.name} work it wide and ${attacker.name} flashes an effort just past the post.`
        })
      }
    }

    const cards = randInt(rng, 1, 4)
    for (const minute of uniqueMinutes(rng, cards, 18, 86)) {
      const side = rng() < 0.5 ? 'home' : 'away'
      const team = side === 'home' ? home : away
      const player = chooseScorer(rng, team.lineup.filter(p => p.position !== 'GK').length ? team.lineup.filter(p => p.position !== 'GK') : team.lineup)
      events.push({
        minute,
        order: 1,
        type: 'card',
        side,
        playerId: player.id,
        playerName: player.name,
        homeScore: scoreAt(minute).home,
        awayScore: scoreAt(minute).away,
        headline: 'Yellow card',
        text: `${player.name} is booked for a cynical challenge. The referee had a clear view.`
      })
    }

    events.push({
      minute: 45,
      order: 3,
      type: 'halftime',
      side: null,
      homeScore: scoreAt(45).home,
      awayScore: scoreAt(45).away,
      headline: 'Half-time',
      text: `Half-time at ${homeTeam.stadium_name || 'the ground'}: ${homeTeam.name} ${scoreAt(45).home}-${scoreAt(45).away} ${awayTeam.name}.`
    })
    events.push({
      minute: 90,
      order: 9,
      type: 'fulltime',
      side: null,
      homeScore: homeGoals,
      awayScore: awayGoals,
      headline: 'Full-time',
      text: `Full-time! ${homeTeam.name} ${homeGoals}-${awayGoals} ${awayTeam.name}. ${homeGoals === awayGoals ? 'The points are shared.' : homeGoals > awayGoals ? `A big win for ${homeTeam.name}.` : `${awayTeam.name} take all three points.`}`
    })

    events.sort((a, b) => a.minute - b.minute || a.order - b.order)
  }

  const stats = makeRatings(rng, home, away, homeGoals, awayGoals, scorers, assisters, saves)
  const motm = stats.slice().sort((a, b) => b.rating - a.rating || b.goals - a.goals)[0] || null

  return {
    home: {
      team: homeTeam,
      metrics: home,
      goals: homeGoals,
      xg: Math.round(homeXg * 10) / 10
    },
    away: {
      team: awayTeam,
      metrics: away,
      goals: awayGoals,
      xg: Math.round(awayXg * 10) / 10
    },
    homeGoals,
    awayGoals,
    events,
    stats,
    motm,
    lineups: {
      home: home.lineup,
      away: away.lineup
    }
  }
}
