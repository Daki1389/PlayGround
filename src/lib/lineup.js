import { getFormation } from '../../shared/formations.js'

function roleScore(role, player) {
  const overall = Number(player.overall_rating || 70)
  const pace = Number(player.pace ?? overall)
  const shooting = Number(player.shooting ?? overall)
  const passing = Number(player.passing ?? overall)
  const dribbling = Number(player.dribbling ?? overall)
  const defending = Number(player.defending ?? overall)
  const physical = Number(player.physical ?? overall)

  if (role === 'GK') return overall
  if (role === 'CB') return overall * 0.7 + (defending * 0.5 + physical * 0.35 + pace * 0.15) * 0.3
  if (['LB', 'RB', 'LWB', 'RWB'].includes(role)) {
    return overall * 0.72 + (pace * 0.35 + defending * 0.3 + passing * 0.2 + physical * 0.15) * 0.28
  }
  if (role === 'DM') return overall * 0.72 + (defending * 0.45 + passing * 0.3 + physical * 0.25) * 0.28
  if (role === 'AM') return overall * 0.7 + (passing * 0.4 + dribbling * 0.3 + shooting * 0.3) * 0.3
  if (role === 'CM') return overall * 0.72 + (passing * 0.38 + dribbling * 0.22 + defending * 0.2 + physical * 0.2) * 0.28
  if (['LW', 'RW'].includes(role)) {
    return overall * 0.7 + (pace * 0.34 + dribbling * 0.32 + shooting * 0.22 + passing * 0.12) * 0.3
  }
  if (role === 'ST') return overall * 0.7 + (shooting * 0.45 + pace * 0.2 + physical * 0.2 + dribbling * 0.15) * 0.3
  return overall
}

export function selectXI(players, formationId = '4-3-3') {
  const formation = getFormation(formationId)
  const pool = [...players]
  const lineup = []

  for (const slot of formation.slots) {
    let candidates = pool.filter(player => player.position === slot.position)
    if (!candidates.length) candidates = [...pool]
    candidates.sort((a, b) => roleScore(slot.role, b) - roleScore(slot.role, a))
    const player = candidates[0]
    if (!player) break
    pool.splice(pool.indexOf(player), 1)
    lineup.push({ ...player, slot: slot.role, x: slot.x, y: slot.y })
  }

  return {
    formation,
    lineup,
    bench: pool.sort((a, b) => b.overall_rating - a.overall_rating)
  }
}

export function projectedStrength(players, formationId, style, tempo) {
  const { lineup } = selectXI(players, formationId)
  if (!lineup.length) return { attack: 50, defence: 50, overall: 50 }
  const group = position => {
    const rows = lineup.filter(player => player.position === position)
    if (!rows.length) return 70
    return rows.reduce((sum, player) => sum + player.overall_rating, 0) / rows.length
  }
  const gk = group('GK')
  const def = group('DEF')
  const mid = group('MID')
  const att = group('ATT')
  const tempoShift = (Number(tempo) - 3) * 1.2
  const attack = att * 0.58 + mid * 0.42 + (style?.attack || 0) + tempoShift
  const defence = def * 0.58 + gk * 0.42 + (style?.defence || 0) - tempoShift * 0.6
  return {
    attack: Math.round(attack * 10) / 10,
    defence: Math.round(defence * 10) / 10,
    overall: Math.round((gk * 0.16 + def * 0.3 + mid * 0.3 + att * 0.24) * 10) / 10
  }
}
