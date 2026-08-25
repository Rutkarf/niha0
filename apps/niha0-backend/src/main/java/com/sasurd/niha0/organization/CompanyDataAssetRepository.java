package com.sasurd.niha0.organization;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CompanyDataAssetRepository extends JpaRepository<CompanyDataAsset, UUID> {
    List<CompanyDataAsset> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
}
