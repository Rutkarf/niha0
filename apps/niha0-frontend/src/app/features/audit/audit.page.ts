import { DatePipe, SlicePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import {
  Agent,
  AgentAction,
  AgentApproval,
  AuditLog,
  GuardrailEvent,
  ToolSandboxLog,
} from '../../core/api/api.models';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { FeaturePageHeaderComponent } from '../../shared/ui/feature-page-header/feature-page-header.component';
import { FeatureAgentHostComponent } from '../../shared/ui/feature-agent-host/feature-agent-host.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { mapHttpError } from '../../core/api/http-error.util';
import { DashboardLineChartComponent } from '../dashboard/components/dashboard-line-chart/dashboard-line-chart.component';

type AuditTab = 'overview' | 'journal' | 'decisions' | 'security';
type PeriodKey = 'today' | '7d' | '30d' | 'all';
type ActionCategory = 'auth' | 'agent' | 'crud' | 'billing' | 'other';

const VISIBLE_ROWS = 8;
const ROW_HEIGHT_REM = 2.85;

const TABS: { id: AuditTab; label: string; icon: string; desc: string }[] = [
  { id: 'overview', label: "Vue d'ensemble", icon: '◎', desc: 'Activité & tendances' },
  { id: 'journal', label: 'Journal', icon: '📋', desc: 'Événements immuables' },
  { id: 'decisions', label: 'Décisions IA', icon: '✓', desc: 'Approbations agents' },
  { id: 'security', label: 'Sécurité', icon: '🛡️', desc: 'Guardrails & sandbox' },
];

const PERIODS: { id: PeriodKey; label: string }[] = [
  { id: 'today', label: "Aujourd'hui" },
  { id: '7d', label: '7 jours' },
  { id: '30d', label: '30 jours' },
  { id: 'all', label: 'Tout' },
];

const CATEGORIES: { id: ActionCategory | ''; label: string }[] = [
  { id: '', label: 'Toutes' },
  { id: 'auth', label: 'Auth' },
  { id: 'agent', label: 'Agents IA' },
  { id: 'crud', label: 'Données' },
  { id: 'billing', label: 'Facturation' },
  { id: 'other', label: 'Autre' },
];

function actionCategory(action: string): ActionCategory {
  const a = action.toUpperCase();
  if (a === 'LOGIN' || a.includes('LOGOUT') || a.includes('SSO') || a.includes('AUTH')) return 'auth';
  if (a.startsWith('AGENT_')) return 'agent';
  if (a.includes('CREATE') || a.includes('UPDATE') || a.includes('DELETE')) return 'crud';
  if (a.includes('BILLING') || a.includes('INVOICE') || a.includes('CHECKOUT')) return 'billing';
  return 'other';
}

function isSensitiveAction(action: string): boolean {
  const a = action.toUpperCase();
  return a.includes('DELETE') || a.includes('REJECT') || a.includes('DENIED') || a.includes('BLOCK');
}

function inPeriod(iso: string | undefined, period: PeriodKey): boolean {
  if (!iso || period === 'all') return true;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return true;
  const now = new Date();
  if (period === 'today') return iso.slice(0, 10) === now.toISOString().slice(0, 10);
  const days = period === '7d' ? 7 : 30;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  return d >= cutoff;
}

@Component({
  selector: 'app-audit-page',
  imports: [
    FormsModule,
    DatePipe,
    SlicePipe,
    RouterLink,
    EmptyStateComponent,
    FeaturePageHeaderComponent,
    FeatureAgentHostComponent,
    SkeletonComponent,
    StatusBadgeComponent,
    DashboardLineChartComponent,
  ],
  template: `
    <div class="page feature-module-page audit-page">
      <app-feature-page-header group="Pilotage" title="Audit" backLabel="← AI Office">
        <div actions>
          <a routerLink="/app/governance" class="btn btn-ghost">Gouvernance</a>
          <a routerLink="/app/bpm" class="btn btn-ghost">Stratégie</a>
          <button type="button" class="btn btn-primary" [disabled]="loading()" (click)="refresh()">
            {{ loading() ? '…' : 'Actualiser' }}
          </button>
        </div>
      </app-feature-page-header>

      <app-feature-agent-host
        [agent]="agent()"
        [loading]="loadingAgent()"
        officeQuery="strategie"
        sectionLabel="Traçabilité organisation"
        officeLinkLabel="Audit"
      />

      @if (error()) {
        <p class="error-banner" role="alert">{{ error() }}</p>
      }

      <header class="audit-command">
        <div class="command-main">
          <div class="trail-ring" [attr.data-level]="trailLevel()">
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle cx="60" cy="60" r="52" class="ring-bg" />
              <circle cx="60" cy="60" r="52" class="ring-fill" [attr.stroke-dasharray]="trailDash()" />
            </svg>
            <div class="ring-center">
              <strong>{{ trailScore() }}</strong>
              <span>Couverture</span>
            </div>
          </div>
          <div class="command-meta">
            <h2 class="command-title">Centre d'audit Nihao</h2>
            <p class="command-sub">
              Journal immuable, décisions IA et événements sécurité — posture
              <strong [class]="trailLevel()">{{ trailLabel() }}</strong>
            </p>
            <div class="command-stats">
              <div class="stat-pill">
                <span class="stat-val">{{ logs().length }}</span>
                <span class="stat-lbl">Événements</span>
              </div>
              <div class="stat-pill">
                <span class="stat-val">{{ todayCount() }}</span>
                <span class="stat-lbl">Aujourd'hui</span>
              </div>
              <div class="stat-pill warn">
                <span class="stat-val">{{ sensitiveCount() }}</span>
                <span class="stat-lbl">Sensibles</span>
              </div>
              <div class="stat-pill">
                <span class="stat-val">{{ uniqueUsers() }}</span>
                <span class="stat-lbl">Utilisateurs</span>
              </div>
            </div>
          </div>
        </div>
        <div class="period-row" role="group" aria-label="Période">
          @for (p of periods; track p.id) {
            <button
              type="button"
              class="period-chip"
              [class.active]="period() === p.id"
              (click)="period.set(p.id)"
            >{{ p.label }}</button>
          }
        </div>
      </header>

      <div class="audit-layout">
        <nav class="audit-nav" aria-label="Sections audit">
          @for (t of tabs; track t.id) {
            <button
              type="button"
              class="audit-nav-item"
              [class.active]="tab() === t.id"
              (click)="tab.set(t.id)"
            >
              <span class="nav-icon" aria-hidden="true">{{ t.icon }}</span>
              <span class="nav-text">
                <span class="nav-label">{{ t.label }}</span>
                <span class="nav-desc">{{ t.desc }}</span>
              </span>
              @if (tabBadge(t.id); as badge) {
                <span class="nav-badge">{{ badge }}</span>
              }
            </button>
          }
        </nav>

        <div class="audit-panel">
          @if (loading()) {
            <app-skeleton message="Chargement du centre d'audit…" [lines]="8" />
          } @else if (tab() === 'overview') {
            <section class="overview-grid">
              <article class="feature-hub card span-2">
                <header class="section-toolbar">
                  <h2 class="section-title">Activité</h2>
                  <span class="section-search-spacer"></span>
                  <div class="section-toolbar-end">
                    <span class="section-tag">7 derniers jours</span>
                    <span class="section-count">{{ periodLogs().length }} evt.</span>
                  </div>
                </header>
                @if (activitySeries().every((v) => v === 0)) {
                  <app-empty-state title="Pas encore d'activité" icon="AUD" description="Les événements apparaîtront ici." />
                } @else {
                  <app-dashboard-line-chart [data]="activitySeries()" ariaLabel="Activité audit sur 7 jours" />
                  <div class="activity-labels">
                    @for (lbl of activityLabels(); track lbl) {
                      <span>{{ lbl }}</span>
                    }
                  </div>
                }
              </article>

              <article class="feature-hub card">
                <header class="section-toolbar compact">
                  <h2 class="section-title">Top actions</h2>
                </header>
                <ul class="rank-list">
                  @for (row of topActions(); track row.label) {
                    <li>
                      <span class="rank-label">{{ row.label }}</span>
                      <span class="rank-bar"><span [style.width.%]="row.pct"></span></span>
                      <span class="rank-val">{{ row.count }}</span>
                    </li>
                  } @empty {
                    <li class="rank-empty">—</li>
                  }
                </ul>
              </article>

              <article class="feature-hub card">
                <header class="section-toolbar compact">
                  <h2 class="section-title">Top utilisateurs</h2>
                </header>
                <ul class="rank-list">
                  @for (row of topUsers(); track row.label) {
                    <li>
                      <span class="rank-label mono">{{ row.label | slice: 0 : 8 }}…</span>
                      <span class="rank-bar"><span [style.width.%]="row.pct"></span></span>
                      <span class="rank-val">{{ row.count }}</span>
                    </li>
                  } @empty {
                    <li class="rank-empty">—</li>
                  }
                </ul>
              </article>

              <article class="feature-hub card span-2">
                <header class="section-toolbar">
                  <h2 class="section-title">Événements récents</h2>
                  <span class="section-search-spacer"></span>
                  <button type="button" class="btn btn-ghost btn-sm" (click)="tab.set('journal')">Voir tout →</button>
                </header>
                <div class="recent-feed">
                  @for (log of recentLogs(); track log.id) {
                    <button type="button" class="recent-item" (click)="openLog(log)">
                      <app-status-badge [status]="log.action" />
                      <span class="recent-main">
                        <strong>{{ log.action }}</strong>
                        <span class="recent-sub">{{ log.entityType }} · {{ log.createdAt | date: 'short' }}</span>
                      </span>
                    </button>
                  } @empty {
                    <p class="muted">Aucun événement sur la période.</p>
                  }
                </div>
              </article>
            </section>
          } @else if (tab() === 'journal') {
            <div class="journal-layout">
              <section class="feature-hub card journal-list">
                <header class="section-toolbar" role="toolbar" aria-label="Journal d'audit">
                  <h2 class="section-title">Journal</h2>
                  <label class="section-search">
                    <span class="feature-search-icon" aria-hidden="true">⌕</span>
                    <span class="sr-only">Rechercher</span>
                    <input
                      class="input section-search-input"
                      type="search"
                      placeholder="Action, entité, utilisateur…"
                      [ngModel]="query()"
                      (ngModelChange)="query.set($event)"
                    />
                  </label>
                  <div class="section-toolbar-end">
                    <select class="input filter-select" [ngModel]="userFilter()" (ngModelChange)="userFilter.set($event)">
                      <option value="">Tous utilisateurs</option>
                      @for (u of userIds(); track u) {
                        <option [value]="u">{{ u | slice: 0 : 10 }}…</option>
                      }
                    </select>
                    <button type="button" class="btn btn-ghost btn-sm" (click)="exportCsv()">CSV</button>
                    <button type="button" class="btn btn-ghost btn-sm" (click)="exportJson()">JSON</button>
                    <span class="section-count">{{ filteredLogs().length }}</span>
                  </div>
                </header>

                <div class="filter-row" role="group" aria-label="Catégories">
                  @for (c of categories; track c.id) {
                    <button
                      type="button"
                      class="filter-chip"
                      [class.active]="categoryFilter() === c.id"
                      (click)="categoryFilter.set(c.id)"
                    >{{ c.label }}</button>
                  }
                </div>

                @if (!periodLogs().length) {
                  <app-empty-state
                    title="Aucun événement d'audit"
                    icon="AUD"
                    description="Le journal enregistrera les actions significatives de cette organisation."
                  />
                } @else if (!filteredLogs().length) {
                  <p class="feature-empty-filter">Aucun résultat pour ces filtres.</p>
                } @else {
                  <div class="feature-scroll-table" role="table">
                    <div class="feature-scroll-cols head audit-cols" role="row">
                      <span role="columnheader">Action</span>
                      <span role="columnheader">Entité</span>
                      <span role="columnheader">Utilisateur</span>
                      <span role="columnheader">Date</span>
                    </div>
                    <div class="feature-scroll-body" role="rowgroup" [style.max-height.rem]="visibleRows * rowHeightRem">
                      @for (log of filteredLogs(); track log.id) {
                        <button
                          type="button"
                          class="feature-scroll-cols row audit-cols log-row"
                          [class.active]="selected()?.id === log.id"
                          [class.sensitive]="isSensitive(log.action)"
                          (click)="openLog(log)"
                        >
                          <span class="feature-cell feature-cell-primary" role="cell">
                            <app-status-badge [status]="log.action" />
                          </span>
                          <span class="feature-cell feature-cell-muted" role="cell">
                            {{ log.entityType }}
                            <span class="cell-sub">{{ log.entityId | slice: 0 : 8 }}…</span>
                          </span>
                          <span class="feature-cell feature-cell-muted mono" role="cell">{{ log.userId | slice: 0 : 8 }}…</span>
                          <span class="feature-cell feature-cell-muted" role="cell">{{ log.createdAt | date: 'short' }}</span>
                        </button>
                      }
                    </div>
                  </div>
                }
              </section>

              <section class="feature-hub card journal-detail">
                <header class="section-toolbar compact">
                  <h2 class="section-title">Détail</h2>
                  <span class="section-search-spacer"></span>
                  @if (selected()) {
                    <button type="button" class="btn btn-ghost btn-sm" (click)="selected.set(null)">Fermer</button>
                  }
                </header>
                @if (!selected()) {
                  <app-empty-state
                    title="Sélectionnez un événement"
                    icon="AUD"
                    description="Cliquez sur une ligne du journal pour afficher le détail complet."
                  />
                } @else {
                  <dl class="detail-grid">
                    <dt>Action</dt>
                    <dd><app-status-badge [status]="selected()!.action" /></dd>
                    <dt>Catégorie</dt>
                    <dd>{{ categoryLabel(selected()!.action) }}</dd>
                    <dt>Entité</dt>
                    <dd>{{ selected()!.entityType }}</dd>
                    <dt>ID entité</dt>
                    <dd class="mono-row">
                      <code>{{ selected()!.entityId }}</code>
                      <button type="button" class="btn btn-ghost btn-sm" (click)="copy(selected()!.entityId)">Copier</button>
                    </dd>
                    <dt>Utilisateur</dt>
                    <dd class="mono-row">
                      <code>{{ selected()!.userId }}</code>
                      <button type="button" class="btn btn-ghost btn-sm" (click)="copy(selected()!.userId)">Copier</button>
                    </dd>
                    <dt>Date</dt>
                    <dd>{{ selected()!.createdAt | date: 'medium' }}</dd>
                  </dl>
                  @if (selected()!.details) {
                    <div class="detail-block">
                      <div class="detail-head">
                        <strong>Payload / détails</strong>
                        <button type="button" class="btn btn-ghost btn-sm" (click)="copy(selected()!.details)">Copier</button>
                      </div>
                      <pre>{{ formatDetails(selected()!.details) }}</pre>
                    </div>
                  }
                }
              </section>
            </div>
          } @else if (tab() === 'decisions') {
            <section class="feature-hub card">
              <header class="section-toolbar">
                <h2 class="section-title">Décisions IA</h2>
                <label class="section-search">
                  <span class="feature-search-icon" aria-hidden="true">⌕</span>
                  <input
                    class="input section-search-input"
                    type="search"
                    placeholder="Décision, commentaire…"
                    [ngModel]="decisionQuery()"
                    (ngModelChange)="decisionQuery.set($event)"
                  />
                </label>
                <div class="section-toolbar-end">
                  <span class="section-tag">Validations humaines</span>
                  <span class="section-count">{{ filteredApprovals().length }}</span>
                  <a routerLink="/app/bpm" class="btn btn-ghost btn-sm">Stratégie →</a>
                </div>
              </header>

              @if (!approvals().length) {
                <app-empty-state title="Aucune décision" icon="OKR" description="Les approbations CEO apparaîtront ici." />
              } @else if (!filteredApprovals().length) {
                <p class="feature-empty-filter">Aucun résultat.</p>
              } @else {
                <div class="feature-scroll-table" role="table">
                  <div class="feature-scroll-cols head decision-cols" role="row">
                    <span role="columnheader">Décision</span>
                    <span role="columnheader">Action liée</span>
                    <span role="columnheader">Commentaire</span>
                    <span role="columnheader">Date</span>
                  </div>
                  <div class="feature-scroll-body" role="rowgroup" [style.max-height.rem]="visibleRows * rowHeightRem">
                    @for (h of filteredApprovals(); track h.id) {
                      <div class="feature-scroll-cols row decision-cols" role="row">
                        <span class="feature-cell" role="cell"><app-status-badge [status]="h.decision" /></span>
                        <span class="feature-cell feature-cell-primary" role="cell">{{ actionTitle(h.actionId) }}</span>
                        <span class="feature-cell feature-cell-muted" role="cell">{{ h.comment || '—' }}</span>
                        <span class="feature-cell feature-cell-muted" role="cell">{{ h.decidedAt | date: 'short' }}</span>
                      </div>
                    }
                  </div>
                </div>
              }

              <header class="section-toolbar sub-section">
                <h2 class="section-title">Actions agents auditées</h2>
                <span class="section-search-spacer"></span>
                <span class="section-count">{{ agentAuditLogs().length }}</span>
              </header>
              @if (!agentAuditLogs().length) {
                <p class="muted">Aucune trace agent dans le journal.</p>
              } @else {
                <div class="recent-feed compact">
                  @for (log of agentAuditLogs().slice(0, 12); track log.id) {
                    <button type="button" class="recent-item" (click)="tab.set('journal'); openLog(log)">
                      <app-status-badge [status]="log.action" />
                      <span class="recent-main">
                        <strong>{{ log.details || log.action }}</strong>
                        <span class="recent-sub">{{ log.createdAt | date: 'short' }}</span>
                      </span>
                    </button>
                  }
                </div>
              }
            </section>
          } @else {
            <div class="security-grid">
              <section class="feature-hub card">
                <header class="section-toolbar">
                  <h2 class="section-title">Guardrails</h2>
                  <span class="section-search-spacer"></span>
                  <div class="section-toolbar-end">
                    <span class="section-tag">Politiques & blocages</span>
                    <span class="section-count warn">{{ blockedGuardrails() }}</span>
                  </div>
                </header>
                @if (!guardrails().length) {
                  <app-empty-state title="Aucun événement guardrail" icon="GV" description="Les blocages et alertes s'afficheront ici." />
                } @else {
                  <div class="feature-scroll-table" role="table">
                    <div class="feature-scroll-cols head guard-cols" role="row">
                      <span role="columnheader">Type</span>
                      <span role="columnheader">Sévérité</span>
                      <span role="columnheader">Source</span>
                      <span role="columnheader">Date</span>
                    </div>
                    <div class="feature-scroll-body" role="rowgroup" [style.max-height.rem]="visibleRows * rowHeightRem">
                      @for (e of guardrails(); track e.id) {
                        <div class="feature-scroll-cols row guard-cols" [class.blocked]="e.blocked" role="row">
                          <span class="feature-cell feature-cell-primary" role="cell">
                            {{ e.eventType }}
                            @if (e.blocked) { <span class="pill-warn">Bloqué</span> }
                          </span>
                          <span class="feature-cell" role="cell"><app-status-badge [status]="e.severity" /></span>
                          <span class="feature-cell feature-cell-muted" role="cell">{{ e.source }}</span>
                          <span class="feature-cell feature-cell-muted" role="cell">{{ e.createdAt | date: 'short' }}</span>
                        </div>
                      }
                    </div>
                  </div>
                }
              </section>

              <section class="feature-hub card">
                <header class="section-toolbar">
                  <h2 class="section-title">Sandbox outils</h2>
                  <span class="section-search-spacer"></span>
                  <div class="section-toolbar-end">
                    <span class="section-tag">Exécutions contrôlées</span>
                    <span class="section-count">{{ deniedSandbox() }} refus</span>
                  </div>
                </header>
                @if (!sandboxLogs().length) {
                  <app-empty-state title="Aucun log sandbox" icon="SB" description="Les appels d'outils agents seront tracés ici." />
                } @else {
                  <div class="feature-scroll-table" role="table">
                    <div class="feature-scroll-cols head sandbox-cols" role="row">
                      <span role="columnheader">Outil</span>
                      <span role="columnheader">Statut</span>
                      <span role="columnheader">Durée</span>
                      <span role="columnheader">Date</span>
                    </div>
                    <div class="feature-scroll-body" role="rowgroup" [style.max-height.rem]="visibleRows * rowHeightRem">
                      @for (s of sandboxLogs(); track s.id) {
                        <div class="feature-scroll-cols row sandbox-cols" [class.denied]="!s.allowed" role="row">
                          <span class="feature-cell feature-cell-primary" role="cell">{{ s.toolName }}</span>
                          <span class="feature-cell" role="cell">
                            <app-status-badge [status]="s.allowed ? 'APPROVED' : 'REJECTED'" />
                          </span>
                          <span class="feature-cell feature-cell-muted" role="cell">{{ s.durationMs }} ms</span>
                          <span class="feature-cell feature-cell-muted" role="cell">{{ s.createdAt | date: 'short' }}</span>
                        </div>
                      }
                    </div>
                  </div>
                }
              </section>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .error-banner {
      margin-bottom: var(--dash-inline-gap);
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-md);
      border: 1px solid color-mix(in srgb, var(--accent-danger) 40%, transparent);
      background: color-mix(in srgb, var(--accent-danger) 10%, transparent);
      color: var(--accent-danger);
      font-size: 0.85rem;
    }

    .audit-command {
      display: flex;
      flex-wrap: wrap;
      gap: var(--dash-inline-gap);
      align-items: stretch;
      margin-bottom: var(--dash-inline-gap);
      padding: var(--dash-band-gap);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      background: linear-gradient(135deg, color-mix(in srgb, var(--accent-primary) 6%, var(--bg-elevated)), var(--bg-elevated));
    }
    .command-main { display: flex; gap: var(--dash-band-gap); flex: 1; min-width: min(100%, 20rem); align-items: center; }
    .trail-ring { position: relative; width: 5.5rem; height: 5.5rem; flex-shrink: 0; }
    .trail-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
    .ring-bg { fill: none; stroke: var(--border-color); stroke-width: 8; }
    .ring-fill { fill: none; stroke: var(--accent-primary); stroke-width: 8; stroke-linecap: round; }
    .trail-ring[data-level='low'] .ring-fill { stroke: var(--accent-danger); }
    .trail-ring[data-level='mid'] .ring-fill { stroke: var(--accent-warning); }
    .ring-center {
      position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .ring-center strong { font-family: var(--font-display); font-size: 1.35rem; line-height: 1; }
    .ring-center span { font-size: 0.58rem; color: var(--text-muted); text-transform: uppercase; margin-top: 0.2rem; }
    .command-title { margin: 0 0 0.35rem; font-size: 1rem; }
    .command-sub { margin: 0 0 0.65rem; font-size: 0.82rem; color: var(--text-secondary); }
    .command-sub strong.low { color: var(--accent-danger); }
    .command-sub strong.mid { color: var(--accent-warning); }
    .command-sub strong.high { color: var(--accent-primary); }
    .command-stats { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .stat-pill {
      display: flex; flex-direction: column; gap: 0.1rem; padding: 0.4rem 0.55rem;
      border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-primary); min-width: 4.2rem;
    }
    .stat-pill.warn .stat-val { color: var(--accent-warning); }
    .stat-val { font-weight: var(--fw-bold); font-size: 0.95rem; color: var(--accent-primary); }
    .stat-lbl { font-size: 0.62rem; color: var(--text-muted); text-transform: uppercase; }
    .period-row { display: flex; flex-wrap: wrap; gap: 0.35rem; align-items: center; align-self: center; }
    .period-chip {
      border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-secondary);
      border-radius: 999px; padding: 0.3rem 0.65rem; font-size: 0.68rem; font-weight: 600; cursor: pointer;
    }
    .period-chip.active { background: color-mix(in srgb, var(--accent-primary) 14%, transparent); border-color: var(--accent-primary); color: var(--accent-primary); }

    .audit-layout { display: grid; grid-template-columns: minmax(11rem, 13.5rem) minmax(0, 1fr); gap: var(--dash-inline-gap); align-items: start; }
    .audit-nav { display: flex; flex-direction: column; gap: 0.25rem; position: sticky; top: 0.5rem; }
    .audit-nav-item {
      display: flex; align-items: center; gap: 0.5rem; width: 100%; text-align: left;
      border: 1px solid transparent; background: transparent; border-radius: var(--radius-md);
      padding: 0.55rem 0.6rem; cursor: pointer; color: var(--text-secondary); transition: background var(--transition), border-color var(--transition);
    }
    .audit-nav-item:hover { background: var(--bg-hover); color: var(--text-primary); }
    .audit-nav-item.active {
      background: color-mix(in srgb, var(--accent-primary) 12%, var(--bg-elevated));
      border-color: color-mix(in srgb, var(--accent-primary) 35%, var(--border-color));
      color: var(--accent-primary); box-shadow: inset 3px 0 0 var(--accent-primary);
    }
    .nav-icon { font-size: 0.9rem; width: 1.2rem; text-align: center; flex-shrink: 0; }
    .nav-text { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; flex: 1; }
    .nav-label { font-size: 0.78rem; font-weight: var(--fw-semibold); }
    .nav-desc { font-size: 0.62rem; color: var(--text-muted); }
    .nav-badge {
      font-size: 0.62rem; padding: 0.1rem 0.35rem; border-radius: var(--radius-sm);
      background: var(--bg-secondary); border: 1px solid var(--border-color); flex-shrink: 0;
    }
    .audit-panel { min-width: 0; }

    .section-toolbar {
      display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 0.65rem;
      margin-bottom: var(--dash-inline-gap); padding-bottom: var(--dash-inline-gap);
      border-bottom: 1px solid color-mix(in srgb, var(--border-color) 70%, transparent);
    }
    .section-toolbar.compact { margin-bottom: 0.65rem; padding-bottom: 0.65rem; }
    .section-toolbar.sub-section { margin-top: var(--dash-band-gap); border-top: 1px solid var(--border-color); padding-top: var(--dash-inline-gap); }
    .section-title { margin: 0; font-size: 0.92rem; font-weight: var(--fw-semibold); white-space: nowrap; }
    .section-search { display: flex; align-items: center; gap: 0.35rem; min-width: 0; justify-self: center; width: min(100%, 18rem); }
    .section-search-input { width: 100%; min-width: 0; }
    .section-search-spacer { min-width: 0; }
    .section-toolbar-end { display: flex; align-items: center; gap: 0.4rem; justify-self: end; flex-wrap: wrap; }
    .section-tag { font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .section-count {
      font-size: 0.72rem; color: var(--text-secondary); padding: 0.15rem 0.45rem;
      border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-secondary);
    }
    .section-count.warn { color: var(--accent-warning); border-color: color-mix(in srgb, var(--accent-warning) 40%, var(--border-color)); }
    .btn-sm { font-size: 0.72rem; padding: 0.32rem 0.55rem; min-height: auto; }
    .filter-select { font-size: 0.72rem; min-width: 7rem; max-width: 9rem; }

    .overview-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--dash-inline-gap); }
    .span-2 { grid-column: span 2; }
    .activity-labels { display: flex; justify-content: space-between; margin-top: 0.35rem; font-size: 0.62rem; color: var(--text-muted); }
    .rank-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.55rem; }
    .rank-list li { display: grid; grid-template-columns: 1fr auto; gap: 0.2rem 0.5rem; align-items: center; font-size: 0.75rem; }
    .rank-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; grid-column: 1; }
    .rank-label.mono { font-family: var(--font-mono, monospace); font-size: 0.68rem; }
    .rank-bar { height: 0.35rem; background: var(--bg-secondary); border-radius: 999px; overflow: hidden; grid-column: 1 / -1; }
    .rank-bar span { display: block; height: 100%; background: var(--accent-primary); border-radius: inherit; }
    .rank-val { font-weight: var(--fw-bold); color: var(--text-secondary); grid-column: 2; grid-row: 1; }
    .rank-empty { color: var(--text-muted); }
    .recent-feed { display: flex; flex-direction: column; gap: 0.35rem; }
    .recent-feed.compact { margin-top: 0.5rem; }
    .recent-item {
      display: flex; align-items: center; gap: 0.55rem; width: 100%; text-align: left;
      border: 1px solid var(--border-color); background: var(--bg-primary); border-radius: var(--radius-md);
      padding: 0.55rem 0.65rem; cursor: pointer; color: inherit;
    }
    .recent-item:hover { border-color: var(--border-strong); background: var(--bg-hover); }
    .recent-main { min-width: 0; display: flex; flex-direction: column; gap: 0.15rem; }
    .recent-main strong { font-size: 0.8rem; }
    .recent-sub { font-size: 0.68rem; color: var(--text-muted); }
    .muted { color: var(--text-muted); font-size: 0.82rem; margin: 0.5rem 0; }

    .journal-layout { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(260px, 0.8fr); gap: var(--dash-inline-gap); align-items: start; }
    .filter-row { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: var(--dash-inline-gap); }
    .filter-chip {
      border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-secondary);
      border-radius: 999px; padding: 0.25rem 0.6rem; font-size: 0.68rem; font-weight: 600; cursor: pointer;
    }
    .filter-chip.active { background: color-mix(in srgb, var(--accent-primary) 14%, transparent); border-color: var(--accent-primary); color: var(--accent-primary); }

    .audit-cols { grid-template-columns: minmax(110px, 1fr) minmax(90px, 1fr) 80px minmax(100px, auto); }
    .decision-cols { grid-template-columns: minmax(90px, auto) minmax(0, 1.2fr) minmax(0, 1fr) minmax(100px, auto); }
    .guard-cols, .sandbox-cols { grid-template-columns: minmax(0, 1.2fr) minmax(80px, auto) minmax(80px, 1fr) minmax(100px, auto); }
    .cell-sub { display: block; font-size: 0.68rem; color: var(--text-muted); }
    .mono { font-family: var(--font-mono, monospace); font-size: 0.72rem; }

    .log-row {
      display: grid; width: 100%; border: none; background: transparent; text-align: left; cursor: pointer; color: inherit;
      border-bottom: 1px solid color-mix(in srgb, var(--border-color) 55%, transparent);
    }
    .log-row:hover { background: var(--bg-hover); }
    .log-row.active { background: color-mix(in srgb, var(--accent-primary) 10%, transparent); box-shadow: inset 3px 0 0 var(--accent-primary); }
    .log-row.sensitive { background: color-mix(in srgb, var(--accent-warning) 5%, transparent); }

    .detail-grid {
      display: grid; grid-template-columns: auto 1fr; gap: 0.45rem 0.75rem; font-size: 0.82rem; margin-bottom: 0.75rem;
    }
    .detail-grid dt { color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase; }
    .detail-grid dd { margin: 0; }
    .mono-row { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
    .mono-row code { font-size: 0.72rem; word-break: break-all; }
    .detail-block pre {
      margin: 0; padding: 0.65rem; background: var(--bg-secondary); border-radius: var(--radius-sm);
      font-size: 0.72rem; white-space: pre-wrap; overflow-x: auto; max-height: 14rem; overflow-y: auto;
    }
    .detail-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; font-size: 0.8rem; }

    .security-grid { display: grid; grid-template-columns: 1fr; gap: var(--dash-inline-gap); }
    .blocked, .denied { background: color-mix(in srgb, var(--accent-danger) 5%, transparent); }
    .pill-warn {
      margin-left: 0.35rem; font-size: 0.62rem; padding: 0.1rem 0.35rem; border-radius: var(--radius-sm);
      background: color-mix(in srgb, var(--accent-warning) 18%, transparent); color: var(--accent-warning);
    }

    @media (max-width: 960px) {
      .audit-layout { grid-template-columns: 1fr; }
      .audit-nav { flex-direction: row; overflow-x: auto; position: static; padding-bottom: 0.25rem; }
      .audit-nav-item { min-width: 9rem; flex-shrink: 0; }
      .nav-desc { display: none; }
      .overview-grid { grid-template-columns: 1fr; }
      .span-2 { grid-column: span 1; }
      .journal-layout { grid-template-columns: 1fr; }
      .section-toolbar { grid-template-columns: 1fr; }
      .section-search { justify-self: stretch; width: 100%; }
      .section-toolbar-end { justify-self: start; }
      .command-main { flex-direction: column; align-items: flex-start; }
    }
  `],
})
export class AuditPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly tabs = TABS;
  readonly periods = PERIODS;
  readonly categories = CATEGORIES;
  readonly visibleRows = VISIBLE_ROWS;
  readonly rowHeightRem = ROW_HEIGHT_REM;
  readonly isSensitive = isSensitiveAction;

  readonly loadingAgent = signal(true);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly agent = signal<Agent | null>(null);
  readonly logs = signal<AuditLog[]>([]);
  readonly approvals = signal<AgentApproval[]>([]);
  readonly agentActions = signal<AgentAction[]>([]);
  readonly guardrails = signal<GuardrailEvent[]>([]);
  readonly sandboxLogs = signal<ToolSandboxLog[]>([]);

  readonly tab = signal<AuditTab>('overview');
  readonly period = signal<PeriodKey>('7d');
  readonly query = signal('');
  readonly userFilter = signal('');
  readonly categoryFilter = signal<ActionCategory | ''>('');
  readonly decisionQuery = signal('');
  readonly selected = signal<AuditLog | null>(null);

  readonly todayCount = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return this.logs().filter((l) => l.createdAt?.slice(0, 10) === today).length;
  });

  readonly periodLogs = computed(() =>
    this.logs().filter((l) => inPeriod(l.createdAt, this.period())),
  );

  readonly entityTypes = computed(() => [...new Set(this.logs().map((l) => l.entityType).filter(Boolean))].sort());
  readonly userIds = computed(() => [...new Set(this.logs().map((l) => l.userId).filter(Boolean))].sort());
  readonly uniqueUsers = computed(() => this.userIds().length);

  readonly sensitiveCount = computed(() =>
    this.periodLogs().filter((l) => isSensitiveAction(l.action)).length,
  );

  readonly trailScore = computed(() => {
    const logs = this.logs();
    if (!logs.length) return 0;
    const daysWithEvents = new Set(logs.map((l) => l.createdAt?.slice(0, 10)).filter(Boolean)).size;
    const coverage = Math.min(1, daysWithEvents / 7);
    const diversity = Math.min(1, this.entityTypes().length / 5);
    return Math.round(40 + coverage * 35 + diversity * 25);
  });

  readonly trailLevel = computed(() => {
    const s = this.trailScore();
    if (s < 50) return 'low';
    if (s < 75) return 'mid';
    return 'high';
  });

  readonly trailLabel = computed(() => {
    const l = this.trailLevel();
    if (l === 'low') return 'À renforcer';
    if (l === 'mid') return 'Correcte';
    return 'Solide';
  });

  readonly trailDash = computed(() => {
    const pct = this.trailScore() / 100;
    const circumference = 2 * Math.PI * 52;
    return `${pct * circumference} ${circumference}`;
  });

  readonly activitySeries = computed(() => {
    const buckets = Array.from({ length: 7 }, () => 0);
    const now = new Date();
    for (const log of this.logs()) {
      if (!log.createdAt) continue;
      const d = new Date(log.createdAt);
      const diff = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
      if (diff >= 0 && diff < 7) buckets[6 - diff] += 1;
    }
    return buckets;
  });

  readonly activityLabels = computed(() => {
    const labels: string[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString('fr-FR', { weekday: 'short' }));
    }
    return labels;
  });

  readonly topActions = computed(() => this.rankRows(this.periodLogs().map((l) => l.action)));
  readonly topUsers = computed(() => this.rankRows(this.periodLogs().map((l) => l.userId)));

  readonly recentLogs = computed(() => this.periodLogs().slice(0, 8));

  readonly filteredLogs = computed(() => {
    const q = this.query().trim().toLowerCase();
    const user = this.userFilter();
    const cat = this.categoryFilter();
    return this.periodLogs().filter((l) => {
      if (user && l.userId !== user) return false;
      if (cat && actionCategory(l.action) !== cat) return false;
      if (!q) return true;
      return (
        l.action.toLowerCase().includes(q) ||
        l.entityType.toLowerCase().includes(q) ||
        l.entityId.toLowerCase().includes(q) ||
        l.userId.toLowerCase().includes(q) ||
        (l.details ?? '').toLowerCase().includes(q)
      );
    });
  });

  readonly filteredApprovals = computed(() => {
    const q = this.decisionQuery().trim().toLowerCase();
    return this.approvals().filter((h) => {
      if (!q) return true;
      return (
        h.decision.toLowerCase().includes(q) ||
        (h.comment ?? '').toLowerCase().includes(q) ||
        this.actionTitle(h.actionId).toLowerCase().includes(q)
      );
    });
  });

  readonly agentAuditLogs = computed(() =>
    this.periodLogs().filter((l) => actionCategory(l.action) === 'agent'),
  );

  readonly blockedGuardrails = computed(() => this.guardrails().filter((e) => e.blocked).length);
  readonly deniedSandbox = computed(() => this.sandboxLogs().filter((s) => !s.allowed).length);

  ngOnInit(): void {
    this.api.getAgents().subscribe({
      next: (agents) => {
        this.agent.set(agents.find((a) => a.code === 'STRATEGIE') ?? null);
        this.loadingAgent.set(false);
      },
      error: () => this.loadingAgent.set(false),
    });
    this.refresh();
  }

  tabBadge(id: AuditTab): string | null {
    if (id === 'journal') return String(this.periodLogs().length) || null;
    if (id === 'decisions') return String(this.approvals().length) || null;
    if (id === 'security') {
      const n = this.blockedGuardrails() + this.deniedSandbox();
      return n > 0 ? String(n) : null;
    }
    return null;
  }

  categoryLabel(action: string): string {
    const cat = actionCategory(action);
    return CATEGORIES.find((c) => c.id === cat)?.label ?? 'Autre';
  }

  openLog(log: AuditLog): void {
    this.selected.set(log);
    this.tab.set('journal');
  }

  actionTitle(actionId: string): string {
    return this.agentActions().find((a) => a.id === actionId)?.title ?? actionId.slice(0, 8);
  }

  formatDetails(details: string): string {
    try {
      return JSON.stringify(JSON.parse(details), null, 2);
    } catch {
      return details;
    }
  }

  copy(text: string): void {
    void navigator.clipboard.writeText(text).then(
      () => this.toast.success('Copié dans le presse-papiers.'),
      () => this.toast.error('Copie impossible.'),
    );
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      logs: this.api.getAuditLogs(),
      approvals: this.api.getApprovals(),
      actions: this.api.getAgentActions(),
      guardrails: this.api.getGuardrailEvents(),
      sandbox: this.api.getSandboxLogs(),
    }).subscribe({
      next: ({ logs, approvals, actions, guardrails, sandbox }) => {
        this.logs.set(logs);
        this.approvals.set(approvals);
        this.agentActions.set(actions);
        this.guardrails.set(guardrails);
        this.sandboxLogs.set(sandbox);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(mapHttpError(err));
        this.toast.error(mapHttpError(err));
      },
    });
  }

  exportCsv(): void {
    const rows = this.filteredLogs();
    if (!rows.length) {
      this.toast.error('Aucune donnée à exporter.');
      return;
    }
    const header = 'date,action,category,entityType,entityId,userId,details';
    const lines = rows.map(
      (l) =>
        `"${l.createdAt}","${l.action}","${actionCategory(l.action)}","${l.entityType}","${l.entityId}","${l.userId}","${(l.details ?? '').replace(/"/g, '""')}"`,
    );
    this.downloadFile([header, ...lines].join('\n'), `audit-${this.period()}.csv`, 'text/csv;charset=utf-8');
    this.toast.success('Export CSV généré.');
  }

  exportJson(): void {
    const rows = this.filteredLogs();
    if (!rows.length) {
      this.toast.error('Aucune donnée à exporter.');
      return;
    }
    const payload = rows.map((l) => ({ ...l, category: actionCategory(l.action) }));
    this.downloadFile(JSON.stringify(payload, null, 2), `audit-${this.period()}.json`, 'application/json');
    this.toast.success('Export JSON généré.');
  }

  private rankRows(values: string[]): { label: string; count: number; pct: number }[] {
    const counts = new Map<string, number>();
    for (const v of values) {
      if (!v) continue;
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    const max = Math.max(...counts.values(), 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => ({ label, count, pct: (count / max) * 100 }));
  }

  private downloadFile(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
