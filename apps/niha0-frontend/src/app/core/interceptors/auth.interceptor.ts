import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

const RETRY_HEADER = 'X-Niha0-Auth-Retry';

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
  if (token) headers['Authorization'] = `Bearer ${token}`;
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
        void router.navigate(['/login']);
        return throwError(() => err);
      }

      return from(auth.refreshAccessToken()).pipe(
        switchMap((accessToken) => {
          const retryHeaders: Record<string, string> = {
            Authorization: `Bearer ${accessToken}`,
            [RETRY_HEADER]: '1',
          };
          const retryXsrf = readCookie('XSRF-TOKEN');
          if (retryXsrf) retryHeaders['X-XSRF-TOKEN'] = retryXsrf;
          const retry = req.clone({ setHeaders: retryHeaders });
          return next(retry);
        }),
        catchError((refreshErr) => {
          auth.clearSession();
          void router.navigate(['/login']);
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
