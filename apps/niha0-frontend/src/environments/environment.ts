/**
 * Production defaults assume same-origin `/api` (nginx compose or Cloudflare Pages Function proxy).
 * Override at runtime via `public/niha0-config.js` → `window.__NIHA0_CONFIG__.apiUrl`
 * when calling Render directly (absolute URL).
 */
declare global {
  interface Window {
    __NIHA0_CONFIG__?: { apiUrl?: string; accessCookieAuth?: boolean };
  }
}

const runtimeApi =
  typeof window !== 'undefined' ? window.__NIHA0_CONFIG__?.apiUrl?.trim() : undefined;
const runtimeCookieAuth =
  typeof window !== 'undefined' ? window.__NIHA0_CONFIG__?.accessCookieAuth : undefined;

export const environment = {
  production: true,
  apiUrl: runtimeApi && runtimeApi.length > 0 ? runtimeApi : '/api',
  showDemoCredentials: false,
  /** Prefer HttpOnly access cookie + CSRF (prod default). */
  accessCookieAuth: runtimeCookieAuth ?? true,
};
