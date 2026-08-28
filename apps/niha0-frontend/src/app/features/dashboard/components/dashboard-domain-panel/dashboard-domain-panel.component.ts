import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { DashboardDomainSection } from '../../models/dashboard.models';
import { DashboardSparklineComponent } from '../dashboard-sparkline/dashboard-sparkline.component';

const VISIBLE_ROWS = 5;
const ROW_HEIGHT_REM = 1.45;

@Component({
  selector: 'app-dashboard-domain-panel',
  imports: [DecimalPipe, RouterLink, DashboardSparklineComponent],
  template: `
    <article class="domain-panel" [attr.aria-labelledby]="'domain-' + section().id">
      <header class="domain-head">
        <div class="domain-title-line">
          <span class="domain-code">{{ section().code }}</span>
          <h3 class="domain-title" [id]="'domain-' + section().id">{{ section().title }}</h3>
          <span class="domain-count">{{ section().count | number:'1.0-0' }}</span>
          @for (m of section().metrics; track m.label) {
            <span class="metric-inline" [class.highlight]="m.highlight">
              <span class="metric-lbl">{{ m.label }}</span>
              <span class="metric-val">{{ m.value }}</span>
            </span>
          }
          <app-dashboard-sparkline
            class="spark"
            [data]="section().trend"
            [color]="section().sparkColor"
            [width]="44"
            [height]="16"
          />
        </div>
        <a
          [routerLink]="section().route"
          [queryParams]="section().routeQuery ?? null"
          class="domain-link"
          [attr.aria-label]="section().routeLabel"
        >→</a>
      </header>

      @if (section().rows.length) {
        <div class="domain-table">
          <div class="row-cols head" aria-hidden="true">
            <span>{{ colLabels()[0] }}</span>
            <span>{{ colLabels()[1] }}</span>
            <span>{{ colLabels()[2] }}</span>
            <span>{{ colLabels()[3] }}</span>
          </div>
          <div
            class="domain-scroll"
            [style.max-height.rem]="VISIBLE_ROWS * ROW_HEIGHT_REM"
          >
            <ul class="domain-rows">
              @for (row of section().rows; track row.id) {
                <li>
                  <a
                    class="row-cols row-link"
                    [routerLink]="row.route ?? section().route"
                    [queryParams]="row.routeQuery ?? section().routeQuery ?? null"
                  >
                    <span class="cell primary">{{ row.primary }}</span>
                    <span class="cell secondary">{{ row.secondary || '—' }}</span>
                    <span class="cell meta">{{ row.meta || '—' }}</span>
                    @if (row.badge) {
                      <span class="cell badge" [class]="row.tone ?? 'neutral'">{{ row.badge }}</span>
                    } @else {
                      <span class="cell badge neutral">—</span>
                    }
                  </a>
                </li>
              }
            </ul>
          </div>
        </div>
      } @else {
        <p class="domain-empty">Aucun élément</p>
      }
    </article>
  `,
  styles: [`
    .domain-panel {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      min-width: 0;
    }

    .domain-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-2);
      min-width: 0;
    }

    .domain-title-line {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.35rem 0.5rem;
      min-width: 0;
      flex: 1;
    }

    .domain-code {
      flex-shrink: 0;
      font-family: var(--font-mono);
      font-size: 0.58rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      padding: 0.1rem 0.32rem;
      border-radius: var(--radius-sm);
      background: var(--bg-secondary);
      color: var(--text-muted);
    }

    .domain-title {
      margin: 0;
      font-size: 0.8rem;
      font-weight: var(--fw-bold);
      white-space: nowrap;
    }

    .domain-count {
      flex-shrink: 0;
      font-size: 0.95rem;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      line-height: 1;
    }

    .metric-inline {
      display: inline-flex;
      align-items: baseline;
      gap: 0.25rem;
      font-size: 0.65rem;
      white-space: nowrap;
    }

    .metric-lbl {
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--text-muted);
    }

    .metric-val {
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: var(--text-secondary);
    }

    .metric-inline.highlight .metric-val { color: var(--accent-primary); }

    .spark { flex-shrink: 0; margin-left: auto; }

    .domain-link {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.4rem;
      height: 1.4rem;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--accent-primary);
      text-decoration: none;
      background: color-mix(in srgb, var(--accent-primary) 10%, transparent);
    }

    .domain-link:hover { text-decoration: none; background: color-mix(in srgb, var(--accent-primary) 16%, transparent); }

    .domain-table {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background: color-mix(in srgb, var(--bg-secondary) 40%, transparent);
      overflow: hidden;
    }

    .domain-scroll {
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    .row-cols {
      display: grid;
      grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr) minmax(0, 0.85fr) minmax(0, 4.2rem);
      gap: 0.35rem;
      align-items: center;
      padding: 0.2rem 0.45rem;
      font-size: 0.68rem;
      min-width: 0;
    }

    .row-cols.head {
      font-size: 0.58rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-muted);
      background: var(--bg-elevated);
      border-bottom: 1px solid var(--border-color);
    }

    .domain-rows {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .domain-rows li {
      border-bottom: 1px solid var(--border-color);
    }

    .domain-rows li:last-child { border-bottom: none; }

    .row-link {
      color: inherit;
      text-decoration: none;
      transition: background var(--transition);
    }

    .row-link:hover {
      background: var(--bg-hover);
      text-decoration: none;
    }

    .cell {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .cell.primary { font-weight: 600; }
    .cell.secondary { color: var(--text-secondary); }
    .cell.meta { color: var(--text-muted); font-variant-numeric: tabular-nums; }

    .cell.badge {
      justify-self: end;
      font-size: 0.56rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      padding: 0.08rem 0.3rem;
      border-radius: var(--radius-sm);
      text-align: center;
      background: var(--bg-secondary);
      color: var(--text-secondary);
    }

    .cell.badge.success {
      background: color-mix(in srgb, var(--accent-primary) 14%, transparent);
      color: var(--accent-primary);
    }

    .cell.badge.warning {
      background: color-mix(in srgb, var(--accent-warning) 14%, transparent);
      color: var(--accent-warning);
    }

    .cell.badge.danger {
      background: color-mix(in srgb, var(--accent-danger, #e5484d) 14%, transparent);
      color: var(--accent-danger, #e5484d);
    }

    .domain-empty {
      margin: 0;
      font-size: 0.72rem;
      color: var(--text-muted);
    }
  `],
})
export class DashboardDomainPanelComponent {
  readonly section = input.required<DashboardDomainSection>();

  protected readonly VISIBLE_ROWS = VISIBLE_ROWS;
  protected readonly ROW_HEIGHT_REM = ROW_HEIGHT_REM;

  colLabels(): [string, string, string, string] {
    switch (this.section().id) {
      case 'agents':
        return ['Agent', 'Équipe', 'Performance', 'État'];
      case 'tickets':
        return ['Sujet', 'Client', 'Priorité', 'Statut'];
      case 'clients':
        return ['Client', 'Contact', 'Secteur', 'Statut'];
      case 'invoices':
        return ['Référence', 'Client', 'Montant', 'Statut'];
      case 'opportunities':
        return ['Opportunité', 'Client', 'Montant', 'Étape'];
      case 'leads':
        return ['Entreprise', 'Contact', 'Source', 'Score'];
      default:
        return ['Libellé', 'Détail', 'Info', 'Statut'];
    }
  }
}
