#!/usr/bin/env bash
# Build the Touchline SPA when needed, publish deployment metadata, and serve
# the Express API plus the production bundle in the foreground.
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
export PROJECT_DIR

PORT="${PORT:-3000}"
export PORT

METADATA_DIR="${OPENCODE_WEB_DIR:-${RUNNER_TEMP:-/tmp}/omgithub-web}"
DIST_DIR="$PROJECT_DIR/dist"
DEPLOYMENT_OUTPUT="$METADATA_DIR/deployment-output.json"
export METADATA_DIR DEPLOYMENT_OUTPUT
mkdir -p "$METADATA_DIR"

timed() {
  local label="$1"
  shift
  local started
  started="$(date +%s%3N)"
  local status=0
  printf '[start] %s\n' "$label"
  /usr/bin/time -p "$@" || status=$?
  printf '[done] %s (%sms)\n' "$label" "$(( $(date +%s%3N) - started ))"
  return "$status"
}

needs_install=false
if [[ ! -d node_modules/vite ]]; then
  needs_install=true
elif [[ -f package-lock.json && package-lock.json -nt node_modules/.package-lock.json ]]; then
  needs_install=true
fi

if [[ "$needs_install" == true ]]; then
  if [[ -f package-lock.json ]]; then
    timed "install dependencies" npm ci --no-audit --no-fund
  else
    timed "install dependencies" npm install --no-audit --no-fund
  fi
else
  printf '[skip] dependencies (node_modules is current)\n'
fi

needs_build=false
if [[ ! -f "$DIST_DIR/index.html" ]]; then
  needs_build=true
elif [[ -n "$(find src public shared index.html package.json vite.config.js tailwind.config.js postcss.config.js -newer "$DIST_DIR/index.html" -print -quit 2>/dev/null)" ]]; then
  needs_build=true
fi

if [[ "$needs_build" == true ]]; then
  timed "build static bundle" npm run build
else
  printf '[skip] build (dist is newer than source)\n'
fi

if [[ ! -f "$DIST_DIR/index.html" ]]; then
  printf 'Missing static build output: %s/index.html\n' "$DIST_DIR" >&2
  exit 1
fi

timed "write deployment metadata" node --input-type=module -e '
  import { mkdirSync, writeFileSync } from "node:fs"
  import { resolve } from "node:path"
  const project = resolve(process.env.PROJECT_DIR)
  const directory = resolve(project, "dist")
  mkdirSync(process.env.METADATA_DIR, { recursive: true })
  writeFileSync(process.env.DEPLOYMENT_OUTPUT, JSON.stringify({ project, directory }))
'

printf 'Serving %s on http://0.0.0.0:%s\n' "$PROJECT_DIR" "$PORT"
timed "serve app" node server/index.js
