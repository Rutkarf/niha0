import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PublicSiteShellComponent } from './public-site-shell.component';
import { PUBLIC_PAGE_SURFACE, PUBLIC_PRO_PANEL } from './public-content.styles';
import {
  AUDIENCE_ROLES,
  AudienceRoleId,
  audienceById,
  isAudienceRoleId,
} from './audience-roles';

@Component({
  selector: 'app-use-cases-page',
  imports: [RouterLink, PublicSiteShellComponent],
  template: `
    <app-public-site-shell pageTitle="Cas d’usage">
      <div class="page-surface">
        <header class="page-head">
          <div>
            <p class="page-kicker">Produit · Wedges + profils</p>
            <h2 class="page-title">Cas d’usage — {{ role().label }}</h2>
            <p class="page-lead">
              {{ role().blurb }} Ci-dessous : parcours métier communs, puis modules recommandés pour
              votre profil.
            </p>
          </div>
          <div class="page-meta">
            <span class="meta-chip">{{ role().short }}</span>
            <a class="meta-chip meta-cta" [routerLink]="['/login']" [queryParams]="{ role: role().id }">
              Voir l’offre {{ role().label }}
            </a>
            <a class="meta-chip meta-cta" [routerLink]="['/register']" [queryParams]="{ role: role().id }">
              Créer mon espace
            </a>
          </div>
        </header>

        <div class="pro-panel">
          <div class="pro-tabs" role="tablist" aria-label="Profils cas d’usage">
            @for (item of roles; track item.id) {
              <button
                type="button"
                role="tab"
                class="pro-tab"
                [class.is-active]="roleId() === item.id"
                [attr.aria-selected]="roleId() === item.id"
                (click)="selectRole(item.id)"
              >
                {{ item.label }}
              </button>
            }
          </div>

          <div class="pro-body use-cases-body" role="tabpanel">
            <div class="wedges">
              <article class="wedge">
                <span class="label">01 · Commercial</span>
                <h3>Pipeline piloté par agents</h3>
                <p class="pack">Pack CRM + Sales</p>
                <p class="pitch">
                  Centralisez contacts et opportunités, préparez devis / dossiers, validez les
                  relances avant envoi — adapté aux freelances comme aux directions commerciales.
                </p>
                <ul>
                  <li>Pipeline unifié</li>
                  <li>Propositions agents en AI Office</li>
                  <li>Brief chat sans changer d’outil</li>
                </ul>
              </article>

              <article class="wedge">
                <span class="label">02 · Ops</span>
                <h3>Stock, dossiers &amp; suivi</h3>
                <p class="pack">Pack WMS + PIM / dossiers</p>
                <p class="pitch">
                  Inventaire, référentiel, subventions ou dossiers publics : les agents alertent, les
                  humains décident.
                </p>
                <ul>
                  <li>Suivi opérationnel</li>
                  <li>Alertes avant rupture / échéance</li>
                  <li>BI consolidée</li>
                </ul>
              </article>

              <article class="wedge">
                <span class="label">03 · Agents</span>
                <h3>Studio → Marketplace → Run</h3>
                <p class="pack">Pack Studio + Marketplace</p>
                <p class="pitch">
                  Concevez des graphes, publiez pour votre organisation ou vos clients partenaires,
                  exécutez avec guardrails.
                </p>
                <ul>
                  <li>Studio de graphes</li>
                  <li>Publication privée</li>
                  <li>Gouvernance &amp; runtime</li>
                </ul>
              </article>
            </div>

            <div class="role-modules">
              <h3 class="section-title">Priorités pour {{ role().label }}</h3>
              <div class="modules-grid">
                @for (mod of role().modules; track mod.title) {
                  <article class="pro-tile">
                    <span class="label">Focus</span>
                    <h3>{{ mod.title }}</h3>
                    <p>{{ mod.text }}</p>
                  </article>
                }
                <article class="pro-tile">
                  <span class="label">Tarif</span>
                  <h3>Plan {{ role().recommendedPlan }}</h3>
                  <p>
                    Offre recommandée pour ce profil.
                    <a [routerLink]="['/login']" [queryParams]="{ role: role().id }">Comparer →</a>
                  </p>
                </article>
              </div>
            </div>

            <div class="pro-foot">
              <span>Les 6 profils partagent le même hub ; seuls quotas et parcours changent.</span>
              <a [routerLink]="['/register']" [queryParams]="{ role: role().id }">
                Inscription {{ role().label }} →
              </a>
            </div>
          </div>
        </div>
      </div>
    </app-public-site-shell>
  `,
  styles: [
    PUBLIC_PAGE_SURFACE,
    PUBLIC_PRO_PANEL,
    `
    .meta-cta {
      text-decoration: none;
      color: var(--text-primary);
      border-color: var(--accent-primary);
      background: color-mix(in srgb, var(--accent-primary) 14%, transparent);
      font-weight: 700;
    }
    .use-cases-body {
      gap: 0.5rem;
    }
    .wedges {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.45rem;
    }
    .wedge {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.55rem 0.65rem;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      background: color-mix(in srgb, var(--bg-primary) 42%, transparent);
      min-height: 0;
    }
    .wedge .label {
      font-size: 0.6rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent-primary);
    }
    .wedge h3 {
      margin: 0;
      font-family: var(--font-display, Georgia, serif);
      font-size: 0.84rem;
      line-height: 1.25;
    }
    .pack {
      margin: 0;
      font-size: 0.62rem;
      color: var(--text-muted);
    }
    .pitch {
      margin: 0;
      font-size: 0.68rem;
      line-height: 1.35;
      color: var(--text-secondary);
    }
    .wedge ul {
      margin: 0.1rem 0 0;
      padding-left: 0.9rem;
      font-size: 0.66rem;
      color: var(--text-secondary);
      line-height: 1.3;
    }
    .section-title {
      margin: 0 0 0.3rem;
      font-family: var(--font-display, Georgia, serif);
      font-size: 0.8rem;
      font-weight: 700;
    }
    .modules-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.4rem;
    }
    @media (max-width: 52rem) {
      .wedges,
      .modules-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    @media (max-width: 36rem) {
      .wedges,
      .modules-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
  ],
})
export class UseCasesPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly roles = AUDIENCE_ROLES;
  readonly roleId = signal<AudienceRoleId>('entreprise');
  readonly role = computed(() => audienceById(this.roleId()));

  ngOnInit(): void {
    const fromQuery = this.route.snapshot.queryParamMap.get('role');
    if (isAudienceRoleId(fromQuery)) this.roleId.set(fromQuery);
  }

  selectRole(id: AudienceRoleId): void {
    this.roleId.set(id);
    const url = new URL(window.location.href);
    url.searchParams.set('role', id);
    history.replaceState(null, '', `${url.pathname}${url.search}`);
  }
}
