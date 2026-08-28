import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../../core/api/api.service';
import { Agent } from '../../core/api/api.models';
import { FeaturePageHeaderComponent } from '../../shared/ui/feature-page-header/feature-page-header.component';
import { FeatureAgentHostComponent } from '../../shared/ui/feature-agent-host/feature-agent-host.component';

@Component({
  selector: 'app-scm-page',
  imports: [FeaturePageHeaderComponent, FeatureAgentHostComponent],
  template: `
    <div class="page feature-module-page">
      <app-feature-page-header
        group="Gestion"
        code="SCSC"
        title="SCSC"
        [soon]="true"
        backLabel="← AI Office SCSC"
        [backQueryParams]="{ agent: 'stock' }"
      />

      <app-feature-agent-host
        [agent]="agent()"
        [loading]="loading()"
        officeQuery="stock"
        [sectionLabel]="'Agent dédié SCSC'"
        officeLinkLabel="SCSC"
      />

      <p class="feature-callout">
        Commandes fournisseurs et lead times à venir. Les réappro passent par recommandation agent + validation CEO.
      </p>
    </div>
  `,
})
export class ScmPage implements OnInit {
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
