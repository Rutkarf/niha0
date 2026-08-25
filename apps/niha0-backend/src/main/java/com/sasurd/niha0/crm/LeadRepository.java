package com.sasurd.niha0.crm;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeadRepository extends JpaRepository<Lead, UUID> {
    List<Lead> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
    Optional<Lead> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
