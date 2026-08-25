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

      <h2 class="packs-title">Packs modulaires</h2>
      <p class="packs-note">Inclus BUSINESS · add-on PRO</p>
      <div class="grid packs">
        <article class="plan pack">
          <h2>Pack CRM + Sales</h2>
          <p>Pipeline clients, leads, opportunités et devis — hub commercial unifié.</p>
        </article>
        <article class="plan pack">
          <h2>Pack Ops (WMS + PIM)</h2>
          <p>Stock, mouvements et référentiel produits / variantes pour l’opérationnel.</p>
        </article>
        <article class="plan pack">
          <h2>Pack Agents Studio + Marketplace</h2>
          <p>Studio de graphes agents, publication privée et installation marketplace.</p>
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
      padding: 1.5rem clamp(1rem, 4vw, 3rem) 5.5rem;
      background: var(--gradient-page);
      color: var(--text-primary);
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
      color: var(--text-primary);
    }
    .btn-ghost {
      color: var(--text-primary);
      border-color: var(--border-strong);
      background: color-mix(in srgb, var(--bg-elevated) 72%, transparent);
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
      color: var(--text-secondary);
      margin-bottom: 2rem;
    }
    .grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }
    .plan {
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.25rem;
      background: var(--bg-elevated);
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
    .packs-title {
      font-family: var(--font-display, Georgia, serif);
      margin: 2.5rem 0 0.35rem;
      font-size: 1.35rem;
    }
    .packs-note {
      color: var(--text-muted);
      margin: 0 0 1rem;
      font-size: 0.9rem;
    }
    .pack p {
      margin: 0;
      color: var(--text-secondary);
      line-height: 1.5;
      font-size: 0.95rem;
    }
    .foot {
      display: flex;
      gap: 1.25rem;
      margin-top: 2.5rem;
      font-size: 0.9rem;
    }
    .foot a {
      color: var(--text-secondary);
    }
    .foot a:hover {
      color: var(--text-primary);
    }
  `,
})
export class PricingPage {
  readonly locale = inject(LocaleService);
}
