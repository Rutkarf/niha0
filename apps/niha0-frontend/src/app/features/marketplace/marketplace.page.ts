import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { MarketplaceInstall, MarketplaceListing } from '../../core/api/api.models';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { mapHttpError } from '../../core/api/http-error.util';

type PublisherKind = 'nihao' | 'partner' | 'competitor';
type FunnelStage = 'prospect' | 'lead' | 'qualified' | 'customer';
type SortKey = 'popular' | 'recent' | 'title' | 'rating';

const CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: 'Tous', label: 'Toutes catégories', icon: '◎' },
  { id: 'AGENT', label: 'Agents IA', icon: '🤖' },
  { id: 'WORKFLOW', label: 'Workflows', icon: '⚡' },
  { id: 'INTEGRATION', label: 'Intégrations', icon: '🔗' },
  { id: 'TEMPLATE', label: 'Templates', icon: '📋' },
  { id: 'AUTRE', label: 'Autres', icon: '📦' },
];

const PUBLISHER_FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'Tout le catalogue' },
  { id: 'nihao', label: 'Agents Nihao' },
  { id: 'partner', label: 'Partenaires' },
  { id: 'competitor', label: 'Écosystème tiers' },
];

const HERO_SLIDES = [
  {
    title: 'Agents Nihao — déploiement immédiat',
    sub: 'Catalogue officiel · support entreprise · HITL natif',
    cta: 'Voir les best-sellers',
    tone: 'nihao',
  },
  {
    title: 'Workflows certifiés partenaires',
    sub: 'Intégrations CRM, ERP et data prêtes à l’emploi',
    cta: 'Explorer les partenaires',
    tone: 'partner',
  },
  {
    title: 'Comparez l’écosystème IA',
    sub: 'Agents tiers évalués · funnel lead → qualification → install',
    cta: 'Parcourir le marché',
    tone: 'market',
  },
];

const FUNNEL_STEPS: { id: FunnelStage; label: string; hint: string }[] = [
  { id: 'prospect', label: 'Prospect', hint: 'Découverte catalogue' },
  { id: 'lead', label: 'Lead', hint: 'Intérêt produit' },
  { id: 'qualified', label: 'Qualifié', hint: 'Besoin validé' },
  { id: 'customer', label: 'Client', hint: 'Installation' },
];

interface EnrichedListing extends MarketplaceListing {
  publisher: PublisherKind;
  publisherLabel: string;
  rating: number;
  reviewCount: number;
  priceLabel: string;
  badge?: string;
}

function hashSeed(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
}

function publisherFor(l: MarketplaceListing): PublisherKind {
  const h = hashSeed(l.id + l.title);
  if (l.visibility === 'PUBLIC' && l.installCount >= 5) return 'nihao';
  if (h % 5 === 0) return 'competitor';
  if (h % 3 === 0) return 'partner';
  return h % 2 === 0 ? 'nihao' : 'partner';
}

function publisherLabel(kind: PublisherKind): string {
  switch (kind) {
    case 'nihao':
      return 'Nihao Official';
    case 'partner':
      return 'Partenaire certifié';
    default:
      return 'Éditeur tiers';
  }
}

function enrichListing(l: MarketplaceListing): EnrichedListing {
  const publisher = publisherFor(l);
  const rating = Math.min(5, 3.2 + Math.log10(l.installCount + 1) * 0.85);
  const reviewCount = Math.max(1, l.installCount * 3 + hashSeed(l.id) % 40);
  const badge =
    l.installCount >= 20 ? 'Best-seller' : l.installCount >= 8 ? 'Choix Nihao' : publisher === 'nihao' ? 'Officiel' : undefined;
  return {
    ...l,
    publisher,
    publisherLabel: publisherLabel(publisher),
    rating,
    reviewCount,
    priceLabel: publisher === 'nihao' ? 'Inclus workspace' : 'Essai gratuit',
    badge,
  };
}

@Component({
  selector: 'app-marketplace-page',
  imports: [
    FormsModule,
    DatePipe,
    DecimalPipe,
    RouterLink,
    EmptyStateComponent,
    SkeletonComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="mp-store">
      <!-- Amazon-like top bar -->
      <header class="store-top">
        <div class="store-top-inner">
          <a routerLink="/app/dashboard" class="store-logo" aria-label="Nihao accueil">
            <span class="logo-mark">N</span>
            <span class="logo-text">Market<span class="logo-accent">place</span></span>
          </a>
          <form class="store-search" (submit)="onSearchSubmit($event)">
            <select class="search-dept" [ngModel]="category()" (ngModelChange)="category.set($event)" name="dept">
              @for (c of categories; track c.id) {
                <option [value]="c.id">{{ c.label }}</option>
              }
            </select>
            <input
              class="search-input"
              type="search"
              placeholder="Rechercher agents IA, workflows, intégrations…"
              [ngModel]="query()"
              (ngModelChange)="onSearchInput($event)"
              name="q"
            />
            <button type="submit" class="search-btn" aria-label="Rechercher">⌕</button>
          </form>
          <nav class="store-nav">
            <a routerLink="/app/studio" class="nav-link">Vendre</a>
            <button type="button" class="nav-cart" (click)="scrollToLibrary()">
              <span class="cart-icon">🛒</span>
              <span class="cart-label">Bibliothèque</span>
              <span class="cart-count">{{ installs().length }}</span>
            </button>
          </nav>
        </div>
        <div class="store-subbar">
          <button type="button" class="subbar-menu" (click)="sidebarOpen.set(!sidebarOpen())">☰ Catégories</button>
          <span class="subbar-item">Agents Nihao</span>
          <span class="subbar-item">Offres du jour</span>
          <span class="subbar-item">Nouveautés</span>
          <span class="subbar-item">Support Pro</span>
          <span class="subbar-funnel">
            Tunnel :
            <strong>{{ funnelLabel() }}</strong>
          </span>
        </div>
      </header>

      @if (error()) {
        <p class="error-banner" role="alert">{{ error() }}</p>
      }

      <!-- Funnel stepper -->
      <div class="funnel-track" aria-label="Tunnel de conversion">
        @for (step of funnelSteps; track step.id; let i = $index) {
          <div class="funnel-step" [class.done]="funnelIndex() > i" [class.active]="funnelStage() === step.id">
            <span class="step-num">{{ i + 1 }}</span>
            <div class="step-text">
              <strong>{{ step.label }}</strong>
              <span>{{ step.hint }}</span>
            </div>
          </div>
          @if (i < funnelSteps.length - 1) {
            <span class="funnel-arrow" aria-hidden="true">›</span>
          }
        }
      </div>

      <div class="store-body">
        <!-- Left department nav (Amazon) -->
        <aside class="dept-sidebar" [class.open]="sidebarOpen()">
          <h2 class="dept-title">Départements</h2>
          <ul class="dept-list">
            @for (c of categories; track c.id) {
              <li>
                <button
                  type="button"
                  class="dept-item"
                  [class.active]="category() === c.id"
                  (click)="selectCategory(c.id)"
                >
                  <span class="dept-icon">{{ c.icon }}</span>
                  {{ c.label }}
                </button>
              </li>
            }
          </ul>
          <h3 class="dept-title">Éditeurs</h3>
          <ul class="dept-list">
            @for (p of publisherFilters; track p.id) {
              <li>
                <button
                  type="button"
                  class="dept-item publisher"
                  [class.active]="publisherFilter() === p.id"
                  (click)="publisherFilter.set(p.id)"
                >
                  {{ p.label }}
                </button>
              </li>
            }
          </ul>
        </aside>

        <main class="store-main">
          <!-- Hero carousel -->
          <section class="hero-carousel" aria-label="Offres">
            @for (slide of heroSlides; track slide.title; let i = $index) {
              <article class="hero-slide" [class]="'tone-' + slide.tone" [class.active]="heroIndex() === i">
                <div class="hero-content">
                  <h2>{{ slide.title }}</h2>
                  <p>{{ slide.sub }}</p>
                  <button type="button" class="hero-cta" (click)="applyHeroCta(i)">{{ slide.cta }}</button>
                </div>
              </article>
            }
            <div class="hero-dots">
              @for (slide of heroSlides; track slide.title; let i = $index) {
                <button type="button" [class.active]="heroIndex() === i" (click)="heroIndex.set(i)" [attr.aria-label]="'Slide ' + (i + 1)"></button>
              }
            </div>
          </section>

          <!-- Quick filters -->
          <div class="quick-filters">
            <select class="input sort-select" [ngModel]="sortBy()" (ngModelChange)="sortBy.set($event)">
              <option value="popular">Trier : Popularité</option>
              <option value="rating">Trier : Note</option>
              <option value="recent">Trier : Nouveautés</option>
              <option value="title">Trier : A → Z</option>
            </select>
            <span class="results-count">{{ filteredListings().length }} résultat(s)</span>
          </div>

          @if (loadingListings()) {
            <app-skeleton message="Chargement du catalogue agents…" [lines]="8" />
          } @else if (!filteredListings().length) {
            <app-empty-state title="Aucun agent trouvé" icon="MP" description="Affinez votre recherche ou publiez depuis le Studio." />
          } @else {
            <section class="shelf" aria-label="Catalogue">
              <header class="shelf-head">
                <h2>{{ shelfTitle() }}</h2>
                <a routerLink="/app/studio" class="shelf-link">Publier un agent →</a>
              </header>
              <div class="product-grid">
                @for (l of filteredListings(); track l.id) {
                  <article
                    class="product-card"
                    [class.selected]="selected()?.id === l.id"
                    [class.publisher-nihao]="l.publisher === 'nihao'"
                    (click)="selectListing(l)"
                    tabindex="0"
                    role="button"
                    (keydown.enter)="selectListing(l)"
                  >
                    @if (l.badge) {
                      <span class="product-badge">{{ l.badge }}</span>
                    }
                    <div class="product-visual" [attr.data-pub]="l.publisher">
                      <span class="visual-icon">{{ categoryIcon(l.category) }}</span>
                      <span class="publisher-tag" [class]="l.publisher">{{ l.publisherLabel }}</span>
                    </div>
                    <div class="product-body">
                      <h3 class="product-title">{{ l.title }}</h3>
                      @if (l.summary) {
                        <p class="product-summary">{{ l.summary }}</p>
                      }
                      <div class="product-rating">
                        <span class="stars">{{ starString(l.rating) }}</span>
                        <span class="rating-val">{{ l.rating | number:'1.1-1' }}</span>
                        <span class="review-count">({{ l.reviewCount }})</span>
                      </div>
                      <div class="product-meta">
                        <span>{{ l.installCount }} déploiements</span>
                        <app-status-badge [status]="l.visibility" />
                      </div>
                      <div class="product-footer">
                        <div class="price-block">
                          <span class="price">{{ l.priceLabel }}</span>
                          <span class="prime-tag">⚡ Déploiement rapide</span>
                        </div>
                        <button
                          type="button"
                          class="btn-buy"
                          [disabled]="installingId() === l.id || isInstalled(l.id)"
                          (click)="quickInstall(l, $event)"
                        >
                          {{ isInstalled(l.id) ? '✓ Installé' : installingId() === l.id ? '…' : 'Ajouter' }}
                        </button>
                      </div>
                    </div>
                  </article>
                }
              </div>
            </section>
          }

          <section id="library" class="library-shelf">
            <header class="shelf-head">
              <h2>Ma bibliothèque</h2>
              <span class="lib-count">{{ installs().length }} agent(s) installé(s)</span>
            </header>
            @if (loadingInstalls()) {
              <app-skeleton [lines]="3" />
            } @else if (!installs().length) {
              <p class="lib-empty">Aucune installation — parcourez le catalogue pour convertir un prospect en client.</p>
            } @else {
              <div class="lib-grid">
                @for (i of installs(); track i.id) {
                  <article class="lib-card">
                    <strong>{{ listingTitle(i.listingId) }}</strong>
                    <span class="lib-date">Installé {{ i.createdAt | date: 'short' }}</span>
                  </article>
                }
              </div>
            }
          </section>
        </main>

        <!-- Right funnel panel (checkout-like) -->
        <aside class="checkout-panel">
          @if (selected(); as sel) {
            <div class="checkout-card">
              <span class="checkout-step">Étape {{ funnelStepNumber() }} / 4</span>
              <div class="checkout-visual" [attr.data-pub]="sel.publisher">
                {{ categoryIcon(sel.category) }}
              </div>
              <h2 class="checkout-title">{{ sel.title }}</h2>
              <p class="checkout-publisher">{{ sel.publisherLabel }}</p>
              <div class="checkout-rating">
                {{ starString(sel.rating) }} {{ sel.rating | number:'1.1-1' }} · {{ sel.reviewCount }} avis
              </div>
              <p class="checkout-summary">{{ sel.summary || 'Agent IA prêt à déployer dans votre workspace Nihao.' }}</p>

              <dl class="checkout-specs">
                <div><dt>Catégorie</dt><dd>{{ sel.category }}</dd></div>
                <div><dt>Prix</dt><dd>{{ sel.priceLabel }}</dd></div>
                <div><dt>Visibilité</dt><dd><app-status-badge [status]="sel.visibility" /></dd></div>
              </dl>

              @if (funnelStage() === 'lead' || funnelStage() === 'prospect') {
                <div class="qualify-box">
                  <h3>Qualifier votre besoin</h3>
                  <p class="qualify-hint">Passez de lead à lead qualifié pour débloquer l’installation.</p>
                  <label class="field">
                    Cas d’usage
                    <select class="input" [(ngModel)]="useCase" name="useCase">
                      <option value="">— Sélectionner —</option>
                      <option value="sales">Ventes & CRM</option>
                      <option value="support">Support client</option>
                      <option value="ops">Ops & automatisation</option>
                      <option value="data">Data & analytics</option>
                    </select>
                  </label>
                  <label class="field">
                    Taille équipe
                    <select class="input" [(ngModel)]="teamSize" name="teamSize">
                      <option value="">— Sélectionner —</option>
                      <option value="1-10">1 – 10</option>
                      <option value="11-50">11 – 50</option>
                      <option value="51+">51+</option>
                    </select>
                  </label>
                  <label class="field">
                    Intention d’achat
                    <select class="input" [(ngModel)]="intent" name="intent">
                      <option value="evaluate">Évaluation</option>
                      <option value="pilot">POC / pilote</option>
                      <option value="buy">Déploiement immédiat</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    class="btn btn-primary full"
                    [disabled]="!useCase || !teamSize"
                    (click)="qualifyLead()"
                  >
                    Qualifier le lead →
                  </button>
                </div>
              }

              @if (funnelStage() === 'qualified' || funnelStage() === 'customer') {
                <label class="field">
                  Configuration (JSON)
                  <textarea class="input" rows="3" [(ngModel)]="installConfig" name="installConfig" placeholder='{"env":"prod"}'></textarea>
                </label>
                <button
                  type="button"
                  class="btn-checkout"
                  [disabled]="installingId() === sel.id || isInstalled(sel.id)"
                  (click)="install(sel)"
                >
                  {{ isInstalled(sel.id) ? '✓ Déjà dans ma bibliothèque' : installingId() === sel.id ? 'Installation…' : 'Installer maintenant' }}
                </button>
                <p class="checkout-trust">🔒 Paiement simulé · essai inclus · annulation à tout moment</p>
              }
            </div>
          } @else {
            <div class="checkout-empty">
              <div class="empty-icon">🛍️</div>
              <h3>Votre panier funnel</h3>
              <p>Sélectionnez un agent pour démarrer le parcours prospect → lead → qualifié → client.</p>
              <ul class="funnel-tips">
                <li><strong>1.</strong> Parcourez le catalogue Nihao & tiers</li>
                <li><strong>2.</strong> Cliquez sur une fiche produit</li>
                <li><strong>3.</strong> Qualifiez votre besoin métier</li>
                <li><strong>4.</strong> Installez en un clic</li>
              </ul>
            </div>
          }

          <div class="social-proof">
            <h4>Confiance marketplace</h4>
            <div class="proof-stats">
              <div><strong>{{ listings().length }}</strong><span>Agents listés</span></div>
              <div><strong>{{ totalInstalls() }}</strong><span>Déploiements</span></div>
              <div><strong>4.6</strong><span>Note moyenne</span></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: calc(100vh - var(--shell-header-h, 56px));
      background: var(--bg-primary);
    }

    .mp-store { display: flex; flex-direction: column; min-height: 100%; }

    /* —— Amazon top bar —— */
    .store-top {
      background: #131921;
      color: #fff;
      flex-shrink: 0;
    }

    .store-top-inner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 1rem;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
    }

    .store-logo {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      text-decoration: none;
      color: #fff;
      flex-shrink: 0;
    }

    .logo-mark {
      width: 2rem;
      height: 2rem;
      border-radius: 0.35rem;
      background: linear-gradient(135deg, #ff9900, #febd69);
      color: #131921;
      display: grid;
      place-items: center;
      font-weight: 900;
      font-size: 1rem;
    }

    .logo-text { font-size: 1.1rem; font-weight: 700; letter-spacing: -0.02em; }
    .logo-accent { color: #ff9900; }

    .store-search {
      flex: 1;
      display: flex;
      min-width: 0;
      border-radius: 0.35rem;
      overflow: hidden;
    }

    .search-dept {
      border: none;
      background: #e6e6e6;
      color: #111;
      font-size: 0.72rem;
      padding: 0 0.5rem;
      max-width: 11rem;
    }

    .search-input {
      flex: 1;
      border: none;
      padding: 0.55rem 0.75rem;
      font-size: 0.88rem;
      min-width: 0;
    }

    .search-btn {
      border: none;
      background: #febd69;
      color: #111;
      padding: 0 1rem;
      font-size: 1.1rem;
      cursor: pointer;
    }
    .search-btn:hover { background: #f3a847; }

    .store-nav { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }
    .nav-link { color: #fff; text-decoration: none; font-size: 0.78rem; font-weight: 600; }
    .nav-link:hover { text-decoration: underline; }

    .nav-cart {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      border: none;
      background: transparent;
      color: #fff;
      cursor: pointer;
      font-size: 0.75rem;
    }

    .cart-count {
      background: #ff9900;
      color: #111;
      font-weight: 800;
      font-size: 0.65rem;
      padding: 0.1rem 0.35rem;
      border-radius: 999px;
      min-width: 1.1rem;
    }

    .store-subbar {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.35rem 1rem 0.5rem;
      background: #232f3e;
      font-size: 0.72rem;
      flex-wrap: wrap;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
    }

    .subbar-menu {
      border: none;
      background: transparent;
      color: #fff;
      font-weight: 700;
      cursor: pointer;
      font-size: 0.72rem;
    }

    .subbar-item { color: #ddd; cursor: default; }
    .subbar-funnel { margin-left: auto; color: #febd69; }
    .subbar-funnel strong { color: #fff; }

    .error-banner {
      margin: 0;
      padding: 0.5rem 1rem;
      background: color-mix(in srgb, var(--accent-danger) 15%, transparent);
      color: var(--accent-danger);
      font-size: 0.8rem;
    }

    /* —— Funnel —— */
    .funnel-track {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      padding: 0.65rem 1rem;
      background: var(--bg-elevated);
      border-bottom: 1px solid var(--border-color);
      flex-wrap: wrap;
    }

    .funnel-step {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.35rem 0.65rem;
      border-radius: var(--radius-md);
      opacity: 0.55;
    }

    .funnel-step.active {
      opacity: 1;
      background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
      border: 1px solid color-mix(in srgb, var(--accent-primary) 35%, var(--border-color));
    }

    .funnel-step.done { opacity: 0.85; }
    .funnel-step.done .step-num { background: #22c55e; color: #fff; }

    .step-num {
      width: 1.35rem;
      height: 1.35rem;
      border-radius: 50%;
      background: var(--bg-secondary);
      display: grid;
      place-items: center;
      font-size: 0.65rem;
      font-weight: 800;
    }

    .step-text { display: flex; flex-direction: column; font-size: 0.68rem; }
    .step-text strong { font-size: 0.72rem; }
    .step-text span { color: var(--text-muted); }

    .funnel-arrow { color: var(--text-muted); font-size: 0.85rem; }

    /* —— Layout —— */
    .store-body {
      display: grid;
      grid-template-columns: 220px 1fr minmax(280px, 320px);
      gap: 0;
      flex: 1;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
    }

    .dept-sidebar {
      border-right: 1px solid var(--border-color);
      background: var(--bg-elevated);
      padding: 0.75rem;
      overflow-y: auto;
    }

    .dept-title {
      margin: 0 0 0.5rem;
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      font-weight: 800;
    }

    .dept-list { list-style: none; margin: 0 0 1rem; padding: 0; }

    .dept-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.45rem;
      text-align: left;
      border: none;
      background: transparent;
      padding: 0.4rem 0.5rem;
      border-radius: var(--radius-sm);
      font-size: 0.78rem;
      color: var(--text-secondary);
      cursor: pointer;
    }

    .dept-item:hover, .dept-item.active {
      background: color-mix(in srgb, #ff9900 12%, transparent);
      color: var(--text-primary);
      font-weight: var(--fw-semibold);
    }

    .dept-icon { font-size: 0.9rem; }

    .store-main {
      padding: 0.75rem;
      min-width: 0;
      overflow-y: auto;
    }

    /* Hero */
    .hero-carousel {
      position: relative;
      height: 180px;
      border-radius: var(--radius-md);
      overflow: hidden;
      margin-bottom: 0.75rem;
    }

    .hero-slide {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      padding: 1.5rem 2rem;
      opacity: 0;
      transition: opacity 0.35s;
      pointer-events: none;
    }

    .hero-slide.active { opacity: 1; pointer-events: auto; }

    .hero-slide.tone-nihao {
      background: linear-gradient(105deg, #131921 0%, #232f3e 45%, #ff9900 180%);
      color: #fff;
    }

    .hero-slide.tone-partner {
      background: linear-gradient(105deg, #1e3a5f 0%, #2563eb 60%, #93c5fd 150%);
      color: #fff;
    }

    .hero-slide.tone-market {
      background: linear-gradient(105deg, #312e81 0%, #7c3aed 55%, #c4b5fd 150%);
      color: #fff;
    }

    .hero-content h2 { margin: 0 0 0.35rem; font-size: 1.35rem; }
    .hero-content p { margin: 0 0 0.75rem; font-size: 0.85rem; opacity: 0.9; max-width: 28rem; }

    .hero-cta {
      border: none;
      background: #febd69;
      color: #111;
      font-weight: 800;
      font-size: 0.78rem;
      padding: 0.45rem 0.85rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
    }

    .hero-dots {
      position: absolute;
      bottom: 0.5rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 0.35rem;
    }

    .hero-dots button {
      width: 0.45rem;
      height: 0.45rem;
      border-radius: 50%;
      border: none;
      background: rgba(255,255,255,0.4);
      cursor: pointer;
      padding: 0;
    }

    .hero-dots button.active { background: #fff; }

    .quick-filters {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .sort-select { font-size: 0.78rem; padding: 0.35rem 0.5rem; width: auto; }
    .results-count { font-size: 0.72rem; color: var(--text-muted); }

    .shelf-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.65rem;
    }

    .shelf-head h2 { margin: 0; font-size: 1rem; }
    .shelf-link { font-size: 0.78rem; color: var(--accent-primary); text-decoration: none; font-weight: 600; }

    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0.65rem;
      margin-bottom: 1.25rem;
    }

    .product-card {
      position: relative;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: transform 0.12s, box-shadow 0.12s;
    }

    .product-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px color-mix(in srgb, #ff9900 18%, transparent);
    }

    .product-card.selected {
      border-color: #ff9900;
      box-shadow: 0 0 0 2px color-mix(in srgb, #ff9900 35%, transparent);
    }

    .product-badge {
      position: absolute;
      top: 0.4rem;
      left: 0.4rem;
      z-index: 1;
      font-size: 0.58rem;
      font-weight: 800;
      text-transform: uppercase;
      background: #cc0c39;
      color: #fff;
      padding: 0.15rem 0.4rem;
      border-radius: 3px;
    }

    .product-visual {
      height: 110px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      background: linear-gradient(160deg, var(--bg-secondary), var(--bg-primary));
    }

    .product-visual[data-pub="nihao"] { background: linear-gradient(160deg, #232f3e, #37475a); }
    .product-visual[data-pub="partner"] { background: linear-gradient(160deg, #1e3a5f, #2563eb); }
    .product-visual[data-pub="competitor"] { background: linear-gradient(160deg, #3f3f46, #52525b); }

    .visual-icon { font-size: 2.25rem; }

    .publisher-tag {
      position: absolute;
      bottom: 0.35rem;
      right: 0.35rem;
      font-size: 0.55rem;
      font-weight: 800;
      text-transform: uppercase;
      padding: 0.15rem 0.35rem;
      border-radius: 3px;
      background: rgba(0,0,0,0.55);
      color: #fff;
    }

    .publisher-tag.nihao { background: #ff9900; color: #111; }

    .product-body { padding: 0.65rem; display: flex; flex-direction: column; gap: 0.3rem; flex: 1; }

    .product-title {
      margin: 0;
      font-size: 0.82rem;
      line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .product-summary {
      margin: 0;
      font-size: 0.68rem;
      color: var(--text-muted);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .product-rating { display: flex; align-items: center; gap: 0.25rem; font-size: 0.68rem; }
    .stars { color: #ff9900; letter-spacing: -1px; }
    .rating-val { font-weight: 700; }
    .review-count { color: var(--text-muted); }

    .product-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
      align-items: center;
      font-size: 0.65rem;
      color: var(--text-muted);
    }

    .product-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 0.35rem;
      margin-top: auto;
      padding-top: 0.4rem;
    }

    .price { display: block; font-weight: 800; font-size: 0.82rem; color: #b12704; }
    .prime-tag { display: block; font-size: 0.58rem; color: #007185; font-weight: 600; }

    .btn-buy {
      border: 1px solid #fcd200;
      background: linear-gradient(180deg, #f7dfa5, #f0c14b);
      color: #111;
      font-size: 0.68rem;
      font-weight: 700;
      padding: 0.3rem 0.55rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      white-space: nowrap;
    }

    .btn-buy:disabled { opacity: 0.55; cursor: not-allowed; }

    .library-shelf {
      border-top: 1px solid var(--border-color);
      padding-top: 1rem;
    }

    .lib-count { font-size: 0.72rem; color: var(--text-muted); }
    .lib-empty { font-size: 0.8rem; color: var(--text-muted); }
    .lib-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.5rem; }
    .lib-card {
      padding: 0.55rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      font-size: 0.78rem;
      background: var(--bg-elevated);
    }
    .lib-date { display: block; font-size: 0.65rem; color: var(--text-muted); margin-top: 0.15rem; }

    /* Checkout panel */
    .checkout-panel {
      border-left: 1px solid var(--border-color);
      background: var(--bg-elevated);
      padding: 0.75rem;
      overflow-y: auto;
      position: sticky;
      top: 0;
      align-self: start;
      max-height: calc(100vh - 8rem);
    }

    .checkout-card { display: flex; flex-direction: column; gap: 0.5rem; }

    .checkout-step {
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      color: #ff9900;
      letter-spacing: 0.05em;
    }

    .checkout-visual {
      height: 90px;
      display: grid;
      place-items: center;
      font-size: 2.5rem;
      border-radius: var(--radius-md);
      background: var(--bg-secondary);
    }

    .checkout-visual[data-pub="nihao"] { background: linear-gradient(135deg, #232f3e, #37475a); }
    .checkout-title { margin: 0; font-size: 1rem; line-height: 1.3; }
    .checkout-publisher { margin: 0; font-size: 0.72rem; color: #007185; font-weight: 600; }
    .checkout-rating { font-size: 0.72rem; color: #ff9900; }
    .checkout-summary { margin: 0; font-size: 0.78rem; color: var(--text-secondary); line-height: 1.45; }

    .checkout-specs {
      margin: 0;
      font-size: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      overflow: hidden;
    }

    .checkout-specs div {
      display: flex;
      justify-content: space-between;
      padding: 0.35rem 0.55rem;
      border-bottom: 1px solid var(--border-color);
    }

    .checkout-specs div:last-child { border-bottom: none; }
    .checkout-specs dt { color: var(--text-muted); }
    .checkout-specs dd { margin: 0; font-weight: 600; }

    .qualify-box {
      padding: 0.65rem;
      border: 1px solid color-mix(in srgb, #ff9900 40%, var(--border-color));
      border-radius: var(--radius-md);
      background: color-mix(in srgb, #ff9900 6%, transparent);
    }

    .qualify-box h3 { margin: 0 0 0.25rem; font-size: 0.85rem; }
    .qualify-hint { margin: 0 0 0.5rem; font-size: 0.72rem; color: var(--text-muted); }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.72rem;
      margin-bottom: 0.45rem;
    }

    .full { width: 100%; }

    .btn-checkout {
      width: 100%;
      border: none;
      background: linear-gradient(180deg, #f7dfa5, #f0c14b);
      color: #111;
      font-weight: 800;
      font-size: 0.85rem;
      padding: 0.6rem;
      border-radius: var(--radius-md);
      cursor: pointer;
      border: 1px solid #a88734;
    }

    .btn-checkout:disabled { opacity: 0.5; cursor: not-allowed; }

    .checkout-trust {
      margin: 0;
      font-size: 0.65rem;
      color: var(--text-muted);
      text-align: center;
    }

    .checkout-empty {
      text-align: center;
      padding: 1rem 0.5rem;
    }

    .empty-icon { font-size: 2rem; margin-bottom: 0.5rem; }
    .checkout-empty h3 { margin: 0 0 0.35rem; font-size: 0.95rem; }
    .checkout-empty p { margin: 0 0 0.75rem; font-size: 0.78rem; color: var(--text-muted); }

    .funnel-tips {
      list-style: none;
      margin: 0;
      padding: 0;
      text-align: left;
      font-size: 0.72rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .social-proof {
      margin-top: 1rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-color);
    }

    .social-proof h4 { margin: 0 0 0.5rem; font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); }

    .proof-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.35rem;
      text-align: center;
    }

    .proof-stats strong { display: block; font-size: 1rem; color: var(--accent-primary); }
    .proof-stats span { font-size: 0.62rem; color: var(--text-muted); }

    @media (max-width: 1100px) {
      .store-body { grid-template-columns: 1fr minmax(260px, 300px); }
      .dept-sidebar { display: none; }
      .dept-sidebar.open {
        display: block;
        position: fixed;
        z-index: 50;
        top: 7rem;
        left: 0;
        bottom: 0;
        width: 240px;
        box-shadow: 4px 0 20px rgba(0,0,0,0.2);
      }
    }

    @media (max-width: 768px) {
      .store-body { grid-template-columns: 1fr; }
      .checkout-panel { position: static; max-height: none; border-left: none; border-top: 1px solid var(--border-color); }
      .store-top-inner { flex-wrap: wrap; }
      .store-search { order: 3; flex: 1 1 100%; }
      .funnel-track { display: none; }
    }
  `],
})
export class MarketplacePage implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly categories = CATEGORIES;
  readonly publisherFilters = PUBLISHER_FILTERS;
  readonly heroSlides = HERO_SLIDES;
  readonly funnelSteps = FUNNEL_STEPS;

  readonly loadingListings = signal(true);
  readonly loadingInstalls = signal(true);
  readonly installingId = signal<string | null>(null);
  readonly error = signal('');
  readonly listings = signal<MarketplaceListing[]>([]);
  readonly installs = signal<MarketplaceInstall[]>([]);
  readonly selected = signal<EnrichedListing | null>(null);
  readonly query = signal('');
  readonly category = signal('Tous');
  readonly publisherFilter = signal('all');
  readonly sortBy = signal<SortKey>('popular');
  readonly funnelStage = signal<FunnelStage>('prospect');
  readonly heroIndex = signal(0);
  readonly sidebarOpen = signal(false);

  installConfig = '';
  useCase = '';
  teamSize = '';
  intent = 'evaluate';

  readonly enrichedListings = computed(() => this.listings().map(enrichListing));

  readonly filteredListings = computed(() => {
    let list = [...this.enrichedListings()];
    const cat = this.category();
    if (cat !== 'Tous') list = list.filter((l) => l.category === cat);

    const pub = this.publisherFilter();
    if (pub !== 'all') list = list.filter((l) => l.publisher === pub);

    const q = this.query().trim().toLowerCase();
    if (q) {
      list = list.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          (l.summary ?? '').toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q) ||
          l.publisherLabel.toLowerCase().includes(q),
      );
    }

    const sort = this.sortBy();
    if (sort === 'popular') list.sort((a, b) => b.installCount - a.installCount);
    else if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
    else if (sort === 'recent') list.sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
    else list.sort((a, b) => a.title.localeCompare(b.title));

    return list;
  });

  readonly funnelIndex = computed(() => {
    const idx = FUNNEL_STEPS.findIndex((s) => s.id === this.funnelStage());
    return idx >= 0 ? idx : 0;
  });

  readonly funnelStepNumber = computed(() => this.funnelIndex() + 1);

  readonly funnelLabel = computed(() => FUNNEL_STEPS[this.funnelIndex()]?.label ?? 'Prospect');

  readonly shelfTitle = computed(() => {
    const pub = this.publisherFilter();
    if (pub === 'nihao') return 'Agents Nihao — catalogue officiel';
    if (pub === 'partner') return 'Partenaires certifiés';
    if (pub === 'competitor') return 'Écosystème tiers & concurrents';
    const cat = this.category();
    if (cat !== 'Tous') return `Résultats · ${cat}`;
    return 'Recommandés pour vous';
  });

  readonly totalInstalls = computed(() =>
    this.listings().reduce((s, l) => s + l.installCount, 0),
  );

  private heroTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.reload();
    this.heroTimer = setInterval(() => {
      this.heroIndex.update((i) => (i + 1) % HERO_SLIDES.length);
    }, 6000);
  }

  ngOnDestroy(): void {
    if (this.heroTimer) clearInterval(this.heroTimer);
  }

  categoryIcon(cat: string): string {
    return CATEGORIES.find((c) => c.id === cat)?.icon ?? '📦';
  }

  starString(rating: number): string {
    const full = Math.round(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  onSearchInput(value: string): void {
    this.query.set(value);
    if (value.trim()) this.funnelStage.set('prospect');
  }

  onSearchSubmit(ev: Event): void {
    ev.preventDefault();
    if (this.query().trim()) this.funnelStage.set('prospect');
  }

  selectCategory(id: string): void {
    this.category.set(id);
    this.sidebarOpen.set(false);
    this.funnelStage.set('prospect');
  }

  applyHeroCta(index: number): void {
    if (index === 0) this.publisherFilter.set('nihao');
    else if (index === 1) this.publisherFilter.set('partner');
    else this.publisherFilter.set('all');
    this.funnelStage.set('prospect');
  }

  selectListing(l: EnrichedListing): void {
    this.selected.set(l);
    this.installConfig = '';
    this.funnelStage.set('lead');
  }

  qualifyLead(): void {
    if (!this.useCase || !this.teamSize) return;
    this.funnelStage.set('qualified');
    this.toast.success('Lead qualifié — vous pouvez installer l’agent.');
  }

  quickInstall(l: EnrichedListing, ev: Event): void {
    ev.stopPropagation();
    this.selectListing(l);
    if (!this.useCase || !this.teamSize) {
      this.toast.info('Qualifiez votre besoin dans le panneau de droite.');
      return;
    }
    if (this.funnelStage() === 'qualified') {
      this.install(l);
    }
  }

  scrollToLibrary(): void {
    document.getElementById('library')?.scrollIntoView({ behavior: 'smooth' });
  }

  isInstalled(listingId: string): boolean {
    return this.installs().some((i) => i.listingId === listingId);
  }

  install(l: EnrichedListing, ev?: Event): void {
    ev?.stopPropagation();
    if (this.isInstalled(l.id)) return;
    if (this.funnelStage() !== 'qualified' && this.funnelStage() !== 'customer') {
      this.selectListing(l);
      this.toast.info('Complétez la qualification avant l’installation.');
      return;
    }
    this.installingId.set(l.id);
    let base: Record<string, unknown> = {};
    if (this.installConfig.trim()) {
      try {
        base = JSON.parse(this.installConfig) as Record<string, unknown>;
      } catch {
        base = { raw: this.installConfig.trim() };
      }
    }
    const config = JSON.stringify({
      ...base,
      funnel: { useCase: this.useCase, teamSize: this.teamSize, intent: this.intent },
    });
    this.api.installMarketplaceListing(l.id, config).subscribe({
      next: () => {
        this.installingId.set(null);
        this.funnelStage.set('customer');
        this.toast.success(`« ${l.title} » installé — bienvenue client !`);
        this.reload();
      },
      error: (err) => {
        this.installingId.set(null);
        const msg = mapHttpError(err);
        this.error.set(msg);
        this.toast.error(msg);
      },
    });
  }

  listingTitle(id: string): string {
    return this.listings().find((l) => l.id === id)?.title ?? id.slice(0, 8);
  }

  private reload(): void {
    this.api.getMarketplaceListings().subscribe({
      next: (data) => {
        this.listings.set(data);
        this.loadingListings.set(false);
      },
      error: (err) => {
        this.loadingListings.set(false);
        this.toast.error(mapHttpError(err));
      },
    });
    this.api.getMarketplaceInstalls().subscribe({
      next: (data) => {
        this.installs.set(data);
        this.loadingInstalls.set(false);
      },
      error: (err) => {
        this.loadingInstalls.set(false);
        this.toast.error(mapHttpError(err));
      },
    });
  }
}
