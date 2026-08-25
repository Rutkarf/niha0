import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AgentOfficeLinkComponent } from '../../shared/ui/agent-office-link/agent-office-link.component';

export interface ModuleMeta {
  title: string;
  description: string;
  icon: string;
  features: string[];
  agentModuleKey?: string;
  agentLabel?: string;
}

@Component({
  selector: 'app-module-placeholder',
  imports: [RouterLink, AgentOfficeLinkComponent],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <a routerLink="/app/ai-office" class="back-ao">← AI Office</a>
          <p class="module-code">{{ code() }}</p>
          <h1>{{ meta().title }}</h1>
          <p>{{ meta().description }}</p>
          @if (meta().agentModuleKey) {
            <app-agent-office-link [moduleKey]="meta().agentModuleKey!" [label]="meta().agentLabel || meta().title" />
          }
        </div>
        <span class="soon-pill">Bientôt</span>
      </header>

      <div class="placeholder-card card">
        <h2 class="section-title">Module en préparation</h2>
        <p>
          Ce module n’est pas encore disponible. Les données métier ne sont pas fictives :
          l’écran est volontairement un shell « Bientôt ».
        </p>
        <h3>Fonctionnalités prévues</h3>
        <ul>
          @for (f of meta().features; track f) {
            <li>{{ f }}</li>
          }
        </ul>
        <h3>Roadmap</h3>
        <p class="roadmap">
          Priorité verticale suivante : <strong>PIM</strong> (référentiel produits), puis SCM.
          Les autres shells restent en attente — voir
          <a routerLink="/app/changelog">changelog</a>.
        </p>
        <p class="newsletter">
          Pour être informé de l’ouverture : utilisez
          <a routerLink="/app/feedback">Feedback</a> avec le sujet « {{ code() }} — intérêt module ».
        </p>
        <div class="actions">
          <a routerLink="/app/ai-office" class="btn btn-primary">Retour AI Office</a>
          <a routerLink="/app/dashboard" class="btn btn-ghost">Dashboard</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .placeholder-card {
      max-width: 640px;
      padding: 1.75rem 1.85rem;
      position: relative;
    }
    .placeholder-card::before {
      content: '';
      position: absolute;
      left: 0;
      top: 1rem;
      bottom: 1rem;
      width: 3px;
      border-radius: 2px;
      background: var(--accent-primary);
      opacity: 0.7;
    }
    h2 { padding-left: 0.65rem; margin-top: 0; }
    h3 {
      margin: 1.1rem 0 0.45rem;
      font-size: 0.72rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
      padding-left: 0.65rem;
    }
    p {
      color: var(--text-secondary);
      margin: 0 0 0.85rem;
      padding-left: 0.65rem;
      line-height: 1.55;
    }
    .roadmap a, .newsletter a { color: var(--accent-primary); }
    ul {
      margin: 0 0 1.35rem;
      padding-left: 1.85rem;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }
    li { margin-bottom: 0.3rem; }
    .actions {
      display: flex;
      gap: 0.65rem;
      flex-wrap: wrap;
      padding-left: 0.65rem;
    }
  `],
})
export class ModulePlaceholderComponent {
  readonly meta = input.required<ModuleMeta>();

  code(): string {
    const raw = this.meta().icon?.trim() || this.meta().title;
    return raw.slice(0, 3).toUpperCase();
  }
}
