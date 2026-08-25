package com.sasurd.niha0.organization.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CompanyDataAssetRequest(
        @NotBlank @Size(max = 255) String name,
        @NotBlank @Size(max = 64) String fileType,
        @Size(max = 128) String mimeType,
        long sizeBytes,
        @Size(max = 2000) String description,
        @Size(max = 128) String category,
        String storageReference,
        String linkedAgentIds,
        @Size(max = 32) String status,
        @Size(max = 64) String processingStatus
) {}
