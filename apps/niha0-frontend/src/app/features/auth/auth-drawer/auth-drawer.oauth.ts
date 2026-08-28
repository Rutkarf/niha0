export interface AuthOAuthProviderView {
  id: string;
  label: string;
}

/** OAuth providers shown in the auth drawer (enabled state resolved at runtime). */
export const AUTH_OAUTH_PROVIDERS: AuthOAuthProviderView[] = [
  { id: 'google', label: 'Google' },
  { id: 'github', label: 'GitHub' },
];
