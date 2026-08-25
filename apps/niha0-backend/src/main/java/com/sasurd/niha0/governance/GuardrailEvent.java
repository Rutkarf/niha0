package com.sasurd.niha0.governance;

import com.sasurd.niha0.common.TenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "guardrail_events")
@Getter
@Setter
public class GuardrailEvent extends TenantEntity {

    @Column(name = "event_type", nullable = false, length = 64)
    private String eventType;

    @Column(nullable = false, length = 32)
    private String severity = "INFO";

    @Column(nullable = false, length = 64)
    private String source;

    @Column(columnDefinition = "TEXT")
    private String detail;

    @Column(nullable = false)
    private boolean blocked = false;

    @Column(name = "created_by")
    private UUID createdBy;
}
