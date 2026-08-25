import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { Agent } from '../../core/api/api.models';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AgentOfficeLinkComponent } from '../../shared/ui/agent-office-link/agent-office-link.component';
import { AgentHubCardComponent } from '../../shared/ui/agent-hub-card/agent-hub-card.component';

@Component({
  selector: 'app-pim-page',
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
          <p class="module-code">PIPIM</p>
          <h1>PIPIM</h1>
          <p>Référentiel produits — module données (Bientôt)</p>
          <app-agent-office-link moduleKey="pim" label="PIPIM" libraryId="PIPIM" />
        </div>
        <span class="soon-pill">Bientôt</span>
      </header>

      @if (loading()) {
        <app-loading-state message="Chargement agent…" />
      } @else if (!agent()) {
        <app-empty-state title="Agent Stock indisponible" icon="PI" />
      } @else {
        <app-agent-hub-card [agent]="agent()!" officeQuery="stock" />
        <p class="callout">
          Fiches produit et variantes à venir. Les alertes catalogue passent par recommandation agent + validation CEO.
        </p>
      }
    </div>
  `,
})
export class PimPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly loading = signal(true);
  readonly agent = signal<Agent | null>(null);

  ngOnInit(): void {
    this.api.getAgents().subscribe({
      next: (agents) => {
        this.agent.set(agents.find((a) => a.code === 'STOCK') ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
