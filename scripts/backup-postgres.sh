#!/usr/bin/env bash
# Logical backup of NIHAO PostgreSQL (custom format).
# Requires: pg_dump, network access to Postgres.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${BACKUP_DIR:-$ROOT/backups/postgres}"
HOST="${POSTGRES_HOST:-localhost}"
PORT="${POSTGRES_PORT:-5432}"
DB="${POSTGRES_DB:-niha0}"
USER="${POSTGRES_USER:-niha0}"
STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="$OUT_DIR/niha0-${STAMP}.dump"

mkdir -p "$OUT_DIR"

echo "Backing up ${USER}@${HOST}:${PORT}/${DB} → ${FILE}"
pg_dump -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" -Fc -f "$FILE"
echo "OK ($(du -h "$FILE" | cut -f1))"

# Optional retention: keep last 14 dumps
ls -1t "$OUT_DIR"/niha0-*.dump 2>/dev/null | tail -n +15 | xargs -r rm -f
