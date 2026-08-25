import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  imports: [RouterLink],
  template: `
    <div class="empty">
      <div class="mark" aria-hidden="true">{{ icon() }}</div>
      <h3>{{ title() }}</h3>
      <p>{{ description() }}</p>
      @if (ctaLabel() && ctaRoute()) {
        <a class="btn btn-primary cta" [routerLink]="ctaRoute()!">{{ ctaLabel() }}</a>
      } @else if (ctaLabel() && ctaHref()) {
        <a class="btn btn-primary cta" [href]="ctaHref()!">{{ ctaLabel() }}</a>
      }
    </div>
  `,
  styles: [`
    .empty {
      text-align: center;
      padding: var(--space-7) var(--space-5);
      color: var(--text-secondary);
      border: 1px dashed var(--border-color);
      border-radius: var(--radius-lg);
      background: color-mix(in srgb, var(--bg-elevated) 70%, transparent);
    }
    .mark {
      width: 42px;
      height: 42px;
      margin: 0 auto var(--space-3);
      border-radius: var(--radius-md);
      display: grid;
      place-items: center;
      font-family: var(--font-mono);
      font-size: var(--fs-sm);
      font-weight: var(--fw-bold);
      letter-spacing: 0.04em;
      color: var(--accent-primary);
      background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
      border: 1px solid var(--border-strong);
    }
    h3 {
      margin: 0 0 var(--space-2);
      color: var(--text-primary);
      font-family: var(--font-display);
      font-weight: var(--fw-bold);
      font-size: var(--fs-lg);
      letter-spacing: -0.02em;
      line-height: var(--lh-snug);
    }
    p {
      margin: 0;
      max-width: 360px;
      margin-inline: auto;
      font-size: var(--fs-md);
      line-height: var(--lh-normal);
      color: var(--text-secondary);
    }
    .cta {
      margin-top: var(--space-4);
      text-decoration: none;
    }
  `],
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly description = input('Aucune donnée disponible pour le moment.');
  readonly icon = input('—');
  readonly ctaLabel = input<string | null>(null);
  readonly ctaRoute = input<string | null>(null);
  readonly ctaHref = input<string | null>(null);
}
