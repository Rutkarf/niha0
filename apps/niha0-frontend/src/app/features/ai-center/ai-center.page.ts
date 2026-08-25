import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { Agent, AgentAction } from '../../core/api/api.models';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { AgentStatusService } from '../../core/navigation/agent-status.service';
import { moduleRouteForAgent } from '../../core/navigation/agent-module.map';

@Component({
  selector: 'app-ai-center-page',
  imports: [LoadingStateComponent, EmptyStateComponent, RouterLink, StatusBadgeComponent],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <a routerLink="/app/ai-office" class="back-ao">← AI Office</a>
          <h1>AI Center</h1>
          <p>Recommandations mockées · validations humaines obligatoires</p>
        </div>
        <a routerLink="/app/ai-office" class="btn btn-primary">Salle 3D</a>
      </header>

      @if (loading()) {
        <app-loading-state />
      } @else {
        @if (pending().length) {
          <section class="pending-block">
            <h2 class="section-title">En attente de validation ({{ pending().length }})</h2>
            @for (action of pending(); track action.id) {
              <article class="action-card">
                <div>
                  <strong>{{ action.title }}</strong>
                  <p>{{ action.description }}</p>
                  <app-status-badge [status]="action.workflowStatus" />
                </div>
                <div class="btns">
                  <button type="button" class="btn btn-primary" (click)="approve(action.id)">Approuver</button>
                  <button type="button" class="btn btn-ghost" (click)="defer(action.id)">Reporter</button>
                  <button type="button" class="btn btn-danger" (click)="reject(action.id)">Refuser</button>
                  <a class="btn btn-ghost" [routerLink]="['/app/ai-office']" [queryParams]="{ agent: agentCode(action.agentId) }">Voir en 3D</a>
                </div>
              </article>
            }
          </section>
        }

        <h2 class="section-title">Agents ({{ deskAgents().length }})</h2>
        <div class="agent-grid">
          @for (agent of deskAgents(); track agent.id) {
            <article class="agent-card">
              <header>
                <strong>{{ agent.name }}</strong>
                <app-status-badge [status]="agent.status" />
              </header>
              <p class="domain">{{ agent.domain }}</p>
              <p>{{ agent.mission }}</p>
              <div class="btns">
                <button
                  type="button"
                  class="btn btn-primary"
                  [disabled]="busyId() === agent.id"
                  (click)="recommend(agent)"
                >
                  {{ busyId() === agent.id ? '…' : 'Recommander' }}
                </button>
                <a class="btn btn-ghost" [routerLink]="moduleOf(agent.code)">Module</a>
                <a class="btn btn-ghost" [routerLink]="['/app/ai-office']" [queryParams]="{ agent: agent.code }">Bureau 3D</a>
              </div>
            </article>
          }
        </div>

        <h2 class="section-title">Historique d’actions</h2>
        @if (!actions().length) {
          <app-empty-state title="Aucune action" icon="ACT" />
        } @else {
          <ul class="action-list">
            @for (action of actions(); track action.id) {
              <li>
                <span>{{ action.title }}</span>
                <app-status-badge [status]="action.workflowStatus" />
              </li>
            }
          </ul>
        }
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
      }
    </div>
  `,
  styles: [`
    .pending-block { margin-bottom: 1.5rem; }
    .action-card, .agent-card {
      background: var(--bg-elevated);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem;
      margin-bottom: 0.75rem;
      box-shadow: var(--shadow-sm);
      transition: border-color var(--transition), box-shadow var(--transition);
    }
    .agent-card:hover {
      border-color: var(--border-strong);
      box-shadow: var(--shadow-md);
    }
    .action-card p, .agent-card > p {
      margin: 0.35rem 0 0.55rem;
      color: var(--text-secondary);
      font-size: 0.85rem;
      line-height: 1.45;
    }
    .agent-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    .agent-card header {
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
      align-items: center;
    }
    .domain {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin: 0.35rem 0 0 !important;
    }
    .btns { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.75rem; }
    .btns .btn { font-size: 0.78rem; padding: 0.4rem 0.7rem; }
    .action-list { list-style: none; padding: 0; margin: 0; }
    .action-list li {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      align-items: center;
      padding: 0.7rem 0;
      border-bottom: 1px solid var(--border-color);
      font-size: 0.85rem;
    }
    .error { color: var(--accent-danger); margin-top: 0.75rem; }
  `],
})
export class AiCenterPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly agentStatus = inject(AgentStatusService);

  readonly loading = signal(true);
  readonly agents = signal<Agent[]>([]);
  readonly actions = signal<AgentAction[]>([]);
  readonly pending = signal<AgentAction[]>([]);
  readonly busyId = signal<string | null>(null);
  readonly error = signal('');

  ngOnInit(): void {
    this.reload();
  }

  deskAgents(): Agent[] {
    return this.agents().filter((a) => a.code !== 'CEO_DIRECTION');
  }

  agentCode(agentId: string): string {
    return this.agents().find((a) => a.id === agentId)?.code ?? '';
  }

  moduleOf(code: string): string {
    return moduleRouteForAgent(code);
  }

  recommend(agent: Agent): void {
    this.error.set('');
    this.busyId.set(agent.id);
    this.api.recommendAgentAction(agent.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.agentStatus.refresh();
        this.reload();
      },
      error: () => {
        this.busyId.set(null);
        this.error.set('Impossible de générer la recommandation.');
      },
    });
  }

  approve(id: string): void {
    this.api.approveAction(id, 'Approuvé depuis AI Center').subscribe({
      next: () => {
        this.agentStatus.refresh();
        this.reload();
      },
    });
  }

  reject(id: string): void {
    this.api.rejectAction(id, 'Refusé depuis AI Center').subscribe({
      next: () => {
        this.agentStatus.refresh();
        this.reload();
      },
    });
  }

  defer(id: string): void {
    this.api.deferAction(id, 'Reporté depuis AI Center').subscribe({
      next: () => {
        this.agentStatus.refresh();
        this.reload();
      },
    });
  }

  private reload(): void {
    this.api.getAgents().subscribe({
      next: (agents) => {
        this.agents.set(agents);
        this.api.getAgentActions().subscribe({
          next: (actions) => {
            this.actions.set(actions);
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
