export type SettingsTab = 'overview' | 'account' | 'appearance' | 'team' | 'billing' | 'security';

export const SETTINGS_TABS: { id: SettingsTab; label: string; icon: string; desc: string; adminOnly?: boolean }[] = [
  { id: 'overview', label: "Vue d'ensemble", icon: '◎', desc: 'Résumé & raccourcis' },
  { id: 'account', label: 'Compte', icon: '👤', desc: 'Profil & organisation' },
  { id: 'appearance', label: 'Apparence', icon: '✦', desc: 'Thème & langue' },
  { id: 'team', label: 'Équipe', icon: '👥', desc: 'Membres & invitations', adminOnly: true },
  { id: 'billing', label: 'Facturation', icon: '💳', desc: 'Plan & quotas' },
  { id: 'security', label: 'Sécurité', icon: '🔒', desc: 'MFA & confidentialité' },
];

export const PLAN_META: Record<string, { label: string; accent: string; hint: string }> = {
  FREE: { label: 'Free', accent: '#94A3B8', hint: 'Découverte & démo' },
  PRO: { label: 'Pro', accent: '#38BDF8', hint: 'Équipes en croissance' },
  BUSINESS: { label: 'Business', accent: '#A78BFA', hint: 'Scale & conformité' },
};

export const RESOURCE_LINKS = [
  { label: 'Workspace', route: '/app/workspace', desc: 'Branding & agents' },
  { label: "Centre d'aide", route: '/app/help', desc: 'FAQ & guides' },
  { label: 'Feedback', route: '/app/feedback', desc: 'Bug ou idée' },
  { label: 'Changelog', route: '/app/changelog', desc: 'Nouveautés' },
  { label: 'Confidentialité', route: '/privacy', desc: 'Politique RGPD' },
] as const;
