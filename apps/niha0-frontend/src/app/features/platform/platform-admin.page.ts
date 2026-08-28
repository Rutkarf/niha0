import { Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { LocaleService } from '../../core/i18n/locale.service';
import { mapHttpError } from '../../core/api/http-error.util';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { CompanyLabelPipe } from '../../shared/pipes/company-label.pipe';
import { FeaturePageHeaderComponent } from '../../shared/ui/feature-page-header/feature-page-header.component';

interface PlatformOrg {
  id: string;
  name: string;
  slug: string;
  billingPlan: string;
  status: string;
  activeSeats: number;
  storageBytes: number;
}

@Component({
  selector: 'app-platform-admin-page',
  imports: [CompanyLabelPipe, FeaturePageHeaderComponent],
  template: `
    <div class="page feature-module-page">
      <app-feature-page-header
        group="Plateforme"
        [title]="locale.t('platformAdmin')"
        backLabel="← AI Office"
      />
      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }
      @if (summary()) {
        <p class="feature-callout">{{ summary()!.organizationCount }} orgs · {{ summary()!.suspendedCount }} suspendues</p>
      }
      @if (loading()) {
        <p class="muted">Chargement…</p>
      } @else {
        <section class="feature-hub card">
        <table class="data">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Plan</th>
              <th>Statut</th>
              <th>Sièges</th>
              <th>Stockage</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (org of orgs(); track org.id) {
              <tr>
                <td>{{ org.name | companyLabel }} <small>{{ org.slug }}</small></td>
                <td>{{ org.billingPlan }}</td>
                <td>
                  <span class="status" [class.suspended]="org.status === 'SUSPENDED'">{{ org.status }}</span>
                </td>
                <td>{{ org.activeSeats }}</td>
                <td>{{ formatBytes(org.storageBytes) }}</td>
                <td>
                  @if (org.status === 'SUSPENDED') {
                    <button
                      type="button"
                      class="btn btn-ghost btn-sm"
                      [disabled]="busyId() === org.id"
                      (click)="unsuspend(org)"
                    >
                      Réactiver
                    </button>
                  } @else {
                    <button
                      type="button"
                      class="btn btn-ghost btn-sm"
                      [disabled]="busyId() === org.id"
                      (click)="suspend(org)"
                    >
                      Suspendre
                    </button>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="muted">Aucune organisation</td>
              </tr>
            }
          </tbody>
        </table>
        </section>
      }
    </div>
  `,
  styles: `
    .data {
      width: 100%;
      border-collapse: collapse;
    }
    th,
    td {
      text-align: left;
      padding: 0.6rem 0.4rem;
      border-bottom: 1px solid color-mix(in oklab, currentColor 12%, transparent);
    }
    small {
      opacity: 0.6;
      margin-left: 0.35rem;
    }
    .error {
      color: var(--danger, #b91c1c);
    }
    .muted {
      opacity: 0.65;
    }
    .status.suspended {
      color: var(--accent-danger, #b91c1c);
      font-weight: 600;
    }
  `,
})
export class PlatformAdminPage implements OnInit {
  readonly locale = inject(LocaleService);
  private readonly api = inject(ApiService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  readonly orgs = signal<PlatformOrg[]>([]);
  readonly summary = signal<{ organizationCount: number; suspendedCount: number } | null>(null);
  readonly error = signal<string | null>(null);
  readonly loading = signal(true);
  readonly busyId = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [orgs, summary] = await Promise.all([
        firstValueFrom(this.api.getPlatformOrganizations()),
        firstValueFrom(this.api.getPlatformHealthSummary()),
      ]);
      this.orgs.set(orgs);
      this.summary.set(summary);
    } catch (e) {
      this.error.set(mapHttpError(e));
    } finally {
      this.loading.set(false);
    }
  }

  formatBytes(n: number): string {
    if (n < 1024) return `${n} o`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`;
    if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
    return `${(n / (1024 * 1024 * 1024)).toFixed(1)} Go`;
  }

  async suspend(org: PlatformOrg): Promise<void> {
    const ok = await this.confirmDialog.confirm({
      title: 'Suspendre l’organisation',
      message: `${org.name} ne pourra plus se connecter tant que le compte est suspendu.`,
      confirmLabel: 'Suspendre',
      danger: true,
    });
    if (!ok) return;
    this.busyId.set(org.id);
    try {
      await firstValueFrom(this.api.suspendPlatformOrg(org.id));
      this.toast.success(`${org.name} suspendue.`);
      await this.reload();
    } catch (e) {
      this.toast.error(mapHttpError(e, 'Suspension impossible.'));
    } finally {
      this.busyId.set(null);
    }
  }

  async unsuspend(org: PlatformOrg): Promise<void> {
    const ok = await this.confirmDialog.confirm({
      title: 'Réactiver l’organisation',
      message: `Réactiver ${org.name} et autoriser à nouveau les connexions ?`,
      confirmLabel: 'Réactiver',
    });
    if (!ok) return;
    this.busyId.set(org.id);
    try {
      await firstValueFrom(this.api.unsuspendPlatformOrg(org.id));
      this.toast.success(`${org.name} réactivée.`);
      await this.reload();
    } catch (e) {
      this.toast.error(mapHttpError(e, 'Réactivation impossible.'));
    } finally {
      this.busyId.set(null);
    }
  }
}
