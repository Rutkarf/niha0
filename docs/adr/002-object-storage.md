# ADR 002 — Object storage for logos and documents

## Status
Accepted (updated: MinIO/S3 + signed URLs)

## Context
Organization logos were stored as Base64 in `organizations.logo_url`.
Documents need durable binary storage outside PostgreSQL.

## Decision
- `ObjectStorageService` with three modes:
  - `local` — filesystem (`LocalObjectStorageService`), **forbidden in prod**
  - `minio` / `s3` — `S3CompatibleObjectStorageService` (AWS SDK v2)
- Metadata in `stored_assets`; dual-write Base64 `logo_url` kept temporarily for 3D clients
- Downloads:
  1. Authenticated stream: `GET /storage/assets/{id}`
  2. Signed URL (MinIO/S3): `GET /storage/assets/{id}/signed-url` → short-lived pre-signed GET
- Dev compose includes MinIO (`docker-compose.dev.yml`)

## Config
| Variable | Purpose |
|----------|---------|
| `STORAGE_MODE` | `local` \| `minio` \| `s3` |
| `STORAGE_S3_ENDPOINT` | e.g. `http://minio:9000` |
| `STORAGE_S3_ACCESS_KEY` / `STORAGE_S3_SECRET_KEY` | credentials |
| `STORAGE_S3_BUCKET` | default `niha0` |
| `STORAGE_SIGNED_URL_TTL` | seconds (default 300) |

## Consequences
- Local mode still works for unit tests (H2 + filesystem)
- Prod must set `STORAGE_MODE=minio` or `s3` (`ProdSecurityValidator`)
- Frontend prefers signed URL when `supported=true`, else blob download via Bearer token
