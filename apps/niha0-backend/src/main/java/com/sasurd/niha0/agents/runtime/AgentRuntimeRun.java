package com.sasurd.niha0.agents.runtime;

import com.sasurd.niha0.common.TenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "agent_runtime_runs")
@Getter
@Setter
public class AgentRuntimeRun extends TenantEntity {

    @Column(name = "agent_id")
    private UUID agentId;

    @Column(name = "graph_name", nullable = false, length = 120)
    private String graphName = "default";

    @Column(nullable = false, length = 64)
    private String status = "RUNNING";

    @Column(name = "current_node", length = 120)
    private String currentNode;

    @Column(name = "state_json", nullable = false, columnDefinition = "TEXT")
    private String stateJson = "{}";

    @Column(name = "interrupt_reason", columnDefinition = "TEXT")
    private String interruptReason;

    @Column(name = "model_provider", nullable = false, length = 64)
    private String modelProvider = "mock";

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onPersistRun() {
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
        if (stateJson == null || stateJson.isBlank()) {
            stateJson = "{}";
        }
    }

    @PreUpdate
    void onUpdateRun() {
        updatedAt = Instant.now();
    }
}
