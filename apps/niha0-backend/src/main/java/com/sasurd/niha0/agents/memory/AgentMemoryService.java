package com.sasurd.niha0.agents.memory;

import com.sasurd.niha0.common.ApiException;
import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class AgentMemoryService {

    private static final Set<String> SCOPES = Set.of("SESSION", "PERSISTENT", "TEAM", "ENTERPRISE");

    private final AgentMemoryRepository repository;

    public AgentMemoryService(AgentMemoryRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<AgentMemory> list(String scope) {
        UUID orgId = orgId();
        if (scope == null || scope.isBlank()) {
            return repository.findByOrganizationIdOrderByCreatedAtDesc(orgId);
        }
        return repository.findByOrganizationIdAndScopeOrderByCreatedAtDesc(orgId, normalizeScope(scope));
    }

    @Transactional
    public AgentMemory put(AgentMemory memory) {
        UUID orgId = orgId();
        String scope = normalizeScope(memory.getScope());
        if (memory.getKeyName() == null || memory.getKeyName().isBlank()) {
            throw new ApiException(400, "keyName is required");
        }
        if (memory.getContent() == null) {
            throw new ApiException(400, "content is required");
        }
        memory.setOrganizationId(orgId);
        memory.setScope(scope);
        memory.setCreatedBy(SecurityUtils.currentUserId());
        return repository.save(memory);
    }

    @Transactional(readOnly = true)
    public AgentMemory get(UUID id) {
        return repository.findByIdAndOrganizationId(id, orgId())
                .orElseThrow(() -> new ApiException(404, "Memory not found"));
    }

    @Transactional(readOnly = true)
    public AgentMemory getByKey(String scope, String keyName) {
        return repository.findFirstByOrganizationIdAndScopeAndKeyNameOrderByCreatedAtDesc(
                        orgId(), normalizeScope(scope), keyName)
                .orElseThrow(() -> new ApiException(404, "Memory not found"));
    }

    @Transactional
    public void delete(UUID id) {
        AgentMemory existing = get(id);
        repository.delete(existing);
    }

    @Transactional
    public long eraseByScope(String scope) {
        String normalized = normalizeScope(scope);
        List<AgentMemory> items = repository.findByOrganizationIdAndScopeOrderByCreatedAtDesc(orgId(), normalized);
        repository.deleteByOrganizationIdAndScope(orgId(), normalized);
        return items.size();
    }

    private String normalizeScope(String scope) {
        String value = scope == null ? "" : scope.trim().toUpperCase(Locale.ROOT);
        if (!SCOPES.contains(value)) {
            throw new ApiException(400, "Invalid scope (SESSION|PERSISTENT|TEAM|ENTERPRISE)");
        }
        return value;
    }

    private UUID orgId() {
        return SecurityUtils.requireOrganizationId();
    }
}
