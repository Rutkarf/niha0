package com.sasurd.niha0.stock;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StockItemRepository extends JpaRepository<StockItem, UUID> {
    List<StockItem> findByOrganizationIdOrderBySkuAsc(UUID organizationId);
    Optional<StockItem> findByIdAndOrganizationId(UUID id, UUID organizationId);
    Optional<StockItem> findByOrganizationIdAndSkuIgnoreCase(UUID organizationId, String sku);
}
