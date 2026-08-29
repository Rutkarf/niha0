import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LocaleService } from '../../core/i18n/locale.service';
import { PublicSiteShellComponent } from './public-site-shell.component';

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink, PublicSiteShellComponent],
  template: `
    <app-public-site-shell>
      <div class="hero">
        <div class="brand-stack">
          <a routerLink="/use-cases" class="use-cases-link">Cas d’usage</a>
          <div class="acronym-stack" aria-label="Network Intelligence Hub Access Open">
            <span>Network</span>
            <span>Intelligence</span>
            <span class="hub">HUB</span>
            <span>Access</span>
            <div class="open-cta-block">
              <span class="open-line">Ope<span class="open-n">n<a routerLink="/register" class="btn btn-primary open-cta">{{ locale.t('getStarted') }}</a></span></span>
            </div>
          </div>
        </div>
      </div>
    </app-public-site-shell>
  `,
  styles: `
    :host {
      display: block;
    }
    .hero {
      flex: 1;
      display: grid;
      place-items: center;
      width: 100%;
      min-height: 0;
      overflow: hidden;
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
      padding-bottom: calc(2.35rem + 0.08rem);
    }
    .open-line {
      display: inline-block;
    }
    .open-n {
      position: relative;
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
      .brand-stack {
        transform: translate(-0.75rem, -0.85rem);
      }
      .use-cases-link {
        font-size: 0.88rem;
      }
    }
    @media (max-height: 720px) {
      .acronym-stack {
        font-size: clamp(0.88rem, 2vw, 1.15rem);
      }
      .brand-stack {
        transform: translate(-1rem, -0.75rem);
      }
      .open-cta-block {
        padding-bottom: calc(2rem + 0.08rem);
      }
      .open-cta {
        font-size: 0.82rem;
        min-height: 2rem;
        padding: 0.25rem 0.65rem;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .open-cta {
        animation: none;
      }
    }
  `,
})
export class LandingPage {
  readonly locale = inject(LocaleService);
}




