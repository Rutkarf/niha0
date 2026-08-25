export type CeoStatus = 'available' | 'reviewing' | 'approved' | 'rejected' | 'away';

export type ApprovalStatus =
  | 'not-required'
  | 'pending'
  | 'agent-moving-to-ceo'
  | 'waiting-at-door'
  | 'ringing'
  | 'reviewing'
  | 'approved'
  | 'rejected'
  | 'revision-required';

export type CeoDoorState = 'closed' | 'open' | 'request-pending' | 'reviewing';

export type CeoBellState = 'idle' | 'hovered' | 'ringing' | 'pending';

export interface ApprovalRequest {
  id: string;
  taskId: string;
  agentId: string;
  agentCode: string;
  agentName: string;
  taskTitle: string;
  taskSummary?: string;
  status: ApprovalStatus;
  createdAt: string;
  updatedAt: string;
  requestedAtDoor: boolean;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface CeoOfficeState {
  doorState: CeoDoorState;
  bellState: CeoBellState;
  ceoStatus: CeoStatus;
  pendingApprovalIds: string[];
}

export const IDLE_CEO_OFFICE_STATE: CeoOfficeState = {
  doorState: 'closed',
  bellState: 'idle',
  ceoStatus: 'available',
  pendingApprovalIds: [],
};

/** Structural equality — avoids effect churn when derived state is unchanged. */
export function ceoOfficeStateEqual(a: CeoOfficeState, b: CeoOfficeState): boolean {
  if (a === b) return true;
  if (
    a.doorState !== b.doorState ||
    a.bellState !== b.bellState ||
    a.ceoStatus !== b.ceoStatus
  ) {
    return false;
  }
  if (a.pendingApprovalIds.length !== b.pendingApprovalIds.length) return false;
  for (let i = 0; i < a.pendingApprovalIds.length; i++) {
    if (a.pendingApprovalIds[i] !== b.pendingApprovalIds[i]) return false;
  }
  return true;
}
