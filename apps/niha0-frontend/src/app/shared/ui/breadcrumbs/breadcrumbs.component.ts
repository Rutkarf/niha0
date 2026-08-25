import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

interface Crumb {
  label: string;
  route: string | null;
}

const LABEL_MAP: Record<string, string> = {
  dashboard: 'Dashboard',
  crm: 'CRM',
  sales: 'Ventes',
  'customer-relations': 'Support',
  marketing: 'Marketing',
  accounting: 'Comptabilité',
  administration: 'ERP',
  hcm: 'RH',
  legal: 'Juridique',
  wms: 'Stock',
  bi: 'Analytics',
  bpm: 'Stratégie',
  'ai-center': 'AI Center',
  'ai-office': 'AI Office',
  audit: 'Audit',
  settings: 'Paramètres',
  notifications: 'Notifications',
  workspace: 'Workspace',
  'company-data': 'Données entreprise',
  help: 'Aide',
  feedback: 'Feedback',
  changelog: 'Changelog',
  onboarding: 'Onboarding',
  cms: 'CMS',
  pim: 'PIM',
  scm: 'SCM',
  mrp: 'MRP',
  etl: 'ETL',
  edi: 'EDI',
  chat: 'Chat',
  studio: 'Studio',
  marketplace: 'Marketplace',
  runtime: 'Runtime',
  governance: 'Gouvernance',
};

@Component({
  selector: 'app-breadcrumbs',
  imports: [RouterLink],
  template: `
    @if (crumbs().length > 1) {
      <nav class="crumbs" aria-label="Fil d’Ariane">
        <ol>
          @for (c of crumbs(); track c.label + (c.route ?? ''); let last = $last) {
            <li>
              @if (!last && c.route) {
                <a [routerLink]="c.route">{{ c.label }}</a>
              } @else {
                <span [attr.aria-current]="last ? 'page' : null">{{ c.label }}</span>
              }
              @if (!last) {
                <span class="sep" aria-hidden="true">/</span>
              }
            </li>
          }
        </ol>
      </nav>
    }
  `,
  styles: `
    .crumbs {
      margin: 0 0 var(--space-3);
      font-size: var(--fs-sm);
    }
    ol {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1);
      list-style: none;
      margin: 0;
      padding: 0;
      align-items: center;
    }
    li {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      color: var(--text-muted);
    }
    a {
      color: var(--text-secondary);
      text-decoration: none;
      font-weight: var(--fw-medium);
    }
    a:hover {
      color: var(--accent-primary);
      text-decoration: none;
    }
    [aria-current='page'] {
      color: var(--text-primary);
      font-weight: var(--fw-semibold);
    }
    .sep {
      color: var(--text-muted);
      opacity: 0.7;
    }
  `,
})
export class BreadcrumbsComponent {
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly crumbs = computed(() => this.buildCrumbs(this.url()));

  private buildCrumbs(rawUrl: string): Crumb[] {
    const path = rawUrl.split('?')[0] ?? '';
    if (!path.startsWith('/app')) return [];
    const segments = path.split('/').filter(Boolean);
    // ['app', 'crm'] …
    const crumbs: Crumb[] = [{ label: 'Accueil', route: '/app/dashboard' }];
    let acc = '';
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]!;
      acc += `/${seg}`;
      if (seg === 'app') continue;
      const label = LABEL_MAP[seg] ?? this.humanize(seg);
      const isLast = i === segments.length - 1;
      crumbs.push({ label, route: isLast ? null : acc });
    }
    return crumbs;
  }

  private humanize(seg: string): string {
    return seg
      .split('-')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  }
}
