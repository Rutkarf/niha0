import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api/api.service';
import { Agent, Payment } from '../../core/api/api.models';
import { mapHttpError } from '../../core/api/http-error.util';
import { DataTableComponent, DataColumn } from '../../shared/ui/data-table/data-table.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AgentOfficeLinkComponent } from '../../shared/ui/agent-office-link/agent-office-link.component';
import { AgentHubCardComponent } from '../../shared/ui/agent-hub-card/agent-hub-card.component';

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
              <option value="DRAFT">DRAFT</option>
              <option value="SENT">SENT</option>
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
        @if (formError()) {
          <p class="error" role="alert">{{ formError() }}</p>
        }
        @if (formOk()) {
          <p class="ok" role="status">{{ formOk() }}</p>
        }
      </form>

      <h2 class="section-title">Factures</h2>
      @if (loadingRows()) {
        <app-loading-state />
      } @else if (!rows().length) {
        <app-empty-state title="Aucune facture" icon="FAC" />
      } @else {
        <app-data-table [columns]="columns" [rows]="rows()" />
      }

      <h2 class="section-title">Paiements</h2>
      @if (loadingPayments()) {
        <app-loading-state />
      } @else if (!payments().length) {
        <app-empty-state title="Aucun paiement" icon="PAY" />
      } @else {
        <app-data-table [columns]="paymentColumns" [rows]="paymentRows()" />
      }
    </div>
  `,
  styles: [`
    .create-form { padding: 1rem; margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; }
    .label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.8rem; }
    .actions { display: flex; gap: 0.5rem; }
    .error { color: var(--accent-danger); margin: 0; }
    .ok { color: var(--accent-success, #16a34a); margin: 0; }
  `],
})
export class AccountingPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly loadingAgent = signal(true);
  readonly loadingRows = signal(true);
  readonly loadingPayments = signal(true);
  readonly saving = signal(false);
  readonly formError = signal('');
  readonly formOk = signal('');
  readonly agent = signal<Agent | null>(null);
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly payments = signal<Payment[]>([]);
  readonly paymentRows = signal<Record<string, unknown>[]>([]);

  reference = '';
  totalAmount = 0;
  invoiceStatus: 'DRAFT' | 'SENT' = 'DRAFT';
  dueDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  readonly columns: DataColumn[] = [
    { key: 'reference', label: 'Référence', badge: false },
    { key: 'status', label: 'Statut', badge: true },
    { key: 'totalAmount', label: 'Montant', badge: false },
    { key: 'dueDate', label: 'Échéance', badge: false },
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

  async reload(): Promise<void> {
    this.loadingRows.set(true);
    this.loadingPayments.set(true);
    try {
      const [invoices, pays] = await Promise.all([
        firstValueFrom(this.api.getInvoices()),
        firstValueFrom(this.api.getPayments()),
      ]);
      this.rows.set(invoices as unknown as Record<string, unknown>[]);
      this.payments.set(pays);
      this.paymentRows.set(pays as unknown as Record<string, unknown>[]);
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
    this.formError.set('');
    this.formOk.set('');
    try {
      await firstValueFrom(
        this.api.createInvoice({
          reference: this.reference.trim(),
          totalAmount: this.totalAmount,
          status: this.invoiceStatus,
          dueDate: this.dueDate,
        }),
      );
      this.formOk.set('Facture créée.');
      this.reference = '';
      this.totalAmount = 0;
      this.invoiceStatus = 'DRAFT';
      await this.reload();
    } catch (err) {
      this.formError.set(mapHttpError(err, 'Création impossible'));
    } finally {
      this.saving.set(false);
    }
  }
}
