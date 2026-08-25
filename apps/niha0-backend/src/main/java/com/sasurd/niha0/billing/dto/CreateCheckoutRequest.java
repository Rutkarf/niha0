package com.sasurd.niha0.billing.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateCheckoutRequest(@NotBlank String plan) {}
