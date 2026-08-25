import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-agent-office-link',
  imports: [RouterLink],
  template: `
    <a class="ao-link" routerLink="/app/ai-office" [queryParams]="queryParams()">
      <span class="mark" aria-hidden="true">◈</span>
      {{ linkLabel() }}
    </a>
  `,
  styles: `
    .ao-link {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      margin-top: 0.75rem;
      padding: 0.45rem 0.8rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-strong);
      color: var(--accent-primary);
      text-decoration: none;
      font-size: 0.78rem;
      font-weight: 650;
      background: color-mix(in srgb, var(--accent-primary) 10%, transparent);
      transition: background var(--transition), border-color var(--transition);
    }
    .ao-link:hover {
      background: color-mix(in srgb, var(--accent-primary) 16%, transparent);
      text-decoration: none;
    }
    .mark { font-size: 0.9rem; line-height: 1; }
  `,
})
export class AgentOfficeLinkComponent {
  @Input({ required: true }) moduleKey!: string;
  @Input() label = '';
  /** When set, opens the 3D data library instead of an agent desk. */
  @Input() libraryId: string | null = null;

  queryParams(): Record<string, string> {
    return this.libraryId ? { library: this.libraryId } : { agent: this.moduleKey };
  }

  linkLabel(): string {
    if (this.libraryId) {
      return `Voir la bibliothèque ${this.label || this.libraryId} dans l’AI Office`;
    }
    return `Voir l’agent ${this.label} dans l’AI Office`;
  }
}
