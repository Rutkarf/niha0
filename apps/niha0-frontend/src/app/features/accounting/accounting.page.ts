import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Agent, Invoice, Payment } from '../../core/api/api.models';
import { mapHttpError } from '../../core/api/http-error.util';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { FeaturePageHeaderComponent } from '../../shared/ui/feature-page-header/feature-page-header.component';
import { FeatureAgentHostComponent } from '../../shared/ui/feature-agent-host/feature-agent-host.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { INVOICE_STATUS_OPTIONS } from '../../shared/ui/status-labels';

const VISIBLE_ROWS = 5;
const ROW_HEIGHT_REM = 2.85;

@Component({
  selector: 'app-accounting-page',
  imports: [
    FormsModule,
    FeaturePageHeaderComponent,
    EmptyStateComponent,
    FeatureAgentHostComponent,
    StatusBadgeComponent,
    SkeletonComponent,
  ],
  template: `
    <div class="page feature-module-page">
      <app-feature-page-header
        group="Gestion"
        title="Comptabilité"
        backLabel="← AI Office Comptabilité"
        [backQueryParams]="{ agent: 'comptabilite' }"
      />
      <app-feature-agent-host
        [agent]="agent()"
        [loading]="loadingAgent()"
        officeQuery="comptabilite"
        sectionLabel="Agent dédié Comptabilité"
        officeLinkLabel="Comptabilité"
      />

      <div class="accounting-pair-row">
        <section class="feature-hub card accounting-half">
          <header class="feature-hub-head">
            <h2 class="feature-hub-title">Nouvelle facture</h2>
            <span class="feature-hub-sub">Création et paramétrage</span>
          </header>

          <form class="accounting-form" (ngSubmit)="saveInvoice()">
            <div class="embedded-form-grid">
              <label class="label span-2">
                Référence
                <input class="input" name="reference" [(ngModel)]="reference" required maxlength="64" />
              </label>
              <label class="label">
                Montant TTC
                <input class="input" type="number" name="totalAmount" [(ngModel)]="totalAmount" required min="0" step="0.01" />
              </label>
              <label class="label">
                Statut
                <select class="input" name="status" [(ngModel)]="invoiceStatus">
                  @for (opt of invoiceStatusOptions; track opt.value) {
                    <option [value]="opt.value">{{ opt.label }}</option>
                  }
                </select>
              </label>
              <label class="label span-2">
                Échéance
                <input class="input" type="date" name="dueDate" [(ngModel)]="dueDate" required />
              </label>
              <div class="form-actions span-2">
                <button type="submit" class="btn btn-primary" [disabled]="saving() || !reference.trim()">
                  {{ saving() ? 'Création…' : 'Créer la facture' }}
                </button>
              </div>
            </div>
          </form>
        </section>

        <section class="feature-hub card accounting-half">
          <header class="section-toolbar" role="toolbar" aria-label="Factures">
            <h2 class="section-title">Factures</h2>
            <label class="section-search">
              <span class="feature-search-icon" aria-hidden="true">⌕</span>
              <span class="sr-only">Rechercher</span>
              <input
                class="input section-search-input"
                type="search"
                placeholder="Rechercher par référence, statut, montant…"
                [ngModel]="invoiceQuery()"
                (ngModelChange)="invoiceQuery.set($event)"
              />
            </label>
            <div class="section-toolbar-end">
              <span class="section-tag">Création et suivi des factures</span>
              <span class="section-count">{{ rows().length }} facture(s)</span>
            </div>
          </header>

          @if (loadingRows()) {
            <app-skeleton message="Chargement des factures…" [lines]="5" />
          } @else if (!rows().length) {
            <app-empty-state
              title="Aucune facture"
              icon="FAC"
              description="Créez une facture avec le formulaire à gauche."
            />
          } @else {
            @if (filteredRows().length > visibleRows) {
              <p class="feature-scroll-hint table-hint">5 visibles · défilez</p>
            }
            <div class="feature-scroll-table" role="table" aria-label="Liste des factures">
              <div class="feature-scroll-cols head invoice-cols" role="row">
                <span role="columnheader">Réf.</span>
                <span role="columnheader">Statut</span>
                <span role="columnheader">Montant</span>
                <span role="columnheader" class="feature-col-actions">·</span>
              </div>
              <div
                class="feature-scroll-body"
                role="rowgroup"
                [style.max-height.rem]="visibleRows * rowHeightRem"
              >
                @for (row of filteredRows(); track row['id']) {
                  <div class="feature-scroll-cols row invoice-cols" role="row">
                    <span class="feature-cell feature-cell-primary" role="cell" [title]="String(row['reference'])">{{ row['reference'] }}</span>
                    <span role="cell"><app-status-badge [status]="$any(row)['status']" /></span>
                    <span class="feature-cell feature-cell-muted" role="cell">{{ row['totalAmount'] }}</span>
                    <span class="feature-row-actions feature-col-actions" role="cell">
                      <button type="button" class="btn btn-ghost btn-sm" (click)="downloadPdf(row)">PDF</button>
                    </span>
                  </div>
                } @empty {
                  <p class="feature-empty-filter">Aucun résultat</p>
                }
              </div>
            </div>
          }
        </section>
      </div>

      <section class="feature-hub card payments-section">
        <header class="section-toolbar" role="toolbar" aria-label="Paiements">
          <h2 class="section-title">Paiements</h2>
          <label class="section-search">
            <span class="feature-search-icon" aria-hidden="true">⌕</span>
            <span class="sr-only">Rechercher</span>
            <input
              class="input section-search-input"
              type="search"
              placeholder="Rechercher par montant, statut, méthode…"
              [ngModel]="paymentQuery()"
              (ngModelChange)="paymentQuery.set($event)"
            />
          </label>
          <div class="section-toolbar-end">
            <span class="section-tag">Encaissements enregistrés</span>
            <span class="section-count">{{ paymentRows().length }} paiement(s)</span>
          </div>
        </header>

        @if (loadingPayments()) {
          <app-skeleton message="Chargement des paiements…" [lines]="4" />
        } @else if (!paymentRows().length) {
          <app-empty-state
            title="Aucun paiement"
            icon="PAY"
            description="Les paiements apparaîtront ici une fois enregistrés sur vos factures."
          />
        } @else {
          @if (filteredPayments().length > visibleRows) {
            <p class="feature-scroll-hint table-hint">5 visibles · défilez</p>
          }
          <div class="feature-scroll-table" role="table" aria-label="Liste des paiements">
            <div class="feature-scroll-cols head payment-cols" role="row">
              <span role="columnheader">Montant</span>
              <span role="columnheader">Statut</span>
              <span role="columnheader">Méthode</span>
              <span role="columnheader">Date</span>
            </div>
            <div
              class="feature-scroll-body"
              role="rowgroup"
              [style.max-height.rem]="visibleRows * rowHeightRem"
            >
              @for (row of filteredPayments(); track row['id']) {
                <div class="feature-scroll-cols row payment-cols" role="row">
                  <span class="feature-cell feature-cell-primary" role="cell">{{ row['amount'] }}</span>
                  <span role="cell"><app-status-badge [status]="$any(row)['status']" /></span>
                  <span class="feature-cell feature-cell-muted" role="cell">{{ row['method'] }}</span>
                  <span class="feature-cell feature-cell-muted" role="cell">{{ row['paidAt'] }}</span>
                </div>
              } @empty {
                <p class="feature-empty-filter">Aucun résultat</p>
              }
            </div>
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .accounting-pair-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--dash-inline-gap, var(--space-3));
      align-items: stretch;
    }

    .accounting-half {
      min-width: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: var(--dash-inline-gap, var(--space-3));
    }

    .section-toolbar {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: var(--dash-inline-gap, var(--space-3));
      padding-bottom: var(--dash-inline-gap);
      border-bottom: 1px solid var(--border-color);
    }

    .section-title {
      margin: 0;
      font-size: 1rem;
      font-weight: var(--fw-bold);
      white-space: nowrap;
    }

    .section-search {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      justify-self: center;
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
    }

    .section-search-input {
      flex: 1;
      min-width: 0;
      font-size: 0.85rem;
    }

    .section-toolbar-end {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      justify-self: end;
      white-space: nowrap;
    }

    .section-tag {
      font-size: 0.72rem;
      font-weight: var(--fw-semibold);
      color: var(--text-secondary);
    }

    .section-count {
      font-size: 0.72rem;
      color: var(--text-muted);
      padding: 0.2rem 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
    }

    .table-hint { margin: 0; }

    .payments-section {
      display: flex;
      flex-direction: column;
      gap: var(--dash-inline-gap, var(--space-3));
    }

    .accounting-half .feature-hub-head {
      margin-bottom: var(--dash-inline-gap);
      padding-bottom: var(--dash-inline-gap);
    }

    .accounting-form { flex: 1; }

    .embedded-form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--dash-inline-gap);
      align-items: end;
    }

    .span-2 { grid-column: 1 / -1; }
    .label {
      margin-bottom: 0;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.8rem;
    }

    .form-actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--dash-inline-gap);
      padding-top: var(--dash-inline-gap);
      border-top: 1px solid var(--border-color);
    }

    .invoice-cols {
      grid-template-columns: minmax(0, 1.2fr) 88px minmax(72px, auto) minmax(52px, auto);
    }

    .payment-cols {
      grid-template-columns: minmax(100px, 1fr) 100px minmax(100px, 1fr) minmax(100px, 1fr);
    }

    .accounting-half .feature-search { max-width: none; flex: 1; }

    .btn-sm { font-size: 0.72rem; padding: 0.25rem 0.5rem; min-height: auto; }

    @media (max-width: 960px) {
      .accounting-pair-row { grid-template-columns: 1fr; }
      .embedded-form-grid { grid-template-columns: 1fr; }
      .section-toolbar {
        grid-template-columns: 1fr;
        gap: var(--dash-inline-gap);
      }
      .section-search { max-width: none; justify-self: stretch; }
      .section-toolbar-end { justify-self: start; flex-wrap: wrap; }
    }
`],
})
export class AccountingPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly visibleRows = VISIBLE_ROWS;
  readonly rowHeightRem = ROW_HEIGHT_REM;
  protected readonly String = String;

  readonly loadingAgent = signal(true);
  readonly loadingRows = signal(true);
  readonly loadingPayments = signal(true);
  readonly saving = signal(false);
  readonly agent = signal<Agent | null>(null);
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly payments = signal<Payment[]>([]);
  readonly paymentRows = signal<Record<string, unknown>[]>([]);
  readonly invoiceQuery = signal('');
  readonly paymentQuery = signal('');
  readonly invoiceStatusOptions = INVOICE_STATUS_OPTIONS;

  reference = '';
  totalAmount = 0;
  invoiceStatus: 'DRAFT' | 'SENT' = 'DRAFT';
  dueDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  readonly filteredRows = computed(() => {
    const q = this.invoiceQuery().trim().toLowerCase();
    const list = this.rows();
    if (!q) return list;
    return list.filter((row) => {
      const ref = String(row['reference'] ?? '').toLowerCase();
      const status = String(row['status'] ?? '').toLowerCase();
      const amount = String(row['totalAmount'] ?? '').toLowerCase();
      return ref.includes(q) || status.includes(q) || amount.includes(q);
    });
  });

  readonly filteredPayments = computed(() => {
    const q = this.paymentQuery().trim().toLowerCase();
    const list = this.paymentRows();
    if (!q) return list;
    return list.filter((row) => {
      const amount = String(row['amount'] ?? '').toLowerCase();
      const status = String(row['status'] ?? '').toLowerCase();
      const method = String(row['method'] ?? '').toLowerCase();
      const paidAt = String(row['paidAt'] ?? '').toLowerCase();
      return amount.includes(q) || status.includes(q) || method.includes(q) || paidAt.includes(q);
    });
  });

  ngOnInit(): void {
    this.api.getAgents().subscribe({
      next: (agents) => {
        this.agent.set(agents.find((a) => a.code === 'COMPTABILITE') ?? null);
        this.loadingAgent.set(false);
      },
      error: () => this.loadingAgent.set(false),
    });
    void this.reload();
  }

  private formatMoney(amount: number): string {
    return Number(amount ?? 0).toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    });
  }

  private mapInvoiceRows(invoices: Invoice[]): Record<string, unknown>[] {
    return invoices.map((inv) => ({
      ...inv,
      totalAmount: this.formatMoney(inv.totalAmount),
      _id: inv.id,
    }));
  }

  private mapPaymentRows(pays: Payment[]): Record<string, unknown>[] {
    return pays.map((p) => ({
      ...p,
      amount: this.formatMoney(p.amount),
    }));
  }

  async reload(): Promise<void> {
    this.loadingRows.set(true);
    this.loadingPayments.set(true);
    try {
      const [invoices, pays] = await Promise.all([
        firstValueFrom(this.api.getInvoices()),
        firstValueFrom(this.api.getPayments()),
      ]);
      this.rows.set(this.mapInvoiceRows(invoices));
      this.payments.set(pays);
      this.paymentRows.set(this.mapPaymentRows(pays));
    } catch {
      this.rows.set([]);
      this.payments.set([]);
      this.paymentRows.set([]);
    } finally {
      this.loadingRows.set(false);
      this.loadingPayments.set(false);
    }
  }

  async saveInvoice(): Promise<void> {
    if (!this.reference.trim()) return;
    this.saving.set(true);
    try {
      await firstValueFrom(
        this.api.createInvoice({
          reference: this.reference.trim(),
          totalAmount: this.totalAmount,
          status: this.invoiceStatus,
          dueDate: this.dueDate,
        }),
      );
      this.toast.success('Facture créée.');
      this.reference = '';
      this.totalAmount = 0;
      this.invoiceStatus = 'DRAFT';
      await this.reload();
    } catch (err) {
      this.toast.error(mapHttpError(err, 'Création impossible'));
    } finally {
      this.saving.set(false);
    }
  }

  async downloadPdf(row: Record<string, unknown>): Promise<void> {
    const id = row['id'];
    if (id == null) return;
    try {
      const blob = await firstValueFrom(this.api.downloadInvoicePdf(String(id)));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      this.toast.error(mapHttpError(err, 'PDF indisponible'));
    }
  }
}
