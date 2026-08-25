import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-help-page',
  imports: [RouterLink],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <a routerLink="/app/ai-office" class="back-ao">← AI Office</a>
          <h1>Centre d'aide</h1>
          <p>FAQ — authentification, AI Office, validations, uploads, facturation</p>
        </div>
      </header>

      @for (item of faq; track item.q) {
        <section class="card faq-item">
          <h2>{{ item.q }}</h2>
          <p>{{ item.a }}</p>
        </section>
      }

      <p class="footer-link">
        Besoin d'aide supplémentaire ?
        <a routerLink="/app/feedback">Envoyer un feedback</a>
      </p>
    </div>
  `,
  styles: [`
    .faq-item { padding: 1rem 1.15rem; margin-bottom: 0.75rem; max-width: 640px; }
    .faq-item h2 { margin: 0 0 0.5rem; font-size: 0.95rem; }
    .faq-item p { margin: 0; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; }
    .footer-link { font-size: 0.85rem; color: var(--text-muted); margin-top: 1rem; }
  `],
})
export class HelpPage {
  readonly faq = [
    {
      q: 'Comment me connecter ?',
      a: 'Utilisez l\'email professionnel de votre organisation. En cas d\'oubli, la page « Mot de passe oublié » envoie un lien de réinitialisation.',
    },
    {
      q: 'Qu\'est-ce que l\'AI Office ?',
      a: 'C\'est le hub 3D où vos agents IA travaillent. Cliquez sur un bureau pour ouvrir le module CRM, Support, Comptabilité, etc. Touche O pour y revenir.',
    },
    {
      q: 'Comment valider une action agent ?',
      a: 'Les propositions en attente apparaissent dans la cloche et sur AI Office. En tant que CEO/OWNER, vous pouvez approuver, rejeter ou différer avant exécution.',
    },
    {
      q: 'Comment importer des documents entreprise ?',
      a: 'Allez dans Données entreprise (/app/company-data) pour uploader PDF, CSV ou texte. Ils alimentent la recherche RAG des agents.',
    },
    {
      q: 'Facturation et plans',
      a: 'Les plans FREE, PRO et BUSINESS sont configurables dans Paramètres (OWNER). L\'intégration Stripe arrive prochainement — les quotas sont déjà visibles.',
    },
  ];
}
