package com.sasurd.niha0.administration;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DocumentRepository extends JpaRepository<Document, UUID> {
    List<Document> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
    Optional<Document> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
