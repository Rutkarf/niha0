import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService, MFA_TOKEN_KEY } from '../../../core/auth/auth.service';
import { ApiService } from '../../../core/api/api.service';
import { mapHttpError } from '../../../core/api/http-error.util';
import { LocaleService } from '../../../core/i18n/locale.service';

@Component({
  selector: 'app-mfa-page',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="login-page">
      <div class="atmosphere" aria-hidden="true"></div>
      <section class="login-card">
        <header class="login-header">
          <h2>Vérification MFA</h2>
          <p>Saisissez le code de votre application d'authentification.</p>
        </header>
        <form (ngSubmit)="submit()" class="login-form">
          @if (!useRecovery()) {
            <div class="form-group">
              <label class="label" for="code">Code à 6 chiffres</label>
              <input
                id="code"
                class="input"
                inputmode="numeric"
                autocomplete="one-time-code"
                [(ngModel)]="code"
                name="code"
                maxlength="6"
                pattern="[0-9]{6}"
                required
              />
            </div>
            <p class="hint-row">
              <button type="button" class="link-btn" (click)="useRecovery.set(true)">
                Utiliser un code de récupération
              </button>
            </p>
          } @else {
            <div class="form-group">
              <label class="label" for="recovery">Code de récupération</label>
              <input
                id="recovery"
                class="input"
                [(ngModel)]="recoveryCode"
                name="recoveryCode"
                autocomplete="off"
                required
              />
            </div>
            <p class="hint-row">
              <button type="button" class="link-btn" (click)="useRecovery.set(false)">
                Utiliser le code TOTP
              </button>
            </p>
          }
          @if (error()) {
            <p class="error" role="alert">{{ error() }}</p>
          }
          <button type="submit" class="btn btn-primary login-btn" [disabled]="loading()">
            {{ loading() ? locale.t('loading') : 'Valider' }}
          </button>
        </form>
        <p class="footer-row"><a routerLink="/login">Retour connexion</a></p>
      </section>
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
    }
    .login-card {
      position: relative;
      z-index: 1;
      width: min(420px, 100%);
      background: color-mix(in srgb, var(--bg-elevated) 92%, transparent);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      padding: 1.85rem 1.75rem;
      box-shadow: var(--shadow-lg);
    }
    .login-header h2 { margin: 0; font-size: 1.25rem; font-weight: 700; }
    .login-header p { margin: 0.35rem 0 1.35rem; font-size: 0.85rem; color: var(--text-muted); }
    .login-btn { width: 100%; margin-top: 0.35rem; min-height: 2.6rem; }
    .error { color: var(--accent-danger); font-size: 0.85rem; margin: 0 0 0.65rem; }
    .hint-row, .footer-row { margin: 0.75rem 0 0; font-size: 0.78rem; text-align: center; color: var(--text-muted); }
    .link-btn {
      background: none;
      border: none;
      padding: 0;
      color: var(--accent-primary);
      cursor: pointer;
      font-size: inherit;
      text-decoration: underline;
    }
  `],
})
export class MfaPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  readonly locale = inject(LocaleService);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly useRecovery = signal(false);

  code = '';
  recoveryCode = '';
  private mfaToken = '';

  ngOnInit(): void {
    this.mfaToken = sessionStorage.getItem(MFA_TOKEN_KEY) ?? '';
    if (!this.mfaToken) {
      this.error.set('Session MFA expirée. Reconnectez-vous.');
    }
  }

  async submit(): Promise<void> {
    if (!this.mfaToken) return;
    this.loading.set(true);
    this.error.set('');
    try {
      const tokens = await firstValueFrom(
        this.api.verifyMfa({
          mfaToken: this.mfaToken,
          code: this.useRecovery() ? '' : this.code.trim(),
          recoveryCode: this.useRecovery() ? this.recoveryCode.trim() : undefined,
        }),
      );
      sessionStorage.removeItem(MFA_TOKEN_KEY);
      await this.auth.applySession(tokens);
    } catch (err) {
      this.error.set(mapHttpError(err, 'Code invalide. Réessayez.'));
    } finally {
      this.loading.set(false);
    }
  }
}
