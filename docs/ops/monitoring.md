# Monitoring & observability (NIHAO production)

## Goals
- Know when the API is down or degraded
- Track latency, JVM, HTTP error rates
- Correlate incidents with deploy / config changes

## Built-in endpoints
| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /api/actuator/health` | public | Liveness/readiness for Docker/K8s |
| `GET /api/actuator/info` | authenticated | Build/app info |
| `GET /api/actuator/prometheus` | authenticated | Prometheus scrape metrics |
| `GET /api/actuator/metrics` | authenticated | Micrometer registry dump |

Compose healthcheck (already wired):
```bash
wget -qO- http://localhost:8080/api/actuator/health || exit 1
```

## Recommended Prometheus scrape
```yaml
# infra/prometheus/prometheus.yml (example)
scrape_configs:
  - job_name: niha0-backend
    metrics_path: /api/actuator/prometheus
    scrape_interval: 15s
    static_configs:
      - targets: ["backend:8080"]
    # Prefer a scrape token / basic auth in real prod
```

Minimal Grafana panels:
1. `http.server.requests` — p95 latency by URI
2. `jvm.memory.used` — heap
3. `process.uptime` — restarts
4. `logback.events` (if enabled) — error rate

## Alerting (starter rules)
Rule file: [`infra/prometheus/alerts.yml`](../../infra/prometheus/alerts.yml) (loaded via `rule_files` in `prometheus.yml`).

| Condition | Severity | Action |
|-----------|----------|--------|
| health ≠ UP for 2m | critical | page on-call |
| HTTP 5xx rate > 5% for 5m | high | investigate |
| p95 latency > 2s for 10m | warning | investigate |
| JWT/auth 401 spike after deploy | medium | rollback check |
| Disk on MinIO / Postgres volume > 85% | high | expand / cleanup |


## Logging
- App logger: `com.sasurd.niha0` at INFO
- Prefer JSON logs behind a collector (Loki / CloudWatch / Datadog)
- Never log JWT, refresh tokens, SSE tickets, or storage signed URLs

## Optional compose overlay
Add Prometheus + Grafana as a separate compose file when needed:
```bash
docker compose -f docker-compose.yml -f infra/docker-compose.observability.yml up -d
```
See `infra/docker-compose.observability.yml`.
