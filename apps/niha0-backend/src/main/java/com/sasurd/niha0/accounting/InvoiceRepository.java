package com.sasurd.niha0.accounting;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    List<Invoice> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
    Optional<Invoice> findByIdAndOrganizationId(UUID id, UUID organizationId);
    Optional<Invoice> findByOrganizationIdAndReferenceIgnoreCase(UUID organizationId, String reference);
    long countByOrganizationId(UUID organizationId);
}
