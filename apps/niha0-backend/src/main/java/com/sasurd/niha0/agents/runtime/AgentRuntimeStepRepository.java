package com.sasurd.niha0.agents.runtime;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AgentRuntimeStepRepository extends JpaRepository<AgentRuntimeStep, UUID> {

    List<AgentRuntimeStep> findByOrganizationIdAndRunIdOrderByStepIndexAsc(UUID organizationId, UUID runId);
}
