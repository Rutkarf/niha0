import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProfessionalWorkspaceService } from '../../core/workspace/professional-workspace.service';
import { CompanyLabelPipe } from '../../shared/pipes/company-label.pipe';
import { FeaturePageHeaderComponent } from '../../shared/ui/feature-page-header/feature-page-header.component';
import {
  COMPANY_SIZES,
  LOGO_ACCEPT,
  LOGO_MAX_BYTES,
  THEME_PRESETS,
} from '../../core/workspace/professional-presets';
import type { CarpetStyle, LogoDisplayMode } from '../../core/workspace/professional.models';

@Component({
  selector: 'app-onboarding-page',
  imports: [FormsModule, RouterLink, CompanyLabelPipe, FeaturePageHeaderComponent],
  template: `
    <div class="page feature-module-page onboarding">
      <app-feature-page-header
        group="Système"
        code="ONBOARDING"
        title="Espace professionnel"
        backLabel="← AI Office"
      >
        <span chips class="soon-pill">Étape {{ step() + 1 }} / 4</span>
      </app-feature-page-header>

      <nav class="steps" aria-label="Étapes d’onboarding">
        @for (label of stepLabels; track label; let i = $index) {
          <button
            type="button"
            class="step"
            [class.active]="step() === i"
            [class.done]="step() > i"
            [attr.aria-current]="step() === i ? 'step' : null"
            (click)="go(i)"
          >
            <span class="step-num" aria-hidden="true">{{ i + 1 }}</span>
            {{ label }}
          </button>
        }
      </nav>
      <div class="step-bar" aria-hidden="true">
        <div class="step-fill" [style.width.%]="((step() + 1) / 4) * 100"></div>
      </div>

      @if (stepError()) {
        <p class="error banner" role="alert">{{ stepError() }}</p>
      }

      @if (step() === 0) {
        <section class="feature-hub card panel" aria-labelledby="co-title">
          <h2 id="co-title" class="section-title">Informations entreprise</h2>
          <div class="grid-2">
            <div class="form-group">
              <label class="label" for="companyName">Nom *</label>
              <input id="companyName" class="input" [ngModel]="ws.profile().companyName" (ngModelChange)="ws.patchProfile({ companyName: $event })" required />
            </div>
            <div class="form-group">
              <label class="label" for="sector">Secteur *</label>
              <input id="sector" class="input" [ngModel]="ws.profile().sector" (ngModelChange)="ws.patchProfile({ sector: $event })" />
            </div>
            <div class="form-group">
              <label class="label" for="size">Taille</label>
              <select id="size" class="input" [ngModel]="ws.profile().companySize" (ngModelChange)="ws.patchProfile({ companySize: $event })">
                <option value="">Sélectionner</option>
                @for (s of sizes; track s) {
                  <option [value]="s">{{ s }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="label" for="email">E-mail professionnel</label>
              <input id="email" class="input" type="email" [ngModel]="ws.profile().professionalEmail" (ngModelChange)="ws.patchProfile({ professionalEmail: $event })" />
            </div>
            <div class="form-group">
              <label class="label" for="country">Pays</label>
              <input id="country" class="input" [ngModel]="ws.profile().country" (ngModelChange)="ws.patchProfile({ country: $event })" />
            </div>
            <div class="form-group">
              <label class="label" for="city">Ville</label>
              <input id="city" class="input" [ngModel]="ws.profile().city" (ngModelChange)="ws.patchProfile({ city: $event })" />
            </div>
            <div class="form-group full">
              <label class="label" for="website">Site web</label>
              <input id="website" class="input" [ngModel]="ws.profile().website" (ngModelChange)="ws.patchProfile({ website: $event })" placeholder="https://" />
            </div>
            <div class="form-group full">
              <label class="label" for="desc">Description</label>
              <textarea id="desc" class="input" rows="3" [ngModel]="ws.profile().description" (ngModelChange)="ws.patchProfile({ description: $event })"></textarea>
            </div>
            <div class="form-group full">
              <label class="label" for="slogan">Slogan</label>
              <input id="slogan" class="input" [ngModel]="ws.profile().slogan" (ngModelChange)="ws.patchProfile({ slogan: $event })" />
            </div>
          </div>
        </section>
      }

      @if (step() === 1) {
        <section class="feature-hub card panel">
          <h2 class="section-title">Identité visuelle — logo</h2>
          <div class="logo-row">
            <div class="logo-preview" aria-live="polite">
              @if (ws.profile().logoUrl) {
                <img [src]="ws.profile().logoUrl!" alt="Prévisualisation logo" />
              } @else {
                <span class="placeholder">{{ initials() }}</span>
              }
            </div>
            <div class="logo-actions">
              <label class="btn btn-ghost file-btn">
                Choisir un logo
                <input type="file" [accept]="logoAccept" (change)="onLogoSelected($event)" hidden />
              </label>
              @if (ws.profile().logoUrl) {
                <button type="button" class="btn btn-danger" (click)="removeLogo()">Supprimer</button>
              }
              <p class="hint">PNG, JPG, JPEG, WEBP, SVG — max 2 Mo.</p>
              @if (logoError()) {
                <p class="error" role="alert">{{ logoError() }}</p>
              }
            </div>
          </div>
        </section>
      }

      @if (step() === 2) {
        <section class="feature-hub card panel">
          <h2 class="section-title">Personnalisation 3D</h2>
          <p class="section-label">Thèmes prédéfinis</p>
          <div class="presets">
            @for (p of presets; track p.id) {
              <button type="button" class="preset" [class.active]="ws.branding().themePreset === p.id" (click)="ws.applyThemePreset(p.id)">
                <span class="swatches">
                  <i [style.background]="p.primary"></i>
                  <i [style.background]="p.secondary"></i>
                  <i [style.background]="p.accent"></i>
                </span>
                {{ p.label }}
              </button>
            }
          </div>
          <div class="grid-3">
            <div class="form-group">
              <label class="label" for="primary">Couleur principale</label>
              <input id="primary" class="input" type="color" [ngModel]="ws.branding().primaryColor" (ngModelChange)="ws.patchConfig({ branding: { ...ws.branding(), primaryColor: $event } })" />
            </div>
            <div class="form-group">
              <label class="label" for="secondary">Secondaire</label>
              <input id="secondary" class="input" type="color" [ngModel]="ws.branding().secondaryColor" (ngModelChange)="ws.patchConfig({ branding: { ...ws.branding(), secondaryColor: $event } })" />
            </div>
            <div class="form-group">
              <label class="label" for="accent">Accent / néon</label>
              <input id="accent" class="input" type="color" [ngModel]="ws.branding().accentColor" (ngModelChange)="ws.patchConfig({ branding: { ...ws.branding(), accentColor: $event } })" />
            </div>
            <div class="form-group">
              <label class="label" for="logoMode">Affichage logo</label>
              <select id="logoMode" class="input" [ngModel]="ws.branding().logoDisplayMode" (ngModelChange)="setLogoMode($event)">
                <option value="plaque">Plaque</option>
                <option value="hologram">Hologramme</option>
                <option value="led">Écran LED</option>
                <option value="neon">Enseigne néon</option>
              </select>
            </div>
            <div class="form-group">
              <label class="label" for="carpet">Style tapis</label>
              <select id="carpet" class="input" [ngModel]="ws.branding().carpetStyle" (ngModelChange)="setCarpet($event)">
                <option value="corporate">Moquette corporate</option>
                <option value="futuristic">Futuriste bord lumineux</option>
                <option value="circular">Circulaire / emblème</option>
                <option value="premium">Rectangulaire premium</option>
                <option value="holographic">Sol holographique</option>
              </select>
            </div>
            <div class="form-group">
              <label class="label" for="carpetText">Texte au sol</label>
              <input id="carpetText" class="input" [ngModel]="ws.branding().carpetText || ws.profile().companyName" (ngModelChange)="ws.patchConfig({ branding: { ...ws.branding(), carpetText: $event } })" />
            </div>
          </div>
          <div class="preview-swatch" [style.background]="'linear-gradient(120deg,' + ws.branding().primaryColor + ',' + ws.branding().accentColor + ')'">
            Prévisualisation · {{ ws.profile().companyName || 'Votre entreprise' }}
          </div>
          <p class="feature-callout">Le logo mural et le tapis seront appliqués derrière le bureau CEO dans l’AI Office après sauvegarde.</p>
        </section>
      }

      @if (step() === 3) {
        <section class="feature-hub card panel">
          <h2 class="section-title">Confirmation</h2>
          <dl class="summary">
            <div><dt>Entreprise</dt><dd>{{ ws.profile().companyName | companyLabel:'—' }}</dd></div>
            <div><dt>Secteur</dt><dd>{{ ws.profile().sector || '—' }}</dd></div>
            <div><dt>Thème</dt><dd>{{ ws.branding().themePreset }}</dd></div>
            <div><dt>Logo</dt><dd>{{ ws.profile().logoUrl ? 'Chargé' : 'Initiales' }}</dd></div>
          </dl>
          <p class="feature-callout">Vous pourrez modifier agents, assistants et données depuis Paramètres workspace après création.</p>
          @if (saveError()) {
            <p class="error" role="alert">{{ saveError() }}</p>
          }
        </section>
      }

      <footer class="actions">
        <button type="button" class="btn btn-ghost" [disabled]="step() === 0" (click)="prev()">Retour</button>
        @if (step() < 3) {
          <button type="button" class="btn btn-primary" (click)="next()">Continuer</button>
        } @else {
          <button type="button" class="btn btn-primary" [disabled]="ws.loading()" (click)="finish()">
            {{ ws.loading() ? 'Sauvegarde…' : 'Créer mon espace 3D' }}
          </button>
        }
        <a routerLink="/app/workspace" class="btn btn-ghost">Éditer plus tard</a>
      </footer>
    </div>
  `,
  styles: [`
    .onboarding { max-width: 920px; }
    .steps { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.55rem; }
    .step {
      border: 1px solid var(--border-color);
      background: var(--bg-elevated);
      color: var(--text-secondary);
      border-radius: var(--radius-sm);
      padding: 0.4rem 0.65rem;
      font-size: 0.72rem;
      font-weight: 650;
      cursor: pointer;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
    .step-num {
      width: 1.1rem;
      height: 1.1rem;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 0.62rem;
      background: var(--bg-hover);
      color: var(--text-muted);
    }
    .step.active { color: var(--accent-primary); border-color: var(--border-strong); }
    .step.active .step-num { background: var(--accent-primary); color: var(--on-accent); }
    .step.done { opacity: 0.9; }
    .step.done .step-num { background: color-mix(in srgb, var(--accent-success) 35%, var(--bg-elevated)); color: var(--accent-success); }
    .step-bar {
      height: 4px;
      border-radius: 2px;
      background: var(--border-color);
      overflow: hidden;
    }
    .step-fill {
      height: 100%;
      background: var(--accent-primary);
      transition: width var(--transition);
    }
    .error.banner {
      color: var(--accent-danger);
      background: color-mix(in srgb, var(--accent-danger) 12%, transparent);
      border: 1px solid color-mix(in srgb, var(--accent-danger) 30%, transparent);
      border-radius: var(--radius-sm);
      padding: 0.55rem 0.75rem;
      margin: 0 0 1rem;
      font-size: 0.85rem;
    }
    .panel { padding: 0; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.85rem; margin-top: 1rem; }
    .full { grid-column: 1 / -1; }
    textarea.input { resize: vertical; min-height: 4.5rem; }
    .logo-row { display: flex; gap: 1.25rem; align-items: center; flex-wrap: wrap; }
    .logo-preview {
      width: 120px; height: 120px; border-radius: var(--radius-md);
      border: 1px solid var(--border-color); background: var(--bg-primary);
      display: grid; place-items: center; overflow: hidden;
    }
    .logo-preview img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .placeholder { font-family: var(--font-display); font-weight: 800; font-size: 1.6rem; color: var(--accent-primary); }
    .hint { font-size: 0.75rem; color: var(--text-muted); margin: 0.5rem 0 0; }
    .error { color: var(--accent-danger); font-size: 0.85rem; }
    .presets { display: flex; flex-wrap: wrap; gap: 0.45rem; }
    .preset {
      display: flex; align-items: center; gap: 0.4rem;
      border: 1px solid var(--border-color); background: var(--bg-primary);
      border-radius: var(--radius-sm); padding: 0.4rem 0.55rem; cursor: pointer;
      font-size: 0.72rem; font-weight: 600; color: var(--text-secondary);
    }
    .preset.active { border-color: var(--accent-primary); color: var(--accent-primary); }
    .swatches { display: flex; gap: 2px; }
    .swatches i { width: 10px; height: 10px; border-radius: 2px; display: block; }
    .preview-swatch {
      margin-top: 1rem; padding: 1rem; border-radius: var(--radius-md);
      color: var(--on-accent); font-weight: 700; text-align: center;
    }
    .summary { display: grid; gap: 0.55rem; }
    .summary div { display: flex; gap: 0.75rem; }
    .summary dt { width: 7rem; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; }
    .summary dd { margin: 0; font-weight: 600; }
    .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
    @media (max-width: 720px) {
      .grid-2, .grid-3 { grid-template-columns: 1fr; }
    }
    @media (prefers-reduced-motion: reduce) {
      .step-fill { transition: none; }
    }
  `],
})
export class OnboardingPage implements OnInit {
  readonly ws = inject(ProfessionalWorkspaceService);
  private readonly router = inject(Router);

  readonly step = signal(0);
  readonly logoError = signal('');
  readonly saveError = signal('');
  readonly stepError = signal('');
  readonly stepLabels = ['Entreprise', 'Logo', 'Bureau 3D', 'Confirmation'];
  readonly sizes = COMPANY_SIZES;
  readonly presets = THEME_PRESETS;
  readonly logoAccept = LOGO_ACCEPT;

  async ngOnInit(): Promise<void> {
    await this.ws.hydrate();
    const savedStep = this.ws.config().onboardingStep ?? 0;
    this.step.set(Math.min(3, Math.max(0, savedStep)));
  }

  go(i: number): void {
    this.step.set(i);
    this.ws.patchConfig({ onboardingStep: i });
  }

  prev(): void {
    this.go(Math.max(0, this.step() - 1));
  }

  next(): void {
    if (this.step() === 0 && !this.ws.profile().companyName.trim()) {
      this.stepError.set('Le nom de l’entreprise est obligatoire pour continuer.');
      return;
    }
    this.stepError.set('');
    this.saveError.set('');
    this.go(Math.min(3, this.step() + 1));
  }

  initials(): string {
    const n = this.ws.profile().companyName.trim();
    const parts = n.split(/\s+/);
    return ((parts[0]?.[0] ?? 'N') + (parts[1]?.[0] ?? 'I')).toUpperCase();
  }

  onLogoSelected(ev: Event): void {
    this.logoError.set('');
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > LOGO_MAX_BYTES) {
      this.logoError.set('Fichier trop volumineux (max 2 Mo).');
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.logoError.set('Type non supporté. Utilisez PNG, JPG, WEBP ou SVG.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => this.ws.setLogoPreview(String(reader.result));
    reader.readAsDataURL(file);
  }

  removeLogo(): void {
    this.ws.setLogoPreview(null);
  }

  setLogoMode(mode: string): void {
    this.ws.patchConfig({ branding: { ...this.ws.branding(), logoDisplayMode: mode as LogoDisplayMode } });
  }

  setCarpet(style: string): void {
    this.ws.patchConfig({ branding: { ...this.ws.branding(), carpetStyle: style as CarpetStyle } });
  }

  async finish(): Promise<void> {
    this.saveError.set('');
    try {
      await this.ws.saveAll(true);
      await this.router.navigateByUrl('/app/ai-office');
    } catch {
      this.saveError.set('Impossible de sauvegarder. Vérifiez votre connexion API.');
    }
  }
}
