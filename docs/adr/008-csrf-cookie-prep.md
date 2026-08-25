# ADR 008 — CSRF preparation for cookie-based sessions

## Status
Accepted (prep) — default **off**

## Context
Access tokens are Bearer (memory). Refresh is HttpOnly cookie (`Path=/api/auth`). CSRF is low risk for Bearer mutations but required if access tokens move to cookies.

## Decision
- Property `niha0.security.csrf-enabled` / `CSRF_ENABLED` (default `false`)
- When `true`:
  - `CookieCsrfTokenRepository` (non-HttpOnly `XSRF-TOKEN`)
  - Client sends `X-XSRF-TOKEN`
  - Ignored for: auth bootstrap, SumUp webhooks, requests with `Authorization: Bearer …`
- Spring security headers always: `X-Content-Type-Options`, `X-Frame-Options: DENY`, HSTS in `prod`

## Migration path
1. Keep Bearer (current)
2. Enable `CSRF_ENABLED=true` in staging — FE interceptor already can attach XSRF from cookie
3. Move access token to Secure cookie → remove Bearer ignore matcher → full CSRF

## JWT rotation
`JWT_PREVIOUS_SECRET` verifies tokens signed with the previous key during rotation windows.
