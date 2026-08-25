package com.sasurd.niha0.marketplace;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MarketplaceListingRepository extends JpaRepository<MarketplaceListing, UUID> {

    List<MarketplaceListing> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    Optional<MarketplaceListing> findByIdAndOrganizationId(UUID id, UUID organizationId);

    @Query("""
            select l from MarketplaceListing l
            where l.visibility = 'PUBLIC'
               or (l.visibility = 'PRIVATE' and l.organizationId = :orgId)
            order by l.createdAt desc
            """)
    List<MarketplaceListing> findCatalogForOrg(@Param("orgId") UUID orgId);

    long countByOrganizationId(UUID organizationId);
}
