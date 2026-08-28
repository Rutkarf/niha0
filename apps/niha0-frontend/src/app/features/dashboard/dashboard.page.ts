import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api/api.service';
import { DashboardKpis } from '../../core/api/api.models';
import { TenancyService } from '../../core/tenancy/tenancy.service';
import { AgentStatusService } from '../../core/navigation/agent-status.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { DashboardHomeComponent } from './components/dashboard-home/dashboard-home.component';
import { DashboardAgentsComponent } from './components/dashboard-agents/dashboard-agents.component';
import { DashboardTeamsComponent } from './components/dashboard-teams/dashboard-teams.component';
import { DashboardChiefsComponent } from './components/dashboard-chiefs/dashboard-chiefs.component';
import { DashboardAnalyticsComponent } from './components/dashboard-analytics/dashboard-analytics.component';
import { DashboardSettingsComponent } from './components/dashboard-settings/dashboard-settings.component';
import { DashboardHelpComponent } from './components/dashboard-help/dashboard-help.component';
import { DashboardDetailModalComponent } from './components/dashboard-detail-modal/dashboard-detail-modal.component';
import { DashboardPreferencesService } from './services/dashboard-preferences.service';
import type {
  DashboardAgent,
  DashboardSection,
  DashboardTeam,
} from './models/dashboard.models';

type PeriodKey = 'today' | '7d' | '30d';

const SECTION_LABELS: Record<DashboardSection, string> = {
  home: 'Vue d’ensemble',
  agents: 'Agents Nihao',
  teams: 'Équipes',
  chiefs: 'Chefs de pôle',
  analytics: 'Analytics',
  settings: 'Paramètres',
  help: 'Aide',
};

const SECTION_DESCRIPTIONS: Record<DashboardSection, string> = {
  home: 'Vue d’ensemble des KPIs',
  agents: '40 membres · 10 chefs (onglet Chefs)',
  teams: '10 équipes Nihao · stats et détails',
  chiefs: '10 chefs sur la plateforme murale',
  analytics: 'KPIs Nihao et graphiques',
  settings: 'Préférences d’affichage et configuration',
  help: 'Documentation et raccourcis',
};

@Component({
  selector: 'app-dashboard-page',
  imports: [
    RouterLink,
    FormsModule,
    DashboardHomeComponent,
    DashboardAgentsComponent,
    DashboardTeamsComponent,
    DashboardChiefsComponent,
    DashboardAnalyticsComponent,
    DashboardSettingsComponent,
    DashboardHelpComponent,
    DashboardDetailModalComponent,
  ],
  template: `
    <div class="page dashboard-page">
      <header class="dash-sticky-head">
        <div class="dash-row-main">
          <a routerLink="/app/ai-office" class="dash-left back-ao">← AI Office</a>
          <div class="dash-title-block">
            <h1 class="dash-center">Dashboard</h1>
            <p class="dash-row-sub">
              @if (section() === 'home') {
                {{ tenancy.companyLabel() }}
              } @else {
                {{ sectionDescription() }} · {{ tenancy.companyLabel() }}
              }
            </p>
          </div>
          <div class="dash-right">
            <nav class="dash-crumb" aria-label="Fil d'Ariane">
              <a routerLink="/app/dashboard" [queryParams]="{ section: null }" queryParamsHandling="merge" (click)="goHome()">Accueil</a>
              <span class="crumb-sep" aria-hidden="true">/</span>
              @if (section() === 'home') {
                <span aria-current="page">Dashboard</span>
              } @else {
                <a routerLink="/app/dashboard" [queryParams]="{ section: null }" queryParamsHandling="merge" (click)="goHome()">Dashboard</a>
                <span class="crumb-sep" aria-hidden="true">/</span>
                <span aria-current="page">{{ sectionLabel() }}</span>
              }
            </nav>
            @if (showPeriod()) {
              <div class="period-group" role="group" aria-label="Période">
                @for (p of periods; track p.key) {
                  <button
                    type="button"
                    class="period-btn"
                    [class.active]="period() === p.key"
                    [attr.aria-pressed]="period() === p.key"
                    (click)="period.set(p.key)"
                  >
                    {{ p.label }}
                  </button>
                }
              </div>
            }
          </div>
        </div>
      </header>

      <div class="dash-view">
        @if (section() !== 'home') {
          <button type="button" class="back-chip" (click)="goHome()">← Vue d’ensemble</button>
        }

        @switch (section()) {
          @case ('home') {
            <app-dashboard-home
              [loading]="loading()"
              [kpis]="kpis()"
              [period]="period()"
              (navigate)="goSection($event)"
            />
          }
          @case ('agents') {
            <app-dashboard-agents (view)="openAgent($event)" />
          }
          @case ('teams') {
            <app-dashboard-teams
              [highPerformersOnly]="prefs().showHighPerformers"
              [cardSize]="prefs().cardSize"
              (view)="openTeam($event)"
              (toggleHighPerformers)="togglePref('showHighPerformers')"
            />
          }
          @case ('chiefs') {
            <app-dashboard-chiefs (view)="openAgent($event)" />
          }
          @case ('analytics') {
            <app-dashboard-analytics [kpis]="kpis()" [period]="period()" />
          }
          @case ('settings') {
            <app-dashboard-settings />
          }
          @case ('help') {
            <app-dashboard-help />
          }
        }
      </div>

      <app-dashboard-detail-modal
        [open]="modalOpen()"
        [agent]="modalAgent()"
        [team]="modalTeam()"
        (close)="closeModal()"
        (action)="onModalAction($event)"
      />
    </div>
  `,
  styles: [`
    .dashboard-page {
      --dash-band-gap: var(--space-5);
      --dash-inline-gap: calc(var(--dash-band-gap) / 2);
      padding-top: var(--dash-band-gap);
      max-width: var(--page-max-width);
    }

    .dash-sticky-head {
      position: sticky;
      top: 0;
      z-index: calc(var(--z-sticky, 20) - 2);
      margin: 0 calc(-1 * var(--space-5)) var(--dash-band-gap);
      padding: var(--dash-inline-gap) var(--space-5);
      background: color-mix(in srgb, var(--bg-secondary) 97%, transparent);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-color);
    }

    .dash-row-main {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
      align-items: center;
      gap: var(--dash-inline-gap);
    }

    .dash-left { justify-self: start; white-space: nowrap; }

    .dash-title-block { text-align: center; }

    .dash-center {
      margin: 0;
      font-size: clamp(0.95rem, 0.85rem + 0.35vw, 1.1rem);
      font-weight: var(--fw-extrabold);
      letter-spacing: 0.18em;
      text-transform: uppercase;
      line-height: 1.2;
    }

    .dash-row-sub {
      margin: 0.25rem 0 0;
      font-size: var(--fs-sm);
      color: var(--text-secondary);
    }

    .dash-right {
      justify-self: end;
      display: inline-flex;
      align-items: center;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: var(--dash-inline-gap);
      font-size: var(--fs-sm);
      color: var(--text-muted);
    }

    .dash-crumb {
      display: inline-flex;
      align-items: center;
      flex-wrap: wrap;
      gap: calc(var(--dash-inline-gap) / 2);
    }

    .dash-crumb a {
      color: var(--text-secondary);
      text-decoration: none;
      font-weight: var(--fw-medium);
    }

    .dash-crumb a:hover { color: var(--accent-primary); text-decoration: none; }
    .dash-crumb [aria-current='page'] { color: var(--text-primary); font-weight: var(--fw-semibold); }
    .crumb-sep { opacity: 0.65; }

    .period-group {
      display: inline-flex;
      gap: 0.2rem;
    }

    .period-btn {
      border: 1px solid var(--border-color);
      background: transparent;
      color: var(--text-secondary);
      font-size: 0.62rem;
      font-weight: 600;
      padding: 0.2rem 0.45rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      white-space: nowrap;
    }

    .period-btn.active {
      border-color: color-mix(in srgb, var(--accent-primary) 45%, transparent);
      background: color-mix(in srgb, var(--accent-primary) 10%, transparent);
      color: var(--accent-primary);
    }

    .back-chip {
      display: inline-flex;
      align-items: center;
      margin-bottom: var(--dash-inline-gap);
      padding: 0.25rem 0.55rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background: var(--bg-elevated);
      color: var(--text-secondary);
      font-size: 0.72rem;
      font-weight: 600;
      cursor: pointer;
    }

    .back-chip:hover {
      color: var(--accent-primary);
      border-color: color-mix(in srgb, var(--accent-primary) 35%, var(--border-color));
    }

    .dash-view { animation: page-in var(--duration-slow) var(--ease-standard) both; }
@media (max-width: 720px) {
      .dash-sticky-head {
        margin-inline: calc(-1 * var(--space-3));
        padding-inline: var(--space-3);
      }

      .dash-row-main {
        grid-template-columns: 1fr 1fr;
        grid-template-areas: 'back title' 'crumbs crumbs';
      }

      .dash-left { grid-area: back; }
      .dash-title-block { grid-area: title; justify-self: end; text-align: right; }
      .dash-right { grid-area: crumbs; justify-self: stretch; justify-content: flex-end; }
    }
  `],
})
export class DashboardPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly prefService = inject(DashboardPreferencesService);

  readonly tenancy = inject(TenancyService);
  readonly agents = inject(AgentStatusService);
  readonly prefs = this.prefService.prefs;

  readonly loading = signal(true);
  readonly kpis = signal<DashboardKpis | null>(null);
  readonly period = signal<PeriodKey>('7d');
  readonly section = signal<DashboardSection>('home');

  readonly modalOpen = signal(false);
  readonly modalAgent = signal<DashboardAgent | null>(null);
  readonly modalTeam = signal<DashboardTeam | null>(null);

  readonly periods = [
    { key: 'today' as const, label: "Aujourd'hui" },
    { key: '7d' as const, label: '7j' },
    { key: '30d' as const, label: '30j' },
  ];

  readonly sectionLabel = computed(() => SECTION_LABELS[this.section()]);
  readonly sectionDescription = computed(() => SECTION_DESCRIPTIONS[this.section()]);

  readonly showPeriod = computed(() => ['home', 'analytics'].includes(this.section()));

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const s = params.get('section') as DashboardSection | null;
      if (s && s in SECTION_LABELS) this.section.set(s);
      else this.section.set('home');
    });

    this.api.getDashboardKpis().subscribe({
      next: (data) => {
        this.kpis.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goSection(section: DashboardSection): void {
    this.section.set(section);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { section: section === 'home' ? null : section },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  goHome(): void {
    this.goSection('home');
  }

  togglePref(key: 'showHighPerformers'): void {
    this.prefService.update({ [key]: !this.prefs()[key] });
  }

  openAgent(agent: DashboardAgent): void {
    this.modalAgent.set(agent);
    this.modalTeam.set(null);
    this.modalOpen.set(true);
  }

  openTeam(team: DashboardTeam): void {
    this.modalTeam.set(team);
    this.modalAgent.set(null);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.modalAgent.set(null);
    this.modalTeam.set(null);
  }

  onModalAction(action: string): void {
    if (action.startsWith('team-')) {
      this.closeModal();
      this.goSection('teams');
      return;
    }
    this.toast.show(
      action === 'contact'
        ? 'Demande de contact envoyée (simulation).'
        : action === 'assign'
          ? 'Assignation de tâche ouverte (simulation).'
          : 'Rapport généré (simulation).',
      'info',
    );
  }
}
