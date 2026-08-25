# ADR 008 — CSRF + access token cookie

## Status
Accepted — **enabled in prod** (`CSRF_ENABLED=true`, `ACCESS_COOKIE_ENABLED=true`)

## Context
Refresh was already HttpOnly (`niha0_refresh`). Access lived in SPA memory as Bearer, which bypassed CSRF.

## Decision
1. `niha0_access` HttpOnly cookie, `Path=/api`, SameSite configurable
2. `JwtAuthFilter` accepts Bearer **or** access cookie
3. When `access-cookie-enabled=true`, CSRF **no longer ignores** Bearer (SPA should omit Bearer)
4. FE `environment.accessCookieAuth` (prod `true`) skips `Authorization` header; sends `X-XSRF-TOKEN`
5. Local/dev keeps Bearer for simpler tooling (`accessCookieAuth: false`)

## Cookies
| Name | Path | Purpose |
|------|------|---------|
| `niha0_refresh` | `/api/auth` | Refresh rotation |
| `niha0_access` | `/api` | Access JWT |
| `XSRF-TOKEN` | `/` | Double-submit CSRF (readable by JS) |
