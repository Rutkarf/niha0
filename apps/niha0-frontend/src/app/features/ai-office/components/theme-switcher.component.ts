import { Component, HostListener, inject, signal } from '@angular/core';
import { ThemeMode, ThemeService } from '../../../core/theme/theme.service';
import {
  loadScenePreset,
  presetLabel,
  saveScenePreset,
  type SceneVisualPreset,
} from '../three/scene-presets';

type ThemeMenuChoice = SceneVisualPreset | 'auto';

@Component({
  selector: 'app-theme-switcher',
  template: `
    <div class="theme-switcher" [class.open]="menuOpen()">
      <button
        type="button"
        class="theme-btn"
        [attr.aria-label]="'Thème courant : ' + currentLabel()"
        [attr.aria-expanded]="menuOpen()"
        aria-haspopup="menu"
        [title]="currentLabel()"
        (click)="toggleMenu($event)"
      >
        <span class="icon" aria-hidden="true">{{ icon() }}</span>
        <span class="label">{{ shortLabel() }}</span>
      </button>

      @if (menuOpen()) {
        <ul class="menu" role="menu">
          <li role="none">
            <button
              type="button"
              role="menuitemradio"
              [attr.aria-checked]="isChecked('solar')"
              (click)="pick('solar')"
            >
              Solar · jour
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitemradio"
              [attr.aria-checked]="isChecked('night')"
              (click)="pick('night')"
            >
              Night · ops
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitemradio"
              [attr.aria-checked]="isChecked('cyberpunk')"
              (click)="pick('cyberpunk')"
            >
              Cyberpunk · néon
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitemradio"
              [attr.aria-checked]="isChecked('corporate')"
              (click)="pick('corporate')"
            >
              Corporate · bureau
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitemradio"
              [attr.aria-checked]="isChecked('auto')"
              (click)="pick('auto')"
            >
              Auto · 08h / 20h
            </button>
          </li>
        </ul>
      }
    </div>
  `,
  styles: `
    .theme-switcher {
      position: relative;
      z-index: 30;
    }
    .theme-btn {
      height: 38px;
      padding: 0 0.7rem 0 0.55rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      background: var(--bg-elevated);
      color: var(--text-primary);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.78rem;
      font-weight: 650;
      box-shadow: var(--shadow-sm);
      transition: border-color var(--transition), background var(--transition),
        transform var(--transition);
    }
    .theme-btn:hover {
      border-color: var(--border-strong);
      background: var(--bg-hover);
    }
    .theme-btn:focus-visible {
      outline: 2px solid color-mix(in srgb, var(--accent-primary) 45%, transparent);
      outline-offset: 2px;
    }
    .theme-btn:active {
      transform: translateY(1px);
    }
    .icon { font-size: 0.95rem; line-height: 1; }
    .label { letter-spacing: 0.02em; }
    .menu {
      position: absolute;
      right: 0;
      top: calc(100% + 6px);
      margin: 0;
      padding: 0.35rem;
      list-style: none;
      min-width: 178px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
    }
    .menu button {
      width: 100%;
      text-align: left;
      border: none;
      background: transparent;
      color: var(--text-primary);
      padding: 0.5rem 0.65rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 0.78rem;
      font-weight: 500;
      transition: background var(--transition), color var(--transition);
    }
    .menu button[aria-checked='true'] {
      background: color-mix(in srgb, var(--accent-primary) 14%, transparent);
      color: var(--accent-primary);
      font-weight: 700;
    }
    .menu button:hover,
    .menu button:focus-visible {
      background: var(--bg-hover);
      outline: none;
    }
    .menu button:focus-visible {
      outline: 2px solid color-mix(in srgb, var(--accent-primary) 40%, transparent);
      outline-offset: 1px;
    }
  `,
})
export class ThemeSwitcherComponent {
  readonly theme = inject(ThemeService);
  readonly menuOpen = signal(false);

  icon(): string {
    if (this.theme.mode() === 'AUTO') return '◐';
    const preset = loadScenePreset();
    if (preset === 'solar') return '☀';
    if (preset === 'corporate') return '▣';
    if (preset === 'cyberpunk') return '⚡';
    return '☾';
  }

  shortLabel(): string {
    if (this.theme.mode() === 'AUTO') return 'Auto';
    return presetLabel(loadScenePreset());
  }

  currentLabel(): string {
    if (this.theme.mode() === 'AUTO') return this.theme.label();
    return presetLabel(loadScenePreset());
  }

  isChecked(choice: ThemeMenuChoice): boolean {
    if (choice === 'auto') return this.theme.mode() === 'AUTO';
    return this.theme.mode() !== 'AUTO' && loadScenePreset() === choice;
  }

  toggleMenu(ev: Event): void {
    ev.stopPropagation();
    this.menuOpen.update((v) => !v);
  }

  pick(choice: ThemeMenuChoice): void {
    if (choice === 'auto') {
      this.theme.setMode('AUTO' satisfies ThemeMode);
    } else {
      saveScenePreset(choice);
      if (choice === 'solar' || choice === 'corporate') {
        this.theme.setMode('SOLARPUNK');
      } else {
        this.theme.setMode('CYBERPUNK');
      }
    }
    this.menuOpen.set(false);
  }

  @HostListener('document:click')
  onDocClick(): void {
    this.menuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.menuOpen.set(false);
  }
}
