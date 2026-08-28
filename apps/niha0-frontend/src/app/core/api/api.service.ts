import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEventType, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Agent,
  AgentAction,
  AgentApproval,
  AgentDefinition,
  AgentMemory,
  AgentRuntimeRun,
  AgentRuntimeStep,
  AuditLog,
  AcceptInvitePayload,
  BillingCheckoutResponse,
  BillingCheckoutStatus,
  BillingPlan,
  BillingPlanTier,
  BiReport,
  Campaign,
  ChatMessage,
  ChatPostMessageResponse,
  ChatThread,
  Contract,
  CreateCampaignPayload,
  CreateInvitePayload,
  CreateInvoicePayload,
  CreateMarketingPostPayload,
  CreatePaymentPayload,
  CreateWebhookPayload,
  Customer,
  DashboardKpis,
  Document,
  Employee,
  ErpItem,
  GuardrailEvent,
  Invoice,
  Lead,
  LeaveRequest,
  MarketingPost,
  MarketplaceInstall,
  MarketplaceListing,
  MembershipMember,
  MfaEnrollment,
  NotificationItem,
  Opportunity,
  Organization,
  OrganizationInvite,
  Payment,
  Permission,
  PimProduct,
  PimVariant,
  PrivacyExport,
  ResetPasswordPayload,
  StockItem,
  SubmitFeedbackPayload,
  Ticket,
  ToolSandboxLog,
  UpdateMemberPayload,
  WebhookEndpoint,
} from './api.models';
import type { OrganizationUpdateDto } from './organization.dto';
import type { CompanyDataAsset } from '../workspace/professional.models';
import type { TokenResponse } from '../auth/auth.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getDashboardKpis(): Observable<DashboardKpis> {
    return this.http.get<DashboardKpis>(`${this.base}/dashboard/kpis`);
  }

  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${this.base}/crm/customers`);
  }

  createCustomer(body: Partial<Customer>): Observable<Customer> {
    return this.http.post<Customer>(`${this.base}/crm/customers`, body);
  }

  updateCustomer(id: string, body: Partial<Customer>): Observable<Customer> {
    return this.http.put<Customer>(`${this.base}/crm/customers/${id}`, body);
  }

  deleteCustomer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/crm/customers/${id}`);
  }

  getLeads(): Observable<Lead[]> {
    return this.http.get<Lead[]>(`${this.base}/crm/leads`);
  }

  createLead(body: Partial<Lead>): Observable<Lead> {
    return this.http.post<Lead>(`${this.base}/crm/leads`, body);
  }

  updateLead(id: string, body: Partial<Lead>): Observable<Lead> {
    return this.http.put<Lead>(`${this.base}/crm/leads/${id}`, body);
  }

  deleteLead(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/crm/leads/${id}`);
  }

  recommendAgentAction(agentId: string): Observable<AgentAction> {
    return this.http.post<AgentAction>(`${this.base}/agents/${agentId}/recommend`, {});
  }

  getAgentEngine(): Observable<{ demo: boolean; label: string }> {
    return this.http.get<{ demo: boolean; label: string }>(`${this.base}/agents/engine`);
  }

  getOpportunities(): Observable<Opportunity[]> {
    return this.http.get<Opportunity[]>(`${this.base}/crm/opportunities`);
  }

  createOpportunity(body: Partial<Opportunity>): Observable<Opportunity> {
    return this.http.post<Opportunity>(`${this.base}/crm/opportunities`, body);
  }

  updateOpportunity(id: string, body: Partial<Opportunity>): Observable<Opportunity> {
    return this.http.put<Opportunity>(`${this.base}/crm/opportunities/${id}`, body);
  }

  deleteOpportunity(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/crm/opportunities/${id}`);
  }

  getInvoices(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.base}/accounting/invoices`);
  }

  getTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.base}/tickets`);
  }

  getContracts(): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.base}/legal/contracts`);
  }

  createContract(body: Partial<Contract>): Observable<Contract> {
    return this.http.post<Contract>(`${this.base}/legal/contracts`, body);
  }

  updateContract(id: string, body: Partial<Contract>): Observable<Contract> {
    return this.http.put<Contract>(`${this.base}/legal/contracts/${id}`, body);
  }

  deleteContract(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/legal/contracts/${id}`);
  }

  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.base}/hr/employees`);
  }

  createEmployee(body: Partial<Employee>): Observable<Employee> {
    return this.http.post<Employee>(`${this.base}/hr/employees`, body);
  }

  updateEmployee(id: string, body: Partial<Employee>): Observable<Employee> {
    return this.http.put<Employee>(`${this.base}/hr/employees/${id}`, body);
  }

  deleteEmployee(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/hr/employees/${id}`);
  }

  getLeaves(): Observable<LeaveRequest[]> {
    return this.http.get<LeaveRequest[]>(`${this.base}/hr/leaves`);
  }

  createLeave(body: Partial<LeaveRequest>): Observable<LeaveRequest> {
    return this.http.post<LeaveRequest>(`${this.base}/hr/leaves`, body);
  }

  decideLeave(id: string, status: string): Observable<LeaveRequest> {
    return this.http.post<LeaveRequest>(`${this.base}/hr/leaves/${id}/decide`, { status });
  }

  deleteLeave(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/hr/leaves/${id}`);
  }

  getStockItems(): Observable<StockItem[]> {
    return this.http.get<StockItem[]>(`${this.base}/stock/items`);
  }

  createStockItem(body: Partial<StockItem>): Observable<StockItem> {
    return this.http.post<StockItem>(`${this.base}/stock/items`, body);
  }

  adjustStock(id: string, body: { movementType: string; quantity: number; note?: string }): Observable<StockItem> {
    return this.http.post<StockItem>(`${this.base}/stock/items/${id}/adjust`, body);
  }

  deleteStockItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/stock/items/${id}`);
  }

  getDocuments(): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.base}/administration/documents`);
  }

  getMarketingPosts(): Observable<MarketingPost[]> {
    return this.http.get<MarketingPost[]>(`${this.base}/marketing/posts`);
  }

  getCampaigns(): Observable<Campaign[]> {
    return this.http.get<Campaign[]>(`${this.base}/marketing/campaigns`);
  }

  getAgents(): Observable<Agent[]> {
    return this.http.get<Agent[]>(`${this.base}/agents`);
  }

  getAgentActions(): Observable<AgentAction[]> {
    return this.http.get<AgentAction[]>(`${this.base}/agents/actions`);
  }

  getApprovals(): Observable<AgentApproval[]> {
    return this.http.get<AgentApproval[]>(`${this.base}/approvals`);
  }

  getPendingApprovals(): Observable<AgentAction[]> {
    return this.http.get<AgentAction[]>(`${this.base}/approvals/pending`);
  }

  approveAction(actionId: string, comment = ''): Observable<AgentApproval> {
    return this.http.post<AgentApproval>(`${this.base}/approvals/${actionId}/approve`, { comment });
  }

  rejectAction(actionId: string, comment = ''): Observable<AgentApproval> {
    return this.http.post<AgentApproval>(`${this.base}/approvals/${actionId}/reject`, { comment });
  }

  deferAction(actionId: string, comment = ''): Observable<AgentApproval> {
    return this.http.post<AgentApproval>(`${this.base}/approvals/${actionId}/defer`, { comment });
  }

  modifyAction(actionId: string, comment = ''): Observable<AgentApproval> {
    return this.http.post<AgentApproval>(`${this.base}/approvals/${actionId}/modify`, { comment });
  }

  searchRag(query: string, limit = 8): Observable<{
    query: string;
    totalChunks: number;
    engine: string;
    hits: Array<{
      chunkId: string;
      dataAssetId: string;
      assetName: string;
      chunkIndex: number;
      excerpt: string;
      score: number;
    }>;
  }> {
    return this.http.get<{
      query: string;
      totalChunks: number;
      engine: string;
      hits: Array<{
        chunkId: string;
        dataAssetId: string;
        assetName: string;
        chunkIndex: number;
        excerpt: string;
        score: number;
      }>;
    }>(`${this.base}/rag/search`, {
      params: { q: query, limit: String(limit) },
    });
  }

  getRagStats(): Observable<{
    chunkCount: number;
    engine: string;
    embeddingProvider: string;
    demo: boolean;
  }> {
    return this.http.get<{
      chunkCount: number;
      engine: string;
      embeddingProvider: string;
      demo: boolean;
    }>(`${this.base}/rag/stats`);
  }

  getNotifications(): Observable<NotificationItem[]> {
    return this.http.get<NotificationItem[]>(`${this.base}/notifications`);
  }

  getAuditLogs(): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.base}/audit`);
  }

  getCurrentOrganization(): Observable<Organization> {
    return this.http.get<Organization>(`${this.base}/organizations/current`);
  }

  updateOrganization(body: OrganizationUpdateDto): Observable<Organization> {
    return this.http.patch<Organization>(`${this.base}/organizations/current`, body);
  }

  uploadOrganizationLogo(file: File): Observable<Organization> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<Organization>(`${this.base}/organizations/current/logo`, form);
  }

  clearOrganizationLogo(): Observable<Organization> {
    return this.http.delete<Organization>(`${this.base}/organizations/current/logo`);
  }

  listCompanyDataAssets(): Observable<CompanyDataAsset[]> {
    return this.http.get<CompanyDataAsset[]>(`${this.base}/organizations/current/data-assets`);
  }

  uploadCompanyDataAsset(file: File, category?: string, description?: string): Observable<CompanyDataAsset> {
    const form = new FormData();
    form.append('file', file);
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    if (description) params = params.set('description', description);
    return this.http.post<CompanyDataAsset>(
      `${this.base}/organizations/current/data-assets/upload`,
      form,
      { params },
    );
  }

  /** Upload with HTTP progress events (0–100). Emits final asset when complete. */
  uploadCompanyDataAssetProgress(
    file: File,
    category?: string,
    description?: string,
  ): Observable<{ progress: number; done: boolean; asset?: CompanyDataAsset }> {
    const form = new FormData();
    form.append('file', file);
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    if (description) params = params.set('description', description);
    return this.http
      .post<CompanyDataAsset>(`${this.base}/organizations/current/data-assets/upload`, form, {
        params,
        reportProgress: true,
        observe: 'events',
      })
      .pipe(
        map((event) => {
          if (event.type === HttpEventType.UploadProgress) {
            const total = event.total ?? file.size;
            const progress = total > 0 ? Math.min(99, Math.round((100 * event.loaded) / total)) : 0;
            return { progress, done: false };
          }
          if (event.type === HttpEventType.Response) {
            return { progress: 100, done: true, asset: event.body ?? undefined };
          }
          return { progress: 0, done: false };
        }),
      );
  }

  createTicket(payload: Partial<Ticket> & { subject: string }): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.base}/tickets`, payload);
  }

  updateTicket(id: string, payload: Partial<Ticket>): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.base}/tickets/${id}`, payload);
  }

  downloadStoredAsset(assetId: string): Observable<Blob> {
    return this.http.get(`${this.base}/storage/assets/${assetId}`, { responseType: 'blob' });
  }

  getStoredAssetSignedUrl(assetId: string, ttlSeconds = 300): Observable<{
    supported: boolean;
    url?: string;
    expiresInSeconds?: number;
    streamPath?: string;
    filename?: string;
  }> {
    return this.http.get<{
      supported: boolean;
      url?: string;
      expiresInSeconds?: number;
      streamPath?: string;
      filename?: string;
    }>(`${this.base}/storage/assets/${assetId}/signed-url`, {
      params: { ttlSeconds: String(ttlSeconds) },
    });
  }

  downloadStoredAssetUrl(assetId: string): string {
    return `${this.base}/storage/assets/${assetId}`;
  }

  createCompanyDataAsset(body: Partial<CompanyDataAsset>): Observable<CompanyDataAsset> {
    return this.http.post<CompanyDataAsset>(`${this.base}/organizations/current/data-assets`, body);
  }

  updateCompanyDataAsset(id: string, body: Partial<CompanyDataAsset>): Observable<CompanyDataAsset> {
    return this.http.put<CompanyDataAsset>(`${this.base}/organizations/current/data-assets/${id}`, body);
  }

  deleteCompanyDataAsset(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/organizations/current/data-assets/${id}`);
  }

  createInvoice(body: CreateInvoicePayload): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.base}/accounting/invoices`, body);
  }

  createPayment(body: CreatePaymentPayload): Observable<Payment> {
    return this.http.post<Payment>(`${this.base}/accounting/payments`, body);
  }

  getPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.base}/accounting/payments`);
  }

  createCampaign(body: CreateCampaignPayload): Observable<Campaign> {
    return this.http.post<Campaign>(`${this.base}/marketing/campaigns`, body);
  }

  createMarketingPost(body: CreateMarketingPostPayload): Observable<MarketingPost> {
    return this.http.post<MarketingPost>(`${this.base}/marketing/posts`, body);
  }

  getMembers(): Observable<MembershipMember[]> {
    return this.http.get<MembershipMember[]>(`${this.base}/organizations/members`);
  }

  updateMember(id: string, body: UpdateMemberPayload): Observable<MembershipMember> {
    return this.http.patch<MembershipMember>(`${this.base}/organizations/members/${id}`, body);
  }

  removeMember(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/organizations/members/${id}`);
  }

  createInvite(body: CreateInvitePayload): Observable<OrganizationInvite> {
    return this.http.post<OrganizationInvite>(`${this.base}/organizations/invites`, body);
  }

  listInvites(): Observable<OrganizationInvite[]> {
    return this.http.get<OrganizationInvite[]>(`${this.base}/organizations/invites`);
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/auth/forgot-password`, { email });
  }

  getOAuth2Status(): Observable<{ enabled: boolean; providers: string[] }> {
    return this.http.get<{ enabled: boolean; providers: string[] }>(`${this.base}/auth/oauth2/status`);
  }

  exchangeSsoCode(code: string, options?: { withCredentials?: boolean }): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(
      `${this.base}/auth/sso/exchange`,
      { code },
      { withCredentials: options?.withCredentials ?? true },
    );
  }

  resetPassword(body: ResetPasswordPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/auth/reset-password`, body);
  }

  acceptInvite(body: AcceptInvitePayload): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.base}/auth/accept-invite`, body);
  }

  getBillingPlan(): Observable<BillingPlan> {
    return this.http.get<BillingPlan>(`${this.base}/billing/plan`);
  }

  setBillingPlan(plan: BillingPlanTier): Observable<BillingPlan> {
    return this.http.post<BillingPlan>(`${this.base}/billing/plan`, { plan });
  }

  createBillingCheckout(plan: BillingPlanTier): Observable<BillingCheckoutResponse> {
    return this.http.post<BillingCheckoutResponse>(`${this.base}/billing/checkouts`, { plan });
  }

  getBillingCheckout(reference: string): Observable<BillingCheckoutStatus> {
    return this.http.get<BillingCheckoutStatus>(`${this.base}/billing/checkouts/${reference}`);
  }

  stubCompleteBilling(checkoutReference: string): Observable<BillingCheckoutResponse> {
    return this.http.post<BillingCheckoutResponse>(`${this.base}/billing/stub-complete`, { checkoutReference });
  }

  verifyMfa(body: { mfaToken: string; code: string; recoveryCode?: string }): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.base}/auth/mfa/verify`, body);
  }

  exportPrivacy(): Observable<PrivacyExport> {
    return this.http.get<PrivacyExport>(`${this.base}/privacy/export`);
  }

  eraseMe(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/privacy/erase-me`, {});
  }

  submitFeedback(body: SubmitFeedbackPayload): Observable<{ id: string; category: string; message: string }> {
    return this.http.post<{ id: string; category: string; message: string }>(`${this.base}/feedback`, body);
  }

  listWebhooks(): Observable<WebhookEndpoint[]> {
    return this.http.get<WebhookEndpoint[]>(`${this.base}/webhooks`);
  }

  createWebhook(body: CreateWebhookPayload): Observable<WebhookEndpoint> {
    const payload = {
      url: body.url,
      secret: body.secret ?? crypto.randomUUID(),
      events: Array.isArray(body.events) ? body.events.join(',') : body.events,
    };
    return this.http.post<WebhookEndpoint>(`${this.base}/webhooks`, payload);
  }

  deleteWebhook(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/webhooks/${id}`);
  }

  setLocale(locale: 'fr' | 'en'): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.base}/auth/me/locale`, { locale });
  }

  enableMfa(): Observable<MfaEnrollment> {
    return this.http.post<MfaEnrollment>(`${this.base}/auth/mfa/enable`, {});
  }

  confirmMfa(code: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/auth/mfa/confirm`, { code });
  }

  disableMfa(password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/auth/mfa/disable`, { password });
  }

  getPlatformOrganizations(): Observable<
    Array<{
      id: string;
      name: string;
      slug: string;
      billingPlan: string;
      status: string;
      activeSeats: number;
      storageBytes: number;
    }>
  > {
    return this.http.get<
      Array<{
        id: string;
        name: string;
        slug: string;
        billingPlan: string;
        status: string;
        activeSeats: number;
        storageBytes: number;
      }>
    >(`${this.base}/platform/organizations`);
  }

  getPlatformHealthSummary(): Observable<{ organizationCount: number; suspendedCount: number }> {
    return this.http.get<{ organizationCount: number; suspendedCount: number }>(
      `${this.base}/platform/health-summary`,
    );
  }

  suspendPlatformOrg(id: string): Observable<unknown> {
    return this.http.post(`${this.base}/platform/organizations/${id}/suspend`, {});
  }

  unsuspendPlatformOrg(id: string): Observable<unknown> {
    return this.http.post(`${this.base}/platform/organizations/${id}/unsuspend`, {});
  }

  downloadInvoicePdf(id: string): Observable<Blob> {
    return this.http.get(`${this.base}/accounting/invoices/${id}/pdf`, { responseType: 'blob' });
  }

  convertQuoteToInvoice(quoteId: string): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.base}/accounting/quotes/${quoteId}/convert-to-invoice`, {});
  }

  // ——— PIM ———
  getPimProducts(): Observable<PimProduct[]> {
    return this.http.get<PimProduct[]>(`${this.base}/pim/products`);
  }

  createPimProduct(body: Partial<PimProduct>): Observable<PimProduct> {
    return this.http.post<PimProduct>(`${this.base}/pim/products`, body);
  }

  updatePimProduct(id: string, body: Partial<PimProduct>): Observable<PimProduct> {
    return this.http.put<PimProduct>(`${this.base}/pim/products/${id}`, body);
  }

  deletePimProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/pim/products/${id}`);
  }

  getPimVariants(productId: string): Observable<PimVariant[]> {
    return this.http.get<PimVariant[]>(`${this.base}/pim/products/${productId}/variants`);
  }

  createPimVariant(productId: string, body: Partial<PimVariant>): Observable<PimVariant> {
    return this.http.post<PimVariant>(`${this.base}/pim/products/${productId}/variants`, body);
  }

  // ——— ERP modules (CMS/SCM/MRP/ETL/EDI) ———
  listErpItems(module: string): Observable<ErpItem[]> {
    return this.http.get<ErpItem[]>(`${this.base}/erp/${module.toLowerCase()}/items`);
  }

  createErpItem(module: string, body: Partial<ErpItem>): Observable<ErpItem> {
    return this.http.post<ErpItem>(`${this.base}/erp/${module.toLowerCase()}/items`, body);
  }

  updateErpItem(module: string, id: string, body: Partial<ErpItem>): Observable<ErpItem> {
    return this.http.put<ErpItem>(`${this.base}/erp/${module.toLowerCase()}/items/${id}`, body);
  }

  deleteErpItem(module: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/erp/${module.toLowerCase()}/items/${id}`);
  }

  // ——— Chat ———
  getChatThreads(): Observable<ChatThread[]> {
    return this.http.get<ChatThread[]>(`${this.base}/chat/threads`);
  }

  createChatThread(body?: { title?: string; agentId?: string }): Observable<ChatThread> {
    return this.http.post<ChatThread>(`${this.base}/chat/threads`, body ?? {});
  }

  getChatMessages(threadId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.base}/chat/threads/${threadId}/messages`);
  }

  postChatMessage(threadId: string, content: string): Observable<ChatPostMessageResponse> {
    return this.http.post<ChatPostMessageResponse>(`${this.base}/chat/threads/${threadId}/messages`, {
      content,
    });
  }

  // ——— Agent runtime ———
  startAgentRuntime(body?: {
    agentId?: string;
    graphName?: string;
  }): Observable<AgentRuntimeRun> {
    return this.http.post<AgentRuntimeRun>(`${this.base}/agents/runtime/start`, body ?? {});
  }

  listAgentRuntimeRuns(): Observable<AgentRuntimeRun[]> {
    return this.http.get<AgentRuntimeRun[]>(`${this.base}/agents/runtime`);
  }

  getAgentRuntimeRun(id: string): Observable<AgentRuntimeRun> {
    return this.http.get<AgentRuntimeRun>(`${this.base}/agents/runtime/${id}`);
  }

  resumeAgentRuntime(id: string, decision = 'APPROVED'): Observable<AgentRuntimeRun> {
    return this.http.post<AgentRuntimeRun>(`${this.base}/agents/runtime/${id}/resume`, { decision });
  }

  getAgentRuntimeSteps(id: string): Observable<AgentRuntimeStep[]> {
    return this.http.get<AgentRuntimeStep[]>(`${this.base}/agents/runtime/${id}/steps`);
  }

  // ——— Memory ———
  getMemories(scope?: string): Observable<AgentMemory[]> {
    let params = new HttpParams();
    if (scope) params = params.set('scope', scope);
    return this.http.get<AgentMemory[]>(`${this.base}/memory`, { params });
  }

  putMemory(body: Partial<AgentMemory>): Observable<AgentMemory> {
    return this.http.post<AgentMemory>(`${this.base}/memory`, body);
  }

  deleteMemory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/memory/${id}`);
  }

  // ——— Governance ———
  getGovernancePermissionsMe(): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.base}/governance/permissions/me`);
  }

  getGuardrailEvents(): Observable<GuardrailEvent[]> {
    return this.http.get<GuardrailEvent[]>(`${this.base}/governance/guardrails`);
  }

  getSandboxLogs(): Observable<ToolSandboxLog[]> {
    return this.http.get<ToolSandboxLog[]>(`${this.base}/governance/sandbox`);
  }

  getEvalDashboard(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.base}/governance/eval`);
  }

  scanGuardrail(text: string): Observable<{ blocked: boolean; reason: string; eventId: string }> {
    return this.http.post<{ blocked: boolean; reason: string; eventId: string }>(
      `${this.base}/governance/guardrails/scan`,
      { text },
    );
  }

  // ——— Studio / Marketplace ———
  getStudioDefinitions(): Observable<AgentDefinition[]> {
    return this.http.get<AgentDefinition[]>(`${this.base}/studio/definitions`);
  }

  createStudioDefinition(body: Partial<AgentDefinition>): Observable<AgentDefinition> {
    return this.http.post<AgentDefinition>(`${this.base}/studio/definitions`, body);
  }

  updateStudioDefinition(id: string, body: Partial<AgentDefinition>): Observable<AgentDefinition> {
    return this.http.put<AgentDefinition>(`${this.base}/studio/definitions/${id}`, body);
  }

  getStudioDefinition(id: string): Observable<AgentDefinition> {
    return this.http.get<AgentDefinition>(`${this.base}/studio/definitions/${id}`);
  }

  getMarketplaceListings(visibility?: string): Observable<MarketplaceListing[]> {
    let params = new HttpParams();
    if (visibility) params = params.set('visibility', visibility);
    return this.http.get<MarketplaceListing[]>(`${this.base}/marketplace/listings`, { params });
  }

  publishMarketplaceListing(body: {
    definitionId: string;
    title?: string;
    summary?: string;
    visibility?: string;
  }): Observable<MarketplaceListing> {
    return this.http.post<MarketplaceListing>(`${this.base}/marketplace/listings`, body);
  }

  getMarketplaceInstalls(): Observable<MarketplaceInstall[]> {
    return this.http.get<MarketplaceInstall[]>(`${this.base}/marketplace/installs`);
  }

  installMarketplaceListing(
    listingId: string,
    configJson?: string,
  ): Observable<MarketplaceInstall> {
    return this.http.post<MarketplaceInstall>(`${this.base}/marketplace/installs`, {
      listingId,
      configJson,
    });
  }

  // ——— BI ———
  getBiReport(): Observable<BiReport> {
    return this.http.get<BiReport>(`${this.base}/bi/report`);
  }
}
