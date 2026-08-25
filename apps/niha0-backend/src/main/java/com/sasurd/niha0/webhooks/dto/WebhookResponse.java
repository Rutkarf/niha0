package com.sasurd.niha0.webhooks.dto;

import java.time.Instant;
import java.util.UUID;

public record WebhookResponse(
        UUID id,
        String url,
        String events,
        boolean active,
        Instant createdAt
) {}
