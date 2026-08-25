package com.sasurd.niha0.platform;

import java.util.UUID;

public record PlatformOrgSummary(
        UUID id,
        String name,
        String slug,
        String billingPlan,
        String status,
        int activeSeats,
        long storageBytes
) {}
