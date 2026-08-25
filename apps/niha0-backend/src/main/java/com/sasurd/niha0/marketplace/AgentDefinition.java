package com.sasurd.niha0.marketplace;

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
@Table(name = "agent_definitions")
@Getter
@Setter
public class AgentDefinition extends TenantEntity {

    @Column(nullable = false, length = 120)
    private String slug;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "graph_json", nullable = false, columnDefinition = "TEXT")
    private String graphJson = "{\"nodes\":[],\"edges\":[]}";

    @Column(nullable = false)
    private int version = 1;

    @Column(nullable = false, length = 32)
    private String visibility = "PRIVATE";

    @Column(nullable = false, length = 64)
    private String status = "DRAFT";

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onPersistDefinition() {
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
        if (graphJson == null || graphJson.isBlank()) {
            graphJson = "{\"nodes\":[],\"edges\":[]}";
        }
    }

    @PreUpdate
    void onUpdateDefinition() {
        updatedAt = Instant.now();
    }
}
