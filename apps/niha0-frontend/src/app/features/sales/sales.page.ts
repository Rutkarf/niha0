import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api/api.service';
import { Agent, Lead, Opportunity } from '../../core/api/api.models';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { FeaturePageHeaderComponent } from '../../shared/ui/feature-page-header/feature-page-header.component';
import { FeatureAgentHostComponent } from '../../shared/ui/feature-agent-host/feature-agent-host.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { OPP_STAGE_OPTIONS } from '../../shared/ui/status-labels';
import { TenancyService } from '../../core/tenancy/tenancy.service';
import { mapHttpError } from '../../core/api/http-error.util';

const VISIBLE_ROWS = 5;
const ROW_HEIGHT_REM = 2.85;

@Component({
  selector: 'app-sales-page',
  imports: [
    FormsModule,
    EmptyStateComponent,
    FeaturePageHeaderComponent,
    FeatureAgentHostComponent,
    StatusBadgeComponent,
    SkeletonComponent,
  ],
  template: `
    <div class="page feature-module-page">
      <app-feature-page-header
        group="Espace client"
        title="Ventes"
        backLabel="← AI Office Ventes"
        [backQueryParams]="{ agent: 'sales' }"
      />

      <app-feature-agent-host
        [agent]="agent()"
        [loading]="loadingAgent()"
        officeQuery="sales"
        sectionLabel="Agent dédié Ventes"
        officeLinkLabel="Ventes"
      />

      <div class="sales-pair-row">
        <section class="feature-hub card sales-half">
          <header class="data-list-toolbar" role="toolbar" aria-label="Opportunités">
            <h2 class="section-title">Opportunités</h2>
            <label class="section-search">
              <span class="feature-search-icon" aria-hidden="true">⌕</span>
              <span class="sr-only">Rechercher</span>
              <input
                class="input feature-search-input section-search-input"
                type="search"
                placeholder="Rechercher par titre, montant, étape…"
                [ngModel]="oppQuery()"
                (ngModelChange)="oppQuery.set($event)"
              />
            </label>
            <div class="section-toolbar-end">
              <span class="section-tag">{{ tenancy.companyLabel() }} — pipeline commercial</span>
              <span class="section-count">{{ opps().length }} opp.</span>
            </div>
          </header>

          <form class="feature-form sales-embedded-form" (ngSubmit)="createOpp()">
            <p class="embedded-form-label">Nouvelle opportunité</p>
            <div class="embedded-form-grid">
              <label class="label">
                Titre
                <input class="input" [(ngModel)]="oppTitle" name="oppTitle" required />
              </label>
              <label class="label">
                Montant
                <input class="input" type="number" [(ngModel)]="oppAmount" name="oppAmount" min="0" />
              </label>
              <label class="label">
                Étape
                <select class="input" [(ngModel)]="oppStage" name="oppStage">
                  @for (opt of stageOptions; track opt.value) {
                    <option [value]="opt.value">{{ opt.label }}</option>
                  }
                </select>
              </label>
              <label class="label">
                Prob. %
                <input class="input" type="number" [(ngModel)]="oppProb" name="oppProb" min="0" max="100" />
              </label>
              <button type="submit" class="btn btn-primary btn-block" [disabled]="savingOpp() || !oppTitle.trim()">
                {{ savingOpp() ? '…' : 'Ajouter' }}
              </button>
            </div>
          </form>

          @if (loadingOpp()) {
            <app-skeleton message="Chargement du pipeline…" [lines]="5" />
          } @else if (!opps().length) {
            <app-empty-state title="Aucune opportunité" icon="OPP" description="Créez une opportunité avec le formulaire ci-dessus." />
          } @else {
            @if (filteredOpps().length > visibleRows) {
              <p class="feature-scroll-hint table-hint">5 visibles · défilez</p>
            }
            <div class="feature-scroll-table" role="table">
              <div class="feature-scroll-cols head opp-cols" role="row">
                <span role="columnheader">Opportunité</span>
                <span role="columnheader">Montant</span>
                <span role="columnheader">Prob.</span>
                <span role="columnheader" class="feature-col-actions">·</span>
              </div>
              <div class="feature-scroll-body" role="rowgroup" [style.max-height.rem]="visibleRows * rowHeightRem">
                @for (o of filteredOpps(); track o.id) {
                  <div class="feature-scroll-cols row opp-cols" role="row">
                    <span class="feature-cell feature-cell-primary" role="cell" [title]="o.title">{{ o.title }}</span>
                    <span class="feature-cell feature-cell-muted" role="cell">{{ formatAmount(o.amount) }}</span>
                    <span class="feature-cell feature-cell-muted" role="cell">{{ o.probability }}%</span>
                    <span class="feature-row-actions feature-col-actions" role="cell">
                      <select class="input stage" [ngModel]="o.stage" (ngModelChange)="changeStage(o, $event)" [title]="'Étape'">
                        @for (opt of stageOptions; track opt.value) {
                          <option [value]="opt.value">{{ opt.label }}</option>
                        }
                      </select>
                      <button type="button" class="btn btn-danger btn-sm" (click)="removeOpp(o)">×</button>
                    </span>
                  </div>
                } @empty {
                  <p class="feature-empty-filter">Aucun résultat</p>
                }
              </div>
            </div>
          }
        </section>

        <section class="feature-hub card sales-half">
          <header class="data-list-toolbar" role="toolbar" aria-label="Prospects">
            <h2 class="section-title">Prospects</h2>
            <label class="section-search">
              <span class="feature-search-icon" aria-hidden="true">⌕</span>
              <span class="sr-only">Rechercher</span>
              <input
                class="input feature-search-input section-search-input"
                type="search"
                placeholder="Rechercher par société, contact, source…"
                [ngModel]="leadQuery()"
                (ngModelChange)="leadQuery.set($event)"
              />
            </label>
            <div class="section-toolbar-end">
              <span class="section-tag">{{ tenancy.companyLabel() }} — qualification des leads</span>
              <span class="section-count">{{ leads().length }} leads</span>
            </div>
          </header>

          <form class="feature-form sales-embedded-form" (ngSubmit)="createLead()">
            <p class="embedded-form-label">Nouveau prospect</p>
            <div class="embedded-form-grid">
              <label class="label">
                Société
                <input class="input" [(ngModel)]="leadCompany" name="leadCompany" required />
              </label>
              <label class="label">
                Contact
                <input class="input" [(ngModel)]="leadContact" name="leadContact" />
              </label>
              <label class="label">
                Source
                <input class="input" [(ngModel)]="leadSource" name="leadSource" />
              </label>
              <label class="label">
                Score
                <input class="input" type="number" [(ngModel)]="leadScore" name="leadScore" min="0" max="100" />
              </label>
              <button type="submit" class="btn btn-primary btn-block" [disabled]="savingLead() || !leadCompany.trim()">
                {{ savingLead() ? '…' : 'Ajouter' }}
              </button>
            </div>
          </form>

          @if (loadingLeads()) {
            <app-skeleton message="Chargement des leads…" [lines]="5" />
          } @else if (!leads().length) {
            <app-empty-state title="Aucun prospect" icon="LED" description="Ajoutez un prospect avec le formulaire ci-dessus." />
          } @else {
            @if (filteredLeads().length > visibleRows) {
              <p class="feature-scroll-hint table-hint">5 visibles · défilez</p>
            }
            <div class="feature-scroll-table" role="table">
              <div class="feature-scroll-cols head lead-cols" role="row">
                <span role="columnheader">Société</span>
                <span role="columnheader">Statut</span>
                <span role="columnheader">Score</span>
                <span role="columnheader" class="feature-col-actions">·</span>
              </div>
              <div class="feature-scroll-body" role="rowgroup" [style.max-height.rem]="visibleRows * rowHeightRem">
                @for (l of filteredLeads(); track l.id) {
                  <div class="feature-scroll-cols row lead-cols" role="row">
                    <span class="feature-cell feature-cell-primary" role="cell" [title]="l.companyName">{{ l.companyName }}</span>
                    <span role="cell"><app-status-badge [status]="l.status" /></span>
                    <span class="feature-cell feature-cell-muted" role="cell">{{ l.score }}</span>
                    <span class="feature-row-actions feature-col-actions" role="cell">
                      <button type="button" class="btn btn-danger btn-sm" (click)="removeLead(l)">×</button>
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
    .sales-pair-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--dash-inline-gap, var(--space-3));
      align-items: start;
    }

    .sales-half {
      min-width: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: var(--dash-inline-gap, var(--space-3));
    }

    .sales-half .data-list-toolbar {
      display: grid;
      grid-template-columns: auto minmax(12rem, 1fr) minmax(0, auto);
      align-items: center;
      width: 100%;
    }

    .sales-half .section-search {
      justify-self: center;
      max-width: 28rem;
      width: 100%;
    }

    .table-hint {
      margin: 0;
    }

    .sales-half .feature-hub-head {
      margin-bottom: var(--dash-inline-gap);
      padding-bottom: var(--dash-inline-gap);
    }

    .sales-embedded-form {
      margin-bottom: var(--dash-inline-gap);
      padding-bottom: var(--dash-inline-gap);
      border-bottom: 1px solid var(--border-color);
    }

    .embedded-form-label {
      margin: 0 0 var(--dash-inline-gap);
      font-size: 0.72rem;
      font-weight: var(--fw-bold);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .embedded-form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--dash-inline-gap);
      align-items: end;
    }

    .embedded-form-grid .btn-block {
      grid-column: 1 / -1;
    }

    .label { margin-bottom: 0; min-width: 0; }
    .opp-cols { grid-template-columns: minmax(0, 1.4fr) minmax(72px, auto) 44px minmax(100px, auto); }
    .lead-cols { grid-template-columns: minmax(0, 1.4fr) 88px 44px 36px; }
    .stage { min-width: 0; width: 100%; font-size: 0.68rem; padding: 0.2rem 0.25rem; }

    @media (max-width: 960px) {
      .sales-pair-row { grid-template-columns: 1fr; }
      .embedded-form-grid { grid-template-columns: 1fr; }
    }
`],
})
export class SalesPage implements OnInit {
  readonly visibleRows = VISIBLE_ROWS;
  readonly rowHeightRem = ROW_HEIGHT_REM;

  readonly tenancy = inject(TenancyService);
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly loadingAgent = signal(true);
  readonly loadingOpp = signal(true);
  readonly loadingLeads = signal(true);
  readonly savingOpp = signal(false);
  readonly savingLead = signal(false);
  readonly agent = signal<Agent | null>(null);
  readonly opps = signal<Opportunity[]>([]);
  readonly leads = signal<Lead[]>([]);
  readonly oppQuery = signal('');
  readonly leadQuery = signal('');
  readonly stageOptions = OPP_STAGE_OPTIONS;

  oppTitle = '';
  oppAmount = 0;
  oppStage = 'QUALIFICATION';
  oppProb = 10;
  leadCompany = '';
  leadContact = '';
  leadSource = '';
  leadScore = 50;

  readonly filteredOpps = computed(() => {
    const q = this.oppQuery().trim().toLowerCase();
    const list = this.opps();
    if (!q) return list;
    return list.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        (o.stage ?? '').toLowerCase().includes(q) ||
        String(o.amount).includes(q),
    );
  });

  readonly filteredLeads = computed(() => {
    const q = this.leadQuery().trim().toLowerCase();
    const list = this.leads();
    if (!q) return list;
    return list.filter(
      (l) =>
        l.companyName.toLowerCase().includes(q) ||
        (l.contactName ?? '').toLowerCase().includes(q) ||
        (l.status ?? '').toLowerCase().includes(q) ||
        (l.source ?? '').toLowerCase().includes(q),
    );
  });

  ngOnInit(): void {
    this.api.getAgents().subscribe({
      next: (agents) => {
        this.agent.set(agents.find((a) => a.code === 'VENTES') ?? null);
        this.loadingAgent.set(false);
      },
      error: () => this.loadingAgent.set(false),
    });
    this.reloadOpps();
    this.reloadLeads();
  }

  formatAmount(amount: number): string {
    return Number(amount ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  }

  createOpp(): void {
    this.savingOpp.set(true);
    this.api
      .createOpportunity({
        title: this.oppTitle.trim(),
        amount: this.oppAmount,
        stage: this.oppStage,
        probability: this.oppProb,
      })
      .subscribe({
        next: () => {
          this.savingOpp.set(false);
          this.oppTitle = '';
          this.oppAmount = 0;
          this.oppProb = 10;
          this.toast.success('Opportunité créée.');
          this.reloadOpps();
        },
        error: (err) => {
          this.savingOpp.set(false);
          this.toast.error(mapHttpError(err, 'Création opportunité impossible.'));
        },
      });
  }

  changeStage(o: Opportunity, stage: string): void {
    this.api.updateOpportunity(o.id, { ...o, stage }).subscribe({
      next: () => {
        this.toast.success('Étape mise à jour.');
        this.reloadOpps();
      },
      error: (err) => this.toast.error(mapHttpError(err, 'Mise à jour impossible.')),
    });
  }

  async removeOpp(o: Opportunity): Promise<void> {
    const ok = await this.confirmDialog.confirm({
      title: 'Supprimer l’opportunité',
      message: `Voulez-vous supprimer « ${o.title} » ?`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    this.api.deleteOpportunity(o.id).subscribe({
      next: () => {
        this.toast.success('Opportunité supprimée.');
        this.reloadOpps();
      },
      error: (err) => this.toast.error(mapHttpError(err, 'Suppression impossible.')),
    });
  }

  createLead(): void {
    this.savingLead.set(true);
    this.api
      .createLead({
        companyName: this.leadCompany.trim(),
        contactName: this.leadContact.trim(),
        source: this.leadSource.trim() || 'MANUAL',
        status: 'NEW',
        score: this.leadScore,
      })
      .subscribe({
        next: () => {
          this.savingLead.set(false);
          this.leadCompany = '';
          this.leadContact = '';
          this.leadSource = '';
          this.leadScore = 50;
          this.toast.success('Prospect créé.');
          this.reloadLeads();
        },
        error: (err) => {
          this.savingLead.set(false);
          this.toast.error(mapHttpError(err, 'Création prospect impossible.'));
        },
      });
  }

  async removeLead(l: Lead): Promise<void> {
    const ok = await this.confirmDialog.confirm({
      title: 'Supprimer le prospect',
      message: `Voulez-vous supprimer « ${l.companyName} » ?`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    this.api.deleteLead(l.id).subscribe({
      next: () => {
        this.toast.success('Prospect supprimé.');
        this.reloadLeads();
      },
      error: (err) => this.toast.error(mapHttpError(err, 'Suppression impossible.')),
    });
  }

  private reloadOpps(): void {
    this.api.getOpportunities().subscribe({
      next: (data) => {
        this.opps.set(data);
        this.loadingOpp.set(false);
      },
      error: () => this.loadingOpp.set(false),
    });
  }

  private reloadLeads(): void {
    this.api.getLeads().subscribe({
      next: (data) => {
        this.leads.set(data);
        this.loadingLeads.set(false);
      },
      error: () => this.loadingLeads.set(false),
    });
  }
}
