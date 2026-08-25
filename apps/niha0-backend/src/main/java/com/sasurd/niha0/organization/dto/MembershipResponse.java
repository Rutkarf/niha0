package com.sasurd.niha0.organization.dto;

import com.sasurd.niha0.common.Role;

import java.util.UUID;

public record MembershipResponse(
        UUID id,
        UUID userId,
        String email,
        String firstName,
        String lastName,
        Role role,
        boolean active
) {}
