package com.sasurd.niha0.notifications;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByOrganizationIdAndUserIdOrderByCreatedAtDesc(UUID organizationId, UUID userId);
    Optional<Notification> findByIdAndOrganizationIdAndUserId(UUID id, UUID organizationId, UUID userId);
}
