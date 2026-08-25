import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  const me = await auth.loadMe();
  if (me) return true;
  sessionStorage.setItem('niha0_redirect', state.url);
  return router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    return router.createUrlTree(['/app/ai-office']);
  }
  const me = await auth.loadMe();
  if (me) {
    return router.createUrlTree(['/app/ai-office']);
  }
  return true;
};
