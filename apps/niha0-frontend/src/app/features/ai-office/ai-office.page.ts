import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Agent, AgentAction, AgentStatus } from '../../core/api/api.models';
import { ThemeService } from '../../core/theme/theme.service';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { AgentStatusService } from '../../core/navigation/agent-status.service';
import {
  agentCodeFromQuery,
  moduleRouteForAgent,
} from '../../core/navigation/agent-module.map';
import {
  getDataLibrary,
  libraryIdFromQuery,
  type WorkspaceEntity,
} from '../../core/workspace/workspace-catalog';
import { WorkspaceSelectionService } from '../../core/workspace/workspace-selection.service';
import { ThemeSwitcherComponent } from './components/theme-switcher.component';
import { OfficeSceneManager, type AgentDeskConfig, type SceneTheme } from './three';
import { ProfessionalWorkspaceService } from '../../core/workspace/professional-workspace.service';
import { AuthService } from '../../core/auth/auth.service';
import { CeoApprovalService } from '../../core/approval/ceo-approval.service';
import type { CeoOfficeOptions } from './three/desk.factory';
import type { SceneTooltipPayload } from './three/interaction-feedback';
import { loadScenePreset } from './three/scene-presets';
import { companyLabel, normalizeCompanyName } from '../../core/tenancy/company-label';
import { NIHAO_ROW_LAYOUTS } from './config/row-layout';
import type { RowDeskSelection } from './models/row-config.model';

const DESK_CODES = [
  'CRM',
  'VENTES',
  'SUPPORT',
  'MARKETING',
  'ERP',
  'COMPTABILITE',
  'RH',
  'JURIDIQUE',
  'STOCK',
  'ANALYTICS',
  'STRATEGIE',
];

const BUBBLE_BY_CODE: Record<string, string> = {
  VENTES: 'Analyse des prospects prioritaires…',
  COMPTABILITE: '3 factures à surveiller.',
  STOCK: 'Vérification des niveaux de stock…',
  SUPPORT: 'Je prépare une réponse au client.',
  JURIDIQUE: 'Contrat analysé : échéance détectée.',
  ANALYTICS: 'Une tendance mérite votre attention.',
  STRATEGIE: 'Je consolide les priorités de la semaine.',
  CRM: 'Historique client mis à jour.',
  ERP: 'Workflow opérationnel en cours.',
  RH: 'Demande de congé à examiner.',
  MARKETING: 'Proposition de campagne prête.',
};

const ONBOARD_KEY = 'niha0_office_onboarded';
const CEO_PAGE_SIZE = 5;
const TOAST_TTL_MS = 3500;
const LOADING_LONG_MS = 2500;

interface OfficeToast {
  id: number;
  message: string;
  tone: 'info' | 'success' | 'warning';
}

function agentStatusLabel(status: AgentStatus): string {
  switch (status) {
    case 'AVAILABLE':
      return 'Disponible';
    case 'THINKING':
      return 'Réflexion';
    case 'PREPARING':
      return 'Préparation';
    case 'WAITING_APPROVAL':
      return 'Validation requise';
    case 'EXECUTING':
      return 'Exécution';
    case 'ERROR':
      return 'Erreur';
    case 'OFFLINE':
      return 'Hors ligne';
    case 'PAUSED':
      return 'En pause';
    default:
      return status;
  }
}

function agentInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
}

@Component({
  selector: 'app-ai-office-page',
  imports: [StatusBadgeComponent, LoadingStateComponent, RouterLink, ThemeSwitcherComponent],
  template: `
    <div class="ai-office">
      <header class="office-header">
        <div class="header-copy">
          <p class="eyebrow">AI Office / Command Center</p>
          <h1>{{ companyDisplayLabel() || 'AI Office Nihao' }}</h1>
          <p class="sub">
            11 agents IA · bureau CEO · open-space
            <span class="demo-engine" [title]="aiEngineDemo() ? 'Recommandations mock / fallback' : 'Moteur LLM branché'">
              · Moteur IA : {{ aiEngineLabel() }}
            </span>
          </p>
        </div>
        <div class="header-actions">
          <app-theme-switcher />
          <label class="bubbles-toggle">
            <input
              type="checkbox"
              [checked]="bubblesOn()"
              (change)="toggleBubbles($event)"
              aria-describedby="bubbles-help"
            />
            Bulles BD
          </label>
          <span id="bubbles-help" class="sr-only">Affiche les bulles de dialogue au-dessus des agents</span>
          @if (pendingCount() > 0) {
            <button
              type="button"
              class="pending-chip"
              (click)="onPendingChipClick()"
              [attr.aria-label]="pendingCount() + ' validation(s) en attente — ouvrir le panneau CEO'"
            >
              {{ pendingCount() }} validation(s)
            </button>
          }
          <a routerLink="/app/dashboard" class="link-dash">Dashboard</a>
          @if (useFallback()) {
            <span class="fallback-badge">Mode 2D</span>
          }
        </div>
      </header>

      @if (loading()) {
        <app-loading-state [message]="displayLoadingMessage()" />
      } @else if (errorMessage(); as err) {
        <div class="state-block" role="alert">
          <p class="state-title">Impossible de charger les agents</p>
          <p class="state-desc">{{ err }}</p>
          <button type="button" class="btn btn-primary" (click)="retryLoadAgents()">Réessayer</button>
        </div>
      } @else if (useFallback()) {
        <div class="state-block fallback-explain">
          <p class="state-title">WebGL indisponible</p>
          <p class="state-desc">
            La scène 3D n’a pas pu démarrer (navigateur, GPU ou taille d’affichage).
            Vous pouvez utiliser la vue 2D ci-dessous ou réessayer le rendu 3D.
          </p>
          <button type="button" class="btn btn-primary" (click)="retryWebgl()">Réessayer la scène 3D</button>
        </div>
        <div class="fallback-grid">
          @for (agent of deskAgents(); track agent.id) {
            <button type="button" class="agent-card" (click)="selectAgent(agent)">
              <strong>{{ agent.name }}</strong>
              <app-status-badge [status]="agent.status" />
            </button>
          }
          <button type="button" class="agent-card ceo" (click)="openCeoPanel()">
            <strong>{{ ownerLabel() }} — {{ ownerRoleLabel() }}</strong>
            <span>{{ pendingCount() }} approbation(s)</span>
          </button>
        </div>
      } @else {
        <div class="canvas-wrap">
          <div
            #canvasHost
            class="canvas-host"
            role="application"
            tabindex="0"
            aria-label="Salle 3D NIHAO"
            aria-describedby="office-hint"
          ></div>
          @if (showSceneTooltip()) {
            <div
              class="scene-tooltip"
              role="tooltip"
              [style.left.%]="sceneTooltip().ndcX * 100"
              [style.top.%]="sceneTooltip().ndcY * 100"
            >
              <strong>{{ sceneTooltip().title }}</strong>
              @if (sceneTooltip().subtitle) {
                <span>{{ sceneTooltip().subtitle }}</span>
              }
            </div>
          }
          <p id="office-hint" class="hint">
            Glisser pour orbiter · Molette pour zoomer · Clic droit pour pan · Survol / clic bureau · Flèches · Entrée · Échap ferme les panneaux
          </p>
        </div>
        <footer class="office-bottom-bar">
          <div class="org-status" aria-live="polite">
            <span class="pulse" aria-hidden="true"></span>
            <span class="org">{{ companyDisplayLabel() || 'Organisation : Organisation' }}</span>
          </div>
        </footer>
      }

      @if (showOnboarding()) {
        <div class="onboard-overlay" role="dialog" aria-modal="true" aria-labelledby="onboard-title">
          <div class="onboard-card">
            <a href="#canvas-skip" class="onboard-skip" (click)="dismissOnboarding($event)">Passer</a>
            <p class="eyebrow">Première visite</p>
            <h2 id="onboard-title">Bienvenue dans l’AI Office</h2>
            <ol class="onboard-steps">
              <li><strong>Orbite</strong> — glissez pour tourner, molette pour zoomer.</li>
              <li><strong>Agents</strong> — survolez ou cliquez un bureau pour ouvrir le panneau.</li>
              <li><strong>Sonnette CEO</strong> — quand un agent attend, utilisez la cloche ou le chip validations.</li>
              <li><strong>Validations</strong> — approuvez, refusez ou reportez depuis le panneau CEO.</li>
            </ol>
            <button type="button" class="btn btn-primary" (click)="dismissOnboarding()">Compris</button>
            <span id="canvas-skip" class="sr-only">Fin de l’aide</span>
          </div>
        </div>
      }

      @if (selectedLibrary(); as lib) {
        <div class="panel-overlay" (click)="closePanels()">
          <aside
            class="panel-slide"
            (click)="$event.stopPropagation()"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lib-panel-title"
          >
            <button type="button" class="close" (click)="closePanels()" aria-label="Fermer le panneau bibliothèque">×</button>
            <p class="eyebrow">Bibliothèque de données</p>
            <h2 id="lib-panel-title">{{ lib.label }}</h2>
            <span class="soon-pill">Bientôt</span>
            <p class="lib-desc">{{ lib.description }}</p>
            <p class="callout">Le contenu de ce module sera prochainement disponible dans NIHAO.</p>
            <div class="lib-actions">
              <a class="btn btn-ghost" [routerLink]="lib.route">Ouvrir la page module</a>
              <button type="button" class="btn btn-primary" (click)="closePanels()">Retour à la scène</button>
            </div>
          </aside>
        </div>
      }

      @if (selectedRowDesk(); as desk) {
        <div class="panel-overlay" (click)="closePanels()">
          <aside
            class="panel-slide"
            (click)="$event.stopPropagation()"
            role="dialog"
            aria-modal="true"
            aria-labelledby="row-desk-panel-title"
          >
            <button type="button" class="close" (click)="closePanels()" aria-label="Fermer le panneau bureau">×</button>
            <p class="eyebrow">Équipe {{ desk.role }} · Chef : {{ desk.chiefTitle }}</p>
            <h2 id="row-desk-panel-title">{{ desk.label }}</h2>
            <span class="team-swatch" [style.background]="desk.color" aria-hidden="true"></span>
            <p class="agent-desc">Agent IA — poste clé de l'équipe {{ desk.role }}.</p>
            <p class="etat">LED verte : action validée au poste · LED rouge : confirmation humaine requise</p>
            <button type="button" class="btn btn-primary" (click)="closePanels()">Retour à la scène</button>
          </aside>
        </div>
      }

      @if (selectedAgent(); as agent) {
        <div class="panel-overlay" (click)="closePanels()">
          <aside
            class="panel-slide"
            (click)="$event.stopPropagation()"
            role="dialog"
            aria-modal="true"
            aria-labelledby="agent-panel-title"
          >
            <button type="button" class="close" (click)="closePanels()" aria-label="Fermer le panneau agent">×</button>
            <div class="agent-head">
              <span class="avatar-circle" aria-hidden="true">{{ initials(agent.name) }}</span>
              <div>
                <h2 id="agent-panel-title">{{ agent.name }}</h2>
                <app-status-badge [status]="agent.status" />
              </div>
            </div>
            <p class="agent-desc">{{ agent.description || 'Aucune description disponible pour cet agent.' }}</p>
            <h3>Mission</h3>
            <p>{{ agent.mission || 'Mission non renseignée.' }}</p>
            <h3>État</h3>
            <p class="etat">{{ statusLabel(agent.status) }}</p>
            <a class="btn btn-primary" [routerLink]="moduleRoute(agent.code)">Ouvrir le module</a>
          </aside>
        </div>
      }

      @if (ceoPanelOpen()) {
        <div class="panel-overlay" (click)="closePanels()">
          <aside
            class="panel-slide ceo-panel"
            (click)="$event.stopPropagation()"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ceo-panel-title"
          >
            <button type="button" class="close" (click)="closePanels()" aria-label="Fermer le panneau CEO">×</button>
            <p class="eyebrow">{{ ownerRoleLabel() }} — {{ companyDisplayLabel() || 'Organisation : Organisation' }}</p>
            <h2 id="ceo-panel-title">{{ ownerLabel() }}</h2>
            <p class="sub">NIHAO Command Center</p>
            <div class="comic-box" aria-live="polite">
              @if (pendingActions()[0]; as action) {
                <p class="bubble agent">« {{ action.description || action.title }} »</p>
                <p class="bubble ceo">« Examiner la proposition : »</p>
              } @else {
                <p class="bubble ceo">« Aucune validation en attente. Les agents sont à leur poste. »</p>
              }
            </div>
            <h3>Validations</h3>
            @if (pendingActions().length > 0) {
              <label class="ceo-search-label" for="ceo-search">Filtrer</label>
              <input
                id="ceo-search"
                class="input ceo-search"
                type="search"
                placeholder="Rechercher une validation…"
                [value]="ceoSearch()"
                (input)="onCeoSearch($event)"
              />
            }
            @if (filteredPending().length === 0) {
              <div class="empty-ceo">
                <p class="empty-illus" aria-hidden="true">◎</p>
                <p class="state-title">{{ pendingActions().length === 0 ? 'Boîte de validation vide' : 'Aucun résultat' }}</p>
                <p class="state-desc">
                  {{ pendingActions().length === 0
                    ? 'Les agents travaillent — revenez quand une sonnette retentit.'
                    : 'Essayez un autre terme de recherche.' }}
                </p>
                @if (pendingActions().length === 0) {
                  <button type="button" class="btn btn-ghost" (click)="closePanels()">Retour à la scène</button>
                }
              </div>
            } @else {
              @for (action of visiblePending(); track action.id) {
                <article class="approval-item">
                  <strong>{{ action.title }}</strong>
                  <p>{{ action.description || 'Sans détail supplémentaire.' }}</p>
                  <div class="approval-btns">
                    <button type="button" class="btn btn-primary" (click)="approve(action.id)">Approuver</button>
                    <button type="button" class="btn btn-ghost" (click)="modify(action.id)">Modifier</button>
                    <button type="button" class="btn btn-ghost" (click)="defer(action.id)">Reporter</button>
                    <button type="button" class="btn btn-danger" (click)="reject(action.id)">Refuser</button>
                  </div>
                </article>
              }
              @if (filteredPending().length > ceoVisibleCount()) {
                <button type="button" class="btn btn-ghost show-more" (click)="showMoreCeo()">
                  Afficher plus ({{ filteredPending().length - ceoVisibleCount() }} restantes)
                </button>
              }
            }
          </aside>
        </div>
      }

      <div class="toast-region" aria-live="polite" aria-relevant="additions">
        @for (t of toasts(); track t.id) {
          <div
            class="toast"
            [class.tone-info]="t.tone === 'info'"
            [class.tone-success]="t.tone === 'success'"
            [class.tone-warning]="t.tone === 'warning'"
            role="status"
          >{{ t.message }}</div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex: 1;
      min-height: 0;
      height: 100%;
    }
    .ai-office {
      flex: 1;
      min-height: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: transparent;
      overflow: hidden;
      position: relative;
    }
    .office-header {
      flex: 0 0 auto;
      display: flex;
      justify-content: space-between;
      gap: 0.75rem 1rem;
      flex-wrap: wrap;
      align-items: flex-start;
      padding: 0.55rem 0.85rem 0.5rem;
      border-bottom: 1px solid var(--border-color);
      background: color-mix(in srgb, var(--bg-secondary) 55%, transparent);
    }
    .header-copy { min-width: 0; flex: 1 1 220px; }
    .eyebrow {
      margin: 0;
      font-size: 0.62rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-weight: 650;
      color: var(--text-muted, var(--text-secondary));
      font-family: var(--font-mono, var(--font-sans));
    }
    h1 {
      margin: 0.1rem 0;
      font-size: clamp(1.05rem, 0.95rem + 0.45vw, 1.35rem);
      font-family: var(--font-display);
      font-weight: 750;
      line-height: 1.2;
    }
    .sub { margin: 0; color: var(--text-secondary); font-size: 0.75rem; }
    .demo-engine { color: var(--text-muted); font-size: 0.72rem; }
    .header-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      flex-wrap: wrap;
      justify-content: flex-end;
      flex: 1 1 240px;
    }
    .bubbles-toggle {
      font-size: 0.72rem;
      color: var(--text-secondary);
      display: flex;
      gap: 0.35rem;
      align-items: center;
      font-weight: 600;
    }
    .pending-chip {
      border: 1px solid color-mix(in srgb, var(--accent-warning) 50%, transparent);
      background: color-mix(in srgb, var(--accent-warning) 14%, transparent);
      color: var(--accent-warning);
      border-radius: var(--radius-sm);
      padding: 0.3rem 0.65rem;
      cursor: pointer;
      font-weight: 700;
      font-size: 0.75rem;
      transition: background var(--transition), border-color var(--transition),
        transform var(--transition), box-shadow var(--transition);
    }
    .pending-chip:hover {
      background: color-mix(in srgb, var(--accent-warning) 22%, transparent);
      box-shadow: var(--shadow-sm);
    }
    .pending-chip:focus-visible {
      outline: 2px solid color-mix(in srgb, var(--accent-warning) 55%, transparent);
      outline-offset: 2px;
    }
    .pending-chip:active { transform: translateY(1px); }
    .link-dash {
      color: var(--accent-primary);
      font-size: 0.78rem;
      font-weight: 650;
      text-decoration: none;
      transition: color var(--transition), opacity var(--transition);
    }
    .link-dash:hover { opacity: 0.88; text-decoration: underline; }
    .link-dash:focus-visible {
      outline: 2px solid color-mix(in srgb, var(--accent-primary) 45%, transparent);
      outline-offset: 2px;
      border-radius: 2px;
    }
    .fallback-badge {
      font-size: 0.7rem;
      border: 1px solid var(--accent-warning);
      color: var(--accent-warning);
      padding: 0.2rem 0.45rem;
      border-radius: var(--radius-sm);
      font-weight: 650;
    }
    .canvas-wrap {
      flex: 1;
      min-height: 280px;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .canvas-host {
      flex: 1;
      min-height: 240px;
      margin: 0.5rem 0.65rem 0;
      border-radius: var(--radius-md);
      overflow: hidden;
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-md);
      background: var(--scene-bg);
      position: relative;
    }
    .canvas-host:focus-visible {
      outline: 2px solid color-mix(in srgb, var(--accent-primary) 50%, transparent);
      outline-offset: 2px;
    }
    .canvas-host canvas {
      display: block;
      width: 100% !important;
      height: 100% !important;
    }
    .scene-tooltip {
      position: absolute;
      z-index: 5;
      pointer-events: none;
      transform: translate(-50%, calc(-100% - 10px));
      padding: 0.4rem 0.65rem;
      border-radius: var(--radius-sm);
      background: color-mix(in srgb, var(--bg-elevated) 92%, transparent);
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-md);
      max-width: 220px;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .scene-tooltip strong {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .scene-tooltip span {
      font-size: 0.68rem;
      color: var(--text-secondary);
    }
    .hint {
      flex: 0 0 auto;
      text-align: center;
      font-size: 0.65rem;
      color: var(--text-muted);
      margin: 0.35rem 0 0.5rem;
      letter-spacing: 0.02em;
      padding: 0 0.75rem;
    }
    .office-bottom-bar {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.45rem 0.85rem 0.55rem;
      border-top: 1px solid var(--border-color);
      background: color-mix(in srgb, var(--bg-secondary) 55%, transparent);
    }
    .org-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: var(--text-secondary);
      min-width: 0;
    }
    .org-status .org {
      font-weight: 650;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .org-status .pulse {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--accent-success);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-success) 25%, transparent);
      flex-shrink: 0;
    }
    .state-block {
      margin: 1rem;
      padding: 1.25rem 1.35rem;
      border: 1px dashed var(--border-color);
      border-radius: var(--radius-lg);
      background: color-mix(in srgb, var(--bg-elevated) 65%, transparent);
      text-align: center;
    }
    .state-title {
      margin: 0 0 0.35rem;
      font-weight: 750;
      font-size: 0.95rem;
    }
    .state-desc {
      margin: 0 0 1rem;
      color: var(--text-secondary);
      font-size: 0.85rem;
      line-height: 1.45;
    }
    .fallback-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 0.75rem;
      padding: 0 1rem 1rem;
      overflow: auto;
    }
    .agent-card {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      padding: 0.9rem;
      text-align: left;
      background: var(--bg-elevated);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      cursor: pointer;
      box-shadow: var(--shadow-sm);
      transition: border-color var(--transition), box-shadow var(--transition), transform var(--transition);
    }
    .agent-card:hover { border-color: var(--border-strong); box-shadow: var(--shadow-md); }
    .agent-card:focus-visible {
      outline: 2px solid color-mix(in srgb, var(--accent-primary) 45%, transparent);
      outline-offset: 2px;
    }
    .agent-card:active { transform: translateY(1px); }
    .agent-card.ceo {
      border-color: var(--border-strong);
      grid-column: 1 / -1;
      max-width: 360px;
    }
    .panel-overlay {
      position: fixed;
      inset: 0;
      background: rgba(8, 12, 20, 0.55);
      backdrop-filter: blur(4px);
      display: flex;
      justify-content: flex-end;
      z-index: 40;
    }
    .panel-slide {
      width: min(420px, 100%);
      background: var(--bg-secondary);
      border-left: 1px solid var(--border-color);
      padding: 1.35rem;
      overflow-y: auto;
      box-shadow: var(--shadow-lg);
      animation: panel-in 0.22s ease-out;
    }
    @keyframes panel-in {
      from { transform: translateX(18px); opacity: 0.85; }
      to { transform: translateX(0); opacity: 1; }
    }
    .close {
      float: right;
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 1.5rem;
      cursor: pointer;
      line-height: 1;
      border-radius: var(--radius-sm);
      transition: color var(--transition), background var(--transition);
    }
    .close:hover { color: var(--text-primary); background: var(--bg-hover); }
    .close:focus-visible {
      outline: 2px solid color-mix(in srgb, var(--accent-primary) 45%, transparent);
      outline-offset: 2px;
    }
    .agent-head {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .team-swatch {
      display: inline-block;
      width: 1rem;
      height: 1rem;
      border-radius: 50%;
      margin: 0.35rem 0 0.5rem;
    }
    .avatar-circle {
      width: 2.6rem;
      height: 2.6rem;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.85rem;
      letter-spacing: 0.02em;
      background: color-mix(in srgb, var(--accent-primary) 18%, var(--bg-elevated));
      color: var(--accent-primary);
      border: 1px solid color-mix(in srgb, var(--accent-primary) 35%, transparent);
      flex-shrink: 0;
    }
    .agent-desc, .etat {
      color: var(--text-secondary);
      font-size: 0.9rem;
      line-height: 1.45;
    }
    .comic-box { margin: 1rem 0; display: flex; flex-direction: column; gap: 0.5rem; }
    .bubble {
      margin: 0;
      padding: 0.7rem 0.9rem;
      border-radius: var(--radius-md);
      font-size: 0.85rem;
      line-height: 1.4;
      border: 1px solid var(--border-color);
      max-width: 100%;
    }
    .bubble.agent {
      background: color-mix(in srgb, var(--accent-primary) 12%, var(--bg-elevated));
      align-self: flex-start;
    }
    .bubble.ceo {
      background: color-mix(in srgb, var(--accent-secondary) 12%, var(--bg-elevated));
      align-self: flex-end;
      border-radius: var(--radius-md) var(--radius-md) 0.25rem var(--radius-md);
    }
    .ceo-search-label {
      display: block;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 0.35rem;
    }
    .ceo-search { margin-bottom: 0.75rem; }
    .approval-item { padding: 0.85rem 0; border-bottom: 1px solid var(--border-color); }
    .approval-btns { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.6rem; }
    .show-more { width: 100%; margin-top: 0.75rem; }
    .empty-ceo {
      text-align: center;
      padding: 1.25rem 0.5rem 0.5rem;
    }
    .empty-illus {
      margin: 0;
      font-size: 2rem;
      opacity: 0.45;
      line-height: 1;
    }
    .lib-desc {
      margin: 0.85rem 0 0.5rem;
      color: var(--text-secondary);
      font-size: 0.9rem;
      line-height: 1.45;
    }
    .callout {
      margin: 0;
      padding: 0.7rem 0.85rem;
      border-radius: var(--radius-sm);
      background: color-mix(in srgb, var(--accent-primary) 8%, var(--bg-elevated));
      border: 1px solid var(--border-color);
      font-size: 0.82rem;
      color: var(--text-secondary);
      line-height: 1.4;
    }
    .lib-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1.25rem;
    }
    .soon-pill {
      display: inline-block;
      margin-top: 0.35rem;
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 0.3rem 0.55rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      background: var(--bg-elevated);
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      padding: 0.5rem 0.95rem;
      border-radius: var(--radius-sm);
      border: 1px solid transparent;
      cursor: pointer;
      font-weight: 650;
      font-size: 0.82rem;
      transition: background var(--transition), border-color var(--transition),
        color var(--transition), box-shadow var(--transition), transform var(--transition),
        filter var(--transition), opacity var(--transition);
    }
    .btn:hover:not(:disabled) { filter: brightness(1.04); }
    .btn:focus-visible {
      outline: 2px solid color-mix(in srgb, var(--accent-primary) 45%, transparent);
      outline-offset: 2px;
    }
    .btn:active:not(:disabled) { transform: translateY(1px); }
    .btn:disabled, .btn.is-loading {
      opacity: 0.55;
      cursor: not-allowed;
      pointer-events: none;
    }
    .btn-primary {
      background: var(--accent-primary);
      color: var(--on-accent, #041018);
    }
    .btn-primary:hover:not(:disabled) { box-shadow: var(--shadow-md); }
    .btn-ghost {
      background: transparent;
      color: var(--text-secondary);
      border-color: var(--border-color);
    }
    .btn-ghost:hover:not(:disabled) {
      background: var(--bg-hover);
      color: var(--text-primary);
      border-color: var(--border-strong);
    }
    .btn-danger {
      background: var(--accent-danger);
      color: #fff;
    }
    .input {
      width: 100%;
      box-sizing: border-box;
      padding: 0.55rem 0.75rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      color: var(--text-primary);
    }
    .input:focus {
      outline: none;
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-primary) 22%, transparent);
    }
    .toast-region {
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      z-index: 60;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      max-width: min(320px, calc(100vw - 2rem));
      pointer-events: none;
    }
    .toast {
      padding: 0.7rem 0.9rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background: var(--bg-elevated);
      color: var(--text-primary);
      font-size: 0.82rem;
      font-weight: 650;
      box-shadow: var(--shadow-lg);
      animation: toast-in 0.2s ease-out;
    }
    .toast.tone-success {
      border-color: color-mix(in srgb, var(--accent-success, #22a06b) 45%, transparent);
      background: color-mix(in srgb, var(--accent-success, #22a06b) 12%, var(--bg-elevated));
    }
    .toast.tone-warning {
      border-color: color-mix(in srgb, var(--accent-warning) 45%, transparent);
      background: color-mix(in srgb, var(--accent-warning) 12%, var(--bg-elevated));
    }
    @keyframes toast-in {
      from { transform: translateY(8px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .onboard-overlay {
      position: fixed;
      inset: 0;
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: rgba(8, 12, 20, 0.62);
      backdrop-filter: blur(5px);
    }
    .onboard-card {
      width: min(440px, 100%);
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.35rem 1.4rem;
      box-shadow: var(--shadow-lg);
      position: relative;
    }
    .onboard-skip {
      position: absolute;
      top: 0.85rem;
      right: 1rem;
      font-size: 0.75rem;
      color: var(--accent-primary);
      font-weight: 650;
    }
    .onboard-steps {
      margin: 0.85rem 0 1.15rem;
      padding-left: 1.15rem;
      color: var(--text-secondary);
      font-size: 0.88rem;
      line-height: 1.5;
    }
    .onboard-steps li { margin-bottom: 0.45rem; }
    .onboard-steps strong { color: var(--text-primary); }
@media (max-width: 900px) {
      .office-header { padding: 0.5rem 0.75rem; }
      .header-actions { width: 100%; justify-content: flex-start; }
      .canvas-wrap { min-height: 260px; }
      .hint { font-size: 0.72rem; }
    }
    @media (max-width: 640px) {
      .office-header { flex-direction: column; align-items: stretch; }
      .header-actions { flex: 1 1 auto; }
      .canvas-wrap { min-height: 220px; }
      .canvas-host { min-height: 200px; margin: 0.4rem 0.45rem 0; }
      .hint { font-size: 0.78rem; line-height: 1.35; }
      .panel-slide { width: 100%; }
      .toast-region { right: 0.65rem; bottom: 0.65rem; }
    }
    @media (prefers-reduced-motion: reduce) {
      .panel-slide { animation: none; }
      .toast { animation: none; }
      .btn, .pending-chip, .link-dash, .agent-card, .theme-btn {
        transition: none;
      }
    }
  `],
})
export class AiOfficePage implements OnInit, OnDestroy {
  @ViewChild('canvasHost', { static: false }) canvasHost?: ElementRef<HTMLDivElement>;

  private readonly api = inject(ApiService);
  private readonly theme = inject(ThemeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly agentStatus = inject(AgentStatusService);
  private readonly workspaceSelection = inject(WorkspaceSelectionService);
  readonly workspace = inject(ProfessionalWorkspaceService);
  private readonly authUser = inject(AuthService);
  private readonly ceoApproval = inject(CeoApprovalService);

  readonly loading = signal(true);
  readonly loadingLong = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly agents = signal<Agent[]>([]);
  readonly selectedAgent = signal<Agent | null>(null);
  readonly selectedRowDesk = signal<RowDeskSelection | null>(null);
  readonly selectedLibrary = signal<WorkspaceEntity | null>(null);
  readonly ceoPanelOpen = signal(false);
  readonly useFallback = signal(false);
  readonly pendingCount = signal(0);
  readonly pendingActions = signal<AgentAction[]>([]);
  readonly bubblesOn = signal(localStorage.getItem('niha0_bubbles') !== '0');
  readonly aiEngineLabel = signal('Démo (mock)');
  readonly aiEngineDemo = signal(true);
  readonly showOnboarding = signal(localStorage.getItem(ONBOARD_KEY) !== '1');
  readonly sceneTooltip = signal<SceneTooltipPayload>({
    kind: null,
    title: '',
    ndcX: 0,
    ndcY: 0,
    visible: false,
  });
  readonly toasts = signal<OfficeToast[]>([]);
  readonly ceoSearch = signal('');
  readonly ceoVisibleCount = signal(CEO_PAGE_SIZE);

  readonly filteredPending = computed(() => {
    const q = this.ceoSearch().trim().toLowerCase();
    const list = [...this.pendingActions()].sort((a, b) =>
      a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' }),
    );
    if (!q) return list;
    return list.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.description || '').toLowerCase().includes(q),
    );
  });

  readonly visiblePending = computed(() =>
    this.filteredPending().slice(0, this.ceoVisibleCount()),
  );

  readonly showSceneTooltip = computed(() => {
    const tip = this.sceneTooltip();
    if (!tip.visible) return false;
    if (this.selectedAgent() || this.selectedRowDesk() || this.selectedLibrary() || this.ceoPanelOpen() || this.showOnboarding()) {
      return false;
    }
    return true;
  });

  /** Stable CEO branding options — tracked by appearance effect only when values change. */
  private readonly ceoOptions = computed<CeoOfficeOptions>(
    () => {
      const profile = this.workspace.profile();
      const user = this.authUser.user();
      return {
        companyName: normalizeCompanyName(
          profile.companyName || user?.organizationName || 'Entreprise',
        ) || 'Entreprise',
        ownerLabel: user ? `${user.firstName} ${user.lastName}` : 'CEO',
        branding: this.workspace.branding(),
        logoUrl: profile.logoUrl,
      };
    },
    {
      equal: (a, b) =>
        a.companyName === b.companyName &&
        a.ownerLabel === b.ownerLabel &&
        a.logoUrl === b.logoUrl &&
        a.branding?.themePreset === b.branding?.themePreset &&
        a.branding?.primaryColor === b.branding?.primaryColor &&
        a.branding?.secondaryColor === b.branding?.secondaryColor &&
        a.branding?.accentColor === b.branding?.accentColor &&
        a.branding?.carpetStyle === b.branding?.carpetStyle &&
        a.branding?.carpetText === b.branding?.carpetText,
    },
  );

  private sceneManager: OfficeSceneManager | null = null;
  private focusCode: string | null = null;
  private focusLibraryId: string | null = null;
  private readonly subs = new Subscription();
  private loadingTimer: ReturnType<typeof setTimeout> | null = null;
  private toastSeq = 0;
  private readonly toastTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private prevPendingCount = 0;
  private actionsHydrated = false;

  readonly loadingMessage = computed(
    () => `Ouverture de la salle ${this.companyDisplayLabel() || 'Nihao'}…`,
  );

  readonly companyDisplayLabel = computed(() => {
    const profile = this.workspace.profile();
    const user = this.authUser.user();
    const raw =
      profile.companyName ||
      user?.organizationName ||
      this.workspace.office().workspaceName ||
      '';
    return raw ? companyLabel(raw) : '';
  });
  readonly displayLoadingMessage = computed(() =>
    this.loadingLong()
      ? `${this.loadingMessage()} Préparation de la scène 3D…`
      : this.loadingMessage(),
  );
  readonly ownerLabel = computed(() => {
    const u = this.authUser.user();
    return u ? `${u.firstName} ${u.lastName}`.trim() : 'CEO';
  });
  readonly ownerRoleLabel = computed(() => {
    const role = this.authUser.user()?.role;
    if (role === 'OWNER') return 'Owner';
    if (role === 'ADMIN') return 'Admin';
    return role ?? 'Owner';
  });

  constructor() {
    // Theme / branding / preset → scene rebuild (guarded inside scene manager). Never write signals here.
    effect(() => {
      this.theme.resolved();
      loadScenePreset();
      const theme = this.resolveSceneTheme();
      const opts = this.ceoOptions();
      untracked(() => this.sceneManager?.applySceneAppearance(theme, opts));
    });
    // Backend pending → approval store (do NOT read officeState in the same effect — infinite loop).
    effect(() => {
      const pending = this.pendingActions();
      const agents = this.agents();
      untracked(() => this.ceoApproval.syncFromBackend(pending, agents));
    });
    // Approval store → 3D door/bell/CEO visuals only (no scene rebuild).
    effect(() => {
      const state = this.ceoApproval.officeState();
      untracked(() => this.sceneManager?.setCeoOfficeState(state));
    });
    // LEDs Nihao — vert autonome / rouge validation humaine.
    effect(() => {
      const pending = this.pendingActions();
      const agents = this.agents();
      untracked(() => this.pushNihaoLedSync(pending, agents));
    });
  }

  private pushNihaoLedSync(pending: AgentAction[], agents: Agent[]): void {
    if (!this.sceneManager || this.useFallback()) return;
    this.sceneManager.syncNihaoLeds({
      agents: agents.map((a) => ({
        id: a.id,
        code: a.code,
        status: pending.some((p) => p.agentId === a.id) ? 'WAITING_APPROVAL' : a.status,
      })),
      pendingAgentIds: new Set(pending.map((p) => p.agentId)),
    });
  }

  ngOnInit(): void {
    void this.workspace.hydrate();
    this.applyDeepLinkFromQuery(this.route.snapshot.queryParamMap);
    this.subs.add(
      this.route.queryParamMap.subscribe((q) => {
        this.applyDeepLinkFromQuery(q);
      }),
    );

    this.startLoadingTimer();
    this.fetchAgents();
    this.api.getAgentEngine().subscribe({
      next: (engine) => {
        this.aiEngineLabel.set(engine.label);
        this.aiEngineDemo.set(engine.demo);
      },
    });
  }

  @HostListener('window:keydown', ['$event'])
  onWindowKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      if (this.showOnboarding()) {
        e.preventDefault();
        this.dismissOnboarding();
        return;
      }
      if (this.selectedAgent() || this.selectedRowDesk() || this.selectedLibrary() || this.ceoPanelOpen()) {
        e.preventDefault();
        this.closePanels();
        return;
      }
    }

    if (this.useFallback() || !this.sceneManager) return;
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement)?.isContentEditable) {
      return;
    }
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' '].includes(e.key)) {
      this.sceneManager.navigateWithKey(e.key, e);
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.clearLoadingTimer();
    for (const t of this.toastTimers.values()) clearTimeout(t);
    this.toastTimers.clear();
    this.sceneManager?.dispose();
    this.sceneManager = null;
  }

  deskAgents(): Agent[] {
    return this.agents().filter((a) => DESK_CODES.includes(a.code));
  }

  initials(name: string): string {
    return agentInitials(name);
  }

  statusLabel(status: AgentStatus): string {
    return agentStatusLabel(status);
  }

  onCeoSearch(ev: Event): void {
    this.ceoSearch.set((ev.target as HTMLInputElement).value);
    this.ceoVisibleCount.set(CEO_PAGE_SIZE);
  }

  showMoreCeo(): void {
    this.ceoVisibleCount.update((n) => n + CEO_PAGE_SIZE);
  }

  onPendingChipClick(): void {
    this.openCeoPanel();
    this.focusCeoScene();
  }

  dismissOnboarding(ev?: Event): void {
    ev?.preventDefault();
    localStorage.setItem(ONBOARD_KEY, '1');
    this.showOnboarding.set(false);
    this.restoreCanvasFocus();
  }

  selectAgent(agent: Agent): void {
    this.selectedAgent.set(agent);
    this.selectedRowDesk.set(null);
    this.selectedLibrary.set(null);
    this.ceoPanelOpen.set(false);
    this.workspaceSelection.selectAgent(agent.id, agent.code);
    this.sceneManager?.setSelectedAgent(agent.id);
    localStorage.setItem('niha0_last_agent', agent.code);
  }

  selectRowDesk(code: string): void {
    const match = /^R(\d+)A(\d+)$/.exec(code);
    if (!match) return;
    const rowId = Number(match[1]);
    const deskIndex = Number(match[2]) - 1;
    const row = NIHAO_ROW_LAYOUTS.find((r) => r.rowId === rowId);
    if (!row || deskIndex < 0 || deskIndex >= row.agents.length) return;
    this.selectedRowDesk.set({
      id: code,
      rowId,
      deskIndex,
      role: row.role,
      chiefTitle: row.chiefTitle,
      color: row.color,
      label: row.agents[deskIndex]!.title,
    });
    this.selectedAgent.set(null);
    this.selectedLibrary.set(null);
    this.ceoPanelOpen.set(false);
    this.sceneManager?.setSelectedRowDesk(code);
    this.sceneManager?.focusRowDesk(code);
  }

  selectChiefRow(rowId: number): void {
    const row = NIHAO_ROW_LAYOUTS.find((r) => r.rowId === rowId);
    if (!row) return;
    this.selectedRowDesk.set({
      id: `CHIEF-R${rowId}`,
      rowId,
      deskIndex: -1,
      role: row.role,
      chiefTitle: row.chiefTitle,
      color: row.color,
      label: row.chief.title,
    });
    this.selectedAgent.set(null);
    this.selectedLibrary.set(null);
    this.ceoPanelOpen.set(false);
    this.sceneManager?.focusChief(rowId);
  }

  private applyDeepLinkFromQuery(q: import('@angular/router').ParamMap): void {
    const desk = q.get('desk');
    if (desk && /^R\d+A\d+$/.test(desk)) {
      this.focusCode = null;
      this.focusLibraryId = null;
      this.selectRowDesk(desk);
      return;
    }

    const rowParam = q.get('row');
    if (rowParam && q.get('focus') === 'chief') {
      const rowId = Number(rowParam);
      if (rowId >= 1) {
        this.focusCode = null;
        this.focusLibraryId = null;
        this.selectChiefRow(rowId);
        return;
      }
    }

    this.focusCode = agentCodeFromQuery(q.get('agent'));
    this.focusLibraryId = libraryIdFromQuery(q.get('library'));
    if (this.focusLibraryId) {
      this.openLibrary(this.focusLibraryId);
      return;
    }
    if (this.focusCode) {
      this.sceneManager?.focusAgent(this.focusCode);
      const ag = this.deskAgents().find((a) => a.code === this.focusCode);
      if (ag) this.selectAgent(ag);
    }
  }

  openLibrary(id: string): void {
    const lib = getDataLibrary(id);
    if (!lib) return;
    this.selectedLibrary.set(lib);
    this.selectedAgent.set(null);
    this.selectedRowDesk.set(null);
    this.ceoPanelOpen.set(false);
    this.workspaceSelection.selectLibrary(lib.id);
    this.sceneManager?.focusLibrary(lib.id);
  }

  openCeoPanel(): void {
    this.ceoPanelOpen.set(true);
    this.selectedAgent.set(null);
    this.selectedRowDesk.set(null);
    this.selectedLibrary.set(null);
    this.ceoSearch.set('');
    this.ceoVisibleCount.set(CEO_PAGE_SIZE);
    this.workspaceSelection.selectCeo();
    this.sceneManager?.setSelectedAgent(null);
    this.sceneManager?.setSelectedLibrary(null);
  }

  closePanels(): void {
    this.selectedAgent.set(null);
    this.selectedRowDesk.set(null);
    this.selectedLibrary.set(null);
    this.ceoPanelOpen.set(false);
    this.workspaceSelection.clear();
    this.sceneManager?.setSelectedAgent(null);
    this.sceneManager?.setSelectedRowDesk(null);
    this.sceneManager?.setSelectedLibrary(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { library: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    this.restoreCanvasFocus();
  }

  toggleBubbles(ev: Event): void {
    const on = (ev.target as HTMLInputElement).checked;
    this.bubblesOn.set(on);
    localStorage.setItem('niha0_bubbles', on ? '1' : '0');
    this.sceneManager?.setBubblesEnabled(on);
  }

  moduleRoute(code: string): string {
    return moduleRouteForAgent(code);
  }

  retryLoadAgents(): void {
    this.errorMessage.set(null);
    this.loading.set(true);
    this.startLoadingTimer();
    this.fetchAgents();
  }

  retryWebgl(): void {
    this.useFallback.set(false);
    this.scheduleBoot();
  }

  approve(id: string): void {
    this.ceoApproval.approve(id, 'Approuvé depuis AI Office').subscribe(() => {
      this.pushToast('Action approuvée', 'success');
      this.afterDecision();
    });
  }
  reject(id: string): void {
    this.ceoApproval.reject(id, 'Refusé depuis AI Office').subscribe(() => {
      this.pushToast('Action refusée', 'success');
      this.afterDecision();
    });
  }
  defer(id: string): void {
    this.api.deferAction(id, 'Reporté depuis AI Office').subscribe(() => this.afterDecision());
  }
  modify(id: string): void {
    this.api.modifyAction(id, 'Modification demandée').subscribe(() => this.afterDecision());
  }

  private afterDecision(): void {
    this.agentStatus.refresh();
    this.refreshActions(() => {
      this.syncScene();
      this.sceneManager?.setCeoOfficeState(this.ceoApproval.officeState());
    });
    this.closePanels();
  }

  private fetchAgents(): void {
    this.api.getAgents().subscribe({
      next: (agents) => {
        this.agents.set(agents);
        this.errorMessage.set(null);
        this.refreshActions(() => {
          this.loading.set(false);
          this.clearLoadingTimer();
          this.scheduleBoot();
        });
      },
      error: () => {
        this.loading.set(false);
        this.clearLoadingTimer();
        this.errorMessage.set(
          'La liste des agents est inaccessible pour le moment. Vérifiez votre connexion puis réessayez.',
        );
      },
    });
  }

  private startLoadingTimer(): void {
    this.clearLoadingTimer();
    this.loadingLong.set(false);
    this.loadingTimer = setTimeout(() => this.loadingLong.set(true), LOADING_LONG_MS);
  }

  private clearLoadingTimer(): void {
    if (this.loadingTimer) {
      clearTimeout(this.loadingTimer);
      this.loadingTimer = null;
    }
    this.loadingLong.set(false);
  }

  private scheduleBoot(): void {
    // Wait for @if canvas host to mount, then for flex layout to give it height.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.bootScene(0));
    });
  }

  private bootScene(attempt = 0): void {
    if (this.useFallback()) return;
    const host = this.canvasHost?.nativeElement;
    if (!host) {
      if (attempt < 40) {
        setTimeout(() => this.bootScene(attempt + 1), 25);
      } else {
        this.useFallback.set(true);
      }
      return;
    }

    // Force a measurable box before WebGL init (flex can report 0 briefly).
    if (host.clientWidth < 8 || host.clientHeight < 8) {
      if (attempt < 40) {
        setTimeout(() => this.bootScene(attempt + 1), 40);
      } else {
        this.useFallback.set(true);
      }
      return;
    }

    try {
      this.sceneManager?.dispose();
      this.sceneManager = new OfficeSceneManager(host);
      this.sceneManager.init(this.resolveSceneTheme(), this.toDeskConfigs(), this.ceoOptions());
      this.sceneManager.setBubblesEnabled(this.bubblesOn());
      this.sceneManager.setCeoOfficeState(this.ceoApproval.officeState());
      this.sceneManager.onApprovalEvent((event, agentId) => {
        if (event === 'agent-moving' && agentId) {
          this.ceoApproval.markAgentMoving(agentId);
        }
        if (event === 'agent-at-door' && agentId) {
          this.ceoApproval.markWaitingAtDoor(agentId);
          window.setTimeout(() => this.ceoApproval.markRinging(agentId), 400);
        }
        if (event === 'bell-click') {
          this.openCeoPanel();
        }
      });
      this.sceneManager.onSelect((kind, id) => {
        if (kind === 'ceo' || kind === 'bell') {
          this.openCeoPanel();
          return;
        }
        if (kind === 'library' && id) {
          void this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { library: id, agent: null },
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });
          this.openLibrary(id);
          return;
        }
        const agent = this.agents().find((a) => a.id === id);
        if (agent) {
          this.selectAgent(agent);
          return;
        }
        if (kind === 'row-desk' && id) {
          this.selectRowDesk(id);
        }
      });
      this.sceneManager.onFocusChange((kind, id) => {
        if (kind === 'library' && id) {
          this.workspaceSelection.selectLibrary(id);
          return;
        }
        if (kind === 'agent' && id) {
          const agent = this.agents().find((a) => a.id === id);
          if (agent) this.workspaceSelection.selectAgent(agent.id, agent.code);
        }
      });
      this.sceneManager.onTooltip((payload) => {
        this.sceneTooltip.set(payload);
      });
      if (this.focusLibraryId) {
        setTimeout(() => this.openLibrary(this.focusLibraryId!), 120);
      } else {
        const q = this.route.snapshot.queryParamMap;
        const desk = q.get('desk');
        if (desk && /^R\d+A\d+$/.test(desk)) {
          setTimeout(() => this.sceneManager?.focusRowDesk(desk), 120);
        } else if (q.get('row') && q.get('focus') === 'chief') {
          const rowId = Number(q.get('row'));
          if (rowId >= 1) {
            setTimeout(() => this.sceneManager?.focusChief(rowId), 120);
          }
        } else {
          const focus = this.focusCode || localStorage.getItem('niha0_last_agent') || null;
          if (focus) {
            setTimeout(() => this.sceneManager?.focusAgent(focus), 120);
          }
        }
      }
      this.useFallback.set(false);
    } catch {
      this.useFallback.set(true);
      this.sceneManager?.dispose();
      this.sceneManager = null;
    }
  }

  private resolveSceneTheme(): SceneTheme {
    if (this.theme.mode() === 'AUTO') {
      return this.theme.resolved();
    }
    const preset = loadScenePreset();
    if (preset === 'corporate') return 'CORPORATE';
    if (preset === 'cyberpunk' || preset === 'night') return 'CYBERPUNK';
    return 'SOLARPUNK';
  }

  private syncScene(): void {
    const configs = this.toDeskConfigs();
    this.sceneManager?.syncAgentStates(configs);
    this.pushNihaoLedSync(this.pendingActions(), this.agents());
  }

  private toDeskConfigs(): AgentDeskConfig[] {
    const pendingByAgent = new Map(this.pendingActions().map((a) => [a.agentId, a] as const));
    return this.deskAgents().map((a) => {
      const pending = pendingByAgent.get(a.id);
      const status = pending ? 'WAITING_APPROVAL' : a.status;
      return {
        id: a.id,
        code: a.code,
        name: a.name,
        status,
        pendingTitle: pending?.title,
        bubbleText: BUBBLE_BY_CODE[a.code] ?? a.description,
        dialogueText: pending?.description ?? pending?.title,
      };
    });
  }

  private refreshActions(done?: () => void): void {
    this.api.getAgentActions().subscribe({
      next: (actions) => {
        const pending = actions.filter((a) => a.workflowStatus === 'REQUEST_APPROVAL');
        const nextCount = pending.length;
        if (this.actionsHydrated && nextCount > this.prevPendingCount) {
          this.pushToast('Validation requise', 'warning');
          if (this.sceneManager && !this.useFallback()) {
            this.focusCeoScene();
          }
        }
        this.prevPendingCount = nextCount;
        this.actionsHydrated = true;
        this.pendingActions.set(pending);
        this.pendingCount.set(nextCount);
        this.ceoApproval.syncFromBackend(pending, this.deskAgents());
        const waitingIds = new Set(pending.map((p) => p.agentId));
        this.agents.update((list) =>
          list.map((ag) =>
            waitingIds.has(ag.id)
              ? { ...ag, status: 'WAITING_APPROVAL' }
              : ag.status === 'WAITING_APPROVAL'
                ? { ...ag, status: 'AVAILABLE' }
                : ag,
          ),
        );
        done?.();
      },
      error: () => done?.(),
    });
  }

  private focusCeoScene(): void {
    const sm = this.sceneManager;
    if (!sm) return;
    if (typeof sm.focusCeo === 'function') {
      sm.focusCeo();
      return;
    }
    const waiting = this.deskAgents().find((a) => a.status === 'WAITING_APPROVAL');
    if (waiting) sm.focusAgent(waiting.code);
  }

  private restoreCanvasFocus(): void {
    queueMicrotask(() => {
      this.canvasHost?.nativeElement?.focus({ preventScroll: true });
    });
  }

  private pushToast(message: string, tone: OfficeToast['tone']): void {
    const id = ++this.toastSeq;
    this.toasts.update((list) => [...list, { id, message, tone }]);
    const timer = setTimeout(() => {
      this.toasts.update((list) => list.filter((t) => t.id !== id));
      this.toastTimers.delete(id);
    }, TOAST_TTL_MS);
    this.toastTimers.set(id, timer);
  }
}
