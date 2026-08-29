import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicSiteShellComponent } from '../marketing-site/public-site-shell.component';
import { PUBLIC_PAGE_SURFACE, PUBLIC_PRO_PANEL } from '../marketing-site/public-content.styles';

type PrivacyTab = 'scope' | 'data' | 'rights' | 'security' | 'retention';

@Component({
  selector: 'app-privacy-policy-page',
  imports: [RouterLink, PublicSiteShellComponent],
  template: `
    <app-public-site-shell pageTitle="Confidentialité" [compact]="true">
      <div class="page-surface">
        <header class="page-head">
          <div>
            <p class="page-kicker">Légal · RGPD</p>
            <h2 class="page-title">Politique de confidentialité</h2>
            <p class="page-lead">
              Comment NIHAO collecte, utilise et protège les données personnelles des utilisateurs
              professionnels et des organisations clientes.
            </p>
          </div>
          <div class="page-meta">
            <span class="meta-chip">Version 1.2</span>
            <span class="meta-chip">MAJ · 25 août 2026</span>
            <span class="meta-chip">UE / RGPD</span>
          </div>
        </header>

        <div class="pro-panel">
          <div class="pro-tabs" role="tablist" aria-label="Sections confidentialité">
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
              @case ('scope') {
                <div class="pro-grid">
                  <article class="pro-tile">
                    <span class="label">Responsable</span>
                    <h3>Rôles &amp; responsabilités</h3>
                    <p>
                      L’organisation cliente est responsable de traitement pour ses données métier.
                      NIHAO agit en sous-traitant (art. 28 RGPD) pour l’hébergement, l’exécution des
                      agents et les fonctionnalités SaaS.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Périmètre</span>
                    <h3>Ce qui est couvert</h3>
                    <ul>
                      <li>Comptes utilisateurs et invitations</li>
                      <li>Données CRM / ERP saisies dans NIHAO</li>
                      <li>Logs d’audit, runs agents, préférences UI</li>
                      <li>Documents importés (stockage objet / RAG)</li>
                    </ul>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Contact</span>
                    <h3>Délégué à la protection</h3>
                    <p>
                      Demandes privacy, DSR et questions de conformité :
                      <strong>privacy&#64;nihao.app</strong> — délai cible de réponse : 30 jours.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Base légale</span>
                    <h3>Fondements du traitement</h3>
                    <ul>
                      <li>Exécution du contrat SaaS</li>
                      <li>Intérêt légitime (sécurité, amélioration produit)</li>
                      <li>Obligation légale (conservation comptable / audit)</li>
                      <li>Consentement (cookies non essentiels, le cas échéant)</li>
                    </ul>
                  </article>
                </div>
              }
              @case ('data') {
                <div class="pro-grid">
                  <article class="pro-tile">
                    <span class="label">Identité</span>
                    <h3>Données de compte</h3>
                    <ul>
                      <li>Nom, prénom, e-mail professionnel</li>
                      <li>Rôle organisationnel (OWNER, ADMIN, …)</li>
                      <li>Organisation, secteur, préférences langue / thème</li>
                    </ul>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Usage</span>
                    <h3>Télémétrie &amp; audit</h3>
                    <ul>
                      <li>Journaux d’accès API et actions sensibles</li>
                      <li>Statuts des agents et validations humaines</li>
                      <li>Événements produit anonymisés (analytics opt-in)</li>
                    </ul>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Contenu</span>
                    <h3>Données métier</h3>
                    <p>
                      Clients, leads, factures, tickets, fichiers et prompts agents restent isolés
                      par tenant. NIHAO n’utilise pas vos données métier pour entraîner des modèles
                      publics.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Cookies</span>
                    <h3>Traceurs</h3>
                    <ul>
                      <li>Essentiels : session, CSRF, préférences</li>
                      <li>Mesure d’audience uniquement si activée</li>
                      <li>Pas de publicité tierce</li>
                    </ul>
                  </article>
                </div>
              }
              @case ('rights') {
                <div class="pro-grid">
                  <article class="pro-tile">
                    <span class="label">RGPD</span>
                    <h3>Vos droits</h3>
                    <ul>
                      <li>Accès et portabilité (export JSON)</li>
                      <li>Rectification et limitation</li>
                      <li>Effacement (sous réserve d’obligations légales)</li>
                      <li>Opposition au traitement d’intérêt légitime</li>
                    </ul>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Self-service</span>
                    <h3>Dans l’application</h3>
                    <p>
                      Paramètres → Confidentialité : export des données personnelles, demande
                      d’effacement, historique des consentements et journal des exports.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Réclamation</span>
                    <h3>Autorité de contrôle</h3>
                    <p>
                      Vous pouvez saisir la CNIL (ou l’autorité locale UE) si vous estimez que vos
                      droits ne sont pas respectés après contact avec le DPO.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Mineurs</span>
                    <h3>Public professionnel</h3>
                    <p>
                      NIHAO est destiné aux professionnels. Les comptes de moins de 16 ans ne sont
                      pas autorisés sans cadre contractuel spécifique.
                    </p>
                  </article>
                </div>
              }
              @case ('security') {
                <div class="pro-grid">
                  <article class="pro-tile">
                    <span class="label">Technique</span>
                    <h3>Mesures de sécurité</h3>
                    <ul>
                      <li>TLS en transit, chiffrement au repos (stockage objet)</li>
                      <li>Isolation multi-tenant et contrôles d’accès par rôle</li>
                      <li>MFA disponible, rate-limiting, audit trail</li>
                    </ul>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Sous-traitants</span>
                    <h3>Prestataires</h3>
                    <ul>
                      <li>Hébergement cloud région UE</li>
                      <li>E-mail transactionnel (invites, reset MDP)</li>
                      <li>Paiement / facturation (SumUp / Stripe selon plan)</li>
                    </ul>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Incidents</span>
                    <h3>Notification</h3>
                    <p>
                      En cas de violation susceptible d’engendrer un risque, notification sans délai
                      injustifié à l’organisation cliente et, si requis, à l’autorité (72 h).
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Transferts</span>
                    <h3>Hors UE</h3>
                    <p>
                      Tout transfert hors EEE s’appuie sur des garanties appropriées (clauses
                      contractuelles types ou équivalent). Préférence d’hébergement UE.
                    </p>
                  </article>
                </div>
              }
              @default {
                <div class="pro-grid">
                  <article class="pro-tile">
                    <span class="label">Durées</span>
                    <h3>Conservation</h3>
                    <ul>
                      <li>Compte actif : durée de la relation contractuelle</li>
                      <li>Logs d’audit : jusqu’à 12 mois (sécurité)</li>
                      <li>Facturation : délais légaux comptables</li>
                      <li>Backups : fenêtres rotatives documentées</li>
                    </ul>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Fin de contrat</span>
                    <h3>Restitution / suppression</h3>
                    <p>
                      À la résiliation : export possible puis suppression des données tenant selon
                      le calendrier contractuel (typiquement 30–90 jours hors obligations légales).
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Mises à jour</span>
                    <h3>Évolution de la politique</h3>
                    <p>
                      Les changements matériels sont signalés dans l’app et/ou par e-mail aux
                      administrateurs. La date de MAJ figure en en-tête de cette page.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Documents liés</span>
                    <h3>Voir aussi</h3>
                    <ul>
                      <li><a routerLink="/terms">Conditions d’utilisation</a></li>
                      <li><a routerLink="/cgu">CGU</a></li>
                      <li><a routerLink="/compliance">Conformité</a></li>
                    </ul>
                  </article>
                </div>
              }
            }

            <div class="pro-foot">
              <span>NIHAO · Network Intelligence Hub Access Open</span>
              <a routerLink="/compliance">Programme de conformité →</a>
            </div>
          </div>
        </div>
      </div>
    </app-public-site-shell>
  `,
  styles: [PUBLIC_PAGE_SURFACE, PUBLIC_PRO_PANEL],
})
export class PrivacyPolicyPage {
  readonly active = signal<PrivacyTab>('scope');
  readonly tabs: { id: PrivacyTab; label: string }[] = [
    { id: 'scope', label: 'Périmètre' },
    { id: 'data', label: 'Données' },
    { id: 'rights', label: 'Droits' },
    { id: 'security', label: 'Sécurité' },
    { id: 'retention', label: 'Conservation' },
  ];
}
