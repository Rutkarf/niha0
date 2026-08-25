package com.sasurd.niha0.agents;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AgentRepository extends JpaRepository<Agent, UUID> {
    List<Agent> findByOrganizationIdOrderByNameAsc(UUID organizationId);
    Optional<Agent> findByIdAndOrganizationId(UUID id, UUID organizationId);
    Optional<Agent> findByOrganizationIdAndCode(UUID organizationId, String code);
    long countByOrganizationId(UUID organizationId);
}
