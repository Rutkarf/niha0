package com.sasurd.niha0.agents;

import com.sasurd.niha0.common.AgentStatus;
import com.sasurd.niha0.common.TenantEntity;
import com.sasurd.niha0.common.WorkflowStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "agent_actions")
@Getter
@Setter
public class AgentAction extends TenantEntity {

    @Column(name = "agent_id", nullable = false)
    private UUID agentId;

    @Column(name = "requested_by")
    private UUID requestedBy;

    @Column(name = "action_type", nullable = false)
    private String actionType;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "draft_payload", columnDefinition = "TEXT")
    private String draftPayload;

    /** JSON summary of domain side-effects applied after CEO approval. */
    @Column(name = "execution_result", columnDefinition = "TEXT")
    private String executionResult;

    @Column(name = "executed_at")
    private Instant executedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "workflow_status", nullable = false)
    private WorkflowStatus workflowStatus = WorkflowStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "agent_status", nullable = false)
    private AgentStatus agentStatus = AgentStatus.PREPARING;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onPersistAction() {
        if (updatedAt == null) updatedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
