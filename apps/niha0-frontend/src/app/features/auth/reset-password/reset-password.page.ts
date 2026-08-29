import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/api/api.service';
import { mapHttpError } from '../../../core/api/http-error.util';
import { LocaleService } from '../../../core/i18n/locale.service';
import { PublicSiteShellComponent } from '../../marketing-site/public-site-shell.component';
import { PUBLIC_AUTH_STYLES } from '../../marketing-site/public-content.styles';

@Component({
  selector: 'app-reset-password-page',
  imports: [FormsModule, RouterLink, PublicSiteShellComponent],
  template: `
    <app-public-site-shell pageTitle="Nouveau mot de passe">
      <div class="auth-wrap">
        <section class="auth-card">
          <h2 class="page-title">Nouveau mot de passe</h2>
          @if (!done()) {
            <form (ngSubmit)="submit()">
              <label class="label">
                Nouveau mot de passe
                <input class="input" type="password" [(ngModel)]="newPassword" name="newPassword" required minlength="8" />
              </label>
              <label class="label">
                Confirmer
                <input class="input" type="password" [(ngModel)]="confirm" name="confirm" required />
              </label>
              @if (error()) {
                <p class="error" role="alert">{{ error() }}</p>
              }
              <button type="submit" class="btn btn-primary auth-btn" [disabled]="loading() || !token">
                {{ loading() ? locale.t('loading') : 'Réinitialiser' }}
              </button>
            </form>
          } @else {
            <p class="ok" role="status">Mot de passe mis à jour. Vous pouvez vous connecter.</p>
          }
          <p class="hint"><a routerLink="/login">← {{ locale.t('login') }}</a></p>
        </section>
      </div>
    </app-public-site-shell>
  `,
  styles: [
    PUBLIC_AUTH_STYLES,
    `
    .page-title {
      margin: 0 0 0.65rem;
      font-family: var(--font-display, Georgia, serif);
      font-size: clamp(1.05rem, 2vw, 1.25rem);
      font-weight: 800;
    }
    .label {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      font-size: 0.78rem;
      margin-bottom: 0.45rem;
    }
  `,
  ],
})
export class ResetPasswordPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  readonly locale = inject(LocaleService);
  token = '';
  newPassword = '';
  confirm = '';
  readonly loading = signal(false);
  readonly error = signal('');
  readonly done = signal(false);

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
  }

  async submit(): Promise<void> {
    if (this.newPassword !== this.confirm) {
      this.error.set('Les mots de passe ne correspondent pas.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    try {
      await firstValueFrom(this.api.resetPassword({ token: this.token, newPassword: this.newPassword }));
      this.done.set(true);
    } catch (err) {
      this.error.set(mapHttpError(err, 'Réinitialisation impossible'));
    } finally {
      this.loading.set(false);
    }
  }
}
