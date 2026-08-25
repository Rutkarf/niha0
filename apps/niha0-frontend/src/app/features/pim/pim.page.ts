import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { Agent, PimProduct, PimVariant } from '../../core/api/api.models';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AgentOfficeLinkComponent } from '../../shared/ui/agent-office-link/agent-office-link.component';
import { AgentHubCardComponent } from '../../shared/ui/agent-hub-card/agent-hub-card.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { mapHttpError } from '../../core/api/http-error.util';

@Component({
  selector: 'app-pim-page',
  imports: [
    FormsModule,
    RouterLink,
    LoadingStateComponent,
    EmptyStateComponent,
    AgentOfficeLinkComponent,
    AgentHubCardComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <a routerLink="/app/ai-office" class="back-ao">← AI Office</a>
          <h1>PIM</h1>
          <p>Référentiel produits et variantes</p>
          <app-agent-office-link moduleKey="pim" label="PIM" />
        </div>
      </header>

      @if (loadingAgent()) {
        <app-loading-state message="Chargement agent…" />
      } @else if (agent()) {
        <app-agent-hub-card [agent]="agent()!" officeQuery="stock" />
      }

      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }

      <form class="card form" (ngSubmit)="addProduct()">
        <h2>Nouveau produit</h2>
        <div class="row">
          <input class="input" placeholder="SKU" [(ngModel)]="sku" name="sku" required />
          <input class="input" placeholder="Nom" [(ngModel)]="name" name="name" required />
          <input class="input" placeholder="Catégorie" [(ngModel)]="category" name="category" />
          <input class="input" placeholder="Description" [(ngModel)]="description" name="description" />
          <button class="btn btn-primary" type="submit" [disabled]="saving()">Ajouter</button>
        </div>
      </form>

      <h2 class="section-title">Produits</h2>
      @if (loading()) {
        <app-loading-state />
      } @else if (!products().length) {
        <app-empty-state
          title="Aucun produit"
          icon="PI"
          description="Créez un produit pour gérer le catalogue et ses variantes."
        />
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>SKU</th><th>Nom</th><th>Catégorie</th><th>Statut</th><th></th></tr>
            </thead>
            <tbody>
              @for (p of products(); track p.id) {
                <tr [class.selected]="selected()?.id === p.id">
                  <td>{{ p.sku }}</td>
                  <td>{{ p.name }}</td>
                  <td>{{ p.category || '—' }}</td>
                  <td><app-status-badge [status]="p.status" /></td>
                  <td class="actions">
                    <button type="button" class="btn btn-ghost btn-sm" (click)="select(p)">Variantes</button>
                    <button type="button" class="btn btn-ghost btn-sm" (click)="toggleStatus(p)">
                      {{ p.status === 'ACTIVE' ? 'Brouillon' : 'Activer' }}
                    </button>
                    <button type="button" class="btn btn-danger btn-sm" (click)="remove(p)">Suppr.</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (selected(); as sel) {
        <section class="card variants">
          <h2>Variantes — {{ sel.name }}</h2>
          <form class="row" (ngSubmit)="addVariant()">
            <input class="input" placeholder="SKU variante" [(ngModel)]="vSku" name="vSku" required />
            <input class="input" placeholder="Nom" [(ngModel)]="vName" name="vName" required />
            <input class="input" type="number" placeholder="Prix (centimes)" [(ngModel)]="vPrice" name="vPrice" />
            <input class="input" placeholder="Devise" [(ngModel)]="vCurrency" name="vCurrency" />
            <button class="btn btn-primary btn-sm" type="submit" [disabled]="savingVariant()">Ajouter</button>
          </form>
          @if (loadingVariants()) {
            <app-loading-state message="Variantes…" />
          } @else if (!variants().length) {
            <app-empty-state title="Aucune variante" icon="PI" />
          } @else {
            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th>SKU</th><th>Nom</th><th>Prix</th><th>Statut</th></tr>
                </thead>
                <tbody>
                  @for (v of variants(); track v.id) {
                    <tr>
                      <td>{{ v.sku }}</td>
                      <td>{{ v.name }}</td>
                      <td>{{ (v.priceCents / 100).toFixed(2) }} {{ v.currency }}</td>
                      <td><app-status-badge [status]="v.status" /></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>
      }
    </div>
  `,
  styles: `
    .form, .variants { margin-bottom: 1rem; padding: 1rem; }
    .form h2, .variants h2 { margin: 0 0 0.75rem; font-size: 0.95rem; }
    .row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .row .input { flex: 1; min-width: 100px; }
    .error { color: var(--accent-danger); }
    .table-wrap { overflow-x: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-elevated); }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th, td { padding: 0.65rem 0.85rem; border-bottom: 1px solid var(--border-color); text-align: left; }
    tr.selected td { background: color-mix(in srgb, var(--accent-primary) 10%, transparent); }
    .btn-sm { font-size: 0.72rem; padding: 0.25rem 0.5rem; min-height: auto; }
    .actions { display: flex; gap: 0.35rem; flex-wrap: wrap; }
  `,
})
export class PimPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);

  readonly loadingAgent = signal(true);
  readonly loading = signal(true);
  readonly loadingVariants = signal(false);
  readonly saving = signal(false);
  readonly savingVariant = signal(false);
  readonly error = signal('');
  readonly agent = signal<Agent | null>(null);
  readonly products = signal<PimProduct[]>([]);
  readonly variants = signal<PimVariant[]>([]);
  readonly selected = signal<PimProduct | null>(null);

  sku = '';
  name = '';
  category = '';
  description = '';
  vSku = '';
  vName = '';
  vPrice = 0;
  vCurrency = 'EUR';

  ngOnInit(): void {
    this.api.getAgents().subscribe({
      next: (agents) => {
        this.agent.set(agents.find((a) => a.code === 'STOCK') ?? null);
        this.loadingAgent.set(false);
      },
      error: () => this.loadingAgent.set(false),
    });
    this.reload();
  }

  addProduct(): void {
    this.error.set('');
    this.saving.set(true);
    this.api
      .createPimProduct({
        sku: this.sku.trim(),
        name: this.name.trim(),
        category: this.category.trim() || undefined,
        description: this.description.trim() || undefined,
        status: 'DRAFT',
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.sku = this.name = this.category = this.description = '';
          this.toast.success('Produit créé');
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

  select(p: PimProduct): void {
    this.selected.set(p);
    this.loadingVariants.set(true);
    this.api.getPimVariants(p.id).subscribe({
      next: (data) => {
        this.variants.set(data);
        this.loadingVariants.set(false);
      },
      error: (err) => {
        this.loadingVariants.set(false);
        this.toast.error(mapHttpError(err));
      },
    });
  }

  addVariant(): void {
    const sel = this.selected();
    if (!sel) return;
    this.savingVariant.set(true);
    this.api
      .createPimVariant(sel.id, {
        sku: this.vSku.trim(),
        name: this.vName.trim(),
        priceCents: Number(this.vPrice) || 0,
        currency: this.vCurrency.trim() || 'EUR',
        status: 'ACTIVE',
      })
      .subscribe({
        next: () => {
          this.savingVariant.set(false);
          this.vSku = this.vName = '';
          this.vPrice = 0;
          this.toast.success('Variante ajoutée');
          this.select(sel);
        },
        error: (err) => {
          this.savingVariant.set(false);
          this.toast.error(mapHttpError(err));
        },
      });
  }

  toggleStatus(p: PimProduct): void {
    const status = p.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
    this.api.updatePimProduct(p.id, { ...p, status }).subscribe({
      next: () => {
        this.toast.success(`Statut → ${status}`);
        this.reload();
      },
      error: (err) => this.toast.error(mapHttpError(err)),
    });
  }

  async remove(p: PimProduct): Promise<void> {
    const ok = await this.confirmDialog.confirm({
      title: 'Supprimer le produit',
      message: `Supprimer ${p.sku} (${p.name}) ?`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    this.api.deletePimProduct(p.id).subscribe({
      next: () => {
        if (this.selected()?.id === p.id) {
          this.selected.set(null);
          this.variants.set([]);
        }
        this.toast.success('Produit supprimé');
        this.reload();
      },
      error: (err) => this.toast.error(mapHttpError(err)),
    });
  }

  private reload(): void {
    this.api.getPimProducts().subscribe({
      next: (data) => {
        this.products.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(mapHttpError(err));
      },
    });
  }
}
