import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiService } from '../../../core/api/api.service';
import { mapHttpError } from '../../../core/api/http-error.util';
import { LocaleService } from '../../../core/i18n/locale.service';
import { environment } from '../../../../environments/environment';

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

        <section class="login-card">
          <header class="login-header">
            <h2>{{ locale.t('login') }}</h2>
            <p>Espace professionnel</p>
          </header>
          @if (oauthEnabled()) {
            <button type="button" class="btn btn-oauth" (click)="loginWithGoogle()">
              Continuer avec Google
            </button>
            <p class="divider"><span>ou</span></p>
          }
          <form (ngSubmit)="submit()" class="login-form">
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
              />
            </div>
            <div class="form-group">
              <label class="label" for="password">{{ locale.t('password') }}</label>
              <input
                id="password"
                class="input"
                type="password"
                [(ngModel)]="password"
                name="password"
                required
                autocomplete="current-password"
              />
            </div>
            <p class="forgot-row">
              <a routerLink="/forgot-password">{{ locale.t('forgotPassword') }}</a>
            </p>
            @if (error()) {
              <p class="error" role="alert">{{ error() }}</p>
            }
            <button type="submit" class="btn btn-primary login-btn" [disabled]="auth.loading()">
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
  styles: [`
    .login-page {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 1.5rem;
      position: relative;
      overflow: hidden;
      background: var(--gradient-page);
    }
    .atmosphere {
      position: absolute;
      inset: -20%;
      background:
        radial-gradient(circle at 20% 30%, color-mix(in srgb, var(--accent-primary) 18%, transparent), transparent 42%),
        radial-gradient(circle at 80% 70%, color-mix(in srgb, var(--accent-secondary) 14%, transparent), transparent 40%);
      pointer-events: none;
      animation: drift 18s ease-in-out infinite alternate;
    }
    .login-layout {
      position: relative;
      z-index: 1;
      width: min(920px, 100%);
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 1.5rem;
      align-items: stretch;
    }
    .brand-panel {
      padding: 2.25rem 1.5rem 2.25rem 0.5rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .eyebrow {
      margin: 0 0 0.85rem;
      font-size: var(--fs-sm);
      font-weight: var(--fw-bold);
      letter-spacing: var(--tracking-label);
      text-transform: uppercase;
      color: var(--text-muted);
    }
    h1 {
      margin: 0;
      font-size: clamp(var(--fs-3xl), 2rem + 3vw, var(--fs-4xl));
      font-weight: var(--fw-extrabold);
      letter-spacing: 0.08em;
      color: var(--text-primary);
      line-height: var(--lh-tight);
    }
    .acronym {
      margin: 0.65rem 0 1.1rem;
      font-size: var(--fs-md);
      color: var(--accent-primary);
      font-weight: var(--fw-semibold);
    }
    .pitch {
      margin: 0;
      max-width: 28rem;
      color: var(--text-secondary);
      font-size: var(--fs-base);
      line-height: var(--lh-normal);
    }
    .login-card {
      background: color-mix(in srgb, var(--bg-elevated) 92%, transparent);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      padding: 1.85rem 1.75rem;
      box-shadow: var(--shadow-lg);
      backdrop-filter: blur(10px);
      align-self: center;
    }
    .login-header h2 {
      margin: 0;
      font-size: var(--fs-xl);
      font-weight: var(--fw-bold);
      font-family: var(--font-display);
      letter-spacing: var(--tracking-tight);
    }
    .login-header p {
      margin: 0.35rem 0 1.35rem;
      font-size: var(--fs-md);
      color: var(--text-muted);
    }
    .btn-oauth {
      width: 100%;
      min-height: 2.6rem;
      border: 1px solid var(--border-color);
      background: var(--bg-elevated);
      color: var(--text-primary);
      font-weight: 600;
    }
    .divider {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 1rem 0;
      color: var(--text-muted);
      font-size: 0.75rem;
    }
    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border-color);
    }
    .login-btn { width: 100%; margin-top: 0.35rem; min-height: 2.6rem; }
    .forgot-row { margin: 0 0 0.65rem; text-align: right; font-size: 0.78rem; }
    .error {
      color: var(--accent-danger);
      font-size: 0.85rem;
      margin: 0 0 0.65rem;
    }
    .demo-hint {
      margin: 1.35rem 0 0;
      font-size: 0.72rem;
      color: var(--text-muted);
      text-align: center;
      font-family: var(--font-mono);
    }
    @keyframes drift {
      from { transform: translate3d(0, 0, 0) scale(1); }
      to { transform: translate3d(2%, -1.5%, 0) scale(1.04); }
    }
    @media (max-width: 800px) {
      .login-layout { grid-template-columns: 1fr; gap: 1rem; }
      .brand-panel { padding: 0.5rem 0 0.25rem; text-align: center; align-items: center; }
      .pitch { margin-inline: auto; }
    }
    @media (prefers-reduced-motion: reduce) {
      .atmosphere { animation: none; }
    }
  `],
})
export class LoginPage implements OnInit {
  readonly auth = inject(AuthService);
  readonly locale = inject(LocaleService);
  private readonly api = inject(ApiService);
  readonly showDemo = environment.showDemoCredentials;
  readonly oauthEnabled = signal(false);
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
