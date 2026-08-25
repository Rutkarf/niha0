# Backup & restore (NIHAO production)

## What to back up
| Asset | Criticality | Location |
|-------|-------------|----------|
| PostgreSQL (`niha0`) | **Critical** | volume `postgres_data` |
| Object storage (MinIO/S3) | **Critical** | MinIO volume / S3 bucket |
| Secrets (JWT, DB, S3 keys) | Critical | secret manager — **never** in git |
| Flyway history | Inherited with DB | table `flyway_schema_history` |

Application containers are **stateless** — rebuild from images; do not back up ephemeral container FS.

## PostgreSQL — logical dump (recommended daily)
Script: `scripts/backup-postgres.sh`

```bash
# From repo root (compose network or host with psql)
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_DB=niha0
export POSTGRES_USER=niha0
export PGPASSWORD='…'
./scripts/backup-postgres.sh
```

Produces: `backups/postgres/niha0-YYYYMMDD-HHMMSS.dump` (custom format `-Fc`).

### Restore
```bash
pg_restore --clean --if-exists -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  backups/postgres/niha0-YYYYMMDD-HHMMSS.dump
```

## PostgreSQL — volume snapshot (weekly)
For Docker:
```bash
docker run --rm -v niha0_postgres_data:/data -v "$(pwd)/backups:/backup" alpine \
  tar czf /backup/postgres-volume-$(date +%Y%m%d).tar.gz -C /data .
```
Prefer logical dumps for portable restores across Postgres minor versions.

## Object storage
### MinIO
```bash
# Install mc, alias, then mirror
mc alias set niha0 http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"
mc mirror --overwrite niha0/niha0 ./backups/minio/niha0-$(date +%Y%m%d)
```

### AWS S3
Enable bucket versioning + lifecycle to Glacier after 30/90 days.
Cross-region replication for RPO targets &lt; 1h if required.

## Retention policy (suggested)
| Backup type | Keep |
|-------------|------|
| Daily logical dump | 14 days |
| Weekly dump | 8 weeks |
| Monthly dump | 12 months |
| MinIO mirror | 14 days + weekly archive |

## RPO / RTO targets (product defaults)
- **RPO**: ≤ 24h (daily dump) — tighten with WAL archiving if needed
- **RTO**: ≤ 2h (restore dump + restart stack + smoke login)

## Verification checklist (monthly)
1. Restore dump into a throwaway Postgres
2. `SELECT count(*) FROM organizations;`
3. Download one `stored_assets` object via signed URL / stream
4. Login demo / owner account on restore env
5. Confirm Flyway version matches production

## Disaster runbook (short)
1. Stop writers (scale backend to 0)
2. Restore Postgres from latest verified dump
3. Restore MinIO/S3 objects if needed
4. Start backend with `SPRING_PROFILES_ACTIVE=prod`
5. Smoke: `/api/actuator/health`, login, open AI Office, download one asset
6. Re-enable traffic
