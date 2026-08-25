import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { DataTableComponent, DataColumn } from '../../shared/ui/data-table/data-table.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-audit-page',
  imports: [DataTableComponent, LoadingStateComponent, EmptyStateComponent, RouterLink],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <a routerLink="/app/ai-office" class="back-ao">← AI Office</a>
          <h1>Audit</h1>
          <p>Journal d’activité multi-tenant</p>
        </div>
      </header>
      @if (loading()) {
        <app-loading-state message="Chargement du journal…" />
      } @else if (!rows().length) {
        <app-empty-state title="Aucun log" icon="AUD" description="Aucune entrée d’audit pour cette organisation." />
      } @else {
        <app-data-table [columns]="columns" [rows]="rows()" />
      }
    </div>
  `,
})
export class AuditPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly loading = signal(true);
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly columns: DataColumn[] = [
    { key: 'action', label: 'Action', badge: false },
    { key: 'entityType', label: 'Entité', badge: false },
    { key: 'entityId', label: 'ID', badge: false },
    { key: 'createdAt', label: 'Date', badge: false },
  ];

  ngOnInit(): void {
    this.api.getAuditLogs().subscribe({
      next: (data) => {
        this.rows.set(data as unknown as Record<string, unknown>[]);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
