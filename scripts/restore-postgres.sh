#!/usr/bin/env bash
# Restore a NIHAO PostgreSQL custom-format dump created by backup-postgres.sh.
# Usage: ./scripts/restore-postgres.sh backups/postgres/niha0-YYYYMMDD-HHMMSS.dump
# Optional dry-run: DRY_RUN=1 ./scripts/restore-postgres.sh path.dump
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <dump-file>" >&2
  exit 1
fi

DUMP="$1"
if [[ ! -f "$DUMP" ]]; then
  echo "Dump not found: $DUMP" >&2
  exit 1
fi

HOST="${POSTGRES_HOST:-localhost}"
PORT="${POSTGRES_PORT:-5432}"
DB="${POSTGRES_DB:-niha0}"
USER="${POSTGRES_USER:-niha0}"

echo "Restore target: ${USER}@${HOST}:${PORT}/${DB}"
echo "Dump: ${DUMP} ($(du -h "$DUMP" | cut -f1))"

if [[ "${DRY_RUN:-0}" == "1" ]]; then
  echo "DRY_RUN=1 — listing dump TOC only"
  pg_restore -l "$DUMP" | head -n 40
  echo "… (dry-run OK, no data written)"
  exit 0
fi

echo "WARNING: this will drop and recreate objects in ${DB}."
read -r -p "Type YES to continue: " confirm
if [[ "$confirm" != "YES" ]]; then
  echo "Aborted."
  exit 1
fi

pg_restore -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" --clean --if-exists --no-owner "$DUMP"
echo "Restore OK"
