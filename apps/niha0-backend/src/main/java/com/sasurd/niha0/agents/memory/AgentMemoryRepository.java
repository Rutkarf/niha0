package com.sasurd.niha0.agents.memory;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AgentMemoryRepository extends JpaRepository<AgentMemory, UUID> {

    List<AgentMemory> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    List<AgentMemory> findByOrganizationIdAndScopeOrderByCreatedAtDesc(UUID organizationId, String scope);

    Optional<AgentMemory> findByIdAndOrganizationId(UUID id, UUID organizationId);

    Optional<AgentMemory> findFirstByOrganizationIdAndScopeAndKeyNameOrderByCreatedAtDesc(
            UUID organizationId, String scope, String keyName);

    void deleteByOrganizationIdAndScope(UUID organizationId, String scope);
}
