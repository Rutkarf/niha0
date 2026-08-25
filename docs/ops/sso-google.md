# Google OIDC SSO (NIHAO)

NIHAO supports Google sign-in alongside email/password JWT login. OAuth2 is **opt-in** via environment variables; when disabled, no OAuth beans are registered and JWT login is unchanged.

## Enable locally

```bash
export OAUTH2_ENABLED=true
export GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
export GOOGLE_CLIENT_SECRET=your-client-secret
export APP_PUBLIC_URL=http://localhost:4200
```

Google client registration is created programmatically when both `OAUTH2_ENABLED=true` and `GOOGLE_CLIENT_ID` are set (Spring OAuth2 auto-config stays excluded otherwise so JWT-only mode is unaffected).

Restart the backend. The login page shows **Continuer avec Google** when `GET /api/auth/oauth2/status` returns `{ "enabled": true, "providers": ["google"] }`.

## Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Create an **OAuth 2.0 Client ID** (application type: **Web application**).
3. **Authorized JavaScript origins**
   - `http://localhost:4200` (Angular dev)
   - Your production frontend URL
4. **Authorized redirect URIs** (Spring context path is `/api`):
   - Local: `http://localhost:8080/api/login/oauth2/code/google`
   - Production: `https://your-api-host/api/login/oauth2/code/google`
5. Copy **Client ID** and **Client secret** into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

## Flow

1. User clicks Google on `/login` → browser navigates to `/api/oauth2/authorization/google`.
2. After Google consent, the backend success handler:
   - Finds or creates the user (links by email when an account already exists).
   - Issues JWT + refresh token.
   - Stores a one-time code in `sso_codes` (2 min TTL).
   - Redirects to `{APP_PUBLIC_URL}/auth/sso-callback?code={uuid}`.
3. The SPA calls `POST /api/auth/sso/exchange` with `{ "code": "..." }`, receives `TokenResponse`, sets the refresh cookie, and navigates to the app.

## Account linking

| Case | Behavior |
|------|----------|
| Known `oauth_identities` row | Log in that user |
| Email matches existing user | Link Google identity, log in |
| New email | Create user + personal org (OWNER), same as register |

## Security notes

- SSO codes are single-use and expire after 2 minutes.
- Tokens are not passed in the redirect URL (only the opaque code).
- Keep `OAUTH2_ENABLED=false` in production until Google credentials and redirect URIs are configured.
