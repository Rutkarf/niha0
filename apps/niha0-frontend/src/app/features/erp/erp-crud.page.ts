import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { ErpItem } from '../../core/api/api.models';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { mapHttpError } from '../../core/api/http-error.util';

const META: Record<string, { title: string; subtitle: string; codeLabel: string; detailLabel: string }> = {
  CMS: { title: 'CMS', subtitle: 'Pages et contenus web', codeLabel: 'Slug', detailLabel: 'Corps / notes' },
  SCM: { title: 'SCM', subtitle: 'Supply chain — expéditions & fournisseurs', codeLabel: 'Référence', detailLabel: 'Fournisseur / notes' },
  MRP: { title: 'MRP', subtitle: 'Plans de besoins matières', codeLabel: 'Code plan', detailLabel: 'Horizon / notes' },
  ETL: { title: 'ETL', subtitle: 'Jobs d’intégration de données', codeLabel: 'Job', detailLabel: 'Source → cible' },
  EDI: { title: 'EDI', subtitle: 'Messages B2B structurés', codeLabel: 'Message', detailLabel: 'Partenaire / payload' },
};

@Component({
  selector: 'app-erp-crud-page',
  imports: [
    FormsModule,
    RouterLink,
    LoadingStateComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <a routerLink="/app/ai-office" class="back-ao">← AI Office</a>
          <h1>{{ meta.title }}</h1>
          <p>{{ meta.subtitle }}</p>
        </div>
      </header>

      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }

      <form class="card form" (ngSubmit)="create()">
        <h2>Nouvel élément</h2>
        <div class="row">
          <input class="input" [placeholder]="meta.codeLabel" [(ngModel)]="code" name="code" required />
          <input class="input" placeholder="Titre" [(ngModel)]="title" name="title" required />
          <input class="input" [placeholder]="meta.detailLabel" [(ngModel)]="details" name="details" />
          <button class="btn btn-primary" type="submit" [disabled]="saving()">Ajouter</button>
        </div>
      </form>

      <h2 class="section-title">Éléments</h2>
      @if (loading()) {
        <app-loading-state />
      } @else if (!items().length) {
        <app-empty-state title="Aucun élément" icon="ER" description="Créez le premier enregistrement." />
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>{{ meta.codeLabel }}</th><th>Titre</th><th>Statut</th><th></th></tr>
            </thead>
            <tbody>
              @for (it of items(); track it.id) {
                <tr>
                  <td>{{ it.code }}</td>
                  <td>{{ it.title }}</td>
                  <td><app-status-badge [status]="it.status" /></td>
                  <td class="actions">
                    <button type="button" class="btn btn-ghost btn-sm" (click)="toggle(it)">
                      {{ it.status === 'ACTIVE' ? 'Brouillon' : 'Activer' }}
                    </button>
                    <button type="button" class="btn btn-danger btn-sm" (click)="remove(it)">Suppr.</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: `
    .error { color: var(--accent-danger); }
    .form { margin-bottom: 1rem; padding: 1rem; }
    .form h2 { margin: 0 0 0.75rem; font-size: 0.95rem; }
    .row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .row .input { flex: 1; min-width: 120px; }
    .table-wrap { overflow-x: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-elevated); }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th, td { padding: 0.65rem 0.85rem; border-bottom: 1px solid var(--border-color); text-align: left; }
    .actions { display: flex; gap: 0.35rem; }
    .btn-sm { font-size: 0.72rem; padding: 0.25rem 0.5rem; min-height: auto; }
  `,
})
export class ErpCrudPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmDialogService);

  readonly module = (this.route.snapshot.data['erpModule'] as string) || 'CMS';
  readonly meta = META[this.module] ?? META['CMS']!;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly items = signal<ErpItem[]>([]);

  code = '';
  title = '';
  details = '';

  ngOnInit(): void {
    this.reload();
  }

  create(): void {
    this.saving.set(true);
    this.api
      .createErpItem(this.module, {
        code: this.code.trim(),
        title: this.title.trim(),
        status: 'DRAFT',
        detailsJson: this.details.trim() ? JSON.stringify({ note: this.details.trim() }) : undefined,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.code = this.title = this.details = '';
          this.toast.success('Créé');
          this.reload();
        },
        error: (err) => {
          this.saving.set(false);
          const msg = mapHttpError(err);
          this.error.set(msg);
          this.toast.error(msg);
        },
      });
  }

  toggle(it: ErpItem): void {
    const status = it.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
    this.api.updateErpItem(this.module, it.id, { ...it, status }).subscribe({
      next: () => {
        this.toast.success('Statut mis à jour');
        this.reload();
      },
      error: (err) => this.toast.error(mapHttpError(err)),
    });
  }

  async remove(it: ErpItem): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Supprimer',
      message: `Supprimer « ${it.title} » ?`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    this.api.deleteErpItem(this.module, it.id).subscribe({
      next: () => {
        this.toast.success('Supprimé');
        this.reload();
      },
      error: (err) => this.toast.error(mapHttpError(err)),
    });
  }

  private reload(): void {
    this.api.listErpItems(this.module).subscribe({
      next: (data) => {
        this.items.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(mapHttpError(err));
      },
    });
  }
}
