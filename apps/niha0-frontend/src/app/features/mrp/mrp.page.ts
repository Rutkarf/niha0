import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../../core/api/api.service';
import { Agent } from '../../core/api/api.models';
import { FeaturePageHeaderComponent } from '../../shared/ui/feature-page-header/feature-page-header.component';
import { FeatureAgentHostComponent } from '../../shared/ui/feature-agent-host/feature-agent-host.component';

@Component({
  selector: 'app-mrp-page',
  imports: [FeaturePageHeaderComponent, FeatureAgentHostComponent],
  template: `
    <div class="page feature-module-page">
      <app-feature-page-header
        group="Gestion"
        code="MRMRP"
        title="MRMRP"
        [soon]="true"
        backLabel="← AI Office MRMRP"
        [backQueryParams]="{ agent: 'erp' }"
      />

      <app-feature-agent-host
        [agent]="agent()"
        [loading]="loading()"
        officeQuery="erp"
        [sectionLabel]="'Agent dédié MRMRP'"
        officeLinkLabel="MRMRP"
      />

      <p class="feature-callout">
        Nomenclatures et OF à venir. Les propositions de planification passent par validation humaine.
      </p>
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
