import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProfessionalWorkspaceService } from '../../core/workspace/professional-workspace.service';
import { ApiService } from '../../core/api/api.service';
import { mapHttpError } from '../../core/api/http-error.util';
import { Agent } from '../../core/api/api.models';
import {
  AGENT_VISUAL_PRESETS,
  ASSISTANT_ROLES,
  COMPANY_SIZES,
  DATA_FILE_ACCEPT,
  DATA_MAX_BYTES,
  LOGO_ACCEPT,
  LOGO_MAX_BYTES,
  THEME_PRESETS,
} from '../../core/workspace/professional-presets';
import type {
  AgentConfiguration,
  AssistantConfiguration,
  CompanyDataAsset,
} from '../../core/workspace/professional.models';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { FeaturePageHeaderComponent } from '../../shared/ui/feature-page-header/feature-page-header.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';

type TabId =
  | 'overview'
  | 'identity'
  | 'office'
  | 'appearance'
  | 'agents'
  | 'assistants'
  | 'data'
  | 'accessibility';

const TABS: { id: TabId; label: string; icon: string; desc: string }[] = [
  { id: 'overview', label: "Vue d'ensemble", icon: '◎', desc: 'Résumé & actions' },
  { id: 'identity', label: 'Identité', icon: '🏢', desc: 'Marque & entreprise' },
  { id: 'office', label: 'Bureau 3D', icon: '🖥', desc: 'Couleurs & tapis' },
  { id: 'appearance', label: 'Scène', icon: '✦', desc: 'Thèmes & animations' },
  { id: 'agents', label: 'Agents IA', icon: '🤖', desc: 'Apparence & ton' },
  { id: 'assistants', label: 'Assistants', icon: '👤', desc: 'Rôles délégués' },
  { id: 'data', label: 'Données', icon: '📁', desc: 'Fichiers & RAG' },
  { id: 'accessibility', label: 'Accessibilité', icon: '♿', desc: 'Confort & contraste' },
];

const WALL_THEMES = [
  { id: 'slate', label: 'Ardoise' },
  { id: 'concrete', label: 'Béton' },
  { id: 'glass', label: 'Verre' },
  { id: 'wood', label: 'Bois' },
];

const FLOOR_THEMES = [
  { id: 'carpet', label: 'Tapis' },
  { id: 'parquet', label: 'Parquet' },
  { id: 'tile', label: 'Carrelage' },
  { id: 'neon', label: 'Néon' },
];

const DESK_THEMES = [
  { id: 'executive', label: 'Direction' },
  { id: 'open-space', label: 'Open space' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'tech', label: 'Tech' },
];

const OFFICE_WIDGETS = [
  { id: 'activity', label: 'Activité' },
  { id: 'alerts', label: 'Alertes' },
  { id: 'kpi', label: 'KPIs' },
  { id: 'weather', label: 'Météo' },
];

@Component({
  selector: 'app-workspace-settings-page',
  imports: [
    FormsModule,
    RouterLink,
    DatePipe,
    DecimalPipe,
    FeaturePageHeaderComponent,
    EmptyStateComponent,
    SkeletonComponent,
  ],
  template: `
    <div class="page feature-module-page ws-page">
      <app-feature-page-header group="Système" title="Workspace" backLabel="← AI Office">
        <div actions class="header-actions">
          @if (ws.dirty()) {
            <span class="dirty-pill">Modifications non sauvegardées</span>
          }
          <a routerLink="/app/ai-office" class="btn btn-ghost">Prévisualiser 3D</a>
          <button type="button" class="btn btn-ghost" (click)="confirmReset()">Réinitialiser</button>
          <button type="button" class="btn btn-primary" [disabled]="ws.loading() || !ws.dirty()" (click)="save()">
            {{ ws.loading() ? 'Sauvegarde…' : 'Sauvegarder' }}
          </button>
        </div>
      </app-feature-page-header>

      @if (message()) {
        <p class="status-banner" role="status">{{ message() }}</p>
      }

      <header class="ws-command">
        <div class="command-preview" aria-hidden="true">
          <div class="preview-logo">
            @if (ws.profile().logoUrl) {
              <img [src]="ws.profile().logoUrl!" alt="" />
            } @else {
              <span>{{ initials() }}</span>
            }
          </div>
          <div class="preview-scene">
            <div class="swatch" [style.background]="ws.branding().primaryColor"></div>
            <div class="swatch" [style.background]="ws.branding().secondaryColor"></div>
            <div class="swatch" [style.background]="ws.branding().accentColor"></div>
            <span class="preview-carpet">{{ ws.branding().carpetText || ws.profile().companyName || 'Workspace' }}</span>
          </div>
        </div>
        <div class="command-meta">
          <h2 class="command-title">{{ ws.profile().companyName || 'Votre workspace' }}</h2>
          <p class="command-sub">
            Personnalisation complète — {{ completionScore() }}% configuré
            @if (ws.profile().onboardingStatus !== 'COMPLETED') {
              · <a routerLink="/app/onboarding">Terminer l'onboarding →</a>
            }
          </p>
          <div class="command-stats">
            <button type="button" class="stat-pill clickable" (click)="tab.set('agents')">
              <span class="stat-val">{{ ws.config().agents.length }}</span>
              <span class="stat-lbl">Agents</span>
            </button>
            <button type="button" class="stat-pill clickable" (click)="tab.set('assistants')">
              <span class="stat-val">{{ ws.config().assistants.length }}</span>
              <span class="stat-lbl">Assistants</span>
            </button>
            <button type="button" class="stat-pill clickable" (click)="tab.set('data')">
              <span class="stat-val">{{ ws.dataAssets().length }}</span>
              <span class="stat-lbl">Fichiers</span>
            </button>
            <div class="stat-pill">
              <span class="stat-val">{{ ws.branding().themePreset }}</span>
              <span class="stat-lbl">Thème</span>
            </div>
          </div>
        </div>
        <div class="completion-ring" [attr.data-level]="completionLevel()">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="42" class="ring-bg" />
            <circle cx="50" cy="50" r="42" class="ring-fill" [attr.stroke-dasharray]="completionDash()" />
          </svg>
          <span class="ring-val">{{ completionScore() }}%</span>
        </div>
      </header>

      <div class="ws-layout">
        <nav class="ws-nav" aria-label="Sections workspace">
          @for (t of tabs; track t.id) {
            <button
              type="button"
              class="ws-nav-item"
              [class.active]="tab() === t.id"
              (click)="tab.set(t.id)"
            >
              <span class="nav-icon" aria-hidden="true">{{ t.icon }}</span>
              <span class="nav-text">
                <span class="nav-label">{{ t.label }}</span>
                <span class="nav-desc">{{ t.desc }}</span>
              </span>
            </button>
          }
        </nav>

        <div class="ws-panel">
          @if (ws.loading() && tab() === 'overview') {
            <app-skeleton message="Chargement du workspace…" [lines]="6" />
          } @else if (tab() === 'overview') {
            <section class="overview-grid">
              <article class="feature-hub card action-card" (click)="tab.set('identity')">
                <h3>Identité</h3>
                <p>{{ ws.profile().companyName || 'Nom à définir' }}</p>
                <span class="card-link">Configurer →</span>
              </article>
              <article class="feature-hub card action-card" (click)="tab.set('office')">
                <h3>Bureau 3D</h3>
                <p>{{ themeLabel() }} · tapis {{ ws.branding().carpetStyle }}</p>
                <span class="card-link">Personnaliser →</span>
              </article>
              <article class="feature-hub card action-card" (click)="tab.set('agents')">
                <h3>Agents</h3>
                <p>{{ ws.config().agents.length }} agent(s) configuré(s)</p>
                <span class="card-link">Gérer →</span>
              </article>
              <article class="feature-hub card action-card" (click)="tab.set('data')">
                <h3>Données</h3>
                <p>{{ ws.dataAssets().length }} fichier(s) importé(s)</p>
                <span class="card-link">Importer →</span>
              </article>
            </section>

            <section class="feature-hub card">
              <header class="data-list-toolbar">
                <h2 class="section-title">Sauvegarde & portabilité</h2>
                <span class="section-search-spacer"></span>
                <div class="section-toolbar-end">
                  <span class="section-tag">Contrôle total</span>
                </div>
              </header>
              <div class="portability-row">
                <button type="button" class="btn btn-ghost" (click)="exportConfig()">Exporter JSON</button>
                <label class="btn btn-ghost file-btn">
                  Importer JSON
                  <input type="file" accept="application/json,.json" hidden (change)="importConfig($event)" />
                </label>
                <button type="button" class="btn btn-primary" [disabled]="!ws.dirty()" (click)="save()">Sauvegarder maintenant</button>
              </div>
            </section>
          } @else if (tab() === 'identity') {
            <section class="feature-hub card panel">
              <header class="data-list-toolbar">
                <h2 class="section-title">Identité entreprise</h2>
                <span class="section-search-spacer"></span>
                <span class="section-tag">Marque & coordonnées</span>
              </header>
              <div class="grid-2">
                <div class="form-group">
                  <label class="label" for="name">Nom</label>
                  <input id="name" class="input" [ngModel]="ws.profile().companyName" (ngModelChange)="ws.patchProfile({ companyName: $event })" />
                </div>
                <div class="form-group">
                  <label class="label" for="slogan">Slogan</label>
                  <input id="slogan" class="input" [ngModel]="ws.profile().slogan" (ngModelChange)="ws.patchProfile({ slogan: $event })" />
                </div>
                <div class="form-group">
                  <label class="label" for="sector">Secteur</label>
                  <input id="sector" class="input" [ngModel]="ws.profile().sector" (ngModelChange)="ws.patchProfile({ sector: $event })" placeholder="Tech, Retail, Services…" />
                </div>
                <div class="form-group">
                  <label class="label" for="size">Taille</label>
                  <select id="size" class="input" [ngModel]="ws.profile().companySize" (ngModelChange)="ws.patchProfile({ companySize: $event })">
                    <option value="">—</option>
                    @for (s of companySizes; track s) {
                      <option [value]="s">{{ s }} employés</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label class="label" for="country">Pays</label>
                  <input id="country" class="input" [ngModel]="ws.profile().country" (ngModelChange)="ws.patchProfile({ country: $event })" />
                </div>
                <div class="form-group">
                  <label class="label" for="city">Ville</label>
                  <input id="city" class="input" [ngModel]="ws.profile().city" (ngModelChange)="ws.patchProfile({ city: $event })" />
                </div>
                <div class="form-group">
                  <label class="label" for="email">Email pro</label>
                  <input id="email" type="email" class="input" [ngModel]="ws.profile().professionalEmail" (ngModelChange)="ws.patchProfile({ professionalEmail: $event })" />
                </div>
                <div class="form-group">
                  <label class="label" for="website">Site web</label>
                  <input id="website" class="input" [ngModel]="ws.profile().website" (ngModelChange)="ws.patchProfile({ website: $event })" placeholder="https://" />
                </div>
                <div class="form-group full">
                  <label class="label" for="desc">Description</label>
                  <textarea id="desc" class="input" rows="3" [ngModel]="ws.profile().description" (ngModelChange)="ws.patchProfile({ description: $event })"></textarea>
                </div>
              </div>
              <div class="logo-row">
                <div class="logo-preview">
                  @if (ws.profile().logoUrl) {
                    <img [src]="ws.profile().logoUrl!" alt="Logo" />
                  } @else {
                    <span>{{ initials() }}</span>
                  }
                </div>
                <div class="logo-actions">
                  <label class="btn btn-ghost file-btn">
                    Remplacer le logo
                    <input type="file" [accept]="logoAccept" hidden (change)="onLogo($event)" />
                  </label>
                  <button type="button" class="btn btn-ghost" (click)="clearLogo()">Supprimer</button>
                  <p class="hint">PNG, JPG, WebP, SVG — max 2 Mo</p>
                </div>
              </div>
            </section>
          } @else if (tab() === 'office') {
            <section class="feature-hub card panel">
              <header class="data-list-toolbar">
                <h2 class="section-title">Bureau 3D</h2>
                <span class="section-search-spacer"></span>
                <a routerLink="/app/ai-office" class="btn btn-ghost btn-sm">Voir en 3D →</a>
              </header>

              <p class="panel-hint">Cliquez un preset pour appliquer une palette complète.</p>
              <div class="presets">
                @for (p of presets; track p.id) {
                  <button
                    type="button"
                    class="preset"
                    [class.active]="ws.branding().themePreset === p.id"
                    (click)="ws.applyThemePreset(p.id)"
                  >
                    <span class="preset-dot" [style.background]="p.primary"></span>
                    {{ p.label }}
                  </button>
                }
              </div>

              <div class="grid-3">
                <div class="form-group">
                  <label class="label">Couleur principale</label>
                  <input type="color" class="input color-input" [ngModel]="ws.branding().primaryColor" (ngModelChange)="color('primaryColor', $event)" />
                </div>
                <div class="form-group">
                  <label class="label">Secondaire</label>
                  <input type="color" class="input color-input" [ngModel]="ws.branding().secondaryColor" (ngModelChange)="color('secondaryColor', $event)" />
                </div>
                <div class="form-group">
                  <label class="label">Accent</label>
                  <input type="color" class="input color-input" [ngModel]="ws.branding().accentColor" (ngModelChange)="color('accentColor', $event)" />
                </div>
                <div class="form-group">
                  <label class="label">Mode logo</label>
                  <select class="input" [ngModel]="ws.branding().logoDisplayMode" (ngModelChange)="patchBranding({ logoDisplayMode: $event })">
                    <option value="plaque">Plaque</option>
                    <option value="hologram">Hologramme</option>
                    <option value="led">LED</option>
                    <option value="neon">Néon</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="label">Échelle logo {{ ws.branding().logoScale | number: '1.2-2' }}</label>
                  <input type="range" min="0.6" max="1.6" step="0.05" [ngModel]="ws.branding().logoScale" (ngModelChange)="patchBranding({ logoScale: +$event })" />
                </div>
                <div class="form-group">
                  <label class="label">Luminosité logo</label>
                  <input type="range" min="0.1" max="1" step="0.05" [ngModel]="ws.branding().logoBrightness" (ngModelChange)="patchBranding({ logoBrightness: +$event })" />
                </div>
                <div class="form-group">
                  <label class="label">Style tapis</label>
                  <select class="input" [ngModel]="ws.branding().carpetStyle" (ngModelChange)="patchBranding({ carpetStyle: $event })">
                    <option value="corporate">Corporate</option>
                    <option value="futuristic">Futuriste</option>
                    <option value="circular">Circulaire</option>
                    <option value="premium">Premium</option>
                    <option value="holographic">Holographique</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="label">Texte tapis</label>
                  <input class="input" [ngModel]="ws.branding().carpetText" (ngModelChange)="patchBranding({ carpetText: $event })" />
                </div>
                <div class="form-group">
                  <label class="label">Couleur tapis</label>
                  <input type="color" class="input color-input" [ngModel]="ws.branding().carpetColor" (ngModelChange)="patchBranding({ carpetColor: $event })" />
                </div>
                <div class="form-group">
                  <label class="label">Échelle tapis</label>
                  <input type="range" min="0.7" max="1.4" step="0.05" [ngModel]="ws.branding().carpetScale" (ngModelChange)="patchBranding({ carpetScale: +$event })" />
                </div>
                <div class="form-group">
                  <label class="label">Opacité tapis</label>
                  <input type="range" min="0.4" max="1" step="0.05" [ngModel]="ws.branding().carpetOpacity" (ngModelChange)="patchBranding({ carpetOpacity: +$event })" />
                </div>
                <div class="form-group">
                  <label class="label">Rotation tapis (°)</label>
                  <input type="range" min="-45" max="45" step="1" [ngModel]="ws.branding().carpetRotationY" (ngModelChange)="patchBranding({ carpetRotationY: +$event })" />
                </div>
                <div class="form-group">
                  <label class="label">Intensité néons</label>
                  <input type="range" min="0" max="1" step="0.05" [ngModel]="ws.office().neonIntensity" (ngModelChange)="patchOffice({ neonIntensity: +$event })" />
                </div>
              </div>
            </section>
          } @else if (tab() === 'appearance') {
            <section class="feature-hub card panel">
              <header class="data-list-toolbar">
                <h2 class="section-title">Scène & ambiance</h2>
                <span class="section-search-spacer"></span>
                <span class="section-tag">Thèmes matériaux & effets</span>
              </header>
              <div class="grid-2">
                <div class="form-group">
                  <label class="label">Nom de l'espace</label>
                  <input class="input" [ngModel]="ws.office().workspaceName" (ngModelChange)="patchOffice({ workspaceName: $event })" />
                </div>
                <div class="form-group">
                  <label class="label">Badge entreprise</label>
                  <input class="input" [ngModel]="ws.office().companyBadge" (ngModelChange)="patchOffice({ companyBadge: $event })" />
                </div>
                <div class="form-group">
                  <label class="label">Murs</label>
                  <select class="input" [ngModel]="ws.office().wallTheme" (ngModelChange)="patchOffice({ wallTheme: $event })">
                    @for (w of wallThemes; track w.id) {
                      <option [value]="w.id">{{ w.label }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label class="label">Sol</label>
                  <select class="input" [ngModel]="ws.office().floorTheme" (ngModelChange)="patchOffice({ floorTheme: $event })">
                    @for (f of floorThemes; track f.id) {
                      <option [value]="f.id">{{ f.label }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label class="label">Bureaux</label>
                  <select class="input" [ngModel]="ws.office().deskTheme" (ngModelChange)="patchOffice({ deskTheme: $event })">
                    @for (d of deskThemes; track d.id) {
                      <option [value]="d.id">{{ d.label }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label class="label">Éclairage</label>
                  <select class="input" [ngModel]="ws.office().lightingTheme" (ngModelChange)="patchOffice({ lightingTheme: $event })">
                    <option value="day">Jour</option>
                    <option value="night">Nuit</option>
                    <option value="dark">Sombre</option>
                    <option value="cyberpunk">Cyberpunk</option>
                    <option value="corporate">Corporate</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="label">Animation</label>
                  <select class="input" [ngModel]="ws.office().animationMode" (ngModelChange)="patchOffice({ animationMode: $event })">
                    <option value="none">Aucune</option>
                    <option value="pulse">Lumières pulsées</option>
                    <option value="network">Lignes réseau</option>
                    <option value="particles">Particules</option>
                    <option value="digital-rain">Pluie digitale</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="label">Intensité animation</label>
                  <input type="range" min="0" max="1" step="0.05" [ngModel]="ws.office().animationIntensity" (ngModelChange)="patchOffice({ animationIntensity: +$event })" />
                </div>
                <div class="form-group full">
                  <label class="label">Accent sidebar (hex)</label>
                  <input class="input" [ngModel]="ws.office().sidebarAccent" (ngModelChange)="patchOffice({ sidebarAccent: $event })" placeholder="#3EC4FF (optionnel)" />
                </div>
              </div>
              <div class="widget-row">
                <span class="label">Widgets bureau</span>
                <div class="chip-row">
                  @for (w of officeWidgets; track w.id) {
                    <button
                      type="button"
                      class="filter-chip"
                      [class.active]="ws.office().widgets.includes(w.id)"
                      (click)="ws.toggleOfficeWidget(w.id)"
                    >{{ w.label }}</button>
                  }
                </div>
              </div>
            </section>
          } @else if (tab() === 'agents') {
            <section class="feature-hub card panel">
              <header class="data-list-toolbar">
                <h2 class="section-title">Agents IA</h2>
                <label class="section-search">
                  <span class="feature-search-icon" aria-hidden="true">⌕</span>
                  <input
                    class="input feature-search-input section-search-input"
                    type="search"
                    placeholder="Nom, rôle, code…"
                    [ngModel]="agentQuery()"
                    (ngModelChange)="agentQuery.set($event)"
                  />
                </label>
                <div class="section-toolbar-end">
                  <button type="button" class="btn btn-ghost btn-sm" (click)="seedAgentsFromApi()">Importer API</button>
                  <span class="section-count">{{ filteredAgents().length }}</span>
                </div>
              </header>

              @if (!ws.config().agents.length) {
                <app-empty-state
                  title="Aucun agent configuré"
                  icon="AI"
                  description="Importez les agents existants depuis l'API pour les personnaliser."
                />
                <div class="empty-action">
                  <button type="button" class="btn btn-primary" (click)="seedAgentsFromApi()">Importer les agents</button>
                </div>
              } @else {
                <div class="agent-list">
                  @for (agent of filteredAgents(); track agent.id) {
                    <button
                      type="button"
                      class="agent-row"
                      [class.active]="selectedAgentId() === agent.id"
                      (click)="selectedAgentId.set(agent.id)"
                    >
                      <span class="agent-dot" [style.background]="agent.accentColor"></span>
                      <span class="agent-row-main">
                        <strong>{{ agent.name }}</strong>
                        <span class="agent-row-sub">{{ agent.role }} · {{ agent.code }}</span>
                      </span>
                      <span class="visibility-pill" [class.hidden]="agent.visibility === 'hidden'">{{ agent.visibility }}</span>
                    </button>
                  }
                </div>

                @if (selectedAgent(); as agent) {
                  <article class="agent-editor">
                    <h3>{{ agent.name }}</h3>
                    <div class="grid-2">
                      <div class="form-group">
                        <label class="label">Nom affiché</label>
                        <input class="input" [ngModel]="agent.name" (ngModelChange)="updateAgent(agent.id, { name: $event })" />
                      </div>
                      <div class="form-group">
                        <label class="label">Rôle</label>
                        <input class="input" [ngModel]="agent.role" (ngModelChange)="updateAgent(agent.id, { role: $event })" />
                      </div>
                      <div class="form-group">
                        <label class="label">Preset visuel</label>
                        <select class="input" [ngModel]="agent.visualPreset" (ngModelChange)="applyAgentPreset(agent.id, $event)">
                          @for (p of agentPresets; track p.id) {
                            <option [value]="p.id">{{ p.label }}</option>
                          }
                        </select>
                      </div>
                      <div class="form-group">
                        <label class="label">Ton</label>
                        <select class="input" [ngModel]="agent.communicationTone" (ngModelChange)="updateAgent(agent.id, { communicationTone: $event })">
                          <option value="professional">Professionnel</option>
                          <option value="direct">Direct</option>
                          <option value="analytical">Analytique</option>
                          <option value="creative">Créatif</option>
                          <option value="support">Support client</option>
                        </select>
                      </div>
                      <div class="form-group">
                        <label class="label">Couleur principale</label>
                        <input type="color" class="input color-input" [ngModel]="agent.primaryColor" (ngModelChange)="updateAgent(agent.id, { primaryColor: $event })" />
                      </div>
                      <div class="form-group">
                        <label class="label">Couleur accent</label>
                        <input type="color" class="input color-input" [ngModel]="agent.accentColor" (ngModelChange)="updateAgent(agent.id, { accentColor: $event })" />
                      </div>
                      <div class="form-group">
                        <label class="label">Visibilité 3D</label>
                        <select class="input" [ngModel]="agent.visibility" (ngModelChange)="updateAgent(agent.id, { visibility: $event })">
                          <option value="visible">Visible</option>
                          <option value="secondary">Secondaire</option>
                          <option value="hidden">Masqué</option>
                        </select>
                      </div>
                      <div class="form-group">
                        <label class="label">Statut</label>
                        <select class="input" [ngModel]="agent.status" (ngModelChange)="updateAgent(agent.id, { status: $event })">
                          <option value="active">Actif</option>
                          <option value="preparing">En préparation</option>
                          <option value="disabled">Désactivé</option>
                        </select>
                      </div>
                      <div class="form-group full">
                        <label class="label">Description / mission</label>
                        <textarea class="input" rows="2" [ngModel]="agent.description" (ngModelChange)="updateAgent(agent.id, { description: $event })"></textarea>
                      </div>
                    </div>
                    <a class="btn btn-ghost btn-sm" [routerLink]="['/app/ai-office']" [queryParams]="{ agent: agent.code }">Voir dans l'AI Office →</a>
                  </article>
                }
              }
            </section>
          } @else if (tab() === 'assistants') {
            <section class="feature-hub card panel">
              <header class="data-list-toolbar">
                <h2 class="section-title">Assistants</h2>
                <label class="section-search">
                  <span class="feature-search-icon" aria-hidden="true">⌕</span>
                  <input class="input feature-search-input section-search-input" type="search" placeholder="Nom, rôle…" [ngModel]="assistantQuery()" (ngModelChange)="assistantQuery.set($event)" />
                </label>
                <div class="section-toolbar-end">
                  <button type="button" class="btn btn-primary btn-sm" (click)="addAssistant()">+ Ajouter</button>
                  <span class="section-count">{{ filteredAssistants().length }}</span>
                </div>
              </header>

              @if (!filteredAssistants().length) {
                <app-empty-state title="Aucun assistant" icon="AS" description="Créez des assistants rattachés à vos agents." />
              } @else {
                @for (a of filteredAssistants(); track a.id) {
                  <article class="assistant-card">
                    <div class="grid-2">
                      <div class="form-group">
                        <label class="label">Nom</label>
                        <input class="input" [ngModel]="a.name" (ngModelChange)="updateAssistant(a.id, { name: $event })" />
                      </div>
                      <div class="form-group">
                        <label class="label">Rôle</label>
                        <select class="input" [ngModel]="a.role" (ngModelChange)="updateAssistant(a.id, { role: $event })">
                          @for (r of assistantRoles; track r) {
                            <option [value]="r">{{ r }}</option>
                          }
                        </select>
                      </div>
                      <div class="form-group">
                        <label class="label">Agent parent</label>
                        <select class="input" [ngModel]="a.parentAgentId" (ngModelChange)="updateAssistant(a.id, { parentAgentId: $event })">
                          @for (ag of ws.config().agents; track ag.id) {
                            <option [value]="ag.id">{{ ag.name }}</option>
                          }
                        </select>
                      </div>
                      <div class="form-group">
                        <label class="label">Visibilité</label>
                        <select class="input" [ngModel]="a.visibility" (ngModelChange)="updateAssistant(a.id, { visibility: $event })">
                          <option value="discreet">Discret</option>
                          <option value="normal">Normal</option>
                          <option value="featured">Mis en avant</option>
                        </select>
                      </div>
                      <div class="form-group">
                        <label class="label">Couleur</label>
                        <input type="color" class="input color-input" [ngModel]="a.color" (ngModelChange)="updateAssistant(a.id, { color: $event })" />
                      </div>
                      <div class="form-group">
                        <label class="label">Actif</label>
                        <select class="input" [ngModel]="a.isEnabled ? '1' : '0'" (ngModelChange)="updateAssistant(a.id, { isEnabled: $event === '1' })">
                          <option value="1">Oui</option>
                          <option value="0">Non</option>
                        </select>
                      </div>
                    </div>
                    <button type="button" class="btn btn-ghost btn-sm danger" (click)="removeAssistant(a.id)">Supprimer</button>
                  </article>
                }
              }
            </section>
          } @else if (tab() === 'data') {
            <section class="feature-hub card panel">
              <header class="data-list-toolbar">
                <h2 class="section-title">Données</h2>
                <span class="section-search-spacer"></span>
                <div class="section-toolbar-end">
                  <a routerLink="/app/company-data" class="btn btn-ghost btn-sm">Centre RAG →</a>
                  <span class="section-count">{{ ws.dataAssets().length }} fichier(s)</span>
                </div>
              </header>

              <div
                class="dropzone"
                [class.active]="dragOver()"
                (dragover)="onDragOver($event)"
                (dragleave)="dragOver.set(false)"
                (drop)="onDrop($event)"
              >
                <p>Glissez-déposez ou cliquez pour importer</p>
                <label class="btn btn-primary file-btn">
                  Choisir des fichiers
                  <input type="file" multiple [accept]="dataAccept" hidden (change)="onDataFiles($event)" />
                </label>
                <p class="hint">Max {{ dataMaxMb }} Mo / fichier</p>
              </div>

              @if (!ws.dataAssets().length) {
                <app-empty-state title="Aucun fichier" icon="DT" description="Importez des documents pour enrichir le contexte IA." />
              } @else {
                <div class="asset-list">
                  @for (asset of ws.dataAssets(); track asset.id) {
                    <div class="asset-row">
                      <div class="asset-main">
                        <strong>{{ asset.name }}</strong>
                        <span class="asset-sub">{{ asset.fileType }} · {{ formatBytes(asset.sizeBytes) }} · {{ asset.createdAt | date: 'short' }}</span>
                      </div>
                      <div class="asset-actions">
                        <span class="status-pill">{{ asset.processingStatus }}</span>
                        <button type="button" class="btn btn-ghost btn-sm danger" (click)="deleteAsset(asset)">×</button>
                      </div>
                    </div>
                  }
                </div>
              }
            </section>
          } @else {
            <section class="feature-hub card panel">
              <header class="data-list-toolbar">
                <h2 class="section-title">Accessibilité</h2>
                <span class="section-search-spacer"></span>
                <span class="section-tag">Confort d'utilisation</span>
              </header>
              <button type="button" class="toggle-card" [class.on]="ws.office().accessibilityMode" (click)="patchOffice({ accessibilityMode: !ws.office().accessibilityMode })">
                <span class="toggle-title">Réduire les animations</span>
                <span class="toggle-desc">Désactive les effets visuels intenses dans la scène 3D.</span>
                <span class="toggle-state">{{ ws.office().accessibilityMode ? 'Activé' : 'Désactivé' }}</span>
              </button>
              <button type="button" class="toggle-card" [class.on]="ws.office().highContrast" (click)="patchOffice({ highContrast: !ws.office().highContrast })">
                <span class="toggle-title">Contraste élevé</span>
                <span class="toggle-desc">Renforce la lisibilité des textes et bordures.</span>
                <span class="toggle-state">{{ ws.office().highContrast ? 'Activé' : 'Désactivé' }}</span>
              </button>
            </section>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-actions { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
    .dirty-pill {
      font-size: 0.68rem; font-weight: 700; color: var(--accent-warning);
      padding: 0.2rem 0.5rem; border: 1px solid color-mix(in srgb, var(--accent-warning) 40%, transparent);
      border-radius: var(--radius-sm); background: color-mix(in srgb, var(--accent-warning) 10%, transparent);
    }
    .status-banner {
      margin: 0; padding: 0.6rem 0.85rem; border-radius: var(--radius-md);
      border: 1px solid var(--border-color); background: var(--bg-elevated); font-size: 0.85rem;
    }

    .ws-command {
      display: flex; flex-wrap: wrap; gap: var(--dash-inline-gap); align-items: center;
      padding: var(--dash-band-gap); border: 1px solid var(--border-color); border-radius: var(--radius-lg);
      background: linear-gradient(135deg, color-mix(in srgb, var(--accent-primary) 6%, var(--bg-elevated)), var(--bg-elevated));
      margin-bottom: var(--dash-inline-gap);
    }
    .command-preview { display: flex; gap: 0.65rem; align-items: center; }
    .preview-logo {
      width: 3.5rem; height: 3.5rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);
      display: grid; place-items: center; overflow: hidden; background: var(--bg-primary); font-weight: 800;
    }
    .preview-logo img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .preview-scene { display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap; }
    .swatch { width: 1.1rem; height: 1.1rem; border-radius: 4px; border: 1px solid var(--border-color); }
    .preview-carpet { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
    .command-meta { flex: 1; min-width: 12rem; }
    .command-title { margin: 0 0 0.3rem; font-size: 1.05rem; }
    .command-sub { margin: 0 0 0.55rem; font-size: 0.82rem; color: var(--text-secondary); }
    .command-stats { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .stat-pill {
      display: flex; flex-direction: column; gap: 0.1rem; padding: 0.4rem 0.55rem;
      border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-primary); min-width: 4rem;
    }
    .stat-pill.clickable { cursor: pointer; text-align: left; color: inherit; }
    .stat-pill.clickable:hover { border-color: var(--accent-primary); background: color-mix(in srgb, var(--accent-primary) 8%, var(--bg-primary)); }
    .stat-val { font-weight: var(--fw-bold); font-size: 0.9rem; color: var(--accent-primary); }
    .stat-lbl { font-size: 0.62rem; color: var(--text-muted); text-transform: uppercase; }
    .completion-ring { position: relative; width: 4.5rem; height: 4.5rem; flex-shrink: 0; }
    .completion-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
    .ring-bg { fill: none; stroke: var(--border-color); stroke-width: 7; }
    .ring-fill { fill: none; stroke: var(--accent-primary); stroke-width: 7; stroke-linecap: round; }
    .completion-ring[data-level='low'] .ring-fill { stroke: var(--accent-warning); }
    .ring-val { position: absolute; inset: 0; display: grid; place-items: center; font-size: 0.75rem; font-weight: 800; }

    .ws-layout { display: grid; grid-template-columns: minmax(11rem, 13.5rem) minmax(0, 1fr); gap: var(--dash-inline-gap); align-items: start; }
    .ws-nav { display: flex; flex-direction: column; gap: 0.25rem; position: sticky; top: 0.5rem; }
    .ws-nav-item {
      display: flex; align-items: center; gap: 0.5rem; width: 100%; text-align: left;
      border: 1px solid transparent; background: transparent; border-radius: var(--radius-md);
      padding: 0.55rem 0.6rem; cursor: pointer; color: var(--text-secondary);
    }
    .ws-nav-item:hover { background: var(--bg-hover); color: var(--text-primary); }
    .ws-nav-item.active {
      background: color-mix(in srgb, var(--accent-primary) 12%, var(--bg-elevated));
      border-color: color-mix(in srgb, var(--accent-primary) 35%, var(--border-color));
      color: var(--accent-primary); box-shadow: inset 3px 0 0 var(--accent-primary);
    }
    .nav-icon { width: 1.2rem; text-align: center; flex-shrink: 0; }
    .nav-text { display: flex; flex-direction: column; gap: 0.08rem; min-width: 0; }
    .nav-label { font-size: 0.78rem; font-weight: var(--fw-semibold); }
    .nav-desc { font-size: 0.62rem; color: var(--text-muted); }
    .ws-panel { min-width: 0; }

    .panel { padding: var(--dash-inline-gap) var(--dash-band-gap); }
    .panel-hint { margin: 0 0 0.65rem; font-size: 0.8rem; color: var(--text-muted); }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-top: 0.75rem; }
    .full { grid-column: 1 / -1; }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .label { font-size: 0.78rem; color: var(--text-secondary); }
    .hint { margin: 0.35rem 0 0; font-size: 0.72rem; color: var(--text-muted); }
    .color-input { height: 2.25rem; padding: 0.2rem; }

    .logo-row { display: flex; gap: 1rem; align-items: flex-start; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color); }
    .logo-preview {
      width: 5.5rem; height: 5.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);
      display: grid; place-items: center; overflow: hidden; background: var(--bg-primary); font-weight: 800; font-size: 1.2rem;
    }
    .logo-preview img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .logo-actions { display: flex; flex-direction: column; gap: 0.4rem; align-items: flex-start; }

    .presets { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.5rem; }
    .preset {
      display: inline-flex; align-items: center; gap: 0.35rem;
      border: 1px solid var(--border-color); background: var(--bg-primary); border-radius: var(--radius-sm);
      padding: 0.35rem 0.55rem; cursor: pointer; font-size: 0.72rem;
    }
    .preset.active { border-color: var(--accent-primary); color: var(--accent-primary); }
    .preset-dot { width: 0.65rem; height: 0.65rem; border-radius: 50%; }

    .overview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: var(--dash-inline-gap); margin-bottom: var(--dash-inline-gap); }
    .action-card { cursor: pointer; transition: border-color var(--transition), box-shadow var(--transition); }
    .action-card:hover { border-color: var(--accent-primary); box-shadow: var(--shadow-md); }
    .action-card h3 { margin: 0 0 0.35rem; font-size: 0.92rem; }
    .action-card p { margin: 0; font-size: 0.78rem; color: var(--text-secondary); }
    .card-link { display: inline-block; margin-top: 0.5rem; font-size: 0.72rem; font-weight: 700; color: var(--accent-primary); }
    .empty-action { display: flex; justify-content: center; margin-top: 0.75rem; }

    .widget-row { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color); }
    .chip-row { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.4rem; }
    .filter-chip {
      border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-secondary);
      border-radius: 999px; padding: 0.3rem 0.65rem; font-size: 0.72rem; font-weight: 600; cursor: pointer;
    }
    .filter-chip.active { background: color-mix(in srgb, var(--accent-primary) 14%, transparent); border-color: var(--accent-primary); color: var(--accent-primary); }

    .agent-list { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 0.75rem; max-height: 14rem; overflow-y: auto; }
    .agent-row {
      display: flex; align-items: center; gap: 0.55rem; width: 100%; text-align: left;
      border: 1px solid var(--border-color); background: var(--bg-primary); border-radius: var(--radius-md);
      padding: 0.55rem 0.65rem; cursor: pointer; color: inherit;
    }
    .agent-row:hover { border-color: var(--border-strong); }
    .agent-row.active { border-color: var(--accent-primary); background: color-mix(in srgb, var(--accent-primary) 10%, transparent); box-shadow: inset 3px 0 0 var(--accent-primary); }
    .agent-dot { width: 0.5rem; height: 0.5rem; border-radius: 50%; flex-shrink: 0; }
    .agent-row-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.1rem; }
    .agent-row-main strong { font-size: 0.82rem; }
    .agent-row-sub { font-size: 0.68rem; color: var(--text-muted); }
    .visibility-pill { font-size: 0.62rem; padding: 0.1rem 0.35rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); text-transform: uppercase; }
    .visibility-pill.hidden { color: var(--accent-warning); border-color: color-mix(in srgb, var(--accent-warning) 40%, transparent); }
    .agent-editor { border-top: 1px solid var(--border-color); padding-top: 0.85rem; }
    .agent-editor h3 { margin: 0 0 0.65rem; font-size: 0.95rem; }

    .assistant-card { border-top: 1px solid var(--border-color); padding: 0.85rem 0; }
    .assistant-card:first-of-type { border-top: none; padding-top: 0; }
    .danger { color: var(--accent-danger); }

    .dropzone {
      border: 2px dashed var(--border-color); border-radius: var(--radius-md); padding: 1.25rem;
      text-align: center; margin-bottom: 0.75rem; transition: border-color var(--transition), background var(--transition);
    }
    .dropzone.active, .dropzone:hover { border-color: var(--accent-primary); background: color-mix(in srgb, var(--accent-primary) 6%, transparent); }
    .asset-list { display: flex; flex-direction: column; gap: 0.35rem; }
    .asset-row {
      display: flex; justify-content: space-between; gap: 0.75rem; align-items: center;
      padding: 0.55rem 0.65rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-primary);
    }
    .asset-main { min-width: 0; }
    .asset-main strong { display: block; font-size: 0.82rem; }
    .asset-sub { font-size: 0.68rem; color: var(--text-muted); }
    .asset-actions { display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0; }
    .status-pill { font-size: 0.62rem; padding: 0.1rem 0.35rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-muted); }

    .toggle-card {
      display: grid; grid-template-columns: 1fr auto; gap: 0.25rem 0.75rem; width: 100%; text-align: left;
      border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.75rem; margin-bottom: 0.5rem;
      background: var(--bg-primary); cursor: pointer; color: inherit;
    }
    .toggle-card.on { border-color: var(--accent-primary); background: color-mix(in srgb, var(--accent-primary) 8%, var(--bg-primary)); }
    .toggle-title { font-weight: var(--fw-semibold); font-size: 0.88rem; grid-column: 1; }
    .toggle-desc { font-size: 0.75rem; color: var(--text-muted); grid-column: 1; }
    .toggle-state { grid-column: 2; grid-row: 1 / span 2; align-self: center; font-size: 0.72rem; font-weight: 700; color: var(--accent-primary); }

    .btn-sm { font-size: 0.72rem; padding: 0.32rem 0.55rem; min-height: auto; }
    .file-btn { cursor: pointer; }

    @media (max-width: 960px) {
      .ws-layout { grid-template-columns: 1fr; }
      .ws-nav { flex-direction: row; overflow-x: auto; position: static; }
      .ws-nav-item { min-width: 9rem; flex-shrink: 0; }
      .nav-desc { display: none; }
      .grid-2, .grid-3 { grid-template-columns: 1fr; }
      .command-preview { width: 100%; }
    }
  `],
})
export class WorkspaceSettingsPage implements OnInit {
  readonly ws = inject(ProfessionalWorkspaceService);
  private readonly api = inject(ApiService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);

  readonly tab = signal<TabId>('overview');
  readonly message = signal('');
  readonly agentQuery = signal('');
  readonly assistantQuery = signal('');
  readonly selectedAgentId = signal<string | null>(null);
  readonly dragOver = signal(false);

  readonly tabs = TABS;
  readonly presets = THEME_PRESETS;
  readonly agentPresets = AGENT_VISUAL_PRESETS;
  readonly assistantRoles = ASSISTANT_ROLES;
  readonly companySizes = COMPANY_SIZES;
  readonly wallThemes = WALL_THEMES;
  readonly floorThemes = FLOOR_THEMES;
  readonly deskThemes = DESK_THEMES;
  readonly officeWidgets = OFFICE_WIDGETS;
  readonly logoAccept = LOGO_ACCEPT;
  readonly dataAccept = DATA_FILE_ACCEPT;
  readonly dataMaxMb = Math.round(DATA_MAX_BYTES / 1_000_000);

  readonly filteredAgents = computed(() => {
    const q = this.agentQuery().trim().toLowerCase();
    const list = this.ws.config().agents;
    if (!q) return list;
    return list.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q),
    );
  });

  readonly filteredAssistants = computed(() => {
    const q = this.assistantQuery().trim().toLowerCase();
    const list = this.ws.config().assistants;
    if (!q) return list;
    return list.filter(
      (a) => a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q),
    );
  });

  readonly selectedAgent = computed(() => {
    const id = this.selectedAgentId();
    return this.ws.config().agents.find((a) => a.id === id) ?? null;
  });

  readonly completionScore = computed(() => {
    const p = this.ws.profile();
    const c = this.ws.config();
    let score = 0;
    if (p.companyName) score += 12;
    if (p.logoUrl) score += 8;
    if (p.description || p.slogan) score += 8;
    if (p.sector || p.website) score += 8;
    if (c.branding.carpetText || c.branding.themePreset) score += 12;
    if (c.office.workspaceName || c.office.lightingTheme) score += 10;
    if (c.agents.length) score += Math.min(20, c.agents.length * 2);
    if (c.assistants.length) score += Math.min(10, c.assistants.length * 3);
    if (this.ws.dataAssets().length) score += 12;
    return Math.min(100, score);
  });

  readonly completionLevel = computed(() => (this.completionScore() < 50 ? 'low' : 'high'));

  readonly completionDash = computed(() => {
    const pct = this.completionScore() / 100;
    const c = 2 * Math.PI * 42;
    return `${pct * c} ${c}`;
  });

  readonly initials = computed(() => {
    const name = this.ws.profile().companyName.trim();
    if (!name) return 'WS';
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');
  });

  async ngOnInit(): Promise<void> {
    await this.ws.hydrate();
    if (this.ws.config().agents.length && !this.selectedAgentId()) {
      this.selectedAgentId.set(this.ws.config().agents[0]!.id);
    }
  }

  themeLabel(): string {
    return this.presets.find((p) => p.id === this.ws.branding().themePreset)?.label ?? 'Personnalisé';
  }

  patchBranding(partial: Parameters<typeof this.ws.patchConfig>[0]['branding'] extends infer B ? Partial<NonNullable<B>> : never): void {
    this.ws.patchConfig({ branding: { ...this.ws.branding(), ...partial } });
  }

  patchOffice(partial: Parameters<typeof this.ws.patchConfig>[0]['office'] extends infer B ? Partial<NonNullable<B>> : never): void {
    this.ws.patchConfig({ office: { ...this.ws.office(), ...partial } });
  }

  color(key: 'primaryColor' | 'secondaryColor' | 'accentColor', value: string): void {
    this.patchBranding({ [key]: value });
  }

  async onLogo(ev: Event): Promise<void> {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > LOGO_MAX_BYTES) {
      this.toast.error('Logo trop volumineux (max 2 Mo).');
      return;
    }
    try {
      await this.ws.uploadLogo(file);
      this.message.set('Logo mis à jour.');
      this.toast.success('Logo mis à jour.');
    } catch {
      const reader = new FileReader();
      reader.onload = () => this.ws.setLogoPreview(String(reader.result));
      reader.readAsDataURL(file);
      this.message.set('Prévisualisation locale — sauvegardez pour persister.');
    }
  }

  async clearLogo(): Promise<void> {
    try {
      await this.ws.clearLogo();
      this.toast.success('Logo supprimé.');
    } catch {
      this.ws.setLogoPreview(null);
    }
  }

  async save(): Promise<void> {
    try {
      await this.ws.saveAll(this.ws.profile().onboardingStatus === 'COMPLETED');
      this.message.set('Workspace sauvegardé.');
      this.toast.success('Workspace sauvegardé.');
    } catch (err) {
      this.message.set(mapHttpError(err, 'Échec de sauvegarde.'));
      this.toast.error(mapHttpError(err, 'Échec de sauvegarde.'));
    }
  }

  async confirmReset(): Promise<void> {
    const ok = await this.confirmDialog.confirm({
      title: 'Réinitialiser le workspace',
      message: 'Réinitialiser toute la personnalisation ? Les changements non sauvegardés seront perdus.',
      confirmLabel: 'Réinitialiser',
      danger: true,
    });
    if (!ok) return;
    this.ws.resetCustomization();
    this.message.set('Personnalisation réinitialisée (non sauvegardée).');
    this.toast.warning('Réinitialisé — pensez à sauvegarder.');
  }

  exportConfig(): void {
    const blob = new Blob([this.ws.exportConfigJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nihao-workspace-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast.success('Configuration exportée.');
  }

  importConfig(ev: Event): void {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        this.ws.importConfigJson(String(reader.result));
        this.message.set('Configuration importée — sauvegardez pour persister.');
        this.toast.success('Configuration importée.');
      } catch {
        this.toast.error('Fichier JSON invalide.');
      }
    };
    reader.readAsText(file);
  }

  seedAgentsFromApi(): void {
    this.api.getAgents().subscribe({
      next: (agents: Agent[]) => {
        const mapped: AgentConfiguration[] = agents.map((a) => ({
          id: a.id,
          code: a.code,
          name: a.name,
          role: a.domain,
          description: a.mission || a.description,
          visualPreset: 'corporate-neutral',
          primaryColor: '#64748B',
          accentColor: '#94A3B8',
          avatar: 'default',
          status: 'active',
          communicationTone: 'professional',
          isVisible: true,
          visibility: 'visible',
          icon: a.code.slice(0, 2),
          assistantIds: [],
        }));
        this.ws.patchConfig({ agents: mapped });
        if (mapped[0]) this.selectedAgentId.set(mapped[0].id);
        this.toast.success(`${mapped.length} agents importés.`);
      },
    });
  }

  updateAgent(id: string, partial: Partial<AgentConfiguration>): void {
    const agents = this.ws.config().agents.map((a) => (a.id === id ? { ...a, ...partial } : a));
    this.ws.patchConfig({ agents });
  }

  applyAgentPreset(id: string, presetId: string): void {
    const preset = this.agentPresets.find((p) => p.id === presetId);
    if (!preset) return;
    this.updateAgent(id, {
      visualPreset: preset.id,
      primaryColor: preset.primaryColor,
      accentColor: preset.accentColor,
      icon: preset.icon,
    });
  }

  addAssistant(): void {
    const parent = this.ws.config().agents[0];
    const assistant: AssistantConfiguration = {
      id: crypto.randomUUID(),
      parentAgentId: parent?.id ?? '',
      name: 'Assistant',
      role: ASSISTANT_ROLES[0],
      visualPreset: 'corporate-neutral',
      color: '#94A3B8',
      visibility: 'discreet',
      linkedDataSourceIds: [],
      isEnabled: true,
      icon: 'AS',
    };
    this.ws.patchConfig({ assistants: [...this.ws.config().assistants, assistant] });
  }

  updateAssistant(id: string, partial: Partial<AssistantConfiguration>): void {
    const assistants = this.ws.config().assistants.map((a) => (a.id === id ? { ...a, ...partial } : a));
    this.ws.patchConfig({ assistants });
  }

  async removeAssistant(id: string): Promise<void> {
    const ok = await this.confirmDialog.confirm({
      title: 'Supprimer l\'assistant',
      message: 'Supprimer cet assistant ?',
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    this.ws.patchConfig({ assistants: this.ws.config().assistants.filter((a) => a.id !== id) });
  }

  onDragOver(ev: DragEvent): void {
    ev.preventDefault();
    this.dragOver.set(true);
  }

  async onDrop(ev: DragEvent): Promise<void> {
    ev.preventDefault();
    this.dragOver.set(false);
    const files = ev.dataTransfer?.files;
    if (files?.length) await this.uploadDataFiles(files);
  }

  async onDataFiles(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    if (input.files?.length) await this.uploadDataFiles(input.files);
  }

  private async uploadDataFiles(files: FileList): Promise<void> {
    for (const file of Array.from(files)) {
      if (file.size > DATA_MAX_BYTES) {
        this.toast.error(`${file.name} dépasse ${this.dataMaxMb} Mo.`);
        continue;
      }
      try {
        await this.ws.uploadDataAsset(file);
        this.toast.success(`${file.name} importé.`);
      } catch (err) {
        this.toast.error(mapHttpError(err, `Échec import ${file.name}.`));
      }
    }
  }

  async deleteAsset(asset: CompanyDataAsset): Promise<void> {
    const ok = await this.confirmDialog.confirm({
      title: 'Supprimer le fichier',
      message: `Supprimer « ${asset.name} » ?`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    try {
      await this.ws.deleteDataAsset(asset.id);
      this.toast.success('Fichier supprimé.');
    } catch (err) {
      this.toast.error(mapHttpError(err));
    }
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }
}
