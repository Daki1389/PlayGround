#!/usr/bin/env bash
# Capture the running deployment with its own transient browser.
# Usage: CAPTURE_URL=... CAPTURE_DIR=... bash capture.sh
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

: "${CAPTURE_URL:?Set CAPTURE_URL to the exact deployed URL.}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to an output directory outside the project.}"
: "${RUNTIME_DIR:?Set RUNTIME_DIR to the worker runtime directory.}"

PROJECT_REAL="$(realpath "$PROJECT_DIR")"
CAPTURE_DIR="$(realpath -m "$CAPTURE_DIR")"
case "$CAPTURE_DIR/" in
  "$PROJECT_REAL/"*)
    printf 'CAPTURE_DIR must be outside the project: %s\n' "$CAPTURE_DIR" >&2
    exit 1
    ;;
esac

timed() {
  local label="$1"
  shift
  local started
  started="$(date +%s%3N)"
  local status=0
  printf '[start] %s\n' "$label" >&2
  /usr/bin/time -p "$@" || status=$?
  printf '[done] %s (%sms)\n' "$label" "$(( $(date +%s%3N) - started ))" >&2
  return "$status"
}

timed "prepare capture directory" mkdir -p "$CAPTURE_DIR"

export CAPTURE_URL
export CAPTURE_DIR
export CAPTURE_READY_SELECTOR="${CAPTURE_READY_SELECTOR:-main}"
export CAPTURE_STRICT="${CAPTURE_STRICT:-1}"

set +e
timed "render and capture desktop + mobile" node "$RUNTIME_DIR/scripts/default-capture.mjs"
status=$?
set -e

if [[ "$status" -ne 0 ]]; then
  if [[ "$status" -eq 75 ]]; then
    printf 'Capture infrastructure failed temporarily.\n' >&2
    exit 75
  fi
  printf 'Capture failed with exit %s.\n' "$status" >&2
  exit 1
fi

timed "validate screenshots" node --input-type=module -e '
  import { readFileSync, statSync } from "node:fs"
  import { join } from "node:path"
  for (const view of ["desktop", "mobile"]) {
    const file = join(process.env.CAPTURE_DIR, `final-${view}.png`)
    const size = statSync(file).size
    const buffer = readFileSync(file)
    if (buffer.subarray(1, 4).toString() !== "PNG") throw new Error(`${file} is not a PNG`)
    const width = buffer.readUInt32BE(16)
    const height = buffer.readUInt32BE(20)
    if (width < 320 || height < 480) throw new Error(`${file} is too small: ${width}x${height}`)
    if (size < 5000) throw new Error(`${file} looks blank: only ${size} bytes`)
    console.log(`${view}: ${width}x${height}, ${size} bytes`)
  }
'

printf 'Captured desktop and mobile screenshots in %s\n' "$CAPTURE_DIR"
