import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Agent, Invoice, Payment } from '../../core/api/api.models';
import { mapHttpError } from '../../core/api/http-error.util';
import { DataTableComponent, DataColumn } from '../../shared/ui/data-table/data-table.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AgentOfficeLinkComponent } from '../../shared/ui/agent-office-link/agent-office-link.component';
import { AgentHubCardComponent } from '../../shared/ui/agent-hub-card/agent-hub-card.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { INVOICE_STATUS_OPTIONS } from '../../shared/ui/status-labels';

@Component({
  selector: 'app-accounting-page',
  imports: [
    FormsModule,
    AgentOfficeLinkComponent,
    RouterLink,
    DataTableComponent,
    LoadingStateComponent,
    EmptyStateComponent,
    AgentHubCardComponent,
    SkeletonComponent,
  ],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <a routerLink="/app/ai-office" class="back-ao">← AI Office</a>
          <h1>Comptabilité</h1>
          <p>Factures, paiements et agent Comptabilité</p>
          <p class="callout" role="note">
            Les analyses IA sont indicatives. Toute relance ou modification financière requiert une validation humaine.
          </p>
          <app-agent-office-link moduleKey="accounting" label="Comptabilité" />
        </div>
      </header>

      @if (loadingAgent()) {
        <app-loading-state message="Chargement agent…" />
      } @else if (agent()) {
        <app-agent-hub-card [agent]="agent()!" officeQuery="comptabilite" />
      }

      <form class="create-form card" (ngSubmit)="saveInvoice()">
        <h2>Nouvelle facture</h2>
        <div class="row">
          <label class="label">
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
          <label class="label">
            Échéance
            <input class="input" type="date" name="dueDate" [(ngModel)]="dueDate" required />
          </label>
        </div>
        <div class="actions">
          <button type="submit" class="btn btn-primary" [disabled]="saving() || !reference.trim()">
            {{ saving() ? 'Création…' : 'Créer la facture' }}
          </button>
        </div>
      </form>

      <h2 class="section-title">Factures</h2>
      @if (loadingRows()) {
        <app-skeleton message="Chargement des factures…" [lines]="5" />
      } @else if (!rows().length) {
        <app-empty-state
          title="Aucune facture"
          icon="FAC"
          description="Créez une facture avec le formulaire ci-dessus pour suivre vos encaissements."
        />
      } @else {
        <app-data-table [columns]="columns" [rows]="rows()" filterPlaceholder="Rechercher une facture…" />
        <div class="pdf-actions">
          @for (row of rows(); track row['id']) {
            <button type="button" class="btn btn-ghost btn-sm" (click)="downloadPdf(row)">
              PDF · {{ row['reference'] }}
            </button>
          }
        </div>
      }

      <h2 class="section-title">Paiements</h2>
      @if (loadingPayments()) {
        <app-skeleton message="Chargement des paiements…" [lines]="4" />
      } @else if (!paymentRows().length) {
        <app-empty-state
          title="Aucun paiement"
          icon="PAY"
          description="Les paiements apparaîtront ici une fois enregistrés sur vos factures."
        />
      } @else {
        <app-data-table [columns]="paymentColumns" [rows]="paymentRows()" filterPlaceholder="Rechercher un paiement…" />
      }
    </div>
  `,
  styles: [`
    .create-form { padding: 1rem; margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; }
    .label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.8rem; }
    .actions { display: flex; gap: 0.5rem; }
    .pdf-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0.75rem 0 1.25rem; }
  `],
})
export class AccountingPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly loadingAgent = signal(true);
  readonly loadingRows = signal(true);
  readonly loadingPayments = signal(true);
  readonly saving = signal(false);
  readonly agent = signal<Agent | null>(null);
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly payments = signal<Payment[]>([]);
  readonly paymentRows = signal<Record<string, unknown>[]>([]);
  readonly invoiceStatusOptions = INVOICE_STATUS_OPTIONS;

  reference = '';
  totalAmount = 0;
  invoiceStatus: 'DRAFT' | 'SENT' = 'DRAFT';
  dueDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  readonly columns: DataColumn[] = [
    { key: 'reference', label: 'Référence', badge: false },
    { key: 'status', label: 'Statut', badge: true },
    { key: 'totalAmount', label: 'Montant', badge: false },
    { key: 'dueDate', label: 'Échéance', badge: false },
    { key: 'pdf', label: 'PDF', badge: false },
  ];

  readonly paymentColumns: DataColumn[] = [
    { key: 'amount', label: 'Montant', badge: false },
    { key: 'status', label: 'Statut', badge: true },
    { key: 'method', label: 'Méthode', badge: false },
    { key: 'paidAt', label: 'Date', badge: false },
  ];

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
      pdf: 'Télécharger',
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
