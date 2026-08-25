package com.sasurd.niha0.agents;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sasurd.niha0.accounting.Invoice;
import com.sasurd.niha0.accounting.InvoiceRepository;
import com.sasurd.niha0.crm.Opportunity;
import com.sasurd.niha0.crm.OpportunityRepository;
import com.sasurd.niha0.crm.Task;
import com.sasurd.niha0.crm.TaskRepository;
import com.sasurd.niha0.customerrelations.Ticket;
import com.sasurd.niha0.customerrelations.TicketRepository;
import com.sasurd.niha0.legal.Contract;
import com.sasurd.niha0.legal.ContractRepository;
import com.sasurd.niha0.marketing.MarketingPost;
import com.sasurd.niha0.marketing.MarketingPostRepository;
import com.sasurd.niha0.security.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Applies approved agent actions to real domain entities (post-CEO effects).
 */
@Service
public class ApprovedActionExecutor {

    private static final Logger log = LoggerFactory.getLogger(ApprovedActionExecutor.class);
    private static final ObjectMapper JSON = new ObjectMapper();

    private final OpportunityRepository opportunityRepository;
    private final InvoiceRepository invoiceRepository;
    private final TicketRepository ticketRepository;
    private final TaskRepository taskRepository;
    private final ContractRepository contractRepository;
    private final MarketingPostRepository marketingPostRepository;
    private final StockActionBridge stockActionBridge;
    private final HrActionBridge hrActionBridge;

    public ApprovedActionExecutor(OpportunityRepository opportunityRepository,
                                  InvoiceRepository invoiceRepository,
                                  TicketRepository ticketRepository,
                                  TaskRepository taskRepository,
                                  ContractRepository contractRepository,
                                  MarketingPostRepository marketingPostRepository,
                                  StockActionBridge stockActionBridge,
                                  HrActionBridge hrActionBridge) {
        this.opportunityRepository = opportunityRepository;
        this.invoiceRepository = invoiceRepository;
        this.ticketRepository = ticketRepository;
        this.taskRepository = taskRepository;
        this.contractRepository = contractRepository;
        this.marketingPostRepository = marketingPostRepository;
        this.stockActionBridge = stockActionBridge;
        this.hrActionBridge = hrActionBridge;
    }

    @Transactional
    public ActionExecutionResult execute(AgentAction action) {
        String type = action.getActionType() == null ? "" : action.getActionType().toUpperCase(Locale.ROOT);
        JsonNode payload = parsePayload(action.getDraftPayload());
        UUID orgId = action.getOrganizationId() != null ? action.getOrganizationId() : SecurityUtils.requireOrganizationId();

        try {
            return switch (type) {
                case "FOLLOW_UP_OPPORTUNITY" -> followUpOpportunity(orgId, action, payload);
                case "SEND_PAYMENT_REMINDER" -> paymentReminder(orgId, action, payload);
                case "RESPOND_TICKET" -> respondTicket(orgId, action, payload);
                case "UPDATE_TIMELINE" -> updateTimeline(orgId, action, payload);
                case "PUBLISH_POST" -> publishPost(orgId, action, payload);
                case "CONTRACT_REMINDER" -> contractReminder(orgId, action, payload);
                case "STOCK_ALERT" -> stockActionBridge.applyStockAlert(orgId, action, payload);
                case "LEAVE_REQUEST" -> hrActionBridge.applyLeaveRequest(orgId, action, payload);
                case "WEEKLY_PRIORITIES", "WEEKLY_BRIEF", "ANOMALY_ALERT", "OPS_WORKFLOW", "GENERIC_ACTION" ->
                        createFollowUpTask(orgId, action, type);
                default -> createFollowUpTask(orgId, action, type.isBlank() ? "UNKNOWN" : type);
            };
        } catch (Exception e) {
            log.warn("Action execution failed for {}: {}", action.getId(), e.getMessage());
            return ActionExecutionResult.skipped("Execution failed: " + e.getMessage());
        }
    }

    private ActionExecutionResult followUpOpportunity(UUID orgId, AgentAction action, JsonNode payload) {
        String ref = text(payload, "opportunityRef");
        List<Opportunity> opps = opportunityRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId);
        Opportunity target = opps.stream()
                .filter(o -> ref != null && (
                        (o.getTitle() != null && o.getTitle().toUpperCase(Locale.ROOT).contains(ref.toUpperCase(Locale.ROOT)))
                                || ref.equalsIgnoreCase(String.valueOf(o.getId()))))
                .findFirst()
                .orElseGet(() -> opps.stream()
                        .filter(o -> !"WON".equalsIgnoreCase(o.getStage()) && !"LOST".equalsIgnoreCase(o.getStage()))
                        .findFirst()
                        .orElse(null));

        if (target == null) {
            Task task = createTask(orgId, "Relance commerciale", action.getDescription(), "Opportunity", null);
            return ActionExecutionResult.ok("Tâche de relance créée (aucune opportunité ouverte)", Map.of(
                    "taskId", task.getId().toString()));
        }

        String previous = target.getStage();
        if ("QUALIFICATION".equalsIgnoreCase(previous)) {
            target.setStage("PROPOSAL");
        } else if ("PROPOSAL".equalsIgnoreCase(previous)) {
            target.setStage("NEGOTIATION");
        } else {
            target.setProbability(Math.min(100, target.getProbability() + 10));
        }
        opportunityRepository.save(target);
        Task task = createTask(orgId, "Relancer : " + target.getTitle(), action.getDescription(),
                "Opportunity", target.getId());
        Map<String, Object> details = new HashMap<>();
        details.put("opportunityId", target.getId().toString());
        details.put("previousStage", previous);
        details.put("stage", target.getStage());
        details.put("taskId", task.getId().toString());
        return ActionExecutionResult.ok("Opportunité mise à jour + tâche de suivi", details);
    }

    private ActionExecutionResult paymentReminder(UUID orgId, AgentAction action, JsonNode payload) {
        String ref = text(payload, "invoiceRef");
        Invoice invoice = null;
        if (ref != null) {
            invoice = invoiceRepository.findByOrganizationIdAndReferenceIgnoreCase(orgId, ref).orElse(null);
        }
        if (invoice == null) {
            invoice = invoiceRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId).stream()
                    .filter(i -> !"PAID".equalsIgnoreCase(i.getStatus()) && !"CANCELLED".equalsIgnoreCase(i.getStatus()))
                    .findFirst()
                    .orElse(null);
        }
        if (invoice == null) {
            return ActionExecutionResult.skipped("Aucune facture à relancer");
        }
        String previous = invoice.getStatus();
        if (!"PAID".equalsIgnoreCase(previous)) {
            invoice.setStatus("REMINDED");
            invoiceRepository.save(invoice);
        }
        Task task = createTask(orgId, "Relance paiement " + invoice.getReference(),
                action.getDescription(), "Invoice", invoice.getId());
        return ActionExecutionResult.ok("Facture marquée REMINDED + tâche créée", Map.of(
                "invoiceId", invoice.getId().toString(),
                "reference", invoice.getReference(),
                "previousStatus", previous,
                "status", invoice.getStatus(),
                "taskId", task.getId().toString()));
    }

    private ActionExecutionResult respondTicket(UUID orgId, AgentAction action, JsonNode payload) {
        String ref = text(payload, "ticketRef");
        List<Ticket> tickets = ticketRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId);
        Ticket ticket = tickets.stream()
                .filter(t -> ref != null && (
                        (t.getSubject() != null && t.getSubject().toUpperCase(Locale.ROOT).contains(ref.toUpperCase(Locale.ROOT)))
                                || ref.equalsIgnoreCase(String.valueOf(t.getId()))))
                .findFirst()
                .orElseGet(() -> tickets.stream()
                        .filter(t -> "OPEN".equalsIgnoreCase(t.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(t.getStatus()))
                        .findFirst()
                        .orElse(null));
        if (ticket == null) {
            return ActionExecutionResult.skipped("Aucun ticket ouvert");
        }
        String previous = ticket.getStatus();
        ticket.setStatus("IN_PROGRESS");
        String note = "\n\n[Réponse agent IA validée CEO] " + (action.getDescription() == null ? "" : action.getDescription());
        ticket.setDescription((ticket.getDescription() == null ? "" : ticket.getDescription()) + note);
        ticketRepository.save(ticket);
        return ActionExecutionResult.ok("Ticket mis à jour (réponse enregistrée)", Map.of(
                "ticketId", ticket.getId().toString(),
                "previousStatus", previous,
                "status", ticket.getStatus()));
    }

    private ActionExecutionResult updateTimeline(UUID orgId, AgentAction action, JsonNode payload) {
        String customer = text(payload, "customer");
        Task task = createTask(orgId,
                "Timeline client" + (customer != null ? " — " + customer : ""),
                action.getDescription(),
                "Customer",
                null);
        return ActionExecutionResult.ok("Tâche CRM créée pour mise à jour timeline", Map.of(
                "taskId", task.getId().toString(),
                "customer", customer == null ? "" : customer));
    }

    private ActionExecutionResult publishPost(UUID orgId, AgentAction action, JsonNode payload) {
        String channel = text(payload, "channel");
        if (channel == null) channel = "LINKEDIN";
        MarketingPost post = new MarketingPost();
        post.setOrganizationId(orgId);
        post.setTitle(action.getTitle());
        post.setChannel(channel);
        post.setStatus("SCHEDULED");
        post.setContent(action.getDescription());
        post.setScheduledAt(Instant.now().plusSeconds(3600));
        marketingPostRepository.save(post);
        return ActionExecutionResult.ok("Publication marketing planifiée", Map.of(
                "postId", post.getId().toString(),
                "channel", channel,
                "status", post.getStatus()));
    }

    private ActionExecutionResult contractReminder(UUID orgId, AgentAction action, JsonNode payload) {
        String contractId = text(payload, "contractId");
        List<Contract> contracts = contractRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId);
        Contract contract = contracts.stream()
                .filter(c -> contractId != null && (
                        contractId.equalsIgnoreCase(String.valueOf(c.getId()))
                                || (c.getTitle() != null && c.getTitle().toUpperCase(Locale.ROOT).contains(contractId.toUpperCase(Locale.ROOT)))))
                .findFirst()
                .orElseGet(() -> contracts.stream().findFirst().orElse(null));
        if (contract == null) {
            Task task = createTask(orgId, "Échéance contrat", action.getDescription(), "Contract", null);
            return ActionExecutionResult.ok("Tâche juridique créée (aucun contrat)", Map.of("taskId", task.getId().toString()));
        }
        contract.setStatus("REVIEW_DUE");
        contractRepository.save(contract);
        Task task = createTask(orgId, "Réviser contrat : " + contract.getTitle(),
                action.getDescription(), "Contract", contract.getId());
        return ActionExecutionResult.ok("Contrat marqué REVIEW_DUE", Map.of(
                "contractId", contract.getId().toString(),
                "taskId", task.getId().toString(),
                "status", contract.getStatus()));
    }

    private ActionExecutionResult createFollowUpTask(UUID orgId, AgentAction action, String type) {
        Task task = createTask(orgId, action.getTitle(), action.getDescription(), "AgentAction", action.getId());
        return ActionExecutionResult.ok("Tâche de suivi créée (" + type + ")", Map.of(
                "taskId", task.getId().toString(),
                "actionType", type));
    }

    private Task createTask(UUID orgId, String title, String description, String relatedType, UUID relatedId) {
        Task task = new Task();
        task.setOrganizationId(orgId);
        task.setTitle(title == null ? "Action approuvée" : title);
        task.setDescription(description);
        task.setStatus("TODO");
        task.setPriority("HIGH");
        task.setDueDate(LocalDate.now().plusDays(3));
        task.setRelatedType(relatedType);
        task.setRelatedId(relatedId);
        task.setAssigneeId(SecurityUtils.currentUserId());
        return taskRepository.save(task);
    }

    private JsonNode parsePayload(String raw) {
        if (raw == null || raw.isBlank()) {
            return JSON.createObjectNode();
        }
        try {
            return JSON.readTree(raw);
        } catch (Exception e) {
            return JSON.createObjectNode();
        }
    }

    private static String text(JsonNode node, String field) {
        if (node == null || !node.has(field) || node.get(field).isNull()) return null;
        String v = node.get(field).asText("");
        return v.isBlank() ? null : v;
    }
}
