import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TenancyService } from '../../../core/tenancy/tenancy.service';
import { AgentOfficeLinkComponent } from '../agent-office-link/agent-office-link.component';

@Component({
  selector: 'app-feature-page-header',
  imports: [RouterLink, AgentOfficeLinkComponent],
  template: `
    <header class="feature-sticky-head">
      <div class="feature-row-main">
        <a
          [routerLink]="backRoute()"
          [queryParams]="backQueryParams()"
          class="feature-left back-ao"
        >{{ backLabel() }}</a>
        <div class="feature-title-block">
          <div class="title-line">
            @if (code()) {
              <span class="module-code">{{ code() }}</span>
            }
            <h1 class="feature-center">{{ title() }}</h1>
            <ng-content select="[chips]" />
            @if (soon()) {
              <span class="soon-pill">Bientôt</span>
            }
          </div>
          @if (subtitle()) {
            <p class="feature-row-sub">{{ subtitle() }}</p>
          }
          @if (agentModuleKey()) {
            <app-agent-office-link
              [moduleKey]="agentModuleKey()!"
              [label]="agentLabel() || title()"
            />
          }
        </div>
        <nav class="feature-right" aria-label="Fil d'Ariane">
          <a routerLink="/app/dashboard">Accueil</a>
          <span class="crumb-sep" aria-hidden="true">/</span>
          @if (group()) {
            <span class="crumb-group">{{ group() }}</span>
            <span class="crumb-sep" aria-hidden="true">/</span>
          }
          <span aria-current="page">{{ title() }}</span>
        </nav>
      </div>
      <div class="feature-actions">
        <ng-content select="[actions]" />
      </div>
    </header>
  `,
  styles: [`
    .feature-sticky-head {
      position: sticky;
      top: 0;
      z-index: calc(var(--z-sticky, 20) - 2);
      margin: 0 calc(-1 * var(--space-5)) var(--dash-band-gap, var(--space-2));
      padding: var(--dash-inline-gap, var(--space-2)) var(--space-5);
      background: color-mix(in srgb, var(--bg-secondary) 97%, transparent);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-color);
    }

    .feature-row-main {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
      align-items: center;
      gap: var(--dash-inline-gap, var(--space-3));
    }

    .feature-left { justify-self: start; white-space: nowrap; }

    .feature-title-block {
      text-align: center;
      min-width: 0;
    }

    .title-line {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 0.5rem 0.75rem;
    }

    .module-code {
      font-family: var(--font-mono);
      font-size: 0.58rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      padding: 0.1rem 0.32rem;
      border-radius: var(--radius-sm);
      background: var(--bg-secondary);
      color: var(--text-muted);
    }

    .feature-center {
      margin: 0;
      font-size: clamp(0.95rem, 0.85rem + 0.35vw, 1.1rem);
      font-weight: var(--fw-extrabold);
      letter-spacing: 0.18em;
      text-transform: uppercase;
      line-height: 1.2;
      white-space: nowrap;
    }

    .soon-pill {
      font-size: 0.58rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      padding: 0.12rem 0.4rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      background: var(--bg-secondary);
    }

    .feature-row-sub {
      margin: 0.25rem 0 0;
      font-size: var(--fs-sm);
      color: var(--text-secondary);
      max-width: 36rem;
      margin-inline: auto;
    }

    .feature-title-block ::ng-deep .ao-link {
      margin-top: 0.35rem;
    }

    .feature-right {
      justify-self: end;
      display: inline-flex;
      align-items: center;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: calc(var(--dash-inline-gap, var(--space-3)) / 2);
      font-size: var(--fs-sm);
      color: var(--text-muted);
    }

    .feature-right a {
      color: var(--text-secondary);
      text-decoration: none;
      font-weight: var(--fw-medium);
    }

    .feature-right a:hover { color: var(--accent-primary); text-decoration: none; }
    .feature-right [aria-current='page'],
    .crumb-group { color: var(--text-primary); font-weight: var(--fw-semibold); }
    .crumb-sep { opacity: 0.65; }

    .back-ao {
      display: inline-block;
      font-size: var(--fs-sm);
      font-weight: var(--fw-semibold);
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--text-muted);
      text-decoration: none;
    }

    .back-ao:hover {
      color: var(--accent-primary);
      text-decoration: none;
    }

    .feature-actions {
      display: flex;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: var(--space-2);
      margin-top: var(--space-2);
    }

    .feature-actions:empty { display: none; }

    @media (max-width: 720px) {
      .feature-sticky-head {
        margin-inline: calc(-1 * var(--space-3));
        padding-inline: var(--space-3);
      }

      .feature-row-main {
        grid-template-columns: 1fr 1fr;
        grid-template-areas: 'back title' 'crumbs crumbs';
      }

      .feature-left { grid-area: back; }
      .feature-title-block { grid-area: title; justify-self: end; text-align: right; }
      .feature-right { grid-area: crumbs; justify-self: stretch; justify-content: flex-end; }
    }
  `],
})
export class FeaturePageHeaderComponent {
  readonly tenancy = inject(TenancyService);

  readonly group = input<string>('');
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly code = input<string>('');
  readonly soon = input(false);
  readonly agentModuleKey = input<string>('');
  readonly agentLabel = input<string>('');
  readonly backRoute = input('/app/ai-office');
  readonly backLabel = input('← AI Office');
  readonly backQueryParams = input<Record<string, string> | null>(null);
}
