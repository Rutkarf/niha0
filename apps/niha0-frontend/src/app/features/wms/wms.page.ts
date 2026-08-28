import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api/api.service';
import { Agent, StockItem } from '../../core/api/api.models';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { FeaturePageHeaderComponent } from '../../shared/ui/feature-page-header/feature-page-header.component';
import { FeatureAgentHostComponent } from '../../shared/ui/feature-agent-host/feature-agent-host.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { mapHttpError } from '../../core/api/http-error.util';

const VISIBLE_ROWS = 5;
const ROW_HEIGHT_REM = 2.85;

@Component({
  selector: 'app-wms-page',
  imports: [
    FormsModule,
    EmptyStateComponent,
    FeaturePageHeaderComponent,
    FeatureAgentHostComponent,
    SkeletonComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="page feature-module-page">
      <app-feature-page-header
        group="Gestion"
        title="Stock / WMS"
        backLabel="← AI Office Stock / WMS"
        [backQueryParams]="{ agent: 'stock' }"
      />

      <app-feature-agent-host
        [agent]="agent()"
        [loading]="loadingAgent()"
        officeQuery="stock"
        sectionLabel="Agent dédié Stock / WMS"
        officeLinkLabel="Stock / WMS"
      />

      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }

      <div class="wms-pair-row">
        <section class="feature-hub card wms-half">
          <header class="feature-hub-head">
            <h2 class="feature-hub-title">Nouvel article</h2>
            <span class="feature-hub-sub">Référence et paramétrage stock</span>
          </header>

          <form class="wms-form" (ngSubmit)="addItem()">
            <div class="embedded-form-grid">
              <label class="label">
                SKU
                <input class="input" name="sku" [(ngModel)]="sku" required maxlength="64" />
              </label>
              <label class="label">
                Nom
                <input class="input" name="name" [(ngModel)]="name" required maxlength="160" />
              </label>
              <label class="label">
                Quantité initiale
                <input class="input" type="number" name="quantity" [(ngModel)]="quantity" min="0" />
              </label>
              <label class="label">
                Seuil de réappro.
                <input class="input" type="number" name="reorderLevel" [(ngModel)]="reorderLevel" min="0" />
              </label>
              <label class="label span-2">
                Emplacement
                <input class="input" name="location" [(ngModel)]="location" maxlength="120" placeholder="Ex. A-12-03" />
              </label>
              <div class="form-actions span-2">
                <button type="submit" class="btn btn-primary" [disabled]="saving() || !sku.trim() || !name.trim()">
                  {{ saving() ? 'Ajout…' : 'Ajouter à l\'inventaire' }}
                </button>
              </div>
            </div>
          </form>
        </section>

        <section class="feature-hub card wms-half inventory-section">
          <header class="section-toolbar" role="toolbar" aria-label="Inventaire">
            <h2 class="section-title">Inventaire</h2>
            <label class="section-search">
              <span class="feature-search-icon" aria-hidden="true">⌕</span>
              <span class="sr-only">Rechercher</span>
              <input
                class="input section-search-input"
                type="search"
                placeholder="SKU, nom, emplacement…"
                [ngModel]="itemQuery()"
                (ngModelChange)="itemQuery.set($event)"
              />
            </label>
            <div class="section-toolbar-end">
              <span class="section-tag">Articles, quantités et emplacements</span>
              <span class="section-count">{{ items().length }} article(s)</span>
            </div>
          </header>

          @if (loading()) {
            <app-skeleton message="Chargement de l'inventaire…" [lines]="5" />
          } @else if (!items().length) {
            <app-empty-state
              title="Aucun article en stock"
              icon="ST"
              description="Créez un article avec le formulaire à gauche."
            />
          } @else {
            @if (filteredItems().length > visibleRows) {
              <p class="feature-scroll-hint table-hint">5 visibles · défilez</p>
            }
            <div class="feature-scroll-table" role="table" aria-label="Inventaire">
              <div class="feature-scroll-cols head stock-cols" role="row">
                <span role="columnheader">SKU</span>
                <span role="columnheader">Qté</span>
                <span role="columnheader">Statut</span>
                <span role="columnheader" class="feature-col-actions">·</span>
              </div>
              <div
                class="feature-scroll-body"
                role="rowgroup"
                [style.max-height.rem]="visibleRows * rowHeightRem"
              >
                @for (i of filteredItems(); track i.id) {
                  <div
                    class="feature-scroll-cols row stock-cols"
                    role="row"
                    [class.row-low]="i.quantity <= i.reorderLevel"
                  >
                    <span class="feature-cell feature-cell-primary" role="cell" [title]="i.name">
                      {{ i.sku }}
                      <span class="cell-sub">{{ i.name }}</span>
                    </span>
                    <span class="feature-cell" role="cell" [title]="'Seuil: ' + i.reorderLevel + ' · ' + (i.location || '—')">
                      {{ i.quantity }}
                    </span>
                    <span role="cell"><app-status-badge [status]="i.status" /></span>
                    <span class="feature-row-actions feature-col-actions" role="cell">
                      <button type="button" class="btn btn-ghost btn-sm" (click)="adjust(i, 'PURCHASE', 10)">+10</button>
                      <button type="button" class="btn btn-ghost btn-sm" (click)="adjust(i, 'CONSUME', 1)">−1</button>
                      <button type="button" class="btn btn-danger btn-sm" (click)="remove(i)">×</button>
                    </span>
                  </div>
                } @empty {
                  <p class="feature-empty-filter">Aucun résultat</p>
                }
              </div>
            </div>
          }
        </section>
      </div>
    </div>
  `,
  styles: [`
    .error { color: var(--accent-danger); }

    .wms-pair-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--dash-inline-gap, var(--space-3));
      align-items: stretch;
    }

    .wms-half {
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .wms-half .feature-hub-head {
      margin-bottom: var(--dash-inline-gap);
      padding-bottom: var(--dash-inline-gap);
    }

    .section-toolbar {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: var(--dash-inline-gap, var(--space-3));
      padding-bottom: var(--dash-inline-gap);
      border-bottom: 1px solid var(--border-color);
    }

    .section-title {
      margin: 0;
      font-size: 1rem;
      font-weight: var(--fw-bold);
      white-space: nowrap;
    }

    .section-search {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      justify-self: center;
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
    }

    .section-search-input {
      flex: 1;
      min-width: 0;
      font-size: 0.85rem;
    }

    .section-toolbar-end {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      justify-self: end;
      white-space: nowrap;
    }

    .section-tag {
      font-size: 0.72rem;
      font-weight: var(--fw-semibold);
      color: var(--text-secondary);
    }

    .section-count {
      font-size: 0.72rem;
      color: var(--text-muted);
      padding: 0.2rem 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
    }

    .inventory-section {
      display: flex;
      flex-direction: column;
      gap: var(--dash-inline-gap, var(--space-3));
    }

    .table-hint { margin: 0; }

    .wms-form { flex: 1; }

    .embedded-form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--dash-inline-gap);
      align-items: end;
    }

    .span-2 { grid-column: 1 / -1; }
    .label {
      margin-bottom: 0;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.8rem;
    }

    .form-actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--dash-inline-gap);
      padding-top: var(--dash-inline-gap);
      border-top: 1px solid var(--border-color);
    }

    .stock-cols {
      grid-template-columns: minmax(0, 1.4fr) 52px 88px minmax(120px, auto);
    }

    .cell-sub {
      display: block;
      font-size: 0.72rem;
      color: var(--text-muted);
      font-weight: normal;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .row-low {
      background: color-mix(in srgb, var(--accent-warning) 12%, transparent);
    }

    .btn-sm { font-size: 0.72rem; padding: 0.25rem 0.45rem; min-height: auto; }

    @media (max-width: 960px) {
      .wms-pair-row { grid-template-columns: 1fr; }
      .embedded-form-grid { grid-template-columns: 1fr; }
      .section-toolbar {
        grid-template-columns: 1fr;
        gap: var(--dash-inline-gap);
      }
      .section-search { max-width: none; justify-self: stretch; }
      .section-toolbar-end { justify-self: start; flex-wrap: wrap; }
    }
`],
})
export class WmsPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);

  readonly visibleRows = VISIBLE_ROWS;
  readonly rowHeightRem = ROW_HEIGHT_REM;

  readonly loadingAgent = signal(true);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly agent = signal<Agent | null>(null);
  readonly items = signal<StockItem[]>([]);
  readonly itemQuery = signal('');

  sku = '';
  name = '';
  quantity = 0;
  reorderLevel = 10;
  location = '';

  readonly filteredItems = computed(() => {
    const q = this.itemQuery().trim().toLowerCase();
    const list = this.items();
    if (!q) return list;
    return list.filter(
      (i) =>
        i.sku.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q) ||
        (i.location ?? '').toLowerCase().includes(q) ||
        (i.status ?? '').toLowerCase().includes(q) ||
        String(i.quantity).includes(q),
    );
  });

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

  addItem(): void {
    if (!this.sku.trim() || !this.name.trim()) return;
    this.error.set('');
    this.saving.set(true);
    this.api
      .createStockItem({
        sku: this.sku.trim(),
        name: this.name.trim(),
        quantity: this.quantity,
        reorderLevel: this.reorderLevel,
        location: this.location.trim(),
        unit: 'unit',
        status: 'ACTIVE',
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.sku = this.name = this.location = '';
          this.quantity = 0;
          this.reorderLevel = 10;
          this.toast.success('Article ajouté à l\'inventaire.');
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

  adjust(item: StockItem, movementType: string, quantity: number): void {
    this.api.adjustStock(item.id, { movementType, quantity }).subscribe({
      next: () => {
        this.toast.success(
          movementType === 'PURCHASE'
            ? `Stock ${item.sku} augmenté (+${quantity})`
            : `Stock ${item.sku} diminué (−${quantity})`,
        );
        this.reload();
      },
      error: (err) => {
        const msg = mapHttpError(err);
        this.error.set(msg);
        this.toast.error(msg);
      },
    });
  }

  async remove(item: StockItem): Promise<void> {
    const ok = await this.confirmDialog.confirm({
      title: 'Supprimer l\'article',
      message: `Supprimer l'article ${item.sku} (${item.name}) ? Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    this.api.deleteStockItem(item.id).subscribe({
      next: () => {
        this.toast.success('Article supprimé.');
        this.reload();
      },
      error: (err) => {
        const msg = mapHttpError(err);
        this.error.set(msg);
        this.toast.error(msg);
      },
    });
  }

  private reload(): void {
    this.loading.set(true);
    this.api.getStockItems().subscribe({
      next: (data) => {
        this.items.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
