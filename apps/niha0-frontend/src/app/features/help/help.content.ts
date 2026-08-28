export type HelpTab = 'home' | 'faq' | 'shortcuts' | 'guides' | 'support';

export type FaqCategory = 'general' | 'ai' | 'data' | 'account' | 'accessibility';

export interface FaqItem {
  q: string;
  a: string;
  category: FaqCategory;
  tags: string[];
}

export interface ShortcutItem {
  keys: string[];
  label: string;
  context?: string;
}

export interface ShortcutGroup {
  title: string;
  items: ShortcutItem[];
}

export interface GuideCard {
  title: string;
  description: string;
  route: string;
  icon: string;
  accent: string;
  hint: string;
}

export interface StartStep {
  step: number;
  title: string;
  description: string;
  route?: string;
  routeLabel?: string;
}

export const HELP_TABS: { id: HelpTab; label: string; icon: string; desc: string }[] = [
  { id: 'home', label: 'Accueil', icon: '◎', desc: 'Démarrage rapide' },
  { id: 'faq', label: 'FAQ', icon: '?', desc: 'Questions fréquentes' },
  { id: 'shortcuts', label: 'Raccourcis', icon: '⌨', desc: 'Clavier & navigation' },
  { id: 'guides', label: 'Guides', icon: '📖', desc: 'Modules & parcours' },
  { id: 'support', label: 'Support', icon: '✉', desc: 'Contact & ressources' },
];

export const FAQ_CATEGORIES: { id: FaqCategory | ''; label: string }[] = [
  { id: '', label: 'Toutes' },
  { id: 'general', label: 'Général' },
  { id: 'ai', label: 'Agents IA' },
  { id: 'data', label: 'Données' },
  { id: 'account', label: 'Compte & facturation' },
  { id: 'accessibility', label: 'Accessibilité' },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'Comment me connecter ?',
    a: 'Utilisez l\'email professionnel de votre organisation. En cas d\'oubli, la page « Mot de passe oublié » envoie un lien de réinitialisation sécurisé.',
    category: 'account',
    tags: ['connexion', 'login', 'mot de passe'],
  },
  {
    q: 'Qu\'est-ce que l\'AI Office ?',
    a: 'C\'est le hub 3D où vos agents IA travaillent. Cliquez sur un bureau pour ouvrir le module CRM, Support, Comptabilité, etc. La touche O ramène à l\'AI Office depuis le shell.',
    category: 'ai',
    tags: ['3d', 'bureau', 'agents'],
  },
  {
    q: 'Comment valider une action agent ?',
    a: 'Les propositions en attente apparaissent dans la cloche, sur AI Center et dans Stratégie (BPM). En tant que CEO/OWNER, vous pouvez approuver, rejeter ou différer avant exécution.',
    category: 'ai',
    tags: ['validation', 'hitl', 'approbation'],
  },
  {
    q: 'Comment importer des documents entreprise ?',
    a: 'Allez dans Données entreprise pour uploader PDF, CSV ou texte. Ils alimentent la recherche RAG des agents et le chat contextuel.',
    category: 'data',
    tags: ['rag', 'upload', 'fichiers'],
  },
  {
    q: 'Où gérer les bibliothèques métier ?',
    a: 'Le Centre Données regroupe CMCMS, PIPIM, SCSC, MRMRP, ETETL et EDEDI. Chaque bibliothèque propose CRUD, filtres, export CSV et lien vers la vue 3D correspondante.',
    category: 'data',
    tags: ['cms', 'pim', 'erp', 'bibliothèques'],
  },
  {
    q: 'Facturation et plans',
    a: 'Les plans FREE, PRO et BUSINESS sont configurables dans Paramètres (OWNER). Les quotas et la consommation sont visibles ; l\'intégration Stripe arrive prochainement.',
    category: 'account',
    tags: ['billing', 'stripe', 'quota'],
  },
  {
    q: 'Thèmes et accessibilité',
    a: 'Solar / Night / Auto depuis la sidebar ou Paramètres. Activez le contraste élevé pour un affichage WCAG plus strict. Les animations respectent prefers-reduced-motion.',
    category: 'accessibility',
    tags: ['thème', 'contraste', 'wcag'],
  },
  {
    q: 'Comment utiliser la recherche globale ?',
    a: 'Ctrl+K ouvre la palette de navigation rapide. Tapez le nom d\'un module (CRM, Audit, Centre Données…) pour y accéder sans parcourir la sidebar.',
    category: 'general',
    tags: ['recherche', 'ctrl+k', 'navigation'],
  },
  {
    q: 'Où consulter l\'historique des actions ?',
    a: 'Le module Audit (Pilotage) centralise le journal immuable, les décisions IA, les guardrails et les logs sandbox. Export CSV/JSON disponible.',
    category: 'ai',
    tags: ['audit', 'logs', 'traçabilité'],
  },
  {
    q: 'Comment personnaliser mon workspace ?',
    a: 'Workspace permet de configurer le branding, les agents actifs, les widgets AI Office et d\'importer/exporter la configuration en JSON.',
    category: 'general',
    tags: ['workspace', 'branding', 'configuration'],
  },
];

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Navigation',
    items: [
      { keys: ['O'], label: 'Retour AI Office', context: 'Depuis le shell' },
      { keys: ['Ctrl', 'K'], label: 'Recherche globale', context: 'Palette modules' },
      { keys: ['Esc'], label: 'Fermer menus / dialogs' },
    ],
  },
  {
    title: 'AI Office 3D',
    items: [
      { keys: ['Molette'], label: 'Zoom caméra' },
      { keys: ['Glisser'], label: 'Rotation de la scène' },
      { keys: ['Clic'], label: 'Sélectionner un bureau ou un chef' },
    ],
  },
  {
    title: 'Listes & tableaux',
    items: [
      { keys: ['↵'], label: 'Valider un formulaire inline' },
      { keys: ['Tab'], label: 'Champ suivant' },
    ],
  },
];

export const GUIDE_CARDS: GuideCard[] = [
  {
    title: 'AI Office',
    description: 'Parcourir le bureau 3D, cliquer sur les agents et valider les actions en attente.',
    route: '/app/ai-office',
    icon: '3D',
    accent: '#38BDF8',
    hint: 'Hub principal',
  },
  {
    title: 'AI Center',
    description: 'Vue synthétique des agents, validations en attente et historique des actions.',
    route: '/app/ai-center',
    icon: 'AI',
    accent: '#A78BFA',
    hint: 'Hub IA',
  },
  {
    title: 'Dashboard',
    description: 'KPIs, équipes, chefs et analytics sans quitter le pilotage.',
    route: '/app/dashboard',
    icon: 'DB',
    accent: '#34D399',
    hint: 'Pilotage',
  },
  {
    title: 'Centre Données',
    description: 'Bibliothèques CMS, PIM, SCM, MRP, ETL et EDI avec export et filtres.',
    route: '/app/data-hub',
    icon: 'DT',
    accent: '#F59E0B',
    hint: 'Données',
  },
  {
    title: 'Studio',
    description: 'Composer des graphes agents, chaînes d\'outils et workflows HITL.',
    route: '/app/studio',
    icon: 'ST',
    accent: '#F472B6',
    hint: 'Création',
  },
  {
    title: 'Chat',
    description: 'Conversations avec mémoire et contexte RAG entreprise.',
    route: '/app/chat',
    icon: 'CH',
    accent: '#60A5FA',
    hint: 'Conversation',
  },
  {
    title: 'Marketplace',
    description: 'Publier, installer et partager des agents ou templates.',
    route: '/app/marketplace',
    icon: 'MK',
    accent: '#FB923C',
    hint: 'Écosystème',
  },
  {
    title: 'Workspace',
    description: 'Branding, agents actifs, widgets et import/export de configuration.',
    route: '/app/workspace',
    icon: 'WS',
    accent: '#94A3B8',
    hint: 'Système',
  },
];

export const START_STEPS: StartStep[] = [
  {
    step: 1,
    title: 'Explorer l\'AI Office',
    description: 'Découvrez les bureaux 3D, les LEDs de statut et les chefs d\'équipe sur la plateforme murale.',
    route: '/app/ai-office',
    routeLabel: 'Ouvrir AI Office',
  },
  {
    step: 2,
    title: 'Configurer le workspace',
    description: 'Personnalisez le nom de l\'entreprise, les agents visibles et les préférences d\'affichage.',
    route: '/app/workspace',
    routeLabel: 'Workspace',
  },
  {
    step: 3,
    title: 'Importer vos données',
    description: 'Uploadez documents et référentiels pour alimenter le RAG et les bibliothèques métier.',
    route: '/app/company-data',
    routeLabel: 'Données entreprise',
  },
  {
    step: 4,
    title: 'Valider les actions agents',
    description: 'Surveillez la cloche, AI Center et Stratégie pour approuver les propositions en attente.',
    route: '/app/ai-center',
    routeLabel: 'AI Center',
  },
];

export const SUPPORT_LINKS = [
  { label: 'Envoyer un feedback', route: '/app/feedback', desc: 'Bug, idée ou question billing' },
  { label: 'Changelog', route: '/app/changelog', desc: 'Nouveautés et correctifs' },
  { label: 'Paramètres', route: '/app/settings', desc: 'Profil, thème et quotas' },
  { label: 'Onboarding', route: '/app/onboarding', desc: 'Parcours de prise en main' },
  { label: 'Audit', route: '/app/audit', desc: 'Journal et traçabilité' },
] as const;
