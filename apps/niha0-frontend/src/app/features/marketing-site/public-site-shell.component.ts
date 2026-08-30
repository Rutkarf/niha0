import { Component, computed, inject, Input } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { LocaleService } from '../../core/i18n/locale.service';

/**
 * Chrome partagé des pages publiques (landing, auth guest, legal, use-cases).
 * Manifesto + header NIHAO + footer légal — même look que localhost:/
 */
@Component({
  selector: 'app-public-site-shell',
  imports: [RouterLink],
  template: `
    <div class="site" [class.site--compact]="compact" [class.site--home]="isHome()">
      @if (isHome()) {
        <h1 class="manifesto" aria-label="Not For Human Conception">
          @for (word of manifestoWords; track $index; let last = $last) {
            @for (letter of word; track $index) {
              <span>{{ letter }}</span>
            }
            @if (!last) {
              <span class="manifesto-gap" aria-hidden="true"></span>
            }
          }
        </h1>
      } @else {
        <a routerLink="/" class="manifesto manifesto--link" aria-label="Retour à l’accueil">
          @for (word of manifestoWords; track $index; let last = $last) {
            @for (letter of word; track $index) {
              <span>{{ letter }}</span>
            }
            @if (!last) {
              <span class="manifesto-gap" aria-hidden="true"></span>
            }
          }
        </a>
      }

      <header class="top">
        <a routerLink="/" class="brand" [attr.aria-label]="isHome() ? 'NIHAO' : 'NIHAO — Retour à l’accueil'">NIHAO</a>
        <nav>
          @if (isHome()) {
            <a routerLink="/login" class="shell-continue-link">Continuer vers l’inscription →</a>
          } @else if (continueSignupParams) {
            <a
              [routerLink]="['/register']"
              [queryParams]="continueSignupParams"
              class="shell-continue-link"
            >
              Continuer vers l’inscription →
            </a>
          }
          <a routerLink="/login" class="btn btn-ghost">{{ locale.t('signInCta') }}</a>
        </nav>
      </header>

      <main class="body" [attr.aria-label]="pageTitle || null">
        <ng-content />
      </main>

      <footer class="foot">
        <a routerLink="/privacy" class="foot-privacy">Confidentialité</a>
        <div class="foot-legal">
          <a routerLink="/terms">Conditions</a>
          <a routerLink="/compliance">Conformité</a>
          <a routerLink="/cgu">CGU</a>
        </div>
      </footer>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100dvh;
      max-height: 100dvh;
      overflow: hidden;
    }
    .site {
      --rail: clamp(1.8rem, 3vw, 2.4rem);
      position: fixed;
      inset: 0;
      height: 100dvh;
      max-height: 100dvh;
      overflow: hidden;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      padding: 1.25rem clamp(1rem, 4vw, 3rem) max(0.35rem, env(safe-area-inset-bottom, 0px));
      padding-left: calc(var(--rail) + 1.1rem);
      background: var(--gradient-page);
      color: var(--text-primary);
      font-family: var(--font-body, system-ui, sans-serif);
    }
    .site:not(.site--home) {
      padding-top: 0.85rem;
      padding-bottom: 0.2rem;
    }
    .manifesto {
      position: absolute;
      top: 50%;
      left: clamp(0.15rem, 1vw, 0.45rem);
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 0;
      padding: 0;
      font-family: 'Orbit', var(--font-display, sans-serif);
      font-size: clamp(0.68rem, 1.4vw, 0.88rem);
      font-weight: 800;
      letter-spacing: 0.04em;
      line-height: 1.05;
      color: color-mix(in srgb, var(--text-primary) 55%, transparent);
      transform: translateY(-50%);
      pointer-events: none;
      text-decoration: none;
      user-select: none;
    }
    .manifesto--link {
      pointer-events: auto;
      cursor: pointer;
      transition: opacity 0.15s ease, color 0.15s ease;
      color: color-mix(in srgb, var(--text-primary) 72%, transparent);
    }
    .manifesto--link:hover {
      opacity: 1;
      color: var(--text-primary);
    }
    .manifesto--link:focus-visible {
      outline: 2px solid var(--accent-primary);
      outline-offset: 4px;
      border-radius: 4px;
    }
    .manifesto span {
      display: block;
    }
    .manifesto-gap {
      display: block;
      height: 0.65em;
    }
    .top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-shrink: 0;
      animation: rise 0.55s ease-out both;
    }
    .brand {
      font-family: var(--font-display, Georgia, serif);
      font-weight: 800;
      font-size: 1.4rem;
      text-decoration: none;
      color: var(--text-primary);
      letter-spacing: 0.04em;
      cursor: pointer;
      transition: opacity 0.15s ease;
    }
    .brand:hover {
      opacity: 0.82;
      color: var(--text-primary);
    }
    .brand:focus-visible {
      outline: 2px solid var(--accent-primary);
      outline-offset: 4px;
      border-radius: 4px;
    }
    nav {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .shell-continue-link {
      appearance: none;
      border: 0;
      background: transparent;
      padding: 0.15rem 0;
      font-family: var(--font-body, system-ui, sans-serif);
      font-size: clamp(0.72rem, 1.2vw, 0.82rem);
      font-weight: 700;
      line-height: 1.2;
      color: var(--accent-primary);
      text-decoration: none;
      white-space: nowrap;
      cursor: pointer;
      transition:
        color 0.15s ease,
        transform 0.15s ease;
    }
    .shell-continue-link:hover {
      text-decoration: underline;
      transform: translateX(2px);
      color: var(--accent-primary);
    }
    .shell-continue-link:focus-visible {
      outline: 2px solid var(--accent-primary);
      outline-offset: 3px;
      border-radius: 4px;
    }
    nav a:not(.btn) {
      color: var(--text-primary);
      text-decoration: none;
      opacity: 0.9;
    }
    .btn-ghost {
      color: var(--text-primary);
      border-color: var(--border-strong);
      background: color-mix(in srgb, var(--bg-elevated) 72%, transparent);
    }
    .body {
      position: relative;
      z-index: 2;
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
      width: 100%;
      animation: rise 0.7s 0.08s ease-out both;
    }
    .body > * {
      flex: 1;
      min-height: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .foot {
      position: relative;
      z-index: 2;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem 1.25rem;
      width: 100%;
      margin-top: auto;
      padding: 0.45rem 0 max(0.35rem, env(safe-area-inset-bottom, 0px));
      font-size: 0.82rem;
      animation: rise 0.6s 0.16s ease-out both;
    }
    .foot-legal {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: flex-end;
      gap: 0.65rem 1rem;
    }
    .foot-privacy {
      flex-shrink: 0;
      font-weight: 600;
    }
    .foot a {
      color: var(--text-secondary);
      text-decoration: none;
    }
    .foot a:hover {
      color: var(--text-primary);
    }
    @keyframes rise {
      from {
        transform: translateY(10px);
        opacity: 0;
      }
      to {
        transform: none;
        opacity: 1;
      }
    }
    @media (max-width: 40rem) {
      .site {
        padding-left: calc(var(--rail) + 0.75rem);
      }
      .manifesto {
        font-size: 0.68rem;
        left: 0.1rem;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .top,
      .body,
      .foot {
        animation: none;
      }
      .shell-continue-link:hover {
        transform: none;
      }
    }
  `,
})
export class PublicSiteShellComponent {
  readonly locale = inject(LocaleService);
  private readonly router = inject(Router);

  /** Optional aria-label for the main region. */
  @Input() pageTitle = '';

  /** Reserved for denser legal layouts (no visual change yet beyond hook). */
  @Input() compact = false;

  /** Login page — lien inscription avec profil / plan sélectionnés. */
  @Input() continueSignupParams: Record<string, string> | null = null;

  readonly manifestoWords = ['NOT', 'FOR', 'HUMAN', 'CONCEPTION'].map((word) => word.split(''));

  private readonly currentPath = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.normalizePath(this.router.url)),
      startWith(this.normalizePath(this.router.url)),
    ),
    { initialValue: this.normalizePath(this.router.url) },
  );

  readonly isHome = computed(() => this.currentPath() === '/');

  private normalizePath(url: string): string {
    const path = url.split('?')[0]?.split('#')[0] ?? '/';
    return path === '' ? '/' : path;
  }
}
