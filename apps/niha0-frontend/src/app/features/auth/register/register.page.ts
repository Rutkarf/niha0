import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService, MFA_TOKEN_KEY } from '../../../core/auth/auth.service';
import { TokenResponse } from '../../../core/auth/auth.models';
import { mapHttpError } from '../../../core/api/http-error.util';
import { PublicSiteShellComponent } from '../../marketing-site/public-site-shell.component';
import { PUBLIC_AUTH_STYLES } from '../../marketing-site/public-content.styles';
import {
  AUDIENCE_ROLES,
  AudienceRoleId,
  audienceById,
  isAudienceRoleId,
} from '../../marketing-site/audience-roles';

@Component({
  selector: 'app-register-page',
  imports: [FormsModule, RouterLink, PublicSiteShellComponent],
  template: `
    <app-public-site-shell pageTitle="Créer un espace">
      <div class="auth-wrap">
        <section class="auth-card" aria-labelledby="register-title">
          <header class="auth-header">
            <h2 id="register-title">Créer un espace</h2>
            <p>Profil {{ role().label }} · étape 1 sur 2 (puis onboarding)</p>
          </header>
          <div class="progress-dots" aria-hidden="true">
            <i class="on"></i><i></i>
          </div>
          <form (ngSubmit)="submit()" class="auth-form register-form" novalidate>
            <div class="form-group">
              <label class="label" for="audienceRole">Profil utilisateur *</label>
              <select
                id="audienceRole"
                class="input"
                name="audienceRole"
                [ngModel]="roleId()"
                (ngModelChange)="onRoleChange($event)"
              >
                @for (item of roles; track item.id) {
                  <option [value]="item.id">{{ item.label }} — {{ item.short }}</option>
                }
              </select>
            </div>
            <div class="row-2">
              <div class="form-group">
                <label class="label" for="companyName">{{ role().companyLabel }} *</label>
                <input
                  id="companyName"
                  class="input"
                  name="companyName"
                  [(ngModel)]="companyName"
                  required
                  [attr.aria-invalid]="touched() && !companyName.trim()"
                />
              </div>
              <div class="form-group">
                <label class="label" for="sector">Secteur</label>
                <input id="sector" class="input" name="sector" [(ngModel)]="sector" [placeholder]="role().sectorDefault" />
              </div>
            </div>
            @if (touched() && !companyName.trim()) {
              <p class="field-hint form-error">Ce champ est obligatoire.</p>
            }
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
              <label class="label" for="email">E-mail pro *</label>
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
            <button type="submit" class="btn btn-primary auth-btn" [class.is-loading]="loading()" [disabled]="loading()">
              {{ loading() ? 'Création…' : 'Créer mon espace' }}
            </button>
          </form>
          <p class="hint">Déjà un compte ? <a routerLink="/login">Connexion</a></p>
        </section>
      </div>
    </app-public-site-shell>
  `,
  styles: [
    PUBLIC_AUTH_STYLES,
    `
    .auth-card {
      width: min(520px, 100%);
    }
    .progress-dots {
      display: flex;
      gap: 0.35rem;
      margin-bottom: 0.45rem;
    }
    .progress-dots i {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--border-color);
    }
    .progress-dots i.on {
      background: var(--accent-primary);
    }
    .row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.45rem;
    }
    .field-hint {
      margin: 0.15rem 0 0.35rem;
      font-size: 0.68rem;
      color: var(--text-muted);
    }
    .form-error {
      color: var(--accent-danger);
    }
    .pwd-meter {
      display: flex;
      gap: 3px;
      margin-top: 0.25rem;
    }
    .pwd-meter span {
      flex: 1;
      height: 3px;
      border-radius: 2px;
      background: var(--border-color);
    }
    .pwd-meter span.on {
      background: var(--accent-primary);
    }
    .pwd-meter.weak span.on {
      background: var(--accent-danger);
    }
    .pwd-meter.ok span.on {
      background: var(--accent-warning);
    }
    .pwd-meter.strong span.on {
      background: var(--accent-success);
    }
    @media (max-width: 40rem) {
      .row-2 {
        grid-template-columns: 1fr;
      }
    }
  `,
  ],
})
export class RegisterPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly roles = AUDIENCE_ROLES;
  readonly roleId = signal<AudienceRoleId>('entreprise');
  readonly role = computed(() => audienceById(this.roleId()));

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
    const role = params.get('role');
    if (isAudienceRoleId(role)) {
      this.roleId.set(role);
      this.sector = audienceById(role).sectorDefault;
    }
    const company = params.get('company');
    const email = params.get('email');
    if (company) this.companyName = company;
    if (email) this.email = email;
    const navState = history.state as { prefillPassword?: string } | undefined;
    if (navState?.prefillPassword) this.password = navState.prefillPassword;
  }

  onRoleChange(value: string): void {
    if (!isAudienceRoleId(value)) return;
    this.roleId.set(value);
    const def = audienceById(value).sectorDefault;
    if (!this.sector.trim() || AUDIENCE_ROLES.some((r) => r.sectorDefault === this.sector)) {
      this.sector = def;
    }
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
          sector: this.sector.trim() || this.role().sectorDefault,
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
