package com.sasurd.niha0.crm;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OpportunityRepository extends JpaRepository<Opportunity, UUID> {
    List<Opportunity> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
    Optional<Opportunity> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
