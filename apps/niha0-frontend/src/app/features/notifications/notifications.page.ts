import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../../core/api/api.service';
import { DataTableComponent, DataColumn } from '../../shared/ui/data-table/data-table.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { FeaturePageHeaderComponent } from '../../shared/ui/feature-page-header/feature-page-header.component';

@Component({
  selector: 'app-notifications-page',
  imports: [DataTableComponent, LoadingStateComponent, EmptyStateComponent, FeaturePageHeaderComponent],
  template: `
    <div class="page feature-module-page">
      <app-feature-page-header
        group="Système"
        title="Notifications"
        backLabel="← AI Office"
      />
      <section class="feature-hub card">
      @if (loading()) {
        <app-loading-state />
      } @else if (!rows().length) {
        <app-empty-state
          title="Aucune notification"
          icon="NOT"
          description="Les alertes des agents IA et les messages système de votre organisation apparaîtront ici."
        />
      } @else {
        <app-data-table
          [columns]="columns"
          [rows]="rows()"
          [filterable]="true"
          filterPlaceholder="Filtrer par titre, type, message…"
        />
      }
      </section>
    </div>
  `,
})
export class NotificationsPage implements OnInit {
  private readonly api = inject(ApiService);
  readonly loading = signal(true);
  readonly rows = signal<Record<string, unknown>[]>([]);
  /** `read` boolean is rendered as Oui/Non by app-data-table.formatValue */
  readonly columns: DataColumn[] = [
    { key: 'title', label: 'Titre', badge: false },
    { key: 'type', label: 'Type', badge: true },
    { key: 'message', label: 'Message', badge: false },
    { key: 'read', label: 'Lu', badge: false },
  ];

  ngOnInit(): void {
    this.api.getNotifications().subscribe({
      next: (data) => {
        this.rows.set(data as unknown as Record<string, unknown>[]);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
