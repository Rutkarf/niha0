import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';
import { isPublicMarketingPath } from '../routing/public-routes';

const RETRY_HEADER = 'X-Niha0-Auth-Retry';

function redirectToLogin(router: Router): void {
  if (isPublicMarketingPath(router.url)) return;
  void router.navigate(['/login']);
}

function isAuthPublicUrl(url: string): boolean {
  return /\/auth\/(login|register|refresh|mfa\/verify|forgot-password|reset-password|accept-invite)(?:\?|$)/.test(
    url,
  );
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Attaches Bearer access token and, on 401, performs a single shared refresh
 * then retries the original request once. Public auth endpoints are excluded.
 * When CSRF cookie mode is enabled server-side, also sends X-XSRF-TOKEN.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (isAuthPublicUrl(req.url)) {
    return next(req);
  }

  const token = auth.getAccessToken();
  const xsrf = readCookie('XSRF-TOKEN');
  const headers: Record<string, string> = {};
  // Cookie-session mode: rely on niha0_access HttpOnly cookie (CSRF protects mutations).
  if (!environment.accessCookieAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (xsrf && !['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(req.method.toUpperCase())) {
    headers['X-XSRF-TOKEN'] = xsrf;
  }
  const authedReq = Object.keys(headers).length ? req.clone({ setHeaders: headers }) : req;

  return next(authedReq).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401) {
        return throwError(() => err);
      }
      if (req.headers.has(RETRY_HEADER) || isAuthPublicUrl(req.url)) {
        auth.clearSession();
        redirectToLogin(router);
        return throwError(() => err);
      }

      return from(auth.refreshAccessToken()).pipe(
        switchMap((accessToken) => {
          const retryHeaders: Record<string, string> = {
            [RETRY_HEADER]: '1',
          };
          if (!environment.accessCookieAuth) {
            retryHeaders['Authorization'] = `Bearer ${accessToken}`;
          }
          const retryXsrf = readCookie('XSRF-TOKEN');
          if (retryXsrf) retryHeaders['X-XSRF-TOKEN'] = retryXsrf;
          const retry = req.clone({ setHeaders: retryHeaders });
          return next(retry);
        }),
        catchError((refreshErr) => {
          auth.clearSession();
          redirectToLogin(router);
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
