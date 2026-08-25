import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiService } from '../../../core/api/api.service';
import { mapHttpError } from '../../../core/api/http-error.util';
import { LocaleService } from '../../../core/i18n/locale.service';
import { environment } from '../../../../environments/environment';
import { AUTH_LAYOUT_STYLES } from '../auth-layout.styles';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="login-page">
      <div class="atmosphere" aria-hidden="true"></div>
      <div class="login-layout">
        <section class="brand-panel">
          <p class="eyebrow">SaaS B2B · Agents IA · Validation humaine</p>
          <h1 class="brand-type">NIHAO</h1>
          <p class="acronym">Network Intelligence Hub Access Open</p>
          <p class="pitch">
            Le hub ERP/CRM multi-tenant où les agents IA préparent, et le CEO valide.
          </p>
        </section>

        <section class="login-card" aria-labelledby="login-title">
          <header class="login-header">
            <h2 id="login-title">{{ locale.t('login') }}</h2>
            <p>Espace professionnel — identifiants sécurisés</p>
          </header>
          @if (oauthEnabled()) {
            <button type="button" class="btn btn-oauth" (click)="loginWithGoogle()">
              Continuer avec Google
            </button>
            <p class="divider"><span>ou</span></p>
          }
          <form (ngSubmit)="submit()" class="login-form" novalidate>
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
                <button type="button" class="btn btn-ghost btn-sm toggle-pwd" (click)="showPwd.update(v => !v)">
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
              class="btn btn-primary login-btn"
              [class.is-loading]="auth.loading()"
              [disabled]="auth.loading() || !email.trim() || !password"
            >
              {{ auth.loading() ? locale.t('loading') : locale.t('login') }}
            </button>
          </form>
          <p class="demo-hint">
            @if (showDemo) {
              Démo · rutkarf&#64;optimustest.fr · Demo2026!
              ·
            }
            <a routerLink="/register">Créer un espace pro</a>
            · <a routerLink="/privacy">Confidentialité</a>
            · <a routerLink="/terms">CGU</a>
          </p>
        </section>
      </div>
    </div>
  `,
  styles: [
    AUTH_LAYOUT_STYLES,
    `
    .pwd-row { display: flex; gap: var(--space-2); align-items: stretch; }
    .pwd-row .input { flex: 1; }
    .toggle-pwd { flex-shrink: 0; align-self: center; }
  `,
  ],
})
export class LoginPage implements OnInit {
  readonly auth = inject(AuthService);
  readonly locale = inject(LocaleService);
  private readonly api = inject(ApiService);
  readonly showDemo = environment.showDemoCredentials;
  readonly oauthEnabled = signal(false);
  readonly showPwd = signal(false);
  email = this.showDemo ? 'rutkarf@optimustest.fr' : '';
  password = this.showDemo ? 'Demo2026!' : '';
  readonly error = signal('');

  ngOnInit(): void {
    document.documentElement.lang = this.locale.locale();
    void this.loadOAuthStatus();
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
