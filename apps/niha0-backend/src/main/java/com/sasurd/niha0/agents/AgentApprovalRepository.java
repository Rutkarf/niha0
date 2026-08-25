package com.sasurd.niha0.agents;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AgentApprovalRepository extends JpaRepository<AgentApproval, UUID> {
    List<AgentApproval> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
    List<AgentApproval> findByActionIdAndOrganizationId(UUID actionId, UUID organizationId);
}
