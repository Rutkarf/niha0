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
          <p>FAQ, raccourcis clavier et guides rapides</p>
        </div>
      </header>

      <section class="card guide">
        <h2 class="section-title">Raccourcis</h2>
        <ul class="shortcuts">
          <li><kbd>O</kbd> Retour AI Office</li>
          <li><kbd>Ctrl</kbd> + <kbd>K</kbd> Recherche globale</li>
          <li><kbd>Esc</kbd> Fermer menus / dialogs</li>
        </ul>
      </section>

      @for (item of faq; track item.q) {
        <details class="card faq-item">
          <summary>{{ item.q }}</summary>
          <p>{{ item.a }}</p>
        </details>
      }

      <p class="footer-link">
        Besoin d'aide supplémentaire ?
        <a routerLink="/app/feedback">Envoyer un feedback</a>
        · <a routerLink="/app/changelog">Changelog</a>
      </p>
    </div>
  `,
  styles: [`
    .guide { max-width: 640px; margin-bottom: 0.75rem; }
    .shortcuts { margin: 0; padding-left: 1.1rem; color: var(--text-secondary); font-size: var(--fs-md); }
    .shortcuts li { margin-bottom: 0.35rem; }
    kbd {
      font-family: var(--font-mono);
      font-size: var(--fs-xs);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 0.1rem 0.35rem;
      background: var(--bg-primary);
    }
    .faq-item { padding: 0.85rem 1.15rem; margin-bottom: 0.55rem; max-width: 640px; }
    .faq-item summary {
      cursor: pointer;
      font-weight: 650;
      font-size: 0.95rem;
      color: var(--text-primary);
    }
    .faq-item p { margin: 0.55rem 0 0; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; }
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
    {
      q: 'Thèmes et accessibilité',
      a: 'Solar / Night / Auto depuis la sidebar ou Paramètres. Activez le contraste élevé pour un affichage WCAG plus strict. Les animations respectent prefers-reduced-motion.',
    },
  ];
}
