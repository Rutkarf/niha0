export type Role =
  | 'OWNER'
  | 'ADMIN'
  | 'MANAGER'
  | 'MEMBER'
  | 'SALES'
  | 'MARKETING'
  | 'ACCOUNTANT'
  | 'SUPPORT'
  | 'LEGAL'
  | 'HR'
  | 'OPS'
  | 'VIEWER'
  | 'PLATFORM_ADMIN';

export interface TokenResponse {
  accessToken?: string;
  refreshToken?: string;
  expiresInMs?: number;
  userId?: string;
  organizationId?: string;
  role?: Role;
  mfaRequired?: boolean;
  mfaToken?: string;
}

export interface UserMe {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  organizationName: string;
  role: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export type AuthDrawerMode = 'login' | 'register';

export interface MfaVerifyRequest {
  mfaToken: string;
  code: string;
  recoveryCode?: string;
}
