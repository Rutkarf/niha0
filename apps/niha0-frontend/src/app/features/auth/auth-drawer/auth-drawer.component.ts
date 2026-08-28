import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthDrawerMode } from '../../../core/auth/auth.models';
import { ApiService } from '../../../core/api/api.service';
import { mapHttpError } from '../../../core/api/http-error.util';
import { LocaleService } from '../../../core/i18n/locale.service';
import { FocusTrapDirective } from '../../../shared/a11y/focus-trap.directive';
import { AUTH_OAUTH_PROVIDERS } from './auth-drawer.oauth';
import { AuthLocaleKey, authT } from './auth-locale';

type AuthFieldKind = 'email' | 'password' | 'company';

@Component({
  selector: 'app-auth-drawer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FocusTrapDirective],
  templateUrl: './auth-drawer.component.html',
  styleUrl: './auth-drawer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthDrawerComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  readonly locale = inject(LocaleService);

  readonly oauthProviders = AUTH_OAUTH_PROVIDERS;
  readonly showPassword = signal(false);

  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly registerForm = this.fb.group({
    companyName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor() {
    effect(() => {
      if (this.auth.drawerOpen()) {
        void this.loadOAuthProviders();
      }
    });
  }

  ngOnInit(): void {
    void this.loadOAuthProviders();
  }

  t(key: AuthLocaleKey): string {
    return authT(this.locale.locale(), key);
  }

  close(): void {
    this.auth.closeDrawer();
  }

  switchMode(mode: AuthDrawerMode): void {
    this.auth.setDrawerMode(mode);
  }

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  startOAuth(providerId: string): void {
    this.auth.startOAuth(providerId);
  }

  showFieldError(control: AbstractControl | null): boolean {
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  fieldError(control: AbstractControl | null, kind: AuthFieldKind): string {
    if (!control?.errors) return this.t('validationRequired');
    if (control.errors['required']) return this.t('validationRequired');
    if (kind === 'email' && control.errors['email']) return this.t('validationEmail');
    if (kind === 'password' && control.errors['minlength']) return this.t('validationPasswordMin');
    if (kind === 'company' && control.errors['minlength']) return this.t('validationCompanyMin');
    return this.t('validationRequired');
  }

  async submitLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.auth.setDrawerError(null);
    const { email, password } = this.loginForm.getRawValue();
    try {
      await this.auth.login({ email: email ?? '', password: password ?? '' });
      this.auth.closeDrawer();
    } catch (err) {
      this.auth.setDrawerError(mapHttpError(err, 'Connexion impossible. Réessayez.'));
    }
  }

  async submitRegister(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    const { companyName, email, password } = this.registerForm.getRawValue();
    this.auth.closeDrawer();
    await this.router.navigate(['/register'], {
      queryParams: {
        company: companyName?.trim() || undefined,
        email: email?.trim() || undefined,
      },
      state: { prefillPassword: password ?? '' },
    });
  }

  private async loadOAuthProviders(): Promise<void> {
    try {
      const status = await firstValueFrom(this.api.getOAuth2Status());
      const providers = status.enabled ? status.providers : [];
      this.auth.setEnabledOAuthProviders(providers);
    } catch {
      this.auth.setEnabledOAuthProviders([]);
    }
  }
}
