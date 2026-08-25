package com.sasurd.niha0.billing.dto;

public record BillingPlanResponse(
        String plan,
        int seatsUsed,
        int seatsLimit,
        String storageNote,
        long storageUsedBytes,
        long storageLimitBytes,
        int aiActionsUsedToday,
        int aiActionsLimitDaily
) {}
