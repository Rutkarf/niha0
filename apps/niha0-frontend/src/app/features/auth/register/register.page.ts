import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService, MFA_TOKEN_KEY } from '../../../core/auth/auth.service';
import { TokenResponse } from '../../../core/auth/auth.models';
import { mapHttpError } from '../../../core/api/http-error.util';
import { AUTH_LAYOUT_STYLES } from '../auth-layout.styles';

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

        <section class="login-card" aria-labelledby="register-title">
          <header class="login-header">
            <h2 id="register-title">Compte professionnel</h2>
            <p>Étape 1 sur 2 · Identifiants (puis onboarding)</p>
          </header>
          <div class="progress-dots" aria-hidden="true">
            <i class="on"></i><i></i>
          </div>
          <form (ngSubmit)="submit()" class="login-form" novalidate>
            <div class="form-group">
              <label class="label" for="companyName">Nom de l’entreprise *</label>
              <input
                id="companyName"
                class="input"
                name="companyName"
                [(ngModel)]="companyName"
                required
                [attr.aria-invalid]="touched() && !companyName.trim()"
              />
              @if (touched() && !companyName.trim()) {
                <p class="field-hint form-error">Le nom de l’entreprise est obligatoire.</p>
              }
            </div>
            <div class="form-group">
              <label class="label" for="sector">Secteur</label>
              <input id="sector" class="input" name="sector" [(ngModel)]="sector" placeholder="Services, Industrie…" />
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
              <input
                id="password"
                class="input"
                type="password"
                name="password"
                [(ngModel)]="password"
                (ngModelChange)="onPwd()"
                required
                minlength="8"
                autocomplete="new-password"
                [attr.aria-describedby]="'pwd-help'"
              />
              <div class="pwd-meter" [class]="pwdStrength()" aria-hidden="true">
                <span [class.on]="password.length > 0"></span>
                <span [class.on]="password.length >= 8"></span>
                <span [class.on]="password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)"></span>
              </div>
              <p id="pwd-help" class="field-hint">{{ pwdHint() }}</p>
            </div>
            @if (error()) {
              <p class="error" role="alert">{{ error() }}</p>
            }
            <button type="submit" class="btn btn-primary login-btn" [class.is-loading]="loading()" [disabled]="loading()">
              {{ loading() ? 'Création…' : 'Créer mon espace' }}
            </button>
          </form>
          <p class="demo-hint">Déjà un compte ? <a routerLink="/login">Connexion</a></p>
        </section>
      </div>
    </div>
  `,
  styles: [AUTH_LAYOUT_STYLES],
})
export class RegisterPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  companyName = '';
  sector = '';
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal('');
  readonly touched = signal(false);
  readonly pwdStrength = signal<'weak' | 'ok' | 'strong'>('weak');

  readonly pwdHint = computed(() => {
    const s = this.pwdStrength();
    if (!this.password) return 'Utilisez au moins 8 caractères.';
    if (s === 'strong') return 'Mot de passe solide.';
    if (s === 'ok') return 'Correct — ajoutez majuscule et chiffre pour plus de sécurité.';
    return 'Trop court — 8 caractères minimum.';
  });

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const company = params.get('company');
    const email = params.get('email');
    if (company) this.companyName = company;
    if (email) this.email = email;
    const navState = history.state as { prefillPassword?: string } | undefined;
    if (navState?.prefillPassword) this.password = navState.prefillPassword;
  }

  onPwd(): void {
    const p = this.password;
    if (p.length >= 10 && /[A-Z]/.test(p) && /[0-9]/.test(p)) this.pwdStrength.set('strong');
    else if (p.length >= 8) this.pwdStrength.set('ok');
    else this.pwdStrength.set('weak');
  }

  async submit(): Promise<void> {
    this.touched.set(true);
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
