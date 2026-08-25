package com.sasurd.niha0.organization.dto;

import java.util.UUID;

public record OrganizationResponse(
        UUID id,
        String name,
        String slug,
        String sector,
        String description,
        String website,
        String country,
        String city,
        String companySize,
        String professionalEmail,
        String slogan,
        String logoUrl,
        UUID logoAssetId,
        String onboardingStatus,
        String workspaceConfig
) {}
