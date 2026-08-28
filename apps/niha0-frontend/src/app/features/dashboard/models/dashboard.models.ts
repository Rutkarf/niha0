export type DashboardSection =
  | 'home'
  | 'agents'
  | 'teams'
  | 'chiefs'
  | 'analytics'
  | 'settings'
  | 'help';

export type LedDisplayStatus = 'green' | 'red' | 'off';

export interface DashboardAgent {
  id: string;
  deskCode: string;
  name: string;
  role: string;
  team: string;
  rowId: number;
  teamColor: string;
  isChief: boolean;
  ledStatus: LedDisplayStatus;
  email: string;
  tasksInProgress: number;
  tasksCompleted: number;
  performance: number;
  lastAction: string;
  history: readonly string[];
}

export interface DashboardTeam {
  rowId: number;
  name: string;
  color: string;
  gradient: readonly [string, string, string];
  chiefName: string;
  chiefTitle: string;
  chiefDeskCode: string;
  agentCount: number;
  activeCount: number;
  tasksInProgress: number;
  tasksCompleted: number;
  performance: number;
  avgResponseMin: number;
  members: DashboardAgent[];
  chief: DashboardAgent;
}

export interface DashboardNihaoStats {
  totalAgents: number;
  activeAgents: number;
  inactiveAgents: number;
  totalTeams: number;
  tasksInProgress: number;
  globalPerformance: number;
  greenLeds: number;
  redLeds: number;
}

export interface DashboardDetailTarget {
  kind: 'agent' | 'chief' | 'team';
  agent?: DashboardAgent;
  team?: DashboardTeam;
}

export type DashboardDomainTone = 'neutral' | 'success' | 'warning' | 'danger';

export interface DashboardDomainMetric {
  label: string;
  value: string | number;
  highlight?: boolean;
}

export interface DashboardDomainRow {
  id: string;
  primary: string;
  secondary?: string;
  meta?: string;
  badge?: string;
  tone?: DashboardDomainTone;
  route?: string;
  routeQuery?: Record<string, string>;
}

export interface DashboardDomainSection {
  id: string;
  code: string;
  title: string;
  count: number;
  route: string;
  routeQuery?: Record<string, string>;
  routeLabel: string;
  metrics: DashboardDomainMetric[];
  rows: DashboardDomainRow[];
  trend: number[];
  sparkColor: string;
}

export interface DashboardPreferences {
  agentsPageSize: number;
  visibleColumns: Record<string, boolean>;
  cardSize: 'compact' | 'normal' | 'large';
  notificationsEnabled: boolean;
  notifyEmail: boolean;
  notifyPush: boolean;
  locale: 'fr' | 'en';
  ledsEnabled: boolean;
  showOnlyActive: boolean;
  showHighPerformers: boolean;
  showChiefsOnly: boolean;
}

export const DEFAULT_DASHBOARD_PREFERENCES: DashboardPreferences = {
  agentsPageSize: 10,
  visibleColumns: {
    avatar: true,
    name: true,
    team: true,
    role: true,
    status: true,
    actions: true,
  },
  cardSize: 'normal',
  notificationsEnabled: true,
  notifyEmail: true,
  notifyPush: false,
  locale: 'fr',
  ledsEnabled: true,
  showOnlyActive: false,
  showHighPerformers: false,
  showChiefsOnly: false,
};
