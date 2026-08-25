package com.sasurd.niha0.marketplace;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MarketplaceInstallRepository extends JpaRepository<MarketplaceInstall, UUID> {

    List<MarketplaceInstall> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    Optional<MarketplaceInstall> findByOrganizationIdAndListingId(UUID organizationId, UUID listingId);
}
