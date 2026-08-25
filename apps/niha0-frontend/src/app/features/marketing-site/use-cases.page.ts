import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-use-cases-page',
  imports: [RouterLink],
  template: `
    <div class="page">
      <header class="top">
        <a routerLink="/" class="brand">NIHAO</a>
        <nav>
          <a routerLink="/pricing">Tarifs</a>
          <a routerLink="/login" class="btn btn-ghost">Connexion</a>
          <a routerLink="/register" class="btn btn-primary">Commencer</a>
        </nav>
      </header>
      <h1>Cas d’usage</h1>
      <p class="lead">Trois wedges pour démarrer l’OS de travail agentique.</p>
      <div class="grid">
        <article>
          <h2>Commercial</h2>
          <p class="pack">Pack CRM + Sales</p>
          <p>
            Leads et opportunités centralisés, devis depuis Ventes, propositions agents validées
            dans l’AI Office. Le chat accélère le brief sans quitter le workspace.
          </p>
        </article>
        <article>
          <h2>Ops</h2>
          <p class="pack">Pack WMS + PIM</p>
          <p>
            Inventaire et mouvements WMS, référentiel produits / variantes PIM, alertes agent Stock,
            BI consolidé (produits, marketplace, runs).
          </p>
        </article>
        <article>
          <h2>Agents</h2>
          <p class="pack">Pack Studio + Marketplace</p>
          <p>
            Définir un graphe dans le Studio, publier en marketplace privé, installer pour les équipes,
            exécuter avec reprise humaine et gouvernance (guardrails, sandbox).
          </p>
        </article>
      </div>
      <footer class="foot">
        <a routerLink="/">← Accueil</a>
        <a routerLink="/pricing">Tarifs</a>
      </footer>
    </div>
  `,
  styles: `
    .page {
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
    nav {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      align-items: center;
    }
    nav a:not(.btn) {
      color: var(--text-primary);
    }
    .btn-ghost {
      color: var(--text-primary);
      border-color: var(--border-strong);
      background: color-mix(in srgb, var(--bg-elevated) 72%, transparent);
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
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    }
    article {
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.25rem;
      background: var(--bg-elevated);
    }
    h2 {
      margin: 0 0 0.35rem;
      font-size: 1.15rem;
    }
    .pack {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
    }
    article p:last-child {
      color: var(--text-secondary);
      line-height: 1.5;
    }
    .foot {
      margin-top: 2.5rem;
      display: flex;
      gap: 1rem;
    }
    .foot a {
      color: var(--text-secondary);
    }
    .foot a:hover {
      color: var(--text-primary);
    }
  `,
})
export class UseCasesPage {}
