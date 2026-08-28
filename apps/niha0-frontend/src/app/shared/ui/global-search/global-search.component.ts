import {
  Component,
  ElementRef,
  HostListener,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FocusTrapDirective } from '../../a11y/focus-trap.directive';
import { focusFirstElement } from '../../a11y/focusable.util';

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
  { label: 'Paramètres', route: '/app/settings', keywords: 'profil thème billing mfa équipe sécurité' },
  { label: 'Aide', route: '/app/help', keywords: 'faq documentation raccourcis support guides' },
  { label: 'Audit', route: '/app/audit', keywords: 'logs journal' },
  { label: 'Centre Données', route: '/app/data-hub', keywords: 'bibliothèques cms pim scm' },
  { label: 'Workspace', route: '/app/workspace', keywords: 'branding' },
];

@Component({
  selector: 'app-global-search',
  imports: [FormsModule, RouterLink, FocusTrapDirective],
  template: `
    <div class="wrap">
      <button
        type="button"
        class="trigger"
        (click)="openPalette()"
        aria-haspopup="dialog"
        [attr.aria-expanded]="open()"
        aria-controls="global-search-dialog"
        aria-label="Ouvrir la recherche globale"
      >
        <span aria-hidden="true">⌕</span>
        <span class="hint">Rechercher</span>
        <kbd aria-hidden="true">Ctrl K</kbd>
      </button>
      @if (open()) {
        <div class="overlay" role="presentation" (click)="close()">
          <div
            id="global-search-dialog"
            class="panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="global-search-label"
            [appFocusTrap]="true"
            (click)="$event.stopPropagation()"
          >
            <label id="global-search-label" class="sr-only" for="global-search-input">Recherche globale</label>
            <input
              #searchInput
              id="global-search-input"
              class="input"
              type="search"
              placeholder="Aller à un module…"
              autocomplete="off"
              [(ngModel)]="q"
              (ngModelChange)="query.set($event)"
            />
            <ul role="listbox" aria-label="Résultats de recherche">
              @for (l of filtered(); track l.route) {
                <li role="none">
                  <a [routerLink]="l.route" role="option" (click)="close()">{{ l.label }}</a>
                </li>
              } @empty {
                <li class="empty" role="status">Aucun résultat</li>
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

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private returnFocus: HTMLElement | null = null;

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return LINKS.slice(0, 8);
    return LINKS.filter(
      (l) => l.label.toLowerCase().includes(q) || l.keywords.includes(q) || l.route.includes(q),
    );
  });

  constructor() {
    effect(() => {
      if (!this.open()) return;
      afterNextRender(() => {
        const input = this.searchInput()?.nativeElement;
        if (input) {
          input.focus();
        } else {
          focusFirstElement(document.getElementById('global-search-dialog') as HTMLElement);
        }
      });
    });
  }

  openPalette(): void {
    this.returnFocus = document.activeElement as HTMLElement | null;
    this.open.set(true);
  }

  close(): void {
    this.open.set(false);
    this.query.set('');
    this.q = '';
    this.returnFocus?.focus?.();
    this.returnFocus = null;
  }

  @HostListener('window:keydown', ['$event'])
  onKey(ev: KeyboardEvent): void {
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
      ev.preventDefault();
      if (!this.open()) this.openPalette();
    }
    if (ev.key === 'Escape' && this.open()) this.close();
  }
}
