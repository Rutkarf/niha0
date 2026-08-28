import { Component, HostListener, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { RealtimeService } from '../realtime/realtime.service';
import { AgentStatusService } from '../navigation/agent-status.service';
import { ThemeService } from '../theme/theme.service';
import { SidebarComponent } from './sidebar.component';
import { ApprovalNotificationsComponent } from './approval-notifications.component';
import { BreadcrumbsComponent } from '../../shared/ui/breadcrumbs/breadcrumbs.component';
import { GlobalSearchComponent } from '../../shared/ui/global-search/global-search.component';

@Component({
  selector: 'app-shell',
  imports: [
    SidebarComponent,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ApprovalNotificationsComponent,
    BreadcrumbsComponent,
    GlobalSearchComponent,
  ],
  template: `
    <div class="shell" [class.nav-open]="navOpen()">
      @if (navOpen()) {
        <button
          type="button"
          class="nav-scrim"
          aria-label="Fermer le menu"
          (click)="closeNav()"
        ></button>
      }
      <app-sidebar [mobileOpen]="navOpen()" (navigate)="closeNav()" />
      <main class="main" id="main-content" tabindex="-1">
        <header class="topbar" role="banner">
          <div class="topbar-left">
            <button
              type="button"
              class="menu-btn"
              aria-label="Ouvrir le menu de navigation"
              [attr.aria-expanded]="navOpen()"
              (click)="toggleNav()"
            >
              <span aria-hidden="true">☰</span>
            </button>
            @if (auth.user(); as user) {
              <a routerLink="/app/settings" class="user-chip" title="Paramètres" aria-label="Paramètres du compte">
                <span class="avatar" aria-hidden="true">{{ initials(user.firstName, user.lastName) }}</span>
                <span class="meta">
                  <span class="name">{{ user.firstName }} {{ user.lastName }}</span>
                  <span class="role">{{ user.role }}</span>
                </span>
              </a>
            }
            <a routerLink="/app/notifications" class="icon-link" title="Notifications" aria-label="Notifications">
              <span aria-hidden="true">◎</span>
            </a>
            <app-approval-notifications />
            <span class="agent-mini" aria-live="polite" [attr.aria-label]="agentStatusLabel()">
              {{ agents.agents().length }} agents
              @if (agents.pendingCount() > 0) {
                <span class="pending-inline">· {{ agents.pendingCount() }} à valider</span>
              }
            </span>
          </div>
          <div class="topbar-center">
            <app-global-search />
          </div>
          <div class="topbar-right">
            <a
              routerLink="/app/marketplace"
              routerLinkActive="active"
              class="marketplace-link"
              title="Marketplace"
              aria-label="Marketplace"
            >
              <span class="marketplace-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                  <path d="M4 10h16l-1.1 8.2a1 1 0 0 1-1 .8H6.1a1 1 0 0 1-1-.8L4 10Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                  <path d="M8 10V7.2a4 4 0 0 1 8 0V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  <path d="M9 14h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </span>
              <span class="marketplace-label">Marketplace</span>
            </a>
          </div>
        </header>
        <div class="content">
          @if (!onAiOffice() && !onDashboard()) {
            <div class="crumbs-wrap">
              <app-breadcrumbs />
            </div>
          }
          <router-outlet />
        </div>
      </main>

      @if (!onAiOffice()) {
        <a
          routerLink="/app/ai-office"
          class="fab-ai-office"
          title="AI Office (O)"
          aria-label="Ouvrir l'AI Office"
        >
          ◈
          @if (agents.pendingCount() > 0) {
            <span class="fab-badge">{{ agents.pendingCount() }}</span>
          }
        </a>
      }
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      min-height: 100vh;
      height: 100vh;
      background: transparent;
      position: relative;
      overflow: hidden;
    }
    .nav-scrim {
      display: none;
    }
    .main {
      flex: 1;
      min-width: 0;
      min-height: 0;
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .menu-btn {
      display: none;
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      background: var(--bg-elevated);
      color: var(--text-primary);
      cursor: pointer;
      font-size: 1.1rem;
      line-height: 1;
      flex-shrink: 0;
    }
    .menu-btn:focus-visible {
      outline: var(--focus-ring-width) solid var(--focus-ring);
      outline-offset: var(--focus-ring-offset);
    }
    .icon-link {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      background: var(--bg-elevated);
      color: var(--text-secondary);
      display: grid;
      place-items: center;
      text-decoration: none;
      font-size: 0.95rem;
      transition: background var(--transition), color var(--transition);
    }
    .icon-link:hover {
      background: var(--bg-hover);
      color: var(--accent-primary);
      text-decoration: none;
    }
    .topbar {
      height: var(--header-height, 58px);
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
      align-items: center;
      padding: 0 var(--space-5) 0 var(--space-5);
      gap: var(--space-4);
      background: color-mix(in srgb, var(--bg-secondary) 88%, transparent);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: var(--z-sticky);
    }
    .topbar-left, .topbar-center, .topbar-right {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      min-width: 0;
    }
    .topbar-left {
      justify-self: start;
      justify-content: flex-start;
    }
    .topbar-center {
      justify-self: center;
      justify-content: center;
      padding-inline: var(--space-4);
    }
    .topbar-right {
      justify-self: end;
      justify-content: flex-end;
    }
    .marketplace-link {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      height: 36px;
      padding: 0 var(--space-3);
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-strong);
      background: color-mix(in srgb, var(--accent-primary) 10%, var(--bg-elevated));
      color: var(--accent-primary);
      text-decoration: none;
      font-size: var(--fs-sm);
      font-weight: var(--fw-bold);
      white-space: nowrap;
      flex-shrink: 0;
      transition: background var(--transition), box-shadow var(--transition);
    }
    .marketplace-link:hover {
      background: color-mix(in srgb, var(--accent-primary) 18%, var(--bg-elevated));
      text-decoration: none;
    }
    .marketplace-link.active {
      box-shadow: inset 0 0 0 1px var(--accent-primary);
    }
    .marketplace-icon {
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .marketplace-icon svg { display: block; }
    .agent-mini {
      display: inline-flex;
      align-items: center;
      height: 36px;
      padding: 0 var(--space-3);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background: var(--bg-elevated);
      font-size: var(--fs-sm);
      color: var(--text-muted);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .pending-inline { color: var(--accent-warning); font-weight: var(--fw-semibold); }
    .user-chip {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex-shrink: 0;
      padding: var(--space-1) var(--space-2) var(--space-1) var(--space-1);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      text-decoration: none;
      color: inherit;
      transition: border-color var(--transition), background var(--transition);
    }
    .user-chip:hover {
      border-color: var(--border-strong);
      background: var(--bg-hover);
      text-decoration: none;
    }
    .avatar {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-sm);
      display: grid;
      place-items: center;
      font-size: var(--fs-xs);
      font-weight: var(--fw-extrabold);
      letter-spacing: 0.02em;
      background: color-mix(in srgb, var(--accent-primary) 18%, var(--bg-primary));
      color: var(--accent-primary);
    }
    .meta { display: flex; flex-direction: column; line-height: var(--lh-tight); }
    .name { font-size: var(--fs-sm); font-weight: var(--fw-semibold); color: var(--text-primary); }
    .role {
      font-size: var(--fs-xs);
      font-weight: var(--fw-bold);
      letter-spacing: var(--tracking-wide);
      text-transform: uppercase;
      color: var(--text-muted);
    }
    .content {
      flex: 1;
      min-height: 0;
      overflow: auto;
      position: relative;
      display: flex;
      flex-direction: column;
    }
    .crumbs-wrap {
      padding: var(--space-3) var(--space-5) 0;
    }
    .fab-ai-office {
      position: fixed;
      right: var(--space-5);
      bottom: var(--space-5);
      width: 52px;
      height: 52px;
      border-radius: var(--radius-lg);
      display: grid;
      place-items: center;
      background: var(--accent-primary);
      color: var(--on-accent);
      font-size: var(--fs-xl);
      text-decoration: none;
      box-shadow: var(--shadow-lg);
      z-index: var(--z-fab);
      border: 1px solid color-mix(in srgb, var(--accent-primary) 40%, white);
      transition: transform var(--transition), box-shadow var(--transition);
    }
    .fab-ai-office:hover {
      transform: translateY(-2px);
      text-decoration: none;
    }
    .fab-badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: var(--accent-warning);
      color: var(--on-warning);
      font-size: var(--fs-xs);
      font-weight: var(--fw-extrabold);
      min-width: 18px;
      height: 18px;
      border-radius: var(--radius-sm);
      display: grid;
      place-items: center;
      padding: 0 4px;
      border: 2px solid var(--bg-primary);
    }
    @media (max-width: 900px) {
      .menu-btn { display: grid; place-items: center; }
      .nav-scrim {
        display: block;
        position: fixed;
        inset: 0;
        border: none;
        padding: 0;
        margin: 0;
        background: var(--overlay-scrim);
        z-index: calc(var(--z-sidebar) - 1);
        cursor: pointer;
      }
      .agent-mini, .meta .name { display: none; }
    }
    @media (max-width: 800px) {
      .topbar { grid-template-columns: auto 1fr auto; }
      .topbar-center { justify-self: center; }
      .marketplace-label { display: none; }
      .marketplace-link { padding: 0; width: 36px; justify-content: center; }
    }
  `],
})
export class AppShellComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  readonly agents = inject(AgentStatusService);
  private readonly realtime = inject(RealtimeService);
  private readonly router = inject(Router);
  private readonly theme = inject(ThemeService);
  private navSub?: Subscription;

  readonly onAiOffice = signal(false);
  readonly onDashboard = signal(false);
  readonly navOpen = signal(false);

  ngOnInit(): void {
    void this.realtime.connect();
    this.agents.start();
    this.theme.hydrateFromServer();
    this.onAiOffice.set(this.router.url.includes('/app/ai-office'));
    this.onDashboard.set(this.isDashboardRoute(this.router.url));
    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.onAiOffice.set(e.urlAfterRedirects.includes('/app/ai-office'));
        this.onDashboard.set(this.isDashboardRoute(e.urlAfterRedirects));
        this.closeNav();
      });
  }

  private isDashboardRoute(url: string): boolean {
    const path = url.split('?')[0] ?? '';
    return path === '/app/dashboard' || path === '/app/dashboard/';
  }

  ngOnDestroy(): void {
    this.realtime.disconnect();
    this.agents.stop();
    this.navSub?.unsubscribe();
  }

  initials(first?: string, last?: string): string {
    return `${(first?.[0] ?? '').toUpperCase()}${(last?.[0] ?? '').toUpperCase()}` || '·';
  }

  agentStatusLabel(): string {
    const total = this.agents.agents().length;
    const pending = this.agents.pendingCount();
    return pending > 0 ? `${total} agents, ${pending} validation en attente` : `${total} agents actifs`;
  }

  toggleNav(): void {
    this.navOpen.update((v) => !v);
  }

  closeNav(): void {
    this.navOpen.set(false);
  }

  @HostListener('window:keydown', ['$event'])
  onKey(ev: KeyboardEvent): void {
    const tag = (ev.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (ev.target as HTMLElement)?.isContentEditable) return;
    if (ev.key === 'Escape' && this.navOpen()) {
      this.closeNav();
      return;
    }
    if (ev.key === 'o' || ev.key === 'O') {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      ev.preventDefault();
      void this.router.navigateByUrl('/app/ai-office');
    }
  }
}
