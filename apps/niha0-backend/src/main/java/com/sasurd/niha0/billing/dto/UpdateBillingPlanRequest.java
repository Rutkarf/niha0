package com.sasurd.niha0.billing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateBillingPlanRequest(
        @NotBlank @Pattern(regexp = "FREE|PRO|BUSINESS") String plan
) {}
