import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AgentStatusService } from '../navigation/agent-status.service';
import { CeoApprovalService } from '../approval/ceo-approval.service';

export interface RealtimeEvent {
  type: string;
  payload: unknown;
  timestamp: string;
}

interface SseTicketResponse {
  ticket: string;
  expiresInMs: number;
}

/**
 * SSE client using short-lived tickets (POST /realtime/ticket + EventSource ?ticket=).
 * JWT is never placed in the EventSource URL.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private source: EventSource | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly eventsSignal = signal<RealtimeEvent[]>([]);
  private readonly agentStatus = inject(AgentStatusService);
  private readonly ceoApproval = inject(CeoApprovalService);
  private readonly http = inject(HttpClient);
  private intentionallyClosed = false;

  readonly events = this.eventsSignal.asReadonly();

  async connect(): Promise<void> {
    this.intentionallyClosed = false;
    this.disconnect(false);
    try {
      const { ticket } = await firstValueFrom(
        this.http.post<SseTicketResponse>(`${environment.apiUrl}/realtime/ticket`, {}),
      );
      const url = `${environment.apiUrl}/realtime/events?ticket=${encodeURIComponent(ticket)}`;
      this.source = new EventSource(url);
      this.bindHandlers(this.source);
    } catch {
      this.scheduleReconnect();
    }
  }

  disconnect(permanent = true): void {
    if (permanent) this.intentionallyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.source?.close();
    this.source = null;
  }

  private bindHandlers(source: EventSource): void {
    const handle = (type: string) => (ev: MessageEvent) => {
      let payload: unknown = ev.data;
      try {
        payload = JSON.parse(ev.data);
      } catch {
        /* keep raw */
      }
      this.eventsSignal.update((list) =>
        [{ type, payload, timestamp: new Date().toISOString() }, ...list].slice(0, 50),
      );
      if (type === 'approval-decision' || type === 'agent-action') {
        this.agentStatus.refresh();
      }
      if (type === 'approval-decision' && payload && typeof payload === 'object') {
        const p = payload as { actionId?: string; decision?: string };
        if (p.actionId && p.decision) {
          this.ceoApproval.applyRemoteDecision(p.actionId, p.decision);
        }
      }
    };

    source.addEventListener('connected', handle('connected'));
    source.addEventListener('agent-action', handle('agent-action'));
    source.addEventListener('approval-decision', handle('approval-decision'));
    source.onmessage = handle('message');
    source.onerror = () => {
      source.close();
      this.source = null;
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect(): void {
    if (this.intentionallyClosed) return;
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
    }, 4000);
  }
}
