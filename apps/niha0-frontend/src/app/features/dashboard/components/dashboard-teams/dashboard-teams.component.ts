import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DashboardDataService } from '../../services/dashboard-data.service';
import type { DashboardTeam } from '../../models/dashboard.models';

@Component({
  selector: 'app-dashboard-teams',
  imports: [FormsModule],
  template: `
    <div class="toolbar">
      <input class="input" type="search" placeholder="Rechercher une équipe…" [ngModel]="query()" (ngModelChange)="query.set($event)" />
      <button
        type="button"
        class="filter-chip"
        [class.active]="highPerformersOnly()"
        (click)="toggleHighPerformers.emit()"
      >
        Équipes performantes
      </button>
      <select class="input" [ngModel]="perfFilter()" (ngModelChange)="perfFilter.set($event)">
        <option value="">Performance</option>
        <option value="high">Haute (≥85%)</option>
        <option value="mid">Moyenne (70–84%)</option>
        <option value="low">Basse (&lt;70%)</option>
      </select>
      <select class="input" [ngModel]="sortBy()" (ngModelChange)="sortBy.set($event)">
        <option value="name">Tri : nom</option>
        <option value="performance">Tri : performance</option>
        <option value="agents">Tri : agents</option>
      </select>
    </div>

    <div class="cards" [class.compact]="cardSize() === 'compact'" [class.large]="cardSize() === 'large'">
      @for (t of sorted(); track t.rowId) {
        <article class="card" [style.--team-color]="t.color">
          <header>
            <span class="swatch"></span>
            <div>
              <h3>{{ t.name }}</h3>
              <p>{{ t.chiefTitle }}</p>
            </div>
          </header>
          <dl>
            <div><dt>Agents</dt><dd>{{ t.agentCount }} · {{ t.activeCount }} actifs</dd></div>
            <div><dt>Performance</dt><dd>{{ t.performance }}%</dd></div>
            <div><dt>Tâches</dt><dd>{{ t.tasksInProgress }} en cours</dd></div>
          </dl>
          <footer>
            <button type="button" class="btn btn-primary btn-sm" (click)="view.emit(t)">Voir détails</button>
          </footer>
        </article>
      }
    </div>
  `,
  styles: [`
    .toolbar { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-4); align-items: center; }
    .toolbar .input { min-width: 160px; flex: 1; }
    .filter-chip {
      border: 1px solid var(--border-color);
      background: var(--bg-elevated);
      color: var(--text-secondary);
      font-size: 0.72rem;
      font-weight: 600;
      padding: 0.35rem 0.65rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      white-space: nowrap;
    }
    .filter-chip.active {
      border-color: color-mix(in srgb, var(--accent-primary) 45%, transparent);
      background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
      color: var(--accent-primary);
    }
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: var(--space-3);
    }
    .cards.compact { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
    .cards.large { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
    .card {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      padding: var(--space-3);
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      transition: transform var(--transition), box-shadow var(--transition);
    }
    .card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    header { display: flex; gap: var(--space-2); align-items: flex-start; }
    .swatch {
      width: 0.65rem;
      height: 2.5rem;
      border-radius: var(--radius-sm);
      background: linear-gradient(180deg, var(--team-color), color-mix(in srgb, var(--team-color) 60%, #000));
    }
    h3 { margin: 0; font-size: var(--fs-md); }
    header p { margin: 0.2rem 0 0; font-size: 0.72rem; color: var(--text-muted); }
    dl { display: grid; gap: 0.35rem; margin: 0; }
    dt { font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted); }
    dd { margin: 0; font-size: var(--fs-sm); font-weight: 600; }
    footer { margin-top: auto; }
  `],
})
export class DashboardTeamsComponent {
  private readonly data = inject(DashboardDataService);

  readonly highPerformersOnly = input(false);
  readonly cardSize = input<'compact' | 'normal' | 'large'>('normal');
  readonly view = output<DashboardTeam>();
  readonly toggleHighPerformers = output<void>();

  readonly query = signal('');
  readonly perfFilter = signal('');
  readonly sortBy = signal('name');

  readonly sorted = computed(() => {
    const q = this.query().trim().toLowerCase();
    let list = [...this.data.teams()];
    if (q) list = list.filter((t) => t.name.toLowerCase().includes(q) || t.chiefTitle.toLowerCase().includes(q));
    const perf = this.perfFilter();
    if (perf === 'high' || this.highPerformersOnly()) list = list.filter((t) => t.performance >= 85);
    if (perf === 'mid') list = list.filter((t) => t.performance >= 70 && t.performance < 85);
    if (perf === 'low') list = list.filter((t) => t.performance < 70);
    switch (this.sortBy()) {
      case 'performance':
        list.sort((a, b) => b.performance - a.performance);
        break;
      case 'agents':
        list.sort((a, b) => b.agentCount - a.agentCount);
        break;
      default:
        list.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    }
    return list;
  });
}
