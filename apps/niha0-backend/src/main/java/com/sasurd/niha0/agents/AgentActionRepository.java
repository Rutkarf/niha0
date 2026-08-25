package com.sasurd.niha0.agents;

import com.sasurd.niha0.common.WorkflowStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AgentActionRepository extends JpaRepository<AgentAction, UUID> {
    List<AgentAction> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
    Optional<AgentAction> findByIdAndOrganizationId(UUID id, UUID organizationId);
    long countByOrganizationIdAndWorkflowStatus(UUID organizationId, WorkflowStatus status);
    long countByOrganizationIdAndCreatedAtAfter(UUID organizationId, Instant createdAt);
}
