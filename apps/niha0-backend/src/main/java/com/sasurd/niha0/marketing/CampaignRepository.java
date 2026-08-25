package com.sasurd.niha0.marketing;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CampaignRepository extends JpaRepository<Campaign, UUID> {
    List<Campaign> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
}
