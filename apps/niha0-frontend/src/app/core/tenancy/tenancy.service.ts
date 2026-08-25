import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class TenancyService {
  private readonly auth = inject(AuthService);

  readonly organizationId = computed(() => this.auth.user()?.organizationId ?? null);
  readonly organizationName = computed(() => this.auth.user()?.organizationName ?? 'Organisation');
}
