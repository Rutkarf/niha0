import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../../../core/theme/theme.service';
import { DashboardPreferencesService } from '../../services/dashboard-preferences.service';
import { TEAM_COLORS } from '../../../ai-office/config/team-colors';

@Component({
  selector: 'app-dashboard-settings',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="settings-grid">
      <section class="panel">
        <h3>Thème</h3>
        <p class="hint">Mode actuel : {{ theme.label() }}</p>
        <div class="btn-row">
          <button type="button" class="btn btn-ghost btn-sm" (click)="theme.setMode('SOLARPUNK')">Clair (SolarPunk)</button>
          <button type="button" class="btn btn-ghost btn-sm" (click)="theme.setMode('CYBERPUNK')">Sombre (Cyberpunk)</button>
          <button type="button" class="btn btn-ghost btn-sm" (click)="theme.setMode('AUTO')">Auto</button>
        </div>
      </section>

      <section class="panel">
        <h3>Affichage dashboard</h3>
        <label class="field">
          Agents par page
          <select class="input" [ngModel]="prefs().agentsPageSize" (ngModelChange)="patch({ agentsPageSize: +$event })">
            <option [ngValue]="10">10</option>
            <option [ngValue]="25">25</option>
            <option [ngValue]="50">50</option>
          </select>
        </label>
        <label class="field">
          Taille des cartes équipes
          <select class="input" [ngModel]="prefs().cardSize" (ngModelChange)="patch({ cardSize: $event })">
            <option value="compact">Compact</option>
            <option value="normal">Normal</option>
            <option value="large">Large</option>
          </select>
        </label>
      </section>

      <section class="panel">
        <h3>Notifications</h3>
        <label class="check"><input type="checkbox" [ngModel]="prefs().notificationsEnabled" (ngModelChange)="patch({ notificationsEnabled: $event })" /> Activer notifications</label>
        <label class="check"><input type="checkbox" [ngModel]="prefs().notifyEmail" (ngModelChange)="patch({ notifyEmail: $event })" /> Email</label>
        <label class="check"><input type="checkbox" [ngModel]="prefs().notifyPush" (ngModelChange)="patch({ notifyPush: $event })" /> Push</label>
      </section>

      <section class="panel">
        <h3>Langue</h3>
        <select class="input" [ngModel]="prefs().locale" (ngModelChange)="patch({ locale: $event })">
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      </section>

      <section class="panel">
        <h3>Configuration Nihao (aperçu)</h3>
        <p class="hint">Couleurs des 10 équipes — modification avancée dans Workspace.</p>
        <ul class="colors">
          @for (t of teamColors; track t.row) {
            <li>
              <span class="sw" [style.background]="t.color"></span>
              {{ t.role }}
              <code>{{ t.color }}</code>
            </li>
          }
        </ul>
        <div class="btn-row">
          <label class="check"><input type="checkbox" [ngModel]="prefs().ledsEnabled" (ngModelChange)="patch({ ledsEnabled: $event })" /> LEDs activées (affichage)</label>
        </div>
        <a routerLink="/app/workspace" class="btn btn-ghost btn-sm">Positions & branding → Workspace</a>
        <a routerLink="/app/ai-office" class="btn btn-primary btn-sm">Vue 3D · caméra & navigation</a>
      </section>

      <section class="panel">
        <h3>Filtres rapides par défaut</h3>
        <label class="check"><input type="checkbox" [ngModel]="prefs().showOnlyActive" (ngModelChange)="patch({ showOnlyActive: $event })" /> Afficher seulement agents actifs</label>
        <label class="check"><input type="checkbox" [ngModel]="prefs().showHighPerformers" (ngModelChange)="patch({ showHighPerformers: $event })" /> Équipes performantes</label>
        <label class="check"><input type="checkbox" [ngModel]="prefs().showChiefsOnly" (ngModelChange)="patch({ showChiefsOnly: $event })" /> Chefs uniquement</label>
        <button type="button" class="btn btn-ghost btn-sm" (click)="prefService.reset()">Réinitialiser préférences</button>
      </section>
    </div>
  `,
  styles: [`
    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--space-3);
    }
    .panel {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      padding: var(--space-3);
    }
    .panel h3 { margin: 0 0 var(--space-2); font-size: var(--fs-sm); text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
    .hint { font-size: 0.72rem; color: var(--text-muted); margin: 0 0 var(--space-2); }
    .field { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.75rem; margin-bottom: var(--space-2); }
    .check { display: flex; align-items: center; gap: 0.5rem; font-size: var(--fs-sm); margin-bottom: 0.35rem; }
    .btn-row { display: flex; flex-wrap: wrap; gap: 0.35rem; margin: var(--space-2) 0; }
    .colors { list-style: none; padding: 0; margin: 0 0 var(--space-2); font-size: 0.72rem; }
    .colors li { display: flex; align-items: center; gap: 0.5rem; padding: 0.2rem 0; }
    .sw { width: 0.75rem; height: 0.75rem; border-radius: 2px; }
    code { margin-left: auto; font-size: 0.65rem; color: var(--text-muted); }
  `],
})
export class DashboardSettingsComponent {
  readonly theme = inject(ThemeService);
  readonly prefService = inject(DashboardPreferencesService);
  readonly prefs = this.prefService.prefs;
  readonly teamColors = TEAM_COLORS;

  patch(p: Parameters<DashboardPreferencesService['update']>[0]): void {
    this.prefService.update(p);
  }
}
