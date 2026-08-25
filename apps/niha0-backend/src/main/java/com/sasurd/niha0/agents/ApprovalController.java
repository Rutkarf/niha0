package com.sasurd.niha0.agents;

import com.sasurd.niha0.agents.dto.ApprovalDecisionRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/approvals")
public class ApprovalController {

    private final AgentService agentService;

    public ApprovalController(AgentService agentService) {
        this.agentService = agentService;
    }

    @GetMapping
    public List<AgentApproval> list() {
        return agentService.listApprovals();
    }

    @GetMapping("/pending")
    public List<AgentAction> pending() {
        return agentService.listPendingActions();
    }

    @PostMapping("/{actionId}/approve")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public AgentApproval approve(@PathVariable UUID actionId,
                                 @Valid @RequestBody ApprovalDecisionRequest request) {
        return agentService.approve(actionId, request);
    }

    @PostMapping("/{actionId}/reject")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public AgentApproval reject(@PathVariable UUID actionId,
                                @Valid @RequestBody ApprovalDecisionRequest request) {
        return agentService.reject(actionId, request);
    }

    @PostMapping("/{actionId}/defer")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public AgentApproval defer(@PathVariable UUID actionId,
                               @Valid @RequestBody ApprovalDecisionRequest request) {
        return agentService.defer(actionId, request);
    }

    @PostMapping("/{actionId}/modify")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER')")
    public AgentApproval modify(@PathVariable UUID actionId,
                                @Valid @RequestBody ApprovalDecisionRequest request) {
        return agentService.modify(actionId, request);
    }
}
