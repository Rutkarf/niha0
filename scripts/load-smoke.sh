#!/usr/bin/env bash
# NIHAO smoke load test — requires running API on :8080 and k6 or hey.
# Usage: ./scripts/load-smoke.sh
set -euo pipefail

BASE="${API_BASE:-http://localhost:8080/api}"
EMAIL="${LOAD_EMAIL:-rutkarf@optimustest.fr}"
PASS="${LOAD_PASSWORD:-Demo2026!}"

echo "== Health =="
curl -sf "$BASE/actuator/health" | head -c 200
echo

TOKEN=$(curl -sf -X POST "$BASE/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')

if [[ -z "${TOKEN}" ]]; then
  echo "Login failed — skip authenticated load"
  exit 1
fi

echo "== Authenticated burst (hey or curl loop) =="
if command -v hey >/dev/null 2>&1; then
  hey -n 100 -c 10 -H "Authorization: Bearer $TOKEN" "$BASE/dashboard/kpis"
elif command -v k6 >/dev/null 2>&1; then
  k6 run - <<'EOF'
import http from 'k6/http';
import { check } from 'k6';
export const options = { vus: 5, duration: '15s' };
export default function () {
  const base = __ENV.API_BASE || 'http://localhost:8080/api';
  const res = http.get(`${base}/actuator/health`);
  check(res, { 'status 200': (r) => r.status === 200 });
}
EOF
else
  for i in $(seq 1 40); do
    curl -sf -H "Authorization: Bearer $TOKEN" "$BASE/dashboard/kpis" >/dev/null &
  done
  wait
  echo "40 parallel KPI requests completed"
fi

echo "Load smoke done."
