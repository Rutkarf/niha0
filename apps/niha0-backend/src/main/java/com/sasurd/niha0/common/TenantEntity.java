package com.sasurd.niha0.common;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@MappedSuperclass
public abstract class TenantEntity extends AuditableEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;
}
