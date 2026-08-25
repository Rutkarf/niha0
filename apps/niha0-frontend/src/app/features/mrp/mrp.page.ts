import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { Agent } from '../../core/api/api.models';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AgentOfficeLinkComponent } from '../../shared/ui/agent-office-link/agent-office-link.component';
import { AgentHubCardComponent } from '../../shared/ui/agent-hub-card/agent-hub-card.component';

@Component({
  selector: 'app-mrp-page',
  imports: [
    RouterLink,
    LoadingStateComponent,
    EmptyStateComponent,
    AgentOfficeLinkComponent,
    AgentHubCardComponent,
  ],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <a routerLink="/app/ai-office" class="back-ao">← AI Office</a>
          <p class="module-code">MRMRP</p>
          <h1>MRMRP</h1>
          <p>Planification des besoins — module données (Bientôt)</p>
          <app-agent-office-link moduleKey="mrp" label="MRMRP" libraryId="MRMRP" />
        </div>
        <span class="soon-pill">Bientôt</span>
      </header>

      @if (loading()) {
        <app-loading-state message="Chargement agent…" />
      } @else if (!agent()) {
        <app-empty-state title="Agent ERP indisponible" icon="MR" />
      } @else {
        <app-agent-hub-card [agent]="agent()!" officeQuery="erp" />
        <p class="callout">
          Nomenclatures et OF à venir. Les propositions de planification passent par validation humaine.
        </p>
      }
    </div>
  `,
})
export class MrpPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly loading = signal(true);
  readonly agent = signal<Agent | null>(null);

  ngOnInit(): void {
    this.api.getAgents().subscribe({
      next: (agents) => {
        this.agent.set(agents.find((a) => a.code === 'ERP') ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
