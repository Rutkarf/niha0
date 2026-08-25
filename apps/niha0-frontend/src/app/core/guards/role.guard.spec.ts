import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthService } from '../auth/auth.service';
import { UserMe } from '../auth/auth.models';

describe('roleGuard', () => {
  const owner: UserMe = {
    id: '1',
    email: 'o@t.fr',
    firstName: 'O',
    lastName: 'W',
    organizationId: 'org',
    organizationName: 'Org',
    role: 'OWNER',
  };
  const viewer: UserMe = { ...owner, role: 'VIEWER' };

  it('allows OWNER on restricted routes', async () => {
    const auth = {
      isAuthenticated: () => true,
      user: () => owner,
      loadMe: async () => owner,
    };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });
    const result = await TestBed.runInInjectionContext(() =>
      roleGuard(
        { data: { roles: ['ADMIN'] } } as never,
        { url: '/app/audit' } as never,
      ),
    );
    expect(result).toBe(true);
  });

  it('redirects VIEWER away from ADMIN-only routes', async () => {
    const auth = {
      isAuthenticated: () => true,
      user: () => viewer,
      loadMe: async () => viewer,
    };
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'app/access-denied', children: [] }]), { provide: AuthService, useValue: auth }],
    });
    const result = await TestBed.runInInjectionContext(() =>
      roleGuard(
        { data: { roles: ['ADMIN'] } } as never,
        { url: '/app/audit' } as never,
      ),
    );
    expect(String(result)).toContain('access-denied');
  });

  it('blocks OWNER on strict PLATFORM_ADMIN routes', async () => {
    const auth = {
      isAuthenticated: () => true,
      user: () => owner,
      loadMe: async () => owner,
    };
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'app/access-denied', children: [] }]), { provide: AuthService, useValue: auth }],
    });
    const result = await TestBed.runInInjectionContext(() =>
      roleGuard(
        { data: { roles: ['PLATFORM_ADMIN'], strictRoles: true } } as never,
        { url: '/app/platform' } as never,
      ),
    );
    expect(String(result)).toContain('access-denied');
  });
});
