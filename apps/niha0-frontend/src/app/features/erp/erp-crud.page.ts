import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { Agent, ErpItem } from '../../core/api/api.models';
import { DATA_LIBRARIES } from '../../core/workspace/workspace-catalog';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { FeaturePageHeaderComponent } from '../../shared/ui/feature-page-header/feature-page-header.component';
import { FeatureAgentHostComponent } from '../../shared/ui/feature-agent-host/feature-agent-host.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { mapHttpError } from '../../core/api/http-error.util';
import { statusLabel } from '../../shared/ui/status-labels';
import {
  buildErpDetails,
  erpListHint,
  getErpModuleConfig,
  parseErpDetails,
} from './erp-module.config';
import { exportErpItemsCsv, exportErpItemsJson } from '../data/data-module.utils';

const VISIBLE_ROWS = 6;
const ROW_HEIGHT_REM = 2.85;

@Component({
  selector: 'app-erp-crud-page',
  imports: [
    FormsModule,
    RouterLink,
    DatePipe,
    EmptyStateComponent,
    FeaturePageHeaderComponent,
    FeatureAgentHostComponent,
    SkeletonComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="page feature-module-page data-module-page" [style.--data-accent]="cfg.accent ?? 'var(--accent-primary)'">
      <app-feature-page-header
        group="Données"
        [title]="cfg.title"
        [code]="cfg.libraryId ?? cfg.module"
        [backLabel]="'← AI Office ' + cfg.title"
        [backQueryParams]="officeBackParams"
      >
        <div actions>
          <a routerLink="/app/data-hub" class="btn btn-ghost">Centre Données</a>
          <a routerLink="/app/ai-office" [queryParams]="aiOfficeLibraryParams" class="btn btn-primary">Vue 3D</a>
        </div>
      </app-feature-page-header>

      <nav class="data-nav-rail" aria-label="Bibliothèques Données">
        <a routerLink="/app/data-hub" class="data-nav-item hub">◎ Hub</a>
        @for (lib of dataLibraries; track lib.id) {
          <a
            [routerLink]="lib.route"
            class="data-nav-item"
            [class.active]="lib.route === currentRoute"
            [style.--lib-accent]="lib.accent"
          >{{ lib.label }}</a>
        }
      </nav>

      <header class="data-command">
        <div class="command-accent-bar" aria-hidden="true"></div>
        <div class="command-body">
          <h2 class="command-title">{{ cfg.listToolbarTag ?? cfg.listSubtitle }}</h2>
          <p class="command-sub">{{ cfg.callout }}</p>
          <div class="command-stats">
            <div class="stat-pill"><span class="stat-val">{{ items().length }}</span><span class="stat-lbl">Total</span></div>
            <div class="stat-pill"><span class="stat-val">{{ activeCount() }}</span><span class="stat-lbl">{{ cfg.kpiActiveLabel }}</span></div>
            <div class="stat-pill warn"><span class="stat-val">{{ pendingCount() }}</span><span class="stat-lbl">{{ cfg.kpiPendingLabel }}</span></div>
            <div class="stat-pill"><span class="stat-val">{{ filteredItems().length }}</span><span class="stat-lbl">Affichés</span></div>
          </div>
        </div>
      </header>

      <app-feature-agent-host
        [agent]="agent()"
        [loading]="loadingAgent()"
        [officeQuery]="cfg.officeQuery"
        [sectionLabel]="'Agent dédié ' + cfg.title"
        [officeLinkLabel]="cfg.title"
      />

      @if (error()) {
        <p class="error-banner" role="alert">{{ error() }}</p>
      }

      <div class="data-pair-row">
        <section class="feature-hub card data-half">
          <header class="data-list-toolbar compact-toolbar">
            <h2 class="section-title">{{ editingId() ? 'Modifier' : cfg.formTitle }}</h2>
            <span class="section-search-spacer"></span>
            <span class="section-tag">{{ cfg.formSubtitle }}</span>
          </header>

          <form class="erp-form" (ngSubmit)="save()">
            <div class="embedded-form-grid">
              <label class="label">
                {{ cfg.codeLabel }}
                <input class="input" name="code" [(ngModel)]="code" required maxlength="64" [placeholder]="cfg.codePlaceholder" [readonly]="!!editingId()" />
              </label>
              <label class="label">
                {{ cfg.titleLabel }}
                <input class="input" name="title" [(ngModel)]="title" required maxlength="200" [placeholder]="cfg.titlePlaceholder" />
              </label>
              <label class="label span-2">
                Statut
                <select class="input" name="itemStatus" [(ngModel)]="itemStatus">
                  @for (opt of cfg.statusOptions; track opt.value) {
                    <option [value]="opt.value">{{ opt.label }}</option>
                  }
                </select>
              </label>
              @for (field of cfg.fields; track field.key) {
                <label class="label" [class.span-2]="field.span === 2">
                  {{ field.label }}
                  @if (field.type === 'select') {
                    <select class="input" [name]="field.key" [(ngModel)]="fieldValues[field.key]">
                      <option value="">—</option>
                      @for (opt of field.options ?? []; track opt.value) {
                        <option [value]="opt.value">{{ opt.label }}</option>
                      }
                    </select>
                  } @else if (field.type === 'textarea') {
                    <textarea class="input" [name]="field.key" rows="2" [(ngModel)]="fieldValues[field.key]" [placeholder]="field.placeholder ?? ''" [maxlength]="field.maxlength ?? 2000"></textarea>
                  } @else {
                    <input class="input" [type]="field.type" [name]="field.key" [(ngModel)]="fieldValues[field.key]" [placeholder]="field.placeholder ?? ''" [attr.maxlength]="field.maxlength ?? null" [required]="field.required ?? false" />
                  }
                </label>
              }
              <div class="form-actions span-2">
                <button type="submit" class="btn btn-primary" [disabled]="saving() || !code.trim() || !title.trim()">
                  {{ saving() ? '…' : editingId() ? 'Mettre à jour' : 'Créer' }}
                </button>
                @if (editingId()) {
                  <button type="button" class="btn btn-ghost" (click)="cancelEdit()">Annuler</button>
                } @else {
                  <button type="button" class="btn btn-ghost" (click)="resetForm()">Effacer</button>
                }
              </div>
            </div>
          </form>
        </section>

        <section class="feature-hub card data-half list-section">
          <header class="data-list-toolbar" role="toolbar" [attr.aria-label]="cfg.listTitle">
            <h2 class="section-title">{{ cfg.listTitle }}</h2>
            <label class="section-search">
              <span class="feature-search-icon" aria-hidden="true">⌕</span>
              <span class="sr-only">Rechercher</span>
              <input class="input feature-search-input section-search-input" type="search" [placeholder]="'Rechercher…'" [ngModel]="query()" (ngModelChange)="query.set($event)" />
            </label>
            <div class="section-toolbar-end">
              <button type="button" class="btn btn-ghost btn-sm" (click)="reload()" title="Actualiser">↻</button>
              <button type="button" class="btn btn-ghost btn-sm" (click)="exportCsv()" [disabled]="!filteredItems().length">CSV</button>
              <span class="section-tag">{{ cfg.listToolbarTag ?? cfg.listSubtitle }}</span>
              <span class="section-count">{{ filteredItems().length }}/{{ items().length }}</span>
            </div>
          </header>

          <div class="filter-chip-row" role="group" aria-label="Filtrer par statut">
            <button type="button" class="filter-chip" [class.active]="!statusFilter()" (click)="statusFilter.set('')">Tous</button>
            @for (opt of cfg.statusOptions; track opt.value) {
              <button type="button" class="filter-chip" [class.active]="statusFilter() === opt.value" (click)="statusFilter.set(opt.value)">
                {{ opt.label }}
                <span class="chip-count">{{ statusCount(opt.value) }}</span>
              </button>
            }
          </div>

          @if (loading()) {
            <app-skeleton [message]="'Chargement ' + cfg.listTitle.toLowerCase() + '…'" [lines]="5" />
          } @else if (!items().length) {
            <app-empty-state [title]="cfg.emptyTitle" [icon]="cfg.emptyIcon" [description]="cfg.emptyDescription" />
          } @else {
            <div class="list-detail-row">
              <div class="list-pane">
                @if (filteredItems().length > visibleRows) {
                  <p class="feature-scroll-hint table-hint">{{ visibleRows }} visibles · défilez</p>
                }
                <div class="feature-scroll-table" role="table">
                  <div class="feature-scroll-cols head erp-cols" role="row">
                    <span role="columnheader">{{ cfg.codeLabel }}</span>
                    <span role="columnheader">Statut</span>
                    <span role="columnheader" class="feature-col-actions">·</span>
                  </div>
                  <div class="feature-scroll-body" role="rowgroup" [style.max-height.rem]="visibleRows * rowHeightRem">
                    @for (it of filteredItems(); track it.id) {
                      <button
                        type="button"
                        class="feature-scroll-cols row erp-cols data-row"
                        [class.active]="selectedId() === it.id"
                        [class.editing]="editingId() === it.id"
                        (click)="selectItem(it)"
                      >
                        <span class="feature-cell feature-cell-primary" role="cell">
                          {{ it.code }}
                          <span class="cell-sub">{{ it.title }}</span>
                          @if (listHint(it); as hint) {
                            <span class="cell-hint">{{ hint }}</span>
                          }
                        </span>
                        <span role="cell"><app-status-badge [status]="it.status" /></span>
                        <span class="feature-row-actions feature-col-actions" role="cell" (click)="$event.stopPropagation()">
                          <button type="button" class="btn btn-ghost btn-sm" (click)="edit(it)">Éditer</button>
                          <button type="button" class="btn btn-ghost btn-sm" (click)="cycleStatus(it)">↻</button>
                        </span>
                      </button>
                    } @empty {
                      <p class="feature-empty-filter">Aucun résultat</p>
                    }
                  </div>
                </div>
              </div>

              <aside class="detail-pane">
                @if (!selectedItem()) {
                  <app-empty-state title="Sélectionnez un élément" icon="DT" description="Cliquez sur une ligne pour voir le détail et agir." />
                } @else {
                  <h3 class="detail-title">{{ selectedItem()!.title }}</h3>
                  <p class="detail-code">{{ selectedItem()!.code }}</p>
                  <app-status-badge [status]="selectedItem()!.status" />
                  <dl class="detail-grid">
                    @for (field of cfg.fields; track field.key) {
                      @if (detailValues()[field.key]) {
                        <dt>{{ field.label }}</dt>
                        <dd>{{ detailValues()[field.key] }}</dd>
                      }
                    }
                    @if (selectedItem()!.updatedAt) {
                      <dt>Mis à jour</dt>
                      <dd>{{ selectedItem()!.updatedAt | date: 'medium' }}</dd>
                    }
                  </dl>
                  <div class="detail-actions">
                    <button type="button" class="btn btn-primary btn-sm" (click)="edit(selectedItem()!)">Éditer</button>
                    <button type="button" class="btn btn-ghost btn-sm" (click)="duplicate(selectedItem()!)">Dupliquer</button>
                    <button type="button" class="btn btn-ghost btn-sm danger" (click)="remove(selectedItem()!)">Supprimer</button>
                  </div>
                }
              </aside>
            </div>
          }
        </section>
      </div>
    </div>
  `,
  styles: [`
    .data-module-page { --data-accent: var(--accent-primary); }
    .data-nav-rail {
      display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: var(--dash-inline-gap);
      padding: 0.35rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-elevated);
    }
    .data-nav-item {
      padding: 0.3rem 0.55rem; border-radius: var(--radius-sm); font-size: 0.68rem; font-weight: 650;
      text-decoration: none; color: var(--text-secondary); border: 1px solid transparent;
    }
    .data-nav-item:hover { background: var(--bg-hover); color: var(--text-primary); text-decoration: none; }
    .data-nav-item.active {
      background: color-mix(in srgb, var(--lib-accent, var(--data-accent)) 14%, transparent);
      border-color: color-mix(in srgb, var(--lib-accent, var(--data-accent)) 40%, var(--border-color));
      color: var(--lib-accent, var(--data-accent));
    }
    .data-nav-item.hub { color: var(--accent-primary); }

    .data-command {
      display: flex; gap: 0; margin-bottom: var(--dash-inline-gap);
      border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden;
      background: var(--bg-elevated);
    }
    .command-accent-bar { width: 4px; flex-shrink: 0; background: var(--data-accent); }
    .command-body { padding: var(--dash-band-gap); flex: 1; min-width: 0; }
    .command-title { margin: 0 0 0.3rem; font-size: 1rem; }
    .command-sub { margin: 0 0 0.6rem; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.45; max-width: 48rem; }
    .command-stats { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .stat-pill {
      display: flex; align-items: baseline; gap: 0.35rem; padding: 0.35rem 0.55rem;
      border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-primary);
    }
    .stat-pill.warn .stat-val { color: var(--accent-warning); }
    .stat-val { font-weight: var(--fw-bold); color: var(--data-accent); font-size: 0.95rem; }
    .stat-lbl { font-size: 0.62rem; color: var(--text-muted); text-transform: uppercase; }

    .error-banner {
      margin-bottom: var(--dash-inline-gap); padding: 0.6rem 0.85rem; border-radius: var(--radius-md);
      border: 1px solid color-mix(in srgb, var(--accent-danger) 40%, transparent);
      background: color-mix(in srgb, var(--accent-danger) 10%, transparent); color: var(--accent-danger); font-size: 0.85rem;
    }

    .data-pair-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); gap: var(--dash-inline-gap); align-items: start; }
    .data-half { min-width: 0; display: flex; flex-direction: column; }
    .compact-toolbar { margin-bottom: 0.65rem; padding-bottom: 0.65rem; }

    .filter-chip-row { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: var(--dash-inline-gap); }
    .filter-chip {
      display: inline-flex; align-items: center; gap: 0.3rem;
      border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-secondary);
      border-radius: 999px; padding: 0.25rem 0.55rem; font-size: 0.68rem; font-weight: 600; cursor: pointer;
    }
    .filter-chip.active { background: color-mix(in srgb, var(--data-accent) 14%, transparent); border-color: var(--data-accent); color: var(--data-accent); }
    .chip-count { font-size: 0.62rem; opacity: 0.85; }

    .list-detail-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(200px, 0.75fr); gap: var(--dash-inline-gap); align-items: start; }
    .list-pane { min-width: 0; }
    .detail-pane {
      border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.75rem;
      background: var(--bg-primary); min-height: 10rem;
    }
    .detail-title { margin: 0 0 0.2rem; font-size: 0.92rem; }
    .detail-code { margin: 0 0 0.5rem; font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono, monospace); }
    .detail-grid { display: grid; grid-template-columns: auto 1fr; gap: 0.35rem 0.65rem; margin: 0.75rem 0; font-size: 0.78rem; }
    .detail-grid dt { color: var(--text-muted); font-size: 0.68rem; text-transform: uppercase; }
    .detail-grid dd { margin: 0; }
    .detail-actions { display: flex; flex-wrap: wrap; gap: 0.35rem; }

    .embedded-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--dash-inline-gap); align-items: end; }
    .span-2 { grid-column: 1 / -1; }
    .label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.8rem; margin: 0; }
    .form-actions { display: flex; flex-wrap: wrap; gap: var(--dash-inline-gap); padding-top: var(--dash-inline-gap); border-top: 1px solid var(--border-color); }

    .erp-cols { grid-template-columns: minmax(0, 1.5fr) 100px minmax(110px, auto); }
    .data-row {
      width: 100%; border: none; background: transparent; text-align: left; cursor: pointer; color: inherit;
      border-bottom: 1px solid color-mix(in srgb, var(--border-color) 55%, transparent);
    }
    .data-row:hover { background: var(--bg-hover); }
    .data-row.active, .data-row.editing { background: color-mix(in srgb, var(--data-accent) 10%, transparent); box-shadow: inset 3px 0 0 var(--data-accent); }
    .cell-sub { display: block; font-size: 0.72rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cell-hint { display: block; font-size: 0.68rem; color: var(--text-muted); opacity: 0.85; }
    .table-hint { margin: 0 0 0.35rem; }
    .btn-sm { font-size: 0.72rem; padding: 0.25rem 0.45rem; min-height: auto; }
    .danger { color: var(--accent-danger); }

    @media (max-width: 1100px) {
      .data-pair-row { grid-template-columns: 1fr; }
      .list-detail-row { grid-template-columns: 1fr; }
    }
    @media (max-width: 960px) { .embedded-form-grid { grid-template-columns: 1fr; } }
  `],
})
export class ErpCrudPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmDialogService);

  readonly module = (this.route.snapshot.data['erpModule'] as string) || 'CMS';
  readonly cfg = getErpModuleConfig(this.module);
  readonly dataLibraries = DATA_LIBRARIES;
  readonly currentRoute = `/app/${this.module.toLowerCase()}`;
  readonly visibleRows = VISIBLE_ROWS;
  readonly rowHeightRem = ROW_HEIGHT_REM;

  get officeBackParams(): Record<string, string> | null {
    const params: Record<string, string> = {};
    if (this.cfg.officeQuery) params['agent'] = this.cfg.officeQuery;
    if (this.cfg.libraryId) params['library'] = this.cfg.libraryId;
    return Object.keys(params).length ? params : null;
  }

  get aiOfficeLibraryParams(): Record<string, string> | null {
    return this.cfg.libraryId ? { library: this.cfg.libraryId } : null;
  }

  readonly loadingAgent = signal(true);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly agent = signal<Agent | null>(null);
  readonly items = signal<ErpItem[]>([]);
  readonly editingId = signal<string | null>(null);
  readonly selectedId = signal<string | null>(null);
  readonly query = signal('');
  readonly statusFilter = signal('');

  code = '';
  title = '';
  itemStatus = this.cfg.defaultStatus;
  fieldValues: Record<string, string> = {};

  readonly activeCount = computed(() => this.items().filter((i) => this.cfg.activeStatuses.includes(i.status)).length);
  readonly pendingCount = computed(() => this.items().filter((i) => this.cfg.pendingStatuses.includes(i.status)).length);

  readonly filteredItems = computed(() => {
    const q = this.query().trim().toLowerCase();
    const status = this.statusFilter();
    let list = this.items();
    if (status) list = list.filter((i) => i.status === status);
    if (!q) return list;
    return list.filter((i) => {
      const hint = erpListHint(i, this.cfg.fields).toLowerCase();
      return (
        i.code.toLowerCase().includes(q) ||
        i.title.toLowerCase().includes(q) ||
        (i.status ?? '').toLowerCase().includes(q) ||
        hint.includes(q) ||
        (i.detailsJson ?? '').toLowerCase().includes(q)
      );
    });
  });

  readonly selectedItem = computed(() => {
    const id = this.selectedId();
    return id ? this.items().find((i) => i.id === id) ?? null : null;
  });

  readonly detailValues = computed(() => {
    const item = this.selectedItem();
    return item ? parseErpDetails(item.detailsJson) : {};
  });

  ngOnInit(): void {
    this.resetFieldValues();
    this.api.getAgents().subscribe({
      next: (agents) => {
        this.agent.set(agents.find((a) => a.code === this.cfg.agentCode) ?? null);
        this.loadingAgent.set(false);
      },
      error: () => this.loadingAgent.set(false),
    });
    this.reload();
  }

  statusCount(status: string): number {
    return this.items().filter((i) => i.status === status).length;
  }

  listHint(item: ErpItem): string {
    return erpListHint(item, this.cfg.fields);
  }

  selectItem(it: ErpItem): void {
    this.selectedId.set(it.id);
  }

  edit(it: ErpItem): void {
    this.editingId.set(it.id);
    this.selectedId.set(it.id);
    this.code = it.code;
    this.title = it.title;
    this.itemStatus = it.status || this.cfg.defaultStatus;
    const details = parseErpDetails(it.detailsJson);
    this.resetFieldValues();
    for (const f of this.cfg.fields) {
      this.fieldValues[f.key] = details[f.key] ?? '';
    }
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.resetForm();
  }

  resetForm(): void {
    this.code = '';
    this.title = '';
    this.itemStatus = this.cfg.defaultStatus;
    this.resetFieldValues();
  }

  duplicate(it: ErpItem): void {
    this.editingId.set(null);
    this.code = `${it.code}-copy`.slice(0, 64);
    this.title = `${it.title} (copie)`;
    this.itemStatus = this.cfg.defaultStatus;
    const details = parseErpDetails(it.detailsJson);
    this.resetFieldValues();
    for (const f of this.cfg.fields) {
      this.fieldValues[f.key] = details[f.key] ?? '';
    }
    this.toast.success('Copie chargée dans le formulaire — enregistrez pour créer.');
  }

  save(): void {
    if (!this.code.trim() || !this.title.trim()) return;
    this.saving.set(true);
    this.error.set('');
    const body: Partial<ErpItem> = {
      code: this.code.trim(),
      title: this.title.trim(),
      status: this.itemStatus,
      detailsJson: buildErpDetails(this.cfg.fields, this.fieldValues) || undefined,
    };
    const id = this.editingId();
    const req = id ? this.api.updateErpItem(this.module, id, body) : this.api.createErpItem(this.module, body);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(id ? 'Élément mis à jour.' : 'Élément créé.');
        this.cancelEdit();
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

  cycleStatus(it: ErpItem): void {
    const opts = this.cfg.statusOptions;
    const idx = opts.findIndex((o) => o.value === it.status);
    const next = opts[(idx + 1) % opts.length]?.value ?? opts[0]!.value;
    this.api.updateErpItem(this.module, it.id, { ...it, status: next }).subscribe({
      next: () => {
        this.toast.success(`Statut → ${statusLabel(next)}`);
        this.reload();
      },
      error: (err) => this.toast.error(mapHttpError(err)),
    });
  }

  exportCsv(): void {
    exportErpItemsCsv(this.filteredItems(), this.module, this.cfg.fields);
    this.toast.success('Export CSV généré.');
  }

  async remove(it: ErpItem): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Supprimer',
      message: `Supprimer « ${it.title} » (${it.code}) ?`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    this.api.deleteErpItem(this.module, it.id).subscribe({
      next: () => {
        if (this.editingId() === it.id) this.cancelEdit();
        if (this.selectedId() === it.id) this.selectedId.set(null);
        this.toast.success('Élément supprimé.');
        this.reload();
      },
      error: (err) => this.toast.error(mapHttpError(err)),
    });
  }

  reload(): void {
    this.loading.set(true);
    this.api.listErpItems(this.module).subscribe({
      next: (data) => {
        this.items.set(data);
        this.loading.set(false);
        if (this.selectedId() && !data.some((i) => i.id === this.selectedId())) {
          this.selectedId.set(null);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(mapHttpError(err));
      },
    });
  }

  private resetFieldValues(): void {
    this.fieldValues = {};
    for (const f of this.cfg.fields) {
      this.fieldValues[f.key] = '';
    }
  }
}
