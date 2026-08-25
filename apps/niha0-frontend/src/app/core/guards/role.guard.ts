import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Role } from '../auth/auth.models';

/**
 * Requires the current user's role to be in `route.data['roles']`.
 * OWNER always passes. Empty `roles` → allow any authenticated user.
 */
export const roleGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    const me = await auth.loadMe();
    if (!me) {
      sessionStorage.setItem('niha0_redirect', state.url);
      return router.createUrlTree(['/login']);
    }
  }

  const user = auth.user();
  if (!user) {
    sessionStorage.setItem('niha0_redirect', state.url);
    return router.createUrlTree(['/login']);
  }

  const allowed = (route.data['roles'] as Role[] | undefined) ?? [];
  const strict = route.data['strictRoles'] === true;

  if (!strict && user.role === 'OWNER') {
    return true;
  }

  if (allowed.length === 0 || allowed.includes(user.role)) {
    return true;
  }

  return router.createUrlTree(['/app/access-denied'], {
    queryParams: { from: state.url },
  });
};
