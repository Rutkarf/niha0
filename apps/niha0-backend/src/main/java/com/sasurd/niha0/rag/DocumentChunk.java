package com.sasurd.niha0.rag;

import com.sasurd.niha0.common.TenantEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "document_chunks")
@Getter
@Setter
public class DocumentChunk extends TenantEntity {

    @Column(name = "data_asset_id", nullable = false)
    private UUID dataAssetId;

    @Column(name = "stored_asset_id")
    private UUID storedAssetId;

    @Column(name = "chunk_index", nullable = false)
    private int chunkIndex;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "token_estimate", nullable = false)
    private int tokenEstimate;

    @Column(name = "embedding_json", columnDefinition = "TEXT")
    private String embeddingJson;
}
