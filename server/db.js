import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, 'data')
mkdirSync(dataDir, { recursive: true })

export const DB_PATH = process.env.DB_PATH || join(dataDir, 'touchline.db')
export const db = new DatabaseSync(DB_PATH)

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    city TEXT,
    country TEXT,
    reputation INTEGER NOT NULL DEFAULT 70,
    budget REAL NOT NULL DEFAULT 10000000.0,
    wage_budget REAL NOT NULL DEFAULT 1200000.0,
    stadium_level INTEGER NOT NULL DEFAULT 1,
    training_facility_level INTEGER NOT NULL DEFAULT 1,
    youth_academy_level INTEGER NOT NULL DEFAULT 1,
    stadium_name TEXT,
    primary_color TEXT DEFAULT '#c9f75c',
    secondary_color TEXT DEFAULT '#0b0f14',
    formation TEXT NOT NULL DEFAULT '4-3-3',
    play_style TEXT NOT NULL DEFAULT 'tiki-taka',
    tempo INTEGER NOT NULL DEFAULT 3,
    is_user INTEGER NOT NULL DEFAULT 0,
    founded INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    position TEXT NOT NULL CHECK (position IN ('GK','DEF','MID','ATT')),
    age INTEGER NOT NULL,
    overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 99),
    potential_rating INTEGER NOT NULL,
    market_value REAL NOT NULL,
    wage REAL NOT NULL,
    stamina INTEGER NOT NULL DEFAULT 90,
    morale INTEGER NOT NULL DEFAULT 75,
    pace INTEGER NOT NULL DEFAULT 70,
    shooting INTEGER NOT NULL DEFAULT 70,
    passing INTEGER NOT NULL DEFAULT 70,
    dribbling INTEGER NOT NULL DEFAULT 70,
    defending INTEGER NOT NULL DEFAULT 70,
    physical INTEGER NOT NULL DEFAULT 70,
    shirt_number INTEGER,
    nationality TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    home_team_id INTEGER NOT NULL REFERENCES teams(id),
    away_team_id INTEGER NOT NULL REFERENCES teams(id),
    home_score INTEGER,
    away_score INTEGER,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','finished')),
    round INTEGER NOT NULL DEFAULT 1,
    match_date TEXT,
    season TEXT NOT NULL DEFAULT '2026/27',
    attendance INTEGER,
    events_json TEXT,
    played_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS match_player_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    team_id INTEGER NOT NULL REFERENCES teams(id),
    goals INTEGER NOT NULL DEFAULT 0,
    assists INTEGER NOT NULL DEFAULT 0,
    rating REAL NOT NULL,
    minutes_played INTEGER NOT NULL DEFAULT 90
  );

  CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
  CREATE INDEX IF NOT EXISTS idx_players_position ON players(position);
  CREATE INDEX IF NOT EXISTS idx_matches_round ON matches(round);
  CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
  CREATE INDEX IF NOT EXISTS idx_stats_match ON match_player_stats(match_id);
  CREATE INDEX IF NOT EXISTS idx_stats_player ON match_player_stats(player_id);
`)

export function transaction(fn) {
  db.exec('BEGIN')
  try {
    const result = fn()
    db.exec('COMMIT')
    return result
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}
