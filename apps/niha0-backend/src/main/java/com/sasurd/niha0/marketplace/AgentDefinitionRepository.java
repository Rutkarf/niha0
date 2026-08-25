package com.sasurd.niha0.marketplace;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AgentDefinitionRepository extends JpaRepository<AgentDefinition, UUID> {

    List<AgentDefinition> findByOrganizationIdOrderByUpdatedAtDesc(UUID organizationId);

    Optional<AgentDefinition> findByIdAndOrganizationId(UUID id, UUID organizationId);

    Optional<AgentDefinition> findFirstByOrganizationIdAndSlugOrderByVersionDesc(UUID organizationId, String slug);
}
