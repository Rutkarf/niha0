import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { MarketplaceInstall, MarketplaceListing } from '../../core/api/api.models';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { mapHttpError } from '../../core/api/http-error.util';

@Component({
  selector: 'app-marketplace-page',
  imports: [DatePipe, RouterLink, LoadingStateComponent, EmptyStateComponent, StatusBadgeComponent],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <a routerLink="/app/ai-office" class="back-ao">← AI Office</a>
          <h1>Marketplace</h1>
          <p>Catalogue d’agents et installations</p>
        </div>
      </header>

      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }

      <h2 class="section-title">Catalogue</h2>
      @if (loadingListings()) {
        <app-loading-state />
      } @else if (!listings().length) {
        <app-empty-state
          title="Aucune annonce"
          icon="MP"
          description="Publiez une définition depuis le Studio."
        />
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Titre</th><th>Catégorie</th><th>Visibilité</th><th>Installs</th><th></th></tr>
            </thead>
            <tbody>
              @for (l of listings(); track l.id) {
                <tr>
                  <td>
                    <strong>{{ l.title }}</strong>
                    @if (l.summary) {
                      <div class="muted">{{ l.summary }}</div>
                    }
                  </td>
                  <td>{{ l.category }}</td>
                  <td><app-status-badge [status]="l.visibility" /></td>
                  <td>{{ l.installCount }}</td>
                  <td>
                    <button
                      type="button"
                      class="btn btn-primary btn-sm"
                      [disabled]="installingId() === l.id"
                      (click)="install(l)"
                    >
                      Installer
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <h2 class="section-title">Installations</h2>
      @if (loadingInstalls()) {
        <app-loading-state />
      } @else if (!installs().length) {
        <app-empty-state title="Aucune installation" icon="MP" />
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Listing</th><th>Créé</th><th>Config</th></tr>
            </thead>
            <tbody>
              @for (i of installs(); track i.id) {
                <tr>
                  <td>{{ listingTitle(i.listingId) }}</td>
                  <td>{{ i.createdAt | date: 'short' }}</td>
                  <td class="mono">{{ i.configJson || '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: `
    .error { color: var(--accent-danger); }
    .table-wrap { overflow-x: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-elevated); margin-bottom: 1.25rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th, td { padding: 0.65rem 0.85rem; border-bottom: 1px solid var(--border-color); text-align: left; vertical-align: top; }
    .muted { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem; }
    .mono { font-family: var(--font-mono); font-size: 0.75rem; }
    .btn-sm { font-size: 0.72rem; padding: 0.25rem 0.5rem; min-height: auto; }
  `,
})
export class MarketplacePage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly loadingListings = signal(true);
  readonly loadingInstalls = signal(true);
  readonly installingId = signal<string | null>(null);
  readonly error = signal('');
  readonly listings = signal<MarketplaceListing[]>([]);
  readonly installs = signal<MarketplaceInstall[]>([]);

  ngOnInit(): void {
    this.reload();
  }

  install(l: MarketplaceListing): void {
    this.installingId.set(l.id);
    this.api.installMarketplaceListing(l.id).subscribe({
      next: () => {
        this.installingId.set(null);
        this.toast.success(`Installé : ${l.title}`);
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
