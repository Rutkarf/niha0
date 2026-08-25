import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

async function flushMicrotasks(times = 5): Promise<void> {
  for (let i = 0; i < times; i++) {
    await Promise.resolve();
  }
}

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', children: [] }]),
      ],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
    sessionStorage.clear();
    TestBed.resetTestingModule();
  });

  it('login stores access token in memory and loads me', async () => {
    const loginPromise = auth.login({ email: 'a@b.c', password: 'x' });

    http.expectOne(`${environment.apiUrl}/auth/login`).flush({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      expiresInMs: 3600000,
      userId: 'u1',
      organizationId: 'o1',
      role: 'OWNER',
    });
    await flushMicrotasks();

    http.expectOne(`${environment.apiUrl}/auth/me`).flush({
      id: 'u1',
      email: 'a@b.c',
      firstName: 'A',
      lastName: 'B',
      organizationId: 'o1',
      organizationName: 'Org',
      role: 'OWNER',
    });
    await flushMicrotasks();

    http.expectOne(`${environment.apiUrl}/organizations/current`).flush({
      onboardingStatus: 'COMPLETED',
    });

    await loginPromise;
    expect(auth.getAccessToken()).toBe('access-1');
    expect(localStorage.getItem('niha0_access_token')).toBeNull();
    expect(localStorage.getItem('niha0_refresh_token')).toBeNull();
    expect(auth.user()?.email).toBe('a@b.c');
  });

  it('login redirects to MFA when required', async () => {
    const loginPromise = auth.login({ email: 'a@b.c', password: 'x' });

    http.expectOne(`${environment.apiUrl}/auth/login`).flush({
      mfaRequired: true,
      mfaToken: 'mfa-tok-1',
    });
    await flushMicrotasks();

    await loginPromise;
    expect(sessionStorage.getItem('niha0_mfa_token')).toBe('mfa-tok-1');
    expect(auth.getAccessToken()).toBeNull();
  });

  it('refreshAccessToken rotates in-memory token and shares in-flight', async () => {
    localStorage.setItem('niha0_refresh_token', 'refresh-old');

    const p1 = auth.refreshAccessToken();
    const p2 = auth.refreshAccessToken();

    const reqs = http.match(`${environment.apiUrl}/auth/refresh`);
    expect(reqs.length).toBe(1);
    expect(reqs[0]!.request.withCredentials).toBe(true);
    reqs[0]!.flush({
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
      expiresInMs: 3600000,
      userId: 'u1',
      organizationId: 'o1',
      role: 'OWNER',
    });

    await expect(p1).resolves.toBe('access-2');
    await expect(p2).resolves.toBe('access-2');
    expect(auth.getAccessToken()).toBe('access-2');
    expect(localStorage.getItem('niha0_refresh_token')).toBeNull();
  });

  it('migrates legacy access token from localStorage on init', () => {
    localStorage.setItem('niha0_access_token', 'legacy-access');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', children: [] }]),
      ],
    });
    const migrated = TestBed.inject(AuthService);
    expect(migrated.getAccessToken()).toBe('legacy-access');
    expect(localStorage.getItem('niha0_access_token')).toBeNull();
  });
});
