package com.sasurd.niha0.organization.dto;

import com.sasurd.niha0.common.Role;

import java.time.Instant;
import java.util.UUID;

public record InviteResponse(
        UUID id,
        String email,
        Role role,
        UUID token,
        Instant expiresAt,
        Instant createdAt
) {}
