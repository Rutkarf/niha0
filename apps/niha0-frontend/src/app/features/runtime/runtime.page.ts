import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { AgentRuntimeRun, AgentRuntimeStep } from '../../core/api/api.models';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge/status-badge.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { mapHttpError } from '../../core/api/http-error.util';

@Component({
  selector: 'app-runtime-page',
  imports: [
    FormsModule,
    RouterLink,
    LoadingStateComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <a routerLink="/app/ai-office" class="back-ao">← AI Office</a>
          <h1>Runtime agents</h1>
          <p>Démarrer, suivre et reprendre des exécutions (HITL = statut INTERRUPTED)</p>
        </div>
      </header>

      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }

      <form class="card form" (ngSubmit)="start()">
        <h2>Nouvelle exécution</h2>
        <p class="hint">Astuce : nommez le graphe <code>demo-hitl</code> ou ajoutez un nœud <code>human</code> dans le Studio pour forcer une pause humaine.</p>
        <div class="row">
          <label class="sr-only" for="graphName">Nom du graphe</label>
          <input
            id="graphName"
            class="input"
            placeholder="graphName (ex. default, demo-hitl)"
            [(ngModel)]="graphName"
            name="graphName"
          />
          <button class="btn btn-primary" type="submit" [disabled]="starting()">Démarrer</button>
        </div>
      </form>

      <h2 class="section-title">Runs</h2>
      @if (loading()) {
        <app-loading-state />
      } @else if (!runs().length) {
        <app-empty-state title="Aucun run" icon="RT" description="Lancez une exécution ci-dessus." />
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Graphe</th><th>Statut</th><th>Nœud</th><th>Provider</th><th></th></tr>
            </thead>
            <tbody>
              @for (r of runs(); track r.id) {
                <tr [class.selected]="selected()?.id === r.id">
                  <td>{{ r.graphName }}</td>
                  <td><app-status-badge [status]="r.status" /></td>
                  <td>{{ r.currentNode || '—' }}</td>
                  <td>{{ r.modelProvider || '—' }}</td>
                  <td class="actions">
                    <button type="button" class="btn btn-ghost btn-sm" (click)="select(r)">Steps</button>
                    @if (r.status === 'INTERRUPTED') {
                      <button type="button" class="btn btn-primary btn-sm" (click)="resume(r, 'APPROVED')">Approuver</button>
                      <button type="button" class="btn btn-ghost btn-sm" (click)="resume(r, 'REJECTED')">Rejeter</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (selected(); as sel) {
        <section class="card steps">
          <h2>Steps — {{ sel.graphName }}</h2>
          @if (sel.interruptReason) {
            <p class="callout" role="status">Interrupt : {{ sel.interruptReason }}</p>
          }
          @if (loadingSteps()) {
            <app-loading-state message="Steps…" />
          } @else if (!steps().length) {
            <app-empty-state title="Aucun step" icon="RT" />
          } @else {
            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Nœud</th><th>Statut</th><th>ms</th></tr>
                </thead>
                <tbody>
                  @for (s of steps(); track s.id) {
                    <tr>
                      <td>{{ s.stepIndex }}</td>
                      <td>{{ s.nodeName }}</td>
                      <td><app-status-badge [status]="s.status" /></td>
                      <td>{{ s.latencyMs }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>
      }
    </div>
  `,
  styles: `
    .error { color: var(--accent-danger); }
    .form, .steps { margin-bottom: 1rem; padding: 1rem; }
    .form h2, .steps h2 { margin: 0 0 0.75rem; font-size: 0.95rem; }
    .hint { margin: 0 0 0.75rem; font-size: 0.8rem; color: var(--text-muted); }
    .hint code { font-family: var(--font-mono); font-size: 0.75rem; }
    .row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .row .input { flex: 1; min-width: 140px; }
    .table-wrap { overflow-x: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-elevated); }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th, td { padding: 0.65rem 0.85rem; border-bottom: 1px solid var(--border-color); text-align: left; }
    tr.selected td { background: color-mix(in srgb, var(--accent-primary) 10%, transparent); }
    .btn-sm { font-size: 0.72rem; padding: 0.25rem 0.5rem; min-height: auto; }
    .actions { display: flex; gap: 0.35rem; flex-wrap: wrap; }
    .callout {
      margin: 0 0 0.75rem;
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-md);
      border: 1px solid color-mix(in srgb, var(--accent-warning, #d97706) 40%, var(--border-color));
      background: color-mix(in srgb, var(--accent-warning, #d97706) 12%, transparent);
      font-size: 0.85rem;
    }
    .sr-only {
      position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
      overflow: hidden; clip: rect(0, 0, 0, 0); border: 0;
    }
  `,
})
export class RuntimePage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly loadingSteps = signal(false);
  readonly starting = signal(false);
  readonly error = signal('');
  readonly runs = signal<AgentRuntimeRun[]>([]);
  readonly steps = signal<AgentRuntimeStep[]>([]);
  readonly selected = signal<AgentRuntimeRun | null>(null);

  graphName = 'default';

  ngOnInit(): void {
    this.reload();
  }

  start(): void {
    this.starting.set(true);
    this.api.startAgentRuntime({ graphName: this.graphName.trim() || 'default' }).subscribe({
      next: (run) => {
        this.starting.set(false);
        this.toast.success(run.status === 'INTERRUPTED' ? 'Run en attente humaine' : 'Run démarré');
        this.reload(() => this.select(run));
      },
      error: (err) => {
        this.starting.set(false);
        const msg = mapHttpError(err);
        this.error.set(msg);
        this.toast.error(msg);
      },
    });
  }

  select(r: AgentRuntimeRun): void {
    this.selected.set(r);
    this.loadingSteps.set(true);
    this.api.getAgentRuntimeSteps(r.id).subscribe({
      next: (data) => {
        this.steps.set(data);
        this.loadingSteps.set(false);
      },
      error: (err) => {
        this.loadingSteps.set(false);
        this.toast.error(mapHttpError(err));
      },
    });
  }

  resume(r: AgentRuntimeRun, decision: 'APPROVED' | 'REJECTED'): void {
    this.api.resumeAgentRuntime(r.id, decision).subscribe({
      next: (updated) => {
        this.toast.success(decision === 'APPROVED' ? 'Run approuvé' : 'Run rejeté');
        this.reload(() => this.select(updated));
      },
      error: (err) => this.toast.error(mapHttpError(err)),
    });
  }

  private reload(after?: () => void): void {
    this.api.listAgentRuntimeRuns().subscribe({
      next: (data) => {
        this.runs.set(data);
        this.loading.set(false);
        after?.();
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(mapHttpError(err));
      },
    });
  }
}
