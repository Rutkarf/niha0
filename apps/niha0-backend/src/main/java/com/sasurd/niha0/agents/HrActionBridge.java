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
 * Bridge for LEAVE_REQUEST execution. Upgraded by HR module to persist LeaveRequest entities.
 */
@Component
public class HrActionBridge {

    private final TaskRepository taskRepository;

    public HrActionBridge(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public ActionExecutionResult applyLeaveRequest(UUID orgId, AgentAction action, JsonNode payload) {
        String employee = payload != null && payload.has("employee") ? payload.get("employee").asText("") : "";
        Task task = new Task();
        task.setOrganizationId(orgId);
        task.setTitle("Congé validé" + (employee.isBlank() ? "" : " — " + employee));
        task.setDescription(action.getDescription());
        task.setStatus("TODO");
        task.setPriority("MEDIUM");
        task.setDueDate(LocalDate.now().plusDays(7));
        task.setRelatedType("Leave");
        task.setAssigneeId(SecurityUtils.currentUserId());
        taskRepository.save(task);
        return ActionExecutionResult.ok("Demande de congé → tâche RH créée", Map.of(
                "taskId", task.getId().toString(),
                "employee", employee));
    }
}
