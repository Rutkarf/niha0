import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy-policy-page',
  imports: [RouterLink],
  template: `
    <div class="legal-page">
      <article class="legal-card card">
        <h1>Politique de confidentialité</h1>
        <p class="updated">Dernière mise à jour · 25 août 2026</p>

        <section>
          <h2>1. Responsable du traitement</h2>
          <p>
            NIHAO (Network Intelligence Hub Access Open) traite vos données en qualité de sous-traitant
            pour votre organisation cliente, conformément au RGPD (UE 2016/679).
          </p>
        </section>

        <section>
          <h2>2. Données collectées</h2>
          <ul>
            <li>Identité : nom, prénom, email professionnel</li>
            <li>Données d'usage : logs d'audit, événements applicatifs</li>
            <li>Documents uploadés par votre organisation (RAG, stockage objet)</li>
            <li>Cookies essentiels de session et préférences (thème, langue)</li>
          </ul>
        </section>

        <section>
          <h2>3. Vos droits</h2>
          <p>
            Export JSON et demande d'effacement disponibles dans Paramètres → Confidentialité.
            Contact DPO : privacy&#64;nihao.app
          </p>
        </section>

        <section>
          <h2>4. Sous-traitants</h2>
          <p>Hébergement cloud UE, stockage objet chiffré, provider email transactionnel (invitations, reset MDP).</p>
        </section>

        <p class="links">
          <a routerLink="/terms">Conditions d'utilisation</a> ·
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
    p, li { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.55; }
    ul { margin: 0; padding-left: 1.25rem; }
    .links { margin-top: 1.5rem; font-size: 0.85rem; }
  `],
})
export class PrivacyPolicyPage {}
