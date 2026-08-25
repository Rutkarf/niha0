import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terms-page',
  imports: [RouterLink],
  template: `
    <div class="legal-page">
      <article class="legal-card card">
        <h1>Conditions d'utilisation</h1>
        <p class="updated">Version 0.2.0 · 25 août 2026</p>

        <section>
          <h2>1. Objet</h2>
          <p>
            NIHAO est un SaaS B2B multi-tenant d'agents IA avec validation humaine (CEO/OWNER).
            L'utilisation implique l'acceptation de ces conditions générales d'utilisation.
          </p>
        </section>

        <section>
          <h2>2. Compte et accès</h2>
          <p>
            Chaque utilisateur est invité ou créé par un administrateur de l'organisation.
            Vous êtes responsable de la confidentialité de vos identifiants.
          </p>
        </section>

        <section>
          <h2>3. Agents IA</h2>
          <p>
            Les recommandations IA sont indicatives. Toute action impactant des données métier
            (CRM, facturation, juridique) requiert une validation humaine explicite.
          </p>
        </section>

        <section>
          <h2>4. Plans et facturation</h2>
          <p>
            Les plans FREE, PRO et BUSINESS définissent quotas agents, stockage et sièges.
            La facturation Stripe sera activée ultérieurement ; les entitlements actuels sont indicatifs.
          </p>
        </section>

        <p class="links">
          <a routerLink="/privacy">Politique de confidentialité</a> ·
          <a routerLink="/login">Connexion</a>
        </p>
      </article>
    </div>
  `,
  styles: [`
    .legal-page { min-height: 100vh; padding: 2rem 1.25rem; background: var(--gradient-page); }
    .legal-card { max-width: 680px; margin: 0 auto; padding: 1.75rem; }
    h1 { margin: 0 0 0.25rem; font-size: 1.5rem; }
    .updated { color: var(--text-muted); font-size: 0.8rem; margin: 0 0 1.5rem; }
    section { margin-bottom: 1.25rem; }
    h2 { font-size: 1rem; margin: 0 0 0.5rem; }
    p { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.55; }
    .links { margin-top: 1.5rem; font-size: 0.85rem; }
  `],
})
export class TermsPage {}
