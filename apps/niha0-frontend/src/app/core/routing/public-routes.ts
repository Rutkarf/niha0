/** Routes publiques (marketing + auth invité) où une session expirée ne doit pas forcer /login. */
export function isPublicMarketingPath(url: string): boolean {
  const path = url.split('?')[0]?.split('#')[0] ?? '/';
  return /^\/(?:|pricing|use-cases|privacy|terms|compliance(?:\/[^/?#]*)?|login|register|forgot-password|reset-password|accept-invite|auth\/sso-callback|mfa)(?:\/|$)/.test(
    path,
  );
}
