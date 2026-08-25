package com.sasurd.niha0.storage;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StoredAssetRepository extends JpaRepository<StoredAsset, UUID> {
    List<StoredAsset> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    Optional<StoredAsset> findByIdAndOrganizationId(UUID id, UUID organizationId);

    List<StoredAsset> findByCreatedBy(UUID createdBy);

    @Query("SELECT COALESCE(SUM(s.sizeBytes), 0) FROM StoredAsset s WHERE s.organizationId = :orgId")
    long sumSizeBytesByOrganizationId(@Param("orgId") UUID orgId);
}
