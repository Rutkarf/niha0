import type { Organization } from './api.models';

/** PATCH /organizations/current */
export interface OrganizationUpdateDto {
  name?: string;
  sector?: string;
  description?: string;
  website?: string;
  country?: string;
  city?: string;
  companySize?: string;
  professionalEmail?: string;
  slogan?: string;
  logoUrl?: string | null;
  onboardingStatus?: string;
  workspaceConfig?: string;
}

export type OrganizationResponse = Organization;
