package com.sasurd.niha0.webhooks;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OutboundWebhookRepository extends JpaRepository<OutboundWebhook, UUID> {

    List<OutboundWebhook> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    Optional<OutboundWebhook> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
