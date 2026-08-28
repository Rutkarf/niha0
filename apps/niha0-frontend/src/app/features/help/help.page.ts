import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FeaturePageHeaderComponent } from '../../shared/ui/feature-page-header/feature-page-header.component';
import {
  FAQ_CATEGORIES,
  FAQ_ITEMS,
  FaqCategory,
  GUIDE_CARDS,
  HELP_TABS,
  HelpTab,
  SHORTCUT_GROUPS,
  START_STEPS,
  SUPPORT_LINKS,
} from './help.content';

@Component({
  selector: 'app-help-page',
  imports: [FormsModule, RouterLink, FeaturePageHeaderComponent],
  template: `
    <div class="page feature-module-page help-page">
      <app-feature-page-header group="Système" title="Centre d'aide" backLabel="← AI Office">
        <div actions>
          <a routerLink="/app/changelog" class="btn btn-ghost">Changelog</a>
          <a routerLink="/app/feedback" class="btn btn-primary">Feedback</a>
        </div>
      </app-feature-page-header>

      <header class="help-command" aria-label="Vue d'ensemble aide">
        <div class="command-main">
          <div class="command-copy">
            <h2 class="command-title">Documentation Nihao</h2>
            <p class="command-sub">
              FAQ, raccourcis clavier, guides modules et ressources support — tout pour prendre en main la plateforme.
            </p>
            <div class="command-stats">
              <div class="stat-pill">
                <span class="stat-val">{{ faqCount }}</span>
                <span class="stat-lbl">FAQ</span>
              </div>
              <div class="stat-pill">
                <span class="stat-val">{{ shortcutCount }}</span>
                <span class="stat-lbl">Raccourcis</span>
              </div>
              <div class="stat-pill">
                <span class="stat-val">{{ guideCount }}</span>
                <span class="stat-lbl">Guides</span>
              </div>
              <div class="stat-pill">
                <span class="stat-val">{{ startSteps.length }}</span>
                <span class="stat-lbl">Étapes</span>
              </div>
            </div>
          </div>
        </div>
        <div class="command-search">
          <label class="search-label">
            <span class="feature-search-icon" aria-hidden="true">⌕</span>
            <span class="sr-only">Rechercher dans l'aide</span>
            <input
              class="input feature-search-input"
              type="search"
              placeholder="Rechercher FAQ, modules…"
              [ngModel]="query()"
              (ngModelChange)="onQueryChange($event)"
            />
          </label>
          @if (query().trim()) {
            <button type="button" class="btn btn-ghost btn-sm" (click)="clearSearch()">Effacer</button>
          }
        </div>
      </header>

      <div class="help-layout">
        <nav class="help-nav" aria-label="Sections aide">
          @for (tab of tabs; track tab.id) {
            <button
              type="button"
              class="help-nav-item"
              [class.active]="activeTab() === tab.id"
              (click)="setTab(tab.id)"
            >
              <span class="nav-icon" aria-hidden="true">{{ tab.icon }}</span>
              <span class="nav-text">
                <span class="nav-label">{{ tab.label }}</span>
                <span class="nav-desc">{{ tab.desc }}</span>
              </span>
              @if (tab.id === 'faq' && faqMatchCount() !== faqCount) {
                <span class="nav-badge">{{ faqMatchCount() }}</span>
              }
            </button>
          }
        </nav>

        <div class="help-panel">
          @switch (activeTab()) {
            @case ('home') {
              <section class="feature-hub card panel-card">
                <header class="section-toolbar">
                  <h2 class="section-title">Premiers pas</h2>
                  <span class="section-search-spacer"></span>
                  <span class="section-tag">Parcours recommandé</span>
                </header>
                <ol class="start-steps">
                  @for (step of startSteps; track step.step) {
                    <li class="start-step">
                      <span class="step-num" aria-hidden="true">{{ step.step }}</span>
                      <div class="step-body">
                        <h3>{{ step.title }}</h3>
                        <p>{{ step.description }}</p>
                        @if (step.route) {
                          <a [routerLink]="step.route" class="step-link">{{ step.routeLabel ?? 'Ouvrir' }} →</a>
                        }
                      </div>
                    </li>
                  }
                </ol>
              </section>

              <section class="feature-hub card panel-card">
                <header class="section-toolbar compact">
                  <h2 class="section-title">Questions populaires</h2>
                  <span class="section-search-spacer"></span>
                  <button type="button" class="btn btn-ghost btn-sm" (click)="setTab('faq')">Voir toute la FAQ →</button>
                </header>
                <div class="faq-preview">
                  @for (item of popularFaq(); track item.q) {
                    <details class="faq-item">
                      <summary>{{ item.q }}</summary>
                      <p>{{ item.a }}</p>
                    </details>
                  }
                </div>
              </section>

              <section class="feature-hub card panel-card">
                <header class="section-toolbar compact">
                  <h2 class="section-title">Accès rapides</h2>
                </header>
                <div class="quick-grid">
                  @for (g of guideCards.slice(0, 4); track g.route) {
                    <a [routerLink]="g.route" class="quick-card" [style.--card-accent]="g.accent">
                      <span class="quick-icon">{{ g.icon }}</span>
                      <span class="quick-title">{{ g.title }}</span>
                      <span class="quick-hint">{{ g.hint }}</span>
                    </a>
                  }
                </div>
              </section>
            }

            @case ('faq') {
              <section class="feature-hub card panel-card">
                <header class="section-toolbar">
                  <h2 class="section-title">FAQ</h2>
                  <label class="section-search">
                    <span class="feature-search-icon" aria-hidden="true">⌕</span>
                    <input
                      class="input feature-search-input section-search-input"
                      type="search"
                      placeholder="Mot-clé, module…"
                      [ngModel]="query()"
                      (ngModelChange)="onQueryChange($event)"
                    />
                  </label>
                  <div class="section-toolbar-end">
                    <span class="section-count">{{ faqMatchCount() }}/{{ faqCount }}</span>
                    <button type="button" class="btn btn-ghost btn-sm" (click)="expandAllFaq()">Tout ouvrir</button>
                    <button type="button" class="btn btn-ghost btn-sm" (click)="collapseAllFaq()">Tout fermer</button>
                  </div>
                </header>

                <div class="filter-chip-row" role="group" aria-label="Filtrer par thème">
                  @for (cat of faqCategories; track cat.id) {
                    <button
                      type="button"
                      class="filter-chip"
                      [class.active]="faqCategory() === cat.id"
                      (click)="faqCategory.set(cat.id)"
                    >
                      {{ cat.label }}
                      <span class="chip-count">{{ categoryCount(cat.id) }}</span>
                    </button>
                  }
                </div>

                @if (!filteredFaq().length) {
                  <p class="empty-filter">Aucune question ne correspond à votre recherche.</p>
                } @else {
                  <div class="faq-list">
                    @for (item of filteredFaq(); track item.q) {
                      <details class="faq-item" [open]="openFaq().has(item.q)">
                        <summary (click)="toggleFaq($event, item.q)">{{ item.q }}</summary>
                        <p>{{ item.a }}</p>
                        <div class="faq-tags">
                          @for (tag of item.tags; track tag) {
                            <button type="button" class="tag-chip" (click)="searchTag(tag)">{{ tag }}</button>
                          }
                        </div>
                      </details>
                    }
                  </div>
                }
              </section>
            }

            @case ('shortcuts') {
              <section class="feature-hub card panel-card">
                <header class="section-toolbar compact">
                  <h2 class="section-title">Raccourcis clavier</h2>
                  <span class="section-tag">Navigation & interactions</span>
                </header>
                @for (group of shortcutGroups; track group.title) {
                  <div class="shortcut-group">
                    <h3 class="group-title">{{ group.title }}</h3>
                    <ul class="shortcut-list">
                      @for (sc of group.items; track sc.label) {
                        <li class="shortcut-row">
                          <span class="shortcut-keys">
                            @for (key of sc.keys; track key; let last = $last) {
                              <kbd>{{ key }}</kbd>
                              @if (!last) {
                                <span class="key-sep">+</span>
                              }
                            }
                          </span>
                          <span class="shortcut-label">{{ sc.label }}</span>
                          @if (sc.context) {
                            <span class="shortcut-context">{{ sc.context }}</span>
                          }
                        </li>
                      }
                    </ul>
                  </div>
                }
              </section>

              <section class="feature-hub card panel-card tip-card">
                <p class="tip-text">
                  <strong>Astuce :</strong> la recherche globale (<kbd>Ctrl</kbd> + <kbd>K</kbd>) est le moyen le plus rapide
                  d'atteindre CRM, Audit, Centre Données ou Paramètres sans parcourir la sidebar.
                </p>
              </section>
            }

            @case ('guides') {
              <section class="feature-hub card panel-card">
                <header class="section-toolbar">
                  <h2 class="section-title">Guides modules</h2>
                  <label class="section-search">
                    <span class="feature-search-icon" aria-hidden="true">⌕</span>
                    <input
                      class="input feature-search-input section-search-input"
                      type="search"
                      placeholder="Filtrer les guides…"
                      [ngModel]="guideQuery()"
                      (ngModelChange)="guideQuery.set($event)"
                    />
                  </label>
                  <span class="section-count">{{ filteredGuides().length }}/{{ guideCount }}</span>
                </header>
                <div class="guide-grid">
                  @for (g of filteredGuides(); track g.route) {
                    <a [routerLink]="g.route" class="guide-card" [style.--card-accent]="g.accent">
                      <header class="guide-head">
                        <span class="guide-icon">{{ g.icon }}</span>
                        <div>
                          <h3>{{ g.title }}</h3>
                          <span class="guide-hint">{{ g.hint }}</span>
                        </div>
                      </header>
                      <p>{{ g.description }}</p>
                      <span class="guide-cta">Ouvrir le module →</span>
                    </a>
                  } @empty {
                    <p class="empty-filter">Aucun guide trouvé.</p>
                  }
                </div>
              </section>

              <section class="feature-hub card panel-card">
                <header class="section-toolbar compact">
                  <h2 class="section-title">Documentation produit</h2>
                </header>
                <p class="doc-note">
                  Parcours formation et cas d'usage détaillés :
                  <code>docs/gtm/onboarding-training.md</code> et <code>docs/gtm/use-cases.md</code>
                  dans le dépôt Nihao.
                </p>
              </section>
            }

            @case ('support') {
              <section class="feature-hub card panel-card">
                <header class="section-toolbar compact">
                  <h2 class="section-title">Besoin d'aide ?</h2>
                  <span class="section-tag">Nous sommes là pour vous</span>
                </header>
                <div class="support-grid">
                  @for (link of supportLinks; track link.route) {
                    <a [routerLink]="link.route" class="support-card">
                      <strong>{{ link.label }}</strong>
                      <span>{{ link.desc }}</span>
                    </a>
                  }
                </div>
              </section>

              <section class="feature-hub card panel-card contact-card">
                <h3 class="contact-title">Avant de nous écrire</h3>
                <ul class="contact-checklist">
                  <li>Consultez la FAQ et les guides modules ci-dessus</li>
                  <li>Vérifiez le Changelog pour une fonctionnalité récente</li>
                  <li>Utilisez Feedback avec la catégorie adaptée (bug, idée, billing)</li>
                  <li>Pour la traçabilité technique, joignez une capture depuis Audit</li>
                </ul>
                <div class="contact-actions">
                  <a routerLink="/app/feedback" class="btn btn-primary">Envoyer un feedback</a>
                  <a routerLink="/app/onboarding" class="btn btn-ghost">Revoir l'onboarding</a>
                </div>
              </section>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .help-command {
      display: flex;
      flex-wrap: wrap;
      gap: var(--dash-inline-gap);
      align-items: stretch;
      justify-content: space-between;
      margin-bottom: var(--dash-inline-gap);
      padding: var(--dash-band-gap);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      background: linear-gradient(135deg, color-mix(in srgb, var(--accent-primary) 6%, var(--bg-elevated)), var(--bg-elevated));
    }
    .command-main { flex: 1; min-width: min(100%, 16rem); }
    .command-title { margin: 0 0 0.35rem; font-size: 1.05rem; }
    .command-sub { margin: 0 0 0.65rem; font-size: 0.82rem; color: var(--text-secondary); max-width: 40rem; line-height: 1.45; }
    .command-stats { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .stat-pill {
      display: flex; flex-direction: column; gap: 0.1rem; padding: 0.4rem 0.55rem;
      border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-primary); min-width: 4.2rem;
    }
    .stat-val { font-weight: var(--fw-bold); font-size: 0.95rem; color: var(--accent-primary); }
    .stat-lbl { font-size: 0.62rem; color: var(--text-muted); text-transform: uppercase; }
    .command-search {
      display: flex; align-items: center; gap: 0.4rem; align-self: center; min-width: min(100%, 18rem);
    }
    .search-label { position: relative; flex: 1; min-width: 0; margin: 0; }
    .search-label .feature-search-icon {
      position: absolute; left: 0.65rem; top: 50%; transform: translateY(-50%);
      color: var(--text-muted); pointer-events: none;
    }
    .search-label .feature-search-input { width: 100%; padding-left: 2rem; }

    .help-layout {
      display: grid;
      grid-template-columns: minmax(11rem, 13.5rem) minmax(0, 1fr);
      gap: var(--dash-inline-gap);
      align-items: start;
    }
    .help-nav {
      display: flex; flex-direction: column; gap: 0.25rem;
      position: sticky; top: 0.5rem;
    }
    .help-nav-item {
      display: flex; align-items: center; gap: 0.5rem; width: 100%; text-align: left;
      border: 1px solid transparent; background: transparent; border-radius: var(--radius-md);
      padding: 0.55rem 0.6rem; cursor: pointer; color: var(--text-secondary);
      transition: background var(--transition), border-color var(--transition);
    }
    .help-nav-item:hover { background: var(--bg-hover); color: var(--text-primary); }
    .help-nav-item.active {
      background: color-mix(in srgb, var(--accent-primary) 12%, var(--bg-elevated));
      border-color: color-mix(in srgb, var(--accent-primary) 35%, var(--border-color));
      color: var(--accent-primary); box-shadow: inset 3px 0 0 var(--accent-primary);
    }
    .nav-icon { font-size: 0.9rem; width: 1.2rem; text-align: center; flex-shrink: 0; }
    .nav-text { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; flex: 1; }
    .nav-label { font-size: 0.78rem; font-weight: var(--fw-semibold); }
    .nav-desc { font-size: 0.62rem; color: var(--text-muted); }
    .nav-badge {
      font-size: 0.62rem; padding: 0.1rem 0.35rem; border-radius: var(--radius-sm);
      background: var(--bg-secondary); border: 1px solid var(--border-color); flex-shrink: 0;
    }
    .help-panel { display: flex; flex-direction: column; gap: var(--dash-inline-gap); min-width: 0; }
    .panel-card { padding: var(--dash-band-gap); }

    .section-toolbar {
      display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 0.65rem;
      margin-bottom: var(--dash-inline-gap); padding-bottom: var(--dash-inline-gap);
      border-bottom: 1px solid color-mix(in srgb, var(--border-color) 70%, transparent);
    }
    .section-toolbar.compact { margin-bottom: 0.65rem; padding-bottom: 0.65rem; }
    .section-title { margin: 0; font-size: 0.92rem; font-weight: var(--fw-semibold); white-space: nowrap; }
    .section-search { display: flex; align-items: center; gap: 0.35rem; min-width: 0; justify-self: center; width: min(100%, 18rem); }
    .section-search-input { width: 100%; min-width: 0; }
    .section-search-spacer { flex: 1; }
    .section-tag { font-size: 0.72rem; color: var(--text-muted); }
    .section-toolbar-end { display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap; justify-self: end; }
    .section-count {
      font-size: 0.72rem; color: var(--text-muted); padding: 0.2rem 0.5rem;
      border: 1px solid var(--border-color); border-radius: var(--radius-sm);
    }

    .start-steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.75rem; }
    .start-step {
      display: flex; gap: 0.75rem; align-items: flex-start;
      padding: 0.65rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);
      background: var(--bg-primary);
    }
    .step-num {
      width: 1.75rem; height: 1.75rem; border-radius: 50%; flex-shrink: 0;
      display: grid; place-items: center; font-size: 0.75rem; font-weight: 800;
      background: color-mix(in srgb, var(--accent-primary) 15%, transparent);
      color: var(--accent-primary); border: 1px solid color-mix(in srgb, var(--accent-primary) 30%, transparent);
    }
    .step-body h3 { margin: 0 0 0.25rem; font-size: 0.88rem; }
    .step-body p { margin: 0 0 0.4rem; font-size: 0.78rem; color: var(--text-secondary); line-height: 1.45; }
    .step-link { font-size: 0.72rem; font-weight: 700; color: var(--accent-primary); text-decoration: none; }
    .step-link:hover { text-decoration: underline; }

    .faq-preview, .faq-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .faq-item {
      border: 1px solid var(--border-color); border-radius: var(--radius-md);
      padding: 0.55rem 0.75rem; background: var(--bg-primary);
    }
    .faq-item summary {
      cursor: pointer; font-weight: 650; font-size: 0.88rem; color: var(--text-primary);
      list-style: none; display: flex; align-items: center; gap: 0.35rem;
    }
    .faq-item summary::-webkit-details-marker { display: none; }
    .faq-item summary::before { content: '▸'; color: var(--text-muted); font-size: 0.7rem; }
    .faq-item[open] summary::before { content: '▾'; }
    .faq-item p { margin: 0.5rem 0 0; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; }
    .faq-tags { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.45rem; }
    .tag-chip {
      border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-muted);
      border-radius: 999px; padding: 0.15rem 0.45rem; font-size: 0.62rem; cursor: pointer;
    }
    .tag-chip:hover { border-color: var(--accent-primary); color: var(--accent-primary); }

    .filter-chip-row { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: var(--dash-inline-gap); }
    .filter-chip {
      border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-secondary);
      border-radius: 999px; padding: 0.28rem 0.55rem; font-size: 0.68rem; font-weight: 600; cursor: pointer;
      display: inline-flex; align-items: center; gap: 0.3rem;
    }
    .filter-chip.active {
      background: color-mix(in srgb, var(--accent-primary) 14%, transparent);
      border-color: var(--accent-primary); color: var(--accent-primary);
    }
    .chip-count {
      font-size: 0.6rem; padding: 0.05rem 0.3rem; border-radius: var(--radius-sm);
      background: var(--bg-secondary); border: 1px solid var(--border-color);
    }
    .empty-filter { margin: 0; padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.82rem; }

    .quick-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr)); gap: 0.5rem;
    }
    .quick-card {
      display: flex; flex-direction: column; gap: 0.2rem; padding: 0.65rem;
      border: 1px solid var(--border-color); border-radius: var(--radius-md);
      background: var(--bg-primary); text-decoration: none; color: inherit;
      transition: border-color var(--transition), transform var(--transition);
    }
    .quick-card:hover {
      text-decoration: none; border-color: color-mix(in srgb, var(--card-accent) 50%, var(--border-color));
      transform: translateY(-1px);
    }
    .quick-icon {
      width: 1.6rem; height: 1.6rem; border-radius: var(--radius-sm);
      display: grid; place-items: center; font-size: 0.62rem; font-weight: 800;
      background: color-mix(in srgb, var(--card-accent) 18%, transparent);
      color: var(--card-accent);
    }
    .quick-title { font-size: 0.78rem; font-weight: 700; }
    .quick-hint { font-size: 0.62rem; color: var(--text-muted); }

    .shortcut-group { margin-bottom: var(--dash-inline-gap); }
    .shortcut-group:last-child { margin-bottom: 0; }
    .group-title {
      margin: 0 0 0.5rem; font-size: 0.72rem; text-transform: uppercase;
      letter-spacing: 0.06em; color: var(--text-muted); font-weight: 700;
    }
    .shortcut-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.35rem; }
    .shortcut-row {
      display: grid; grid-template-columns: auto 1fr auto; gap: 0.65rem; align-items: center;
      padding: 0.45rem 0.55rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm);
      background: var(--bg-primary); font-size: 0.8rem;
    }
    .shortcut-keys { display: flex; align-items: center; gap: 0.2rem; flex-wrap: wrap; }
  kbd {
      font-family: var(--font-mono); font-size: 0.68rem;
      border: 1px solid var(--border-color); border-radius: 4px;
      padding: 0.12rem 0.38rem; background: var(--bg-elevated);
      box-shadow: 0 1px 0 var(--border-color);
    }
    .key-sep { font-size: 0.65rem; color: var(--text-muted); }
    .shortcut-label { color: var(--text-primary); font-weight: 500; }
    .shortcut-context { font-size: 0.68rem; color: var(--text-muted); }

    .tip-card { background: color-mix(in srgb, var(--accent-primary) 5%, var(--bg-elevated)); }
    .tip-text { margin: 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; }

    .guide-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--dash-inline-gap);
    }
    .guide-card {
      display: flex; flex-direction: column; gap: 0.5rem; padding: var(--dash-band-gap);
      border: 1px solid var(--border-color); border-radius: var(--radius-lg);
      background: var(--bg-primary); text-decoration: none; color: inherit;
      transition: border-color var(--transition), box-shadow var(--transition), transform var(--transition);
    }
    .guide-card:hover {
      text-decoration: none; border-color: color-mix(in srgb, var(--card-accent) 45%, var(--border-color));
      box-shadow: var(--shadow-sm); transform: translateY(-1px);
    }
    .guide-head { display: flex; gap: 0.6rem; align-items: flex-start; }
    .guide-icon {
      width: 2rem; height: 2rem; border-radius: var(--radius-md);
      display: grid; place-items: center; font-size: 0.65rem; font-weight: 800; flex-shrink: 0;
      background: color-mix(in srgb, var(--card-accent) 18%, transparent);
      color: var(--card-accent); border: 1px solid color-mix(in srgb, var(--card-accent) 35%, transparent);
    }
    .guide-head h3 { margin: 0; font-size: 0.9rem; }
    .guide-hint { font-size: 0.62rem; color: var(--text-muted); }
    .guide-card p { margin: 0; font-size: 0.75rem; color: var(--text-secondary); line-height: 1.45; flex: 1; }
    .guide-cta { font-size: 0.72rem; font-weight: 700; color: var(--card-accent); }

    .doc-note { margin: 0; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; }
    .doc-note code { font-family: var(--font-mono); font-size: 0.75em; }

    .support-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem;
    }
    .support-card {
      display: flex; flex-direction: column; gap: 0.25rem; padding: 0.75rem;
      border: 1px solid var(--border-color); border-radius: var(--radius-md);
      background: var(--bg-primary); text-decoration: none; color: inherit;
      transition: border-color var(--transition), background var(--transition);
    }
    .support-card:hover {
      text-decoration: none; border-color: var(--accent-primary);
      background: color-mix(in srgb, var(--accent-primary) 5%, var(--bg-primary));
    }
    .support-card strong { font-size: 0.85rem; color: var(--text-primary); }
    .support-card span { font-size: 0.72rem; color: var(--text-muted); }

    .contact-card { background: color-mix(in srgb, var(--accent-primary) 4%, var(--bg-elevated)); }
    .contact-title { margin: 0 0 0.65rem; font-size: 0.88rem; }
    .contact-checklist {
      margin: 0 0 0.85rem; padding-left: 1.1rem; font-size: 0.8rem;
      color: var(--text-secondary); line-height: 1.55;
    }
    .contact-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }

    @media (max-width: 900px) {
      .help-layout { grid-template-columns: 1fr; }
      .help-nav {
        flex-direction: row; flex-wrap: wrap; position: static;
      }
      .help-nav-item { flex: 1 1 calc(50% - 0.25rem); min-width: 9rem; }
      .nav-desc { display: none; }
      .command-search { width: 100%; }
      .section-toolbar { grid-template-columns: 1fr; }
      .section-search { justify-self: stretch; width: 100%; grid-column: 1 / -1; }
      .section-toolbar-end { justify-self: start; }
      .shortcut-row { grid-template-columns: 1fr; gap: 0.25rem; }
    }
  `],
})
export class HelpPage {
  readonly tabs = HELP_TABS;
  readonly faqCategories = FAQ_CATEGORIES;
  readonly startSteps = START_STEPS;
  readonly guideCards = GUIDE_CARDS;
  readonly shortcutGroups = SHORTCUT_GROUPS;
  readonly supportLinks = SUPPORT_LINKS;

  readonly faqCount = FAQ_ITEMS.length;
  readonly guideCount = GUIDE_CARDS.length;
  readonly shortcutCount = SHORTCUT_GROUPS.reduce((n, g) => n + g.items.length, 0);

  readonly activeTab = signal<HelpTab>('home');
  readonly query = signal('');
  readonly guideQuery = signal('');
  readonly faqCategory = signal<FaqCategory | ''>('');
  readonly openFaq = signal<Set<string>>(new Set());

  readonly filteredFaq = computed(() => this.filterFaq(this.query(), this.faqCategory()));
  readonly faqMatchCount = computed(() => this.filteredFaq().length);
  readonly filteredGuides = computed(() => {
    const q = this.guideQuery().trim().toLowerCase();
    if (!q) return GUIDE_CARDS;
    return GUIDE_CARDS.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.hint.toLowerCase().includes(q),
    );
  });

  readonly popularFaq = computed(() => FAQ_ITEMS.slice(0, 4));

  setTab(tab: HelpTab): void {
    this.activeTab.set(tab);
  }

  onQueryChange(value: string): void {
    this.query.set(value);
    if (value.trim() && this.activeTab() === 'home') {
      this.activeTab.set('faq');
    }
  }

  clearSearch(): void {
    this.query.set('');
    this.faqCategory.set('');
  }

  categoryCount(cat: FaqCategory | ''): number {
    if (!cat) return this.countFaqForQuery(this.query());
    return this.filterFaq(this.query(), cat).length;
  }

  searchTag(tag: string): void {
    this.query.set(tag);
    this.activeTab.set('faq');
  }

  expandAllFaq(): void {
    this.openFaq.set(new Set(this.filteredFaq().map((f) => f.q)));
  }

  collapseAllFaq(): void {
    this.openFaq.set(new Set());
  }

  toggleFaq(event: Event, q: string): void {
    event.preventDefault();
    const next = new Set(this.openFaq());
    if (next.has(q)) next.delete(q);
    else next.add(q);
    this.openFaq.set(next);
  }

  private filterFaq(query: string, category: FaqCategory | '') {
    const q = query.trim().toLowerCase();
    return FAQ_ITEMS.filter((item) => {
      if (category && item.category !== category) return false;
      if (!q) return true;
      return (
        item.q.toLowerCase().includes(q) ||
        item.a.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }

  private countFaqForQuery(query: string): number {
    return this.filterFaq(query, '').length;
  }
}
