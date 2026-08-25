#!/usr/bin/env bash
# Backup Postgres from a Render DATABASE_URL (External connection string).
# Usage: DATABASE_URL='postgres://…' ./scripts/backup-render-postgres.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${BACKUP_DIR:-$ROOT/backups/postgres}"
STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="$OUT_DIR/niha0-render-${STAMP}.dump"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required (Render → Postgres → External Connection String)" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"
echo "Backing up via DATABASE_URL → ${FILE}"
pg_dump "$DATABASE_URL" -Fc -f "$FILE"
echo "OK ($(du -h "$FILE" | cut -f1))"
ls -1t "$OUT_DIR"/niha0-render-*.dump 2>/dev/null | tail -n +15 | xargs -r rm -f
