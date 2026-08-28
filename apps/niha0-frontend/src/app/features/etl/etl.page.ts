import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../../core/api/api.service';
import { Agent } from '../../core/api/api.models';
import { FeaturePageHeaderComponent } from '../../shared/ui/feature-page-header/feature-page-header.component';
import { FeatureAgentHostComponent } from '../../shared/ui/feature-agent-host/feature-agent-host.component';

@Component({
  selector: 'app-etl-page',
  imports: [FeaturePageHeaderComponent, FeatureAgentHostComponent],
  template: `
    <div class="page feature-module-page">
      <app-feature-page-header
        group="Gestion"
        code="ETETL"
        title="ETETL"
        [soon]="true"
        backLabel="← AI Office ETETL"
        [backQueryParams]="{ agent: 'analytics' }"
      />

      <app-feature-agent-host
        [agent]="agent()"
        [loading]="loading()"
        officeQuery="analytics"
        [sectionLabel]="'Agent dédié ETETL'"
        officeLinkLabel="ETETL"
      />

      <p class="feature-callout">
        Connecteurs et pipelines à venir. Les syncs critiques resteront soumises à validation CEO.
      </p>
    </div>
  `,
})
export class EtlPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly loading = signal(true);
  readonly agent = signal<Agent | null>(null);

  ngOnInit(): void {
    this.api.getAgents().subscribe({
      next: (agents) => {
        this.agent.set(agents.find((a) => a.code === 'ANALYTICS') ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
