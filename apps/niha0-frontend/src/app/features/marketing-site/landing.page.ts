import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LocaleService } from '../../core/i18n/locale.service';
import { AuthService } from '../../core/auth/auth.service';
import { AuthDrawerComponent } from '../auth/auth-drawer/auth-drawer.component';

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink, AuthDrawerComponent],
  template: `
    <div class="landing">
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

      <header class="top">
        <a routerLink="/" class="brand">NIHAO</a>
        <nav>
          <a routerLink="/pricing">{{ locale.t('pricing') }}</a>
          <button type="button" class="btn btn-ghost" (click)="openLogin()">
            {{ locale.t('signInCta') }}
          </button>
        </nav>
      </header>

      <main class="hero">
        <div class="brand-stack">
          <a routerLink="/use-cases" class="use-cases-link">Cas d’usage</a>
          <div class="acronym-stack" aria-label="Network Intelligence Hub Access Open">
            <span>Network</span>
            <span>Intelligence</span>
            <span class="hub">HUB</span>
            <span>Access</span>
            <div class="open-cta-block">
              <span class="open-line">Open</span>
              <a routerLink="/register" class="btn btn-primary open-cta">{{ locale.t('getStarted') }}</a>
            </div>
          </div>
        </div>
      </main>

      <footer class="foot">
        <div class="foot-legal">
          <a routerLink="/terms">Conditions</a>
          <a routerLink="/compliance">Conformité</a>
          <a routerLink="/terms">CGU</a>
        </div>
        <a routerLink="/privacy" class="foot-privacy">Confidentialité</a>
      </footer>

      <app-auth-drawer />
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .landing {
      --rail: clamp(1.8rem, 3vw, 2.4rem);
      position: relative;
      min-height: 100vh;
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      padding: 1.25rem clamp(1rem, 4vw, 3rem) max(0.35rem, env(safe-area-inset-bottom, 0px));
      padding-left: calc(var(--rail) + 1.1rem);
      background: var(--gradient-page);
      color: var(--text-primary);
      font-family: var(--font-body, system-ui, sans-serif);
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
      font-size: clamp(0.72rem, 1.6vw, 0.95rem);
      font-weight: 800;
      letter-spacing: 0.04em;
      line-height: 1.05;
      color: var(--text-primary);
      transform: translateY(-50%);
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
      animation: rise 0.55s ease-out both;
    }
    .brand {
      font-family: var(--font-display, Georgia, serif);
      font-weight: 800;
      font-size: 1.4rem;
      text-decoration: none;
      color: var(--text-primary);
      letter-spacing: 0.04em;
    }
    nav {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
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
    .hero {
      position: relative;
      flex: 1;
      display: grid;
      place-items: center;
      width: 100%;
      min-height: 0;
      animation: rise 0.7s 0.08s ease-out both;
    }
    .use-cases-link {
      align-self: flex-start;
      margin: 0 0 0.55rem;
      color: var(--text-primary);
      text-decoration: none;
      opacity: 0.9;
      font-size: 0.95rem;
      white-space: nowrap;
      transform: translateX(calc(-100% - var(--letter-crank)));
    }
    .use-cases-link:hover {
      opacity: 1;
      color: var(--text-primary);
    }
    .brand-stack {
      --letter-crank: 0.65em;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      width: max-content;
      max-width: calc(100% - 1rem);
      transform: translate(-1.75rem, -1.35rem);
    }
    .acronym-stack {
      display: flex;
      flex-direction: column;
      gap: 0.08rem;
      font-family: var(--font-display, Georgia, serif);
      font-size: clamp(1.05rem, 2.4vw, 1.45rem);
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      line-height: 1.2;
      color: var(--accent-primary);
    }
    .acronym-stack .hub {
      font-weight: 800;
      letter-spacing: 0.22em;
    }
    .open-cta-block {
      position: relative;
      display: inline-block;
      /* Réserve la place du bouton sous « Open » (hors flux absolu). */
      padding-bottom: calc(2.85rem + 0.08rem);
    }
    .open-line {
      display: inline-block;
    }
    .open-cta {
      position: absolute;
      top: calc(100% + 0.08rem);
      left: calc(100% + var(--letter-crank));
      margin: 0;
      animation: pulse 2.4s ease-in-out infinite;
      white-space: nowrap;
    }
    .foot {
      position: relative;
      display: flex;
      align-items: end;
      justify-content: flex-end;
      width: 100%;
      margin-top: auto;
      padding: 0.35rem 0 max(0.35rem, env(safe-area-inset-bottom, 0px));
      font-size: 0.9rem;
      animation: rise 0.6s 0.16s ease-out both;
    }
    .foot-legal {
      display: flex;
      flex-wrap: wrap;
      align-items: end;
      justify-content: flex-end;
      gap: 0.65rem 1rem;
      margin-left: auto;
    }
    .foot-privacy {
      position: absolute;
      left: 50%;
      bottom: max(0.35rem, env(safe-area-inset-bottom, 0px));
      transform: translateX(-50%);
    }
    .foot a {
      color: var(--text-secondary);
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
    @keyframes pulse {
      0%,
      100% {
        box-shadow: 0 0 0 0 color-mix(in oklab, var(--accent-primary, #0f766e) 0%, transparent);
      }
      50% {
        box-shadow: 0 0 0 6px color-mix(in oklab, var(--accent-primary, #0f766e) 18%, transparent);
      }
    }
    @media (max-width: 40rem) {
      .landing {
        padding-left: calc(var(--rail) + 0.75rem);
      }
      .manifesto {
        font-size: 0.68rem;
        left: 0.1rem;
      }
      .brand-stack {
        transform: translate(-0.75rem, -0.85rem);
      }
      .use-cases-link {
        font-size: 0.88rem;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .top,
      .hero,
      .foot,
      .open-cta {
        animation: none;
      }
    }
  `,
})
export class LandingPage {
  readonly locale = inject(LocaleService);
  private readonly auth = inject(AuthService);

  readonly manifestoWords = ['NOT', 'FOR', 'HUMAN', 'CONCEPTION'].map((word) => word.split(''));

  openLogin(): void {
    this.auth.openDrawer('login');
  }
}
