import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { authInterceptor } from '../interceptors/auth.interceptor';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

async function flushMicrotasks(times = 8): Promise<void> {
  for (let i = 0; i < times; i++) {
    await Promise.resolve();
  }
}

describe('authInterceptor refresh', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
    localStorage.setItem('niha0_access_token', 'expired');
    localStorage.setItem('niha0_refresh_token', 'refresh-ok');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', children: [] }]),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('retries once after successful refresh on 401', async () => {
    const call = firstValueFrom(http.get(`${environment.apiUrl}/agents`));

    const first = httpMock.expectOne(`${environment.apiUrl}/agents`);
    expect(first.request.headers.get('Authorization')).toBe('Bearer expired');
    first.flush({ message: 'expired' }, { status: 401, statusText: 'Unauthorized' });
    await flushMicrotasks();

    const refreshReqs = httpMock.match(`${environment.apiUrl}/auth/refresh`);
    expect(refreshReqs.length).toBe(1);
    refreshReqs[0]!.flush({
      accessToken: 'fresh',
      refreshToken: 'refresh-2',
      expiresInMs: 3600000,
      userId: 'u1',
      organizationId: 'o1',
      role: 'OWNER',
    });
    await flushMicrotasks();

    const retries = httpMock.match(`${environment.apiUrl}/agents`);
    expect(retries.length).toBe(1);
    expect(retries[0]!.request.headers.get('Authorization')).toBe('Bearer fresh');
    retries[0]!.flush([{ id: 'a1' }]);

    await expect(call).resolves.toEqual([{ id: 'a1' }]);
    expect(auth.getAccessToken()).toBe('fresh');
    expect(localStorage.getItem('niha0_access_token')).toBeNull();
  });
});
