import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { Agent, StockItem } from '../../core/api/api.models';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { AgentOfficeLinkComponent } from '../../shared/ui/agent-office-link/agent-office-link.component';
import { AgentHubCardComponent } from '../../shared/ui/agent-hub-card/agent-hub-card.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { mapHttpError } from '../../core/api/http-error.util';

@Component({
  selector: 'app-wms-page',
  imports: [
    FormsModule,
    RouterLink,
    LoadingStateComponent,
    EmptyStateComponent,
    AgentOfficeLinkComponent,
    AgentHubCardComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <a routerLink="/app/ai-office" class="back-ao">← AI Office</a>
          <h1>Stock / WMS</h1>
          <p>Inventaire, mouvements et agent Stock</p>
          <app-agent-office-link moduleKey="wms" label="Stock" />
        </div>
      </header>

      @if (loadingAgent()) {
        <app-loading-state message="Chargement agent…" />
      } @else if (agent()) {
        <app-agent-hub-card [agent]="agent()!" officeQuery="stock" />
      }

      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }

      <form class="card form" (ngSubmit)="addItem()">
        <h2>Nouvel article</h2>
        <div class="row">
          <input class="input" placeholder="SKU" [(ngModel)]="sku" name="sku" required />
          <input class="input" placeholder="Nom" [(ngModel)]="name" name="name" required />
          <input class="input" type="number" placeholder="Qté" [(ngModel)]="quantity" name="quantity" />
          <input class="input" type="number" placeholder="Seuil" [(ngModel)]="reorderLevel" name="reorderLevel" />
          <input class="input" placeholder="Emplacement" [(ngModel)]="location" name="location" />
          <button class="btn btn-primary" type="submit" [disabled]="saving()">Ajouter</button>
        </div>
      </form>

      <h2 class="section-title">Inventaire</h2>
      @if (loading()) {
        <app-loading-state />
      } @else if (!items().length) {
        <app-empty-state title="Aucun article" icon="ST" />
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>SKU</th><th>Nom</th><th>Qté</th><th>Seuil</th><th>Lieu</th><th>Statut</th><th></th></tr>
            </thead>
            <tbody>
              @for (i of items(); track i.id) {
                <tr [class.low]="i.quantity <= i.reorderLevel">
                  <td>{{ i.sku }}</td>
                  <td>{{ i.name }}</td>
                  <td>{{ i.quantity }}</td>
                  <td>{{ i.reorderLevel }}</td>
                  <td>{{ i.location }}</td>
                  <td><app-status-badge [status]="i.status" /></td>
                  <td class="actions">
                    <button type="button" class="btn btn-ghost btn-sm" (click)="adjust(i, 'PURCHASE', 10)">+10</button>
                    <button type="button" class="btn btn-ghost btn-sm" (click)="adjust(i, 'CONSUME', 1)">−1</button>
                    <button type="button" class="btn btn-danger btn-sm" (click)="remove(i)">Suppr.</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .form { margin-bottom: 1rem; padding: 1rem; }
    .form h2 { margin: 0 0 0.75rem; font-size: 0.95rem; }
    .row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .row .input { flex: 1; min-width: 100px; }
    .error { color: var(--accent-danger); }
    .table-wrap { overflow-x: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-elevated); }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th, td { padding: 0.65rem 0.85rem; border-bottom: 1px solid var(--border-color); text-align: left; }
    tr.low td { background: color-mix(in srgb, var(--accent-warning) 12%, transparent); }
    .btn-sm { font-size: 0.72rem; padding: 0.25rem 0.5rem; min-height: auto; }
    .actions { display: flex; gap: 0.35rem; flex-wrap: wrap; }
  `],
})
export class WmsPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly loadingAgent = signal(true);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly agent = signal<Agent | null>(null);
  readonly items = signal<StockItem[]>([]);
  sku = '';
  name = '';
  quantity = 0;
  reorderLevel = 10;
  location = '';

  ngOnInit(): void {
    this.api.getAgents().subscribe({
      next: (agents) => {
        this.agent.set(agents.find((a) => a.code === 'STOCK') ?? null);
        this.loadingAgent.set(false);
      },
      error: () => this.loadingAgent.set(false),
    });
    this.reload();
  }

  addItem(): void {
    this.error.set('');
    this.saving.set(true);
    this.api.createStockItem({
      sku: this.sku.trim(),
      name: this.name.trim(),
      quantity: this.quantity,
      reorderLevel: this.reorderLevel,
      location: this.location.trim(),
      unit: 'unit',
      status: 'ACTIVE',
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.sku = this.name = this.location = '';
        this.quantity = 0;
        this.reorderLevel = 10;
        this.reload();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(mapHttpError(err));
      },
    });
  }

  adjust(item: StockItem, movementType: string, quantity: number): void {
    this.api.adjustStock(item.id, { movementType, quantity }).subscribe({
      next: () => this.reload(),
      error: (err) => this.error.set(mapHttpError(err)),
    });
  }

  remove(item: StockItem): void {
    if (!confirm(`Supprimer ${item.sku} ?`)) return;
    this.api.deleteStockItem(item.id).subscribe({
      next: () => this.reload(),
      error: (err) => this.error.set(mapHttpError(err)),
    });
  }

  private reload(): void {
    this.api.getStockItems().subscribe({
      next: (data) => {
        this.items.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
