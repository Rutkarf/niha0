#!/usr/bin/env bash
# Lance PostgreSQL + backend + frontend dans UN terminal persistant.
# Le frontend recharge automatiquement le navigateur à chaque sauvegarde.
# Le backend redémarre seul (Spring DevTools) sur modification Java.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE="${COMPOSE:-$(command -v docker >/dev/null 2>&1 && echo docker || echo podman)}"
BACKEND_PID=""
BACKEND_READY=0

cleanup() {
  echo ""
  echo "Arrêt du backend (PID ${BACKEND_PID:-?})…"
  if [[ -n "${BACKEND_PID}" ]]; then
    kill "$BACKEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

systemctl --user start podman.socket 2>/dev/null || true

echo "▶ PostgreSQL…"
$COMPOSE compose -f docker-compose.dev.yml up postgres -d

echo "▶ Backend (port 8080)…"
(
  cd apps/niha0-backend
  ./mvnw spring-boot:run
) &
BACKEND_PID=$!

echo "   Attente backend (OpenAPI /api/v3/api-docs)…"
for i in $(seq 1 90); do
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "   ERREUR: le backend s'est arrêté pendant le démarrage." >&2
    wait "$BACKEND_PID" || true
    exit 1
  fi
  if curl -fsS http://127.0.0.1:8080/api/v3/api-docs >/dev/null 2>&1; then
    BACKEND_READY=1
    echo "   Backend prêt (${i}s)."
    break
  fi
  sleep 2
done

if [[ "$BACKEND_READY" -ne 1 ]]; then
  echo "   AVERTISSEMENT: backend lent — lancement du frontend quand même." >&2
fi

echo ""
echo "▶ Frontend (port 4200, live reload activé)…"
echo "   Ouvre http://localhost:4200/ — laisse CE terminal ouvert."
echo "   Ctrl+C arrête backend + frontend."
echo ""

cd apps/niha0-frontend
export CHOKIDAR_USEPOLLING=true
exec npm start
