import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicSiteShellComponent } from '../marketing-site/public-site-shell.component';
import { PUBLIC_PAGE_SURFACE, PUBLIC_PRO_PANEL } from '../marketing-site/public-content.styles';

type TermsTab = 'object' | 'account' | 'agents' | 'billing' | 'liability';

@Component({
  selector: 'app-terms-page',
  imports: [RouterLink, PublicSiteShellComponent],
  template: `
    <app-public-site-shell pageTitle="Conditions" [compact]="true">
      <div class="page-surface">
        <header class="page-head">
          <div>
            <p class="page-kicker">Légal · Contrat SaaS</p>
            <h2 class="page-title">Conditions d’utilisation</h2>
            <p class="page-lead">
              Cadre contractuel d’accès à NIHAO : compte, agents IA, validation humaine, plans et
              responsabilités des parties.
            </p>
          </div>
          <div class="page-meta">
            <span class="meta-chip">Version 0.3.0</span>
            <span class="meta-chip">25 août 2026</span>
            <span class="meta-chip">B2B</span>
          </div>
        </header>

        <div class="pro-panel">
          <div class="pro-tabs" role="tablist" aria-label="Sections conditions">
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
              @case ('object') {
                <div class="pro-grid">
                  <article class="pro-tile">
                    <span class="label">Service</span>
                    <h3>Objet</h3>
                    <p>
                      NIHAO est une plateforme SaaS multi-tenant d’orchestration d’agents IA avec
                      gouvernance humaine (CEO / OWNER). Elle couvre AI Office, CRM, modules ERP et
                      workflows d’approbation.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Acceptation</span>
                    <h3>Entrée en vigueur</h3>
                    <p>
                      La création d’un espace, l’acceptation d’une invitation ou l’utilisation de
                      l’API vaut acceptation des présentes conditions et des
                      <a routerLink="/cgu">CGU</a> associées.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Public</span>
                    <h3>Usage professionnel</h3>
                    <p>
                      Le service est réservé aux professionnels. L’abonné garantit disposer de
                      l’autorité pour engager son organisation.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Documents</span>
                    <h3>Hiérarchie</h3>
                    <ul>
                      <li>Bon de commande / plan souscrit</li>
                      <li>Conditions d’utilisation</li>
                      <li>CGU &amp; politique de confidentialité</li>
                    </ul>
                  </article>
                </div>
              }
              @case ('account') {
                <div class="pro-grid">
                  <article class="pro-tile">
                    <span class="label">Accès</span>
                    <h3>Comptes &amp; rôles</h3>
                    <ul>
                      <li>Invitation ou self-serve register</li>
                      <li>Rôles : OWNER, ADMIN, métiers, VIEWER…</li>
                      <li>Isolation stricte par organisation (tenant)</li>
                    </ul>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Sécurité</span>
                    <h3>Identifiants</h3>
                    <p>
                      Vous protégez vos identifiants, activez la MFA si disponible, et signalez
                      immédiatement tout accès non autorisé. Les actions réalisées sous votre compte
                      vous sont imputables.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Contenu</span>
                    <h3>Données client</h3>
                    <p>
                      Vous restez propriétaire des données importées. Vous garantissez disposer des
                      droits nécessaires et vous vous engagez à ne pas uploader de contenus illicites.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Suspension</span>
                    <h3>Mesures</h3>
                    <p>
                      NIHAO peut suspendre un compte en cas d’abus, de non-paiement ou de risque
                      sécurité, avec notification raisonnable sauf urgence.
                    </p>
                  </article>
                </div>
              }
              @case ('agents') {
                <div class="pro-grid">
                  <article class="pro-tile">
                    <span class="label">IA</span>
                    <h3>Nature des recommandations</h3>
                    <p>
                      Les sorties agents sont assistives. Elles ne constituent pas un conseil
                      juridique, fiscal ou financier. Une validation humaine est requise pour les
                      actions sensibles.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Gouvernance</span>
                    <h3>Human-in-the-loop</h3>
                    <ul>
                      <li>Workflows REQUEST_APPROVAL / APPROVED</li>
                      <li>Audit trail des décisions</li>
                      <li>Guardrails et sandbox selon le plan</li>
                    </ul>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Quotas</span>
                    <h3>Limites d’usage</h3>
                    <p>
                      Les quotas sièges, stockage et actions IA sont définis par le plan
                      (<a routerLink="/login">Tarifs</a>. Un dépassement peut entraîner un
                      throttling ou une mise à niveau.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Studio</span>
                    <h3>Agents custom</h3>
                    <p>
                      Les graphes Studio / Marketplace restent sous votre responsabilité
                      opérationnelle. NIHAO fournit l’exécution et les contrôles de plateforme.
                    </p>
                  </article>
                </div>
              }
              @case ('billing') {
                <div class="pro-grid">
                  <article class="pro-tile">
                    <span class="label">Plans</span>
                    <h3>FREE · PRO · BUSINESS</h3>
                    <p>
                      Facturation mensuelle (ou annuelle si offerte). Les prix affichés hors taxes
                      sauf mention contraire. Paiement via prestataire (SumUp / Stripe).
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Packs</span>
                    <h3>Modules</h3>
                    <ul>
                      <li>CRM + Sales</li>
                      <li>Ops (WMS + PIM)</li>
                      <li>Studio + Marketplace</li>
                    </ul>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Résiliation</span>
                    <h3>Fin d’abonnement</h3>
                    <p>
                      Résiliation à la fin de période en cours sauf engagement spécifique. Les
                      données restent exportables selon la politique de confidentialité.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Évolution</span>
                    <h3>Tarifs &amp; features</h3>
                    <p>
                      NIHAO peut faire évoluer les fonctionnalités et tarifs avec préavis raisonnable
                      pour les abonnés payants.
                    </p>
                  </article>
                </div>
              }
              @default {
                <div class="pro-grid">
                  <article class="pro-tile">
                    <span class="label">Garantie</span>
                    <h3>Disponibilité</h3>
                    <p>
                      Objectif de disponibilité élevé hors maintenance planifiée. Aucune garantie
                      d’absence totale d’interruption ; les SLA BUSINESS peuvent être contractualisés
                      séparément.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Responsabilité</span>
                    <h3>Limitation</h3>
                    <p>
                      Dans les limites légales, la responsabilité de NIHAO est plafonnée aux montants
                      payés sur les 12 derniers mois pour le service concerné.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Droit</span>
                    <h3>Loi applicable</h3>
                    <p>
                      Droit français. Tribunaux compétents du siège de l’éditeur, sauf disposition
                      impérative contraire.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Liens</span>
                    <h3>Documents associés</h3>
                    <ul>
                      <li><a routerLink="/cgu">CGU détaillées</a></li>
                      <li><a routerLink="/privacy">Confidentialité</a></li>
                      <li><a routerLink="/compliance">Conformité</a></li>
                    </ul>
                  </article>
                </div>
              }
            }

            <div class="pro-foot">
              <span>En cas de conflit : bon de commande &gt; Conditions &gt; CGU</span>
              <a routerLink="/cgu">Lire les CGU →</a>
            </div>
          </div>
        </div>
      </div>
    </app-public-site-shell>
  `,
  styles: [PUBLIC_PAGE_SURFACE, PUBLIC_PRO_PANEL],
})
export class TermsPage {
  readonly active = signal<TermsTab>('object');
  readonly tabs: { id: TermsTab; label: string }[] = [
    { id: 'object', label: 'Objet' },
    { id: 'account', label: 'Compte' },
    { id: 'agents', label: 'Agents IA' },
    { id: 'billing', label: 'Facturation' },
    { id: 'liability', label: 'Responsabilité' },
  ];
}
