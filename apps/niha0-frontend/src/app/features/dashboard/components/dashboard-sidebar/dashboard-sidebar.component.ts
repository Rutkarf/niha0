import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { DashboardSection } from '../../models/dashboard.models';

interface NavItem {
  id: DashboardSection | 'ai-office';
  label: string;
  icon: string;
  external?: boolean;
}

@Component({
  selector: 'app-dashboard-sidebar',
  imports: [RouterLink],
  template: `
    <aside class="dash-sidebar" aria-label="Navigation dashboard Nihao">
      <div class="brand">
        <span class="logo" aria-hidden="true">◈</span>
        <div>
          <strong>Nihao</strong>
          <span class="sub">Dashboard</span>
        </div>
      </div>

      <nav class="nav">
        @for (item of items; track item.id) {
          @if (item.external) {
            <a routerLink="/app/ai-office" class="nav-item" (click)="navigate.emit('home')">
              <span class="ico" aria-hidden="true">{{ item.icon }}</span>
              {{ item.label }}
            </a>
          } @else {
            <button
              type="button"
              class="nav-item"
              [class.active]="active() === item.id"
              [attr.aria-current]="active() === item.id ? 'page' : null"
              (click)="selectSection(item.id)"
            >
              <span class="ico" aria-hidden="true">{{ item.icon }}</span>
              {{ item.label }}
            </button>
          }
        }
      </nav>

      <div class="sidebar-foot">
        <a routerLink="/app/help" class="foot-link">Documentation</a>
        <a routerLink="/app/settings" class="foot-link">Paramètres org.</a>
      </div>
    </aside>
  `,
  styles: [`
    .dash-sidebar {
      width: 220px;
      flex-shrink: 0;
      border-right: 1px solid var(--border-color);
      background: color-mix(in srgb, var(--bg-elevated) 88%, transparent);
      padding: var(--space-4) var(--space-3);
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      position: sticky;
      top: 0;
      align-self: flex-start;
      max-height: calc(100vh - var(--header-height, 58px));
      overflow-y: auto;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: 0 var(--space-2);
    }

    .logo {
      font-size: 1.25rem;
      color: var(--accent-primary);
    }

    .brand strong {
      display: block;
      font-size: var(--fs-sm);
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .sub {
      font-size: 0.68rem;
      color: var(--text-muted);
    }

    .nav {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      width: 100%;
      padding: 0.55rem 0.65rem;
      border: none;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--text-secondary);
      font-size: 0.82rem;
      font-weight: 600;
      text-align: left;
      text-decoration: none;
      cursor: pointer;
      transition: background var(--transition), color var(--transition);
    }

    .nav-item:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
      text-decoration: none;
    }

    .nav-item.active {
      background: color-mix(in srgb, var(--accent-primary) 14%, transparent);
      color: var(--accent-primary);
      border: 1px solid color-mix(in srgb, var(--accent-primary) 28%, transparent);
    }

    .ico {
      width: 1.1rem;
      text-align: center;
      opacity: 0.85;
    }

    .sidebar-foot {
      margin-top: auto;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      padding-top: var(--space-3);
      border-top: 1px solid var(--border-color);
    }

    .foot-link {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-decoration: none;
      padding: 0.25rem 0.5rem;
    }

    .foot-link:hover {
      color: var(--accent-primary);
      text-decoration: none;
    }

    @media (max-width: 960px) {
      .dash-sidebar {
        width: 100%;
        position: static;
        max-height: none;
        border-right: none;
        border-bottom: 1px solid var(--border-color);
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
      }

      .nav {
        flex-direction: row;
        flex-wrap: wrap;
        flex: 1;
      }

      .sidebar-foot {
        flex-direction: row;
        margin-top: 0;
        border-top: none;
        padding-top: 0;
      }
    }
  `],
})
export class DashboardSidebarComponent {
  readonly active = input.required<DashboardSection>();
  readonly navigate = output<DashboardSection>();

  readonly items: NavItem[] = [
    { id: 'ai-office', label: 'Accueil (vue 3D Nihao)', icon: '◈', external: true },
    { id: 'home', label: 'Vue d’ensemble', icon: '⌂' },
    { id: 'agents', label: 'Agents (50)', icon: '◎' },
    { id: 'teams', label: 'Équipes (10)', icon: '▦' },
    { id: 'chiefs', label: 'Chefs (10)', icon: '★' },
    { id: 'analytics', label: 'Analytics', icon: '▤' },
    { id: 'settings', label: 'Paramètres', icon: '⚙' },
    { id: 'help', label: 'Aide', icon: '?' },
  ];

  selectSection(id: DashboardSection | 'ai-office'): void {
    if (id === 'ai-office') return;
    this.navigate.emit(id);
  }
}
