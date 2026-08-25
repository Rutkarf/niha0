import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/api/api.service';
import { mapHttpError } from '../../../core/api/http-error.util';
import { LocaleService } from '../../../core/i18n/locale.service';

@Component({
  selector: 'app-reset-password-page',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <section class="auth-card card">
        <h1>Nouveau mot de passe</h1>
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
            <button type="submit" class="btn btn-primary" [disabled]="loading() || !token">
              {{ loading() ? locale.t('loading') : 'Réinitialiser' }}
            </button>
          </form>
        } @else {
          <p class="ok" role="status">Mot de passe mis à jour. Vous pouvez vous connecter.</p>
        }
        <p class="links"><a routerLink="/login">← {{ locale.t('login') }}</a></p>
      </section>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: grid; place-items: center; padding: 1.5rem; background: var(--gradient-page); }
    .auth-card { max-width: 420px; width: 100%; padding: 1.5rem; }
    h1 { margin: 0 0 1rem; font-size: 1.25rem; }
    .label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.8rem; margin-bottom: 0.75rem; }
    .error { color: var(--accent-danger); font-size: 0.85rem; }
    .ok { color: var(--accent-success); font-size: 0.85rem; }
    .links { margin: 1rem 0 0; font-size: 0.82rem; }
  `],
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
