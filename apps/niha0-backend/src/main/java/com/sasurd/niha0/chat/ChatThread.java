package com.sasurd.niha0.chat;

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
@Table(name = "chat_threads")
@Getter
@Setter
public class ChatThread extends TenantEntity {

    @Column(nullable = false, length = 200)
    private String title = "Conversation";

    @Column(name = "agent_id")
    private UUID agentId;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onPersistThread() {
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
        if (title == null || title.isBlank()) {
            title = "Conversation";
        }
    }

    @PreUpdate
    void onUpdateThread() {
        updatedAt = Instant.now();
    }
}
