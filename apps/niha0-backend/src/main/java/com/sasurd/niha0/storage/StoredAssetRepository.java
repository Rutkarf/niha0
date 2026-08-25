package com.sasurd.niha0.storage;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StoredAssetRepository extends JpaRepository<StoredAsset, UUID> {
    List<StoredAsset> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    Optional<StoredAsset> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
