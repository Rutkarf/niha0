import type { ThemePresetId } from './professional.models';

export interface ThemePreset {
  id: ThemePresetId;
  label: string;
  primary: string;
  secondary: string;
  accent: string;
  sceneTheme: 'CYBERPUNK' | 'SOLARPUNK';
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'cyberpunk-dark',
    label: 'Cyberpunk sombre',
    primary: '#3EC4FF',
    secondary: '#5EEAD4',
    accent: '#67E8F9',
    sceneTheme: 'CYBERPUNK',
  },
  {
    id: 'corporate-modern',
    label: 'Corporate moderne',
    primary: '#2563EB',
    secondary: '#64748B',
    accent: '#38BDF8',
    sceneTheme: 'CYBERPUNK',
  },
  {
    id: 'minimal-light',
    label: 'Minimal clair',
    primary: '#1F9D6A',
    secondary: '#0F8A8A',
    accent: '#E8B84A',
    sceneTheme: 'SOLARPUNK',
  },
  {
    id: 'violet-ai',
    label: 'Violet IA',
    primary: '#8B5CF6',
    secondary: '#A78BFA',
    accent: '#C4B5FD',
    sceneTheme: 'CYBERPUNK',
  },
  {
    id: 'blue-data',
    label: 'Bleu data',
    primary: '#0EA5E9',
    secondary: '#0284C7',
    accent: '#7DD3FC',
    sceneTheme: 'CYBERPUNK',
  },
  {
    id: 'green-security',
    label: 'Vert sécurité',
    primary: '#10B981',
    secondary: '#059669',
    accent: '#34D399',
    sceneTheme: 'SOLARPUNK',
  },
];

export interface AgentVisualPreset {
  id: string;
  label: string;
  primaryColor: string;
  accentColor: string;
  icon: string;
}

export const AGENT_VISUAL_PRESETS: AgentVisualPreset[] = [
  { id: 'data-analyst', label: 'Analyste data', primaryColor: '#0EA5E9', accentColor: '#7DD3FC', icon: 'BI' },
  { id: 'admin-assistant', label: 'Assistant administratif', primaryColor: '#8B5CF6', accentColor: '#C4B5FD', icon: 'AD' },
  { id: 'customer-support', label: 'Support client', primaryColor: '#14B8A6', accentColor: '#5EEAD4', icon: 'SU' },
  { id: 'cybersecurity', label: 'Cybersécurité', primaryColor: '#10B981', accentColor: '#6EE7B7', icon: 'SE' },
  { id: 'finance', label: 'Finances', primaryColor: '#D97706', accentColor: '#1E3A5F', icon: 'FI' },
  { id: 'developer', label: 'Développeur', primaryColor: '#7C3AED', accentColor: '#22D3EE', icon: 'DV' },
  { id: 'corporate-neutral', label: 'Neutre corporate', primaryColor: '#64748B', accentColor: '#94A3B8', icon: 'CO' },
];

export const ASSISTANT_ROLES = [
  'Recherche documentaire',
  'Analyse de données',
  'Rédaction',
  'Support',
  'Sécurité',
  'Comptabilité',
  'Veille métier',
  'Organisation et planification',
] as const;

export const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-1000', '1000+'] as const;

export const LOGO_ACCEPT = 'image/png,image/jpeg,image/jpg,image/webp,image/svg+xml';
export const LOGO_MAX_BYTES = 2_000_000;

export const DATA_FILE_ACCEPT =
  '.pdf,.csv,.xlsx,.xls,.txt,.docx,.json,.png,.jpg,.jpeg,.webp';
export const DATA_MAX_BYTES = 15_000_000;
