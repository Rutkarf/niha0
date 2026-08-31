export type OAuthProviderId =
  | 'google'
  | 'microsoft'
  | 'github'
  | 'linkedin'
  | 'facebook'
  | 'discord'
  | 'apple'
  | 'amazon';

export interface OAuthProviderDef {
  id: OAuthProviderId;
  label: string;
}

export const OAUTH_PROVIDERS: readonly OAuthProviderDef[] = [
  { id: 'google', label: 'Google' },
  { id: 'microsoft', label: 'Microsoft' },
  { id: 'github', label: 'GitHub' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'discord', label: 'Discord' },
  { id: 'apple', label: 'Apple' },
  { id: 'amazon', label: 'Amazon' },
] as const;

export function isOAuthProviderId(value: string): value is OAuthProviderId {
  return OAUTH_PROVIDERS.some((provider) => provider.id === value);
}
