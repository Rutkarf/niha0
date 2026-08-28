import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { normalizeCompanyName } from '../tenancy/company-label';
import { AnalyticsService } from '../analytics/analytics.service';
import { LoginRequest, TokenResponse, UserMe, AuthDrawerMode } from './auth.models';

const LEGACY_ACCESS_KEY = 'niha0_access_token';
const LEGACY_REFRESH_KEY = 'niha0_refresh_token';
export const MFA_TOKEN_KEY = 'niha0_mfa_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly analytics = inject(AnalyticsService);
  private readonly baseUrl = environment.apiUrl;

  private readonly accessTokenSignal = signal<string | null>(null);
  private refreshTokenMemory: string | null = null;

  private readonly userSignal = signal<UserMe | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly drawerOpenSignal = signal(false);
  private readonly drawerModeSignal = signal<AuthDrawerMode>('login');
  private readonly drawerErrorSignal = signal<string | null>(null);
  private readonly oauthRedirectingSignal = signal(false);
  private enabledOAuthProviders = signal<string[]>([]);

  /** Single-flight refresh so concurrent 401s share one POST /auth/refresh. */
  private refreshInFlight: Promise<string> | null = null;

  readonly user = this.userSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly drawerOpen = this.drawerOpenSignal.asReadonly();
  readonly drawerMode = this.drawerModeSignal.asReadonly();
  readonly drawerError = this.drawerErrorSignal.asReadonly();
  readonly oauthRedirecting = this.oauthRedirectingSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.userSignal() !== null);
  readonly accessToken = computed(() => this.accessTokenSignal());

  constructor() {
    this.migrateLegacyAccessToken();
  }

  getAccessToken(): string | null {
    return this.accessTokenSignal();
  }

  openDrawer(mode: AuthDrawerMode = 'login'): void {
    this.drawerErrorSignal.set(null);
    this.drawerModeSignal.set(mode);
    this.drawerOpenSignal.set(true);
  }

  closeDrawer(): void {
    this.drawerOpenSignal.set(false);
    this.drawerErrorSignal.set(null);
  }

  setDrawerMode(mode: AuthDrawerMode): void {
    this.drawerErrorSignal.set(null);
    this.drawerModeSignal.set(mode);
  }

  setDrawerError(message: string | null): void {
    this.drawerErrorSignal.set(message);
  }

  setEnabledOAuthProviders(providers: string[]): void {
    this.enabledOAuthProviders.set(providers);
  }

  isOAuthProviderEnabled(providerId: string): boolean {
    return this.enabledOAuthProviders().includes(providerId);
  }

  startOAuth(providerId: string): void {
    if (!this.isOAuthProviderEnabled(providerId)) return;
    this.oauthRedirectingSignal.set(true);
    window.location.href = `${this.baseUrl}/oauth2/authorization/${providerId}`;
  }

  async login(credentials: LoginRequest): Promise<void> {
    this.loadingSignal.set(true);
    try {
      const tokens = await firstValueFrom(
        this.http.post<TokenResponse>(`${this.baseUrl}/auth/login`, credentials),
      );
      if (tokens.mfaRequired && tokens.mfaToken) {
        sessionStorage.setItem(MFA_TOKEN_KEY, tokens.mfaToken);
        await this.router.navigate(['/mfa']);
        return;
      }
      if (!tokens.accessToken) {
        throw new Error('Réponse auth invalide');
      }
      this.persistTokens(tokens);
      await this.finishLogin(tokens);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Exchange refresh token (cookie or body) for a new access token.
   * Concurrent callers await the same in-flight request.
   */
  refreshAccessToken(): Promise<string> {
    if (this.refreshInFlight) return this.refreshInFlight;

    const refreshToken =
      this.refreshTokenMemory ?? localStorage.getItem(LEGACY_REFRESH_KEY) ?? undefined;
    const body = refreshToken ? { refreshToken } : {};

    this.refreshInFlight = firstValueFrom(
      this.http.post<TokenResponse>(`${this.baseUrl}/auth/refresh`, body, {
        withCredentials: true,
      }),
    )
      .then((tokens) => {
        if (!tokens.accessToken) {
          throw new Error('No access token');
        }
        this.persistTokens(tokens);
        localStorage.removeItem(LEGACY_REFRESH_KEY);
        return tokens.accessToken;
      })
      .finally(() => {
        this.refreshInFlight = null;
      });

    return this.refreshInFlight;
  }

  async loadMe(): Promise<UserMe | null> {
    if (!environment.accessCookieAuth && !this.accessTokenSignal()) {
      this.userSignal.set(null);
      return null;
    }
    try {
      const me = await firstValueFrom(
        this.http.get<UserMe>(`${this.baseUrl}/auth/me`, { withCredentials: true }),
      );
      this.userSignal.set({
        ...me,
        organizationName: normalizeCompanyName(me.organizationName) || me.organizationName,
      });
      return me;
    } catch {
      this.clearSession();
      return null;
    }
  }

  logout(): void {
    void firstValueFrom(
      this.http.post(`${this.baseUrl}/auth/logout`, {}, { withCredentials: true }),
    ).catch(() => undefined);
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  /** Persist tokens from invite accept / register / MFA flows and hydrate `/me`. */
  async applySession(tokens: TokenResponse, redirectUrl = '/app/ai-office'): Promise<void> {
    if (!tokens.accessToken) {
      throw new Error('Réponse auth invalide');
    }
    this.persistTokens(tokens);
    await this.loadMe();
    this.analytics.track('session_applied', {
      userId: tokens.userId,
      organizationId: tokens.organizationId,
    });
    await this.router.navigateByUrl(redirectUrl);
  }

  /** Clear tokens without navigation — used when interceptor already redirects. */
  clearSession(): void {
    this.accessTokenSignal.set(null);
    this.refreshTokenMemory = null;
    localStorage.removeItem(LEGACY_ACCESS_KEY);
    localStorage.removeItem(LEGACY_REFRESH_KEY);
    sessionStorage.removeItem(MFA_TOKEN_KEY);
    this.userSignal.set(null);
    this.refreshInFlight = null;
  }

  getOrganizationId(): string | null {
    return this.userSignal()?.organizationId ?? null;
  }

  private async finishLogin(tokens: TokenResponse): Promise<void> {
    await this.loadMe();
    this.analytics.track('login_success', {
      userId: tokens.userId,
      organizationId: tokens.organizationId,
    });
    let incomplete = false;
    try {
      const org = await firstValueFrom(
        this.http.get<{ onboardingStatus?: string }>(`${this.baseUrl}/organizations/current`),
      );
      incomplete =
        org.onboardingStatus === 'IN_PROGRESS' || org.onboardingStatus === 'NOT_STARTED';
    } catch {
      incomplete = false;
    }
    const redirect =
      sessionStorage.getItem('niha0_redirect') ||
      (incomplete ? '/app/onboarding' : '/app/ai-office');
    sessionStorage.removeItem('niha0_redirect');
    await this.router.navigateByUrl(redirect);
  }

  private persistTokens(tokens: TokenResponse): void {
    if (tokens.accessToken) {
      // Keep in-memory copy for Bearer fallback / tests; cookie mode still sets HttpOnly access cookie server-side.
      this.accessTokenSignal.set(tokens.accessToken);
      localStorage.removeItem(LEGACY_ACCESS_KEY);
    }
    if (tokens.refreshToken) {
      this.refreshTokenMemory = environment.accessCookieAuth ? null : tokens.refreshToken;
    }
  }

  /** One-time migration: read legacy access token from localStorage then remove. */
  private migrateLegacyAccessToken(): void {
    const legacy = localStorage.getItem(LEGACY_ACCESS_KEY);
    if (legacy) {
      this.accessTokenSignal.set(legacy);
      localStorage.removeItem(LEGACY_ACCESS_KEY);
    }
  }
}
