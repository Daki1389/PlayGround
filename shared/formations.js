export const FORMATIONS = {
  '4-3-3': {
    id: '4-3-3',
    name: '4-3-3',
    label: 'High Press',
    description: 'Width in attack, three in midfield and a lone focal striker.',
    slots: [
      { role: 'GK', position: 'GK', x: 50, y: 91 },
      { role: 'LB', position: 'DEF', x: 14, y: 72 },
      { role: 'CB', position: 'DEF', x: 37, y: 77 },
      { role: 'CB', position: 'DEF', x: 63, y: 77 },
      { role: 'RB', position: 'DEF', x: 86, y: 72 },
      { role: 'CM', position: 'MID', x: 28, y: 54 },
      { role: 'DM', position: 'MID', x: 50, y: 50 },
      { role: 'CM', position: 'MID', x: 72, y: 54 },
      { role: 'LW', position: 'ATT', x: 18, y: 28 },
      { role: 'ST', position: 'ATT', x: 50, y: 19 },
      { role: 'RW', position: 'ATT', x: 82, y: 28 }
    ]
  },
  '4-2-3-1': {
    id: '4-2-3-1',
    name: '4-2-3-1',
    label: 'Control',
    description: 'A double pivot protects the back four while three creators roam.',
    slots: [
      { role: 'GK', position: 'GK', x: 50, y: 91 },
      { role: 'LB', position: 'DEF', x: 14, y: 72 },
      { role: 'CB', position: 'DEF', x: 37, y: 77 },
      { role: 'CB', position: 'DEF', x: 63, y: 77 },
      { role: 'RB', position: 'DEF', x: 86, y: 72 },
      { role: 'DM', position: 'MID', x: 35, y: 59 },
      { role: 'DM', position: 'MID', x: 65, y: 59 },
      { role: 'LW', position: 'MID', x: 18, y: 38 },
      { role: 'AM', position: 'MID', x: 50, y: 39 },
      { role: 'RW', position: 'MID', x: 82, y: 38 },
      { role: 'ST', position: 'ATT', x: 50, y: 17 }
    ]
  },
  '3-5-2': {
    id: '3-5-2',
    name: '3-5-2',
    label: 'Overload',
    description: 'Three centre-backs, wing-backs high and a two-man strike force.',
    slots: [
      { role: 'GK', position: 'GK', x: 50, y: 91 },
      { role: 'CB', position: 'DEF', x: 26, y: 75 },
      { role: 'CB', position: 'DEF', x: 50, y: 79 },
      { role: 'CB', position: 'DEF', x: 74, y: 75 },
      { role: 'LWB', position: 'MID', x: 10, y: 52 },
      { role: 'CM', position: 'MID', x: 31, y: 56 },
      { role: 'DM', position: 'MID', x: 50, y: 48 },
      { role: 'CM', position: 'MID', x: 69, y: 56 },
      { role: 'RWB', position: 'MID', x: 90, y: 52 },
      { role: 'ST', position: 'ATT', x: 38, y: 22 },
      { role: 'ST', position: 'ATT', x: 62, y: 22 }
    ]
  }
}

export const PLAY_STYLES = [
  {
    id: 'gegenpressing',
    name: 'Gegenpressing',
    short: 'Press',
    description: 'Hunt in packs and win the ball high. Relentless but leaves space behind.',
    attack: 4,
    defence: -2,
    icon: 'zap'
  },
  {
    id: 'tiki-taka',
    name: 'Tiki-Taka',
    short: 'Control',
    description: 'Suffocate the game with short passes and patient positional play.',
    attack: 2,
    defence: 1,
    icon: 'network'
  },
  {
    id: 'counter',
    name: 'Counter-Attack',
    short: 'Counter',
    description: 'Sit compact, then explode forward in transition with direct passes.',
    attack: 0,
    defence: 3,
    icon: 'timer'
  },
  {
    id: 'park-the-bus',
    name: 'Park the Bus',
    short: 'Defend',
    description: 'A deep, stubborn block. Hard to break down, but the goals may dry up.',
    attack: -4,
    defence: 6,
    icon: 'shield'
  }
]

export const TEMPO_LABELS = ['Patient', 'Measured', 'Balanced', 'Quick', 'Blitz']

export function getFormation(id) {
  return FORMATIONS[id] || FORMATIONS['4-3-3']
}

export function getStyle(id) {
  return PLAY_STYLES.find(style => style.id === id) || PLAY_STYLES[1]
}
