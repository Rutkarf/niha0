package com.sasurd.niha0.accounting;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    List<Payment> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
    Optional<Payment> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
