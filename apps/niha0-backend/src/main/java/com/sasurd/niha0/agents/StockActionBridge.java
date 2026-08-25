package com.sasurd.niha0.agents;

import com.fasterxml.jackson.databind.JsonNode;
import com.sasurd.niha0.crm.Task;
import com.sasurd.niha0.crm.TaskRepository;
import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

/**
 * Bridge for STOCK_ALERT execution. Replaced with real inventory writes when stock module is present.
 * Default implementation creates a high-priority replenishment task.
 */
@Component
public class StockActionBridge {

    private final TaskRepository taskRepository;

    public StockActionBridge(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public ActionExecutionResult applyStockAlert(UUID orgId, AgentAction action, JsonNode payload) {
        String sku = payload != null && payload.has("sku") ? payload.get("sku").asText("") : "";
        int qty = payload != null && payload.has("qty") ? payload.get("qty").asInt(0) : 0;
        Task task = new Task();
        task.setOrganizationId(orgId);
        task.setTitle("Réappro stock" + (sku.isBlank() ? "" : " " + sku));
        task.setDescription(action.getDescription() + (qty > 0 ? " (qty=" + qty + ")" : ""));
        task.setStatus("TODO");
        task.setPriority("HIGH");
        task.setDueDate(LocalDate.now().plusDays(2));
        task.setRelatedType("Stock");
        task.setAssigneeId(SecurityUtils.currentUserId());
        taskRepository.save(task);
        return ActionExecutionResult.ok("Alerte stock → tâche réappro créée", Map.of(
                "taskId", task.getId().toString(),
                "sku", sku,
                "qty", qty));
    }
}
