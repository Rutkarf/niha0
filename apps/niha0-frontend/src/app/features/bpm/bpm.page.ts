import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { Agent, AgentAction } from '../../core/api/api.models';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { AgentOfficeLinkComponent } from '../../shared/ui/agent-office-link/agent-office-link.component';

@Component({
  selector: 'app-bpm-page',
  imports: [
    RouterLink,
    LoadingStateComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
    AgentOfficeLinkComponent,
  ],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <a routerLink="/app/ai-office" class="back-ao">← AI Office</a>
          <h1>Stratégie / BPM</h1>
          <p>Priorités CEO · validations et agent Stratégie</p>
          <app-agent-office-link moduleKey="strategie" label="Stratégie" />
        </div>
        <a routerLink="/app/ai-office" class="btn btn-primary">Command Center</a>
      </header>

      @if (loading()) {
        <app-loading-state message="Chargement du pilotage…" />
      } @else {
        @if (strategyAgent(); as agent) {
          <section class="card agent-block">
            <p class="section-label">Agent dédié</p>
            <div class="agent-row">
              <div>
                <h2>{{ agent.name }}</h2>
                <p>{{ agent.mission }}</p>
              </div>
              <app-status-badge [status]="agent.status" />
            </div>
          </section>
        }

        <section class="block">
          <h2 class="section-title">Validations en attente</h2>
          @if (!pending().length) {
            <app-empty-state title="Aucune validation" icon="OKR" description="Le command center est à jour." />
          } @else {
            <ul class="pending-list">
              @for (action of pending(); track action.id) {
                <li>
                  <div>
                    <strong>{{ action.title }}</strong>
                    <p>{{ action.description }}</p>
                  </div>
                  <app-status-badge [status]="action.workflowStatus" />
                </li>
              }
            </ul>
          }
        </section>
      }
    </div>
  `,
  styles: [`
    .agent-block { margin-bottom: 1.25rem; max-width: 720px; }
    .agent-row {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: flex-start;
    }
    .agent-block h2 {
      margin: 0 0 0.35rem;
      font-size: 1.05rem;
      font-family: var(--font-display);
    }
    .agent-block p { margin: 0; color: var(--text-secondary); font-size: 0.88rem; }
    .block { margin-bottom: 0.5rem; }
    .pending-list { list-style: none; padding: 0; margin: 0; max-width: 720px; }
    .pending-list li {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: flex-start;
      padding: 0.85rem 0;
      border-bottom: 1px solid var(--border-color);
    }
    .pending-list strong { display: block; margin-bottom: 0.25rem; }
    .pending-list p { margin: 0; color: var(--text-secondary); font-size: 0.85rem; }
  `],
})
export class BpmPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly loading = signal(true);
  readonly strategyAgent = signal<Agent | null>(null);
  readonly pending = signal<AgentAction[]>([]);

  ngOnInit(): void {
    this.api.getAgents().subscribe({
      next: (agents) => {
        this.strategyAgent.set(agents.find((a) => a.code === 'STRATEGIE') ?? null);
        this.api.getAgentActions().subscribe({
          next: (actions) => {
            this.pending.set(actions.filter((a) => a.workflowStatus === 'REQUEST_APPROVAL'));
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      },
      error: () => this.loading.set(false),
    });
  }
}
