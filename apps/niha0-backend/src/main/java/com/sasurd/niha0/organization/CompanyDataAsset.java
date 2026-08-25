package com.sasurd.niha0.organization;

import com.sasurd.niha0.common.TenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "company_data_assets")
@Getter
@Setter
public class CompanyDataAsset extends TenantEntity {

    @Column(nullable = false)
    private String name;

    @Column(name = "file_type", nullable = false)
    private String fileType;

    @Column(name = "mime_type")
    private String mimeType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(nullable = false)
    private String status = "IMPORTED";

    @Column(name = "processing_status", nullable = false)
    private String processingStatus = "UPLOADED";

    @Column(columnDefinition = "TEXT")
    private String description;

    private String category;

    @Column(name = "storage_reference", columnDefinition = "TEXT")
    private String storageReference;

    @Column(name = "linked_agent_ids", columnDefinition = "TEXT")
    private String linkedAgentIds;

    @Column(name = "stored_asset_id")
    private java.util.UUID storedAssetId;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onPersistAsset() {
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }

    @PreUpdate
    void onUpdateAsset() {
        updatedAt = Instant.now();
    }
}
