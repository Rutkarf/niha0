import { Component, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CeoApprovalService } from '../approval/ceo-approval.service';

const AGENT_COLORS: Record<string, string> = {
  VENTES: '#34D399',
  COMPTABILITE: '#FBBF24',
  STOCK: '#FB923C',
  SUPPORT: '#2DD4BF',
  JURIDIQUE: '#94A3B8',
  ANALYTICS: '#60A5FA',
  STRATEGIE: '#5EEAD4',
  CRM: '#38BDF8',
  ERP: '#818CF8',
  RH: '#F87171',
  MARKETING: '#67E8F9',
};

@Component({
  selector: 'app-approval-notifications',
  template: `
    <div class="bell-wrap" [class.open]="open()" (click)="$event.stopPropagation()">
      <button
        type="button"
        class="bell-btn"
        [class.has-pending]="approval.pendingCount() > 0"
        [attr.aria-label]="'Notifications de validation' + (approval.pendingCount() ? ' — ' + approval.pendingCount() + ' en attente' : '')"
        [attr.aria-expanded]="open()"
        aria-haspopup="dialog"
        title="Validations CEO"
        (click)="toggle($event)"
      >
        <svg class="bell-icon" [class.ring]="ringing()" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2a5 5 0 0 0-5 5v2.1c0 .9-.3 1.8-.9 2.5L4.3 14.5A1 1 0 0 0 5.2 16H18.8a1 1 0 0 0 .9-1.5l-1.8-2.9a4.4 4.4 0 0 1-.9-2.5V7a5 5 0 0 0-5-5zm0 20a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22z"
            fill="currentColor"
          />
        </svg>
        @if (approval.pendingCount() > 0) {
          <span class="badge" aria-hidden="true">{{ approval.pendingCount() }}</span>
        }
      </button>

      @if (open()) {
        <div class="panel" role="dialog" aria-label="Validations en attente">
          <header class="panel-head">
            <h2>Validations CEO</h2>
            <button type="button" class="close" (click)="close()" aria-label="Fermer">×</button>
          </header>
          @if (approval.requests().length === 0) {
            <p class="empty">Aucune demande de validation en attente.</p>
          } @else {
            <ul class="list">
              @for (req of approval.requests(); track req.id) {
                <li class="item">
                  <div class="item-head">
                    <span class="avatar" [style.background]="agentColor(req.agentCode)" aria-hidden="true">
                      {{ req.agentCode.slice(0, 2) }}
                    </span>
                    <div>
                      <strong>{{ req.agentName }}</strong>
                      <p class="task">{{ req.taskTitle }}</p>
                      <span class="status-pill">{{ statusLabel(req.status) }}</span>
                    </div>
                  </div>
                  @if (req.taskSummary) {
                    <p class="summary">{{ req.taskSummary }}</p>
                  }
                  <div class="actions">
                    <button type="button" class="btn ok" (click)="approve(req.id)">Valider</button>
                    <button type="button" class="btn no" (click)="reject(req.id)">Refuser</button>
                    <a class="btn link" routerLink="/app/ai-office" (click)="goOffice()">Voir le détail</a>
                  </div>
                </li>
              }
            </ul>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .bell-wrap { position: relative; }
    .bell-btn {
      position: relative;
      width: 38px;
      height: 38px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      background: var(--bg-elevated);
      color: var(--text-primary);
      cursor: pointer;
      display: grid;
      place-items: center;
      transition: border-color var(--transition), background var(--transition);
    }
    .bell-btn:hover,
    .bell-btn:focus-visible {
      border-color: var(--border-strong);
      outline: 2px solid color-mix(in srgb, var(--accent-primary) 45%, transparent);
      outline-offset: 2px;
    }
    .bell-btn.has-pending { color: var(--accent-primary); }
    .bell-icon { width: 18px; height: 18px; }
    .bell-icon.ring { animation: bell-shake 0.55s ease-in-out infinite; }
    @keyframes bell-shake {
      0%, 100% { transform: rotate(0); }
      25% { transform: rotate(12deg); }
      75% { transform: rotate(-12deg); }
    }
    .badge {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      border-radius: 999px;
      background: var(--accent-primary);
      color: var(--bg-primary);
      font-size: 0.62rem;
      font-weight: 800;
      display: grid;
      place-items: center;
    }
    .panel {
      position: absolute;
      right: 0;
      top: calc(100% + 8px);
      width: min(360px, calc(100vw - 2rem));
      max-height: min(420px, 70vh);
      overflow: auto;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      z-index: var(--z-dropdown);
    }
    .panel-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 0.85rem;
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      background: var(--bg-secondary);
    }
    .panel-head h2 { margin: 0; font-size: 0.88rem; font-weight: 700; }
    .close {
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-size: 1.25rem;
      cursor: pointer;
      line-height: 1;
    }
    .empty { padding: 1rem 0.85rem; color: var(--text-muted); font-size: 0.82rem; margin: 0; }
    .list { list-style: none; margin: 0; padding: 0.35rem; }
    .item {
      padding: 0.65rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      background: var(--bg-elevated);
      margin-bottom: 0.45rem;
    }
    .item-head { display: flex; gap: 0.55rem; align-items: flex-start; }
    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: grid;
      place-items: center;
      font-size: 0.62rem;
      font-weight: 800;
      color: #fff;
      flex-shrink: 0;
    }
    .task { margin: 0.15rem 0 0; font-size: 0.78rem; color: var(--text-secondary); }
    .status-pill {
      display: inline-block;
      margin-top: 0.25rem;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.12rem 0.4rem;
      border-radius: 999px;
      background: color-mix(in srgb, var(--accent-primary) 14%, transparent);
      color: var(--accent-primary);
    }
    .summary {
      margin: 0.45rem 0 0;
      font-size: 0.75rem;
      color: var(--text-muted);
      line-height: 1.4;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      margin-top: 0.55rem;
    }
    .btn {
      border-radius: var(--radius-sm);
      font-size: 0.72rem;
      font-weight: 650;
      padding: 0.35rem 0.55rem;
      cursor: pointer;
      text-decoration: none;
      border: 1px solid var(--border-color);
      background: var(--bg-secondary);
      color: var(--text-primary);
    }
    .btn.ok {
      background: color-mix(in srgb, var(--accent-primary) 18%, var(--bg-elevated));
      border-color: color-mix(in srgb, var(--accent-primary) 35%, var(--border-color));
      color: var(--accent-primary);
    }
    .btn.no {
      color: #f87171;
      border-color: color-mix(in srgb, #f87171 35%, var(--border-color));
    }
    .btn.link { margin-left: auto; }
  `,
})
export class ApprovalNotificationsComponent {
  readonly approval = inject(CeoApprovalService);
  private readonly router = inject(Router);

  readonly open = signal(false);
  readonly ringing = signal(false);

  toggle(ev: Event): void {
    ev.stopPropagation();
    this.open.update((v) => !v);
    if (this.open()) this.ringing.set(false);
  }

  close(): void {
    this.open.set(false);
  }

  approve(id: string): void {
    this.approval.approve(id).subscribe();
  }

  reject(id: string): void {
    this.approval.reject(id).subscribe();
  }

  goOffice(): void {
    this.close();
    void this.router.navigate(['/app/ai-office']);
  }

  agentColor(code: string): string {
    return AGENT_COLORS[code] ?? '#94A3B8';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Validation requise',
      'agent-moving-to-ceo': 'Agent en route',
      'waiting-at-door': 'En attente à la porte',
      ringing: 'Sonnette activée',
      reviewing: 'Examen en cours',
      approved: 'Validée',
      rejected: 'Refusée',
      'revision-required': 'À corriger',
    };
    return map[status] ?? 'Validation requise';
  }

  @HostListener('document:click')
  onDocClick(): void {
    this.open.set(false);
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.open.set(false);
  }
}
