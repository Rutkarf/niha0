import { Component, Input } from '@angular/core';
import type { RowLayoutConfig } from '../../models/row-config.model';

@Component({
  selector: 'app-chief-platform',
  standalone: true,
  template: `
    <section class="chief-platform" aria-label="Plateforme des chefs">
      <h2>Plateforme chefs</h2>
      <ul>
        @for (row of rows; track row.rowId) {
          <li [style.--row-color]="row.color">
            <strong>{{ row.chiefTitle }}</strong>
            <span class="dept">({{ row.role }})</span>
          </li>
        }
      </ul>
    </section>
  `,
  styles: [
    `
      .chief-platform {
        font-size: 0.8rem;
      }
      h2 {
        margin: 0 0 0.35rem;
        font-size: 0.85rem;
      }
      ul {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      li {
        border-left: 3px solid var(--row-color);
        padding: 0.2rem 0.45rem;
        margin-bottom: 0.25rem;
      }
      .dept {
        opacity: 0.7;
        margin-left: 0.35rem;
        font-weight: normal;
      }
    `,
  ],
})
export class ChiefPlatformComponent {
  @Input({ required: true }) rows!: readonly RowLayoutConfig[];
}
