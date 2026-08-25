import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  track(event: string, props?: Record<string, unknown>): void {
    const payload = { event, ...props, ts: new Date().toISOString() };
    if (!environment.production) {
      console.debug('[analytics]', payload);
    }
    if (typeof window !== 'undefined' && Array.isArray(window.dataLayer)) {
      window.dataLayer.push(payload);
    }
  }
}
