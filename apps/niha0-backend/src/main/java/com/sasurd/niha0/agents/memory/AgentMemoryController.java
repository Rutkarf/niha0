package com.sasurd.niha0.agents.memory;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/memory")
@PreAuthorize("isAuthenticated()")
public class AgentMemoryController {

    private final AgentMemoryService agentMemoryService;

    public AgentMemoryController(AgentMemoryService agentMemoryService) {
        this.agentMemoryService = agentMemoryService;
    }

    @GetMapping
    public List<AgentMemory> list(@RequestParam(required = false) String scope) {
        return agentMemoryService.list(scope);
    }

    @PostMapping
    public AgentMemory put(@RequestBody AgentMemory memory) {
        return agentMemoryService.put(memory);
    }

    @GetMapping("/{id}")
    public AgentMemory get(@PathVariable UUID id) {
        return agentMemoryService.get(id);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        agentMemoryService.delete(id);
    }

    @DeleteMapping("/scope/{scope}")
    public Map<String, Object> eraseByScope(@PathVariable String scope) {
        long erased = agentMemoryService.eraseByScope(scope);
        return Map.of("scope", scope.toUpperCase(), "erased", erased);
    }
}
