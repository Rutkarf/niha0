import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-compliance-page',
  imports: [RouterLink],
  template: `
    <div class="legal-page">
      <article class="legal-card card">
        <h1>Conformité</h1>
        <p class="updated">Publication prochaine · SOC 2 Type 1 · W3C · OWASP</p>

        <section id="soc2-type-1">
          <h2>SOC 2 Type 1</h2>
          <p>
            Documentation de conformité SOC 2 Type 1 de NIHAO : périmètre des contrôles,
            attestations et preuves de sécurité pour les organisations clientes.
          </p>
        </section>

        <section id="w3c">
          <h2>W3C</h2>
          <p>
            Rapports d'accessibilité et de conformité W3C / WCAG : validations HTML,
            audits axe et bonnes pratiques web.
          </p>
        </section>

        <section id="owasp">
          <h2>OWASP</h2>
          <p>
            Pratiques de sécurité applicative alignées sur OWASP Top 10 : revues,
            durcissement, tests et mesures de mitigation.
          </p>
        </section>

        <p class="links">
          <a routerLink="/privacy">Confidentialité</a> ·
          <a routerLink="/terms">Conditions</a> ·
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
    section {
      margin-bottom: 1.25rem;
      scroll-margin-top: 1.5rem;
    }
    h2 { font-size: 1rem; margin: 0 0 0.5rem; }
    p { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.55; }
    .links { margin-top: 1.5rem; font-size: 0.85rem; }
  `],
})
export class CompliancePage {}
