import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { Agent, Lead, Opportunity } from '../../core/api/api.models';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AgentOfficeLinkComponent } from '../../shared/ui/agent-office-link/agent-office-link.component';
import { AgentHubCardComponent } from '../../shared/ui/agent-hub-card/agent-hub-card.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { mapHttpError } from '../../core/api/http-error.util';

@Component({
  selector: 'app-sales-page',
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
          <h1>Ventes</h1>
          <p>Pipeline commercial — opportunités et prospects (CRUD)</p>
          <app-agent-office-link moduleKey="sales" label="Ventes" />
        </div>
      </header>

      @if (loadingAgent()) {
        <app-loading-state message="Chargement agent…" />
      } @else if (agent()) {
        <app-agent-hub-card [agent]="agent()!" officeQuery="sales" />
      }

      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }

      <section class="block">
        <form class="create-form card" (ngSubmit)="createOpp()">
          <h2>Nouvelle opportunité</h2>
          <div class="row">
            <label class="label">Titre
              <input class="input" [(ngModel)]="oppTitle" name="oppTitle" required />
            </label>
            <label class="label">Montant
              <input class="input" type="number" [(ngModel)]="oppAmount" name="oppAmount" min="0" />
            </label>
            <label class="label">Étape
              <select class="input" [(ngModel)]="oppStage" name="oppStage">
                <option value="QUALIFICATION">QUALIFICATION</option>
                <option value="PROPOSAL">PROPOSAL</option>
                <option value="NEGOTIATION">NEGOTIATION</option>
                <option value="WON">WON</option>
                <option value="LOST">LOST</option>
              </select>
            </label>
            <label class="label">Prob. %
              <input class="input" type="number" [(ngModel)]="oppProb" name="oppProb" min="0" max="100" />
            </label>
            <button type="submit" class="btn btn-primary" [disabled]="savingOpp() || !oppTitle.trim()">
              {{ savingOpp() ? '…' : 'Ajouter' }}
            </button>
          </div>
        </form>

        <h2 class="section-title">Opportunités</h2>
        @if (loadingOpp()) {
          <app-loading-state message="Chargement du pipeline…" />
        } @else if (!opps().length) {
          <app-empty-state title="Aucune opportunité" icon="OPP" />
        } @else {
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>Opportunité</th><th>Étape</th><th>Montant</th><th>Prob.</th><th></th></tr>
              </thead>
              <tbody>
                @for (o of opps(); track o.id) {
                  <tr>
                    <td>{{ o.title }}</td>
                    <td>
                      <select class="input stage" [ngModel]="o.stage" (ngModelChange)="changeStage(o, $event)">
                        <option value="QUALIFICATION">QUALIFICATION</option>
                        <option value="PROPOSAL">PROPOSAL</option>
                        <option value="NEGOTIATION">NEGOTIATION</option>
                        <option value="WON">WON</option>
                        <option value="LOST">LOST</option>
                      </select>
                    </td>
                    <td>{{ o.amount }}</td>
                    <td>{{ o.probability }}%</td>
                    <td>
                      <button type="button" class="btn btn-danger btn-sm" (click)="removeOpp(o)">Suppr.</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>

      <section class="block">
        <form class="create-form card" (ngSubmit)="createLead()">
          <h2>Nouveau prospect</h2>
          <div class="row">
            <label class="label">Société
              <input class="input" [(ngModel)]="leadCompany" name="leadCompany" required />
            </label>
            <label class="label">Contact
              <input class="input" [(ngModel)]="leadContact" name="leadContact" />
            </label>
            <label class="label">Source
              <input class="input" [(ngModel)]="leadSource" name="leadSource" />
            </label>
            <label class="label">Score
              <input class="input" type="number" [(ngModel)]="leadScore" name="leadScore" min="0" max="100" />
            </label>
            <button type="submit" class="btn btn-primary" [disabled]="savingLead() || !leadCompany.trim()">
              {{ savingLead() ? '…' : 'Ajouter' }}
            </button>
          </div>
        </form>

        <h2 class="section-title">Prospects</h2>
        @if (loadingLeads()) {
          <app-loading-state message="Chargement des leads…" />
        } @else if (!leads().length) {
          <app-empty-state title="Aucun prospect" icon="LED" />
        } @else {
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>Société</th><th>Contact</th><th>Statut</th><th>Score</th><th>Source</th><th></th></tr>
              </thead>
              <tbody>
                @for (l of leads(); track l.id) {
                  <tr>
                    <td>{{ l.companyName }}</td>
                    <td>{{ l.contactName }}</td>
                    <td><app-status-badge [status]="l.status" /></td>
                    <td>{{ l.score }}</td>
                    <td>{{ l.source }}</td>
                    <td>
                      <button type="button" class="btn btn-danger btn-sm" (click)="removeLead(l)">Suppr.</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .block { margin-bottom: 1.75rem; }
    .create-form { margin-bottom: 1rem; }
    .create-form h2 { margin: 0 0 0.75rem; font-size: 0.95rem; font-family: var(--font-display); }
    .row { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: flex-end; }
    .label { margin-bottom: 0; min-width: 140px; flex: 1; }
    .error { color: var(--accent-danger); margin-bottom: 1rem; }
    .table-wrap {
      overflow-x: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md);
      background: var(--bg-elevated);
    }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    th, td { padding: 0.7rem 0.9rem; text-align: left; border-bottom: 1px solid var(--border-color); }
    th { font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); }
    .stage { min-width: 140px; font-size: 0.8rem; }
    .btn-sm { font-size: 0.72rem; padding: 0.25rem 0.5rem; min-height: auto; }
  `],
})
export class SalesPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly loadingAgent = signal(true);
  readonly loadingOpp = signal(true);
  readonly loadingLeads = signal(true);
  readonly savingOpp = signal(false);
  readonly savingLead = signal(false);
  readonly error = signal('');
  readonly agent = signal<Agent | null>(null);
  readonly opps = signal<Opportunity[]>([]);
  readonly leads = signal<Lead[]>([]);

  oppTitle = '';
  oppAmount = 0;
  oppStage = 'QUALIFICATION';
  oppProb = 10;
  leadCompany = '';
  leadContact = '';
  leadSource = '';
  leadScore = 50;

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

  createOpp(): void {
    this.error.set('');
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
          this.reloadOpps();
        },
        error: (err) => {
          this.savingOpp.set(false);
          this.error.set(mapHttpError(err, 'Création opportunité impossible.'));
        },
      });
  }

  changeStage(o: Opportunity, stage: string): void {
    this.api.updateOpportunity(o.id, { ...o, stage }).subscribe({
      next: () => this.reloadOpps(),
      error: (err) => this.error.set(mapHttpError(err, 'Mise à jour impossible.')),
    });
  }

  removeOpp(o: Opportunity): void {
    if (!confirm(`Supprimer ${o.title} ?`)) return;
    this.api.deleteOpportunity(o.id).subscribe({
      next: () => this.reloadOpps(),
      error: (err) => this.error.set(mapHttpError(err, 'Suppression impossible.')),
    });
  }

  createLead(): void {
    this.error.set('');
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
          this.reloadLeads();
        },
        error: (err) => {
          this.savingLead.set(false);
          this.error.set(mapHttpError(err, 'Création prospect impossible.'));
        },
      });
  }

  removeLead(l: Lead): void {
    if (!confirm(`Supprimer ${l.companyName} ?`)) return;
    this.api.deleteLead(l.id).subscribe({
      next: () => this.reloadLeads(),
      error: (err) => this.error.set(mapHttpError(err, 'Suppression impossible.')),
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
