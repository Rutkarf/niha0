package com.sasurd.niha0.rag;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, UUID> {
    List<DocumentChunk> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
    List<DocumentChunk> findByOrganizationIdAndDataAssetId(UUID organizationId, UUID dataAssetId);
    void deleteByOrganizationIdAndDataAssetId(UUID organizationId, UUID dataAssetId);
    long countByOrganizationId(UUID organizationId);
}
