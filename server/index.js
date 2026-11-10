import express from 'express'
import cors from 'cors'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dataDir = join(__dirname, '.data')
const saveFile = join(dataDir, 'save.json')
const port = Number(process.env.API_PORT || process.env.PORT || 3001)

const app = express()
app.use(cors())
app.use(express.json({ limit: '8mb' }))

function readSave() {
  try {
    if (!existsSync(saveFile)) return null
    return JSON.parse(readFileSync(saveFile, 'utf8'))
  } catch {
    return null
  }
}

function writeSave(payload) {
  mkdirSync(dataDir, { recursive: true })
  writeFileSync(saveFile, JSON.stringify(payload, null, 2))
}

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    game: "Touchline '26",
    version: '1.0.0',
    season: '2026/27',
    saveAvailable: existsSync(saveFile),
  })
})

app.get('/api/save', (_req, res) => {
  const save = readSave()
  if (!save) return res.status(404).json({ error: 'No save found' })
  return res.json(save)
})

app.get('/api/game', (_req, res) => {
  const save = readSave()
  if (!save) return res.status(404).json({ error: 'No save found' })
  return res.json(save.state)
})

app.post('/api/save', (req, res) => {
  const { state } = req.body || {}
  if (!state || typeof state !== 'object' || !state.clubId || !Array.isArray(state.squad)) {
    return res.status(400).json({ error: 'Invalid game state' })
  }
  const payload = { state, updatedAt: new Date().toISOString() }
  writeSave(payload)
  return res.status(201).json({ ok: true, updatedAt: payload.updatedAt })
})

app.delete('/api/save', (_req, res) => {
  if (existsSync(saveFile)) writeFileSync(saveFile, '')
  res.json({ ok: true })
})

// Production convenience: serve the Vite build if it exists.
const dist = join(root, 'dist')
if (existsSync(dist)) {
  app.use(express.static(dist))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next()
    return res.sendFile(join(dist, 'index.html'))
  })
}

app.use((err, _req, res, _next) => {
  console.error('[touchline-api]', err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(port, '0.0.0.0', () => {
  console.log(`Touchline '26 API listening on http://localhost:${port}`)
})
