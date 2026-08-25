package com.sasurd.niha0.agents;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sasurd.niha0.agents.dto.AgentRecommendation;
import com.sasurd.niha0.agents.dto.ApprovalDecisionRequest;
import com.sasurd.niha0.audit.AuditService;
import com.sasurd.niha0.billing.EntitlementService;
import com.sasurd.niha0.common.AgentStatus;
import com.sasurd.niha0.common.ApiException;
import com.sasurd.niha0.common.WorkflowStatus;
import com.sasurd.niha0.rag.RagService;
import com.sasurd.niha0.realtime.RealtimeEventBroadcaster;
import com.sasurd.niha0.security.SecurityUtils;
import com.sasurd.niha0.webhooks.WebhookDeliveryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AgentService {

    private final AgentRepository agentRepository;
    private final AgentActionRepository actionRepository;
    private final AgentApprovalRepository approvalRepository;
    private final AgentRecommendationProvider recommendationProvider;
    private final ApprovedActionExecutor actionExecutor;
    private final RagService ragService;
    private final RealtimeEventBroadcaster broadcaster;
    private final WebhookDeliveryService webhookDeliveryService;
    private final AuditService auditService;
    private final EntitlementService entitlementService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AgentService(AgentRepository agentRepository,
                        AgentActionRepository actionRepository,
                        AgentApprovalRepository approvalRepository,
                        AgentRecommendationProvider recommendationProvider,
                        ApprovedActionExecutor actionExecutor,
                        RagService ragService,
                        RealtimeEventBroadcaster broadcaster,
                        WebhookDeliveryService webhookDeliveryService,
                        AuditService auditService,
                        EntitlementService entitlementService) {
        this.agentRepository = agentRepository;
        this.actionRepository = actionRepository;
        this.approvalRepository = approvalRepository;
        this.recommendationProvider = recommendationProvider;
        this.actionExecutor = actionExecutor;
        this.ragService = ragService;
        this.broadcaster = broadcaster;
        this.webhookDeliveryService = webhookDeliveryService;
        this.auditService = auditService;
        this.entitlementService = entitlementService;
    }

    @Transactional(readOnly = true)
    public List<Agent> listAgents() {
        return agentRepository.findByOrganizationIdOrderByNameAsc(orgId());
    }

    @Transactional(readOnly = true)
    public Agent getAgent(UUID id) {
        return agentRepository.findByIdAndOrganizationId(id, orgId())
                .orElseThrow(() -> new ApiException(404, "Agent not found"));
    }

    @Transactional(readOnly = true)
    public List<AgentAction> listActions() {
        return actionRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId());
    }

    @Transactional
    public AgentAction requestRecommendation(UUID agentId) {
        entitlementService.assertAiActionAvailable(orgId());
        Agent agent = getAgent(agentId);
        AgentRecommendation rec = recommendationProvider.recommend(agent.getCode());
        String ragContext = ragService.contextForAgent(agent.getCode(), 1000);
        String description = rec.description();
        if (ragContext != null && !ragContext.isBlank()) {
            String excerpt = ragContext.length() > 400 ? ragContext.substring(0, 400) + "…" : ragContext;
            description = description + "\n\n[Contexte documents indexés]\n" + excerpt;
            if (ragService.hasDemoEmbeddings()) {
                description = description + "\n\n(Note : embeddings démo hash — similarité approximative, pas un modèle sémantique réel.)";
            }
        }

        AgentAction action = new AgentAction();
        action.setOrganizationId(orgId());
        action.setAgentId(agent.getId());
        action.setRequestedBy(SecurityUtils.currentUserId());
        action.setActionType(rec.actionType());
        action.setTitle(rec.title());
        action.setDescription(description);
        action.setDraftPayload(rec.draftPayload());
        action.setWorkflowStatus(WorkflowStatus.REQUEST_APPROVAL);
        action.setAgentStatus(AgentStatus.WAITING_APPROVAL);

        agent.setStatus(AgentStatus.WAITING_APPROVAL);
        agentRepository.save(agent);

        AgentAction saved = actionRepository.save(action);
        auditService.log("AGENT_ACTION_REQUESTED", "AgentAction", saved.getId(), saved.getTitle());
        broadcaster.broadcast("agent-action", Map.of(
                "organizationId", orgId().toString(),
                "actionId", saved.getId().toString(),
                "agentId", agent.getId().toString(),
                "status", saved.getWorkflowStatus().name()));
        return saved;
    }

    @Transactional
    public AgentApproval approve(UUID actionId, ApprovalDecisionRequest request) {
        return decide(actionId, "APPROVED", WorkflowStatus.APPROVED, AgentStatus.EXECUTING, request.comment());
    }

    @Transactional
    public AgentApproval reject(UUID actionId, ApprovalDecisionRequest request) {
        return decide(actionId, "REJECTED", WorkflowStatus.REJECTED, AgentStatus.AVAILABLE, request.comment());
    }

    @Transactional
    public AgentApproval defer(UUID actionId, ApprovalDecisionRequest request) {
        return decide(actionId, "DEFERRED", WorkflowStatus.DEFERRED, AgentStatus.AVAILABLE, request.comment());
    }

    @Transactional
    public AgentApproval modify(UUID actionId, ApprovalDecisionRequest request) {
        return decide(actionId, "MODIFIED", WorkflowStatus.MODIFIED, AgentStatus.PREPARING, request.comment());
    }

    @Transactional(readOnly = true)
    public String bubbleFor(UUID agentId) {
        Agent agent = getAgent(agentId);
        return recommendationProvider.taskBubble(agent.getCode(), agent.getStatus().name());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> engineInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("demo", recommendationProvider.isDemoEngine());
        info.put("label", recommendationProvider.engineLabel());
        if (recommendationProvider.lastRecommendUsedFallback()) {
            info.put("fallback", true);
        }
        return info;
    }

    private AgentApproval decide(UUID actionId, String decision, WorkflowStatus workflowStatus,
                                 AgentStatus agentStatus, String comment) {
        AgentAction action = actionRepository.findByIdAndOrganizationId(actionId, orgId())
                .orElseThrow(() -> new ApiException(404, "Action not found"));

        if (action.getWorkflowStatus() != WorkflowStatus.REQUEST_APPROVAL) {
            throw new ApiException(409, "Action is not pending approval");
        }

        action.setWorkflowStatus(workflowStatus);
        action.setAgentStatus(agentStatus);
        actionRepository.save(action);

        Agent agent = getAgent(action.getAgentId());
        agent.setStatus(agentStatus);
        agentRepository.save(agent);

        AgentApproval approval = new AgentApproval();
        approval.setOrganizationId(orgId());
        approval.setActionId(action.getId());
        approval.setDecidedBy(SecurityUtils.currentUserId());
        approval.setDecision(decision);
        approval.setComment(comment);
        approval.setDecidedAt(Instant.now());
        AgentApproval saved = approvalRepository.save(approval);

        // After APPROVED: execute real domain side-effects, then mark COMPLETED
        if (workflowStatus == WorkflowStatus.APPROVED) {
            ActionExecutionResult execution = actionExecutor.execute(action);
            try {
                action.setExecutionResult(objectMapper.writeValueAsString(Map.of(
                        "applied", execution.applied(),
                        "summary", execution.summary(),
                        "details", execution.details())));
            } catch (Exception e) {
                action.setExecutionResult(execution.summary());
            }
            action.setExecutedAt(Instant.now());
            action.setWorkflowStatus(WorkflowStatus.COMPLETED);
            action.setAgentStatus(AgentStatus.AVAILABLE);
            actionRepository.save(action);
            agent.setStatus(AgentStatus.AVAILABLE);
            agentRepository.save(agent);
            auditService.log("AGENT_ACTION_EXECUTED", "AgentAction", action.getId(), execution.summary());
        }

        auditService.log("AGENT_ACTION_" + decision, "AgentAction", action.getId(), comment);
        Map<String, Object> event = new HashMap<>();
        event.put("organizationId", orgId().toString());
        event.put("actionId", action.getId().toString());
        event.put("decision", decision);
        event.put("approvalId", saved.getId().toString());
        event.put("agentId", agent.getId().toString());
        event.put("agentStatus", agent.getStatus().name());
        if (action.getExecutionResult() != null) {
            event.put("executionResult", action.getExecutionResult());
        }
        broadcaster.broadcast("approval-decision", event);

        Map<String, Object> webhookPayload = new HashMap<>(event);
        webhookPayload.put("event", "approval.decided");
        webhookDeliveryService.enqueue(orgId(), "approval.decided", webhookPayload);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<AgentApproval> listApprovals() {
        return approvalRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId());
    }

    @Transactional(readOnly = true)
    public List<AgentAction> listPendingActions() {
        return actionRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId()).stream()
                .filter(a -> a.getWorkflowStatus() == WorkflowStatus.REQUEST_APPROVAL)
                .toList();
    }

    private UUID orgId() {
        return SecurityUtils.requireOrganizationId();
    }
}
