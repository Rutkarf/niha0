import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ThemeService } from '../theme/theme.service';
import { TenancyService } from '../tenancy/tenancy.service';
import { AgentStatusService } from '../navigation/agent-status.service';
import { accentForAgentCode } from '../navigation/agent-accents';
import { AGENT_MODULE_MAP } from '../navigation/agent-module.map';
import { DATA_LIBRARIES } from '../workspace/workspace-catalog';
import { WorkspaceSelectionService } from '../workspace/workspace-selection.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  soon?: boolean;
  /** Data-library id for 3D sync (Données). */
  libraryId?: string;
  queryParams?: Record<string, string>;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside
      class="sidebar"
      [class.collapsed]="collapsed()"
      [class.mobile-open]="mobileOpen()"
      aria-label="Barre latérale"
    >
      <div class="brand">
        <a routerLink="/app/ai-office" class="logo" title="AI Office" (click)="emitNavigate()">
          <span class="logo-mark">N</span>
          @if (!collapsed()) {
            <span class="logo-text">NIHAO</span>
          }
        </a>
        @if (!collapsed()) {
          <span class="tagline">Network Intelligence Hub Access Open</span>
          <span class="org">{{ tenancy.organizationName() }}</span>
        }
      </div>

      <a
        routerLink="/app/ai-office"
        routerLinkActive="active"
        class="ai-office-link"
        title="AI Office (O)"
        (click)="emitNavigate()"
      >
        <span class="desk-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
            <circle cx="12" cy="7" r="3" stroke="currentColor" stroke-width="1.6"/>
            <path d="M6 19c0-3.2 2.7-5 6-5s6 1.8 6 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M4 21h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        </span>
        @if (!collapsed()) {
          <span class="label">AI Office</span>
          @if (agents.pendingCount() > 0) {
            <span class="badge">{{ agents.pendingCount() }}</span>
          }
        }
      </a>

      <nav class="nav" aria-label="Navigation principale">
        @for (group of navGroups(); track group.title) {
          @if (!collapsed()) {
            <p class="group-title">{{ group.title }}</p>
          }
          @for (item of group.items; track item.label + item.route) {
            <a
              [routerLink]="item.soon && !item.libraryId ? null : item.route"
              [queryParams]="item.queryParams ?? {}"
              [routerLinkActive]="item.libraryId ? '' : 'active'"
              class="nav-item"
              [class.soon]="item.soon"
              [class.library-active]="isLibraryActive(item)"
              [attr.aria-disabled]="item.soon && !item.libraryId ? true : null"
              [title]="item.soon && !item.libraryId ? item.label + ' — Bientôt' : item.label"
              (click)="onItemClick(item, $event)"
            >
              <span class="desk-icon" aria-hidden="true" [style.--agent-accent]="itemAgentAccent(item)">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" class="desk-svg">
                  <circle class="agent-person" cx="12" cy="6.5" r="2.6" stroke-width="1.5" />
                  <path
                    class="agent-person"
                    d="M7 14.5c0-2.4 2.2-3.8 5-3.8s5 1.4 5 3.8"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                  <rect class="agent-desk" x="5" y="16.2" width="14" height="3.2" rx="0.6" stroke-width="1.5" />
                  <path class="agent-desk" d="M8 16.2V15M16 16.2V15" stroke-width="1.5" stroke-linecap="round" />
                </svg>
              </span>
              @if (!collapsed()) {
                <span class="label">{{ item.label }}</span>
                @if (item.soon) {
                  <span class="soon-tag">Bientôt</span>
                }
              }
            </a>
          }
        }
      </nav>

      <div class="sidebar-footer">
        <button
          type="button"
          class="icon-btn"
          (click)="toggle()"
          [attr.aria-expanded]="!collapsed()"
          [title]="collapsed() ? 'Étendre la navigation' : 'Réduire la navigation'"
        >
          {{ collapsed() ? '»' : '«' }}
        </button>
        @if (!collapsed()) {
          <button type="button" class="theme-btn" (click)="theme.cycleMode()">
            Thème · {{ themeLabel() }}
          </button>
          <button type="button" class="logout-btn" (click)="auth.logout()">Déconnexion</button>
        }
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-width, 165px);
      min-width: var(--sidebar-width, 165px);
      max-width: var(--sidebar-width, 165px);
      height: 100vh;
      background: color-mix(in srgb, var(--bg-secondary) 94%, transparent);
      border-right: 1px solid color-mix(in srgb, var(--border-color) 65%, transparent);
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 0;
      z-index: var(--z-sidebar);
      backdrop-filter: blur(8px);
      flex-shrink: 0;
      transition: width var(--transition), min-width var(--transition), max-width var(--transition);
    }
    .sidebar.collapsed {
      width: var(--sidebar-collapsed, 56px);
      min-width: var(--sidebar-collapsed, 56px);
      max-width: var(--sidebar-collapsed, 56px);
    }
    .brand {
      padding: 0.7rem 0.45rem 0.55rem;
      border-bottom: 1px solid color-mix(in srgb, var(--border-color) 55%, transparent);
      min-height: 2.85rem;
    }
    .collapsed .brand { padding: 0.7rem 0.35rem; display: grid; place-items: center; }
    .logo {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      text-decoration: none;
      white-space: nowrap;
    }
    .logo:hover { text-decoration: none; }
    .logo-mark {
      width: 22px;
      height: 22px;
      border-radius: 6px;
      display: grid;
      place-items: center;
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 0.85rem;
      background: var(--accent-primary);
      color: var(--on-accent);
      flex-shrink: 0;
    }
    .logo-text {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 0.82rem;
      letter-spacing: 0.1em;
      color: var(--text-primary);
      white-space: nowrap;
    }
    .tagline {
      display: block;
      font-size: 0.52rem;
      color: var(--text-muted);
      margin-top: 0.35rem;
      line-height: 1.25;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .org {
      display: block;
      font-size: 0.68rem;
      font-weight: 600;
      color: var(--text-secondary);
      margin-top: 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ai-office-link {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      margin: 0.45rem 0.28rem 0.2rem;
      padding: 0.42rem 0.38rem;
      height: 2.1rem;
      border-radius: var(--radius-sm);
      background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
      border: 1px solid var(--border-strong);
      color: var(--accent-primary);
      text-decoration: none;
      font-weight: 700;
      font-size: 0.72rem;
      position: relative;
      white-space: nowrap;
      overflow: hidden;
      transition: background var(--transition), box-shadow var(--transition);
    }
    .collapsed .ai-office-link {
      justify-content: center;
      padding: 0.42rem 0;
    }
    .ai-office-link:hover { text-decoration: none; background: color-mix(in srgb, var(--accent-primary) 18%, transparent); }
    .ai-office-link.active { box-shadow: inset 0 0 0 1px var(--accent-primary); }
    .badge {
      margin-left: auto;
      background: var(--accent-warning);
      color: var(--on-warning);
      font-size: 0.58rem;
      padding: 0.08rem 0.28rem;
      border-radius: var(--radius-sm);
      font-weight: 800;
      flex-shrink: 0;
      white-space: nowrap;
    }
    .nav {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 0.15rem 0.2rem 0.5rem;
      scrollbar-width: thin;
    }
    .group-title {
      margin: 0.5rem 0.28rem 0.15rem;
      font-size: 0.52rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-muted);
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.32rem;
      height: 1.85rem;
      min-height: 1.85rem;
      max-height: 1.85rem;
      padding: 0 0.32rem;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.72rem;
      font-weight: 500;
      margin-bottom: 0.08rem;
      white-space: nowrap;
      overflow: hidden;
      transition: background var(--transition), color var(--transition), box-shadow var(--transition);
    }
    .collapsed .nav-item {
      justify-content: center;
      padding: 0;
    }
    .nav-item:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
      text-decoration: none;
    }
    .nav-item.active,
    .nav-item.library-active {
      background: color-mix(in srgb, var(--accent-primary) 12%, var(--bg-elevated));
      color: var(--accent-primary);
      box-shadow: inset 3px 0 0 var(--accent-primary);
      font-weight: 650;
    }
    .collapsed .nav-item.active,
    .collapsed .nav-item.library-active {
      box-shadow: inset 0 0 0 1px var(--accent-primary);
    }
    .nav-item.soon { opacity: 0.82; }
    .soon-tag {
      margin-left: auto;
      flex-shrink: 0;
      font-size: 0.42rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 0.08rem 0.26rem;
      border-radius: 0.25rem;
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      white-space: nowrap;
      line-height: 1;
    }
    .desk-icon {
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;
      display: grid;
      place-items: center;
      color: var(--text-muted);
      opacity: 1;
    }
    .desk-icon svg { display: block; }
    .desk-svg .agent-person {
      stroke: var(--agent-accent, var(--text-muted));
      fill: none;
    }
    .desk-svg .agent-desk {
      stroke: var(--text-muted);
      fill: none;
      opacity: 0.55;
    }
    .nav-item:hover .desk-svg .agent-desk,
    .nav-item.active .desk-svg .agent-desk,
    .nav-item.library-active .desk-svg .agent-desk {
      opacity: 0.75;
    }
    .nav-item.active .desk-svg .agent-person,
    .nav-item.library-active .desk-svg .agent-person {
      filter: drop-shadow(0 0 3px color-mix(in srgb, var(--agent-accent) 65%, transparent));
    }
    .ai-office-link .desk-icon {
      color: var(--accent-primary);
    }
    .ai-office-link.active .desk-icon {
      filter: drop-shadow(0 0 4px color-mix(in srgb, var(--accent-primary) 55%, transparent));
    }
    .label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      line-height: 1;
    }
    .sidebar-footer {
      padding: 0.32rem 0.28rem;
      border-top: 1px solid color-mix(in srgb, var(--border-color) 55%, transparent);
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .collapsed .sidebar-footer { align-items: center; }
    .icon-btn, .theme-btn, .logout-btn {
      border: 1px solid var(--border-color);
      background: var(--bg-elevated);
      color: var(--text-secondary);
      border-radius: var(--radius-sm);
      padding: 0.32rem 0.35rem;
      cursor: pointer;
      font-size: 0.62rem;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: background var(--transition), color var(--transition);
    }
    .icon-btn:hover, .theme-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
    .logout-btn { color: var(--accent-danger); }
    .logout-btn:hover { background: color-mix(in srgb, var(--accent-danger) 12%, transparent); }
    @media (max-width: 900px) {
      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        transform: translateX(-105%);
        box-shadow: var(--shadow-lg);
        width: min(280px, 86vw);
        min-width: min(280px, 86vw);
        max-width: min(280px, 86vw);
        z-index: var(--z-sidebar);
      }
      .sidebar.collapsed {
        width: min(280px, 86vw);
        min-width: min(280px, 86vw);
        max-width: min(280px, 86vw);
      }
      .sidebar.mobile-open {
        transform: translateX(0);
      }
    }
  `],
})
export class SidebarComponent implements OnInit {
  readonly mobileOpen = input(false);
  readonly navigate = output<void>();

  readonly collapsed = signal(localStorage.getItem('niha0_sidebar_collapsed') === '1');
  private readonly selection = inject(WorkspaceSelectionService);
  private readonly router = inject(Router);

  readonly selectedLibraryId = computed(() => {
    const s = this.selection.selection();
    return s?.kind === 'library' ? s.id : null;
  });

  private readonly baseGroups: NavGroup[] = [
    {
      title: 'Accueil',
      items: [{ label: 'Dashboard', route: '/app/dashboard', icon: 'DB' }],
    },
    {
      title: 'Espace client',
      items: [
        { label: 'CRM', route: '/app/crm', icon: 'CR' },
        { label: 'Ventes', route: '/app/sales', icon: 'VE' },
        { label: 'Support', route: '/app/customer-relations', icon: 'SU' },
        { label: 'Marketing', route: '/app/marketing', icon: 'MK' },
      ],
    },
    {
      title: 'Gestion',
      items: [
        { label: 'ERP', route: '/app/administration', icon: 'ER', soon: true },
        { label: 'Comptabilité', route: '/app/accounting', icon: 'CP' },
        { label: 'RH', route: '/app/hcm', icon: 'RH' },
        { label: 'Juridique', route: '/app/legal', icon: 'JU' },
        { label: 'Stock', route: '/app/wms', icon: 'ST' },
      ],
    },
    {
      title: 'Pilotage',
      items: [
        { label: 'Analytics / BI', route: '/app/bi', icon: 'BI', soon: true },
        { label: 'Stratégie', route: '/app/bpm', icon: 'SG', soon: true },
        { label: 'AI Center', route: '/app/ai-center', icon: 'AI' },
        { label: 'Audit', route: '/app/audit', icon: 'AU' },
      ],
    },
    {
      title: 'Données',
      items: DATA_LIBRARIES.map((lib) => ({
        label: lib.label,
        route: '/app/ai-office',
        icon: lib.icon,
        soon: true,
        libraryId: lib.id,
        queryParams: { library: lib.id },
      })),
    },
    {
      title: 'Système',
      items: [
        { label: 'Workspace', route: '/app/workspace', icon: 'WS' },
        { label: 'Données', route: '/app/company-data', icon: 'DT' },
        { label: 'Notifications', route: '/app/notifications', icon: 'NO' },
        { label: 'Aide', route: '/app/help', icon: 'HP' },
        { label: 'Paramètres', route: '/app/settings', icon: 'PR' },
      ],
    },
  ];

  readonly navGroups = computed(() => {
    if (this.auth.user()?.role !== 'PLATFORM_ADMIN') {
      return this.baseGroups;
    }
    return [
      {
        title: 'Plateforme',
        items: [{ label: 'Console plateforme', route: '/app/platform', icon: 'PF' }],
      },
      ...this.baseGroups,
    ];
  });

  constructor(
    readonly auth: AuthService,
    readonly theme: ThemeService,
    readonly tenancy: TenancyService,
    readonly agents: AgentStatusService,
  ) {}

  ngOnInit(): void {
    this.agents.start();
  }

  themeLabel(): string {
    const m = this.theme.mode();
    if (m === 'AUTO') return 'Auto';
    if (m === 'SOLARPUNK') return 'Solar';
    return 'Night';
  }

  toggle(): void {
    this.collapsed.update((v) => !v);
    localStorage.setItem('niha0_sidebar_collapsed', this.collapsed() ? '1' : '0');
  }

  emitNavigate(): void {
    this.navigate.emit();
  }

  isLibraryActive(item: NavItem): boolean {
    return !!item.libraryId && this.selectedLibraryId() === item.libraryId;
  }

  onItemClick(item: NavItem, ev: Event): void {
    if (item.soon && !item.libraryId) {
      ev.preventDefault();
      return;
    }
    if (!item.libraryId) {
      this.emitNavigate();
      return;
    }
    this.selection.selectLibrary(item.libraryId);
    if (this.router.url.startsWith('/app/ai-office')) {
      ev.preventDefault();
      void this.router.navigate(['/app/ai-office'], {
        queryParams: { library: item.libraryId },
        queryParamsHandling: 'merge',
      });
    }
    this.emitNavigate();
  }

  /** Person color in desk icon — matches 3D agent / library accent. */
  itemAgentAccent(item: NavItem): string {
    if (item.libraryId) {
      const lib = DATA_LIBRARIES.find((l) => l.id === item.libraryId);
      if (lib) return lib.accent;
    }
    const segment = item.route.replace(/^\/app\/?/, '').split('/')[0] ?? '';
    const mapped = AGENT_MODULE_MAP[segment];
    if (mapped) return accentForAgentCode(mapped.code);
    return '#94A3B8';
  }
}
