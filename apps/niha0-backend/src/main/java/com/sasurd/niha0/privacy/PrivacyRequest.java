package com.sasurd.niha0.privacy;

import com.sasurd.niha0.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "privacy_requests")
@Getter
@Setter
public class PrivacyRequest extends AuditableEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "request_type", nullable = false)
    private String requestType;

    @Column(nullable = false)
    private String status = "COMPLETED";

    @Column(name = "payload_json", columnDefinition = "TEXT")
    private String payloadJson;
}
