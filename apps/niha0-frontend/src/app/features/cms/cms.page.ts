import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../../core/api/api.service';
import { Agent } from '../../core/api/api.models';
import { FeaturePageHeaderComponent } from '../../shared/ui/feature-page-header/feature-page-header.component';
import { FeatureAgentHostComponent } from '../../shared/ui/feature-agent-host/feature-agent-host.component';

@Component({
  selector: 'app-cms-page',
  imports: [FeaturePageHeaderComponent, FeatureAgentHostComponent],
  template: `
    <div class="page feature-module-page">
      <app-feature-page-header
        group="Gestion"
        code="CMCMS"
        title="CMCMS"
        [soon]="true"
        backLabel="← AI Office CMCMS"
        [backQueryParams]="{ agent: 'cms' }"
      />

      <app-feature-agent-host
        [agent]="agent()"
        [loading]="loading()"
        officeQuery="cms"
        [sectionLabel]="'Agent dédié CMCMS'"
        officeLinkLabel="CMCMS"
      />

      <p class="feature-callout">
        Bibliothèque 3D CMCMS disponible dans l'AI Office. Éditeur de pages à venir.
      </p>
    </div>
  `,
})
export class CmsPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly loading = signal(true);
  readonly agent = signal<Agent | null>(null);

  ngOnInit(): void {
    this.api.getAgents().subscribe({
      next: (agents) => {
        this.agent.set(agents.find((a) => a.code === 'MARKETING') ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
