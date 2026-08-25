import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { statusLabel } from '../status-labels';

export interface DataColumn<T = Record<string, unknown>> {
  key: keyof T & string;
  label: string;
  badge?: boolean;
  sortable?: boolean;
}

type SortDir = 'asc' | 'desc' | null;

@Component({
  selector: 'app-data-table',
  imports: [StatusBadgeComponent, FormsModule],
  template: `
    <div class="table-toolbar">
      @if (filterable()) {
        <label class="search">
          <span class="sr-only">Filtrer</span>
          <input
            class="input"
            type="search"
            [placeholder]="filterPlaceholder()"
            [ngModel]="query()"
            (ngModelChange)="onQuery($event)"
          />
        </label>
      }
      <p class="meta" aria-live="polite">
        {{ filtered().length }} résultat(s)
        @if (pageSize() > 0 && filtered().length > pageSize()) {
          · page {{ page() }} / {{ totalPages() }}
        }
      </p>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            @for (col of columns(); track col.key) {
              <th [attr.aria-sort]="ariaSort(col.key)">
                @if (col.sortable !== false && sortable()) {
                  <button type="button" class="sort-btn" (click)="toggleSort(col.key)">
                    {{ col.label }}
                    <span class="ind" aria-hidden="true">{{ sortIndicator(col.key) }}</span>
                  </button>
                } @else {
                  {{ col.label }}
                }
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of pageRows(); track trackRow(row, $index)) {
            <tr>
              @for (col of columns(); track col.key) {
                <td>
                  @if (col.badge) {
                    <app-status-badge [status]="stringValue(row[col.key])" />
                  } @else {
                    {{ formatValue(row[col.key]) }}
                  }
                </td>
              }
            </tr>
          } @empty {
            <tr>
              <td [attr.colspan]="columns().length" class="empty-cell">Aucun résultat</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    @if (pageSize() > 0 && totalPages() > 1) {
      <nav class="pager" aria-label="Pagination">
        <button type="button" class="btn btn-ghost btn-sm" [disabled]="page() <= 1" (click)="go(page() - 1)">
          Précédent
        </button>
        <span class="page-pos">{{ page() }} / {{ totalPages() }}</span>
        <button type="button" class="btn btn-ghost btn-sm" [disabled]="page() >= totalPages()" (click)="go(page() + 1)">
          Suivant
        </button>
      </nav>
    }
  `,
  styles: [`
    .table-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      margin-bottom: var(--space-3);
    }
    .search { flex: 1; min-width: 180px; max-width: 320px; }
    .search .input { min-height: var(--control-height-sm); }
    .meta { margin: 0; font-size: var(--fs-sm); color: var(--text-muted); }
    .table-wrap {
      overflow-x: auto;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      box-shadow: var(--shadow-sm);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--fs-md);
    }
    th, td {
      padding: var(--space-3) var(--space-4);
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }
    th {
      background: color-mix(in srgb, var(--bg-secondary) 80%, var(--bg-elevated));
      color: var(--text-muted);
      font-size: var(--fs-xs);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
      font-weight: var(--fw-bold);
      position: sticky;
      top: 0;
    }
    .sort-btn {
      border: none;
      background: transparent;
      color: inherit;
      font: inherit;
      letter-spacing: inherit;
      text-transform: inherit;
      cursor: pointer;
      padding: 0;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }
    .ind { font-size: 0.65rem; opacity: 0.7; }
    td { color: var(--text-primary); }
    tr:last-child td { border-bottom: none; }
    tbody tr:hover td {
      background: color-mix(in srgb, var(--bg-hover) 70%, transparent);
    }
    .empty-cell {
      text-align: center;
      color: var(--text-muted);
      padding: var(--space-5);
    }
    .pager {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--space-3);
      margin-top: var(--space-3);
    }
    .page-pos { font-size: var(--fs-sm); color: var(--text-muted); font-variant-numeric: tabular-nums; }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      border: 0;
    }
  `],
})
export class DataTableComponent<T extends Record<string, unknown>> {
  readonly columns = input.required<DataColumn<T>[]>();
  readonly rows = input.required<T[]>();
  readonly filterable = input(true);
  readonly sortable = input(true);
  readonly pageSize = input(10);
  readonly filterPlaceholder = input('Rechercher…');
  readonly trackByKey = input<keyof T & string | null>(null);

  readonly query = signal('');
  readonly sortKey = signal<string | null>(null);
  readonly sortDir = signal<SortDir>(null);
  readonly page = signal(1);

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    let list = [...this.rows()];
    if (q) {
      list = list.filter((row) =>
        this.columns().some((col) => String(row[col.key] ?? '').toLowerCase().includes(q)),
      );
    }
    const key = this.sortKey();
    const dir = this.sortDir();
    if (key && dir) {
      list.sort((a, b) => {
        const av = a[key as keyof T];
        const bv = b[key as keyof T];
        const as = av == null ? '' : String(av);
        const bs = bv == null ? '' : String(bv);
        const cmp = as.localeCompare(bs, 'fr', { numeric: true, sensitivity: 'base' });
        return dir === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  });

  readonly totalPages = computed(() => {
    const size = this.pageSize();
    if (size <= 0) return 1;
    return Math.max(1, Math.ceil(this.filtered().length / size));
  });

  readonly pageRows = computed(() => {
    const size = this.pageSize();
    const list = this.filtered();
    if (size <= 0) return list;
    const p = Math.min(this.page(), this.totalPages());
    const start = (p - 1) * size;
    return list.slice(start, start + size);
  });

  toggleSort(key: string): void {
    if (this.sortKey() !== key) {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    } else if (this.sortDir() === 'asc') {
      this.sortDir.set('desc');
    } else if (this.sortDir() === 'desc') {
      this.sortKey.set(null);
      this.sortDir.set(null);
    } else {
      this.sortDir.set('asc');
    }
    this.page.set(1);
  }

  sortIndicator(key: string): string {
    if (this.sortKey() !== key) return '↕';
    if (this.sortDir() === 'asc') return '↑';
    if (this.sortDir() === 'desc') return '↓';
    return '↕';
  }

  ariaSort(key: string): string | null {
    if (this.sortKey() !== key) return null;
    if (this.sortDir() === 'asc') return 'ascending';
    if (this.sortDir() === 'desc') return 'descending';
    return null;
  }

  go(p: number): void {
    this.page.set(Math.min(this.totalPages(), Math.max(1, p)));
  }

  onQuery(value: string): void {
    this.query.set(value);
    this.page.set(1);
  }

  trackRow(row: T, index: number): string | number {
    const key = this.trackByKey();
    if (key && row[key] != null) return String(row[key]);
    return index;
  }

  stringValue(v: unknown): string {
    return v == null ? '' : String(v);
  }

  formatValue(v: unknown): string {
    if (v == null) return '—';
    if (typeof v === 'number') return v.toLocaleString('fr-FR');
    if (typeof v === 'boolean') return v ? 'Oui' : 'Non';
    return String(v);
  }

  /** Expose label helper for consumers if needed. */
  labelOf(v: string): string {
    return statusLabel(v);
  }
}
