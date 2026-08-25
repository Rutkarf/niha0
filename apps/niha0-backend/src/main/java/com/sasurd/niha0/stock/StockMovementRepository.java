package com.sasurd.niha0.stock;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface StockMovementRepository extends JpaRepository<StockMovement, UUID> {
    List<StockMovement> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
}
