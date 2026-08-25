package com.sasurd.niha0.billing.dto;

public record BillingPlanResponse(
        String plan,
        int seatsUsed,
        int seatsLimit,
        String storageNote
) {}
