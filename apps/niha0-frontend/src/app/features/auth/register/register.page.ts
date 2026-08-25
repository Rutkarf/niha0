import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService, MFA_TOKEN_KEY } from '../../../core/auth/auth.service';
import { TokenResponse } from '../../../core/auth/auth.models';
import { mapHttpError } from '../../../core/api/http-error.util';

@Component({
  selector: 'app-register-page',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="login-page">
      <div class="atmosphere" aria-hidden="true"></div>
      <div class="login-layout">
        <section class="brand-panel">
          <p class="eyebrow">Création d’espace professionnel</p>
          <h1 class="brand-type">NIHAO</h1>
          <p class="acronym">Network Intelligence Hub Access Open</p>
          <p class="pitch">
            Créez votre entreprise, personnalisez le bureau 3D, configurez vos agents IA et importez vos données.
          </p>
        </section>

        <section class="login-card">
          <header class="login-header">
            <h2>Compte professionnel</h2>
            <p>Étape 0 · Identifiants</p>
          </header>
          <form (ngSubmit)="submit()" class="login-form" novalidate>
            <div class="form-group">
              <label class="label" for="companyName">Nom de l’entreprise *</label>
              <input id="companyName" class="input" name="companyName" [(ngModel)]="companyName" required />
            </div>
            <div class="form-group">
              <label class="label" for="sector">Secteur</label>
              <input id="sector" class="input" name="sector" [(ngModel)]="sector" />
            </div>
            <div class="row-2">
              <div class="form-group">
                <label class="label" for="firstName">Prénom *</label>
                <input id="firstName" class="input" name="firstName" [(ngModel)]="firstName" required />
              </div>
              <div class="form-group">
                <label class="label" for="lastName">Nom *</label>
                <input id="lastName" class="input" name="lastName" [(ngModel)]="lastName" required />
              </div>
            </div>
            <div class="form-group">
              <label class="label" for="email">E-mail professionnel *</label>
              <input id="email" class="input" type="email" name="email" [(ngModel)]="email" required autocomplete="username" />
            </div>
            <div class="form-group">
              <label class="label" for="password">Mot de passe * (8 car. min.)</label>
              <input id="password" class="input" type="password" name="password" [(ngModel)]="password" required minlength="8" autocomplete="new-password" />
            </div>
            @if (error()) {
              <p class="error" role="alert">{{ error() }}</p>
            }
            <button type="submit" class="btn btn-primary login-btn" [disabled]="loading()">
              {{ loading() ? 'Création…' : 'Créer mon espace' }}
            </button>
          </form>
          <p class="demo-hint">Déjà un compte ? <a routerLink="/login">Connexion</a></p>
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
    }
    .login-layout {
      position: relative;
      z-index: 1;
      width: min(920px, 100%);
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 1.5rem;
    }
    .brand-panel { padding: 2rem 1rem; display: flex; flex-direction: column; justify-content: center; }
    .eyebrow { margin: 0 0 0.85rem; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); }
    .brand-type { margin: 0; font-family: var(--font-display); font-size: clamp(2.6rem, 6vw, 3.8rem); font-weight: 800; letter-spacing: 0.08em; }
    .acronym { color: var(--text-secondary); font-size: 0.85rem; }
    .pitch { color: var(--text-secondary); line-height: 1.5; max-width: 28rem; }
    .login-card {
      background: var(--bg-elevated);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
    }
    .login-header h2 { margin: 0 0 0.25rem; font-family: var(--font-display); }
    .login-header p { margin: 0 0 1rem; color: var(--text-muted); font-size: 0.8rem; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .login-btn { width: 100%; margin-top: 0.5rem; }
    .error { color: var(--accent-danger); font-size: 0.85rem; }
    .demo-hint { margin-top: 1rem; font-size: 0.78rem; color: var(--text-muted); }
    @media (max-width: 800px) {
      .login-layout { grid-template-columns: 1fr; }
      .row-2 { grid-template-columns: 1fr; }
    }
  `],
})
export class RegisterPage {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  companyName = '';
  sector = '';
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal('');

  async submit(): Promise<void> {
    this.error.set('');
    if (!this.companyName.trim() || !this.firstName.trim() || !this.lastName.trim() || !this.email.trim() || this.password.length < 8) {
      this.error.set('Veuillez remplir les champs obligatoires (mot de passe ≥ 8 caractères).');
      return;
    }
    this.loading.set(true);
    try {
      const tokens = await firstValueFrom(
        this.http.post<TokenResponse>(`${environment.apiUrl}/auth/register`, {
          email: this.email.trim(),
          password: this.password,
          firstName: this.firstName.trim(),
          lastName: this.lastName.trim(),
          companyName: this.companyName.trim(),
          sector: this.sector.trim() || 'Services',
        }),
      );
      if (tokens.mfaRequired && tokens.mfaToken) {
        sessionStorage.setItem(MFA_TOKEN_KEY, tokens.mfaToken);
        await this.router.navigate(['/mfa']);
        return;
      }
      await this.auth.applySession(tokens, '/app/onboarding');
    } catch (err: unknown) {
      this.error.set(mapHttpError(err, 'Création impossible. Réessayez.'));
    } finally {
      this.loading.set(false);
    }
  }
}
