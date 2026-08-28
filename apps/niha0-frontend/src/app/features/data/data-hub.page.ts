import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { DATA_LIBRARIES } from '../../core/workspace/workspace-catalog';
import { FeaturePageHeaderComponent } from '../../shared/ui/feature-page-header/feature-page-header.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';

interface LibraryStat {
  id: string;
  label: string;
  route: string;
  icon: string;
  description: string;
  accent: string;
  count: number;
  pending: number;
}

const ERP_PENDING: Record<string, string[]> = {
  CMS: ['DRAFT'],
  SCM: ['ORDERED'],
  MRP: ['PLANNED'],
  ETL: ['IDLE'],
  EDI: ['PENDING'],
};

@Component({
  selector: 'app-data-hub-page',
  imports: [RouterLink, FeaturePageHeaderComponent, SkeletonComponent],
  template: `
    <div class="page feature-module-page data-hub-page">
      <app-feature-page-header group="Données" title="Centre Données" backLabel="← AI Office">
        <div actions>
          <a routerLink="/app/company-data" class="btn btn-ghost">Fichiers & RAG</a>
          <a routerLink="/app/ai-office" class="btn btn-primary">Bibliothèques 3D</a>
        </div>
      </app-feature-page-header>

      <header class="data-command">
        <div class="command-meta">
          <h2 class="command-title">Bibliothèques métier Nihao</h2>
          <p class="command-sub">
            CMCMS, PIPIM, SCSC, MRMRP, ETETL, EDEDI — référentiels opérationnels synchronisés avec l'AI Office.
          </p>
          <div class="command-stats">
            <div class="stat-pill">
              <span class="stat-val">{{ totalRecords() }}</span>
              <span class="stat-lbl">Enregistrements</span>
            </div>
            <div class="stat-pill warn">
              <span class="stat-val">{{ totalPending() }}</span>
              <span class="stat-lbl">En attente</span>
            </div>
            <div class="stat-pill">
              <span class="stat-val">{{ libraries().length }}</span>
              <span class="stat-lbl">Bibliothèques</span>
            </div>
          </div>
        </div>
      </header>

      @if (loading()) {
        <app-skeleton message="Chargement des bibliothèques…" [lines]="6" />
      } @else {
        <div class="library-grid">
          @for (lib of libraries(); track lib.id) {
            <a [routerLink]="lib.route" class="library-card" [style.--lib-accent]="lib.accent">
              <header class="library-head">
                <span class="library-icon">{{ lib.icon }}</span>
                <div>
                  <h3>{{ lib.label }}</h3>
                  <p>{{ lib.description }}</p>
                </div>
              </header>
              <div class="library-metrics">
                <span class="metric"><strong>{{ lib.count }}</strong> éléments</span>
                @if (lib.pending) {
                  <span class="metric warn">{{ lib.pending }} en attente</span>
                }
              </div>
              <span class="library-cta">Ouvrir →</span>
            </a>
          }
        </div>

        <section class="feature-hub card hub-links">
          <h3 class="hub-links-title">Liens utiles</h3>
          <div class="hub-links-row">
            <a routerLink="/app/company-data" class="quick-link">Données entreprise & RAG</a>
            <a routerLink="/app/wms" class="quick-link">Stock WMS</a>
            <a routerLink="/app/etl" class="quick-link">Pipelines ETL</a>
            <a routerLink="/app/bi" class="quick-link">Analytics BI</a>
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .data-command {
      padding: var(--dash-band-gap);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      background: linear-gradient(135deg, color-mix(in srgb, var(--accent-primary) 6%, var(--bg-elevated)), var(--bg-elevated));
      margin-bottom: var(--dash-inline-gap);
    }
    .command-title { margin: 0 0 0.35rem; font-size: 1.05rem; }
    .command-sub { margin: 0 0 0.65rem; font-size: 0.82rem; color: var(--text-secondary); max-width: 42rem; }
    .command-stats { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .stat-pill {
      display: flex; flex-direction: column; gap: 0.1rem; padding: 0.4rem 0.55rem;
      border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-primary); min-width: 4.5rem;
    }
    .stat-pill.warn .stat-val { color: var(--accent-warning); }
    .stat-val { font-weight: var(--fw-bold); font-size: 0.95rem; color: var(--accent-primary); }
    .stat-lbl { font-size: 0.62rem; color: var(--text-muted); text-transform: uppercase; }

    .library-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: var(--dash-inline-gap);
      margin-bottom: var(--dash-inline-gap);
    }
    .library-card {
      display: flex; flex-direction: column; gap: 0.65rem;
      padding: var(--dash-band-gap);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      background: var(--bg-elevated);
      text-decoration: none;
      color: inherit;
      transition: border-color var(--transition), box-shadow var(--transition), transform var(--transition);
      box-shadow: var(--shadow-sm);
    }
    .library-card:hover {
      text-decoration: none;
      border-color: color-mix(in srgb, var(--lib-accent) 50%, var(--border-color));
      box-shadow: var(--shadow-md);
      transform: translateY(-1px);
    }
    .library-head { display: flex; gap: 0.65rem; align-items: flex-start; }
    .library-icon {
      width: 2.2rem; height: 2.2rem; border-radius: var(--radius-md);
      display: grid; place-items: center; font-size: 0.72rem; font-weight: 800;
      background: color-mix(in srgb, var(--lib-accent) 18%, transparent);
      color: var(--lib-accent);
      border: 1px solid color-mix(in srgb, var(--lib-accent) 35%, transparent);
      flex-shrink: 0;
    }
    .library-head h3 { margin: 0; font-size: 0.95rem; }
    .library-head p { margin: 0.25rem 0 0; font-size: 0.72rem; color: var(--text-muted); line-height: 1.4; }
    .library-metrics { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .metric { font-size: 0.72rem; color: var(--text-secondary); }
    .metric strong { color: var(--text-primary); }
    .metric.warn { color: var(--accent-warning); }
    .library-cta { font-size: 0.72rem; font-weight: 700; color: var(--lib-accent); margin-top: auto; }

    .hub-links { padding: var(--dash-band-gap); }
    .hub-links-title { margin: 0 0 0.65rem; font-size: 0.88rem; }
    .hub-links-row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .quick-link {
      padding: 0.4rem 0.65rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);
      font-size: 0.75rem; text-decoration: none; color: var(--text-secondary); background: var(--bg-primary);
    }
    .quick-link:hover { border-color: var(--accent-primary); color: var(--accent-primary); text-decoration: none; }
  `],
})
export class DataHubPage implements OnInit {
  private readonly api = inject(ApiService);

  readonly loading = signal(true);
  readonly libraries = signal<LibraryStat[]>([]);

  readonly totalRecords = signal(0);
  readonly totalPending = signal(0);

  ngOnInit(): void {
    const erpLibs = DATA_LIBRARIES.filter((l) => !l.route.endsWith('/pim'));

    forkJoin({
      erp: forkJoin(
        erpLibs.map((lib) =>
          this.api.listErpItems(lib.route.replace('/app/', '').toUpperCase()),
        ),
      ),
      pim: this.api.getPimProducts(),
    }).subscribe({
      next: ({ erp, pim }) => {
        const erpLibs = DATA_LIBRARIES.filter((l) => !l.route.endsWith('/pim'));
        const stats: LibraryStat[] = erpLibs.map((lib, i) => {
          const items = erp[i] ?? [];
          const mod = lib.route.replace('/app/', '').toUpperCase();
          const pendingStatuses = ERP_PENDING[mod] ?? [];
          const pending = items.filter((it) => pendingStatuses.includes(it.status ?? '')).length;
          return {
            id: lib.id,
            label: lib.label,
            route: lib.route,
            icon: lib.icon,
            description: lib.description,
            accent: lib.accent,
            count: items.length,
            pending,
          };
        });

        const pimLib = DATA_LIBRARIES.find((l) => l.route.endsWith('/pim'))!;
        const pimPending = pim.filter((p) => p.status === 'DRAFT').length;
        stats.push({
          id: pimLib.id,
          label: pimLib.label,
          route: pimLib.route,
          icon: pimLib.icon,
          description: pimLib.description,
          accent: pimLib.accent,
          count: pim.length,
          pending: pimPending,
        });

        this.libraries.set(stats);
        this.totalRecords.set(stats.reduce((s, l) => s + l.count, 0));
        this.totalPending.set(stats.reduce((s, l) => s + l.pending, 0));
        this.loading.set(false);
      },
      error: () => {
        this.libraries.set(
          DATA_LIBRARIES.map((lib) => ({
            id: lib.id,
            label: lib.label,
            route: lib.route,
            icon: lib.icon,
            description: lib.description,
            accent: lib.accent,
            count: 0,
            pending: 0,
          })),
        );
        this.loading.set(false);
      },
    });
  }
}
