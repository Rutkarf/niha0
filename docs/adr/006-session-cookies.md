# ADR 006 — Session tokens storage

## Status
Accepted (implemented 0.3.0)

## Decision
- **Access token** : mémoire navigateur (Angular `AuthService`), pas `localStorage`
- **Refresh token** : cookie `HttpOnly; Path=/api/auth; SameSite=Lax` (+ `Secure` en prod) ; body refresh encore accepté en secours
- Logout : `POST /auth/logout` révoque + clear cookie

## Residual risk
CSRF limité tant que les mutations métier utilisent Bearer access token (pas le cookie refresh). Ne pas placer le JWT d’accès en cookie sans CSRF double-submit.
