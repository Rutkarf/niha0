import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import {
  BillingPlan,
  defaultBillingPlan,
  MembershipMember,
  Organization,
  OrganizationInvite,
} from '../../core/api/api.models';
import { ThemeService, ThemeMode } from '../../core/theme/theme.service';
import { AuthService } from '../../core/auth/auth.service';
import { Role } from '../../core/auth/auth.models';
import { LocaleService, AppLocale } from '../../core/i18n/locale.service';
import { mapHttpError } from '../../core/api/http-error.util';
import { companyLabel } from '../../core/tenancy/company-label';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { FeaturePageHeaderComponent } from '../../shared/ui/feature-page-header/feature-page-header.component';
import { PLAN_META, RESOURCE_LINKS, SETTINGS_TABS, SettingsTab } from './settings.content';

const CHECKOUT_REF_KEY = 'niha0_checkout_ref';
const PAID_CHECKOUT_STATUSES = new Set(['PAID', 'COMPLETED', 'SUCCESS', 'SUCCESSFUL']);
const ADMIN_ROLES: Role[] = ['OWNER', 'ADMIN'];
const MEMBER_ROLES: Role[] = ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'];
const VALID_TABS = new Set<SettingsTab>(SETTINGS_TABS.map((t) => t.id));

@Component({
  selector: 'app-settings-page',
  imports: [FormsModule, LoadingStateComponent, RouterLink, FeaturePageHeaderComponent],
  template: `
    <div class="page feature-module-page settings-page">
      <app-feature-page-header group="Système" [title]="locale.t('settings')" backLabel="← AI Office">
        <div actions>
          <a routerLink="/app/workspace" class="btn btn-ghost">Workspace</a>
          <a routerLink="/app/help" class="btn btn-primary">Aide</a>
        </div>
      </app-feature-page-header>

      @if (loading()) {
        <app-loading-state message="Chargement des paramètres…" />
      } @else {
        <header class="settings-command" aria-label="Résumé paramètres">
          <div class="command-main">
            <div class="command-copy">
              <h2 class="command-title">{{ userDisplayName() }}</h2>
              <p class="command-sub">
                @if (org()) {
                  {{ companyLabel(org()!.name) }} · {{ auth.user()?.role }}
                } @else {
                  {{ auth.user()?.email }}
                }
              </p>
              <div class="command-stats">
                <div class="stat-pill" [style.--pill-accent]="planAccent()">
                  <span class="stat-val">{{ billing()?.plan ?? 'FREE' }}</span>
                  <span class="stat-lbl">Plan</span>
                </div>
                <div class="stat-pill" [class.ok]="mfaEnabled()">
                  <span class="stat-val">{{ mfaEnabled() ? 'ON' : 'OFF' }}</span>
                  <span class="stat-lbl">MFA</span>
                </div>
                <div class="stat-pill">
                  <span class="stat-val">{{ theme.resolved() === 'SOLARPUNK' ? 'Solar' : 'Night' }}</span>
                  <span class="stat-lbl">Thème</span>
                </div>
                @if (canManageMembers()) {
                  <div class="stat-pill">
                    <span class="stat-val">{{ members().length }}</span>
                    <span class="stat-lbl">Membres</span>
                  </div>
                }
              </div>
            </div>
          </div>
          @if (billing()) {
            <div class="usage-block">
              <div class="usage-row">
                <span class="usage-label">Sièges</span>
                <div class="usage-bar" role="progressbar" [attr.aria-valuenow]="billing()!.seatsUsed" [attr.aria-valuemin]="0" [attr.aria-valuemax]="billing()!.seatsLimit">
                  <span class="usage-fill" [style.width.%]="seatUsagePct()"></span>
                </div>
                <span class="usage-val">{{ billing()!.seatsUsed }}/{{ billing()!.seatsLimit }}</span>
              </div>
              <p class="usage-note">{{ billing()!.storageNote }}</p>
            </div>
          }
        </header>

        @if (billingMsg()) {
          <p class="banner-msg" role="status">{{ billingMsg() }}</p>
        }

        <div class="settings-layout">
          <nav class="settings-nav" aria-label="Sections paramètres">
            @for (tab of visibleTabs(); track tab.id) {
              <button
                type="button"
                class="settings-nav-item"
                [class.active]="activeTab() === tab.id"
                (click)="setTab(tab.id)"
              >
                <span class="nav-icon" aria-hidden="true">{{ tab.icon }}</span>
                <span class="nav-text">
                  <span class="nav-label">{{ tab.label }}</span>
                  <span class="nav-desc">{{ tab.desc }}</span>
                </span>
                @if (tab.id === 'team' && pendingInvites() > 0) {
                  <span class="nav-badge">{{ pendingInvites() }}</span>
                }
              </button>
            }
          </nav>

          <div class="settings-panel">
            @switch (activeTab()) {
              @case ('overview') {
                <section class="feature-hub card panel-card">
                  <header class="section-toolbar compact">
                    <h2 class="section-title">Vue d'ensemble</h2>
                    <span class="section-tag">Votre espace Nihao</span>
                  </header>
                  <div class="overview-grid">
                    <article class="overview-card">
                      <span class="ov-label">Compte</span>
                      <strong>{{ userDisplayName() }}</strong>
                      <span class="ov-meta">{{ auth.user()?.email }}</span>
                      <button type="button" class="link-btn" (click)="setTab('account')">Gérer →</button>
                    </article>
                    <article class="overview-card">
                      <span class="ov-label">Apparence</span>
                      <strong>{{ resolvedThemeLabel() }}</strong>
                      <span class="ov-meta">{{ locale.locale() === 'fr' ? 'Français' : 'English' }} · {{ theme.highContrast() ? 'Contraste élevé' : 'Standard' }}</span>
                      <button type="button" class="link-btn" (click)="setTab('appearance')">Personnaliser →</button>
                    </article>
                    <article class="overview-card" [style.--ov-accent]="planAccent()">
                      <span class="ov-label">Facturation</span>
                      <strong>{{ billing()?.plan ?? 'FREE' }}</strong>
                      <span class="ov-meta">{{ billing()?.storageNote ?? '—' }}</span>
                      <button type="button" class="link-btn" (click)="setTab('billing')">Voir le plan →</button>
                    </article>
                    <article class="overview-card" [class.warn]="!mfaEnabled()">
                      <span class="ov-label">Sécurité</span>
                      <strong>{{ mfaEnabled() ? 'MFA activé' : 'MFA désactivé' }}</strong>
                      <span class="ov-meta">{{ mfaEnabled() ? 'Compte protégé' : 'Recommandé pour les OWNER' }}</span>
                      <button type="button" class="link-btn" (click)="setTab('security')">Configurer →</button>
                    </article>
                  </div>
                </section>

                <section class="feature-hub card panel-card">
                  <header class="section-toolbar compact">
                    <h2 class="section-title">Ressources</h2>
                  </header>
                  <div class="resource-grid">
                    @for (link of resourceLinks; track link.route) {
                      <a [routerLink]="link.route" class="resource-card">
                        <strong>{{ link.label }}</strong>
                        <span>{{ link.desc }}</span>
                      </a>
                    }
                  </div>
                </section>
              }

              @case ('account') {
                @if (auth.user(); as user) {
                  <section class="feature-hub card panel-card">
                    <header class="section-toolbar compact">
                      <h2 class="section-title">Profil</h2>
                      <span class="section-tag">Compte connecté</span>
                    </header>
                    <div class="profile-head">
                      <span class="avatar" aria-hidden="true">{{ userInitials() }}</span>
                      <div>
                        <h3 class="profile-name">{{ user.firstName }} {{ user.lastName }}</h3>
                        <p class="profile-email">{{ user.email }}</p>
                      </div>
                    </div>
                    <dl class="meta">
                      <div><dt>Rôle</dt><dd>{{ user.role }}</dd></div>
                      <div><dt>Email</dt><dd>{{ user.email }}</dd></div>
                    </dl>
                  </section>
                }

                @if (org()) {
                  <section class="feature-hub card panel-card">
                    <header class="section-toolbar compact">
                      <h2 class="section-title">Organisation</h2>
                      <span class="section-tag">Tenant actif</span>
                    </header>
                    <h3 class="org-name">{{ companyLabel(org()!.name) }}</h3>
                    <dl class="meta">
                      <div><dt>Secteur</dt><dd>{{ org()!.sector }}</dd></div>
                      <div><dt>Slug</dt><dd>{{ org()!.slug }}</dd></div>
                    </dl>
                  </section>
                }
              }

              @case ('appearance') {
                <section class="feature-hub card panel-card">
                  <header class="section-toolbar compact">
                    <h2 class="section-title">Thème</h2>
                    <span class="section-tag">Interface globale</span>
                  </header>
                  <div class="theme-grid">
                    @for (opt of themeOptions; track opt.mode) {
                      <button
                        type="button"
                        class="theme-opt"
                        [class.active]="theme.mode() === opt.mode"
                        (click)="theme.setMode(opt.mode)"
                      >
                        <span class="theme-preview" [attr.data-mode]="opt.mode"></span>
                        <span class="opt-title">{{ opt.label }}</span>
                        <span class="opt-sub">{{ opt.hint }}</span>
                      </button>
                    }
                  </div>
                  <label class="toggle-row">
                    <input type="checkbox" [checked]="theme.highContrast()" (change)="theme.toggleHighContrast()" />
                    Contraste élevé (accessibilité WCAG)
                  </label>
                  <p class="hint">Thème actif · {{ theme.resolved() === 'SOLARPUNK' ? 'Solar' : 'Night' }}</p>
                </section>

                <section class="feature-hub card panel-card">
                  <header class="section-toolbar compact">
                    <h2 class="section-title">{{ locale.t('language') }}</h2>
                  </header>
                  <div class="lang-row">
                    <button type="button" class="lang-chip" [class.active]="locale.locale() === 'fr'" (click)="setLang('fr')">
                      <span class="lang-flag">FR</span> Français
                    </button>
                    <button type="button" class="lang-chip" [class.active]="locale.locale() === 'en'" (click)="setLang('en')">
                      <span class="lang-flag">EN</span> English
                    </button>
                  </div>
                </section>
              }

              @case ('team') {
                @if (canManageMembers()) {
                  <section class="feature-hub card panel-card">
                    <header class="section-toolbar">
                      <h2 class="section-title">Membres</h2>
                      <label class="section-search">
                        <span class="feature-search-icon" aria-hidden="true">⌕</span>
                        <input
                          class="input feature-search-input section-search-input"
                          type="search"
                          placeholder="Nom, email…"
                          [ngModel]="memberQuery()"
                          (ngModelChange)="memberQuery.set($event)"
                        />
                      </label>
                      <span class="section-count">{{ filteredMembers().length }}/{{ members().length }}</span>
                    </header>
                    @if (loadingMembers()) {
                      <p class="hint">Chargement…</p>
                    } @else if (!members().length) {
                      <p class="hint">Aucun membre.</p>
                    } @else {
                      <ul class="member-list">
                        @for (m of filteredMembers(); track m.id) {
                          <li>
                            <span class="member-avatar" aria-hidden="true">{{ memberInitials(m) }}</span>
                            <div class="member-info">
                              <span class="member-name">{{ m.firstName }} {{ m.lastName }}</span>
                              <span class="member-email">{{ m.email }}</span>
                            </div>
                            <select
                              class="input compact"
                              [ngModel]="m.role"
                              (ngModelChange)="updateRole(m, $event)"
                              [disabled]="memberBusy() === m.id"
                            >
                              @for (r of memberRoles; track r) {
                                <option [value]="r">{{ r }}</option>
                              }
                            </select>
                            @if (m.active !== false) {
                              <button type="button" class="btn btn-ghost btn-sm danger" (click)="deactivate(m)" [disabled]="memberBusy() === m.id">
                                Désactiver
                              </button>
                            }
                          </li>
                        } @empty {
                          <li class="empty-row">Aucun membre ne correspond à la recherche.</li>
                        }
                      </ul>
                    }
                    @if (memberMsg()) {
                      <p class="ok">{{ memberMsg() }}</p>
                    }
                  </section>

                  <section class="feature-hub card panel-card">
                    <header class="section-toolbar compact">
                      <h2 class="section-title">Invitations</h2>
                      <span class="section-tag">Inviter un collaborateur</span>
                    </header>
                    <form class="invite-form" (ngSubmit)="sendInvite()">
                      <input class="input" type="email" [(ngModel)]="inviteEmail" name="inviteEmail" placeholder="email@entreprise.fr" required />
                      <select class="input" [(ngModel)]="inviteRole" name="inviteRole">
                        @for (r of memberRoles; track r) {
                          <option [value]="r">{{ r }}</option>
                        }
                      </select>
                      <button type="submit" class="btn btn-primary" [disabled]="inviteBusy()">Inviter</button>
                    </form>
                    @if (invites().length) {
                      <ul class="invite-list">
                        @for (inv of invites(); track inv.id) {
                          <li>
                            <span class="invite-email">{{ inv.email }}</span>
                            <span class="invite-role">{{ inv.role }}</span>
                            <span class="invite-exp">expire {{ inv.expiresAt || '—' }}</span>
                          </li>
                        }
                      </ul>
                    }
                    @if (inviteMsg()) {
                      <p class="ok">{{ inviteMsg() }}</p>
                    }
                  </section>
                } @else {
                  <section class="feature-hub card panel-card">
                    <p class="hint">Seuls les ADMIN et OWNER peuvent gérer l'équipe.</p>
                  </section>
                }
              }

              @case ('billing') {
                <section class="feature-hub card panel-card">
                  <header class="section-toolbar compact">
                    <h2 class="section-title">Plan actuel</h2>
                    <span class="plan-badge" [style.--plan-accent]="planAccent()">{{ billing()?.plan ?? 'FREE' }}</span>
                  </header>
                  @if (billing()) {
                    <p class="plan-hint">{{ planHint() }}</p>
                    <dl class="meta">
                      <div><dt>Sièges</dt><dd>{{ billing()!.seatsUsed }} / {{ billing()!.seatsLimit }}</dd></div>
                      <div><dt>Stockage</dt><dd>{{ billing()!.storageNote }}</dd></div>
                    </dl>
                    <div class="usage-bar large" role="progressbar" [attr.aria-valuenow]="billing()!.seatsUsed" [attr.aria-valuemin]="0" [attr.aria-valuemax]="billing()!.seatsLimit">
                      <span class="usage-fill" [style.width.%]="seatUsagePct()"></span>
                    </div>
                  }
                  @if (isOwner()) {
                    <div class="plan-cards">
                      @for (plan of upgradePlans; track plan.id) {
                        <article class="plan-card" [class.current]="billing()?.plan === plan.id" [style.--plan-accent]="plan.accent">
                          <h3>{{ plan.label }}</h3>
                          <p>{{ plan.hint }}</p>
                          <button
                            type="button"
                            class="btn"
                            [class.btn-primary]="billing()?.plan !== plan.id"
                            [class.btn-ghost]="billing()?.plan === plan.id"
                            [disabled]="planBusy() || billing()?.plan === plan.id"
                            (click)="upgradePlan(plan.id)"
                          >
                            {{ billing()?.plan === plan.id ? 'Plan actuel' : 'Passer ' + plan.label }}
                          </button>
                        </article>
                      }
                    </div>
                    @if (billing()?.plan !== 'FREE') {
                      <p class="hint downgrade-note">
                        Pour rétrograder vers FREE, contactez le support — pas de downgrade en self-service.
                      </p>
                    }
                  } @else {
                    <p class="hint">Seul le OWNER peut modifier le plan.</p>
                  }
                </section>
              }

              @case ('security') {
                <section class="feature-hub card panel-card">
                  <header class="section-toolbar compact">
                    <h2 class="section-title">Authentification à deux facteurs</h2>
                    <span class="status-chip" [class.on]="mfaEnabled()">{{ mfaEnabled() ? 'Activé' : 'Désactivé' }}</span>
                  </header>
                  @if (!mfaEnabled()) {
                    <p class="hint">Protégez votre compte avec une application d'authentification (Google Authenticator, Authy…).</p>
                    <button type="button" class="btn btn-primary" (click)="startMfa()" [disabled]="mfaBusy()">Activer MFA</button>
                    @if (mfaEnrollment()) {
                      <div class="mfa-setup">
                        @if (mfaEnrollment()!.otpauthUri) {
                          <p class="hint mono">URI · {{ mfaEnrollment()!.otpauthUri }}</p>
                        }
                        @if (mfaEnrollment()!.secret) {
                          <p class="hint mono">Secret · {{ mfaEnrollment()!.secret }}</p>
                        }
                        <form class="mfa-form" (ngSubmit)="confirmMfaCode()">
                          <input
                            class="input"
                            [(ngModel)]="mfaCode"
                            name="mfaCode"
                            placeholder="Code à 6 chiffres"
                            maxlength="6"
                            inputmode="numeric"
                            autocomplete="one-time-code"
                          />
                          <button type="submit" class="btn btn-ghost">Confirmer</button>
                        </form>
                        <p class="hint">Saisissez le code affiché par votre application d'authentification.</p>
                      </div>
                    }
                  } @else {
                    <p class="ok">MFA activé sur ce compte.</p>
                    <form class="mfa-form" (ngSubmit)="disableMfaAccount()">
                      <input class="input" type="password" [(ngModel)]="mfaPassword" name="mfaPassword" placeholder="Mot de passe" />
                      <button type="submit" class="btn btn-ghost danger">Désactiver MFA</button>
                    </form>
                  }
                  @if (mfaMsg()) {
                    <p class="hint" [class.ok]="mfaMsgOk()">{{ mfaMsg() }}</p>
                  }
                </section>

                <section class="feature-hub card panel-card danger-zone">
                  <header class="section-toolbar compact">
                    <h2 class="section-title">Confidentialité</h2>
                    <span class="section-tag">RGPD</span>
                  </header>
                  <p class="hint">Exportez vos données personnelles ou demandez l'effacement de votre compte.</p>
                  <div class="actions-row">
                    <button type="button" class="btn btn-ghost" (click)="exportData()" [disabled]="privacyBusy()">
                      Exporter mes données (JSON)
                    </button>
                    <button type="button" class="btn btn-ghost danger" (click)="eraseAccount()" [disabled]="privacyBusy()">
                      Effacer mon compte
                    </button>
                  </div>
                  @if (privacyMsg()) {
                    <p class="hint">{{ privacyMsg() }}</p>
                  }
                </section>
              }
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .settings-command {
      display: flex; flex-wrap: wrap; gap: var(--dash-inline-gap); align-items: stretch; justify-content: space-between;
      margin-bottom: var(--dash-inline-gap); padding: var(--dash-band-gap);
      border: 1px solid var(--border-color); border-radius: var(--radius-lg);
      background: linear-gradient(135deg, color-mix(in srgb, var(--accent-primary) 6%, var(--bg-elevated)), var(--bg-elevated));
    }
    .command-main { flex: 1; min-width: min(100%, 16rem); }
    .command-title { margin: 0 0 0.25rem; font-size: 1.05rem; font-family: var(--font-display); }
    .command-sub { margin: 0 0 0.65rem; font-size: 0.82rem; color: var(--text-secondary); }
    .command-stats { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .stat-pill {
      display: flex; flex-direction: column; gap: 0.1rem; padding: 0.4rem 0.55rem;
      border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-primary); min-width: 4rem;
    }
    .stat-pill.ok .stat-val { color: var(--accent-success); }
    .stat-val { font-weight: var(--fw-bold); font-size: 0.9rem; color: var(--pill-accent, var(--accent-primary)); }
    .stat-lbl { font-size: 0.62rem; color: var(--text-muted); text-transform: uppercase; }

    .usage-block { min-width: min(100%, 14rem); align-self: center; }
    .usage-row { display: grid; grid-template-columns: auto 1fr auto; gap: 0.5rem; align-items: center; font-size: 0.75rem; }
    .usage-label { color: var(--text-muted); font-weight: 600; }
    .usage-val { font-variant-numeric: tabular-nums; color: var(--text-secondary); }
    .usage-note { margin: 0.35rem 0 0; font-size: 0.68rem; color: var(--text-muted); }
    .usage-bar {
      height: 0.45rem; border-radius: 999px; background: var(--bg-secondary);
      border: 1px solid var(--border-color); overflow: hidden;
    }
    .usage-bar.large { height: 0.55rem; margin-top: 0.65rem; }
    .usage-fill {
      display: block; height: 100%; border-radius: 999px;
      background: linear-gradient(90deg, var(--accent-primary), color-mix(in srgb, var(--accent-primary) 70%, #fff));
      transition: width var(--transition);
    }

    .banner-msg {
      margin: 0 0 var(--dash-inline-gap); padding: 0.65rem 0.85rem;
      border-radius: var(--radius-md); font-size: 0.82rem;
      border: 1px solid color-mix(in srgb, var(--accent-success) 40%, transparent);
      background: color-mix(in srgb, var(--accent-success) 10%, transparent);
      color: var(--accent-success);
    }

    .settings-layout {
      display: grid; grid-template-columns: minmax(11rem, 13.5rem) minmax(0, 1fr);
      gap: var(--dash-inline-gap); align-items: start;
    }
    .settings-nav { display: flex; flex-direction: column; gap: 0.25rem; position: sticky; top: 0.5rem; }
    .settings-nav-item {
      display: flex; align-items: center; gap: 0.5rem; width: 100%; text-align: left;
      border: 1px solid transparent; background: transparent; border-radius: var(--radius-md);
      padding: 0.55rem 0.6rem; cursor: pointer; color: var(--text-secondary);
      transition: background var(--transition), border-color var(--transition);
    }
    .settings-nav-item:hover { background: var(--bg-hover); color: var(--text-primary); }
    .settings-nav-item.active {
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
      background: color-mix(in srgb, var(--accent-warning) 15%, transparent);
      border: 1px solid color-mix(in srgb, var(--accent-warning) 40%, transparent);
      color: var(--accent-warning); flex-shrink: 0;
    }
    .settings-panel { display: flex; flex-direction: column; gap: var(--dash-inline-gap); min-width: 0; }
    .panel-card { padding: var(--dash-band-gap); }

    .section-toolbar {
      display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 0.65rem;
      margin-bottom: var(--dash-inline-gap); padding-bottom: var(--dash-inline-gap);
      border-bottom: 1px solid color-mix(in srgb, var(--border-color) 70%, transparent);
    }
    .section-toolbar.compact { margin-bottom: 0.65rem; padding-bottom: 0.65rem; }
    .section-title { margin: 0; font-size: 0.92rem; font-weight: var(--fw-semibold); }
    .section-tag { font-size: 0.72rem; color: var(--text-muted); justify-self: end; }
    .section-search { display: flex; align-items: center; gap: 0.35rem; min-width: 0; justify-self: center; width: min(100%, 16rem); }
    .section-search-input { width: 100%; min-width: 0; }
    .section-count {
      font-size: 0.72rem; color: var(--text-muted); padding: 0.2rem 0.5rem;
      border: 1px solid var(--border-color); border-radius: var(--radius-sm); justify-self: end;
    }

    .overview-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem;
    }
    .overview-card {
      display: flex; flex-direction: column; gap: 0.2rem; padding: 0.75rem;
      border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-primary);
    }
    .overview-card.warn { border-color: color-mix(in srgb, var(--accent-warning) 40%, var(--border-color)); }
    .ov-label { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); font-weight: 700; }
    .overview-card strong { font-size: 0.88rem; color: var(--ov-accent, var(--text-primary)); }
    .ov-meta { font-size: 0.72rem; color: var(--text-muted); margin-bottom: 0.35rem; }
    .link-btn {
      align-self: flex-start; border: none; background: none; padding: 0;
      font-size: 0.72rem; font-weight: 700; color: var(--accent-primary); cursor: pointer;
    }
    .link-btn:hover { text-decoration: underline; }

    .resource-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.5rem; }
    .resource-card {
      display: flex; flex-direction: column; gap: 0.2rem; padding: 0.65rem;
      border: 1px solid var(--border-color); border-radius: var(--radius-md);
      background: var(--bg-primary); text-decoration: none; color: inherit;
      transition: border-color var(--transition);
    }
    .resource-card:hover { text-decoration: none; border-color: var(--accent-primary); }
    .resource-card strong { font-size: 0.82rem; }
    .resource-card span { font-size: 0.68rem; color: var(--text-muted); }

    .profile-head { display: flex; gap: 0.75rem; align-items: center; margin-bottom: 0.75rem; }
    .avatar, .member-avatar {
      width: 2.5rem; height: 2.5rem; border-radius: 50%; flex-shrink: 0;
      display: grid; place-items: center; font-size: 0.75rem; font-weight: 800;
      background: color-mix(in srgb, var(--accent-primary) 18%, transparent);
      color: var(--accent-primary); border: 1px solid color-mix(in srgb, var(--accent-primary) 35%, transparent);
    }
    .member-avatar { width: 1.75rem; height: 1.75rem; font-size: 0.62rem; }
    .profile-name, .org-name { margin: 0; font-size: 1rem; font-family: var(--font-display); }
    .profile-email { margin: 0.15rem 0 0; font-size: 0.78rem; color: var(--text-muted); }

    .meta { margin: 0; display: grid; gap: 0.45rem; }
    .meta div { display: grid; grid-template-columns: 5.5rem 1fr; gap: 0.5rem; font-size: 0.85rem; }
    dt { color: var(--text-muted); font-weight: 600; }
    dd { margin: 0; color: var(--text-primary); font-family: var(--font-mono); font-size: 0.8rem; }

    .theme-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.5rem; margin-bottom: 0.75rem; }
    .theme-opt {
      text-align: left; border: 1px solid var(--border-color); background: var(--bg-primary);
      border-radius: var(--radius-md); padding: 0.65rem; cursor: pointer;
      display: flex; flex-direction: column; gap: 0.25rem; color: var(--text-secondary);
      transition: border-color var(--transition), background var(--transition);
    }
    .theme-opt.active {
      border-color: var(--accent-primary);
      background: color-mix(in srgb, var(--accent-primary) 10%, var(--bg-elevated));
      color: var(--text-primary);
    }
    .theme-preview {
      height: 1.5rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);
    }
    .theme-preview[data-mode='SOLARPUNK'] { background: linear-gradient(135deg, #fef9c3, #86efac); }
    .theme-preview[data-mode='CYBERPUNK'] { background: linear-gradient(135deg, #1e1b4b, #7c3aed); }
    .theme-preview[data-mode='AUTO'] { background: linear-gradient(90deg, #fef9c3 50%, #1e1b4b 50%); }
    .opt-title { font-weight: 700; font-size: 0.82rem; }
    .opt-sub { font-size: 0.68rem; color: var(--text-muted); }

    .toggle-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; margin: 0.5rem 0; }
    .lang-row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .lang-chip {
      display: inline-flex; align-items: center; gap: 0.4rem;
      border: 1px solid var(--border-color); background: var(--bg-primary);
      border-radius: var(--radius-md); padding: 0.5rem 0.75rem; cursor: pointer; font-size: 0.82rem;
    }
    .lang-chip.active { border-color: var(--accent-primary); color: var(--accent-primary); background: color-mix(in srgb, var(--accent-primary) 8%, transparent); }
    .lang-flag { font-size: 0.65rem; font-weight: 800; padding: 0.1rem 0.3rem; border-radius: 3px; background: var(--bg-secondary); }

    .member-list, .invite-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.35rem; }
    .member-list li {
      display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem;
      padding: 0.55rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);
      background: var(--bg-primary); font-size: 0.82rem;
    }
    .member-info { flex: 1; min-width: 8rem; display: flex; flex-direction: column; gap: 0.1rem; }
    .member-name { font-weight: 600; }
    .member-email { color: var(--text-muted); font-size: 0.72rem; }
    .invite-list li {
      display: grid; grid-template-columns: 1fr auto auto; gap: 0.5rem; align-items: center;
      padding: 0.45rem 0.55rem; border-bottom: 1px solid var(--border-color); font-size: 0.78rem;
    }
    .invite-email { font-weight: 600; }
    .invite-role { color: var(--text-muted); font-size: 0.72rem; }
    .invite-exp { color: var(--text-muted); font-size: 0.68rem; justify-self: end; }
    .empty-row { padding: 0.75rem; text-align: center; color: var(--text-muted); font-size: 0.8rem; }
    .input.compact { max-width: 8rem; padding: 0.35rem 0.5rem; font-size: 0.78rem; }

    .plan-badge {
      font-size: 0.72rem; font-weight: 800; padding: 0.2rem 0.55rem; border-radius: 999px;
      background: color-mix(in srgb, var(--plan-accent) 18%, transparent);
      color: var(--plan-accent); border: 1px solid color-mix(in srgb, var(--plan-accent) 40%, transparent);
    }
    .plan-hint { margin: 0 0 0.5rem; font-size: 0.8rem; color: var(--text-secondary); }
    .plan-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.5rem; margin-top: 0.75rem; }
    .plan-card {
      padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);
      background: var(--bg-primary); display: flex; flex-direction: column; gap: 0.35rem;
    }
    .plan-card.current { border-color: color-mix(in srgb, var(--plan-accent) 50%, var(--border-color)); }
    .plan-card h3 { margin: 0; font-size: 0.9rem; color: var(--plan-accent); }
    .plan-card p { margin: 0; font-size: 0.72rem; color: var(--text-muted); flex: 1; }

    .status-chip {
      font-size: 0.68rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 999px;
      background: color-mix(in srgb, var(--accent-warning) 12%, transparent);
      color: var(--accent-warning); border: 1px solid color-mix(in srgb, var(--accent-warning) 35%, transparent);
    }
    .status-chip.on {
      background: color-mix(in srgb, var(--accent-success) 12%, transparent);
      color: var(--accent-success); border-color: color-mix(in srgb, var(--accent-success) 35%, transparent);
    }

    .danger-zone { border-color: color-mix(in srgb, var(--accent-danger) 25%, var(--border-color)); }
    .invite-form, .mfa-form { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
    .invite-form .input { flex: 1; min-width: 140px; }
    .actions-row { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
    .hint, .ok { font-size: 0.72rem; color: var(--text-muted); margin: 0.5rem 0 0; }
    .ok { color: var(--accent-success); }
    .btn.danger, .danger { color: var(--accent-danger); }
    .downgrade-note { margin-top: 0.65rem; }
    .mono { font-family: var(--font-mono); word-break: break-all; }
    .mfa-setup { margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.35rem; }

    @media (max-width: 900px) {
      .settings-layout { grid-template-columns: 1fr; }
      .settings-nav { flex-direction: row; flex-wrap: wrap; position: static; }
      .settings-nav-item { flex: 1 1 calc(50% - 0.25rem); min-width: 9rem; }
      .nav-desc { display: none; }
      .usage-block { width: 100%; }
      .section-toolbar { grid-template-columns: 1fr; }
      .section-search { width: 100%; grid-column: 1 / -1; }
      .section-tag, .section-count, .plan-badge, .status-chip { justify-self: start; }
    }
  `],
})
export class SettingsPage implements OnInit {
  protected readonly companyLabel = companyLabel;
  readonly resourceLinks = RESOURCE_LINKS;

  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly locale = inject(LocaleService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly loadingMembers = signal(false);
  readonly org = signal<Organization | null>(null);
  readonly members = signal<MembershipMember[]>([]);
  readonly invites = signal<OrganizationInvite[]>([]);
  readonly billing = signal<BillingPlan | null>(null);
  readonly memberBusy = signal<string | null>(null);
  readonly memberMsg = signal('');
  readonly inviteBusy = signal(false);
  readonly inviteMsg = signal('');
  readonly privacyBusy = signal(false);
  readonly privacyMsg = signal('');
  readonly planBusy = signal(false);
  readonly billingMsg = signal('');
  readonly mfaBusy = signal(false);
  readonly mfaEnabled = signal(false);
  readonly mfaEnrollment = signal<{ secret?: string; otpauthUri?: string } | null>(null);
  readonly mfaMsg = signal('');
  readonly mfaMsgOk = signal(false);
  readonly activeTab = signal<SettingsTab>('overview');
  readonly memberQuery = signal('');

  mfaCode = '';
  mfaPassword = '';
  inviteEmail = '';
  inviteRole: Role = 'MEMBER';

  readonly memberRoles = MEMBER_ROLES;

  readonly themeOptions: { mode: ThemeMode; label: string; hint: string }[] = [
    { mode: 'SOLARPUNK', label: 'Solar', hint: 'Clair · opérations jour' },
    { mode: 'CYBERPUNK', label: 'Night', hint: 'Sombre · command center' },
    { mode: 'AUTO', label: 'Auto', hint: 'Basculera 08:00 / 20:00' },
  ];

  readonly upgradePlans = [
    { id: 'PRO' as const, label: 'Pro', hint: PLAN_META['PRO']!.hint, accent: PLAN_META['PRO']!.accent },
    { id: 'BUSINESS' as const, label: 'Business', hint: PLAN_META['BUSINESS']!.hint, accent: PLAN_META['BUSINESS']!.accent },
  ];

  readonly canManageMembers = computed(() => {
    const role = this.auth.user()?.role;
    return role != null && ADMIN_ROLES.includes(role);
  });

  readonly isOwner = computed(() => this.auth.user()?.role === 'OWNER');

  readonly visibleTabs = computed(() =>
    SETTINGS_TABS.filter((t) => !t.adminOnly || this.canManageMembers()),
  );

  readonly filteredMembers = computed(() => {
    const q = this.memberQuery().trim().toLowerCase();
    if (!q) return this.members();
    return this.members().filter(
      (m) =>
        m.email.toLowerCase().includes(q) ||
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q),
    );
  });

  readonly pendingInvites = computed(() => this.invites().length);

  readonly seatUsagePct = computed(() => {
    const b = this.billing();
    if (!b || b.seatsLimit <= 0) return 0;
    return Math.min(100, Math.round((b.seatsUsed / b.seatsLimit) * 100));
  });

  readonly planAccent = computed(() => {
    const plan = this.billing()?.plan ?? 'FREE';
    return PLAN_META[plan]?.accent ?? PLAN_META['FREE']!.accent;
  });

  readonly planHint = computed(() => {
    const plan = this.billing()?.plan ?? 'FREE';
    return PLAN_META[plan]?.hint ?? '';
  });

  ngOnInit(): void {
    this.applyTabFromRoute();
    void this.loadAll();
    void this.handleBillingReturn();
  }

  setTab(tab: SettingsTab): void {
    this.activeTab.set(tab);
  }

  userDisplayName(): string {
    const u = this.auth.user();
    if (!u) return 'Compte';
    return `${u.firstName} ${u.lastName}`.trim() || u.email;
  }

  userInitials(): string {
    const u = this.auth.user();
    if (!u) return '?';
    const a = u.firstName?.[0] ?? '';
    const b = u.lastName?.[0] ?? '';
    return (a + b).toUpperCase() || u.email[0]?.toUpperCase() || '?';
  }

  memberInitials(m: MembershipMember): string {
    const a = m.firstName?.[0] ?? '';
    const b = m.lastName?.[0] ?? '';
    return (a + b).toUpperCase() || m.email[0]?.toUpperCase() || '?';
  }

  resolvedThemeLabel(): string {
    const mode = this.theme.mode();
    return this.themeOptions.find((o) => o.mode === mode)?.label ?? mode;
  }

  private applyTabFromRoute(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab') as SettingsTab | null;
    if (tab && VALID_TABS.has(tab)) {
      this.activeTab.set(tab);
    }
    if (this.route.snapshot.queryParamMap.get('billing')) {
      this.activeTab.set('billing');
    }
  }

  private async handleBillingReturn(): Promise<void> {
    const billingParam = this.route.snapshot.queryParamMap.get('billing');
    if (billingParam !== 'success' && billingParam !== 'stub') return;

    this.activeTab.set('billing');
    this.billingMsg.set('Paiement en cours de validation…');
    const reference =
      this.route.snapshot.queryParamMap.get('ref') ?? sessionStorage.getItem(CHECKOUT_REF_KEY);
    if (reference) {
      if (billingParam === 'stub') {
        try {
          await firstValueFrom(this.api.stubCompleteBilling(reference));
        } catch {
          /* may already be completed */
        }
      } else {
        await this.pollCheckout(reference);
      }
      sessionStorage.removeItem(CHECKOUT_REF_KEY);
    }
    await this.reloadBilling();
    this.billingMsg.set('Plan mis à jour.');
  }

  private async pollCheckout(reference: string, attempts = 8): Promise<void> {
    for (let i = 0; i < attempts; i++) {
      try {
        const status = await firstValueFrom(this.api.getBillingCheckout(reference));
        if (PAID_CHECKOUT_STATUSES.has(status.status.toUpperCase())) {
          return;
        }
      } catch {
        /* retry */
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  async reloadBilling(): Promise<void> {
    try {
      const plan = await firstValueFrom(this.api.getBillingPlan());
      this.billing.set(plan);
    } catch {
      /* keep current */
    }
  }

  async loadAll(): Promise<void> {
    this.loading.set(true);
    try {
      const org = await firstValueFrom(this.api.getCurrentOrganization());
      this.org.set(org);
    } catch {
      /* ignore */
    }
    try {
      const plan = await firstValueFrom(this.api.getBillingPlan());
      this.billing.set(plan);
    } catch {
      this.billing.set(defaultBillingPlan({ storageNote: 'Plan local stub' }));
    }
    if (this.canManageMembers()) {
      await this.loadMembersAndInvites();
    }
    this.loading.set(false);
  }

  async loadMembersAndInvites(): Promise<void> {
    this.loadingMembers.set(true);
    try {
      const [members, invites] = await Promise.all([
        firstValueFrom(this.api.getMembers()),
        firstValueFrom(this.api.listInvites()),
      ]);
      this.members.set(members);
      this.invites.set(invites);
    } catch {
      this.members.set([]);
      this.invites.set([]);
    } finally {
      this.loadingMembers.set(false);
    }
  }

  setLang(locale: AppLocale): void {
    this.locale.setLocale(locale);
    void firstValueFrom(this.api.setLocale(locale)).catch(() => undefined);
  }

  async updateRole(m: MembershipMember, role: string): Promise<void> {
    this.memberBusy.set(m.id);
    this.memberMsg.set('');
    try {
      await firstValueFrom(this.api.updateMember(m.id, { role }));
      this.memberMsg.set('Rôle mis à jour.');
      await this.loadMembersAndInvites();
    } catch (err) {
      this.memberMsg.set(mapHttpError(err, 'Mise à jour impossible'));
    } finally {
      this.memberBusy.set(null);
    }
  }

  async deactivate(m: MembershipMember): Promise<void> {
    const ok = await this.confirmDialog.confirm({
      title: 'Désactiver le membre',
      message: `Désactiver ${m.email} ? Il ne pourra plus se connecter.`,
      confirmLabel: 'Désactiver',
      danger: true,
    });
    if (!ok) return;
    this.memberBusy.set(m.id);
    try {
      await firstValueFrom(this.api.updateMember(m.id, { role: m.role, active: false }));
      await this.loadMembersAndInvites();
      this.toast.success('Membre désactivé.');
    } catch (err) {
      this.memberMsg.set(mapHttpError(err, 'Désactivation impossible'));
      this.toast.error(mapHttpError(err, 'Désactivation impossible'));
    } finally {
      this.memberBusy.set(null);
    }
  }

  async sendInvite(): Promise<void> {
    if (!this.inviteEmail.trim()) return;
    this.inviteBusy.set(true);
    this.inviteMsg.set('');
    try {
      await firstValueFrom(this.api.createInvite({ email: this.inviteEmail.trim(), role: this.inviteRole }));
      this.inviteMsg.set('Invitation envoyée.');
      this.inviteEmail = '';
      await this.loadMembersAndInvites();
    } catch (err) {
      this.inviteMsg.set(mapHttpError(err, 'Invitation impossible'));
    } finally {
      this.inviteBusy.set(false);
    }
  }

  async upgradePlan(plan: 'PRO' | 'BUSINESS'): Promise<void> {
    this.planBusy.set(true);
    this.billingMsg.set('');
    try {
      const checkout = await firstValueFrom(this.api.createBillingCheckout(plan));
      if (this.isStubCheckoutUrl(checkout.hostedCheckoutUrl)) {
        await firstValueFrom(this.api.stubCompleteBilling(checkout.checkoutReference));
        await this.reloadBilling();
        this.billingMsg.set(`Plan ${plan} activé (mode dev).`);
        return;
      }
      sessionStorage.setItem(CHECKOUT_REF_KEY, checkout.checkoutReference);
      window.location.href = checkout.hostedCheckoutUrl;
    } catch (err) {
      this.billingMsg.set(mapHttpError(err, 'Checkout impossible. Réessayez.'));
    } finally {
      this.planBusy.set(false);
    }
  }

  private isStubCheckoutUrl(url: string): boolean {
    try {
      const parsed = new URL(url, window.location.origin);
      return (
        parsed.hostname === 'localhost' ||
        parsed.hostname === '127.0.0.1' ||
        parsed.pathname.includes('/settings')
      );
    } catch {
      return url.includes('localhost') || url.includes('/settings');
    }
  }

  async exportData(): Promise<void> {
    this.privacyBusy.set(true);
    this.privacyMsg.set('');
    try {
      const data = await firstValueFrom(this.api.exportPrivacy());
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nihao-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.privacyMsg.set('Export téléchargé.');
    } catch (err) {
      this.privacyMsg.set(mapHttpError(err, 'Export impossible'));
    } finally {
      this.privacyBusy.set(false);
    }
  }

  async eraseAccount(): Promise<void> {
    const ok = await this.confirmDialog.confirm({
      title: 'Effacer le compte',
      message: 'Cette action est irréversible. Effacer votre compte et vos données personnelles ?',
      confirmLabel: 'Effacer définitivement',
      danger: true,
    });
    if (!ok) return;
    this.privacyBusy.set(true);
    try {
      await firstValueFrom(this.api.eraseMe());
      this.privacyMsg.set('Demande enregistrée. Déconnexion…');
      this.toast.success('Compte effacé. Déconnexion…');
      this.auth.logout();
    } catch (err) {
      this.privacyMsg.set(mapHttpError(err, 'Effacement impossible'));
      this.toast.error(mapHttpError(err, 'Effacement impossible'));
    } finally {
      this.privacyBusy.set(false);
    }
  }

  async startMfa(): Promise<void> {
    this.mfaBusy.set(true);
    this.mfaMsg.set('');
    this.mfaMsgOk.set(false);
    try {
      const res = await firstValueFrom(this.api.enableMfa());
      const email = this.auth.user()?.email ?? 'user';
      const secret = res.secret ?? '';
      const otpauthUri =
        res.otpauthUri ??
        (secret
          ? `otpauth://totp/NIHAO:${encodeURIComponent(email)}?secret=${secret}&issuer=NIHAO`
          : undefined);
      this.mfaEnrollment.set({ secret, otpauthUri });
    } catch (err) {
      this.mfaMsg.set(mapHttpError(err, 'Activation MFA impossible'));
    } finally {
      this.mfaBusy.set(false);
    }
  }

  async confirmMfaCode(): Promise<void> {
    if (!this.mfaCode.trim()) return;
    this.mfaBusy.set(true);
    this.mfaMsg.set('');
    this.mfaMsgOk.set(false);
    try {
      await firstValueFrom(this.api.confirmMfa(this.mfaCode.trim()));
      this.mfaEnabled.set(true);
      this.mfaEnrollment.set(null);
      this.mfaCode = '';
      this.mfaMsg.set('MFA activé.');
      this.mfaMsgOk.set(true);
    } catch (err) {
      this.mfaMsg.set(mapHttpError(err, 'Code invalide — vérifiez votre application d\'authentification.'));
    } finally {
      this.mfaBusy.set(false);
    }
  }

  async disableMfaAccount(): Promise<void> {
    this.mfaBusy.set(true);
    this.mfaMsg.set('');
    this.mfaMsgOk.set(false);
    try {
      await firstValueFrom(this.api.disableMfa(this.mfaPassword));
      this.mfaEnabled.set(false);
      this.mfaPassword = '';
      this.mfaMsg.set('MFA désactivé.');
      this.mfaMsgOk.set(true);
    } catch (err) {
      this.mfaMsg.set(mapHttpError(err, 'Désactivation MFA impossible'));
    } finally {
      this.mfaBusy.set(false);
    }
  }
}
