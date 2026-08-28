import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../../core/api/api.service';
import { Agent } from '../../core/api/api.models';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { FeaturePageHeaderComponent } from '../../shared/ui/feature-page-header/feature-page-header.component';
import { FeatureAgentHostComponent } from '../../shared/ui/feature-agent-host/feature-agent-host.component';

const VISIBLE_ROWS = 5;
const ROW_HEIGHT_REM = 2.85;

@Component({
  selector: 'app-administration-page',
  imports: [
    FeaturePageHeaderComponent,
    LoadingStateComponent,
    EmptyStateComponent,
    FeatureAgentHostComponent,
  ],
  template: `
    <div class="page feature-module-page">
      <app-feature-page-header
        group="Gestion"
        title="Administration"
        backLabel="← AI Office Administration"
        [backQueryParams]="{ agent: 'erp' }"
      />

      <app-feature-agent-host
        [agent]="agent()"
        [loading]="loadingAgent()"
        officeQuery="erp"
        [sectionLabel]="'Agent dédié Administration'"
        officeLinkLabel="Administration"
      />

      <section class="feature-hub card">
        <header class="feature-hub-head">
          <h2 class="feature-hub-title">Documents</h2>
          <span class="feature-hub-sub">Référentiel documentaire ERP</span>
          <span class="feature-hub-count">{{ rows().length }} document(s)</span>
        </header>

        @if (loadingDocs()) {
          <app-loading-state />
        } @else if (!rows().length) {
          <app-empty-state title="Aucun document" icon="DOC" />
        } @else {
          <div class="feature-list-toolbar">
            <div class="feature-list-meta">
              <span class="feature-meta-count">{{ rows().length }} document(s)</span>
              @if (rows().length > visibleRows) {
                <span class="feature-scroll-hint">5 visibles · défilez pour voir la suite</span>
              }
            </div>
          </div>

          <div class="feature-scroll-table" role="table" aria-label="Liste des documents">
            <div class="feature-scroll-cols head doc-cols" role="row">
              <span role="columnheader">Titre</span>
              <span role="columnheader">Catégorie</span>
              <span role="columnheader">Statut</span>
              <span role="columnheader">Contenu</span>
            </div>
            <div
              class="feature-scroll-body"
              role="rowgroup"
              [style.max-height.rem]="visibleRows * rowHeightRem"
            >
              @for (row of rows(); track row['id'] ?? row['title']) {
                <div class="feature-scroll-cols row doc-cols" role="row">
                  <span class="feature-cell feature-cell-primary" role="cell">{{ row['title'] }}</span>
                  <span class="feature-cell feature-cell-muted" role="cell">{{ row['category'] }}</span>
                  <span class="feature-cell" role="cell">{{ row['status'] }}</span>
                  <span class="feature-cell feature-cell-muted" role="cell">{{ row['content'] }}</span>
                </div>
              }
            </div>
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .doc-cols {
      grid-template-columns: minmax(120px, 1.4fr) minmax(100px, 1fr) 100px minmax(140px, 1.6fr);
    }
  `],
})
export class AdministrationPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly visibleRows = VISIBLE_ROWS;
  readonly rowHeightRem = ROW_HEIGHT_REM;
  readonly loadingAgent = signal(true);
  readonly loadingDocs = signal(true);
  readonly agent = signal<Agent | null>(null);
  readonly rows = signal<Record<string, unknown>[]>([]);

  ngOnInit(): void {
    this.api.getAgents().subscribe({
      next: (agents) => {
        this.agent.set(agents.find((a) => a.code === 'ERP') ?? null);
        this.loadingAgent.set(false);
      },
      error: () => this.loadingAgent.set(false),
    });
    this.api.getDocuments().subscribe({
      next: (data) => {
        this.rows.set(data as unknown as Record<string, unknown>[]);
        this.loadingDocs.set(false);
      },
      error: () => this.loadingDocs.set(false),
    });
  }
}
