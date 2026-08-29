import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/api/api.service';
import { mapHttpError } from '../../../core/api/http-error.util';
import { LocaleService } from '../../../core/i18n/locale.service';
import { PublicSiteShellComponent } from '../../marketing-site/public-site-shell.component';
import { PUBLIC_AUTH_STYLES } from '../../marketing-site/public-content.styles';

@Component({
  selector: 'app-forgot-password-page',
  imports: [FormsModule, RouterLink, PublicSiteShellComponent],
  template: `
    <app-public-site-shell pageTitle="Mot de passe oublié">
      <div class="auth-wrap">
        <section class="auth-card" aria-labelledby="forgot-title">
          <header class="auth-header">
            <h2 id="forgot-title">Mot de passe oublié</h2>
            <p>Recevez un lien de réinitialisation par email.</p>
          </header>
          @if (!sent()) {
            <form (ngSubmit)="submit()">
              <div class="form-group">
                <label class="label" for="email">{{ locale.t('email') }}</label>
                <input id="email" class="input" type="email" [(ngModel)]="email" name="email" required autocomplete="username" />
              </div>
              @if (error()) {
                <p class="error" role="alert">{{ error() }}</p>
              }
              <button type="submit" class="btn btn-primary auth-btn" [class.is-loading]="loading()" [disabled]="loading()">
                {{ loading() ? locale.t('loading') : 'Envoyer le lien' }}
              </button>
            </form>
          } @else {
            <p class="ok" role="status">
              Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.
            </p>
          }
          <p class="hint">
            <a routerLink="/login">← {{ locale.t('login') }}</a>
          </p>
        </section>
      </div>
    </app-public-site-shell>
  `,
  styles: [PUBLIC_AUTH_STYLES],
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
