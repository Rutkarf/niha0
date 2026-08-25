package com.sasurd.niha0.identity.dto;

import com.sasurd.niha0.common.Role;

import java.util.UUID;

public record UserMeResponse(
        UUID id,
        String email,
        String firstName,
        String lastName,
        UUID organizationId,
        String organizationName,
        Role role
) {}
