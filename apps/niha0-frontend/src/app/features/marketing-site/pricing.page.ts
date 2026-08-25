import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LocaleService } from '../../core/i18n/locale.service';

@Component({
  selector: 'app-pricing-page',
  imports: [RouterLink],
  template: `
    <div class="pricing">
      <header class="top">
        <a routerLink="/" class="brand">NIHAO</a>
        <nav>
          <a routerLink="/login" class="btn btn-ghost">{{ locale.t('signInCta') }}</a>
          <a routerLink="/register" class="btn btn-primary">{{ locale.t('getStarted') }}</a>
        </nav>
      </header>
      <h1>{{ locale.t('pricing') }}</h1>
      <p class="lead">Plans mensuels — paiement SumUp en production. Quotas sièges / stockage / IA appliqués.</p>
      <div class="grid">
        <article class="plan">
          <h2>FREE</h2>
          <p class="price">0 €</p>
          <ul>
            <li>3 sièges</li>
            <li>100 Mo stockage</li>
            <li>20 actions IA / jour</li>
          </ul>
          <a routerLink="/register" class="btn btn-ghost">Commencer</a>
        </article>
        <article class="plan featured">
          <h2>PRO</h2>
          <p class="price">49 €</p>
          <ul>
            <li>25 sièges</li>
            <li>5 Go stockage</li>
            <li>500 actions IA / jour</li>
          </ul>
          <a routerLink="/register" class="btn btn-primary">{{ locale.t('getStarted') }}</a>
        </article>
        <article class="plan">
          <h2>BUSINESS</h2>
          <p class="price">149 €</p>
          <ul>
            <li>100 sièges</li>
            <li>50 Go stockage</li>
            <li>5 000 actions IA / jour</li>
          </ul>
          <a routerLink="/register" class="btn btn-ghost">Commencer</a>
        </article>
      </div>
      <footer class="foot">
        <a routerLink="/">← Accueil</a>
        <a routerLink="/privacy">Confidentialité</a>
        <a routerLink="/terms">Conditions</a>
      </footer>
    </div>
  `,
  styles: `
    .pricing {
      min-height: 100vh;
      padding: 1.5rem clamp(1rem, 4vw, 3rem) 3rem;
      background:
        radial-gradient(ellipse 60% 40% at 90% 0%, color-mix(in oklab, var(--accent-primary) 12%, transparent), transparent),
        var(--bg-app, #f4f6f5);
      color: var(--text-primary, #14201c);
      font-family: var(--font-body, system-ui, sans-serif);
    }
    .top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .brand {
      font-family: var(--font-display, Georgia, serif);
      font-weight: 800;
      text-decoration: none;
      color: inherit;
    }
    nav {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    h1 {
      font-family: var(--font-display, Georgia, serif);
      margin-bottom: 0.5rem;
    }
    .lead {
      opacity: 0.8;
      margin-bottom: 2rem;
    }
    .grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }
    .plan {
      border: 1px solid color-mix(in oklab, currentColor 12%, transparent);
      border-radius: 12px;
      padding: 1.25rem;
      background: var(--bg-elevated, #fff);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .plan.featured {
      border-color: var(--accent-primary, #0f766e);
      box-shadow: 0 0 0 1px var(--accent-primary, #0f766e);
    }
    .price {
      font-size: 1.8rem;
      font-weight: 700;
      margin: 0;
    }
    ul {
      margin: 0;
      padding-left: 1.1rem;
      line-height: 1.6;
      flex: 1;
    }
    .plan .btn {
      align-self: flex-start;
      text-decoration: none;
    }
    .foot {
      display: flex;
      gap: 1.25rem;
      margin-top: 2.5rem;
      font-size: 0.9rem;
      opacity: 0.7;
    }
    .foot a {
      color: inherit;
    }
  `,
})
export class PricingPage {
  readonly locale = inject(LocaleService);
}
