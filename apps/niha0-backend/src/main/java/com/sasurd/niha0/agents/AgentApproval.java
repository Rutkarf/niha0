package com.sasurd.niha0.agents;

import com.sasurd.niha0.common.TenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "agent_approvals")
@Getter
@Setter
public class AgentApproval extends TenantEntity {

    @Column(name = "action_id", nullable = false)
    private UUID actionId;

    @Column(name = "decided_by")
    private UUID decidedBy;

    private String decision;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "decided_at")
    private Instant decidedAt;
}
