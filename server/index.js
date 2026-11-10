import express from 'express'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { seedDatabase } from './seed.js'
import {
  GameError,
  buyPlayer,
  getBootstrap,
  getMarket,
  getMatch,
  getMeta,
  saveTactics,
  simulateUserMatch,
  upgradeFacility
} from './game.js'
import { playerById, userTeam } from './store.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = Number(process.env.PORT || 3000)
const distDir = resolve(__dirname, '../dist')

const seeded = seedDatabase()
if (seeded.seeded) console.log('Seeded a fresh Touchline database.')
else console.log('Using existing Touchline database.')

app.disable('x-powered-by')
app.use(express.json({ limit: '1mb' }))
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  next()
})

const asyncRoute = handler => (req, res, next) => {
  try {
    handler(req, res, next)
  } catch (error) {
    next(error)
  }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'touchline-api', time: new Date().toISOString() })
})

app.get('/api/bootstrap', asyncRoute((req, res) => {
  res.json(getBootstrap())
}))

app.get('/api/meta', (req, res) => {
  res.json(getMeta())
})

app.get('/api/market', asyncRoute((req, res) => {
  res.json(getMarket(req.query))
}))

app.get('/api/players/:id', asyncRoute((req, res) => {
  const player = playerById(req.params.id)
  if (!player) throw new GameError('Player not found', 404)
  res.json({ player })
}))

app.post('/api/transfers/buy', asyncRoute((req, res) => {
  const user = userTeam()
  const teamId = Number(req.body.team_id || user.id)
  if (teamId !== user.id) throw new GameError('You can only sign players for your own club', 403)
  const result = buyPlayer(Number(req.body.player_id), teamId)
  res.json(result)
}))

app.post('/api/facilities/upgrade', asyncRoute((req, res) => {
  const user = userTeam()
  const teamId = Number(req.body.team_id || user.id)
  if (teamId !== user.id) throw new GameError('You can only upgrade your own facilities', 403)
  const result = upgradeFacility(teamId, req.body.facility)
  res.json(result)
}))

app.post('/api/tactics', asyncRoute((req, res) => {
  const user = userTeam()
  const teamId = Number(req.body.team_id || user.id)
  if (teamId !== user.id) throw new GameError('You can only manage your own tactics', 403)
  const result = saveTactics(teamId, req.body)
  res.json(result)
}))

app.get('/api/matches/:id', asyncRoute((req, res) => {
  res.json({ match: getMatch(req.params.id) })
}))

app.post('/api/matches/:id/simulate', asyncRoute((req, res) => {
  res.json(simulateUserMatch(Number(req.params.id)))
}))

if (existsSync(distDir)) {
  app.use(express.static(distDir, {
    maxAge: '1h',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html')) res.setHeader('Cache-Control', 'no-cache')
    }
  }))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next()
    res.sendFile(join(distDir, 'index.html'))
  })
} else {
  app.get('/', (req, res) => {
    res.status(503).send('Frontend build not found. Run npm run build first.')
  })
}

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' })
  next()
})

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error)
  const status = error instanceof GameError ? error.status : 500
  if (status >= 500) console.error(error)
  res.status(status).json({ error: error.message || 'Something went wrong' })
})

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Touchline '26 running on http://0.0.0.0:${PORT}`)
})

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    server.close(() => process.exit(0))
  })
}
