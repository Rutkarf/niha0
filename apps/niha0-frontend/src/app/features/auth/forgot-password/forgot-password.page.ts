import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/api/api.service';
import { mapHttpError } from '../../../core/api/http-error.util';
import { LocaleService } from '../../../core/i18n/locale.service';

@Component({
  selector: 'app-forgot-password-page',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <section class="auth-card card">
        <h1>Mot de passe oublié</h1>
        <p class="sub">Recevez un lien de réinitialisation par email.</p>
        @if (!sent()) {
          <form (ngSubmit)="submit()">
            <label class="label">
              {{ locale.t('email') }}
              <input class="input" type="email" [(ngModel)]="email" name="email" required />
            </label>
            @if (error()) {
              <p class="error" role="alert">{{ error() }}</p>
            }
            <button type="submit" class="btn btn-primary" [disabled]="loading()">
              {{ loading() ? locale.t('loading') : 'Envoyer le lien' }}
            </button>
          </form>
        } @else {
          <p class="ok" role="status">
            Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.
          </p>
        }
        <p class="links">
          <a routerLink="/login">← {{ locale.t('login') }}</a>
        </p>
      </section>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: grid; place-items: center; padding: 1.5rem; background: var(--gradient-page); }
    .auth-card { max-width: 420px; width: 100%; padding: 1.5rem; }
    h1 { margin: 0 0 0.35rem; font-size: 1.25rem; }
    .sub { margin: 0 0 1rem; color: var(--text-muted); font-size: 0.85rem; }
    .label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.8rem; margin-bottom: 0.75rem; }
    .error { color: var(--accent-danger); font-size: 0.85rem; }
    .ok { color: var(--accent-success); font-size: 0.85rem; }
    .links { margin: 1rem 0 0; font-size: 0.82rem; }
  `],
})
export class ForgotPasswordPage {
  private readonly api = inject(ApiService);
  readonly locale = inject(LocaleService);
  email = '';
  readonly loading = signal(false);
  readonly error = signal('');
  readonly sent = signal(false);

  async submit(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      await firstValueFrom(this.api.forgotPassword(this.email.trim()));
      this.sent.set(true);
    } catch (err) {
      this.error.set(mapHttpError(err, 'Envoi impossible'));
    } finally {
      this.loading.set(false);
    }
  }
}
