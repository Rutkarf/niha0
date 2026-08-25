package com.sasurd.niha0.agents;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/agents")
@PreAuthorize("isAuthenticated()")
public class AgentController {

    private final AgentService agentService;

    public AgentController(AgentService agentService) {
        this.agentService = agentService;
    }

    @GetMapping
    public List<Agent> list() {
        return agentService.listAgents();
    }

    @GetMapping("/engine")
    public Map<String, Object> engine() {
        return agentService.engineInfo();
    }

    @GetMapping("/actions")
    public List<AgentAction> listActions() {
        return agentService.listActions();
    }

    @GetMapping("/{id}")
    public Agent get(@PathVariable UUID id) {
        return agentService.getAgent(id);
    }

    @GetMapping("/{id}/bubble")
    public Map<String, String> bubble(@PathVariable UUID id) {
        return Map.of("text", agentService.bubbleFor(id));
    }

    @PostMapping("/{id}/recommend")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','MEMBER')")
    public AgentAction recommend(@PathVariable UUID id) {
        return agentService.requestRecommendation(id);
    }
}
