import { Component, input } from '@angular/core';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

export interface DataColumn<T = Record<string, unknown>> {
  key: keyof T & string;
  label: string;
  badge?: boolean;
}

@Component({
  selector: 'app-data-table',
  imports: [StatusBadgeComponent],
  template: `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            @for (col of columns(); track col.key) {
              <th>{{ col.label }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track $index) {
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
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
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
      padding: 0.8rem 1rem;
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
    td { color: var(--text-primary); }
    tr:last-child td { border-bottom: none; }
    tbody tr:hover td {
      background: color-mix(in srgb, var(--bg-hover) 70%, transparent);
    }
  `],
})
export class DataTableComponent<T extends Record<string, unknown>> {
  readonly columns = input.required<DataColumn<T>[]>();
  readonly rows = input.required<T[]>();

  stringValue(v: unknown): string {
    return v == null ? '' : String(v);
  }

  formatValue(v: unknown): string {
    if (v == null) return '—';
    if (typeof v === 'number') return v.toLocaleString('fr-FR');
    return String(v);
  }
}
