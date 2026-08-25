import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LocaleService } from '../../core/i18n/locale.service';

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink],
  template: `
    <div class="landing">
      <header class="top">
        <a routerLink="/" class="brand">NIHAO</a>
        <nav>
          <a routerLink="/pricing">{{ locale.t('pricing') }}</a>
          <a routerLink="/login" class="btn btn-ghost">{{ locale.t('signInCta') }}</a>
          <a routerLink="/register" class="btn btn-primary">{{ locale.t('getStarted') }}</a>
        </nav>
      </header>
      <main class="hero">
        <p class="eyebrow">Network Intelligence Hub Access Open</p>
        <h1>Le centre de contrôle où l’IA propose et le CEO valide</h1>
        <p class="lead">
          SaaS B2B multi-tenant : AI Office 3D, CRM, ventes, support, comptabilité — avec validation humaine
          sur chaque action sensible.
        </p>
        <div class="cta">
          <a routerLink="/register" class="btn btn-primary">{{ locale.t('getStarted') }}</a>
          <a routerLink="/pricing" class="btn btn-ghost">{{ locale.t('pricing') }}</a>
        </div>
      </main>
      <footer class="foot">
        <a routerLink="/privacy">Confidentialité</a>
        <a routerLink="/terms">Conditions</a>
      </footer>
    </div>
  `,
  styles: `
    .landing {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      padding: 1.5rem clamp(1rem, 4vw, 3rem) 2rem;
      background:
        radial-gradient(ellipse 80% 50% at 10% 0%, color-mix(in oklab, var(--accent-primary) 18%, transparent), transparent),
        linear-gradient(165deg, color-mix(in oklab, var(--bg-app, #f4f6f5) 92%, #c8ddd4), var(--bg-app, #f4f6f5));
      color: var(--text-primary, #14201c);
      font-family: var(--font-body, system-ui, sans-serif);
    }
    .top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 4rem;
      animation: rise 0.55s ease-out both;
    }
    .brand {
      font-family: var(--font-display, Georgia, serif);
      font-weight: 800;
      font-size: 1.4rem;
      text-decoration: none;
      color: inherit;
      letter-spacing: 0.04em;
    }
    nav {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
    }
    nav a:not(.btn) {
      color: inherit;
      text-decoration: none;
      opacity: 0.8;
    }
    .hero {
      max-width: 40rem;
      flex: 1;
      animation: rise 0.7s 0.08s ease-out both;
    }
    .eyebrow {
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-size: 0.75rem;
      opacity: 0.65;
    }
    h1 {
      font-family: var(--font-display, Georgia, serif);
      font-size: clamp(2rem, 5vw, 3.2rem);
      line-height: 1.1;
      margin: 0.5rem 0 1rem;
    }
    .lead {
      font-size: 1.1rem;
      line-height: 1.55;
      opacity: 0.85;
      margin-bottom: 1.75rem;
    }
    .cta {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .cta .btn-primary {
      animation: pulse 2.4s ease-in-out infinite;
    }
    .foot {
      display: flex;
      gap: 1.25rem;
      margin-top: 3rem;
      font-size: 0.9rem;
      opacity: 0.7;
      animation: rise 0.6s 0.16s ease-out both;
    }
    .foot a {
      color: inherit;
    }
    @keyframes rise {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: none;
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
    @media (prefers-reduced-motion: reduce) {
      .top,
      .hero,
      .foot,
      .cta .btn-primary {
        animation: none;
      }
    }
  `,
})
export class LandingPage {
  readonly locale = inject(LocaleService);
}
