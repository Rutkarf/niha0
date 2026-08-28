import { Component, Input } from '@angular/core';
import type { RowLayoutConfig } from '../../models/row-config.model';

@Component({
  selector: 'app-agent-row',
  standalone: true,
  imports: [],
  template: `
    <article class="agent-row" [style.--row-color]="row.color">
      <header>
        <span class="swatch" aria-hidden="true"></span>
        <div>
          <h3>{{ row.role }}</h3>
          <p class="chief">Chef : {{ row.chiefTitle }}</p>
        </div>
      </header>
      <ul>
        @for (agent of row.agents; track agent.agentId) {
          <li>{{ agent.title }}</li>
        }
      </ul>
    </article>
  `,
  styles: [
    `
      .agent-row {
        border-left: 4px solid var(--row-color);
        padding: 0.5rem 0.75rem;
        margin-bottom: 0.5rem;
        background: color-mix(in srgb, var(--row-color) 12%, transparent);
        border-radius: 0.35rem;
      }
      header {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
      }
      .swatch {
        width: 0.75rem;
        height: 0.75rem;
        border-radius: 50%;
        background: var(--row-color);
        margin-top: 0.2rem;
      }
      h3 {
        margin: 0;
        font-size: 0.85rem;
      }
      .chief {
        margin: 0.15rem 0 0;
        font-size: 0.72rem;
        opacity: 0.85;
      }
      ul {
        margin: 0.35rem 0 0;
        padding-left: 1.1rem;
        font-size: 0.75rem;
        opacity: 0.85;
      }
    `,
  ],
})
export class AgentRowComponent {
  @Input({ required: true }) row!: RowLayoutConfig;
}
