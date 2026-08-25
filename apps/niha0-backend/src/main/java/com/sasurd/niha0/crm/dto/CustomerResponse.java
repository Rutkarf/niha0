package com.sasurd.niha0.crm.dto;

import java.time.Instant;
import java.util.UUID;

public record CustomerResponse(
        UUID id,
        String name,
        String email,
        String phone,
        String industry,
        String status,
        Instant createdAt,
        Instant updatedAt
) {}
