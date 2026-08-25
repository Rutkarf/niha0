package com.sasurd.niha0.notifications;

import com.sasurd.niha0.common.ApiException;
import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional(readOnly = true)
    public List<Notification> listForCurrentUser() {
        return notificationRepository.findByOrganizationIdAndUserIdOrderByCreatedAtDesc(
                orgId(), SecurityUtils.currentUserId());
    }

    @Transactional
    public Notification markRead(UUID id) {
        Notification notification = notificationRepository
                .findByIdAndOrganizationIdAndUserId(id, orgId(), SecurityUtils.currentUserId())
                .orElseThrow(() -> new ApiException(404, "Notification not found"));
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    private UUID orgId() {
        return SecurityUtils.requireOrganizationId();
    }
}
