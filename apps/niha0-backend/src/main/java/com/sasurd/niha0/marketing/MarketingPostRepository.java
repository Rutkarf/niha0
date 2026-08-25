package com.sasurd.niha0.marketing;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MarketingPostRepository extends JpaRepository<MarketingPost, UUID> {
    List<MarketingPost> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
}
