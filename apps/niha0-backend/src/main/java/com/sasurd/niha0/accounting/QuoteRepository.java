package com.sasurd.niha0.accounting;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QuoteRepository extends JpaRepository<Quote, UUID> {
    List<Quote> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
    Optional<Quote> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
