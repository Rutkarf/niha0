import { Component, computed, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DashboardDataService } from '../../services/dashboard-data.service';
import type { DashboardAgent } from '../../models/dashboard.models';

@Component({
  selector: 'app-dashboard-chiefs',
  imports: [RouterLink, FormsModule],
  template: `
    <div class="toolbar">
      <input
        class="input"
        type="search"
        placeholder="Rechercher un chef…"
        [ngModel]="query()"
        (ngModelChange)="query.set($event)"
      />
    </div>
    <p class="intro">10 chefs d'équipe sur la plateforme murale — cliquez pour voir la fiche ou ouvrir la vue 3D.</p>
    <div class="chief-grid">
      @for (c of filtered(); track c.id) {
        <article class="chief-card" [style.--team-color]="c.teamColor">
          <div class="avatar">{{ c.team.slice(0, 2).toUpperCase() }}</div>
          <div class="body">
            <h3>{{ c.name }}</h3>
            <p class="team">{{ c.team }}</p>
            <p class="stat">{{ teamStats(c.rowId).activeCount }}/{{ teamStats(c.rowId).agentCount }} agents actifs · {{ teamStats(c.rowId).performance }}%</p>
            <span class="led" [class]="c.ledStatus"></span>
          </div>
          <div class="actions">
            <button type="button" class="btn btn-primary btn-sm" (click)="view.emit(c)">Voir</button>
            <a class="btn btn-ghost btn-sm" routerLink="/app/ai-office" [queryParams]="{ row: c.rowId, focus: 'chief' }">3D</a>
          </div>
        </article>
      }
    </div>
  `,
  styles: [`
    .toolbar { margin-bottom: var(--space-3); }
    .toolbar .input { width: 100%; max-width: 320px; }
    .intro { font-size: var(--fs-sm); color: var(--text-secondary); margin: 0 0 var(--space-4); }
    .chief-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-3); }
    .chief-card {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: var(--space-3);
      align-items: center;
      padding: var(--space-3);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      border-left: 3px solid var(--team-color);
    }
    .avatar {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: var(--radius-md);
      background: var(--team-color);
      color: #fff;
      display: grid;
      place-items: center;
      font-weight: 800;
      font-size: 0.75rem;
    }
    h3 { margin: 0; font-size: var(--fs-sm); }
    .team { margin: 0.15rem 0; font-size: 0.72rem; color: var(--text-muted); }
    .stat { margin: 0; font-size: 0.72rem; color: var(--text-secondary); }
    .led {
      display: inline-block;
      width: 0.55rem;
      height: 0.55rem;
      border-radius: 50%;
      margin-top: 0.35rem;
    }
    .led.green { background: #2ecc71; }
    .led.red { background: #e74c3c; }
    .led.off { background: var(--text-muted); }
    .actions { display: flex; flex-direction: column; gap: 0.25rem; }
  `],
})
export class DashboardChiefsComponent {
  private readonly data = inject(DashboardDataService);

  readonly view = output<DashboardAgent>();
  readonly query = signal('');

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const list = this.data.chiefs();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.team.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q),
    );
  });

  teamStats(rowId: number) {
    const t = this.data.teamByRow(rowId);
    return {
      activeCount: t?.activeCount ?? 0,
      agentCount: t?.agentCount ?? 0,
      performance: t?.performance ?? 0,
    };
  }
}
