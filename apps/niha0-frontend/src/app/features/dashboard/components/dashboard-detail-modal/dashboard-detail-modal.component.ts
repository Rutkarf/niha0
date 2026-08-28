import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { DashboardAgent, DashboardTeam } from '../../models/dashboard.models';

@Component({
  selector: 'app-dashboard-detail-modal',
  imports: [RouterLink],
  template: `
    @if (open()) {
      <div class="overlay" role="presentation" (click)="close.emit()">
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="'dash-modal-title'"
          (click)="$event.stopPropagation()"
        >
          <header class="modal-head">
            <div class="avatar" [style.background]="accentColor()">
              {{ initials() }}
            </div>
            <div class="head-text">
              <h2 id="dash-modal-title">{{ title() }}</h2>
              <p class="sub">{{ subtitle() }}</p>
            </div>
            <button type="button" class="close" aria-label="Fermer" (click)="close.emit()">×</button>
          </header>

          <div class="modal-body">
            @if (agent(); as a) {
              <dl class="facts">
                <div><dt>Équipe</dt><dd>{{ a.team }}</dd></div>
                <div><dt>Rôle</dt><dd>{{ a.role }}</dd></div>
                <div><dt>Bureau</dt><dd><code>{{ a.deskCode }}</code></dd></div>
                <div><dt>Email</dt><dd>{{ a.email }}</dd></div>
                <div>
                  <dt>Statut LED</dt>
                  <dd><span class="led" [class]="a.ledStatus">{{ ledLabel(a.ledStatus) }}</span></dd>
                </div>
                <div><dt>Performance</dt><dd>{{ a.performance }}%</dd></div>
                <div><dt>Tâches en cours</dt><dd>{{ a.tasksInProgress }}</dd></div>
                <div><dt>Tâches complétées</dt><dd>{{ a.tasksCompleted }}</dd></div>
              </dl>
              <section>
                <h3>Dernière action</h3>
                <p>{{ a.lastAction }}</p>
              </section>
              <section>
                <h3>Historique</h3>
                <ul>
                  @for (h of a.history; track h) {
                    <li>{{ h }}</li>
                  }
                </ul>
              </section>
            }

            @if (team(); as t) {
              <dl class="facts">
                <div><dt>Chef</dt><dd>{{ t.chiefTitle }}</dd></div>
                <div><dt>Agents</dt><dd>{{ t.agentCount }} membres · {{ t.activeCount }} actifs</dd></div>
                <div><dt>Performance</dt><dd>{{ t.performance }}%</dd></div>
                <div><dt>Temps moyen réponse</dt><dd>{{ t.avgResponseMin }} min</dd></div>
                <div><dt>Tâches en cours</dt><dd>{{ t.tasksInProgress }}</dd></div>
                <div><dt>Tâches complétées</dt><dd>{{ t.tasksCompleted }}</dd></div>
              </dl>
              <section>
                <h3>Membres de l'équipe</h3>
                <ul class="member-list">
                  @for (m of t.members; track m.id) {
                    <li>
                      <span class="dot" [style.background]="m.teamColor"></span>
                      {{ m.role }}
                      <span class="led-sm" [class]="m.ledStatus"></span>
                    </li>
                  }
                </ul>
              </section>
            }
          </div>

          <footer class="modal-foot">
            @if (agent(); as a) {
              <a
                class="btn btn-primary"
                routerLink="/app/ai-office"
                [queryParams]="aiOfficeParams(a)"
                (click)="close.emit()"
              >
                Voir dans l'AI Office
              </a>
              <button type="button" class="btn btn-ghost" (click)="action.emit('contact')">Contacter</button>
              <button type="button" class="btn btn-ghost" (click)="action.emit('assign')">Assigner tâche</button>
            }
            @if (team(); as t) {
              <button type="button" class="btn btn-primary" (click)="action.emit('team-' + t.rowId)">
                Voir équipe
              </button>
              <button type="button" class="btn btn-ghost" (click)="action.emit('report')">Rapport</button>
              <a
                class="btn btn-ghost"
                routerLink="/app/ai-office"
                [queryParams]="{ row: t.rowId }"
                (click)="close.emit()"
              >
                Vue 3D équipe
              </a>
            }
          </footer>
        </div>
      </div>
    }
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      z-index: var(--z-modal);
      background: var(--overlay-scrim);
      display: grid;
      place-items: center;
      padding: var(--space-4);
      animation: fade-in var(--duration-fast) ease both;
    }

    .modal {
      width: min(520px, 100%);
      max-height: min(85vh, 720px);
      overflow: auto;
      background: var(--bg-elevated);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
    }

    .modal-head {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: var(--space-3);
      align-items: start;
      padding: var(--space-4);
      border-bottom: 1px solid var(--border-color);
    }

    .avatar {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: var(--radius-md);
      display: grid;
      place-items: center;
      font-weight: 800;
      font-size: 0.85rem;
      color: #fff;
    }

    .head-text h2 {
      margin: 0;
      font-size: var(--fs-lg);
    }

    .sub {
      margin: 0.2rem 0 0;
      font-size: var(--fs-sm);
      color: var(--text-muted);
    }

    .close {
      border: none;
      background: transparent;
      font-size: 1.4rem;
      line-height: 1;
      cursor: pointer;
      color: var(--text-muted);
    }

    .modal-body {
      padding: var(--space-4);
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .facts {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-2) var(--space-4);
      margin: 0;
    }

    .facts dt {
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
    }

    .facts dd {
      margin: 0.15rem 0 0;
      font-size: var(--fs-sm);
    }

    section h3 {
      margin: 0 0 var(--space-2);
      font-size: var(--fs-sm);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }

    ul {
      margin: 0;
      padding-left: 1.1rem;
      font-size: var(--fs-sm);
      color: var(--text-secondary);
    }

    .member-list {
      list-style: none;
      padding: 0;
    }

    .member-list li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0;
      border-bottom: 1px solid var(--border-color);
    }

    .dot {
      width: 0.55rem;
      height: 0.55rem;
      border-radius: 50%;
    }

    .led, .led-sm {
      display: inline-block;
      width: 0.55rem;
      height: 0.55rem;
      border-radius: 50%;
    }

    .led.green, .led-sm.green { background: #2ecc71; box-shadow: 0 0 6px #2ecc7188; }
    .led.red, .led-sm.red { background: #e74c3c; box-shadow: 0 0 6px #e74c3c88; }
    .led.off, .led-sm.off { background: var(--text-muted); }

    .led-sm { margin-left: auto; }

    .modal-foot {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      border-top: 1px solid var(--border-color);
    }
  `],
})
export class DashboardDetailModalComponent {
  readonly open = input(false);
  readonly agent = input<DashboardAgent | null>(null);
  readonly team = input<DashboardTeam | null>(null);
  readonly close = output<void>();
  readonly action = output<string>();

  title(): string {
    const a = this.agent();
    if (a) return a.name;
    const t = this.team();
    if (t) return t.name;
    return '';
  }

  subtitle(): string {
    const a = this.agent();
    if (a) return a.isChief ? `Chef · ${a.team}` : `${a.role} · ${a.team}`;
    const t = this.team();
    if (t) return `Équipe ${t.rowId} · ${t.chiefName}`;
    return '';
  }

  accentColor(): string {
    return this.agent()?.teamColor ?? this.team()?.color ?? 'var(--accent-primary)';
  }

  initials(): string {
    const a = this.agent();
    if (a) return a.team.slice(0, 2).toUpperCase();
    const t = this.team();
    if (t) return t.name.slice(0, 2).toUpperCase();
    return 'NH';
  }

  ledLabel(status: string): string {
    switch (status) {
      case 'green':
        return 'Autonome (vert)';
      case 'red':
        return 'Validation humaine (rouge)';
      default:
        return 'Inactif';
    }
  }

  aiOfficeParams(a: DashboardAgent): Record<string, string> {
    if (a.isChief) return { row: String(a.rowId), focus: 'chief' };
    return { desk: a.deskCode };
  }
}
