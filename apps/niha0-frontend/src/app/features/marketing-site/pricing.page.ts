import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LocaleService } from '../../core/i18n/locale.service';
import { PublicSiteShellComponent } from './public-site-shell.component';
import { PUBLIC_PAGE_SURFACE, PUBLIC_PRO_PANEL } from './public-content.styles';
import {
  AUDIENCE_ROLES,
  AudienceRoleId,
  audienceById,
  isAudienceRoleId,
} from './audience-roles';

@Component({
  selector: 'app-pricing-page',
  imports: [RouterLink, PublicSiteShellComponent],
  template: `
    <app-public-site-shell pageTitle="Tarifs">
      <div class="page-surface">
        <header class="page-head">
          <div>
            <p class="page-kicker">Offre · 6 profils</p>
            <h2 class="page-title">{{ locale.t('pricing') }} — {{ role().label }}</h2>
            <p class="page-lead">
              {{ role().blurb }} Choisissez un profil pour afficher l’offre adaptée (quotas, modules,
              parcours d’inscription).
            </p>
          </div>
          <div class="page-meta">
            <span class="meta-chip">Recommandé · {{ role().recommendedPlan }}</span>
            <span class="meta-chip">HT sauf mention</span>
            <a
              class="meta-chip meta-cta"
              [routerLink]="['/register']"
              [queryParams]="{ role: role().id }"
            >
              Créer un espace {{ role().label }}
            </a>
          </div>
        </header>

        <div class="pro-panel">
          <div class="pro-tabs" role="tablist" aria-label="Profils tarifaires">
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

          <div class="pro-body pricing-body" role="tabpanel">
            <p class="role-intro">
              <strong>{{ role().short }}</strong>
              — plan conseillé <em>{{ role().recommendedPlan }}</em>. Les prix affichés sont
              indicatifs ; le secteur public et les partenaires relèvent souvent d’un devis.
            </p>

            <div class="plans" [style.--cols]="role().plans.length">
              @for (plan of role().plans; track plan.code) {
                <article class="plan" [class.featured]="plan.featured">
                  @if (plan.featured) {
                    <p class="badge">Recommandé</p>
                  }
                  <header>
                    <h3>{{ plan.name }}</h3>
                    <p class="audience">{{ role().label }}</p>
                  </header>
                  <p class="price">
                    <span>{{ plan.priceLabel }}</span>
                    <small>{{ plan.priceNote }}</small>
                  </p>
                  <ul>
                    @for (line of plan.highlights; track line) {
                      <li>{{ line }}</li>
                    }
                  </ul>
                  <a
                    class="btn"
                    [class.btn-primary]="plan.featured"
                    [class.btn-ghost]="!plan.featured"
                    [routerLink]="['/register']"
                    [queryParams]="{ role: role().id, plan: plan.code }"
                  >
                    {{ plan.cta }}
                  </a>
                </article>
              }
            </div>

            <div class="modules">
              <h3 class="section-title">Modules utiles pour {{ role().label }}</h3>
              <div class="modules-grid">
                @for (mod of role().modules; track mod.title) {
                  <article class="pro-tile">
                    <span class="label">Module</span>
                    <h3>{{ mod.title }}</h3>
                    <p>{{ mod.text }}</p>
                  </article>
                }
                <article class="pro-tile">
                  <span class="label">Parcours</span>
                  <h3>Cas d’usage</h3>
                  <p>
                    Voir les wedges métier (Commercial, Ops, Agents) et le chemin d’adoption.
                    <a routerLink="/use-cases" [queryParams]="{ role: role().id }">Ouvrir →</a>
                  </p>
                </article>
              </div>
            </div>

            <div class="pro-foot">
              <span>
                Profil actuel : {{ role().label }} · inscription préremplit le secteur
                « {{ role().sectorDefault }} »
              </span>
              <a [routerLink]="['/register']" [queryParams]="{ role: role().id }">
                Continuer vers l’inscription →
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
    .pricing-body {
      gap: 0.5rem;
    }
    .role-intro {
      margin: 0;
      font-size: 0.74rem;
      line-height: 1.4;
      color: var(--text-secondary);
    }
    .plans {
      display: grid;
      grid-template-columns: repeat(var(--cols, 3), minmax(0, 1fr));
      gap: 0.5rem;
      flex-shrink: 0;
    }
    .plan {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      min-height: 0;
      padding: 0.65rem 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      background: color-mix(in srgb, var(--bg-primary) 40%, transparent);
    }
    .plan.featured {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent-primary) 55%, transparent);
      background: color-mix(in srgb, var(--accent-primary) 8%, var(--bg-elevated));
    }
    .badge {
      position: absolute;
      top: 0.45rem;
      right: 0.5rem;
      margin: 0;
      font-size: 0.6rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--accent-primary);
    }
    .plan h3 {
      margin: 0;
      font-family: var(--font-display, Georgia, serif);
      font-size: 0.95rem;
    }
    .audience {
      margin: 0.1rem 0 0;
      font-size: 0.65rem;
      color: var(--text-muted);
    }
    .price {
      margin: 0.1rem 0;
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 0.25rem 0.4rem;
    }
    .price span {
      font-size: 1.25rem;
      font-weight: 800;
      line-height: 1;
    }
    .price small {
      font-size: 0.66rem;
      color: var(--text-muted);
    }
    .plan ul {
      margin: 0;
      padding-left: 0.95rem;
      flex: 1;
      font-size: 0.68rem;
      color: var(--text-secondary);
      line-height: 1.35;
    }
    .plan li + li {
      margin-top: 0.1rem;
    }
    .plan .btn {
      align-self: stretch;
      text-align: center;
      text-decoration: none;
      min-height: 1.85rem;
      font-size: 0.72rem;
      margin-top: 0.2rem;
    }
    .btn-ghost {
      color: var(--text-primary);
      border-color: var(--border-strong);
      background: color-mix(in srgb, var(--bg-elevated) 72%, transparent);
    }
    .section-title {
      margin: 0 0 0.3rem;
      font-family: var(--font-display, Georgia, serif);
      font-size: 0.82rem;
      font-weight: 700;
    }
    .modules {
      min-height: 0;
    }
    .modules-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.4rem;
    }
    @media (max-width: 52rem) {
      .plans {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .modules-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    @media (max-width: 36rem) {
      .plans,
      .modules-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
  ],
})
export class PricingPage implements OnInit {
  readonly locale = inject(LocaleService);
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
