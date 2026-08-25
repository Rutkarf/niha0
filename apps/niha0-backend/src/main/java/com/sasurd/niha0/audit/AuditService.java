package com.sasurd.niha0.audit;

import com.sasurd.niha0.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void log(String action, String entityType, UUID entityId, String details) {
        AuditLog entry = new AuditLog();
        entry.setOrganizationId(SecurityUtils.requireOrganizationId());
        entry.setUserId(SecurityUtils.currentUserId());
        entry.setAction(action);
        entry.setEntityType(entityType);
        entry.setEntityId(entityId);
        entry.setDetails(details);
        auditLogRepository.save(entry);
    }

    /** Audit when SecurityContext may not yet expose org (e.g. post-login hooks). */
    @Transactional
    public void logFor(UUID organizationId, UUID userId, String action, String entityType, UUID entityId, String details) {
        AuditLog entry = new AuditLog();
        entry.setOrganizationId(organizationId);
        entry.setUserId(userId);
        entry.setAction(action);
        entry.setEntityType(entityType);
        entry.setEntityId(entityId);
        entry.setDetails(details);
        auditLogRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> listLogs() {
        return auditLogRepository.findByOrganizationIdOrderByCreatedAtDesc(
                SecurityUtils.requireOrganizationId());
    }
}
