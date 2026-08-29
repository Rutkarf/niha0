import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiService } from '../../../core/api/api.service';
import { mapHttpError } from '../../../core/api/http-error.util';
import { LocaleService } from '../../../core/i18n/locale.service';
import { environment } from '../../../../environments/environment';
import { PublicSiteShellComponent } from '../../marketing-site/public-site-shell.component';
import { PUBLIC_AUTH_STYLES } from '../../marketing-site/public-content.styles';
import {
  AUDIENCE_ROLES,
  AudienceRoleId,
  audienceById,
  MAX_PLAN_HIGHLIGHTS,
} from '../../marketing-site/audience-roles';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink, PublicSiteShellComponent],
  template: `
    <app-public-site-shell pageTitle="Connexion">
      <div class="auth-wrap login-split">
        <section class="auth-card signin-panel" aria-labelledby="login-title">
          <header class="auth-header">
            <p class="panel-kicker">Déjà un compte</p>
            <h2 id="login-title">{{ locale.t('login') }}</h2>
            <p>Accédez à votre espace NIHAO</p>
          </header>

          @if (oauthEnabled()) {
            <button type="button" class="btn btn-oauth" (click)="loginWithGoogle()">
              Continuer avec Google
            </button>
            <p class="divider"><span>ou e-mail</span></p>
          }

          <form (ngSubmit)="submit()" class="auth-form" novalidate>
            <div class="form-group">
              <label class="label" for="email">{{ locale.t('email') }}</label>
              <input
                id="email"
                class="input"
                type="email"
                [(ngModel)]="email"
                name="email"
                required
                autocomplete="username"
                [attr.aria-invalid]="!!error()"
                [attr.aria-describedby]="error() ? 'login-error' : null"
              />
            </div>
            <div class="form-group">
              <label class="label" for="password">{{ locale.t('password') }}</label>
              <div class="pwd-row">
                <input
                  id="password"
                  class="input"
                  [type]="showPwd() ? 'text' : 'password'"
                  [(ngModel)]="password"
                  name="password"
                  required
                  autocomplete="current-password"
                />
                <button type="button" class="btn btn-ghost btn-sm toggle-pwd" (click)="showPwd.update((v) => !v)">
                  {{ showPwd() ? 'Masquer' : 'Afficher' }}
                </button>
              </div>
            </div>
            <p class="forgot-row">
              <a routerLink="/forgot-password">{{ locale.t('forgotPassword') }}</a>
            </p>
            @if (error()) {
              <p id="login-error" class="error" role="alert">{{ error() }}</p>
            }
            <button
              type="submit"
              class="btn btn-primary auth-btn"
              [class.is-loading]="auth.loading()"
              [disabled]="auth.loading() || !email.trim() || !password"
            >
              {{ auth.loading() ? locale.t('loading') : locale.t('login') }}
            </button>
          </form>

          @if (showDemo) {
            <p class="hint demo-hint">Démo · rutkarf&#64;optimustest.fr · Demo2026!</p>
          }
        </section>

        <section class="auth-card signup-panel" aria-labelledby="profiles-title">
          <header class="auth-header signup-head">
            <p class="panel-kicker">Nouveau sur NIHAO</p>
            <h2 id="profiles-title">Créer un espace</h2>
          </header>

          <div class="profile-field" #profileDropdown>
            <label class="label" id="profile-label" for="profile-trigger">Profil</label>
            <button
              type="button"
              id="profile-trigger"
              class="profile-trigger"
              [class.is-open]="menuOpen()"
              aria-haspopup="listbox"
              [attr.aria-expanded]="menuOpen()"
              aria-controls="profile-menu"
              aria-labelledby="profile-label profile-trigger"
              (click)="toggleMenu()"
              (keydown)="onTriggerKeydown($event)"
            >
              <span class="profile-trigger-copy">
                <span class="profile-trigger-label">{{ selectedRole().label }}</span>
                <span class="profile-trigger-sep" aria-hidden="true">·</span>
                <span class="profile-trigger-short">{{ selectedRole().short }}</span>
              </span>
              <span class="profile-chevron" aria-hidden="true"></span>
            </button>

            @if (menuOpen()) {
              <ul
                id="profile-menu"
                class="profile-menu"
                role="listbox"
                aria-labelledby="profile-label"
                [attr.aria-activedescendant]="'profile-' + selectedRoleId()"
              >
                @for (role of roles; track role.id) {
                  <li role="presentation">
                    <button
                      type="button"
                      class="profile-option"
                      role="option"
                      [id]="'profile-' + role.id"
                      [attr.aria-selected]="selectedRoleId() === role.id"
                      [class.is-selected]="selectedRoleId() === role.id"
                      (click)="selectRole(role.id)"
                    >
                      <span class="profile-option-label">{{ role.label }}</span>
                      <span class="profile-option-sep" aria-hidden="true">·</span>
                      <span class="profile-option-short">{{ role.short }}</span>
                      <span class="profile-check" aria-hidden="true">✓</span>
                    </button>
                  </li>
                }
              </ul>
            }
          </div>

          <aside class="profile-preview" aria-live="polite">
            <header class="offer-head">
              <div class="offer-head-main">
                <h3 class="offer-title">{{ selectedRole().label }}</h3>
                <span class="offer-short">{{ selectedRole().short }}</span>
              </div>
              <div class="offer-chips">
                <span class="plan-chip">Recommandé · {{ selectedRole().recommendedPlan }}</span>
                <span class="meta-pill">HT sauf mention</span>
              </div>
            </header>

            <p class="role-intro">
              {{ selectedRole().blurb }}
              <span class="role-intro-note">
                Plan conseillé <em>{{ selectedRole().recommendedPlan }}</em> · prix indicatifs (devis secteur public & partenaires).
              </span>
            </p>

            <div class="offer-plans">
              @for (plan of selectedRole().plans; track plan.code) {
                <article
                  class="offer-plan"
                  [class.is-featured]="plan.featured"
                  [class.is-active]="selectedPlanCode() === plan.code"
                  tabindex="0"
                  role="button"
                  [attr.aria-pressed]="selectedPlanCode() === plan.code"
                  [attr.aria-label]="'Offre ' + plan.name + ' · ' + plan.priceLabel"
                  (click)="selectPlan(plan.code)"
                  (keydown.enter)="selectPlan(plan.code); $event.preventDefault()"
                  (keydown.space)="selectPlan(plan.code); $event.preventDefault()"
                >
                  <header class="offer-plan-head">
                    @if (plan.featured) {
                      <span class="offer-badge">Recommandé</span>
                    }
                    <h4>{{ plan.name }}</h4>
                    <span class="offer-audience">{{ selectedRole().label }}</span>
                  </header>
                  <p class="offer-price">
                    <span>{{ plan.priceLabel }}</span>
                    <small>{{ plan.priceNote }}</small>
                  </p>
                  <ul class="offer-highlights">
                    @for (line of planHighlights(plan.highlights); track $index) {
                      <li [class.is-slot-empty]="!line">{{ line || ' ' }}</li>
                    }
                  </ul>
                  <button
                    type="button"
                    class="btn offer-plan-cta"
                    [class.btn-primary]="selectedPlanCode() === plan.code"
                    [class.btn-ghost]="selectedPlanCode() !== plan.code"
                    (click)="continueSignup(plan.code); $event.stopPropagation()"
                  >
                    {{ plan.cta }}
                  </button>
                </article>
              }
            </div>

            <div class="offer-modules">
              <p class="offer-section-label">Modules utiles · {{ selectedRole().label }}</p>
              <div class="offer-modules-grid">
                @for (mod of selectedRole().modules; track mod.title) {
                  <article class="offer-tile">
                    <span class="tile-kicker">Module</span>
                    <h4>{{ mod.title }}</h4>
                    <p>{{ mod.text }}</p>
                  </article>
                }
                <article class="offer-tile">
                  <span class="tile-kicker">Parcours</span>
                  <h4>Cas d’usage</h4>
                  <p>
                    Wedges métier (Commercial, Ops, Agents) & adoption.
                    <a routerLink="/use-cases" [queryParams]="{ role: selectedRoleId() }">Ouvrir →</a>
                  </p>
                </article>
              </div>
            </div>

            <footer class="offer-foot">
              <span>
                Secteur « {{ selectedRole().sectorDefault }} » · {{ selectedRole().companyLabel }} ·
                {{ selectedRole().plans.length }} offres
              </span>
              <button type="button" class="offer-foot-link" (click)="continueSignup()">
                Continuer vers l’inscription →
              </button>
            </footer>
          </aside>

          <div class="signup-actions">
            <button type="button" class="btn btn-primary auth-btn" (click)="continueSignup()">
              Créer mon espace {{ selectedRole().label }}
            </button>
          </div>
        </section>
      </div>
    </app-public-site-shell>
  `,
  styles: [
    PUBLIC_AUTH_STYLES,
    `
    .login-split {
      display: grid;
      grid-template-columns: minmax(0, 0.58fr) minmax(0, 1.42fr);
      gap: clamp(0.75rem, 1.8vw, 1.2rem);
      align-items: stretch;
      justify-content: center;
      width: min(1080px, 100%);
      height: 100%;
      margin-inline: auto;
      padding: 0;
    }
    .login-split .signin-panel.auth-card,
    .login-split .signup-panel.auth-card {
      width: 100%;
      max-width: none;
    }
    .signin-panel,
    .signup-panel {
      width: 100%;
      min-height: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }
    .signin-panel {
      align-self: center;
      max-height: 50%;
      height: auto;
      padding: 0.7rem 0.8rem;
      justify-content: flex-start;
      gap: 0.35rem;
      overflow: hidden;
    }
    .signup-panel {
      align-self: stretch;
      max-height: 100%;
      height: 100%;
      padding: 0.55rem 0.75rem 0.6rem;
      gap: 0.38rem;
      isolation: isolate;
    }
    .panel-kicker {
      margin: 0 0 0.15rem;
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--accent-primary);
    }
    .signin-panel .auth-header {
      margin-bottom: 0;
      flex-shrink: 0;
    }
    .signin-panel .auth-header h2 {
      font-size: clamp(1rem, 1.8vw, 1.15rem);
    }
    .signin-panel .auth-header p {
      margin: 0.15rem 0 0;
      font-size: 0.72rem;
    }
    .signin-panel .auth-form {
      flex: 0 0 auto;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .signin-panel .form-group {
      margin-bottom: 0.4rem;
    }
    .signin-panel .auth-btn,
    .signin-panel .btn-oauth {
      min-height: 2rem;
      font-size: 0.8rem;
    }
    .signin-panel .divider {
      margin: 0.4rem 0;
    }
    .demo-hint {
      margin: 0.35rem 0 0;
      flex-shrink: 0;
    }
    .signup-panel .auth-header {
      flex-shrink: 0;
    }
    .signup-head h2 {
      margin: 0;
      font-size: clamp(1rem, 1.8vw, 1.15rem);
    }
    .profile-field {
      position: relative;
      flex-shrink: 0;
      z-index: 5;
    }
    .profile-field .label {
      margin-bottom: 0.25rem;
    }
    .profile-trigger {
      appearance: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.55rem;
      width: 100%;
      min-height: 2.25rem;
      margin: 0;
      padding: 0.35rem 0.7rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      color: var(--text-primary);
      font-family: var(--font-sans);
      text-align: left;
      cursor: pointer;
      transition:
        border-color var(--duration-fast) var(--ease-standard),
        background var(--duration-fast) var(--ease-standard),
        box-shadow var(--duration-fast) var(--ease-standard);
    }
    .profile-trigger:hover {
      border-color: color-mix(in srgb, var(--border-color) 55%, var(--accent-primary));
      background: color-mix(in srgb, var(--bg-elevated) 88%, var(--bg-primary));
    }
    .profile-trigger.is-open,
    .profile-trigger:focus-visible {
      outline: none;
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring);
    }
    .profile-trigger-copy {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 0.4rem;
      min-width: 0;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
    }
    .profile-trigger-label {
      font-family: var(--font-display);
      font-size: 0.88rem;
      font-weight: 700;
      line-height: 1;
      color: var(--text-primary);
      flex-shrink: 0;
    }
    .profile-trigger-sep {
      color: var(--text-muted);
      flex-shrink: 0;
      font-size: 0.75rem;
      line-height: 1;
    }
    .profile-trigger-short {
      font-size: 0.72rem;
      line-height: 1;
      color: var(--text-secondary);
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .profile-chevron {
      flex-shrink: 0;
      width: 0.5rem;
      height: 0.5rem;
      border-right: 2px solid var(--text-muted);
      border-bottom: 2px solid var(--text-muted);
      transform: rotate(45deg) translateY(-2px);
      transition: transform var(--duration-base) var(--ease-standard);
    }
    .profile-trigger.is-open .profile-chevron {
      transform: rotate(225deg) translateY(-1px);
      border-color: var(--accent-primary);
    }
    .profile-menu {
      position: absolute;
      inset-inline: 0;
      top: calc(100% + 0.3rem);
      z-index: 6;
      margin: 0;
      padding: 0.3rem;
      list-style: none;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      box-shadow: var(--shadow-lg);
      display: flex;
      flex-direction: column;
      gap: 0.12rem;
      max-height: min(15rem, 42dvh);
      overflow: auto;
      animation: profile-menu-in var(--duration-base) var(--ease-standard);
    }
    @keyframes profile-menu-in {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .profile-option {
      appearance: none;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 0.4rem;
      width: 100%;
      margin: 0;
      padding: 0.42rem 0.55rem;
      min-height: 2.05rem;
      height: 2.05rem;
      border: 1px solid transparent;
      border-radius: var(--radius-sm);
      background: transparent;
      text-align: left;
      cursor: pointer;
      color: inherit;
      font: inherit;
      font-family: var(--font-sans);
      white-space: nowrap;
      overflow: hidden;
      transition:
        border-color var(--duration-fast) var(--ease-standard),
        background var(--duration-fast) var(--ease-standard);
    }
    .profile-option:hover {
      background: color-mix(in srgb, var(--bg-primary) 55%, transparent);
      border-color: color-mix(in srgb, var(--border-color) 70%, var(--accent-primary));
    }
    .profile-option.is-selected {
      border-color: color-mix(in srgb, var(--accent-primary) 55%, transparent);
      background: color-mix(in srgb, var(--accent-primary) 12%, var(--bg-primary));
    }
    .profile-option:focus-visible {
      outline: 2px solid var(--accent-primary);
      outline-offset: 1px;
    }
    .profile-option-label {
      font-family: var(--font-display);
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1;
      flex-shrink: 0;
    }
    .profile-option-sep {
      color: var(--text-muted);
      font-size: 0.7rem;
      flex-shrink: 0;
      line-height: 1;
    }
    .profile-option-short {
      flex: 1 1 auto;
      min-width: 0;
      font-size: 0.68rem;
      line-height: 1;
      color: var(--text-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .profile-check {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--accent-primary);
      opacity: 0;
      flex-shrink: 0;
      line-height: 1;
      width: 0.85rem;
      text-align: center;
    }
    .profile-option.is-selected .profile-check {
      opacity: 1;
    }
    .profile-preview {
      position: relative;
      z-index: 1;
      flex: 1 1 auto;
      min-height: 0;
      margin: 0;
      padding: 0.42rem 0.5rem;
      border-radius: var(--radius-md);
      border: 1px solid color-mix(in srgb, var(--accent-primary) 28%, var(--border-color));
      background: color-mix(in srgb, var(--bg-elevated) 94%, var(--accent-primary));
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr) auto auto;
      gap: 0.32rem;
      overflow: hidden;
      isolation: isolate;
    }
    .offer-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.45rem;
      min-width: 0;
      min-height: 1.35rem;
    }
    .offer-head-main {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 0.3rem 0.45rem;
      min-width: 0;
    }
    .offer-title {
      margin: 0;
      font-family: var(--font-display);
      font-size: 0.88rem;
      font-weight: 800;
      color: var(--text-primary);
      line-height: 1.1;
    }
    .offer-short {
      font-size: 0.66rem;
      color: var(--text-muted);
      line-height: 1.1;
    }
    .offer-chips {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 0.22rem;
      flex-shrink: 0;
    }
    .plan-chip {
      font-size: 0.54rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 0.12rem 0.38rem;
      border-radius: var(--radius-full);
      color: var(--accent-primary);
      border: 1px solid color-mix(in srgb, var(--accent-primary) 40%, transparent);
      background: color-mix(in srgb, var(--accent-primary) 10%, transparent);
      white-space: nowrap;
    }
    .meta-pill {
      font-size: 0.54rem;
      font-weight: 600;
      padding: 0.1rem 0.34rem;
      border-radius: var(--radius-full);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      background: color-mix(in srgb, var(--bg-primary) 45%, transparent);
      white-space: nowrap;
    }
    .role-intro {
      margin: 0;
      min-height: 2.65rem;
      font-size: 0.64rem;
      line-height: 1.32;
      color: var(--text-secondary);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .role-intro-note {
      display: block;
      margin-top: 0.12rem;
      font-size: 0.6rem;
      color: var(--text-muted);
    }
    .role-intro-note em {
      font-style: normal;
      font-weight: 700;
      color: var(--accent-primary);
    }
    .offer-plans {
      min-height: 0;
      overflow: hidden;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.32rem;
      align-items: stretch;
    }
    .offer-plan {
      position: relative;
      min-height: 0;
      height: 100%;
      overflow: hidden;
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr) auto;
      gap: 0.2rem;
      padding: 0.38rem 0.42rem 0.42rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background: var(--bg-elevated);
      cursor: pointer;
      user-select: none;
      transition:
        border-color var(--duration-base) var(--ease-standard),
        background var(--duration-base) var(--ease-standard),
        box-shadow var(--duration-base) var(--ease-standard),
        transform var(--duration-base) var(--ease-standard);
    }
    .offer-plan::before {
      content: '';
      position: absolute;
      inset-inline: 0;
      top: 0;
      height: 2px;
      border-radius: var(--radius-sm) var(--radius-sm) 0 0;
      background: var(--accent-primary);
      opacity: 0;
      transition: opacity var(--duration-base) var(--ease-standard);
    }
    .offer-plan:hover {
      border-color: color-mix(in srgb, var(--accent-primary) 38%, var(--border-color));
      background: color-mix(in srgb, var(--accent-primary) 4%, var(--bg-elevated));
      box-shadow: 0 3px 12px color-mix(in srgb, var(--accent-primary) 10%, transparent);
      transform: translateY(-1px);
    }
    .offer-plan:hover::before {
      opacity: 0.55;
    }
    .offer-plan:active {
      transform: translateY(0);
      box-shadow: 0 1px 5px color-mix(in srgb, var(--accent-primary) 8%, transparent);
    }
    .offer-plan.is-featured {
      border-color: color-mix(in srgb, var(--accent-primary) 55%, var(--border-color));
      background: color-mix(in srgb, var(--accent-primary) 6%, var(--bg-elevated));
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent-primary) 18%, transparent);
    }
    .offer-plan.is-active {
      border-color: var(--accent-primary);
      background: color-mix(in srgb, var(--accent-primary) 11%, var(--bg-elevated));
      box-shadow:
        0 0 0 1px color-mix(in srgb, var(--accent-primary) 42%, transparent),
        0 5px 16px color-mix(in srgb, var(--accent-primary) 14%, transparent);
      transform: translateY(-1px);
    }
    .offer-plan.is-active::before {
      opacity: 1;
    }
    .offer-plan:focus-visible {
      outline: 2px solid var(--accent-primary);
      outline-offset: 2px;
    }
    .offer-plan.is-active .offer-price span {
      color: var(--accent-primary);
    }
    .offer-plan.is-active .offer-highlights {
      color: var(--text-primary);
    }
    .offer-plan-head {
      position: relative;
      min-height: 2rem;
      padding-top: 0.1rem;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      gap: 0.06rem;
    }
    .offer-badge {
      position: absolute;
      top: 0;
      right: 0;
      font-size: 0.48rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--accent-primary);
      line-height: 1;
    }
    .offer-plan h4 {
      margin: 0;
      padding-right: 0.15rem;
      font-family: var(--font-display);
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.1;
      min-height: 0.8rem;
    }
    .offer-plan.is-featured h4 {
      padding-right: 3.1rem;
    }
    .offer-audience {
      display: block;
      font-size: 0.54rem;
      color: var(--text-muted);
      line-height: 1.1;
      min-height: 0.6rem;
    }
    .offer-price {
      margin: 0;
      min-height: 1.15rem;
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 0.12rem 0.28rem;
    }
    .offer-price span {
      font-size: 0.88rem;
      font-weight: 800;
      line-height: 1;
      color: var(--text-primary);
    }
    .offer-price small {
      font-size: 0.54rem;
      color: var(--text-muted);
    }
    .offer-highlights {
      margin: 0;
      padding-left: 0.75rem;
      font-size: 0.54rem;
      line-height: 1.28;
      color: var(--text-secondary);
      overflow: hidden;
      min-height: calc(0.54rem * 1.28 * 6 + 0.04rem * 5);
      align-self: stretch;
    }
    .offer-highlights li {
      min-height: calc(0.54rem * 1.28);
    }
    .offer-highlights li + li {
      margin-top: 0.04rem;
    }
    .offer-highlights li.is-slot-empty {
      visibility: hidden;
    }
    .offer-plan-cta {
      width: 100%;
      min-height: 1.75rem;
      height: 1.75rem;
      margin-top: auto;
      padding: 0.2rem 0.35rem;
      font-size: 0.58rem;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      align-self: end;
      transition:
        background var(--duration-fast) var(--ease-standard),
        border-color var(--duration-fast) var(--ease-standard),
        color var(--duration-fast) var(--ease-standard);
    }
    .offer-plan:hover .offer-plan-cta.btn-ghost {
      border-color: color-mix(in srgb, var(--accent-primary) 35%, var(--border-strong));
      background: color-mix(in srgb, var(--accent-primary) 6%, var(--bg-elevated));
    }
    .offer-plan-cta.btn-ghost {
      color: var(--text-primary);
      border-color: var(--border-strong);
      background: color-mix(in srgb, var(--bg-elevated) 72%, transparent);
    }
    .offer-modules {
      min-height: 0;
      overflow: hidden;
    }
    .offer-section-label {
      margin: 0 0 0.22rem;
      font-size: 0.54rem;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: var(--accent-primary);
    }
    .offer-modules-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      grid-auto-rows: 1fr;
      gap: 0.28rem;
      min-height: 3.35rem;
    }
    .offer-tile {
      min-width: 0;
      min-height: 3.35rem;
      overflow: hidden;
      padding: 0.28rem 0.34rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      background: var(--bg-elevated);
      display: flex;
      flex-direction: column;
    }
    .tile-kicker {
      display: block;
      margin-bottom: 0.08rem;
      min-height: 0.55rem;
      font-size: 0.48rem;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: var(--accent-primary);
    }
    .offer-tile h4 {
      margin: 0 0 0.08rem;
      font-family: var(--font-display);
      font-size: 0.64rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.1;
      min-height: 0.72rem;
    }
    .offer-tile p {
      margin: 0;
      flex: 1;
      font-size: 0.54rem;
      line-height: 1.28;
      color: var(--text-secondary);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .offer-tile a {
      color: var(--accent-primary);
      font-weight: 600;
      text-decoration: none;
    }
    .offer-tile a:hover {
      text-decoration: underline;
    }
    .offer-foot {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.45rem;
      min-height: 1.35rem;
      padding-top: 0.28rem;
      border-top: 1px solid color-mix(in srgb, var(--border-color) 80%, transparent);
      font-size: 0.56rem;
      color: var(--text-muted);
      min-width: 0;
    }
    .offer-foot span {
      min-width: 0;
      line-height: 1.25;
    }
    .offer-foot-link {
      appearance: none;
      border: 0;
      background: transparent;
      padding: 0;
      font: inherit;
      font-size: 0.58rem;
      font-weight: 700;
      color: var(--accent-primary);
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .offer-foot-link:hover {
      text-decoration: underline;
    }
    .signup-actions {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex-shrink: 0;
      position: relative;
      z-index: 1;
    }
    .signup-actions .auth-btn {
      min-height: 2.1rem;
      font-size: 0.82rem;
    }
    @media (prefers-reduced-motion: reduce) {
      .offer-plan {
        transition: border-color var(--duration-fast) ease, background var(--duration-fast) ease;
      }
      .offer-plan:hover,
      .offer-plan.is-active {
        transform: none;
      }
    }
    @media (max-width: 52rem) {
      .login-split {
        grid-template-columns: 1fr;
        width: min(440px, 100%);
        gap: 0.75rem;
        overflow: auto;
        align-items: stretch;
      }
      .signin-panel {
        align-self: stretch;
        max-height: none;
      }
      .signup-panel {
        max-height: none;
        height: auto;
        overflow: visible;
      }
      .offer-plans {
        grid-template-columns: 1fr 1fr;
      }
      .offer-modules-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
  `,
  ],
})
export class LoginPage implements OnInit {
  readonly auth = inject(AuthService);
  readonly locale = inject(LocaleService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly profileDropdown = viewChild<ElementRef<HTMLElement>>('profileDropdown');
  readonly roles = AUDIENCE_ROLES;
  readonly highlightSlots = MAX_PLAN_HIGHLIGHTS;
  readonly selectedRoleId = signal<AudienceRoleId>('association');
  readonly selectedRole = computed(() => audienceById(this.selectedRoleId()));
  readonly selectedPlanCode = signal('');
  readonly menuOpen = signal(false);
  readonly showDemo = environment.showDemoCredentials;
  readonly oauthEnabled = signal(false);
  readonly showPwd = signal(false);
  email = this.showDemo ? 'rutkarf@optimustest.fr' : '';
  password = this.showDemo ? 'Demo2026!' : '';
  readonly error = signal('');

  ngOnInit(): void {
    document.documentElement.lang = this.locale.locale();
    this.syncSelectedPlan();
    void this.loadOAuthStatus();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen()) return;
    const root = this.profileDropdown()?.nativeElement;
    if (root && !root.contains(event.target as Node)) {
      this.menuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.menuOpen()) this.menuOpen.set(false);
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  selectRole(id: AudienceRoleId): void {
    this.selectedRoleId.set(id);
    this.menuOpen.set(false);
    this.syncSelectedPlan();
  }

  selectPlan(code: string): void {
    this.selectedPlanCode.set(code);
  }

  planHighlights(highlights: string[]): string[] {
    const padded = [...highlights];
    while (padded.length < this.highlightSlots) padded.push('');
    return padded.slice(0, this.highlightSlots);
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.menuOpen.set(true);
    }
  }

  continueSignup(planCode?: string): void {
    const queryParams: Record<string, string> = { role: this.selectedRoleId() };
    const plan = planCode ?? this.selectedPlanCode();
    if (plan) queryParams['plan'] = plan;
    void this.router.navigate(['/register'], { queryParams });
  }

  private syncSelectedPlan(): void {
    const role = this.selectedRole();
    const featured = role.plans.find((p) => p.featured) ?? role.plans[0];
    this.selectedPlanCode.set(featured?.code ?? '');
  }

  loginWithGoogle(): void {
    window.location.href = `${environment.apiUrl}/oauth2/authorization/google`;
  }

  async submit(): Promise<void> {
    this.error.set('');
    if (!this.email.trim() || !this.password) {
      this.error.set('Saisissez votre e-mail et votre mot de passe.');
      return;
    }
    try {
      await this.auth.login({ email: this.email, password: this.password });
    } catch (err) {
      this.error.set(mapHttpError(err, 'Connexion impossible. Réessayez.'));
    }
  }

  private async loadOAuthStatus(): Promise<void> {
    try {
      const status = await firstValueFrom(this.api.getOAuth2Status());
      this.oauthEnabled.set(status.enabled && status.providers.includes('google'));
    } catch {
      this.oauthEnabled.set(false);
    }
  }
}
