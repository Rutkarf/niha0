import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../api/api.service';
import { AuthService } from '../auth/auth.service';
import { companyLabel, normalizeCompanyName } from './company-label';

@Injectable({ providedIn: 'root' })
export class TenancyService {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly orgNameFromApi = signal<string | null>(null);

  readonly organizationId = computed(() => this.auth.user()?.organizationId ?? null);

  /** Nom brut de la société (API, formulaires). */
  readonly organizationName = computed(() => {
    const fromApi = this.orgNameFromApi();
    if (fromApi) return fromApi;
    return normalizeCompanyName(this.auth.user()?.organizationName) || 'Organisation';
  });

  /** Affichage UI avec préfixe « Société : ». */
  readonly companyLabel = computed(() => companyLabel(this.organizationName()));

  constructor() {
    effect(() => {
      if (this.auth.user()?.organizationId) {
        void this.refreshOrganizationName();
      }
    });
  }

  async refreshOrganizationName(): Promise<void> {
    try {
      const org = await firstValueFrom(this.api.getCurrentOrganization());
      const name = normalizeCompanyName(org.name);
      if (name) this.orgNameFromApi.set(name);
    } catch {
      /* garde le nom issu de /auth/me */
    }
  }
}
