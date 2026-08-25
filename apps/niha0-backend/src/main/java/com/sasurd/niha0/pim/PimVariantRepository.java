package com.sasurd.niha0.pim;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PimVariantRepository extends JpaRepository<PimVariant, UUID> {

    List<PimVariant> findByOrganizationIdAndProductIdOrderBySkuAsc(UUID organizationId, UUID productId);

    Optional<PimVariant> findByIdAndOrganizationId(UUID id, UUID organizationId);

    boolean existsByOrganizationIdAndSkuIgnoreCase(UUID organizationId, String sku);
}
