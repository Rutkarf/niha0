/** SSE event types from POST /realtime/ticket + GET /realtime/events */

export type RealtimeEventType =
  | 'connected'
  | 'agent-action'
  | 'approval-decision'
  | 'message';

export interface RealtimeEventPayload {
  type: RealtimeEventType;
  payload: unknown;
  timestamp: string;
}

export interface ApprovalDecisionEvent {
  actionId?: string;
  approvalId?: string;
  decision?: string;
  agentId?: string;
}

export interface SseTicketResponse {
  ticket: string;
  expiresInMs: number;
}
