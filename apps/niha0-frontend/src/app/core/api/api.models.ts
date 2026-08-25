export type AgentStatus =
  | 'AVAILABLE'
  | 'THINKING'
  | 'PREPARING'
  | 'WAITING_APPROVAL'
  | 'EXECUTING'
  | 'ERROR'
  | 'OFFLINE'
  | 'PAUSED';

export type WorkflowStatus =
  | 'READ'
  | 'DRAFT'
  | 'REQUEST_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'DEFERRED'
  | 'MODIFIED'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED';

export interface EntityBase {
  id: string;
  organizationId: string;
  createdAt: string;
}

export interface DashboardKpis {
  customerCount: number;
  leadCount: number;
  openOpportunityCount: number;
  pipelineAmount: number;
  invoiceCount: number;
  openTicketCount: number;
  agentCount: number;
  pendingApprovalCount: number;
}

export interface Agent extends EntityBase {
  code: string;
  name: string;
  domain: string;
  description: string;
  mission: string;
  status: AgentStatus;
  capabilities: string;
}

export interface AgentAction extends EntityBase {
  agentId: string;
  requestedBy: string;
  actionType: string;
  title: string;
  description: string;
  draftPayload: string;
  workflowStatus: WorkflowStatus;
  agentStatus: AgentStatus;
  updatedAt: string;
}

export interface AgentApproval extends EntityBase {
  actionId: string;
  decision: string;
  comment: string;
  decidedBy: string;
  decidedAt: string;
}

export interface NotificationItem extends EntityBase {
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
}

export interface AuditLog extends EntityBase {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  sector: string;
  description?: string | null;
  website?: string | null;
  country?: string | null;
  city?: string | null;
  companySize?: string | null;
  professionalEmail?: string | null;
  slogan?: string | null;
  logoUrl?: string | null;
  logoAssetId?: string | null;
  onboardingStatus?: string | null;
  workspaceConfig?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Customer extends EntityBase {
  name: string;
  email: string;
  phone: string;
  industry: string;
  status: string;
}

export interface Lead extends EntityBase {
  companyName: string;
  contactName: string;
  email: string;
  source: string;
  status: string;
  score: number;
}

export interface Opportunity extends EntityBase {
  customerId: string;
  title: string;
  stage: string;
  amount: number;
  probability: number;
  expectedClose: string;
}

export interface Invoice extends EntityBase {
  customerId: string;
  reference: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  issuedAt: string;
}

export interface Ticket extends EntityBase {
  customerId: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
}

export interface Contract extends EntityBase {
  title: string;
  category: string;
  status: string;
  startDate: string;
  endDate: string;
  content?: string;
}

export interface Employee extends EntityBase {
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  department: string;
  status: string;
  hiredAt?: string;
}

export interface LeaveRequest extends EntityBase {
  employeeId: string;
  leaveType: string;
  status: string;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
}

export interface StockItem extends EntityBase {
  sku: string;
  name: string;
  quantity: number;
  reorderLevel: number;
  unit: string;
  location?: string;
  status: string;
}

export interface Document extends EntityBase {
  title: string;
  category: string;
  status: string;
  content: string;
}

export interface MarketingPost extends EntityBase {
  title: string;
  channel: string;
  status: string;
  content: string;
}

export interface Campaign extends EntityBase {
  name: string;
  status: string;
  budget: number;
  startDate: string;
  endDate: string;
}

export interface Payment extends EntityBase {
  invoiceId: string;
  amount: number;
  status: string;
  paidAt: string;
  method: string;
}

export type BillingPlanTier = 'FREE' | 'PRO' | 'BUSINESS';

/**
 * Billing plan DTO — must match backend `BillingPlanResponse`
 * (plan, seatsUsed, seatsLimit, storageNote).
 */
export interface BillingPlan {
  plan: BillingPlanTier;
  seatsUsed: number;
  seatsLimit: number;
  storageNote: string;
}

/** Safe FREE stub when `/billing/plan` is unavailable (Settings fallback). */
export function defaultBillingPlan(overrides: Partial<BillingPlan> = {}): BillingPlan {
  return {
    plan: 'FREE',
    seatsUsed: 1,
    seatsLimit: 3,
    storageNote: 'Plan local stub',
    ...overrides,
  };
}

export interface BillingCheckoutResponse {
  checkoutId?: string;
  hostedCheckoutUrl: string;
  plan?: BillingPlanTier;
  amountCents?: number;
  currency?: string;
  status?: string;
  checkoutReference: string;
}

export interface BillingCheckoutStatus {
  checkoutReference: string;
  status: string;
  plan?: BillingPlanTier;
  hostedCheckoutUrl?: string;
}

export interface MembershipMember {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  active?: boolean;
}

export interface OrganizationInvite {
  id: string;
  email: string;
  role: string;
  token?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: string;
  active: boolean;
  createdAt: string;
}

export type FeedbackCategory = 'BUG' | 'FEATURE' | 'BILLING' | 'OTHER';

export interface MfaEnrollment {
  secret?: string;
  qrCodeUrl?: string;
  otpauthUri?: string;
  enabled: boolean;
}

export interface PrivacyExport {
  exportedAt: string;
  organization?: Record<string, unknown>;
  user?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CreateInvoicePayload {
  reference: string;
  totalAmount: number;
  status: 'DRAFT' | 'SENT';
  dueDate: string;
  customerId?: string;
}

export interface CreatePaymentPayload {
  invoiceId?: string;
  amount: number;
  status?: string;
  method?: string;
  paidAt?: string;
}

export interface CreateCampaignPayload {
  name: string;
  budget: number;
  status: 'DRAFT' | string;
}

export interface CreateMarketingPostPayload {
  title: string;
  channel: string;
  status?: string;
  content: string;
}

export interface CreateInvitePayload {
  email: string;
  role: string;
}

export interface AcceptInvitePayload {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface SubmitFeedbackPayload {
  category: FeedbackCategory;
  message: string;
}

export interface CreateWebhookPayload {
  url: string;
  events: string[] | string;
  secret?: string;
}

export interface UpdateMemberPayload {
  role: string;
  active?: boolean;
}
