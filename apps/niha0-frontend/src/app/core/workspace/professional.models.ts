/** Professional workspace — single source of truth for onboarding & customization. */

export type OnboardingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export type ThemePresetId =
  | 'cyberpunk-dark'
  | 'corporate-modern'
  | 'minimal-light'
  | 'violet-ai'
  | 'blue-data'
  | 'green-security';

export type LogoDisplayMode = 'plaque' | 'hologram' | 'led' | 'neon';
export type CarpetStyle = 'corporate' | 'futuristic' | 'circular' | 'premium' | 'holographic';
export type AgentVisibility = 'visible' | 'secondary' | 'hidden';
export type AgentStatusConfig = 'active' | 'preparing' | 'disabled';
export type CommunicationTone = 'professional' | 'direct' | 'analytical' | 'creative' | 'support';
export type AssistantVisibility = 'discreet' | 'normal' | 'featured';
export type DataAssetStatus = 'PENDING' | 'UPLOADING' | 'IMPORTED' | 'ERROR' | 'INDEXED' | 'SOON';
export type ProcessingStatus = 'UPLOADED' | 'PENDING_AI' | 'PROCESSING' | 'READY' | 'FAILED';

export interface CompanyProfile {
  id?: string;
  companyName: string;
  sector: string;
  companySize: string;
  country: string;
  city: string;
  description: string;
  professionalEmail: string;
  website: string;
  slogan: string;
  logoUrl: string | null;
  onboardingStatus: OnboardingStatus;
}

export interface CompanyBranding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  themePreset: ThemePresetId;
  logoDisplayMode: LogoDisplayMode;
  logoScale: number;
  logoPosition: { x: number; y: number; z: number };
  logoBrightness: number;
  carpetStyle: CarpetStyle;
  carpetText: string;
  carpetColor: string;
  carpetScale: number;
  carpetOpacity: number;
  carpetPosition: { x: number; y: number; z: number };
  carpetRotationY: number;
}

export interface OfficeCustomization {
  wallTheme: string;
  floorTheme: string;
  deskTheme: string;
  lightingTheme: string;
  neonIntensity: number;
  animationMode: 'none' | 'particles' | 'digital-rain' | 'network' | 'pulse';
  animationIntensity: number;
  widgets: string[];
  workspaceName: string;
  companyBadge: string;
  sidebarAccent: string;
  accessibilityMode: boolean;
  highContrast: boolean;
}

export interface AgentConfiguration {
  id: string;
  code: string;
  name: string;
  role: string;
  description: string;
  visualPreset: string;
  primaryColor: string;
  accentColor: string;
  avatar: string;
  position3D?: [number, number, number];
  status: AgentStatusConfig;
  communicationTone: CommunicationTone;
  isVisible: boolean;
  visibility: AgentVisibility;
  icon: string;
  assistantIds: string[];
}

export interface AssistantConfiguration {
  id: string;
  parentAgentId: string;
  name: string;
  role: string;
  visualPreset: string;
  color: string;
  position3D?: [number, number, number];
  visibility: AssistantVisibility;
  linkedDataSourceIds: string[];
  isEnabled: boolean;
  icon: string;
}

export interface WorkspaceConfig {
  branding: CompanyBranding;
  office: OfficeCustomization;
  agents: AgentConfiguration[];
  assistants: AssistantConfiguration[];
  onboardingStep?: number;
}

export interface CompanyDataAsset {
  id: string;
  organizationId: string;
  name: string;
  fileType: string;
  mimeType: string | null;
  sizeBytes: number;
  status: string;
  processingStatus: string;
  description: string | null;
  category: string | null;
  storageReference: string | null;
  linkedAgentIds: string | null;
  storedAssetId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProfessionalAccountDraft {
  profile: CompanyProfile;
  config: WorkspaceConfig;
}

export const DEFAULT_BRANDING: CompanyBranding = {
  primaryColor: '#3EC4FF',
  secondaryColor: '#5EEAD4',
  accentColor: '#67E8F9',
  themePreset: 'cyberpunk-dark',
  logoDisplayMode: 'plaque',
  logoScale: 1,
  logoPosition: { x: -2.62, y: 2.35, z: 0 },
  logoBrightness: 0.55,
  carpetStyle: 'futuristic',
  carpetText: '',
  carpetColor: '#1E293B',
  carpetScale: 1,
  carpetOpacity: 0.92,
  carpetPosition: { x: 1.4, y: 0.02, z: 0 },
  carpetRotationY: 0,
};

export const DEFAULT_OFFICE: OfficeCustomization = {
  wallTheme: 'slate',
  floorTheme: 'carpet',
  deskTheme: 'executive',
  lightingTheme: 'night',
  neonIntensity: 0.55,
  animationMode: 'pulse',
  animationIntensity: 0.6,
  widgets: ['activity', 'alerts'],
  workspaceName: '',
  companyBadge: 'Pro',
  sidebarAccent: '',
  accessibilityMode: false,
  highContrast: false,
};

export function emptyProfile(): CompanyProfile {
  return {
    companyName: '',
    sector: '',
    companySize: '',
    country: '',
    city: '',
    description: '',
    professionalEmail: '',
    website: '',
    slogan: '',
    logoUrl: null,
    onboardingStatus: 'NOT_STARTED',
  };
}

export function defaultWorkspaceConfig(): WorkspaceConfig {
  return {
    branding: { ...DEFAULT_BRANDING },
    office: { ...DEFAULT_OFFICE },
    agents: [],
    assistants: [],
    onboardingStep: 0,
  };
}
