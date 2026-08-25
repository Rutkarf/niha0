import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/api/api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { mapHttpError } from '../../../core/api/http-error.util';

@Component({
  selector: 'app-sso-callback-page',
  imports: [RouterLink],
  template: `
    <div class="auth-page">
      <section class="auth-card card">
        <h1>Connexion SSO</h1>
        @if (loading()) {
          <p class="sub">Finalisation de la connexion…</p>
        } @else if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
          <p><a routerLink="/login">Retour connexion</a></p>
        }
      </section>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: grid; place-items: center; padding: 1.5rem; background: var(--gradient-page); }
    .auth-card { max-width: 440px; width: 100%; padding: 1.5rem; }
    h1 { margin: 0 0 0.35rem; font-size: 1.25rem; }
    .sub { margin: 0; color: var(--text-muted); font-size: 0.85rem; }
    .error { color: var(--accent-danger); font-size: 0.85rem; }
  `],
})
export class SsoCallbackPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    void this.exchange();
  }

  private async exchange(): Promise<void> {
    const code = this.route.snapshot.queryParamMap.get('code');
    if (!code) {
      this.loading.set(false);
      this.error.set('Code SSO manquant.');
      return;
    }
    try {
      const tokens = await firstValueFrom(
        this.api.exchangeSsoCode(code, { withCredentials: true }),
      );
      await this.auth.applySession(tokens);
    } catch (err) {
      this.error.set(mapHttpError(err, 'Échange SSO impossible. Réessayez.'));
    } finally {
      this.loading.set(false);
    }
  }
}
