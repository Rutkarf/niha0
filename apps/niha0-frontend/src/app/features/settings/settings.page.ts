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
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../shared/ui/toast/toast.service';

const CHECKOUT_REF_KEY = 'niha0_checkout_ref';
const PAID_CHECKOUT_STATUSES = new Set(['PAID', 'COMPLETED', 'SUCCESS', 'SUCCESSFUL']);
const ADMIN_ROLES: Role[] = ['OWNER', 'ADMIN'];
const MEMBER_ROLES: Role[] = ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'];

@Component({
  selector: 'app-settings-page',
  imports: [FormsModule, LoadingStateComponent, RouterLink],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <a routerLink="/app/ai-office" class="back-ao">← AI Office</a>
          <h1>{{ locale.t('settings') }}</h1>
          <p>Organisation, membres, billing, confidentialité · <a routerLink="/app/workspace">Personnalisation workspace</a></p>
        </div>
      </header>

      @if (loading()) {
        <app-loading-state />
      } @else {
        @if (org()) {
          <section class="card settings-card">
            <p class="section-label">Organisation</p>
            <h2>{{ org()!.name }}</h2>
            <dl class="meta">
              <div><dt>Secteur</dt><dd>{{ org()!.sector }}</dd></div>
              <div><dt>Slug</dt><dd>{{ org()!.slug }}</dd></div>
            </dl>
          </section>
        }

        <section class="card settings-card">
          <p class="section-label">Apparence</p>
          <h2>Thème</h2>
          <div class="theme-options">
            @for (opt of themeOptions; track opt.mode) {
              <button
                type="button"
                class="theme-opt"
                [class.active]="theme.mode() === opt.mode"
                (click)="theme.setMode(opt.mode)"
              >
                <span class="opt-title">{{ opt.label }}</span>
                <span class="opt-sub">{{ opt.hint }}</span>
              </button>
            }
          </div>
          <label class="toggle-row">
            <input type="checkbox" [checked]="theme.highContrast()" (change)="theme.toggleHighContrast()" />
            Contraste élevé (accessibilité)
          </label>
          <p class="hint">Actif · {{ theme.resolved() === 'SOLARPUNK' ? 'Solar' : 'Night' }}</p>
        </section>

        <section class="card settings-card">
          <p class="section-label">{{ locale.t('language') }}</p>
          <div class="lang-row">
            <button type="button" class="btn btn-ghost" [class.active]="locale.locale() === 'fr'" (click)="setLang('fr')">Français</button>
            <button type="button" class="btn btn-ghost" [class.active]="locale.locale() === 'en'" (click)="setLang('en')">English</button>
          </div>
        </section>

        @if (canManageMembers()) {
          <section class="card settings-card">
            <p class="section-label">Membres</p>
            @if (loadingMembers()) {
              <p class="hint">Chargement…</p>
            } @else if (!members().length) {
              <p class="hint">Aucun membre.</p>
            } @else {
              <ul class="member-list">
                @for (m of members(); track m.id) {
                  <li>
                    <span class="member-name">{{ m.firstName }} {{ m.lastName }}</span>
                    <span class="member-email">{{ m.email }}</span>
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
                      <button type="button" class="btn btn-ghost danger" (click)="deactivate(m)" [disabled]="memberBusy() === m.id">
                        Désactiver
                      </button>
                    }
                  </li>
                }
              </ul>
            }
            @if (memberMsg()) {
              <p class="ok">{{ memberMsg() }}</p>
            }
          </section>

          <section class="card settings-card">
            <p class="section-label">Invitations</p>
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
                  <li>{{ inv.email }} · {{ inv.role }} · expire {{ inv.expiresAt || '—' }}</li>
                }
              </ul>
            }
            @if (inviteMsg()) {
              <p class="ok">{{ inviteMsg() }}</p>
            }
          </section>
        }

        <section class="card settings-card">
          <p class="section-label">Plan billing</p>
          @if (billing()) {
            <p class="plan-current">Plan actuel · <strong>{{ billing()!.plan }}</strong></p>
            <dl class="meta">
              <div><dt>Sièges</dt><dd>{{ billing()!.seatsUsed }} / {{ billing()!.seatsLimit }}</dd></div>
              <div><dt>Stockage</dt><dd>{{ billing()!.storageNote }}</dd></div>
            </dl>
          }
          @if (billingMsg()) {
            <p class="hint">{{ billingMsg() }}</p>
          }
          @if (isOwner()) {
            <div class="plan-row">
              <button
                type="button"
                class="btn btn-primary"
                [disabled]="planBusy() || billing()?.plan === 'PRO'"
                (click)="upgradePlan('PRO')"
              >
                Passer PRO
              </button>
              <button
                type="button"
                class="btn btn-primary"
                [disabled]="planBusy() || billing()?.plan === 'BUSINESS'"
                (click)="upgradePlan('BUSINESS')"
              >
                Passer BUSINESS
              </button>
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

        <section class="card settings-card">
          <p class="section-label">Confidentialité</p>
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

        <section class="card settings-card">
          <p class="section-label">Authentification à deux facteurs</p>
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
                    placeholder="Code à 6 chiffres (application)"
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
            <p class="ok">MFA activé</p>
            <form class="mfa-form" (ngSubmit)="disableMfaAccount()">
              <input class="input" type="password" [(ngModel)]="mfaPassword" name="mfaPassword" placeholder="Mot de passe" />
              <button type="submit" class="btn btn-ghost danger">Désactiver</button>
            </form>
          }
          @if (mfaMsg()) {
            <p class="hint" [class.ok]="mfaMsgOk()">{{ mfaMsg() }}</p>
          }
        </section>

        <section class="card settings-card links-card">
          <a routerLink="/app/feedback">Feedback</a>
          <a routerLink="/app/help">Centre d'aide</a>
          <a routerLink="/app/changelog">Journal des versions</a>
          <a routerLink="/privacy">Politique de confidentialité</a>
        </section>

        @if (auth.user(); as user) {
          <section class="card settings-card">
            <p class="section-label">Compte</p>
            <h2>{{ user.firstName }} {{ user.lastName }}</h2>
            <dl class="meta">
              <div><dt>Email</dt><dd>{{ user.email }}</dd></div>
              <div><dt>Rôle</dt><dd>{{ user.role }}</dd></div>
            </dl>
          </section>
        }
      }
    </div>
  `,
  styles: [`
    .settings-card { margin-bottom: 1rem; max-width: 560px; padding: 1.15rem 1.25rem; }
    .settings-card h2 { margin: 0 0 0.75rem; font-size: 1.05rem; font-family: var(--font-display); }
    .meta { margin: 0; display: grid; gap: 0.45rem; }
    .meta div { display: grid; grid-template-columns: 5.5rem 1fr; gap: 0.5rem; font-size: 0.85rem; }
    dt { color: var(--text-muted); font-weight: 600; }
    dd { margin: 0; color: var(--text-primary); font-family: var(--font-mono); font-size: 0.8rem; }
    .theme-options { display: grid; gap: 0.5rem; margin: 0.35rem 0 0.75rem; }
    .theme-opt {
      text-align: left; border: 1px solid var(--border-color); background: var(--bg-primary);
      border-radius: var(--radius-sm); padding: 0.7rem 0.85rem; cursor: pointer;
      display: flex; flex-direction: column; gap: 0.15rem; color: var(--text-secondary);
    }
    .theme-opt.active {
      border-color: var(--border-strong);
      background: color-mix(in srgb, var(--accent-primary) 10%, var(--bg-elevated));
      color: var(--text-primary);
    }
    .opt-title { font-weight: 700; font-size: 0.85rem; }
    .opt-sub { font-size: 0.72rem; color: var(--text-muted); }
    .hint, .ok { font-size: 0.72rem; color: var(--text-muted); margin: 0.5rem 0 0; }
    .ok { color: var(--accent-success); }
    .toggle-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; margin: 0.5rem 0; }
    .lang-row, .plan-row, .actions-row { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
    .btn.active { border-color: var(--accent-primary); color: var(--accent-primary); }
    .btn.danger { color: var(--accent-danger); }
    .member-list, .invite-list { list-style: none; margin: 0.5rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
    .member-list li, .invite-list li {
      display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; font-size: 0.82rem;
      padding: 0.45rem 0; border-bottom: 1px solid var(--border-color);
    }
    .member-name { font-weight: 600; }
    .member-email { color: var(--text-muted); font-size: 0.75rem; }
    .input.compact { max-width: 8rem; padding: 0.35rem 0.5rem; font-size: 0.78rem; }
    .invite-form, .mfa-form { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
    .invite-form .input { flex: 1; min-width: 140px; }
    .plan-current { margin: 0 0 0.5rem; font-size: 0.88rem; }
    .downgrade-note { margin-top: 0.65rem; }
    .mono { font-family: var(--font-mono); word-break: break-all; }
    .mfa-setup { margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.35rem; }
    .links-card { display: flex; flex-wrap: wrap; gap: 1rem; font-size: 0.85rem; }
  `],
})
export class SettingsPage implements OnInit {
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

  readonly canManageMembers = computed(() => {
    const role = this.auth.user()?.role;
    return role != null && ADMIN_ROLES.includes(role);
  });

  readonly isOwner = computed(() => this.auth.user()?.role === 'OWNER');

  ngOnInit(): void {
    void this.loadAll();
    void this.handleBillingReturn();
  }

  private async handleBillingReturn(): Promise<void> {
    const billingParam = this.route.snapshot.queryParamMap.get('billing');
    if (billingParam !== 'success' && billingParam !== 'stub') return;

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
