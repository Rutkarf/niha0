package com.sasurd.niha0.organization.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record OrganizationUpdateRequest(
        @Size(max = 200) String name,
        @Size(max = 120) String sector,
        @Size(max = 2000) String description,
        @Size(max = 512) String website,
        @Size(max = 120) String country,
        @Size(max = 120) String city,
        @Size(max = 64) String companySize,
        @Email @Size(max = 255) String professionalEmail,
        @Size(max = 255) String slogan,
        @Size(max = 32) String onboardingStatus,
        String workspaceConfig,
        String logoUrl
) {}
