import { Component, input } from '@angular/core';
import { Agent } from '../../../core/api/api.models';
import { LoadingStateComponent } from '../loading-state/loading-state.component';
import { AgentHubCardComponent } from '../agent-hub-card/agent-hub-card.component';

@Component({
  selector: 'app-feature-agent-host',
  imports: [LoadingStateComponent, AgentHubCardComponent],
  template: `
    @if (loading()) {
      <app-loading-state [message]="loadingMessage()" />
    } @else if (agent()) {
      <app-agent-hub-card
        [agent]="agent()!"
        [officeQuery]="officeQuery()"
        [sectionLabel]="sectionLabel()"
        [fullWidth]="true"
        [compact]="true"
        [showOfficeLink]="true"
        [officeLinkLabel]="officeLinkLabel()"
      />
    }
  `,
})
export class FeatureAgentHostComponent {
  readonly agent = input<Agent | null>(null);
  readonly loading = input(false);
  readonly officeQuery = input.required<string>();
  readonly sectionLabel = input.required<string>();
  readonly officeLinkLabel = input('');
  readonly loadingMessage = input('Chargement agent…');
}
