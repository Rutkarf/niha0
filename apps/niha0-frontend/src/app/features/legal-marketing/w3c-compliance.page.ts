import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-w3c-compliance-page',
  imports: [RouterLink],
  template: `
    <div class="legal-page">
      <article class="legal-card card">
        <h1>Conformité W3C</h1>
        <p class="updated">Publication prochaine</p>

        <section>
          <h2>Statut</h2>
          <p>
            Cette page regroupera les rapports d'accessibilité et de conformité W3C / WCAG
            (validations HTML, audits axe et bonnes pratiques web).
          </p>
        </section>

        <p class="links">
          <a routerLink="/compliance/soc2-type-1">SOC 2 Type 1</a> ·
          <a routerLink="/compliance/owasp">OWASP</a> ·
          <a routerLink="/">Accueil</a>
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
export class W3cCompliancePage {}
