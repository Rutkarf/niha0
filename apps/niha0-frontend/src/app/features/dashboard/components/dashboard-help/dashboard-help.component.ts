import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-help',
  imports: [RouterLink],
  template: `
    <article class="help-doc">
      <h2>Documentation Dashboard Nihao</h2>
      <p>
        Ce dashboard centralise la vue d'ensemble KPIs, la liste des 50 agents (40 membres + 10 chefs),
        les équipes, les analytics et les paramètres — sans modifier la scène 3D de l'AI Office.
      </p>

      <section>
        <h3>Navigation</h3>
        <ul>
          <li><strong>Vue 3D Nihao</strong> — ouvre l'AI Office avec bureaux, tapis vert, plateforme chefs et LEDs.</li>
          <li><strong>Agents</strong> — tableau filtrable, tri, pagination et export CSV.</li>
          <li><strong>Équipes</strong> — 10 cartes avec stats et modal détail.</li>
          <li><strong>Chefs</strong> — fiches des responsables sur la plateforme murale.</li>
          <li><strong>Analytics</strong> — KPIs Nihao + graphiques CSS.</li>
        </ul>
      </section>

      <section>
        <h3>Interactions 3D (AI Office)</h3>
        <ul>
          <li>Clic bureau → panneau agent (nom, rôle, statut LED)</li>
          <li>Clic chef → panneau équipe / validation</li>
          <li>Molette → zoom · drag → rotation · boutons vue d'ensemble dans l'AI Office</li>
          <li>LED verte = autonome · LED rouge = validation humaine requise</li>
        </ul>
        <a routerLink="/app/ai-office" class="btn btn-primary">Ouvrir l'AI Office</a>
      </section>

      <section>
        <h3>Raccourcis</h3>
        <ul>
          <li><code>O</code> — AI Office (depuis le shell)</li>
          <li><code>Ctrl+K</code> — recherche globale (topbar)</li>
          <li><code>Échap</code> — fermer modals / panneaux</li>
        </ul>
      </section>

      <section>
        <h3>Support</h3>
        <p>
          <a routerLink="/app/help">Centre d'aide</a> ·
          <a routerLink="/app/feedback">Feedback</a> ·
          <a routerLink="/app/changelog">Changelog</a>
        </p>
      </section>
    </article>
  `,
  styles: [`
    .help-doc { max-width: 640px; }
    h2 { margin: 0 0 var(--space-3); }
    section { margin-bottom: var(--space-4); }
    h3 { font-size: var(--fs-sm); text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
    ul { padding-left: 1.2rem; color: var(--text-secondary); font-size: var(--fs-sm); }
    p { color: var(--text-secondary); font-size: var(--fs-sm); line-height: var(--lh-relaxed); }
    code { font-family: var(--font-mono); font-size: 0.8em; }
  `],
})
export class DashboardHelpComponent {}
