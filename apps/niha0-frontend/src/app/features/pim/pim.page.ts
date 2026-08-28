import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Agent, PimProduct, PimVariant } from '../../core/api/api.models';
import { DATA_LIBRARIES } from '../../core/workspace/workspace-catalog';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { FeaturePageHeaderComponent } from '../../shared/ui/feature-page-header/feature-page-header.component';
import { FeatureAgentHostComponent } from '../../shared/ui/feature-agent-host/feature-agent-host.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { mapHttpError } from '../../core/api/http-error.util';
import { downloadTextFile } from '../data/data-module.utils';

const VISIBLE_ROWS = 6;
const ROW_HEIGHT_REM = 2.85;
const PIM_ACCENT = '#FB923C';

@Component({
  selector: 'app-pim-page',
  imports: [
    FormsModule,
    RouterLink,
    EmptyStateComponent,
    FeaturePageHeaderComponent,
    FeatureAgentHostComponent,
    SkeletonComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="page feature-module-page data-module-page" [style.--data-accent]="pimAccent">
      <app-feature-page-header
        group="Données"
        title="PIM"
        code="PIPIM"
        backLabel="← AI Office PIM"
        [backQueryParams]="{ agent: 'stock', library: 'PIPIM' }"
      >
        <div actions>
          <a routerLink="/app/data-hub" class="btn btn-ghost">Centre Données</a>
          <a routerLink="/app/ai-office" [queryParams]="{ library: 'PIPIM' }" class="btn btn-primary">Vue 3D</a>
        </div>
      </app-feature-page-header>

      <nav class="data-nav-rail" aria-label="Bibliothèques Données">
        <a routerLink="/app/data-hub" class="data-nav-item hub">◎ Hub</a>
        @for (lib of dataLibraries; track lib.id) {
          <a [routerLink]="lib.route" class="data-nav-item" [class.active]="lib.id === 'PIPIM'" [style.--lib-accent]="lib.accent">{{ lib.label }}</a>
        }
      </nav>

      <header class="data-command">
        <div class="command-accent-bar"></div>
        <div class="command-body">
          <h2 class="command-title">Référentiel produits et variantes</h2>
          <p class="command-sub">Product Information Management — catalogue, SKU, catégories et variantes prix pour vos canaux de vente.</p>
          <div class="command-stats">
            <div class="stat-pill"><span class="stat-val">{{ products().length }}</span><span class="stat-lbl">Produits</span></div>
            <div class="stat-pill"><span class="stat-val">{{ activeCount() }}</span><span class="stat-lbl">Actifs</span></div>
            <div class="stat-pill warn"><span class="stat-val">{{ draftCount() }}</span><span class="stat-lbl">Brouillons</span></div>
            <div class="stat-pill"><span class="stat-val">{{ variantTotal() }}</span><span class="stat-lbl">Variantes</span></div>
          </div>
        </div>
      </header>

      <app-feature-agent-host [agent]="agent()" [loading]="loadingAgent()" officeQuery="stock" sectionLabel="Agent dédié PIM" officeLinkLabel="PIM" />

      @if (error()) {
        <p class="error-banner" role="alert">{{ error() }}</p>
      }

      <div class="data-pair-row">
        <section class="feature-hub card data-half">
          <header class="data-list-toolbar compact-toolbar">
            <h2 class="section-title">Nouveau produit</h2>
            <span class="section-search-spacer"></span>
            <span class="section-tag">Catalogue</span>
          </header>
          <form class="pim-form" (ngSubmit)="addProduct()">
            <div class="embedded-form-grid">
              <label class="label">SKU <input class="input" name="sku" [(ngModel)]="sku" required maxlength="64" /></label>
              <label class="label">Nom <input class="input" name="name" [(ngModel)]="name" required maxlength="160" /></label>
              <label class="label span-2">Catégorie <input class="input" name="category" [(ngModel)]="category" maxlength="120" /></label>
              <label class="label span-2">Description <textarea class="input" name="description" rows="2" [(ngModel)]="description" maxlength="2000"></textarea></label>
              <div class="form-actions span-2">
                <button type="submit" class="btn btn-primary" [disabled]="saving() || !sku.trim() || !name.trim()">{{ saving() ? '…' : 'Créer le produit' }}</button>
                <button type="button" class="btn btn-ghost" (click)="clearForm()">Effacer</button>
              </div>
            </div>
          </form>
        </section>

        <section class="feature-hub card data-half">
          <header class="data-list-toolbar">
            <h2 class="section-title">Produits</h2>
            <label class="section-search">
              <span class="feature-search-icon" aria-hidden="true">⌕</span>
              <input class="input feature-search-input section-search-input" type="search" placeholder="SKU, nom, catégorie…" [ngModel]="productQuery()" (ngModelChange)="productQuery.set($event)" />
            </label>
            <div class="section-toolbar-end">
              <button type="button" class="btn btn-ghost btn-sm" (click)="reload()">↻</button>
              <button type="button" class="btn btn-ghost btn-sm" (click)="exportCsv()" [disabled]="!filteredProducts().length">CSV</button>
              <span class="section-tag">Référentiel produits</span>
              <span class="section-count">{{ filteredProducts().length }}/{{ products().length }}</span>
            </div>
          </header>

          <div class="filter-chip-row">
            <button type="button" class="filter-chip" [class.active]="!statusFilter()" (click)="statusFilter.set('')">Tous</button>
            <button type="button" class="filter-chip" [class.active]="statusFilter() === 'ACTIVE'" (click)="statusFilter.set('ACTIVE')">Actifs <span class="chip-count">{{ activeCount() }}</span></button>
            <button type="button" class="filter-chip" [class.active]="statusFilter() === 'DRAFT'" (click)="statusFilter.set('DRAFT')">Brouillons <span class="chip-count">{{ draftCount() }}</span></button>
          </div>
          @if (categories().length > 1) {
            <div class="filter-chip-row">
              <button type="button" class="filter-chip" [class.active]="!categoryFilter()" (click)="categoryFilter.set('')">Toutes cat.</button>
              @for (c of categories(); track c) {
                <button type="button" class="filter-chip" [class.active]="categoryFilter() === c" (click)="categoryFilter.set(c)">{{ c }}</button>
              }
            </div>
          }

          @if (loading()) {
            <app-skeleton message="Chargement des produits…" [lines]="5" />
          } @else if (!products().length) {
            <app-empty-state title="Aucun produit" icon="PI" description="Créez un produit avec le formulaire à gauche." />
          } @else {
            <div class="feature-scroll-table" role="table">
              <div class="feature-scroll-cols head product-cols" role="row">
                <span role="columnheader">SKU</span>
                <span role="columnheader">Catégorie</span>
                <span role="columnheader">Statut</span>
                <span role="columnheader" class="feature-col-actions">·</span>
              </div>
              <div class="feature-scroll-body" role="rowgroup" [style.max-height.rem]="visibleRows * rowHeightRem">
                @for (p of filteredProducts(); track p.id) {
                  <button type="button" class="feature-scroll-cols row product-cols data-row" [class.active]="selected()?.id === p.id" (click)="select(p)">
                    <span class="feature-cell feature-cell-primary" role="cell">{{ p.sku }}<span class="cell-sub">{{ p.name }}</span></span>
                    <span class="feature-cell feature-cell-muted" role="cell">{{ p.category || '—' }}</span>
                    <span role="cell"><app-status-badge [status]="p.status" /></span>
                    <span class="feature-row-actions feature-col-actions" role="cell" (click)="$event.stopPropagation()">
                      <button type="button" class="btn btn-ghost btn-sm" (click)="toggleStatus(p)">{{ p.status === 'ACTIVE' ? 'Brouillon' : 'Activer' }}</button>
                      <button type="button" class="btn btn-danger btn-sm" (click)="remove(p)">×</button>
                    </span>
                  </button>
                } @empty {
                  <p class="feature-empty-filter">Aucun résultat</p>
                }
              </div>
            </div>
          }
        </section>
      </div>

      @if (selected(); as sel) {
        <section class="feature-hub card variants-section">
          <header class="data-list-toolbar">
            <h2 class="section-title">Variantes — {{ sel.name }}</h2>
            <span class="section-search-spacer"></span>
            <span class="section-count">{{ variants().length }} variante(s)</span>
          </header>

          <form class="variant-form" (ngSubmit)="addVariant()">
            <div class="embedded-form-grid variant-grid">
              <label class="label">SKU variante <input class="input" name="vSku" [(ngModel)]="vSku" required maxlength="64" /></label>
              <label class="label">Nom <input class="input" name="vName" [(ngModel)]="vName" required maxlength="160" /></label>
              <label class="label">Prix (centimes) <input class="input" type="number" name="vPrice" [(ngModel)]="vPrice" min="0" /></label>
              <label class="label">Devise <input class="input" name="vCurrency" [(ngModel)]="vCurrency" maxlength="3" /></label>
              <div class="form-actions span-2">
                <button type="submit" class="btn btn-primary btn-sm" [disabled]="savingVariant() || !vSku.trim() || !vName.trim()">{{ savingVariant() ? '…' : 'Ajouter variante' }}</button>
              </div>
            </div>
          </form>

          @if (loadingVariants()) {
            <app-skeleton message="Chargement des variantes…" [lines]="4" />
          } @else if (!variants().length) {
            <app-empty-state title="Aucune variante" icon="PI" description="Ajoutez une variante pour ce produit." />
          } @else {
            <div class="feature-scroll-table" role="table">
              <div class="feature-scroll-cols head variant-cols" role="row">
                <span role="columnheader">SKU</span>
                <span role="columnheader">Nom</span>
                <span role="columnheader">Prix</span>
                <span role="columnheader">Statut</span>
              </div>
              <div class="feature-scroll-body" role="rowgroup" [style.max-height.rem]="visibleRows * rowHeightRem">
                @for (v of variants(); track v.id) {
                  <div class="feature-scroll-cols row variant-cols" role="row">
                    <span class="feature-cell feature-cell-primary" role="cell">{{ v.sku }}</span>
                    <span class="feature-cell feature-cell-muted" role="cell">{{ v.name }}</span>
                    <span class="feature-cell feature-cell-muted" role="cell">{{ (v.priceCents / 100).toFixed(2) }} {{ v.currency }}</span>
                    <span role="cell"><app-status-badge [status]="v.status" /></span>
                  </div>
                }
              </div>
            </div>
          }
        </section>
      }
    </div>
  `,
  styles: [`
    .data-module-page { --data-accent: #FB923C; }
    .data-nav-rail { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: var(--dash-inline-gap); padding: 0.35rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-elevated); }
    .data-nav-item { padding: 0.3rem 0.55rem; border-radius: var(--radius-sm); font-size: 0.68rem; font-weight: 650; text-decoration: none; color: var(--text-secondary); border: 1px solid transparent; }
    .data-nav-item:hover { background: var(--bg-hover); color: var(--text-primary); text-decoration: none; }
    .data-nav-item.active { background: color-mix(in srgb, var(--lib-accent) 14%, transparent); border-color: color-mix(in srgb, var(--lib-accent) 40%, var(--border-color)); color: var(--lib-accent); }
    .data-nav-item.hub { color: var(--accent-primary); }
    .data-command { display: flex; margin-bottom: var(--dash-inline-gap); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; background: var(--bg-elevated); }
    .command-accent-bar { width: 4px; background: var(--data-accent); }
    .command-body { padding: var(--dash-band-gap); flex: 1; }
    .command-title { margin: 0 0 0.3rem; font-size: 1rem; }
    .command-sub { margin: 0 0 0.6rem; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.45; }
    .command-stats { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .stat-pill { display: flex; align-items: baseline; gap: 0.35rem; padding: 0.35rem 0.55rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-primary); }
    .stat-pill.warn .stat-val { color: var(--accent-warning); }
    .stat-val { font-weight: var(--fw-bold); color: var(--data-accent); font-size: 0.95rem; }
    .stat-lbl { font-size: 0.62rem; color: var(--text-muted); text-transform: uppercase; }
    .error-banner { margin-bottom: var(--dash-inline-gap); padding: 0.6rem 0.85rem; border-radius: var(--radius-md); border: 1px solid color-mix(in srgb, var(--accent-danger) 40%, transparent); background: color-mix(in srgb, var(--accent-danger) 10%, transparent); color: var(--accent-danger); font-size: 0.85rem; }
    .data-pair-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--dash-inline-gap); align-items: stretch; }
    .data-half { min-width: 0; display: flex; flex-direction: column; }
    .compact-toolbar { margin-bottom: 0.65rem; padding-bottom: 0.65rem; }
    .filter-chip-row { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: var(--dash-inline-gap); }
    .filter-chip { display: inline-flex; align-items: center; gap: 0.3rem; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-secondary); border-radius: 999px; padding: 0.25rem 0.55rem; font-size: 0.68rem; font-weight: 600; cursor: pointer; }
    .filter-chip.active { background: color-mix(in srgb, var(--data-accent) 14%, transparent); border-color: var(--data-accent); color: var(--data-accent); }
    .chip-count { font-size: 0.62rem; }
    .embedded-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--dash-inline-gap); align-items: end; }
    .variant-grid { margin-bottom: var(--dash-band-gap); }
    .span-2 { grid-column: 1 / -1; }
    .label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.8rem; margin: 0; }
    .form-actions { display: flex; flex-wrap: wrap; gap: var(--dash-inline-gap); padding-top: var(--dash-inline-gap); border-top: 1px solid var(--border-color); }
    .product-cols { grid-template-columns: minmax(0, 1.4fr) minmax(72px, 0.9fr) 88px minmax(120px, auto); }
    .variant-cols { grid-template-columns: minmax(90px, 1fr) minmax(120px, 1.4fr) minmax(100px, 1fr) 100px; }
    .data-row { width: 100%; border: none; background: transparent; text-align: left; cursor: pointer; color: inherit; border-bottom: 1px solid color-mix(in srgb, var(--border-color) 55%, transparent); }
    .data-row:hover { background: var(--bg-hover); }
    .data-row.active { background: color-mix(in srgb, var(--data-accent) 10%, transparent); box-shadow: inset 3px 0 0 var(--data-accent); }
    .cell-sub { display: block; font-size: 0.72rem; color: var(--text-muted); }
    .variants-section { margin-top: var(--dash-inline-gap); }
    .btn-sm { font-size: 0.72rem; padding: 0.25rem 0.45rem; min-height: auto; }
    @media (max-width: 960px) { .data-pair-row, .embedded-form-grid { grid-template-columns: 1fr; } }
  `],
})
export class PimPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);

  readonly dataLibraries = DATA_LIBRARIES;
  readonly pimAccent = PIM_ACCENT;
  readonly visibleRows = VISIBLE_ROWS;
  readonly rowHeightRem = ROW_HEIGHT_REM;

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
  readonly productQuery = signal('');
  readonly statusFilter = signal('');
  readonly categoryFilter = signal('');
  readonly variantTotal = signal(0);

  sku = '';
  name = '';
  category = '';
  description = '';
  vSku = '';
  vName = '';
  vPrice = 0;
  vCurrency = 'EUR';

  readonly activeCount = computed(() => this.products().filter((p) => p.status === 'ACTIVE').length);
  readonly draftCount = computed(() => this.products().filter((p) => p.status === 'DRAFT').length);

  readonly categories = computed(() => {
    const set = new Set(this.products().map((p) => p.category).filter(Boolean) as string[]);
    return [...set].sort((a, b) => a.localeCompare(b, 'fr'));
  });

  readonly filteredProducts = computed(() => {
    const q = this.productQuery().trim().toLowerCase();
    const status = this.statusFilter();
    const cat = this.categoryFilter();
    return this.products().filter((p) => {
      if (status && p.status !== status) return false;
      if (cat && p.category !== cat) return false;
      if (!q) return true;
      return (
        p.sku.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.category ?? '').toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q)
      );
    });
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

  clearForm(): void {
    this.sku = this.name = this.category = this.description = '';
  }

  addProduct(): void {
    if (!this.sku.trim() || !this.name.trim()) return;
    this.error.set('');
    this.saving.set(true);
    this.api.createPimProduct({
      sku: this.sku.trim(),
      name: this.name.trim(),
      category: this.category.trim() || undefined,
      description: this.description.trim() || undefined,
      status: 'DRAFT',
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.clearForm();
        this.toast.success('Produit créé.');
        this.reload();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(mapHttpError(err));
        this.toast.error(mapHttpError(err));
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
    if (!sel || !this.vSku.trim() || !this.vName.trim()) return;
    this.savingVariant.set(true);
    this.api.createPimVariant(sel.id, {
      sku: this.vSku.trim(),
      name: this.vName.trim(),
      priceCents: Number(this.vPrice) || 0,
      currency: this.vCurrency.trim() || 'EUR',
      status: 'ACTIVE',
    }).subscribe({
      next: () => {
        this.savingVariant.set(false);
        this.vSku = this.vName = '';
        this.vPrice = 0;
        this.toast.success('Variante ajoutée.');
        this.select(sel);
        this.reload();
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

  exportCsv(): void {
    const header = 'sku,name,category,status';
    const lines = this.filteredProducts().map((p) =>
      `"${p.sku}","${p.name}","${p.category ?? ''}","${p.status}"`,
    );
    downloadTextFile([header, ...lines].join('\n'), `pim-export-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8');
    this.toast.success('Export CSV généré.');
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
        this.toast.success('Produit supprimé.');
        this.reload();
      },
      error: (err) => this.toast.error(mapHttpError(err)),
    });
  }

  reload(): void {
    this.loading.set(true);
    this.api.getPimProducts().subscribe({
      next: (data) => {
        this.products.set(data);
        this.loading.set(false);
        if (!data.length) {
          this.variantTotal.set(0);
          return;
        }
        forkJoin(data.map((p) => this.api.getPimVariants(p.id))).subscribe({
          next: (lists) => this.variantTotal.set(lists.reduce((s, v) => s + v.length, 0)),
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(mapHttpError(err));
      },
    });
  }
}
