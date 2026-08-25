import { Component, computed, HostListener, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface QuickLink {
  label: string;
  route: string;
  keywords: string;
}

const LINKS: QuickLink[] = [
  { label: 'Dashboard', route: '/app/dashboard', keywords: 'accueil kpi' },
  { label: 'CRM', route: '/app/crm', keywords: 'clients' },
  { label: 'Ventes', route: '/app/sales', keywords: 'pipeline opportunités leads' },
  { label: 'Support', route: '/app/customer-relations', keywords: 'tickets' },
  { label: 'Comptabilité', route: '/app/accounting', keywords: 'factures paiements' },
  { label: 'RH', route: '/app/hcm', keywords: 'employés congés' },
  { label: 'Stock', route: '/app/wms', keywords: 'inventaire' },
  { label: 'AI Center', route: '/app/ai-center', keywords: 'agents ia' },
  { label: 'AI Office', route: '/app/ai-office', keywords: 'bureau 3d' },
  { label: 'Notifications', route: '/app/notifications', keywords: 'alertes' },
  { label: 'Paramètres', route: '/app/settings', keywords: 'profil thème billing' },
  { label: 'Aide', route: '/app/help', keywords: 'faq documentation' },
  { label: 'Audit', route: '/app/audit', keywords: 'logs journal' },
  { label: 'Workspace', route: '/app/workspace', keywords: 'branding' },
];

@Component({
  selector: 'app-global-search',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="wrap">
      <button type="button" class="trigger" (click)="open.set(true)" aria-haspopup="dialog" [attr.aria-expanded]="open()">
        <span aria-hidden="true">⌕</span>
        <span class="hint">Rechercher</span>
        <kbd>Ctrl K</kbd>
      </button>
      @if (open()) {
        <div class="overlay" role="presentation" (click)="close()">
          <div
            class="panel"
            role="dialog"
            aria-modal="true"
            aria-label="Recherche globale"
            (click)="$event.stopPropagation()"
          >
            <input
              class="input"
              type="search"
              placeholder="Aller à un module…"
              [(ngModel)]="q"
              (ngModelChange)="query.set($event)"
              #searchInput
            />
            <ul>
              @for (l of filtered(); track l.route) {
                <li>
                  <a [routerLink]="l.route" (click)="close()">{{ l.label }}</a>
                </li>
              } @empty {
                <li class="empty">Aucun résultat</li>
              }
            </ul>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .trigger {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      height: 36px;
      padding: 0 0.65rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      background: var(--bg-elevated);
      color: var(--text-secondary);
      cursor: pointer;
      font-size: var(--fs-sm);
    }
    .hint { display: none; }
    kbd {
      font-family: var(--font-mono);
      font-size: 0.62rem;
      opacity: 0.7;
      border: 1px solid var(--border-color);
      border-radius: 3px;
      padding: 0 0.25rem;
    }
    .overlay {
      position: fixed;
      inset: 0;
      z-index: var(--z-modal);
      background: var(--overlay-scrim);
      display: grid;
      place-items: start center;
      padding-top: 12vh;
    }
    .panel {
      width: min(440px, calc(100vw - 2rem));
      background: var(--bg-elevated);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      padding: var(--space-3);
    }
    ul { list-style: none; margin: var(--space-2) 0 0; padding: 0; max-height: 280px; overflow: auto; }
    li a {
      display: block;
      padding: 0.55rem 0.65rem;
      border-radius: var(--radius-sm);
      color: var(--text-primary);
      text-decoration: none;
      font-weight: 600;
      font-size: var(--fs-md);
    }
    li a:hover { background: var(--bg-hover); text-decoration: none; }
    .empty { padding: 0.75rem; color: var(--text-muted); font-size: var(--fs-sm); }
    @media (min-width: 900px) {
      .hint { display: inline; }
    }
  `,
})
export class GlobalSearchComponent {
  readonly open = signal(false);
  readonly query = signal('');
  q = '';

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return LINKS.slice(0, 8);
    return LINKS.filter(
      (l) => l.label.toLowerCase().includes(q) || l.keywords.includes(q) || l.route.includes(q),
    );
  });

  close(): void {
    this.open.set(false);
    this.query.set('');
    this.q = '';
  }

  @HostListener('window:keydown', ['$event'])
  onKey(ev: KeyboardEvent): void {
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
      ev.preventDefault();
      this.open.set(true);
    }
    if (ev.key === 'Escape' && this.open()) this.close();
  }
}
