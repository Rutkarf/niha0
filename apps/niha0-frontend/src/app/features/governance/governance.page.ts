import { DatePipe, DecimalPipe, JsonPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api/api.service';
import { GuardrailEvent, Permission, ToolSandboxLog } from '../../core/api/api.models';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { mapHttpError } from '../../core/api/http-error.util';
import { FeaturePageHeaderComponent } from '../../shared/ui/feature-page-header/feature-page-header.component';

type GovTab = 'overview' | 'permissions' | 'eval' | 'guardrails' | 'sandbox' | 'scan';

const EVAL_LABELS: Record<string, string> = {
  metricDate: 'Date métrique',
  recommendations: 'Recommandations',
  approvals: 'Approbations',
  rejections: 'Refus',
  escalations: 'Escalades',
  avgLatencyMs: 'Latence moy. (ms)',
  estimatedCostCents: 'Coût estimé (¢)',
};

const VISIBLE_ROWS = 6;
const ROW_HEIGHT_REM = 2.85;

const TABS: { id: GovTab; label: string; icon: string; desc: string }[] = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: '◎', desc: 'Posture & risques' },
  { id: 'permissions', label: 'Permissions', icon: '🔐', desc: 'RBAC & accès' },
  { id: 'eval', label: 'Évaluation IA', icon: '📊', desc: 'Métriques qualité' },
  { id: 'guardrails', label: 'Guardrails', icon: '🛡️', desc: 'Politiques & blocages' },
  { id: 'sandbox', label: 'Sandbox', icon: '🧪', desc: 'Outils & exécution' },
  { id: 'scan', label: 'Scan contenu', icon: '🔍', desc: 'Analyse temps réel' },
];

const PILLARS = [
  { key: 'permissions', label: 'Contrôle d\'accès', icon: '🔐', tab: 'permissions' as GovTab },
  { key: 'eval', label: 'Évaluation IA', icon: '📊', tab: 'eval' as GovTab },
  { key: 'guardrails', label: 'Guardrails', icon: '🛡️', tab: 'guardrails' as GovTab },
  { key: 'sandbox', label: 'Sandbox outils', icon: '🧪', tab: 'sandbox' as GovTab },
];

@Component({
  selector: 'app-governance-page',
  imports: [
    FormsModule,
    DatePipe,
    DecimalPipe,
    JsonPipe,
    EmptyStateComponent,
    SkeletonComponent,
    StatusBadgeComponent,
    FeaturePageHeaderComponent,
  ],
  template: `
    <div class="page feature-module-page gov-page">
      <app-feature-page-header group="Pilotage" title="Gouvernance" backLabel="← AI Office" />

      @if (error()) {
        <p class="error-banner" role="alert">{{ error() }}</p>
      }

      <!-- Command center header -->
      <header class="gov-command">
        <div class="command-main">
          <div class="score-ring" [attr.data-level]="complianceLevel()">
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle cx="60" cy="60" r="52" class="ring-bg" />
              <circle
                cx="60" cy="60" r="52"
                class="ring-fill"
                [attr.stroke-dasharray]="scoreDash()"
                stroke-dashoffset="0"
              />
            </svg>
            <div class="score-center">
              <strong>{{ complianceScore() }}</strong>
              <span>Score conformité</span>
            </div>
          </div>
          <div class="command-meta">
            <h2 class="command-title">Centre de gouvernance Nihao</h2>
            <p class="command-sub">
              Pilotage des permissions, évaluations IA, guardrails et sandbox — posture
              <strong [class]="complianceLevel()">{{ complianceLabel() }}</strong>
            </p>
            <div class="command-stats">
              <div class="stat-pill">
                <span class="stat-val">{{ permissions().length }}</span>
                <span class="stat-lbl">Permissions</span>
              </div>
              <div class="stat-pill warn">
                <span class="stat-val">{{ blockedCount() }}</span>
                <span class="stat-lbl">Blocages</span>
              </div>
              <div class="stat-pill warn">
                <span class="stat-val">{{ deniedTools() }}</span>
                <span class="stat-lbl">Outils refusés</span>
              </div>
              <div class="stat-pill ok">
                <span class="stat-val">{{ evalApprovals() }}</span>
                <span class="stat-lbl">Approbations</span>
              </div>
            </div>
          </div>
        </div>
        <div class="risk-meter">
          <span class="risk-label">Niveau de risque</span>
          <div class="risk-track">
            <div class="risk-fill" [style.width.%]="riskPercent()"></div>
          </div>
          <span class="risk-val">{{ riskLabel() }}</span>
        </div>
      </header>

      <div class="gov-layout">
        <!-- Sidebar navigation -->
        <nav class="gov-nav" aria-label="Sections gouvernance">
          @for (t of tabs; track t.id) {
            <button
              type="button"
              class="nav-item"
              [class.active]="tab() === t.id"
              (click)="setTab(t.id)"
            >
              <span class="nav-icon">{{ t.icon }}</span>
              <span class="nav-text">
                <strong>{{ t.label }}</strong>
                <small>{{ t.desc }}</small>
              </span>
              @if (tabBadge(t.id); as badge) {
                <span class="nav-badge">{{ badge }}</span>
              }
            </button>
          }
        </nav>

        <main class="gov-main">
          @if (loading()) {
            <app-skeleton message="Chargement du centre de gouvernance…" [lines]="8" />
          } @else {
            @switch (tab()) {
              @case ('overview') {
                <section class="panel">
                  <header class="section-toolbar" role="toolbar" aria-label="Vue d'ensemble">
                    <h2 class="section-title">Vue d'ensemble</h2>
                    <label class="section-search">
                      <span class="feature-search-icon" aria-hidden="true">⌕</span>
                      <span class="sr-only">Rechercher</span>
                      <input
                        class="input section-search-input"
                        type="search"
                        placeholder="Filtrer activité, type, sévérité…"
                        [ngModel]="overviewQuery()"
                        (ngModelChange)="overviewQuery.set($event)"
                      />
                    </label>
                    <div class="section-toolbar-end">
                      <span class="section-tag">Posture globale</span>
                      <span class="section-count">{{ recentActivity().length }} événement(s)</span>
                    </div>
                  </header>

                  <div class="pillars">
                    @for (p of pillars; track p.key) {
                      <button type="button" class="pillar-card" (click)="setTab(p.tab)">
                        <span class="pillar-icon">{{ p.icon }}</span>
                        <span class="pillar-label">{{ p.label }}</span>
                        <span class="pillar-metric">{{ pillarMetric(p.tab) }}</span>
                      </button>
                    }
                  </div>

                  <div class="overview-charts">
                    <article class="chart-card">
                      <h3>Guardrails — statut</h3>
                      <div class="donut-wrap">
                        <div class="donut" [style.background]="guardrailDonut()"></div>
                        <div class="donut-center">
                          <strong>{{ events().length }}</strong>
                          <span>événements</span>
                        </div>
                      </div>
                      <ul class="legend">
                        <li><span class="lg blocked"></span>Bloqués {{ blockedCount() }}</li>
                        <li><span class="lg ok"></span>Autorisés {{ events().length - blockedCount() }}</li>
                      </ul>
                    </article>
                    <article class="chart-card">
                      <h3>Sandbox — décisions</h3>
                      <div class="bar-chart">
                        <div class="bar-col">
                          <div class="bar-fill ok" [style.height.%]="sandboxAllowPct()"></div>
                          <span>OK</span>
                        </div>
                        <div class="bar-col">
                          <div class="bar-fill deny" [style.height.%]="sandboxDenyPct()"></div>
                          <span>Refus</span>
                        </div>
                      </div>
                      <p class="chart-caption">{{ allowedTools() }} autorisés · {{ deniedTools() }} refusés</p>
                    </article>
                    <article class="chart-card wide">
                      <h3>Activité récente</h3>
                      <ul class="activity-feed">
                        @for (a of filteredActivity(); track a.id) {
                          <li [class]="a.tone">
                            <span class="act-icon">{{ a.icon }}</span>
                            <div class="act-body">
                              <strong>{{ a.title }}</strong>
                              <span>{{ a.detail }}</span>
                            </div>
                            <time>{{ a.date | date: 'HH:mm' }}</time>
                          </li>
                        } @empty {
                          <li class="empty-act">Aucune activité récente</li>
                        }
                      </ul>
                    </article>
                  </div>
                </section>
              }

              @case ('permissions') {
                <section class="panel">
                  <header class="section-toolbar" role="toolbar" aria-label="Permissions">
                    <h2 class="section-title">Permissions</h2>
                    <label class="section-search">
                      <span class="feature-search-icon" aria-hidden="true">⌕</span>
                      <span class="sr-only">Rechercher</span>
                      <input
                        class="input section-search-input"
                        type="search"
                        placeholder="Code, description…"
                        [ngModel]="permQuery()"
                        (ngModelChange)="permQuery.set($event)"
                      />
                    </label>
                    <div class="section-toolbar-end">
                      <span class="section-tag">RBAC workspace</span>
                      <span class="section-count">{{ permissions().length }} droit(s)</span>
                    </div>
                  </header>

                  @if (!filteredPermissions().length) {
                    <app-empty-state title="Aucune permission" icon="GV" />
                  } @else {
                    <div class="perm-grid">
                      @for (p of filteredPermissions(); track p.id) {
                        <article class="perm-card">
                          <span class="perm-icon">🔐</span>
                          <code class="perm-code">{{ p.code }}</code>
                          <p class="perm-desc">{{ p.description }}</p>
                        </article>
                      }
                    </div>
                  }
                </section>
              }

              @case ('eval') {
                <section class="panel">
                  <header class="section-toolbar" role="toolbar" aria-label="Évaluation">
                    <h2 class="section-title">Évaluation IA</h2>
                    <div class="section-search spacer"></div>
                    <div class="section-toolbar-end">
                      <span class="section-tag">Métriques qualité</span>
                      <span class="section-count">{{ evalEntries(evalDash() ?? {}).length }} indicateur(s)</span>
                    </div>
                  </header>

                  @if (evalDash(); as dash) {
                    <div class="eval-hero">
                      <div class="eval-big">
                        <span class="eval-num">{{ dash['approvals'] ?? 0 }}</span>
                        <span class="eval-lbl">Approbations</span>
                      </div>
                      <div class="eval-bars">
                        @for (bar of evalBars(dash); track bar.label) {
                          <div class="eval-bar-row">
                            <span>{{ bar.label }}</span>
                            <div class="eval-track"><div class="eval-fill" [style.width.%]="bar.pct"></div></div>
                            <span class="eval-val">{{ bar.value }}</span>
                          </div>
                        }
                      </div>
                    </div>
                    <div class="kpi-grid">
                      @for (entry of evalEntries(dash); track entry.key) {
                        <div class="kpi-card">
                          <span class="kpi-label">{{ entry.label }}</span>
                          <span class="kpi-value">{{ entry.value }}</span>
                        </div>
                      }
                    </div>
                  } @else {
                    <app-empty-state title="Pas de métriques" icon="GV" description="Les métriques d'évaluation apparaîtront ici." />
                  }
                </section>
              }

              @case ('guardrails') {
                <section class="panel">
                  <header class="section-toolbar" role="toolbar" aria-label="Guardrails">
                    <h2 class="section-title">Guardrails</h2>
                    <label class="section-search">
                      <span class="feature-search-icon" aria-hidden="true">⌕</span>
                      <span class="sr-only">Rechercher</span>
                      <input
                        class="input section-search-input"
                        type="search"
                        placeholder="Type, sévérité, détail…"
                        [ngModel]="eventQuery()"
                        (ngModelChange)="eventQuery.set($event)"
                      />
                    </label>
                    <div class="section-toolbar-end">
                      <span class="section-tag">Politiques de sécurité</span>
                      <span class="section-count">{{ events().length }} événement(s)</span>
                    </div>
                  </header>

                  @if (!filteredEvents().length) {
                    <app-empty-state title="Aucun événement" icon="GV" />
                  } @else {
                    <div class="event-list">
                      @for (e of filteredEvents(); track e.id) {
                        <article class="event-card" [class.blocked]="e.blocked">
                          <div class="event-sev" [attr.data-sev]="e.severity.toLowerCase()">
                            {{ severityIcon(e.severity) }}
                          </div>
                          <div class="event-body">
                            <div class="event-top">
                              <strong>{{ e.eventType }}</strong>
                              <app-status-badge [status]="e.severity" />
                              <span class="event-status" [class.blocked]="e.blocked">
                                {{ e.blocked ? 'Bloqué' : 'Autorisé' }}
                              </span>
                            </div>
                            @if (e.detail) {
                              <p class="event-detail">{{ e.detail }}</p>
                            }
                            <span class="event-meta">{{ e.source }} · {{ e.createdAt | date: 'medium' }}</span>
                          </div>
                        </article>
                      }
                    </div>
                  }
                </section>
              }

              @case ('sandbox') {
                <section class="panel">
                  <header class="section-toolbar" role="toolbar" aria-label="Sandbox">
                    <h2 class="section-title">Sandbox outils</h2>
                    <label class="section-search">
                      <span class="feature-search-icon" aria-hidden="true">⌕</span>
                      <span class="sr-only">Rechercher</span>
                      <input
                        class="input section-search-input"
                        type="search"
                        placeholder="Outil, détail…"
                        [ngModel]="sandboxQuery()"
                        (ngModelChange)="sandboxQuery.set($event)"
                      />
                    </label>
                    <div class="section-toolbar-end">
                      <span class="section-tag">Exécution contrôlée</span>
                      <span class="section-count">{{ logs().length }} log(s)</span>
                    </div>
                  </header>

                  @if (!filteredLogs().length) {
                    <app-empty-state title="Aucun log sandbox" icon="GV" />
                  } @else {
                    <div class="sandbox-list">
                      @for (l of filteredLogs(); track l.id) {
                        <article class="sandbox-card" [class.denied]="!l.allowed">
                          <span class="sand-icon">{{ l.allowed ? '✓' : '✗' }}</span>
                          <div class="sand-body">
                            <strong>{{ l.toolName }}</strong>
                            @if (l.detail) {
                              <p>{{ l.detail }}</p>
                            }
                            <span class="sand-meta">{{ l.durationMs }} ms · {{ l.createdAt | date: 'short' }}</span>
                          </div>
                          <span class="sand-badge" [class.ok]="l.allowed">{{ l.allowed ? 'Autorisé' : 'Refusé' }}</span>
                        </article>
                      }
                    </div>
                  }
                </section>
              }

              @case ('scan') {
                <section class="panel scan-panel">
                  <header class="section-toolbar" role="toolbar" aria-label="Scan">
                    <h2 class="section-title">Scan de contenu</h2>
                    <div class="section-search spacer"></div>
                    <div class="section-toolbar-end">
                      <span class="section-tag">Guardrails temps réel</span>
                    </div>
                  </header>

                  <form class="scan-form" (ngSubmit)="runScan()">
                    <div class="scan-input-wrap">
                      <textarea
                        class="input scan-textarea"
                        rows="6"
                        [(ngModel)]="scanText"
                        name="scanText"
                        required
                        placeholder="Collez le contenu à analyser (prompt, réponse agent, document…)…"
                      ></textarea>
                      <button class="btn btn-primary scan-btn" type="submit" [disabled]="scanning() || !scanText.trim()">
                        {{ scanning() ? 'Analyse en cours…' : '🔍 Lancer le scan' }}
                      </button>
                    </div>

                    @if (scanResult(); as res) {
                      <div class="scan-result" [class.blocked]="res['blocked']">
                        <div class="scan-result-head">
                          <span class="scan-icon">{{ res['blocked'] ? '🚫' : '✅' }}</span>
                          <div>
                            <strong>{{ res['blocked'] ? 'Contenu bloqué par les guardrails' : 'Contenu autorisé' }}</strong>
                            <p>Analyse terminée — consultez le détail ci-dessous.</p>
                          </div>
                        </div>
                        <pre>{{ res | json }}</pre>
                      </div>
                    } @else {
                      <div class="scan-tips">
                        <h3>Bonnes pratiques</h3>
                        <ul>
                          <li>Scannez les prompts avant envoi aux agents sensibles</li>
                          <li>Vérifiez les réponses contenant des données personnelles</li>
                          <li>Utilisez le scan en complément des guardrails automatiques</li>
                        </ul>
                      </div>
                    }
                  </form>
                </section>
              }
            }
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    .gov-page { display: flex; flex-direction: column; gap: var(--dash-inline-gap, var(--space-3)); }

    .error-banner {
      margin: 0;
      padding: 0.5rem 0.75rem;
      background: color-mix(in srgb, var(--accent-danger) 12%, transparent);
      color: var(--accent-danger);
      font-size: 0.8rem;
      border-radius: var(--radius-sm);
    }

    /* Command center */
    .gov-command {
      display: flex;
      flex-direction: column;
      gap: var(--dash-inline-gap);
      padding: var(--dash-band-gap);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--bg-elevated), color-mix(in srgb, var(--accent-primary) 5%, var(--bg-elevated)));
    }

    .command-main { display: flex; gap: var(--dash-band-gap); align-items: center; flex-wrap: wrap; }

    .score-ring {
      position: relative;
      width: 7rem;
      height: 7rem;
      flex-shrink: 0;
    }

    .score-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
    .ring-bg { fill: none; stroke: var(--border-color); stroke-width: 8; }
    .ring-fill {
      fill: none;
      stroke: var(--accent-primary);
      stroke-width: 8;
      stroke-linecap: round;
      transition: stroke-dasharray 0.4s;
    }

    .score-ring[data-level="good"] .ring-fill { stroke: #22c55e; }
    .score-ring[data-level="warn"] .ring-fill { stroke: #f59e0b; }
    .score-ring[data-level="risk"] .ring-fill { stroke: #ef4444; }

    .score-center {
      position: absolute;
      inset: 18%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .score-center strong { font-size: 1.35rem; font-weight: 800; line-height: 1; }
    .score-center span { font-size: 0.58rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }

    .command-meta { flex: 1; min-width: 12rem; }
    .command-title { margin: 0 0 0.25rem; font-size: 1.15rem; }
    .command-sub { margin: 0 0 0.65rem; font-size: 0.82rem; color: var(--text-secondary); }
    .command-sub strong.good { color: #16a34a; }
    .command-sub strong.warn { color: #d97706; }
    .command-sub strong.risk { color: #dc2626; }

    .command-stats { display: flex; flex-wrap: wrap; gap: 0.45rem; }

    .stat-pill {
      display: flex;
      flex-direction: column;
      padding: 0.4rem 0.65rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background: var(--bg-primary);
      min-width: 4.5rem;
    }

    .stat-pill.warn { border-color: color-mix(in srgb, #f59e0b 40%, var(--border-color)); }
    .stat-pill.ok { border-color: color-mix(in srgb, #22c55e 40%, var(--border-color)); }

    .stat-val { font-size: 1rem; font-weight: 800; font-variant-numeric: tabular-nums; color: var(--accent-primary); }
    .stat-lbl { font-size: 0.62rem; color: var(--text-muted); text-transform: uppercase; }

    .risk-meter { display: flex; align-items: center; gap: 0.65rem; font-size: 0.75rem; }
    .risk-label { color: var(--text-muted); white-space: nowrap; }
    .risk-track { flex: 1; height: 8px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden; min-width: 8rem; }
    .risk-fill { height: 100%; background: linear-gradient(90deg, #22c55e, #f59e0b, #ef4444); border-radius: 4px; transition: width 0.35s; }
    .risk-val { font-weight: 700; white-space: nowrap; }

    /* Layout */
    .gov-layout {
      display: grid;
      grid-template-columns: minmax(200px, 240px) 1fr;
      gap: var(--dash-inline-gap);
      align-items: start;
    }

    .gov-nav {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      position: sticky;
      top: 1rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      width: 100%;
      text-align: left;
      border: 1px solid var(--border-color);
      background: var(--bg-elevated);
      border-radius: var(--radius-md);
      padding: 0.55rem 0.65rem;
      cursor: pointer;
      color: inherit;
      transition: border-color 0.12s, background 0.12s;
    }

    .nav-item:hover { border-color: var(--accent-primary); }
    .nav-item.active {
      border-color: var(--accent-primary);
      background: color-mix(in srgb, var(--accent-primary) 10%, var(--bg-elevated));
      box-shadow: inset 3px 0 0 var(--accent-primary);
    }

    .nav-icon { font-size: 1.1rem; flex-shrink: 0; }
    .nav-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .nav-text strong { font-size: 0.78rem; }
    .nav-text small { font-size: 0.62rem; color: var(--text-muted); }

    .nav-badge {
      font-size: 0.62rem;
      font-weight: 800;
      padding: 0.1rem 0.35rem;
      border-radius: 999px;
      background: color-mix(in srgb, var(--accent-primary) 15%, transparent);
      color: var(--accent-primary);
    }

    .gov-main { min-width: 0; }

    .panel {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      padding: var(--dash-band-gap);
    }

    .section-toolbar {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: var(--dash-inline-gap);
      padding-bottom: var(--dash-inline-gap);
      border-bottom: 1px solid var(--border-color);
      margin-bottom: var(--dash-inline-gap);
    }

    .section-title { margin: 0; font-size: 1rem; font-weight: var(--fw-bold); white-space: nowrap; }

    .section-search {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      justify-self: center;
      width: 100%;
      max-width: 100%;
    }

    .section-search.spacer { visibility: hidden; }

    .section-search-input { flex: 1; min-width: 0; font-size: 0.85rem; }

    .section-toolbar-end {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      justify-self: end;
      white-space: nowrap;
    }

    .section-tag { font-size: 0.72rem; font-weight: var(--fw-semibold); color: var(--text-secondary); }

    .section-count {
      font-size: 0.72rem;
      color: var(--text-muted);
      padding: 0.2rem 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
    }

    /* Overview */
    .pillars {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.5rem;
      margin-bottom: var(--dash-inline-gap);
    }

    .pillar-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 0.65rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-primary);
      cursor: pointer;
      text-align: center;
      color: inherit;
    }

    .pillar-card:hover { border-color: var(--accent-primary); background: color-mix(in srgb, var(--accent-primary) 6%, transparent); }
    .pillar-icon { font-size: 1.25rem; }
    .pillar-label { font-size: 0.72rem; font-weight: var(--fw-semibold); }
    .pillar-metric { font-size: 0.85rem; font-weight: 800; color: var(--accent-primary); }

    .overview-charts {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--dash-inline-gap);
    }

    .chart-card {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.75rem;
      background: var(--bg-primary);
    }

    .chart-card.wide { grid-column: 1 / -1; }
    .chart-card h3 { margin: 0 0 0.65rem; font-size: 0.82rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }

    .donut-wrap { position: relative; width: 100px; height: 100px; margin: 0 auto 0.5rem; }
    .donut { width: 100%; height: 100%; border-radius: 50%; }
    .donut-center {
      position: absolute; inset: 22%; border-radius: 50%; background: var(--bg-primary);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      font-size: 0.6rem; color: var(--text-muted);
    }
    .donut-center strong { font-size: 1rem; color: var(--text-primary); }

    .legend { list-style: none; margin: 0; padding: 0; display: flex; justify-content: center; gap: 0.75rem; font-size: 0.72rem; }
    .legend li { display: flex; align-items: center; gap: 0.3rem; }
    .lg { width: 0.5rem; height: 0.5rem; border-radius: 2px; }
    .lg.blocked { background: #ef4444; }
    .lg.ok { background: #22c55e; }

    .bar-chart { display: flex; align-items: flex-end; justify-content: center; gap: 1.5rem; height: 90px; }
    .bar-col { display: flex; flex-direction: column; align-items: center; gap: 0.35rem; height: 100%; justify-content: flex-end; font-size: 0.68rem; color: var(--text-muted); }
    .bar-fill { width: 2.5rem; border-radius: 4px 4px 0 0; min-height: 4px; }
    .bar-fill.ok { background: #22c55e; }
    .bar-fill.deny { background: #ef4444; }
    .chart-caption { margin: 0.5rem 0 0; text-align: center; font-size: 0.72rem; color: var(--text-muted); }

    .activity-feed { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.35rem; max-height: 220px; overflow-y: auto; }
    .activity-feed li {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 0.5rem;
      align-items: start;
      padding: 0.45rem 0.55rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      font-size: 0.75rem;
    }
    .activity-feed li.warn { border-color: color-mix(in srgb, #f59e0b 35%, var(--border-color)); background: color-mix(in srgb, #f59e0b 6%, transparent); }
    .activity-feed li.danger { border-color: color-mix(in srgb, #ef4444 35%, var(--border-color)); background: color-mix(in srgb, #ef4444 6%, transparent); }
    .act-icon { font-size: 1rem; }
    .act-body strong { display: block; font-size: 0.78rem; }
    .act-body span { color: var(--text-muted); font-size: 0.68rem; }
    .activity-feed time { font-size: 0.65rem; color: var(--text-muted); white-space: nowrap; }
    .empty-act { justify-content: center; color: var(--text-muted); }

    /* Permissions */
    .perm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; }
    .perm-card {
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-primary);
    }
    .perm-icon { font-size: 1.1rem; }
    .perm-code { display: block; font-family: var(--font-mono); font-size: 0.78rem; font-weight: 700; margin: 0.35rem 0; color: var(--accent-primary); }
    .perm-desc { margin: 0; font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4; }

    /* Eval */
    .eval-hero {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: var(--dash-band-gap);
      margin-bottom: var(--dash-inline-gap);
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-primary);
    }

    .eval-big { text-align: center; padding: 0.5rem 1rem; border-right: 1px solid var(--border-color); }
    .eval-num { display: block; font-size: 2rem; font-weight: 800; color: var(--accent-primary); line-height: 1; }
    .eval-lbl { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; }

    .eval-bars { display: flex; flex-direction: column; gap: 0.45rem; justify-content: center; }
    .eval-bar-row { display: grid; grid-template-columns: 7rem 1fr 2.5rem; gap: 0.5rem; align-items: center; font-size: 0.72rem; }
    .eval-track { height: 8px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden; }
    .eval-fill { height: 100%; background: var(--accent-primary); border-radius: 4px; }
    .eval-val { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }

    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 0.5rem; }
    .kpi-card {
      padding: 0.65rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .kpi-label { font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted); }
    .kpi-value { font-size: 0.95rem; font-weight: 700; font-variant-numeric: tabular-nums; }

    /* Guardrails events */
    .event-list { display: flex; flex-direction: column; gap: 0.45rem; max-height: 28rem; overflow-y: auto; }
    .event-card {
      display: flex;
      gap: 0.65rem;
      padding: 0.65rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-primary);
    }
    .event-card.blocked { border-left: 3px solid #ef4444; }
    .event-sev {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 1rem;
      background: var(--bg-secondary);
      flex-shrink: 0;
    }
    .event-sev[data-sev="high"], .event-sev[data-sev="critical"] { background: color-mix(in srgb, #ef4444 15%, transparent); }
    .event-top { display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; margin-bottom: 0.25rem; }
    .event-top strong { font-size: 0.85rem; }
    .event-status { font-size: 0.68rem; font-weight: 700; padding: 0.1rem 0.35rem; border-radius: 3px; background: color-mix(in srgb, #22c55e 15%, transparent); color: #16a34a; }
    .event-status.blocked { background: color-mix(in srgb, #ef4444 15%, transparent); color: #dc2626; }
    .event-detail { margin: 0 0 0.25rem; font-size: 0.78rem; color: var(--text-secondary); }
    .event-meta { font-size: 0.65rem; color: var(--text-muted); }

    /* Sandbox */
    .sandbox-list { display: flex; flex-direction: column; gap: 0.4rem; max-height: 28rem; overflow-y: auto; }
    .sandbox-card {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.6rem 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-primary);
    }
    .sandbox-card.denied { border-left: 3px solid #ef4444; }
    .sand-icon {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-weight: 800;
      font-size: 0.85rem;
      background: color-mix(in srgb, #22c55e 15%, transparent);
      color: #16a34a;
      flex-shrink: 0;
    }
    .sandbox-card.denied .sand-icon { background: color-mix(in srgb, #ef4444 15%, transparent); color: #dc2626; }
    .sand-body { flex: 1; min-width: 0; }
    .sand-body strong { font-size: 0.82rem; }
    .sand-body p { margin: 0.15rem 0; font-size: 0.72rem; color: var(--text-muted); }
    .sand-meta { font-size: 0.65rem; color: var(--text-muted); }
    .sand-badge { font-size: 0.65rem; font-weight: 700; padding: 0.2rem 0.45rem; border-radius: var(--radius-sm); background: color-mix(in srgb, #22c55e 12%, transparent); color: #16a34a; }
    .sand-badge.ok { background: color-mix(in srgb, #22c55e 12%, transparent); }
    .sandbox-card.denied .sand-badge { background: color-mix(in srgb, #ef4444 12%, transparent); color: #dc2626; }

    /* Scan */
    .scan-panel { }
    .scan-form { display: flex; flex-direction: column; gap: var(--dash-inline-gap); }
    .scan-input-wrap { display: flex; flex-direction: column; gap: 0.65rem; }
    .scan-textarea { font-size: 0.88rem; line-height: 1.45; resize: vertical; min-height: 8rem; }
    .scan-btn { align-self: flex-start; }

    .scan-result {
      padding: 0.85rem;
      border-radius: var(--radius-md);
      border: 1px solid color-mix(in srgb, #22c55e 40%, var(--border-color));
      background: color-mix(in srgb, #22c55e 6%, transparent);
    }

    .scan-result.blocked {
      border-color: color-mix(in srgb, #ef4444 45%, var(--border-color));
      background: color-mix(in srgb, #ef4444 8%, transparent);
    }

    .scan-result-head { display: flex; gap: 0.65rem; align-items: flex-start; margin-bottom: 0.65rem; }
    .scan-icon { font-size: 1.75rem; }
    .scan-result-head strong { display: block; font-size: 0.9rem; }
    .scan-result-head p { margin: 0.15rem 0 0; font-size: 0.75rem; color: var(--text-muted); }
    .scan-result pre { margin: 0; font-size: 0.72rem; overflow-x: auto; background: var(--bg-primary); padding: 0.65rem; border-radius: var(--radius-sm); }

    .scan-tips {
      padding: 0.75rem;
      border: 1px dashed var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-primary);
    }

    .scan-tips h3 { margin: 0 0 0.5rem; font-size: 0.82rem; }
    .scan-tips ul { margin: 0; padding-left: 1.1rem; font-size: 0.78rem; color: var(--text-secondary); }

    @media (max-width: 960px) {
      .gov-layout { grid-template-columns: 1fr; }
      .gov-nav { position: static; flex-direction: row; flex-wrap: wrap; }
      .nav-item { flex: 1 1 calc(50% - 0.35rem); }
      .pillars { grid-template-columns: repeat(2, 1fr); }
      .overview-charts { grid-template-columns: 1fr; }
      .eval-hero { grid-template-columns: 1fr; }
      .eval-big { border-right: none; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem; }
      .section-toolbar { grid-template-columns: 1fr; }
      .section-search { justify-self: stretch; }
      .section-toolbar-end { justify-self: start; }
    }
`],
})
export class GovernancePage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly tabs = TABS;
  readonly pillars = PILLARS;

  readonly tab = signal<GovTab>('overview');
  readonly loading = signal(true);
  readonly scanning = signal(false);
  readonly error = signal('');
  readonly permissions = signal<Permission[]>([]);
  readonly events = signal<GuardrailEvent[]>([]);
  readonly logs = signal<ToolSandboxLog[]>([]);
  readonly evalDash = signal<Record<string, unknown> | null>(null);
  readonly scanResult = signal<Record<string, unknown> | null>(null);
  readonly eventQuery = signal('');
  readonly permQuery = signal('');
  readonly sandboxQuery = signal('');
  readonly overviewQuery = signal('');

  scanText = '';

  readonly blockedCount = computed(() => this.events().filter((e) => e.blocked).length);
  readonly deniedTools = computed(() => this.logs().filter((l) => !l.allowed).length);
  readonly allowedTools = computed(() => this.logs().filter((l) => l.allowed).length);
  readonly evalApprovals = computed(() => Number(this.evalDash()?.['approvals'] ?? 0));

  readonly complianceScore = computed(() => {
    const events = this.events().length;
    const blocked = this.blockedCount();
    const denied = this.deniedTools();
    const perms = this.permissions().length;
    const approvals = this.evalApprovals();
    let score = 72 + perms * 2 + approvals * 0.5;
    if (events > 0) score -= (blocked / events) * 25;
    score -= denied * 3;
    return Math.max(0, Math.min(100, Math.round(score)));
  });

  readonly complianceLevel = computed((): 'good' | 'warn' | 'risk' => {
    const s = this.complianceScore();
    if (s >= 75) return 'good';
    if (s >= 50) return 'warn';
    return 'risk';
  });

  readonly complianceLabel = computed(() => {
    switch (this.complianceLevel()) {
      case 'good':
        return 'saine';
      case 'warn':
        return 'à surveiller';
      default:
        return 'élevée';
    }
  });

  readonly scoreDash = computed(() => {
    const pct = this.complianceScore() / 100;
    const circumference = 2 * Math.PI * 52;
    return `${pct * circumference} ${circumference}`;
  });

  readonly riskPercent = computed(() => {
    const events = this.events().length || 1;
    const blockedRatio = this.blockedCount() / events;
    const denyRatio = this.logs().length ? this.deniedTools() / this.logs().length : 0;
    return Math.min(100, Math.round((blockedRatio * 0.6 + denyRatio * 0.4) * 100));
  });

  readonly riskLabel = computed(() => {
    const r = this.riskPercent();
    if (r < 25) return 'Faible';
    if (r < 55) return 'Modéré';
    return 'Élevé';
  });

  readonly guardrailDonut = computed(() => {
    const total = this.events().length || 1;
    const blocked = this.blockedCount();
    const blockedPct = (blocked / total) * 100;
    return `conic-gradient(#ef4444 0% ${blockedPct}%, #22c55e ${blockedPct}% 100%)`;
  });

  readonly sandboxAllowPct = computed(() => {
    const t = this.logs().length || 1;
    return Math.round((this.allowedTools() / t) * 100);
  });

  readonly sandboxDenyPct = computed(() => {
    const t = this.logs().length || 1;
    return Math.round((this.deniedTools() / t) * 100);
  });

  readonly recentActivity = computed(() => {
    const items: { id: string; title: string; detail: string; date: string; icon: string; tone: string }[] = [];
    for (const e of this.events().slice(0, 8)) {
      items.push({
        id: 'e-' + e.id,
        title: e.eventType,
        detail: e.blocked ? 'Bloqué · ' + (e.detail ?? e.severity) : e.detail ?? e.severity,
        date: e.createdAt ?? '',
        icon: e.blocked ? '🚫' : '🛡️',
        tone: e.blocked ? 'danger' : 'warn',
      });
    }
    for (const l of this.logs().slice(0, 5)) {
      items.push({
        id: 'l-' + l.id,
        title: l.toolName,
        detail: l.allowed ? 'Outil autorisé' : 'Outil refusé',
        date: l.createdAt ?? '',
        icon: l.allowed ? '🧪' : '⛔',
        tone: l.allowed ? 'neutral' : 'danger',
      });
    }
    return items.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')).slice(0, 10);
  });

  readonly filteredActivity = computed(() => {
    const q = this.overviewQuery().trim().toLowerCase();
    const list = this.recentActivity();
    if (!q) return list;
    return list.filter((a) => a.title.toLowerCase().includes(q) || a.detail.toLowerCase().includes(q));
  });

  readonly filteredPermissions = computed(() => {
    const q = this.permQuery().trim().toLowerCase();
    if (!q) return this.permissions();
    return this.permissions().filter(
      (p) => p.code.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q),
    );
  });

  readonly filteredEvents = computed(() => {
    const q = this.eventQuery().trim().toLowerCase();
    if (!q) return this.events();
    return this.events().filter(
      (e) =>
        e.eventType.toLowerCase().includes(q) ||
        e.severity.toLowerCase().includes(q) ||
        (e.detail ?? '').toLowerCase().includes(q),
    );
  });

  readonly filteredLogs = computed(() => {
    const q = this.sandboxQuery().trim().toLowerCase();
    if (!q) return this.logs();
    return this.logs().filter(
      (l) =>
        l.toolName.toLowerCase().includes(q) ||
        (l.detail ?? '').toLowerCase().includes(q),
    );
  });

  ngOnInit(): void {
    this.reload();
  }

  setTab(id: GovTab): void {
    this.tab.set(id);
  }

  tabBadge(id: GovTab): string | null {
    switch (id) {
      case 'permissions':
        return this.permissions().length ? String(this.permissions().length) : null;
      case 'guardrails':
        return this.blockedCount() ? String(this.blockedCount()) : null;
      case 'sandbox':
        return this.deniedTools() ? String(this.deniedTools()) : null;
      default:
        return null;
    }
  }

  pillarMetric(tab: GovTab): string {
    switch (tab) {
      case 'permissions':
        return String(this.permissions().length);
      case 'eval':
        return String(this.evalApprovals());
      case 'guardrails':
        return `${this.blockedCount()} / ${this.events().length}`;
      case 'sandbox':
        return `${this.deniedTools()} refus`;
      default:
        return '—';
    }
  }

  severityIcon(severity: string): string {
    const s = severity.toLowerCase();
    if (s.includes('high') || s.includes('critical')) return '🔴';
    if (s.includes('medium') || s.includes('warn')) return '🟠';
    return '🟢';
  }

  evalEntries(dash: Record<string, unknown>): { key: string; label: string; value: string }[] {
    return Object.entries(dash).map(([key, value]) => ({
      key,
      label: EVAL_LABELS[key] ?? key,
      value: value == null ? '—' : typeof value === 'object' ? JSON.stringify(value) : String(value),
    }));
  }

  evalBars(dash: Record<string, unknown>): { label: string; value: number; pct: number }[] {
    const approvals = Number(dash['approvals'] ?? 0);
    const rejections = Number(dash['rejections'] ?? 0);
    const escalations = Number(dash['escalations'] ?? 0);
    const max = Math.max(approvals, rejections, escalations, 1);
    return [
      { label: 'Approbations', value: approvals, pct: (approvals / max) * 100 },
      { label: 'Refus', value: rejections, pct: (rejections / max) * 100 },
      { label: 'Escalades', value: escalations, pct: (escalations / max) * 100 },
    ];
  }

  runScan(): void {
    this.scanning.set(true);
    this.api.scanGuardrail(this.scanText).subscribe({
      next: (res) => {
        this.scanning.set(false);
        this.scanResult.set(res);
        this.toast.success(res['blocked'] ? 'Contenu bloqué' : 'Contenu autorisé');
        this.reloadGuardrails();
      },
      error: (err) => {
        this.scanning.set(false);
        this.toast.error(mapHttpError(err));
      },
    });
  }

  private reload(): void {
    this.loading.set(true);
    let pending = 4;
    const done = () => {
      pending -= 1;
      if (pending <= 0) this.loading.set(false);
    };
    this.api.getGovernancePermissionsMe().subscribe({ next: (d) => { this.permissions.set(d); done(); }, error: () => done() });
    this.api.getEvalDashboard().subscribe({ next: (d) => { this.evalDash.set(d); done(); }, error: () => done() });
    this.api.getGuardrailEvents().subscribe({ next: (d) => { this.events.set(d); done(); }, error: () => done() });
    this.api.getSandboxLogs().subscribe({ next: (d) => { this.logs.set(d); done(); }, error: () => done() });
  }

  private reloadGuardrails(): void {
    this.api.getGuardrailEvents().subscribe({ next: (d) => this.events.set(d) });
  }
}
