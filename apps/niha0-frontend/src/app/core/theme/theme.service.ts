import { DOCUMENT } from '@angular/common';
import { Injectable, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export type ThemeMode = 'AUTO' | 'SOLARPUNK' | 'CYBERPUNK';
export type ResolvedTheme = 'SOLARPUNK' | 'CYBERPUNK';

@Injectable({ providedIn: 'root' })
export class ThemeService implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly http = inject(HttpClient);
  private readonly modeSignal = signal<ThemeMode>(this.loadMode());
  private readonly highContrastSignal = signal(this.loadHighContrast());
  private readonly clockTick = signal(0);
  private autoTimer: ReturnType<typeof setTimeout> | null = null;

  readonly mode = this.modeSignal.asReadonly();
  readonly highContrast = this.highContrastSignal.asReadonly();
  readonly resolved = computed<ResolvedTheme>(() => {
    this.clockTick(); // recompute when AUTO timer fires
    const mode = this.modeSignal();
    if (mode === 'SOLARPUNK') return 'SOLARPUNK';
    if (mode === 'CYBERPUNK') return 'CYBERPUNK';
    return this.resolveAuto();
  });

  readonly label = computed(() => {
    const m = this.modeSignal();
    if (m === 'AUTO') return `Auto (${this.resolved() === 'SOLARPUNK' ? 'SolarPunk' : 'Cyberpunk'})`;
    return m === 'SOLARPUNK' ? 'SolarPunk' : 'Cyberpunk';
  });

  constructor() {
    effect(() => {
      this.applyTheme(this.resolved());
    });
    effect(() => {
      this.applyHighContrast(this.highContrastSignal());
    });
    this.scheduleAutoSwitch();
  }

  ngOnDestroy(): void {
    if (this.autoTimer) clearTimeout(this.autoTimer);
  }

  setMode(mode: ThemeMode): void {
    this.modeSignal.set(mode);
    localStorage.setItem('niha0_theme_mode', mode);
    this.applyTheme(this.resolved());
    this.scheduleAutoSwitch();
    this.persistRemote(mode);
  }

  /** SolarPunk → Cyberpunk → Auto → SolarPunk */
  cycleMode(): void {
    const order: ThemeMode[] = ['SOLARPUNK', 'CYBERPUNK', 'AUTO'];
    const idx = order.indexOf(this.modeSignal());
    this.setMode(order[(idx + 1) % order.length]);
  }

  toggleHighContrast(): void {
    const next = !this.highContrastSignal();
    this.highContrastSignal.set(next);
    localStorage.setItem('niha0_a11y_contrast', next ? '1' : '0');
    this.applyHighContrast(next);
  }

  setHighContrast(enabled: boolean): void {
    this.highContrastSignal.set(enabled);
    localStorage.setItem('niha0_a11y_contrast', enabled ? '1' : '0');
    this.applyHighContrast(enabled);
  }

  /** Load preference from API after login (falls back to localStorage). */
  hydrateFromServer(): void {
    this.http
      .get<{ mode: ThemeMode }>(`${environment.apiUrl}/theme-preferences`)
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        if (res?.mode && ['AUTO', 'SOLARPUNK', 'CYBERPUNK'].includes(res.mode)) {
          this.modeSignal.set(res.mode);
          localStorage.setItem('niha0_theme_mode', res.mode);
          this.applyTheme(this.resolved());
          this.scheduleAutoSwitch();
        }
      });
  }

  getSceneColors(): { bg: string; floor: string; accent: string; ceo: string } {
    const root = this.document.documentElement;
    const style = getComputedStyle(root);
    return {
      bg: style.getPropertyValue('--scene-bg').trim() || '#e7f4e7',
      floor: style.getPropertyValue('--scene-floor').trim() || '#cfaf7b',
      accent: style.getPropertyValue('--scene-accent').trim() || '#22a06b',
      ceo: style.getPropertyValue('--scene-ceo').trim() || '#f5c84c',
    };
  }

  private persistRemote(mode: ThemeMode): void {
    this.http
      .put(`${environment.apiUrl}/theme-preferences`, { mode })
      .pipe(catchError(() => of(null)))
      .subscribe();
  }

  private loadMode(): ThemeMode {
    const stored = localStorage.getItem('niha0_theme_mode') as ThemeMode | null;
    return stored ?? 'AUTO';
  }

  private loadHighContrast(): boolean {
    return localStorage.getItem('niha0_a11y_contrast') === '1';
  }

  private resolveAuto(): ResolvedTheme {
    const hour = new Date().getHours();
    return hour >= 8 && hour < 20 ? 'SOLARPUNK' : 'CYBERPUNK';
  }

  /** Schedule exact switch at next 08:00 or 20:00 local time when AUTO. */
  private scheduleAutoSwitch(): void {
    if (this.autoTimer) {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }
    if (this.modeSignal() !== 'AUTO') return;

    const ms = this.msUntilNextBoundary();
    this.autoTimer = setTimeout(() => {
      this.clockTick.update((n) => n + 1);
      this.applyTheme(this.resolved());
      this.scheduleAutoSwitch();
    }, Math.max(ms, 1000));
  }

  private msUntilNextBoundary(): number {
    const now = new Date();
    const next = new Date(now);
    const h = now.getHours();
    if (h >= 8 && h < 20) {
      next.setHours(20, 0, 0, 0);
    } else if (h < 8) {
      next.setHours(8, 0, 0, 0);
    } else {
      next.setDate(next.getDate() + 1);
      next.setHours(8, 0, 0, 0);
    }
    return next.getTime() - now.getTime();
  }

  private applyTheme(theme: ResolvedTheme): void {
    const body = this.document.body;
    body.classList.remove('theme-cyberpunk', 'theme-solarpunk');
    body.classList.add(theme === 'SOLARPUNK' ? 'theme-solarpunk' : 'theme-cyberpunk');
    body.dataset['themeMode'] = this.modeSignal();
    this.applyHighContrast(this.highContrastSignal());
  }

  private applyHighContrast(enabled: boolean): void {
    this.document.body.classList.toggle('high-contrast', enabled);
  }
}
