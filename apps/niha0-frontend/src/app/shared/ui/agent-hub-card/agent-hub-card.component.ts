import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Agent } from '../../../core/api/api.models';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { AgentOfficeLinkComponent } from '../agent-office-link/agent-office-link.component';

@Component({
  selector: 'app-agent-hub-card',
  imports: [RouterLink, StatusBadgeComponent, AgentOfficeLinkComponent],
  template: `
    <section
      class="card agent-card"
      [class.agent-card--full]="fullWidth"
      [class.agent-card--compact]="compact"
    >
      @if (compact) {
        <div class="agent-compact">
          <div class="agent-head-line">
            <span class="section-label">{{ sectionLabel }}</span>
            <span class="head-sep" aria-hidden="true">·</span>
            <h2>{{ agent.name }}</h2>
            <span class="domain">{{ agent.domain }}</span>
            <app-status-badge [status]="agent.status" />
            <div class="actions">
              @if (showOfficeLink) {
                <app-agent-office-link [moduleKey]="officeQuery" [label]="officeLinkLabel || agent.name" />
              } @else {
                <a class="btn btn-primary btn-sm" routerLink="/app/ai-office" [queryParams]="{ agent: officeQuery }">Bureau 3D</a>
              }
              <a class="btn btn-ghost btn-sm" routerLink="/app/ai-center">AI Center</a>
            </div>
          </div>
          @if (agent.mission || agent.description) {
            <p class="agent-blurb">
              @if (agent.mission) {
                <span>{{ agent.mission }}</span>
              }
              @if (agent.mission && agent.description) {
                <span class="blurb-sep" aria-hidden="true"> · </span>
              }
              @if (agent.description) {
                <span>{{ agent.description }}</span>
              }
            </p>
          }
        </div>
      } @else {
        <p class="section-label">{{ sectionLabel }}</p>
        <div class="row">
          <div class="agent-copy">
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
          @if (showOfficeLink) {
            <app-agent-office-link [moduleKey]="officeQuery" [label]="officeLinkLabel || agent.name" />
          } @else {
            <a class="btn btn-primary" routerLink="/app/ai-office" [queryParams]="{ agent: officeQuery }">Bureau 3D</a>
          }
          <a class="btn btn-ghost" routerLink="/app/ai-center">AI Center</a>
        </div>
      }
    </section>
  `,
  styles: `
    .agent-card {
      max-width: 720px;
      margin-bottom: 1rem;
    }

    .agent-card--full {
      max-width: none;
      width: 100%;
      margin-bottom: 0;
    }

    .agent-card--compact {
      padding: var(--dash-inline-gap, var(--space-3)) var(--dash-band-gap, var(--space-5));
    }

    .agent-compact {
      display: flex;
      flex-direction: column;
      gap: var(--dash-inline-gap, var(--space-3));
      min-width: 0;
    }

    .agent-head-line {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--dash-inline-gap, var(--space-3));
      min-width: 0;
    }

    .agent-head-line .section-label {
      margin: 0;
      white-space: nowrap;
    }

    .head-sep,
    .blurb-sep {
      color: var(--text-muted);
    }

    .agent-head-line h2 {
      margin: 0;
      font-family: var(--font-display);
      font-size: 0.95rem;
      font-weight: var(--fw-bold);
      white-space: nowrap;
    }

    .agent-head-line .domain {
      margin: 0;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .agent-head-line .actions {
      display: inline-flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--dash-inline-gap, var(--space-3));
      margin-left: auto;
    }

    .agent-head-line .actions ::ng-deep .ao-link {
      margin-top: 0;
      padding: 0.3rem 0.65rem;
      font-size: 0.72rem;
    }

    .agent-blurb {
      margin: 0;
      font-size: 0.78rem;
      line-height: 1.35;
      color: var(--text-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .row {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: flex-start;
    }

    .agent-copy { min-width: 0; flex: 1; }

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

    .actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .actions ::ng-deep .ao-link { margin-top: 0; }

    @media (max-width: 720px) {
      .agent-head-line .actions {
        margin-left: 0;
        width: 100%;
      }
    }
  `,
})
export class AgentHubCardComponent {
  @Input({ required: true }) agent!: Agent;
  @Input({ required: true }) officeQuery!: string;
  @Input() sectionLabel = 'Agent dédié';
  @Input() fullWidth = false;
  @Input() compact = false;
  @Input() showOfficeLink = false;
  @Input() officeLinkLabel = '';
}
