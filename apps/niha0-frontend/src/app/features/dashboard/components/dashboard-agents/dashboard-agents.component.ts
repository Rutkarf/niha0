import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DashboardDataService } from '../../services/dashboard-data.service';
import { DashboardPreferencesService } from '../../services/dashboard-preferences.service';
import type { DashboardAgent } from '../../models/dashboard.models';
import { TEAM_COLORS } from '../../../ai-office/config/team-colors';

@Component({
  selector: 'app-dashboard-agents',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="toolbar">
      <label class="search">
        <span class="sr-only">Rechercher un agent</span>
        <input class="input" type="search" placeholder="Nom, équipe, rôle…" [ngModel]="query()" (ngModelChange)="query.set($event); page.set(1)" />
      </label>
      <label class="filter">
        Équipe
        <select class="input" [ngModel]="teamFilter()" (ngModelChange)="teamFilter.set($event); page.set(1)">
          <option value="">Toutes</option>
          @for (t of teams; track t.row) {
            <option [value]="t.row">{{ t.role }}</option>
          }
        </select>
      </label>
      <label class="filter">
        Statut
        <select class="input" [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event); page.set(1)">
          <option value="">Tous</option>
          <option value="green">Actif (vert)</option>
          <option value="red">Validation (rouge)</option>
          <option value="off">Inactif</option>
        </select>
      </label>
      <label class="filter">
        Par page
        <select class="input" [ngModel]="pageSize()" (ngModelChange)="setPageSize($event)">
          <option [ngValue]="10">10</option>
          <option [ngValue]="25">25</option>
          <option [ngValue]="50">50</option>
        </select>
      </label>
      <label class="toggle-row">
        <input type="checkbox" [ngModel]="prefService.prefs().showOnlyActive" (ngModelChange)="setOnlyActive($event)" />
        Actifs uniquement
      </label>
      <button type="button" class="btn btn-ghost btn-sm" (click)="exportCsv()">Export CSV</button>
    </div>

    <p class="meta">{{ filtered().length }} agent(s) · page {{ page() }}/{{ totalPages() }}</p>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th></th>
            <th><button type="button" class="sort" (click)="sortBy('name')">Nom {{ sortMark('name') }}</button></th>
            <th><button type="button" class="sort" (click)="sortBy('team')">Équipe {{ sortMark('team') }}</button></th>
            <th>Rôle</th>
            <th><button type="button" class="sort" (click)="sortBy('ledStatus')">Statut {{ sortMark('ledStatus') }}</button></th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (a of pageRows(); track a.id) {
            <tr>
              <td><span class="avatar" [style.background]="a.teamColor">{{ a.team.slice(0, 1) }}</span></td>
              <td>
                <strong>{{ a.name }}</strong>
                <span class="code">{{ a.deskCode }}</span>
              </td>
              <td><span class="badge" [style.background]="a.teamColor + '22'" [style.color]="a.teamColor">{{ a.team }}</span></td>
              <td>{{ a.role }}</td>
              <td><span class="led" [class]="a.ledStatus" [title]="a.ledStatus"></span> {{ ledLabel(a.ledStatus) }}</td>
              <td class="actions">
                <button type="button" class="btn btn-ghost btn-sm" (click)="view.emit(a)">Voir</button>
                <a class="btn btn-ghost btn-sm" routerLink="/app/ai-office" [queryParams]="deskParams(a)">3D</a>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="6" class="empty">Aucun agent</td></tr>
          }
        </tbody>
      </table>
    </div>

    @if (totalPages() > 1) {
      <nav class="pager">
        <button type="button" class="btn btn-ghost btn-sm" [disabled]="page() <= 1" (click)="page.set(page() - 1)">Précédent</button>
        <span>{{ page() }} / {{ totalPages() }}</span>
        <button type="button" class="btn btn-ghost btn-sm" [disabled]="page() >= totalPages()" (click)="page.set(page() + 1)">Suivant</button>
      </nav>
    }
  `,
  styles: [`
    .toggle-row {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.72rem;
      color: var(--text-secondary);
      cursor: pointer;
      white-space: nowrap;
    }

    .toolbar { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-3); align-items: end; }
    .search { flex: 1; min-width: 180px; }
    .filter { display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.72rem; color: var(--text-muted); }
    .meta { font-size: var(--fs-sm); color: var(--text-muted); margin: 0 0 var(--space-2); }
    .table-wrap { overflow-x: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-elevated); }
    table { width: 100%; border-collapse: collapse; font-size: var(--fs-sm); }
    th, td { padding: var(--space-3); border-bottom: 1px solid var(--border-color); text-align: left; }
    th { font-size: 0.68rem; text-transform: uppercase; color: var(--text-muted); background: var(--bg-secondary); }
    .sort { border: none; background: transparent; font: inherit; cursor: pointer; color: inherit; text-transform: inherit; }
    .avatar { display: inline-grid; place-items: center; width: 1.6rem; height: 1.6rem; border-radius: 50%; color: #fff; font-weight: 700; font-size: 0.75rem; }
    .code { display: block; font-family: var(--font-mono); font-size: 0.65rem; color: var(--text-muted); }
    .badge { padding: 0.15rem 0.45rem; border-radius: var(--radius-sm); font-size: 0.72rem; font-weight: 700; }
    .led { display: inline-block; width: 0.5rem; height: 0.5rem; border-radius: 50%; margin-right: 0.25rem; vertical-align: middle; }
    .led.green { background: #2ecc71; }
    .led.red { background: #e74c3c; }
    .led.off { background: var(--text-muted); }
    .actions { display: flex; gap: 0.25rem; }
    .empty { text-align: center; color: var(--text-muted); padding: var(--space-5); }
    .pager { display: flex; justify-content: flex-end; align-items: center; gap: var(--space-2); margin-top: var(--space-3); }
`],
})
export class DashboardAgentsComponent {
  private readonly data = inject(DashboardDataService);
  readonly prefService = inject(DashboardPreferencesService);

  readonly view = output<DashboardAgent>();

  readonly teams = TEAM_COLORS;
  readonly query = signal('');
  readonly teamFilter = signal('');
  readonly statusFilter = signal('');
  readonly sortKey = signal<'name' | 'team' | 'ledStatus' | null>('name');
  readonly sortDir = signal<'asc' | 'desc'>('asc');
  readonly page = signal(1);
  readonly pageSize = signal(this.prefService.prefs().agentsPageSize);

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const team = this.teamFilter();
    const status = this.statusFilter();
    let list = this.data.agents().filter((a) => !a.isChief);
    if (q) {
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.team.toLowerCase().includes(q) ||
          a.role.toLowerCase().includes(q) ||
          a.deskCode.toLowerCase().includes(q),
      );
    }
    if (team) list = list.filter((a) => String(a.rowId) === team);
    if (status) list = list.filter((a) => a.ledStatus === status);
    if (this.prefService.prefs().showOnlyActive) list = list.filter((a) => a.ledStatus === 'green');
    const key = this.sortKey();
    const dir = this.sortDir();
    if (key) {
      list = [...list].sort((a, b) => {
        const cmp = String(a[key]).localeCompare(String(b[key]), 'fr');
        return dir === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.pageSize())),
  );

  readonly pageRows = computed(() => {
    const size = this.pageSize();
    const p = Math.min(this.page(), this.totalPages());
    const start = (p - 1) * size;
    return this.filtered().slice(start, start + size);
  });

  sortBy(key: 'name' | 'team' | 'ledStatus'): void {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
    this.page.set(1);
  }

  sortMark(key: string): string {
    if (this.sortKey() !== key) return '↕';
    return this.sortDir() === 'asc' ? '↑' : '↓';
  }

  setPageSize(n: number): void {
    this.pageSize.set(n);
    this.prefService.update({ agentsPageSize: n });
    this.page.set(1);
  }

  setOnlyActive(value: boolean): void {
    this.prefService.update({ showOnlyActive: value });
    this.page.set(1);
  }

  ledLabel(s: string): string {
    return s === 'green' ? 'Actif' : s === 'red' ? 'Validation' : 'Inactif';
  }

  deskParams(a: DashboardAgent): Record<string, string> {
    return { desk: a.deskCode };
  }

  exportCsv(): void {
    const rows = this.filtered();
    const header = ['deskCode', 'name', 'team', 'role', 'ledStatus', 'performance'];
    const lines = [
      header.join(';'),
      ...rows.map((a) =>
        [a.deskCode, a.name, a.team, a.role, a.ledStatus, a.performance].join(';'),
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nihao-agents.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
