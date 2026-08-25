import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Agent } from '../../../core/api/api.models';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

@Component({
  selector: 'app-agent-hub-card',
  imports: [RouterLink, StatusBadgeComponent],
  template: `
    <section class="card agent-card">
      <p class="section-label">Agent dédié</p>
      <div class="row">
        <div>
          <h2>{{ agent.name }}</h2>
          <p class="domain">{{ agent.domain }}</p>
          <p class="mission">{{ agent.mission }}</p>
          @if (agent.description) {
            <p class="desc">{{ agent.description }}</p>
          }
        </div>
        <app-status-badge [status]="agent.status" />
      </div>
      <div class="actions">
        <a class="btn btn-primary" routerLink="/app/ai-office" [queryParams]="{ agent: officeQuery }">Bureau 3D</a>
        <a class="btn btn-ghost" routerLink="/app/ai-center">AI Center</a>
      </div>
    </section>
  `,
  styles: `
    .agent-card { max-width: 720px; margin-bottom: 1rem; }
    .row {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: flex-start;
    }
    h2 {
      margin: 0 0 0.25rem;
      font-family: var(--font-display);
      font-size: 1.1rem;
    }
    .domain {
      margin: 0 0 0.45rem;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
    }
    .mission, .desc {
      margin: 0 0 0.4rem;
      color: var(--text-secondary);
      font-size: 0.88rem;
      line-height: 1.45;
    }
    .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; }
  `,
})
export class AgentHubCardComponent {
  @Input({ required: true }) agent!: Agent;
  @Input({ required: true }) officeQuery!: string;
}
