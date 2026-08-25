package com.sasurd.niha0.customerrelations;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {
    List<Ticket> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
    Optional<Ticket> findByIdAndOrganizationId(UUID id, UUID organizationId);
    long countByOrganizationIdAndStatus(UUID organizationId, String status);
    long countByOrganizationId(UUID organizationId);
}
