import { Component, input, output } from '@angular/core';
import type { DashboardSection } from '../../models/dashboard.models';

export interface DashboardNavItem {
  id: DashboardSection;
  label: string;
  badge?: string;
}

@Component({
  selector: 'app-dashboard-nav',
  template: `
    <nav class="dash-nav" aria-label="Sections du dashboard Nihao">
      @for (item of items; track item.id) {
        <button
          type="button"
          class="nav-tab"
          [class.active]="active() === item.id"
          [attr.aria-current]="active() === item.id ? 'page' : null"
          (click)="select(item.id)"
        >
          {{ item.label }}
          @if (item.badge) {
            <span class="count">{{ item.badge }}</span>
          }
        </button>
      }
    </nav>
  `,
  styles: [`
    .dash-nav {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0;
      width: 100%;
      margin-top: var(--space-3);
      border-bottom: 1px solid var(--border-color);
    }

    .nav-tab {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.65rem 0.85rem;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      background: transparent;
      color: var(--text-tertiary);
      font-size: 0.78rem;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      white-space: nowrap;
      transition: color var(--transition), border-color var(--transition);
    }

    .nav-tab:hover {
      color: var(--text-primary);
      text-decoration: none;
    }

    .nav-tab.active {
      color: var(--text-primary);
      font-weight: 700;
      border-bottom-color: var(--accent-primary);
    }

    .count {
      font-size: 0.62rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: var(--text-muted);
    }

    .nav-tab.active .count { color: var(--accent-primary); }

    @media (max-width: 720px) {
      .dash-nav {
        flex-wrap: nowrap;
        overflow-x: auto;
        scrollbar-width: none;
      }

      .dash-nav::-webkit-scrollbar { display: none; }
    }

    :host {
      display: block;
      width: 100%;
    }
  `],
})
export class DashboardNavComponent {
  readonly active = input.required<DashboardSection>();
  readonly navigate = output<DashboardSection>();

  readonly items: DashboardNavItem[] = [
    { id: 'home', label: 'Vue d’ensemble' },
    { id: 'agents', label: 'Agents', badge: '40' },
    { id: 'teams', label: 'Équipes', badge: '10' },
    { id: 'chiefs', label: 'Chefs', badge: '10' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'settings', label: 'Paramètres' },
    { id: 'help', label: 'Aide' },
  ];

  select(id: DashboardSection): void {
    this.navigate.emit(id);
  }
}
