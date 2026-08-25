import { JsonPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import {
  GuardrailEvent,
  Permission,
  ToolSandboxLog,
} from '../../core/api/api.models';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { mapHttpError } from '../../core/api/http-error.util';

type GovTab = 'permissions' | 'eval' | 'guardrails' | 'sandbox' | 'scan';

@Component({
  selector: 'app-governance-page',
  imports: [FormsModule, JsonPipe, RouterLink, LoadingStateComponent, EmptyStateComponent],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <a routerLink="/app/ai-office" class="back-ao">← AI Office</a>
          <h1>Gouvernance</h1>
          <p>Permissions, eval, guardrails et sandbox outils</p>
        </div>
      </header>

      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }

      <div class="tabs" role="tablist" aria-label="Sections gouvernance">
        @for (t of tabs; track t.id) {
          <button
            type="button"
            class="tab"
            role="tab"
            [attr.id]="'gov-tab-' + t.id"
            [attr.aria-selected]="tab() === t.id"
            [attr.aria-controls]="'gov-panel-' + t.id"
            [class.active]="tab() === t.id"
            (click)="setTab(t.id)"
          >
            {{ t.label }}
          </button>
        }
      </div>

      @if (loading()) {
        <app-loading-state />
      } @else {
        <div [attr.id]="'gov-panel-' + tab()" role="tabpanel" [attr.aria-labelledby]="'gov-tab-' + tab()">
        @switch (tab()) {
          @case ('permissions') {
            @if (!permissions().length) {
              <app-empty-state title="Aucune permission" icon="GV" />
            } @else {
              <div class="table-wrap">
                <table>
                  <thead><tr><th>Code</th><th>Description</th></tr></thead>
                  <tbody>
                    @for (p of permissions(); track p.id) {
                      <tr><td class="mono">{{ p.code }}</td><td>{{ p.description }}</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          }
          @case ('eval') {
            @if (evalDash(); as dash) {
              <div class="kpi-grid">
                @for (entry of evalEntries(dash); track entry.key) {
                  <div class="kpi card">
                    <span class="kpi-label">{{ entry.key }}</span>
                    <span class="kpi-value">{{ entry.value }}</span>
                  </div>
                }
              </div>
            } @else {
              <app-empty-state title="Pas de métriques" icon="GV" />
            }
          }
          @case ('guardrails') {
            @if (!events().length) {
              <app-empty-state title="Aucun événement" icon="GV" />
            } @else {
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr><th>Type</th><th>Sévérité</th><th>Source</th><th>Bloqué</th><th>Détail</th></tr>
                  </thead>
                  <tbody>
                    @for (e of events(); track e.id) {
                      <tr>
                        <td>{{ e.eventType }}</td>
                        <td>{{ e.severity }}</td>
                        <td>{{ e.source }}</td>
                        <td>{{ e.blocked ? 'oui' : 'non' }}</td>
                        <td class="muted">{{ e.detail || '—' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          }
          @case ('sandbox') {
            @if (!logs().length) {
              <app-empty-state title="Aucun log sandbox" icon="GV" />
            } @else {
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr><th>Outil</th><th>Autorisé</th><th>ms</th><th>Détail</th></tr>
                  </thead>
                  <tbody>
                    @for (l of logs(); track l.id) {
                      <tr>
                        <td>{{ l.toolName }}</td>
                        <td>{{ l.allowed ? 'oui' : 'non' }}</td>
                        <td>{{ l.durationMs }}</td>
                        <td class="muted">{{ l.detail || '—' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          }
          @case ('scan') {
            <form class="card form" (ngSubmit)="runScan()">
              <h2>Scanner un texte</h2>
              <label class="sr-only" for="scanText">Texte à scanner</label>
              <textarea id="scanText" class="input textarea" rows="4" [(ngModel)]="scanText" name="scanText" required></textarea>
              <button class="btn btn-primary" type="submit" [disabled]="scanning()">Scanner</button>
              @if (scanResult()) {
                <pre class="json">{{ scanResult() | json }}</pre>
              }
            </form>
          }
        }
        </div>
      }
    </div>
  `,
  styles: `
    .error { color: var(--accent-danger); }
    .tabs { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 1rem; }
    .tab {
      border: 1px solid var(--border-color);
      background: var(--bg-elevated);
      color: var(--text-secondary);
      border-radius: var(--radius-md);
      padding: 0.4rem 0.75rem;
      cursor: pointer;
      font-size: 0.8rem;
    }
    .tab.active {
      border-color: var(--accent-primary);
      color: var(--text-primary);
      background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
    }
    .table-wrap { overflow-x: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-elevated); }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th, td { padding: 0.65rem 0.85rem; border-bottom: 1px solid var(--border-color); text-align: left; }
    .mono { font-family: var(--font-mono); font-size: 0.8rem; }
    .muted { color: var(--text-muted); font-size: 0.8rem; }
    .json {
      margin: 0;
      padding: 1rem;
      font-family: var(--font-mono);
      font-size: 0.78rem;
      overflow-x: auto;
      white-space: pre-wrap;
    }
    .form { padding: 1rem; max-width: 640px; }
    .form h2 { margin: 0 0 0.75rem; font-size: 0.95rem; }
    .textarea { width: 100%; margin-bottom: 0.75rem; }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 0.75rem;
    }
    .kpi { padding: 0.85rem 1rem; display: flex; flex-direction: column; gap: 0.35rem; }
    .kpi-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); }
    .kpi-value { font-size: 1.25rem; font-weight: 650; font-family: var(--font-mono); }
    .sr-only {
      position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
      overflow: hidden; clip: rect(0, 0, 0, 0); border: 0;
    }
  `,
})
export class GovernancePage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  readonly tabs: { id: GovTab; label: string }[] = [
    { id: 'permissions', label: 'Permissions' },
    { id: 'eval', label: 'Eval' },
    { id: 'guardrails', label: 'Guardrails' },
    { id: 'sandbox', label: 'Sandbox' },
    { id: 'scan', label: 'Scan' },
  ];

  readonly tab = signal<GovTab>('permissions');
  readonly loading = signal(true);
  readonly scanning = signal(false);
  readonly error = signal('');
  readonly permissions = signal<Permission[]>([]);
  readonly events = signal<GuardrailEvent[]>([]);
  readonly logs = signal<ToolSandboxLog[]>([]);
  readonly evalDash = signal<Record<string, unknown> | null>(null);
  readonly scanResult = signal<Record<string, unknown> | null>(null);

  scanText = '';

  ngOnInit(): void {
    this.reload();
  }

  setTab(id: GovTab): void {
    this.tab.set(id);
  }

  evalEntries(dash: Record<string, unknown>): { key: string; value: string }[] {
    return Object.entries(dash).map(([key, value]) => ({
      key,
      value: value == null ? '—' : typeof value === 'object' ? JSON.stringify(value) : String(value),
    }));
  }

  runScan(): void {
    this.scanning.set(true);
    this.api.scanGuardrail(this.scanText).subscribe({
      next: (res) => {
        this.scanning.set(false);
        this.scanResult.set(res);
        this.toast.success(res.blocked ? 'Bloqué' : 'OK');
        this.reloadGuardrails();
      },
      error: (err) => {
        this.scanning.set(false);
        const msg = mapHttpError(err);
        this.error.set(msg);
        this.toast.error(msg);
      },
    });
  }

  private reload(): void {
    this.loading.set(true);
    let pending = 4;
    const done = () => {
      pending -= 1;
      if (pending <= 0) this.loading.set(false);
    };

    this.api.getGovernancePermissionsMe().subscribe({
      next: (d) => {
        this.permissions.set(d);
        done();
      },
      error: (err) => {
        this.toast.error(mapHttpError(err));
        done();
      },
    });
    this.api.getEvalDashboard().subscribe({
      next: (d) => {
        this.evalDash.set(d);
        done();
      },
      error: () => done(),
    });
    this.api.getGuardrailEvents().subscribe({
      next: (d) => {
        this.events.set(d);
        done();
      },
      error: () => done(),
    });
    this.api.getSandboxLogs().subscribe({
      next: (d) => {
        this.logs.set(d);
        done();
      },
      error: () => done(),
    });
  }

  private reloadGuardrails(): void {
    this.api.getGuardrailEvents().subscribe({
      next: (d) => this.events.set(d),
    });
  }
}
