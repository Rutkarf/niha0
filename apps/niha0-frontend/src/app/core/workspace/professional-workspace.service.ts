import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../api/api.service';
import { AuthService } from '../auth/auth.service';
import { Organization } from '../api/api.models';
import {
  CompanyDataAsset,
  CompanyProfile,
  WorkspaceConfig,
  defaultWorkspaceConfig,
  emptyProfile,
} from './professional.models';
import { THEME_PRESETS } from './professional-presets';

const DRAFT_KEY = 'niha0_onboarding_draft';

@Injectable({ providedIn: 'root' })
export class ProfessionalWorkspaceService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  private readonly orgSignal = signal<Organization | null>(null);
  private readonly profileSignal = signal<CompanyProfile>(emptyProfile());
  private readonly configSignal = signal<WorkspaceConfig>(defaultWorkspaceConfig());
  private readonly dirtySignal = signal(false);
  private readonly loadingSignal = signal(false);
  private readonly assetsSignal = signal<CompanyDataAsset[]>([]);

  readonly organization = this.orgSignal.asReadonly();
  readonly profile = this.profileSignal.asReadonly();
  readonly config = this.configSignal.asReadonly();
  readonly dirty = this.dirtySignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly dataAssets = this.assetsSignal.asReadonly();

  readonly onboardingIncomplete = computed(() => {
    const status = this.profileSignal().onboardingStatus;
    return status === 'NOT_STARTED' || status === 'IN_PROGRESS';
  });

  readonly branding = computed(() => this.configSignal().branding);
  readonly office = computed(() => this.configSignal().office);

  async hydrate(): Promise<void> {
    if (!this.auth.isAuthenticated()) return;
    this.loadingSignal.set(true);
    try {
      const org = await firstValueFrom(this.api.getCurrentOrganization());
      this.orgSignal.set(org);
      this.applyOrganization(org);
      await this.refreshDataAssets();
    } catch {
      this.loadDraftFallback();
    } finally {
      this.loadingSignal.set(false);
    }
  }

  patchProfile(partial: Partial<CompanyProfile>): void {
    this.profileSignal.update((p) => ({ ...p, ...partial }));
    this.dirtySignal.set(true);
    this.persistDraft();
  }

  patchConfig(partial: Partial<WorkspaceConfig>): void {
    this.configSignal.update((c) => ({
      ...c,
      ...partial,
      branding: partial.branding ? { ...c.branding, ...partial.branding } : c.branding,
      office: partial.office ? { ...c.office, ...partial.office } : c.office,
      agents: partial.agents ?? c.agents,
      assistants: partial.assistants ?? c.assistants,
    }));
    this.dirtySignal.set(true);
    this.persistDraft();
  }

  applyThemePreset(presetId: string): void {
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    this.patchConfig({
      branding: {
        ...this.configSignal().branding,
        themePreset: preset.id,
        primaryColor: preset.primary,
        secondaryColor: preset.secondary,
        accentColor: preset.accent,
      },
    });
  }

  setLogoPreview(dataUrl: string | null): void {
    this.patchProfile({ logoUrl: dataUrl });
  }

  async saveAll(markCompleted = false): Promise<Organization> {
    this.loadingSignal.set(true);
    try {
      const profile = this.profileSignal();
      const config = this.configSignal();
      const carpetText = config.branding.carpetText || profile.companyName;
      const payload = {
        name: profile.companyName || undefined,
        sector: profile.sector || undefined,
        description: profile.description || undefined,
        website: profile.website || undefined,
        country: profile.country || undefined,
        city: profile.city || undefined,
        companySize: profile.companySize || undefined,
        professionalEmail: profile.professionalEmail || undefined,
        slogan: profile.slogan || undefined,
        logoUrl: profile.logoUrl,
        onboardingStatus: markCompleted ? 'COMPLETED' : profile.onboardingStatus || 'IN_PROGRESS',
        workspaceConfig: JSON.stringify({
          ...config,
          branding: { ...config.branding, carpetText },
        }),
      };
      const org = await firstValueFrom(this.api.updateOrganization(payload));
      this.orgSignal.set(org);
      this.applyOrganization(org);
      this.dirtySignal.set(false);
      localStorage.removeItem(DRAFT_KEY);
      return org;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async uploadLogo(file: File): Promise<void> {
    const org = await firstValueFrom(this.api.uploadOrganizationLogo(file));
    this.orgSignal.set(org);
    this.applyOrganization(org);
    this.dirtySignal.set(false);
  }

  async clearLogo(): Promise<void> {
    const org = await firstValueFrom(this.api.clearOrganizationLogo());
    this.orgSignal.set(org);
    this.applyOrganization(org);
  }

  async refreshDataAssets(): Promise<void> {
    try {
      const list = await firstValueFrom(this.api.listCompanyDataAssets());
      this.assetsSignal.set(list);
    } catch {
      this.assetsSignal.set([]);
    }
  }

  async uploadDataAsset(file: File, meta?: { category?: string; description?: string }): Promise<void> {
    await firstValueFrom(
      this.api.uploadCompanyDataAsset(file, meta?.category, meta?.description),
    );
    await this.refreshDataAssets();
  }

  async addDataAsset(meta: {
    name: string;
    fileType: string;
    mimeType?: string;
    sizeBytes: number;
    description?: string;
    category?: string;
    linkedAgentIds?: string;
    storageReference?: string;
  }): Promise<void> {
    await firstValueFrom(
      this.api.createCompanyDataAsset({
        ...meta,
        status: 'IMPORTED',
        processingStatus: 'UPLOADED',
      }),
    );
    await this.refreshDataAssets();
  }

  async updateDataAsset(
    id: string,
    body: Partial<{
      name: string;
      description: string;
      category: string;
      linkedAgentIds: string;
      status: string;
      processingStatus: string;
    }>,
  ): Promise<void> {
    await firstValueFrom(this.api.updateCompanyDataAsset(id, body));
    await this.refreshDataAssets();
  }

  async deleteDataAsset(id: string): Promise<void> {
    await firstValueFrom(this.api.deleteCompanyDataAsset(id));
    await this.refreshDataAssets();
  }

  resetCustomization(): void {
    const name = this.profileSignal().companyName;
    this.configSignal.set({
      ...defaultWorkspaceConfig(),
      branding: {
        ...defaultWorkspaceConfig().branding,
        carpetText: name,
      },
      office: {
        ...defaultWorkspaceConfig().office,
        workspaceName: name,
      },
    });
    this.dirtySignal.set(true);
    this.persistDraft();
  }

  private applyOrganization(org: Organization): void {
    this.profileSignal.set({
      id: org.id,
      companyName: org.name ?? '',
      sector: org.sector ?? '',
      companySize: org.companySize ?? '',
      country: org.country ?? '',
      city: org.city ?? '',
      description: org.description ?? '',
      professionalEmail: org.professionalEmail ?? '',
      website: org.website ?? '',
      slogan: org.slogan ?? '',
      logoUrl: org.logoUrl ?? null,
      onboardingStatus: (org.onboardingStatus as CompanyProfile['onboardingStatus']) || 'IN_PROGRESS',
    });
    let config = defaultWorkspaceConfig();
    if (org.workspaceConfig) {
      try {
        const parsed = JSON.parse(org.workspaceConfig) as WorkspaceConfig;
        config = {
          ...defaultWorkspaceConfig(),
          ...parsed,
          branding: { ...defaultWorkspaceConfig().branding, ...parsed.branding },
          office: { ...defaultWorkspaceConfig().office, ...parsed.office },
          agents: parsed.agents ?? [],
          assistants: parsed.assistants ?? [],
        };
      } catch {
        /* keep defaults */
      }
    }
    if (!config.branding.carpetText) {
      config.branding.carpetText = org.name;
    }
    if (!config.office.workspaceName) {
      config.office.workspaceName = org.name;
    }
    this.configSignal.set(config);
  }

  private persistDraft(): void {
    const draft = {
      profile: this.profileSignal(),
      config: this.configSignal(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  private loadDraftFallback(): void {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as { profile: CompanyProfile; config: WorkspaceConfig };
      if (draft.profile) this.profileSignal.set({ ...emptyProfile(), ...draft.profile });
      if (draft.config) {
        this.configSignal.set({
          ...defaultWorkspaceConfig(),
          ...draft.config,
          branding: { ...defaultWorkspaceConfig().branding, ...draft.config.branding },
          office: { ...defaultWorkspaceConfig().office, ...draft.config.office },
        });
      }
    } catch {
      /* ignore */
    }
  }
}
