package com.sasurd.niha0.organization.dto;

import java.time.Instant;
import java.util.UUID;

public record CompanyDataAssetResponse(
        UUID id,
        UUID organizationId,
        String name,
        String fileType,
        String mimeType,
        long sizeBytes,
        String status,
        String processingStatus,
        String description,
        String category,
        String storageReference,
        String linkedAgentIds,
        UUID storedAssetId,
        Instant createdAt,
        Instant updatedAt
) {}
