import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProfessionalWorkspaceService } from '../../core/workspace/professional-workspace.service';
import { ApiService } from '../../core/api/api.service';
import { mapHttpError } from '../../core/api/http-error.util';
import { Agent } from '../../core/api/api.models';
import {
  AGENT_VISUAL_PRESETS,
  ASSISTANT_ROLES,
  LOGO_ACCEPT,
  LOGO_MAX_BYTES,
  THEME_PRESETS,
} from '../../core/workspace/professional-presets';
import type {
  AgentConfiguration,
  AssistantConfiguration,
} from '../../core/workspace/professional.models';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../shared/ui/toast/toast.service';

type TabId = 'identity' | 'office' | 'agents' | 'assistants' | 'data' | 'appearance' | 'accessibility';

@Component({
  selector: 'app-workspace-settings-page',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <a routerLink="/app/ai-office" class="back-ao">← AI Office</a>
          <h1>Paramètres workspace</h1>
          <p>Identité, bureau 3D, agents, assistants et données de l’entreprise</p>
        </div>
        <div class="header-actions">
          @if (ws.dirty()) {
            <span class="dirty">Modifications en attente</span>
          }
          <button type="button" class="btn btn-ghost" (click)="confirmReset()">Réinitialiser</button>
          <button type="button" class="btn btn-primary" [disabled]="ws.loading() || !ws.dirty()" (click)="save()">
            {{ ws.loading() ? 'Sauvegarde…' : 'Sauvegarder' }}
          </button>
        </div>
      </header>

      <div class="tabs" role="tablist">
        @for (t of tabs; track t.id) {
          <button type="button" class="tab" role="tab" [class.active]="tab() === t.id" (click)="tab.set(t.id)">{{ t.label }}</button>
        }
      </div>

      @if (message()) {
        <p class="callout" role="status">{{ message() }}</p>
      }

      @if (tab() === 'identity') {
        <section class="card panel">
          <h2 class="section-title">Identité</h2>
          <div class="grid-2">
            <div class="form-group">
              <label class="label" for="name">Nom</label>
              <input id="name" class="input" [ngModel]="ws.profile().companyName" (ngModelChange)="ws.patchProfile({ companyName: $event })" />
            </div>
            <div class="form-group">
              <label class="label" for="slogan">Slogan</label>
              <input id="slogan" class="input" [ngModel]="ws.profile().slogan" (ngModelChange)="ws.patchProfile({ slogan: $event })" />
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
                <span>Logo</span>
              }
            </div>
            <div>
              <label class="btn btn-ghost file-btn">
                Remplacer le logo
                <input type="file" [accept]="logoAccept" hidden (change)="onLogo($event)" />
              </label>
              <button type="button" class="btn btn-ghost" (click)="clearLogo()">Supprimer</button>
            </div>
          </div>
        </section>
      }

      @if (tab() === 'office') {
        <section class="card panel">
          <h2 class="section-title">Bureau 3D</h2>
          <div class="presets">
            @for (p of presets; track p.id) {
              <button type="button" class="preset" [class.active]="ws.branding().themePreset === p.id" (click)="ws.applyThemePreset(p.id)">{{ p.label }}</button>
            }
          </div>
          <div class="grid-3">
            <div class="form-group"><label class="label">Principale</label><input type="color" class="input" [ngModel]="ws.branding().primaryColor" (ngModelChange)="color('primaryColor', $event)" /></div>
            <div class="form-group"><label class="label">Secondaire</label><input type="color" class="input" [ngModel]="ws.branding().secondaryColor" (ngModelChange)="color('secondaryColor', $event)" /></div>
            <div class="form-group"><label class="label">Accent</label><input type="color" class="input" [ngModel]="ws.branding().accentColor" (ngModelChange)="color('accentColor', $event)" /></div>
            <div class="form-group">
              <label class="label">Mode logo</label>
              <select class="input" [ngModel]="ws.branding().logoDisplayMode" (ngModelChange)="ws.patchConfig({ branding: { ...ws.branding(), logoDisplayMode: $event } })">
                <option value="plaque">Plaque</option>
                <option value="hologram">Hologramme</option>
                <option value="led">LED</option>
                <option value="neon">Néon</option>
              </select>
            </div>
            <div class="form-group">
              <label class="label">Échelle logo</label>
              <input type="range" min="0.6" max="1.6" step="0.05" [ngModel]="ws.branding().logoScale" (ngModelChange)="ws.patchConfig({ branding: { ...ws.branding(), logoScale: +$event } })" />
            </div>
            <div class="form-group">
              <label class="label">Luminosité logo</label>
              <input type="range" min="0.1" max="1" step="0.05" [ngModel]="ws.branding().logoBrightness" (ngModelChange)="ws.patchConfig({ branding: { ...ws.branding(), logoBrightness: +$event } })" />
            </div>
            <div class="form-group">
              <label class="label">Style tapis</label>
              <select class="input" [ngModel]="ws.branding().carpetStyle" (ngModelChange)="ws.patchConfig({ branding: { ...ws.branding(), carpetStyle: $event } })">
                <option value="corporate">Corporate</option>
                <option value="futuristic">Futuriste</option>
                <option value="circular">Circulaire</option>
                <option value="premium">Premium</option>
                <option value="holographic">Holographique</option>
              </select>
            </div>
            <div class="form-group">
              <label class="label">Texte tapis</label>
              <input class="input" [ngModel]="ws.branding().carpetText" (ngModelChange)="ws.patchConfig({ branding: { ...ws.branding(), carpetText: $event } })" />
            </div>
            <div class="form-group">
              <label class="label">Néons</label>
              <input type="range" min="0" max="1" step="0.05" [ngModel]="ws.office().neonIntensity" (ngModelChange)="ws.patchConfig({ office: { ...ws.office(), neonIntensity: +$event } })" />
            </div>
          </div>
          <div class="branding-preview" aria-label="Aperçu branding">
            <div class="preview-swatch" [style.background]="ws.branding().primaryColor"></div>
            <div class="preview-swatch" [style.background]="ws.branding().secondaryColor"></div>
            <div class="preview-swatch" [style.background]="ws.branding().accentColor"></div>
            <div class="preview-carpet">
              <span>{{ ws.branding().carpetText || ws.profile().companyName || 'Entreprise' }}</span>
            </div>
          </div>
          <a routerLink="/app/ai-office" class="btn btn-primary">Prévisualiser dans l’AI Office</a>
        </section>
      }

      @if (tab() === 'agents') {
        <section class="card panel">
          <h2 class="section-title">Agents IA</h2>
          <p class="callout">Personnalisez l’apparence et le ton. Les presets s’appliquent aux accents 3D au prochain chargement de scène.</p>
          <button type="button" class="btn btn-ghost" (click)="seedAgentsFromApi()">Importer les agents existants</button>
          @for (agent of ws.config().agents; track agent.id) {
            <article class="agent-edit">
              <div class="grid-2">
                <div class="form-group"><label class="label">Nom</label><input class="input" [ngModel]="agent.name" (ngModelChange)="updateAgent(agent.id, { name: $event })" /></div>
                <div class="form-group"><label class="label">Rôle</label><input class="input" [ngModel]="agent.role" (ngModelChange)="updateAgent(agent.id, { role: $event })" /></div>
                <div class="form-group"><label class="label">Preset</label>
                  <select class="input" [ngModel]="agent.visualPreset" (ngModelChange)="applyAgentPreset(agent.id, $event)">
                    @for (p of agentPresets; track p.id) { <option [value]="p.id">{{ p.label }}</option> }
                  </select>
                </div>
                <div class="form-group"><label class="label">Ton</label>
                  <select class="input" [ngModel]="agent.communicationTone" (ngModelChange)="updateAgent(agent.id, { communicationTone: $event })">
                    <option value="professional">Professionnel</option>
                    <option value="direct">Direct</option>
                    <option value="analytical">Analytique</option>
                    <option value="creative">Créatif</option>
                    <option value="support">Support client</option>
                  </select>
                </div>
                <div class="form-group"><label class="label">Visibilité</label>
                  <select class="input" [ngModel]="agent.visibility" (ngModelChange)="updateAgent(agent.id, { visibility: $event })">
                    <option value="visible">Visible</option>
                    <option value="secondary">Secondaire</option>
                    <option value="hidden">Masqué</option>
                  </select>
                </div>
                <div class="form-group"><label class="label">Statut</label>
                  <select class="input" [ngModel]="agent.status" (ngModelChange)="updateAgent(agent.id, { status: $event })">
                    <option value="active">Actif</option>
                    <option value="preparing">En préparation</option>
                    <option value="disabled">Désactivé</option>
                  </select>
                </div>
              </div>
            </article>
          }
        </section>
      }

      @if (tab() === 'assistants') {
        <section class="card panel">
          <h2 class="section-title">Assistants</h2>
          <button type="button" class="btn btn-ghost" (click)="addAssistant()">Ajouter un assistant</button>
          @for (a of ws.config().assistants; track a.id) {
            <article class="agent-edit">
              <div class="grid-2">
                <div class="form-group"><label class="label">Nom</label><input class="input" [ngModel]="a.name" (ngModelChange)="updateAssistant(a.id, { name: $event })" /></div>
                <div class="form-group"><label class="label">Rôle</label>
                  <select class="input" [ngModel]="a.role" (ngModelChange)="updateAssistant(a.id, { role: $event })">
                    @for (r of assistantRoles; track r) { <option [value]="r">{{ r }}</option> }
                  </select>
                </div>
                <div class="form-group"><label class="label">Agent parent</label>
                  <select class="input" [ngModel]="a.parentAgentId" (ngModelChange)="updateAssistant(a.id, { parentAgentId: $event })">
                    @for (ag of ws.config().agents; track ag.id) { <option [value]="ag.id">{{ ag.name }}</option> }
                  </select>
                </div>
                <div class="form-group"><label class="label">Actif</label>
                  <select class="input" [ngModel]="a.isEnabled ? '1' : '0'" (ngModelChange)="updateAssistant(a.id, { isEnabled: $event === '1' })">
                    <option value="1">Oui</option>
                    <option value="0">Non</option>
                  </select>
                </div>
              </div>
            </article>
          }
        </section>
      }

      @if (tab() === 'data') {
        <section class="card panel">
          <h2 class="section-title">Données</h2>
          <p class="callout">Centre complet : <a routerLink="/app/company-data">Données de l’entreprise</a></p>
          <p>{{ ws.dataAssets().length }} fichier(s) importé(s). Traitement intelligent IA : bientôt disponible.</p>
        </section>
      }

      @if (tab() === 'appearance') {
        <section class="card panel">
          <h2 class="section-title">Apparence</h2>
          <div class="grid-2">
            <div class="form-group"><label class="label">Nom de l’espace</label>
              <input class="input" [ngModel]="ws.office().workspaceName" (ngModelChange)="ws.patchConfig({ office: { ...ws.office(), workspaceName: $event } })" />
            </div>
            <div class="form-group"><label class="label">Badge</label>
              <input class="input" [ngModel]="ws.office().companyBadge" (ngModelChange)="ws.patchConfig({ office: { ...ws.office(), companyBadge: $event } })" />
            </div>
            <div class="form-group"><label class="label">Animation</label>
              <select class="input" [ngModel]="ws.office().animationMode" (ngModelChange)="ws.patchConfig({ office: { ...ws.office(), animationMode: $event } })">
                <option value="none">Aucune</option>
                <option value="pulse">Lumières pulsées</option>
                <option value="network">Lignes réseau</option>
                <option value="particles">Particules</option>
                <option value="digital-rain">Pluie digitale</option>
              </select>
            </div>
            <div class="form-group"><label class="label">Éclairage</label>
              <select class="input" [ngModel]="ws.office().lightingTheme" (ngModelChange)="ws.patchConfig({ office: { ...ws.office(), lightingTheme: $event } })">
                <option value="day">Jour</option>
                <option value="night">Nuit</option>
                <option value="dark">Sombre</option>
                <option value="cyberpunk">Cyberpunk</option>
                <option value="corporate">Corporate</option>
              </select>
            </div>
          </div>
        </section>
      }

      @if (tab() === 'accessibility') {
        <section class="card panel">
          <h2 class="section-title">Accessibilité</h2>
          <label class="check">
            <input
              type="checkbox"
              [checked]="ws.office().accessibilityMode"
              (change)="onAccessibilityMode($event)"
            />
            Réduire les animations
          </label>
          <label class="check">
            <input
              type="checkbox"
              [checked]="ws.office().highContrast"
              (change)="onHighContrast($event)"
            />
            Contraste élevé
          </label>
        </section>
      }
    </div>
  `,
  styles: [`
    .header-actions { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
    .dirty { font-size: 0.72rem; color: var(--accent-warning); font-weight: 700; }
    .panel { padding: 1.15rem; margin-bottom: 1rem; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin: 0.75rem 0; }
    .full { grid-column: 1 / -1; }
    .logo-row { display: flex; gap: 1rem; align-items: center; margin-top: 1rem; }
    .logo-preview { width: 88px; height: 88px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); display: grid; place-items: center; overflow: hidden; }
    .logo-preview img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .presets { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .preset { border: 1px solid var(--border-color); background: var(--bg-primary); border-radius: var(--radius-sm); padding: 0.35rem 0.55rem; cursor: pointer; font-size: 0.72rem; }
    .preset.active { border-color: var(--accent-primary); color: var(--accent-primary); }
    .branding-preview { display: flex; gap: 0.5rem; align-items: center; margin: 1rem 0; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-primary); }
    .preview-swatch { width: 28px; height: 28px; border-radius: 4px; border: 1px solid color-mix(in srgb, var(--border-color) 80%, transparent); }
    .preview-carpet { flex: 1; text-align: center; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-secondary); padding: 0.35rem 0.5rem; border: 1px dashed var(--border-color); border-radius: var(--radius-sm); }
    .agent-edit { border-top: 1px solid var(--border-color); padding: 0.85rem 0; margin-top: 0.5rem; }
    .check { display: flex; gap: 0.5rem; align-items: center; margin: 0.5rem 0; font-size: 0.88rem; }
    @media (max-width: 800px) { .grid-2, .grid-3 { grid-template-columns: 1fr; } }
  `],
})
export class WorkspaceSettingsPage implements OnInit {
  readonly ws = inject(ProfessionalWorkspaceService);
  private readonly api = inject(ApiService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);

  readonly tab = signal<TabId>('identity');
  readonly message = signal('');
  readonly tabs: Array<{ id: TabId; label: string }> = [
    { id: 'identity', label: 'Identité' },
    { id: 'office', label: 'Bureau 3D' },
    { id: 'agents', label: 'Agents IA' },
    { id: 'assistants', label: 'Assistants' },
    { id: 'data', label: 'Données' },
    { id: 'appearance', label: 'Apparence' },
    { id: 'accessibility', label: 'Accessibilité' },
  ];
  readonly presets = THEME_PRESETS;
  readonly agentPresets = AGENT_VISUAL_PRESETS;
  readonly assistantRoles = ASSISTANT_ROLES;
  readonly logoAccept = LOGO_ACCEPT;

  async ngOnInit(): Promise<void> {
    await this.ws.hydrate();
  }

  color(key: 'primaryColor' | 'secondaryColor' | 'accentColor', value: string): void {
    this.ws.patchConfig({ branding: { ...this.ws.branding(), [key]: value } });
  }

  onAccessibilityMode(ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    this.ws.patchConfig({ office: { ...this.ws.office(), accessibilityMode: checked } });
  }

  onHighContrast(ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    this.ws.patchConfig({ office: { ...this.ws.office(), highContrast: checked } });
  }

  async onLogo(ev: Event): Promise<void> {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > LOGO_MAX_BYTES) {
      this.message.set('Logo trop volumineux (max 2 Mo).');
      return;
    }
    try {
      await this.ws.uploadLogo(file);
      this.message.set('Logo mis à jour.');
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
    } catch {
      this.ws.setLogoPreview(null);
    }
  }

  async save(): Promise<void> {
    try {
      await this.ws.saveAll(this.ws.profile().onboardingStatus === 'COMPLETED');
      this.message.set('Personnalisation sauvegardée.');
      this.toast.success('Personnalisation sauvegardée.');
    } catch (err) {
      this.message.set(mapHttpError(err, 'Échec de sauvegarde.'));
      this.toast.error(mapHttpError(err, 'Échec de sauvegarde.'));
    }
  }

  async confirmReset(): Promise<void> {
    const ok = await this.confirmDialog.confirm({
      title: 'Réinitialiser',
      message: 'Réinitialiser toute la personnalisation ? Les changements non sauvegardés seront perdus.',
      confirmLabel: 'Réinitialiser',
      danger: true,
    });
    if (!ok) return;
    this.ws.resetCustomization();
    this.message.set('Personnalisation réinitialisée (non sauvegardée).');
    this.toast.warning('Personnalisation réinitialisée — pensez à sauvegarder.');
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
        this.message.set(`${mapped.length} agents importés.`);
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
}
