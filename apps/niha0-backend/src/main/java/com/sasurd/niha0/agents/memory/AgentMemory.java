package com.sasurd.niha0.agents.memory;

import com.sasurd.niha0.common.TenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "agent_memories")
@Getter
@Setter
public class AgentMemory extends TenantEntity {

    @Column(nullable = false, length = 32)
    private String scope;

    @Column(name = "scope_ref", length = 120)
    private String scopeRef;

    @Column(name = "key_name", nullable = false, length = 160)
    private String keyName;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "metadata_json", columnDefinition = "TEXT")
    private String metadataJson;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "expires_at")
    private Instant expiresAt;
}
