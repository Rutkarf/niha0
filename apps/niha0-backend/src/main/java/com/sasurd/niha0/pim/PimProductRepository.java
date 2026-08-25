package com.sasurd.niha0.pim;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PimProductRepository extends JpaRepository<PimProduct, UUID> {

    List<PimProduct> findByOrganizationIdOrderBySkuAsc(UUID organizationId);

    Optional<PimProduct> findByIdAndOrganizationId(UUID id, UUID organizationId);

    boolean existsByOrganizationIdAndSkuIgnoreCase(UUID organizationId, String sku);

    long countByOrganizationId(UUID organizationId);
}
