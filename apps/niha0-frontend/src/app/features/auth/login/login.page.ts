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
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiService } from '../../../core/api/api.service';
import { mapHttpError } from '../../../core/api/http-error.util';
import { LocaleService } from '../../../core/i18n/locale.service';
import { environment } from '../../../../environments/environment';
import { PublicSiteShellComponent } from '../../marketing-site/public-site-shell.component';
import { PUBLIC_AUTH_STYLES } from '../../marketing-site/public-content.styles';
import { OAuthProviderIconComponent } from '../oauth-provider-icon.component';
import { OAUTH_PROVIDERS, OAuthProviderDef, OAuthProviderId } from '../oauth-providers';
import {
  AUDIENCE_ROLES,
  AudienceRoleId,
  audienceById,
  isAudienceRoleId,
  MAX_PLAN_HIGHLIGHTS,
} from '../../marketing-site/audience-roles';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink, PublicSiteShellComponent, OAuthProviderIconComponent],
  template: `
    <app-public-site-shell pageTitle="Connexion" [continueSignupParams]="continueSignupParams()">
      <div class="auth-wrap login-split">
        <section class="auth-card signin-panel" aria-labelledby="login-title">
          <header class="auth-header">
            <p class="panel-kicker">Déjà un compte</p>
            <h2 id="login-title">{{ locale.t('login') }}</h2>
            <p>Accédez à votre espace NIHAO</p>
          </header>

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
            <div class="oauth-row" role="group" aria-label="Connexion avec un compte externe">
              @for (provider of oauthProviders; track provider.id) {
                <button
                  type="button"
                  class="oauth-provider-btn"
                  [class.is-ready]="isOAuthProviderEnabled(provider.id)"
                  [disabled]="!isOAuthProviderEnabled(provider.id)"
                  [attr.title]="oauthProviderTitle(provider)"
                  [attr.aria-label]="'Continuer avec ' + provider.label"
                  (click)="loginWithOAuth(provider.id)"
                >
                  <app-oauth-provider-icon [providerId]="provider.id" />
                </button>
              }
            </div>
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
            <p class="signup-welcome">Bienvenue sur Niha0</p>
            <h2 id="profiles-title">Créer un espace</h2>
          </header>

          <div class="profile-field" #profileDropdown>
            <label class="label profile-label" id="profile-label" for="profile-trigger">Profil :</label>
            <div class="profile-control">
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
          </div>

          <aside class="profile-preview" aria-live="polite">
            <header class="offer-head">
              <div class="offer-head-main">
                <h3 class="offer-title">{{ selectedRole().label }}</h3>
                <span class="offer-short">{{ selectedRole().short }}</span>
              </div>
              <div class="offer-head-meta">
                <span class="offer-price-note">Les prix affichés sont indicatifs</span>
                <span class="meta-pill offer-meta-ht">HT sauf mention</span>
              </div>
            </header>

            <p class="role-intro-blurb">{{ selectedRole().blurb }}</p>

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
              <h3 class="offer-section-title">Modules utiles pour {{ selectedRole().label }}</h3>
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
                    Voir les wedges métier (Commercial, Ops, Agents) et le chemin d’adoption.
                    <a routerLink="/use-cases" [queryParams]="{ role: selectedRoleId() }">Ouvrir →</a>
                  </p>
                </article>
              </div>
            </div>

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
    .login-split .signin-panel.auth-card {
      max-height: min(26rem, 68vh);
      overflow-x: hidden;
      overflow-y: auto;
    }
    .login-split .signup-panel.auth-card {
      border-color: color-mix(in srgb, var(--border-color) 72%, var(--accent-primary));
      box-shadow:
        var(--shadow-lg),
        0 10px 32px color-mix(in srgb, var(--bg-primary) 48%, transparent);
    }
    .signin-panel,
    .signup-panel {
      width: 100%;
      min-height: 0;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }
    .signup-panel {
      overflow: hidden;
      align-self: stretch;
      max-height: 100%;
      height: 100%;
      padding: clamp(0.78rem, 1.7vh, 1rem) clamp(0.88rem, 1.9vw, 1.15rem)
        clamp(0.75rem, 1.5vh, 0.95rem);
      gap: clamp(0.55rem, 1.3vh, 0.75rem);
      isolation: isolate;
    }
    .signin-panel {
      align-self: center;
      max-height: min(26rem, 68vh);
      height: auto;
      padding: 0.55rem 0.75rem 0.7rem;
      justify-content: flex-start;
      gap: 0.28rem;
      overflow-x: hidden;
      overflow-y: auto;
      flex-shrink: 0;
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
      margin-bottom: 0.32rem;
    }
    .signin-panel .auth-btn {
      min-height: 2rem;
      font-size: 0.8rem;
      margin-top: 0.08rem;
      flex-shrink: 0;
    }
    .oauth-row {
      display: flex;
      flex-wrap: nowrap;
      align-items: stretch;
      justify-content: space-between;
      gap: 0.24rem;
      margin: 0.2rem 0 0.32rem;
    }
    .oauth-provider-btn {
      appearance: none;
      flex: 1 1 0;
      min-width: 0;
      max-width: 2.15rem;
      aspect-ratio: 1;
      margin: 0;
      padding: 0.28rem;
      border: 1px solid #dadce0;
      border-radius: var(--radius-sm);
      background: #ffffff;
      color: #202124;
      cursor: pointer;
      box-shadow: 0 1px 3px rgb(60 64 67 / 18%);
      transition:
        border-color var(--duration-fast) var(--ease-standard),
        background var(--duration-fast) var(--ease-standard),
        box-shadow var(--duration-fast) var(--ease-standard),
        transform var(--duration-fast) var(--ease-standard),
        opacity var(--duration-fast) var(--ease-standard);
    }
    .oauth-provider-btn:has(.brand-logo) {
      padding-inline: 0.14rem;
      padding-block: 0.32rem;
    }
    .oauth-provider-btn.is-ready:hover {
      border-color: #c6c6c6;
      background: #f8f9fa;
      box-shadow: 0 2px 6px rgb(60 64 67 / 22%);
      transform: translateY(-1px);
    }
    .oauth-provider-btn:disabled {
      opacity: 0.42;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    .signin-panel .divider {
      margin: 0.4rem 0;
    }
    .demo-hint {
      margin: 0.35rem 0 0;
      flex-shrink: 0;
    }
    .signin-panel .demo-hint {
      margin-bottom: 0.05rem;
    }
    .signup-panel .auth-header {
      flex-shrink: 0;
    }
    .signup-head {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      grid-template-rows: auto;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
    }
    .signup-welcome {
      margin: 0;
      grid-column: 1;
      grid-row: 1;
      justify-self: start;
      font-size: 0.74rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      background: linear-gradient(
        90deg,
        var(--text-secondary) 0%,
        color-mix(in srgb, var(--accent-primary) 55%, var(--text-primary)) 100%
      );
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .signup-head h2 {
      margin: 0;
      grid-column: 2;
      grid-row: 1;
      text-align: center;
      font-size: clamp(1.05rem, 1.9vw, 1.22rem);
      letter-spacing: 0.015em;
      text-shadow: 0 1px 18px color-mix(in srgb, var(--accent-primary) 22%, transparent);
    }
    .profile-field {
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: center;
      gap: 0.4rem 0.75rem;
      flex-shrink: 0;
      z-index: 5;
      padding: 0.15rem 0.05rem 0.05rem;
    }
    .profile-label {
      margin: 0;
      white-space: nowrap;
      font-size: 0.74rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--text-muted);
    }
    .profile-control {
      position: relative;
      min-width: 0;
    }
    .profile-trigger {
      appearance: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.55rem;
      width: 100%;
      min-height: 2.45rem;
      margin: 0;
      padding: 0.42rem 0.78rem;
      border: 1px solid color-mix(in srgb, var(--border-color) 82%, var(--accent-primary));
      border-radius: var(--radius-md);
      background: linear-gradient(
        180deg,
        color-mix(in srgb, var(--bg-elevated) 96%, var(--accent-primary)) 0%,
        var(--bg-elevated) 100%
      );
      color: var(--text-primary);
      font-family: var(--font-sans);
      text-align: left;
      cursor: pointer;
      box-shadow:
        0 1px 0 color-mix(in srgb, var(--text-primary) 6%, transparent),
        0 4px 14px color-mix(in srgb, var(--bg-primary) 55%, transparent);
      transition:
        border-color var(--duration-fast) var(--ease-standard),
        background var(--duration-fast) var(--ease-standard),
        box-shadow var(--duration-fast) var(--ease-standard),
        transform var(--duration-fast) var(--ease-standard);
    }
    .profile-trigger:hover {
      border-color: color-mix(in srgb, var(--border-color) 35%, var(--accent-primary));
      background: color-mix(in srgb, var(--bg-elevated) 84%, var(--accent-primary));
      box-shadow:
        0 1px 0 color-mix(in srgb, var(--text-primary) 8%, transparent),
        0 6px 18px color-mix(in srgb, var(--accent-primary) 10%, transparent);
      transform: translateY(-1px);
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
      top: calc(100% + 0.35rem);
      z-index: 6;
      margin: 0;
      padding: 0.38rem;
      list-style: none;
      border: 1px solid color-mix(in srgb, var(--border-color) 70%, var(--accent-primary));
      border-radius: var(--radius-md);
      background: color-mix(in srgb, var(--bg-elevated) 94%, var(--bg-primary));
      backdrop-filter: blur(14px);
      box-shadow:
        var(--shadow-lg),
        0 12px 28px color-mix(in srgb, var(--bg-primary) 65%, transparent);
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
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
      padding: clamp(0.58rem, 1.3vh, 0.72rem) clamp(0.62rem, 1.5vw, 0.82rem)
        clamp(0.55rem, 1.1vh, 0.68rem);
      border-radius: calc(var(--radius-md) + 2px);
      border: 1px solid color-mix(in srgb, var(--accent-primary) 32%, var(--border-color));
      background:
        radial-gradient(
          120% 80% at 50% -20%,
          color-mix(in srgb, var(--accent-primary) 14%, transparent) 0%,
          transparent 55%
        ),
        color-mix(in srgb, var(--bg-elevated) 92%, var(--accent-primary));
      box-shadow:
        inset 0 1px 0 color-mix(in srgb, var(--text-primary) 7%, transparent),
        0 8px 24px color-mix(in srgb, var(--bg-primary) 50%, transparent);
      backdrop-filter: blur(10px);
      display: grid;
      grid-template-rows: auto auto minmax(0, 1.85fr) auto;
      gap: clamp(0.38rem, 1.15vh, 0.55rem);
      overflow: hidden;
      isolation: isolate;
    }
    .profile-preview::before {
      content: '';
      position: absolute;
      inset-inline: 0.65rem;
      top: 0;
      height: 1px;
      border-radius: 999px;
      background: linear-gradient(
        90deg,
        transparent 0%,
        color-mix(in srgb, var(--accent-primary) 65%, transparent) 50%,
        transparent 100%
      );
      pointer-events: none;
    }
    .offer-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.55rem;
      min-width: 0;
      min-height: 1.45rem;
      padding-bottom: 0.08rem;
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
    .offer-meta-ht {
      flex-shrink: 0;
    }
    .offer-head-meta {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.38rem;
      flex-shrink: 0;
      margin-left: auto;
      min-width: 0;
    }
    .offer-price-note {
      font-size: 0.58rem;
      line-height: 1.2;
      color: var(--text-muted);
      font-style: italic;
      white-space: nowrap;
    }
    .meta-pill {
      font-size: 0.54rem;
      font-weight: 600;
      padding: 0.14rem 0.42rem;
      border-radius: var(--radius-full);
      border: 1px solid color-mix(in srgb, var(--border-color) 75%, var(--accent-primary));
      color: var(--text-secondary);
      background: color-mix(in srgb, var(--bg-primary) 38%, var(--bg-elevated));
      white-space: nowrap;
      box-shadow: inset 0 1px 0 color-mix(in srgb, var(--text-primary) 5%, transparent);
    }
    .role-intro-blurb {
      margin: 0;
      padding-inline: clamp(0.25rem, 2vw, 1.25rem);
      font-size: clamp(0.62rem, 1.05vw, 0.68rem);
      line-height: 1.45;
      color: color-mix(in srgb, var(--text-muted) 88%, var(--text-secondary));
      text-align: center;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .offer-plans {
      min-height: 0;
      overflow: hidden;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: clamp(0.35rem, 1vw, 0.52rem);
      align-items: stretch;
      align-self: stretch;
      padding-block: 0.08rem;
    }
    .offer-plan {
      position: relative;
      min-height: 0;
      height: 100%;
      overflow: hidden;
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr) auto;
      gap: 0.22rem;
      padding: 0.42rem 0.44rem 0.44rem;
      border: 1px solid color-mix(in srgb, var(--border-color) 88%, var(--accent-primary));
      border-radius: calc(var(--radius-sm) + 1px);
      background: linear-gradient(
        180deg,
        color-mix(in srgb, var(--bg-elevated) 98%, var(--accent-primary)) 0%,
        var(--bg-elevated) 100%
      );
      cursor: pointer;
      user-select: none;
      box-shadow: 0 2px 8px color-mix(in srgb, var(--bg-primary) 45%, transparent);
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
      border-color: color-mix(in srgb, var(--accent-primary) 58%, var(--border-color));
      background: linear-gradient(
        180deg,
        color-mix(in srgb, var(--accent-primary) 10%, var(--bg-elevated)) 0%,
        color-mix(in srgb, var(--accent-primary) 4%, var(--bg-elevated)) 100%
      );
      box-shadow:
        0 0 0 1px color-mix(in srgb, var(--accent-primary) 20%, transparent),
        0 6px 20px color-mix(in srgb, var(--accent-primary) 12%, transparent);
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
      min-height: 0;
      padding-top: 0.08rem;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      gap: 0.04rem;
      flex-shrink: 0;
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
    }
    .offer-plan.is-featured .offer-plan-head {
      min-height: 1.35rem;
    }
    .offer-plan.is-featured h4 {
      padding-right: 3.1rem;
    }
    .offer-audience {
      display: block;
      font-size: 0.54rem;
      color: var(--text-muted);
      line-height: 1.1;
    }
    .offer-price {
      margin: 0;
      flex-shrink: 0;
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
      padding-left: 0.85rem;
      font-size: 0.56rem;
      line-height: 1.32;
      color: var(--text-secondary);
      overflow: hidden;
      min-height: 0;
      align-self: stretch;
    }
    .offer-highlights li {
      min-height: 0;
    }
    .offer-highlights li + li {
      margin-top: 0.05rem;
    }
    .offer-highlights li.is-slot-empty {
      visibility: hidden;
    }
    .offer-plan-cta {
      width: 100%;
      min-height: 1.75rem;
      height: 1.75rem;
      margin-top: 0;
      padding: 0.22rem 0.38rem;
      font-size: 0.58rem;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      align-self: end;
      flex-shrink: 0;
      border-radius: calc(var(--radius-sm) - 1px);
      transition:
        background var(--duration-fast) var(--ease-standard),
        border-color var(--duration-fast) var(--ease-standard),
        color var(--duration-fast) var(--ease-standard),
        box-shadow var(--duration-fast) var(--ease-standard),
        transform var(--duration-fast) var(--ease-standard);
    }
    .offer-plan:hover .offer-plan-cta.btn-primary,
    .offer-plan.is-active .offer-plan-cta.btn-primary {
      box-shadow: 0 4px 14px color-mix(in srgb, var(--accent-primary) 28%, transparent);
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
      display: flex;
      flex-direction: column;
      gap: 0.26rem;
      flex-shrink: 0;
      align-self: stretch;
      padding-top: 0.2rem;
    }
    .offer-section-title {
      margin: 0;
      padding: 0.1rem 0.25rem 0.12rem;
      font-family: var(--font-display);
      font-size: 0.66rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.15;
      letter-spacing: 0.01em;
      text-align: center;
    }
    .offer-modules-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      grid-auto-rows: auto;
      gap: 0.3rem;
      min-height: 0;
      padding: 0.14rem 0.1rem 0.1rem;
    }
    .offer-tile {
      min-width: 0;
      min-height: 0;
      overflow: hidden;
      padding: 0.3rem 0.34rem 0.32rem;
      margin: 0.04rem;
      border-radius: calc(var(--radius-sm) + 1px);
      border: 1px solid color-mix(in srgb, var(--border-color) 88%, var(--accent-primary));
      background: linear-gradient(
        165deg,
        color-mix(in srgb, var(--bg-elevated) 96%, var(--accent-primary)) 0%,
        var(--bg-elevated) 100%
      );
      display: flex;
      flex-direction: column;
      box-shadow: 0 2px 8px color-mix(in srgb, var(--bg-primary) 42%, transparent);
      transition:
        border-color var(--duration-fast) var(--ease-standard),
        background var(--duration-fast) var(--ease-standard),
        box-shadow var(--duration-fast) var(--ease-standard),
        transform var(--duration-fast) var(--ease-standard);
    }
    .offer-tile:hover {
      border-color: color-mix(in srgb, var(--accent-primary) 35%, var(--border-color));
      background: color-mix(in srgb, var(--accent-primary) 5%, var(--bg-elevated));
      box-shadow: 0 5px 16px color-mix(in srgb, var(--accent-primary) 10%, transparent);
      transform: translateY(-1px);
    }
    .tile-kicker {
      display: block;
      margin-bottom: 0.04rem;
      font-size: 0.46rem;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: var(--accent-primary);
      line-height: 1.1;
    }
    .offer-tile h4 {
      margin: 0 0 0.04rem;
      font-family: var(--font-display);
      font-size: 0.62rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.1;
    }
    .offer-tile p {
      margin: 0;
      font-size: 0.52rem;
      line-height: 1.24;
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
    .signup-actions {
      display: flex;
      flex-direction: column;
      gap: 0.28rem;
      flex-shrink: 0;
      position: relative;
      z-index: 1;
      padding-top: 0.18rem;
    }
    .signup-actions .auth-btn {
      min-height: 2.25rem;
      font-size: 0.84rem;
      font-weight: 700;
      letter-spacing: 0.01em;
      box-shadow:
        0 1px 0 color-mix(in srgb, var(--text-primary) 10%, transparent),
        0 8px 22px color-mix(in srgb, var(--accent-primary) 26%, transparent);
      transition:
        transform var(--duration-fast) var(--ease-standard),
        box-shadow var(--duration-fast) var(--ease-standard),
        filter var(--duration-fast) var(--ease-standard);
    }
    .signup-actions .auth-btn:hover {
      transform: translateY(-1px);
      box-shadow:
        0 1px 0 color-mix(in srgb, var(--text-primary) 12%, transparent),
        0 12px 28px color-mix(in srgb, var(--accent-primary) 34%, transparent);
      filter: brightness(1.04);
    }
    .signup-actions .auth-btn:active {
      transform: translateY(0);
      box-shadow: 0 4px 14px color-mix(in srgb, var(--accent-primary) 22%, transparent);
    }
    @media (prefers-reduced-motion: reduce) {
      .offer-plan,
      .offer-tile,
      .profile-trigger,
      .oauth-provider-btn,
      .signup-actions .auth-btn {
        transition: border-color var(--duration-fast) ease, background var(--duration-fast) ease;
      }
      .offer-plan:hover,
      .offer-plan.is-active,
      .offer-tile:hover,
      .profile-trigger:hover,
      .oauth-provider-btn.is-ready:hover,
      .signup-actions .auth-btn:hover {
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
  private readonly route = inject(ActivatedRoute);
  private readonly profileDropdown = viewChild<ElementRef<HTMLElement>>('profileDropdown');
  readonly roles = AUDIENCE_ROLES;
  readonly highlightSlots = MAX_PLAN_HIGHLIGHTS;
  readonly oauthProviders = OAUTH_PROVIDERS;
  readonly selectedRoleId = signal<AudienceRoleId>('association');
  readonly selectedRole = computed(() => audienceById(this.selectedRoleId()));
  readonly selectedPlanCode = signal('');
  readonly continueSignupParams = computed(() => {
    const params: Record<string, string> = { role: this.selectedRoleId() };
    const plan = this.selectedPlanCode();
    if (plan) params['plan'] = plan;
    return params;
  });
  readonly menuOpen = signal(false);
  readonly oauthEnabledProviders = signal<ReadonlySet<string>>(new Set());
  readonly oauthDemoMode = signal(false);
  readonly showDemo = environment.showDemoCredentials;
  readonly showPwd = signal(false);
  email = this.showDemo ? 'rutkarf@optimustest.fr' : '';
  password = this.showDemo ? 'Demo2026!' : '';
  readonly error = signal('');

  ngOnInit(): void {
    document.documentElement.lang = this.locale.locale();
    const roleParam = this.route.snapshot.queryParamMap.get('role');
    const planParam = this.route.snapshot.queryParamMap.get('plan');
    if (isAudienceRoleId(roleParam)) {
      this.selectedRoleId.set(roleParam);
    }
    this.syncSelectedPlan();
    if (planParam && this.selectedRole().plans.some((p) => p.code === planParam)) {
      this.selectedPlanCode.set(planParam);
    }
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

  loginWithOAuth(providerId: OAuthProviderId): void {
    if (!this.isOAuthProviderEnabled(providerId)) {
      return;
    }
    const path = this.oauthDemoMode()
      ? `/auth/oauth2/demo/${providerId}`
      : `/oauth2/authorization/${providerId}`;
    window.location.href = `${environment.apiUrl}${path}`;
  }

  isOAuthProviderEnabled(providerId: OAuthProviderId): boolean {
    return this.oauthEnabledProviders().has(providerId);
  }

  oauthProviderTitle(provider: { id: OAuthProviderId; label: string }): string {
    if (this.oauthDemoMode()) {
      return `Continuer avec ${provider.label} (démo)`;
    }
    if (this.isOAuthProviderEnabled(provider.id)) {
      return `Continuer avec ${provider.label}`;
    }
    return `${provider.label} — configurez ${provider.id.toUpperCase()}_CLIENT_ID et ${provider.id.toUpperCase()}_CLIENT_SECRET`;
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
      this.oauthDemoMode.set(status.demoMode);
      this.oauthEnabledProviders.set(
        new Set(status.enabled ? status.providers : []),
      );
    } catch {
      if (this.showDemo) {
        this.oauthDemoMode.set(true);
        this.oauthEnabledProviders.set(new Set(this.oauthProviders.map((p: OAuthProviderDef) => p.id)));
      } else {
        this.oauthDemoMode.set(false);
        this.oauthEnabledProviders.set(new Set());
      }
    }
  }
}
