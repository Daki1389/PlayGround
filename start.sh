#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# Install dependencies on a clean checkout, build the SPA, then serve the
# Express API and the production bundle from a single port.
if [[ ! -d node_modules/vite ]]; then
  if [[ -f package-lock.json ]]; then
    npm ci --no-audit --no-fund
  else
    npm install --no-audit --no-fund
  fi
fi

npm run build
exec node server/index.js
