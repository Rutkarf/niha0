package com.sasurd.niha0.webhooks.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateWebhookRequest(
        @NotBlank String url,
        @NotBlank String secret,
        @NotBlank String events
) {}
