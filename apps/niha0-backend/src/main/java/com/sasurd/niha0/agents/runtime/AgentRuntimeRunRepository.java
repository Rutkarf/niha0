package com.sasurd.niha0.agents.runtime;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AgentRuntimeRunRepository extends JpaRepository<AgentRuntimeRun, UUID> {

    List<AgentRuntimeRun> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    Optional<AgentRuntimeRun> findByIdAndOrganizationId(UUID id, UUID organizationId);

    long countByOrganizationId(UUID organizationId);
}
