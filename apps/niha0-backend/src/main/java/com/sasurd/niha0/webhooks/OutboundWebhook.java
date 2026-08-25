package com.sasurd.niha0.webhooks;

import com.sasurd.niha0.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "outbound_webhooks")
@Getter
@Setter
public class OutboundWebhook extends AuditableEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(nullable = false)
    private String url;

    @Column(nullable = false)
    private String secret;

    @Column(nullable = false)
    private String events;

    @Column(nullable = false)
    private boolean active = true;
}
