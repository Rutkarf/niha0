import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Ensures cookies (refresh httpOnly) are sent/stored for API calls —
 * required for Cloudflare Pages → Render split hosting (and same-origin proxy).
 */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }
  if (req.withCredentials) {
    return next(req);
  }
  return next(req.clone({ withCredentials: true }));
};
