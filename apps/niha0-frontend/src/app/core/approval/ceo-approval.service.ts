import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../api/api.service';
import { Agent, AgentAction } from '../api/api.models';
import { AgentStatusService } from '../navigation/agent-status.service';
import {
  ApprovalRequest,
  ApprovalStatus,
  CeoOfficeState,
  IDLE_CEO_OFFICE_STATE,
  ceoOfficeStateEqual,
  type CeoBellState,
  type CeoDoorState,
  type CeoStatus,
} from './ceo-approval.models';

@Injectable({ providedIn: 'root' })
export class CeoApprovalService {
  private readonly api = inject(ApiService);
  private readonly agentStatus = inject(AgentStatusService);

  readonly requests = signal<ApprovalRequest[]>([]);
  readonly panelOpen = signal(false);
  readonly lastDecision = signal<{ status: 'approved' | 'rejected'; at: number } | null>(null);

  readonly pendingCount = computed(() =>
    this.requests().filter((r) =>
      ['pending', 'agent-moving-to-ceo', 'waiting-at-door', 'ringing', 'reviewing'].includes(r.status),
    ).length,
  );

  readonly officeState = computed<CeoOfficeState>(
    () => this.deriveOfficeState(this.requests()),
    { equal: ceoOfficeStateEqual },
  );

  /** Sync from backend pending actions — single source of truth for UI + 3D bridge. */
  syncFromBackend(actions: AgentAction[], agents: Agent[]): void {
    const decision = this.lastDecision();
    if (decision && Date.now() - decision.at < 3200) {
      return;
    }
    const agentById = new Map(agents.map((a) => [a.id, a]));
    const now = new Date().toISOString();
    const prev = this.requests();
    const prevById = new Map(prev.map((r) => [r.id, r]));

    const next: ApprovalRequest[] = actions
      .filter((a) => a.workflowStatus === 'REQUEST_APPROVAL')
      .map((action) => {
        const agent = agentById.get(action.agentId);
        const existing = prevById.get(action.id);
        const status: ApprovalStatus = existing?.status ?? 'pending';
        return {
          id: action.id,
          taskId: action.id,
          agentId: action.agentId,
          agentCode: agent?.code ?? 'AGENT',
          agentName: agent?.name ?? 'Agent IA',
          taskTitle: action.title,
          taskSummary: action.description,
          status: this.normalizeActiveStatus(status),
          createdAt: existing?.createdAt ?? now,
          updatedAt: existing?.updatedAt ?? now,
          requestedAtDoor: existing?.requestedAtDoor ?? false,
        };
      });

    if (this.areRequestsEqual(prev, next)) return;
    this.requests.set(next);
  }

  private areRequestsEqual(a: ApprovalRequest[], b: ApprovalRequest[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      const x = a[i]!;
      const y = b[i]!;
      if (
        x.id !== y.id ||
        x.agentId !== y.agentId ||
        x.status !== y.status ||
        x.taskTitle !== y.taskTitle ||
        x.requestedAtDoor !== y.requestedAtDoor
      ) {
        return false;
      }
    }
    return true;
  }

  markAgentMoving(agentId: string): void {
    this.patchByAgent(agentId, { status: 'agent-moving-to-ceo' });
  }

  markWaitingAtDoor(agentId: string): void {
    this.patchByAgent(agentId, { status: 'waiting-at-door', requestedAtDoor: true });
  }

  markRinging(agentId: string): void {
    this.patchByAgent(agentId, { status: 'ringing', requestedAtDoor: true });
  }

  markReviewing(requestId: string): void {
    this.patchById(requestId, { status: 'reviewing' });
  }

  applyLocalDecision(requestId: string, approved: boolean, reason?: string): void {
    this.requests.update((list) => list.filter((r) => r.id !== requestId));
    this.lastDecision.set({ status: approved ? 'approved' : 'rejected', at: Date.now() });
    window.setTimeout(() => {
      this.lastDecision.set(null);
    }, approved ? 2200 : 2800);
  }

  /** SSE / multi-tab sync — backend is source of truth for workflow status. */
  applyRemoteDecision(actionId: string, decision: string): void {
    const normalized = decision.toUpperCase();
    const stillPending = this.requests().some((r) => r.id === actionId);
    if (!stillPending) return;

    if (normalized === 'APPROVED') {
      this.applyLocalDecision(actionId, true);
    } else if (normalized === 'REJECTED') {
      this.applyLocalDecision(actionId, false);
    } else {
      this.requests.update((list) => list.filter((r) => r.id !== actionId));
    }
    this.agentStatus.refresh();
  }

  approve(requestId: string, comment = 'Approuvé'): Observable<unknown> {
    return this.api.approveAction(requestId, comment).pipe(
      tap(() => {
        this.applyLocalDecision(requestId, true);
        this.agentStatus.refresh();
      }),
    );
  }

  reject(requestId: string, reason = 'Refusé'): Observable<unknown> {
    return this.api.rejectAction(requestId, reason).pipe(
      tap(() => {
        this.applyLocalDecision(requestId, false, reason);
        this.agentStatus.refresh();
      }),
    );
  }

  openPanel(): void {
    this.panelOpen.set(true);
  }

  closePanel(): void {
    this.panelOpen.set(false);
  }

  private deriveOfficeState(requests: ApprovalRequest[]): CeoOfficeState {
    if (!requests.length) return { ...IDLE_CEO_OFFICE_STATE };

    const active = requests.filter((r) =>
      !['approved', 'rejected', 'revision-required', 'not-required'].includes(r.status),
    );
    if (!active.length) return { ...IDLE_CEO_OFFICE_STATE };

    const ringing = active.some((r) => r.status === 'ringing');
    const atDoor = active.some((r) => r.status === 'waiting-at-door' || r.status === 'ringing');
    const reviewing = active.some((r) => r.status === 'reviewing');
    const moving = active.some((r) => r.status === 'agent-moving-to-ceo');

    let doorState: CeoDoorState = 'closed';
    let bellState: CeoBellState = 'idle';
    let ceoStatus: CeoStatus = 'available';

    if (reviewing) {
      doorState = 'reviewing';
      bellState = 'pending';
      ceoStatus = 'reviewing';
    } else if (ringing) {
      doorState = 'request-pending';
      bellState = 'ringing';
      ceoStatus = 'reviewing';
    } else if (atDoor) {
      doorState = 'request-pending';
      bellState = 'pending';
      ceoStatus = 'available';
    } else if (moving) {
      doorState = 'request-pending';
      bellState = 'idle';
      ceoStatus = 'available';
    }

    const decision = this.lastDecision();
    if (decision && Date.now() - decision.at < 2500) {
      ceoStatus = decision.status === 'approved' ? 'approved' : 'rejected';
      if (decision.status === 'approved') doorState = 'open';
    }

    return {
      doorState,
      bellState,
      ceoStatus,
      pendingApprovalIds: active.map((r) => r.id),
    };
  }

  private normalizeActiveStatus(status: ApprovalStatus): ApprovalStatus {
    if (['approved', 'rejected', 'revision-required', 'not-required'].includes(status)) {
      return 'pending';
    }
    return status;
  }

  private patchByAgent(agentId: string, patch: Partial<ApprovalRequest>): void {
    this.requests.update((list) =>
      list.map((r) => (r.agentId === agentId ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r)),
    );
  }

  private patchById(id: string, patch: Partial<ApprovalRequest>): void {
    this.requests.update((list) =>
      list.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r)),
    );
  }
}
