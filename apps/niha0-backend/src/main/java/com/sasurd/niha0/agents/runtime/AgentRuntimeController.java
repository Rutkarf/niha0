package com.sasurd.niha0.agents.runtime;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/agents/runtime")
@PreAuthorize("isAuthenticated()")
public class AgentRuntimeController {

    private final AgentRuntimeService agentRuntimeService;

    public AgentRuntimeController(AgentRuntimeService agentRuntimeService) {
        this.agentRuntimeService = agentRuntimeService;
    }

    @PostMapping("/start")
    @PreAuthorize("hasAuthority('agents.write')")
    public AgentRuntimeRun start(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> payload = body == null ? Map.of() : body;
        UUID agentId = null;
        if (payload.get("agentId") != null && !payload.get("agentId").toString().isBlank()) {
            agentId = UUID.fromString(payload.get("agentId").toString());
        }
        String graphName = payload.get("graphName") != null
                ? payload.get("graphName").toString()
                : "default";
        return agentRuntimeService.startRun(agentId, graphName);
    }

    @PostMapping("/{id}/resume")
    @PreAuthorize("hasAuthority('agents.write')")
    public AgentRuntimeRun resume(@PathVariable UUID id, @RequestBody(required = false) Map<String, String> body) {
        String decision = body == null ? "APPROVED" : body.getOrDefault("decision", "APPROVED");
        return agentRuntimeService.resumeRun(id, decision);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('agents.read')")
    public List<AgentRuntimeRun> list() {
        return agentRuntimeService.listRuns();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('agents.read')")
    public AgentRuntimeRun get(@PathVariable UUID id) {
        return agentRuntimeService.getRun(id);
    }

    @GetMapping("/{id}/steps")
    @PreAuthorize("hasAuthority('agents.read')")
    public List<AgentRuntimeStep> steps(@PathVariable UUID id) {
        return agentRuntimeService.listSteps(id);
    }
}
