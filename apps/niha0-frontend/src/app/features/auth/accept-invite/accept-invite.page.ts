import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/api/api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { mapHttpError } from '../../../core/api/http-error.util';

@Component({
  selector: 'app-accept-invite-page',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <section class="auth-card card">
        <h1>Accepter l'invitation</h1>
        <p class="sub">Créez votre compte pour rejoindre l'organisation.</p>
        @if (!token) {
          <p class="error" role="alert">Lien d'invitation invalide (token manquant).</p>
          <p><a routerLink="/login">Retour connexion</a></p>
        } @else {
          <form (ngSubmit)="submit()">
            <div class="row">
              <label class="label">
                Prénom
                <input class="input" [(ngModel)]="firstName" name="firstName" required />
              </label>
              <label class="label">
                Nom
                <input class="input" [(ngModel)]="lastName" name="lastName" required />
              </label>
            </div>
            <label class="label">
              Mot de passe
              <input class="input" type="password" [(ngModel)]="password" name="password" required minlength="8" />
            </label>
            @if (error()) {
              <p class="error" role="alert">{{ error() }}</p>
            }
            <button type="submit" class="btn btn-primary" [disabled]="loading()">
              {{ loading() ? 'Création…' : 'Rejoindre' }}
            </button>
          </form>
        }
      </section>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: grid; place-items: center; padding: 1.5rem; background: var(--gradient-page); }
    .auth-card { max-width: 440px; width: 100%; padding: 1.5rem; }
    h1 { margin: 0 0 0.35rem; font-size: 1.25rem; }
    .sub { margin: 0 0 1rem; color: var(--text-muted); font-size: 0.85rem; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.8rem; margin-bottom: 0.75rem; }
    .error { color: var(--accent-danger); font-size: 0.85rem; }
  `],
})
export class AcceptInvitePage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  token = '';
  firstName = '';
  lastName = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal('');

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
  }

  async submit(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const tokens = await firstValueFrom(
        this.api.acceptInvite({
          token: this.token,
          firstName: this.firstName.trim(),
          lastName: this.lastName.trim(),
          password: this.password,
        }),
      );
      await this.auth.applySession(tokens);
    } catch (err) {
      this.error.set(mapHttpError(err, 'Invitation invalide ou expirée'));
    } finally {
      this.loading.set(false);
    }
  }
}
