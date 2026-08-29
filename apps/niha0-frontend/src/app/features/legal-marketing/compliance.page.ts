import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicSiteShellComponent } from '../marketing-site/public-site-shell.component';
import { PUBLIC_PAGE_SURFACE, PUBLIC_PRO_PANEL } from '../marketing-site/public-content.styles';

type ComplianceTab = 'overview' | 'soc2' | 'w3c' | 'owasp' | 'ops';

@Component({
  selector: 'app-compliance-page',
  imports: [RouterLink, PublicSiteShellComponent],
  template: `
    <app-public-site-shell pageTitle="Conformité" [compact]="true">
      <div class="page-surface">
        <header class="page-head">
          <div>
            <p class="page-kicker">Trust · Sécurité &amp; accessibilité</p>
            <h2 class="page-title">Programme de conformité</h2>
            <p class="page-lead">
              Cadre de contrôles NIHAO pour la sécurité, l’accessibilité et les bonnes pratiques
              applicatives — destiné aux équipes IT, RSSI et acheteurs.
            </p>
          </div>
          <div class="page-meta">
            <span class="meta-chip">SOC 2 Type 1 · en cours</span>
            <span class="meta-chip">WCAG 2.2</span>
            <span class="meta-chip">OWASP ASVS</span>
          </div>
        </header>

        <div class="pro-panel">
          <div class="pro-tabs" role="tablist" aria-label="Sections conformité">
            @for (tab of tabs; track tab.id) {
              <button
                type="button"
                role="tab"
                class="pro-tab"
                [class.is-active]="active() === tab.id"
                [attr.aria-selected]="active() === tab.id"
                (click)="active.set(tab.id)"
              >
                {{ tab.label }}
              </button>
            }
          </div>

          <div class="pro-body" role="tabpanel">
            @switch (active()) {
              @case ('overview') {
                <div class="pro-grid pro-grid--3">
                  <article class="pro-tile">
                    <span class="label">Vision</span>
                    <h3>Trust by design</h3>
                    <p>
                      Isolation multi-tenant, validation humaine des actions sensibles, auditabilité
                      et moindre privilège sont des exigences produit, pas des add-ons.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Statut</span>
                    <h3>Maturité</h3>
                    <ul>
                      <li>Contrôles techniques en place</li>
                      <li>Preuves consolidées pour Type 1</li>
                      <li>Rapports accessibilité / axe CI</li>
                    </ul>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Demande</span>
                    <h3>Due diligence</h3>
                    <p>
                      Questionnaire sécurité / DPA : <strong>security&#64;nihao.app</strong>. Pack
                      vendeur disponible pour comptes BUSINESS.
                    </p>
                  </article>
                </div>
              }
              @case ('soc2') {
                <div class="pro-grid">
                  <article class="pro-tile">
                    <span class="label">SOC 2</span>
                    <h3>Type 1 — périmètre</h3>
                    <p>
                      Contrôles sur sécurité, disponibilité et confidentialité du service NIHAO
                      (application, API, stockage, identité). Publication d’attestation prévue.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Contrôles</span>
                    <h3>Exemples</h3>
                    <ul>
                      <li>Gestion des accès &amp; MFA</li>
                      <li>Journalisation et revue d’audit</li>
                      <li>Gestion des changements &amp; CI</li>
                      <li>Sauvegarde / restauration testée</li>
                    </ul>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Clients</span>
                    <h3>Ce que vous obtenez</h3>
                    <p>
                      Rapport Type 1 (sous NDA), description du système, exceptions éventuelles et
                      plan d’actions associées.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Suite</span>
                    <h3>Type 2</h3>
                    <p>
                      Roadmap : observation sur période pour Type 2 après stabilisation des contrôles
                      Type 1.
                    </p>
                  </article>
                </div>
              }
              @case ('w3c') {
                <div class="pro-grid">
                  <article class="pro-tile">
                    <span class="label">Accessibilité</span>
                    <h3>WCAG / W3C</h3>
                    <p>
                      Objectif WCAG 2.2 AA sur les parcours critiques (auth, AI Office, formulaires
                      métier). Contrastes, focus visibles, labels ARIA.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Tests</span>
                    <h3>Outillage</h3>
                    <ul>
                      <li>Audits axe en e2e</li>
                      <li>Validation HTML / sémantique</li>
                      <li>Navigation clavier</li>
                    </ul>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Contenu 3D</span>
                    <h3>AI Office</h3>
                    <p>
                      Scène Three.js accompagnée d’alternatives textuelles / listes agents pour les
                      utilisateurs ne pouvant pas interagir avec le canevas.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Signalement</span>
                    <h3>Feedback a11y</h3>
                    <p>
                      Remonter un frein d’accessibilité : <strong>a11y&#64;nihao.app</strong> ou
                      Feedback in-app.
                    </p>
                  </article>
                </div>
              }
              @case ('owasp') {
                <div class="pro-grid">
                  <article class="pro-tile">
                    <span class="label">AppSec</span>
                    <h3>OWASP Top 10</h3>
                    <ul>
                      <li>Auth JWT / cookies HttpOnly selon mode</li>
                      <li>Contrôle d’accès tenant-aware</li>
                      <li>Validation entrée / sortie API</li>
                      <li>Protection CSRF &amp; rate limit</li>
                    </ul>
                  </article>
                  <article class="pro-tile">
                    <span class="label">ASVS</span>
                    <h3>Référentiel</h3>
                    <p>
                      Alignement progressif ASVS sur les domaines identité, session, API et
                      configuration. Revues de code sur les modules sensibles.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">IA</span>
                    <h3>Risques agents</h3>
                    <p>
                      Prompt injection, exfiltration et actions non autorisées mitigés via
                      guardrails, scopes et validation humaine obligatoire.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Tests</span>
                    <h3>Assurance</h3>
                    <ul>
                      <li>CI lint / tests unitaires &amp; intégration</li>
                      <li>Scans dépendances</li>
                      <li>Pentest ciblé (roadmap)</li>
                    </ul>
                  </article>
                </div>
              }
              @default {
                <div class="pro-grid">
                  <article class="pro-tile">
                    <span class="label">Ops</span>
                    <h3>Exploitation</h3>
                    <ul>
                      <li>Monitoring &amp; alertes</li>
                      <li>Procédures incident</li>
                      <li>Séparation env. / secrets</li>
                    </ul>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Privacy</span>
                    <h3>RGPD</h3>
                    <p>
                      Voir la
                      <a routerLink="/privacy">politique de confidentialité</a>
                      : DPA, sous-traitants, droits et conservation.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Continu</span>
                    <h3>Amélioration</h3>
                    <p>
                      Backlog sécurité priorisé, post-mortems blameless, formation des équipes
                      produit / engineering.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Contact</span>
                    <h3>Équipe Trust</h3>
                    <p>
                      <strong>security&#64;nihao.app</strong> ·
                      <strong>privacy&#64;nihao.app</strong>
                    </p>
                  </article>
                </div>
              }
            }

            <div class="pro-foot">
              <span>Documents Trust · mise à jour continue</span>
              <a routerLink="/privacy">Politique de confidentialité →</a>
            </div>
          </div>
        </div>
      </div>
    </app-public-site-shell>
  `,
  styles: [PUBLIC_PAGE_SURFACE, PUBLIC_PRO_PANEL],
})
export class CompliancePage {
  readonly active = signal<ComplianceTab>('overview');
  readonly tabs: { id: ComplianceTab; label: string }[] = [
    { id: 'overview', label: 'Vue d’ensemble' },
    { id: 'soc2', label: 'SOC 2' },
    { id: 'w3c', label: 'Accessibilité' },
    { id: 'owasp', label: 'OWASP' },
    { id: 'ops', label: 'Ops & Privacy' },
  ];
}
