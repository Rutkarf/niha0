import { Injectable, signal } from '@angular/core';
import {
  DEFAULT_DASHBOARD_PREFERENCES,
  DashboardPreferences,
} from '../models/dashboard.models';

const STORAGE_KEY = 'nihao.dashboard.preferences';

@Injectable({ providedIn: 'root' })
export class DashboardPreferencesService {
  readonly prefs = signal<DashboardPreferences>(this.load());

  update(patch: Partial<DashboardPreferences>): void {
    const next = { ...this.prefs(), ...patch };
    this.prefs.set(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota errors */
    }
  }

  reset(): void {
    this.prefs.set({ ...DEFAULT_DASHBOARD_PREFERENCES });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  private load(): DashboardPreferences {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_DASHBOARD_PREFERENCES };
      const parsed = JSON.parse(raw) as Partial<DashboardPreferences>;
      return {
        ...DEFAULT_DASHBOARD_PREFERENCES,
        ...parsed,
        visibleColumns: {
          ...DEFAULT_DASHBOARD_PREFERENCES.visibleColumns,
          ...parsed.visibleColumns,
        },
      };
    } catch {
      return { ...DEFAULT_DASHBOARD_PREFERENCES };
    }
  }
}
