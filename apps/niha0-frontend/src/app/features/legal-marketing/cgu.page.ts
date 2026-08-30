import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicSiteShellComponent } from '../marketing-site/public-site-shell.component';
import { PUBLIC_PAGE_SURFACE, PUBLIC_PRO_PANEL } from '../marketing-site/public-content.styles';

type CguTab = 'usage' | 'ip' | 'conduct' | 'api' | 'support';

@Component({
  selector: 'app-cgu-page',
  imports: [RouterLink, PublicSiteShellComponent],
  template: `
    <app-public-site-shell pageTitle="CGU" [compact]="true">
      <div class="page-surface">
        <header class="page-head">
          <div>
            <p class="page-kicker">Légal · Règles d’usage</p>
            <h2 class="page-title">Conditions générales d’utilisation</h2>
            <p class="page-lead">
              Règles opérationnelles d’usage de la plateforme : licence, propriété intellectuelle,
              comportement acceptable, API et support.
            </p>
          </div>
          <div class="page-meta">
            <span class="meta-chip">CGU 1.1</span>
            <span class="meta-chip">Complète les Conditions</span>
            <span class="meta-chip">25 août 2026</span>
          </div>
        </header>

        <div class="pro-panel">
          <div class="pro-tabs" role="tablist" aria-label="Sections CGU">
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
              @case ('usage') {
                <div class="pro-grid">
                  <article class="pro-tile">
                    <span class="label">Licence</span>
                    <h3>Droit d’usage</h3>
                    <p>
                      Licence non exclusive, non transférable, limitée à la durée de l’abonnement,
                      pour un usage interne professionnel conformément au plan souscrit.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Interdit</span>
                    <h3>Usages non autorisés</h3>
                    <ul>
                      <li>Reverse engineering hors exceptions légales</li>
                      <li>Revente / sous-location non autorisée</li>
                      <li>Contournement des quotas ou contrôles d’accès</li>
                      <li>Scan agressif, scraping abusif, spam</li>
                    </ul>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Environnements</span>
                    <h3>Prod / sandbox</h3>
                    <p>
                      Les environnements de démo ou sandbox peuvent être reset. Les données y
                      déposées ne bénéficient pas des mêmes engagements que la production.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Évolutions</span>
                    <h3>Mises à jour</h3>
                    <p>
                      NIHAO peut déployer des mises à jour continues. Les breaking changes API sont
                      annoncés avec un préavis raisonnable quand c’est possible.
                    </p>
                  </article>
                </div>
              }
              @case ('ip') {
                <div class="pro-grid">
                  <article class="pro-tile">
                    <span class="label">Plateforme</span>
                    <h3>Propriété NIHAO</h3>
                    <p>
                      Logiciel, design, marques, documentation et composants d’infrastructure
                      restent la propriété de NIHAO ou de ses concédants.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Client</span>
                    <h3>Vos actifs</h3>
                    <p>
                      Données métier, prompts métier, graphes Studio et contenus uploadés restent
                      votre propriété. Vous concédez une licence limitée d’hébergement / exécution.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Feedback</span>
                    <h3>Suggestions</h3>
                    <p>
                      Les retours produits peuvent être utilisés pour améliorer NIHAO sans
                      obligation de rémunération, sans divulguer vos données confidentielles.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Open source</span>
                    <h3>Composants tiers</h3>
                    <p>
                      Certains composants OSS sont régis par leurs licences respectives, listées
                      dans la documentation technique.
                    </p>
                  </article>
                </div>
              }
              @case ('conduct') {
                <div class="pro-grid">
                  <article class="pro-tile">
                    <span class="label">Éthique</span>
                    <h3>Usage acceptable</h3>
                    <ul>
                      <li>Respect des lois et droits des tiers</li>
                      <li>Pas de harcèlement, malware, fraude</li>
                      <li>Pas de contenus discriminatoires illégaux</li>
                    </ul>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Agents</span>
                    <h3>Actions automatisées</h3>
                    <p>
                      Vous configurez et validez les actions agents. Toute action à impact externe
                      (e-mail, paiement, contrat) doit passer par les workflows d’approbation.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Partage</span>
                    <h3>Marketplace</h3>
                    <p>
                      Les publications privées / marketplace doivent respecter la confidentialité
                      de votre organisation et les droits IP des auteurs.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Sanctions</span>
                    <h3>En cas de manquement</h3>
                    <p>
                      Avertissement, limitation de fonctionnalités, suspension ou résiliation selon
                      la gravité, sans préjudice d’autres recours.
                    </p>
                  </article>
                </div>
              }
              @case ('api') {
                <div class="pro-grid">
                  <article class="pro-tile">
                    <span class="label">Accès</span>
                    <h3>API &amp; intégrations</h3>
                    <p>
                      Tokens, OAuth et webhooks doivent être stockés de façon sécurisée. Rate limits
                      et scopes s’appliquent selon le plan.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Stabilité</span>
                    <h3>Versioning</h3>
                    <p>
                      Les endpoints documentés suivent une politique de dépréciation. Les
                      intégrations non documentées peuvent changer sans préavis.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">SSO</span>
                    <h3>Identité</h3>
                    <p>
                      Google / SSO d’entreprise selon configuration. L’organisation reste
                      responsable de la révocation des accès employés.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Monitoring</span>
                    <h3>Observabilité</h3>
                    <p>
                      NIHAO peut journaliser les appels API pour sécurité, facturation et diagnostic
                      support, conformément à la politique de confidentialité.
                    </p>
                  </article>
                </div>
              }
              @default {
                <div class="pro-grid">
                  <article class="pro-tile">
                    <span class="label">Canaux</span>
                    <h3>Support</h3>
                    <ul>
                      <li>FREE : documentation &amp; communauté</li>
                      <li>PRO : support e-mail standard</li>
                      <li>BUSINESS : priorité + contacts dédiés</li>
                    </ul>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Maintenance</span>
                    <h3>Fenêtres</h3>
                    <p>
                      Maintenances planifiées communiquées à l’avance. Urgences sécurité possibles
                      sans préavis prolongé.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Contact</span>
                    <h3>Éditeur</h3>
                    <p>
                      Questions CGU / légal : <strong>legal&#64;nihao.app</strong> · Support produit :
                      via l’espace Help une fois connecté.
                    </p>
                  </article>
                  <article class="pro-tile">
                    <span class="label">Liens</span>
                    <h3>Voir aussi</h3>
                    <ul>
                      <li><a routerLink="/terms">Conditions d’utilisation</a></li>
                      <li><a routerLink="/privacy">Confidentialité</a></li>
                      <li><a routerLink="/login">Tarifs</a></li>
                    </ul>
                  </article>
                </div>
              }
            }

            <div class="pro-foot">
              <span>Les CGU complètent les Conditions sans les remplacer</span>
              <a routerLink="/terms">Retour aux Conditions →</a>
            </div>
          </div>
        </div>
      </div>
    </app-public-site-shell>
  `,
  styles: [PUBLIC_PAGE_SURFACE, PUBLIC_PRO_PANEL],
})
export class CguPage {
  readonly active = signal<CguTab>('usage');
  readonly tabs: { id: CguTab; label: string }[] = [
    { id: 'usage', label: 'Licence' },
    { id: 'ip', label: 'Propriété' },
    { id: 'conduct', label: 'Conduite' },
    { id: 'api', label: 'API' },
    { id: 'support', label: 'Support' },
  ];
}
