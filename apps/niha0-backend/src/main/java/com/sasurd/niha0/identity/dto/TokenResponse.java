package com.sasurd.niha0.identity.dto;

import com.sasurd.niha0.common.Role;

import java.util.UUID;

public record TokenResponse(
        String accessToken,
        String refreshToken,
        long expiresInMs,
        UUID userId,
        UUID organizationId,
        Role role,
        Boolean mfaRequired,
        String mfaToken
) {
    public TokenResponse(String accessToken, String refreshToken, long expiresInMs,
                         UUID userId, UUID organizationId, Role role) {
        this(accessToken, refreshToken, expiresInMs, userId, organizationId, role, false, null);
    }

    public static TokenResponse mfaChallenge(String mfaToken, UUID userId, UUID organizationId, Role role) {
        return new TokenResponse(null, null, 0, userId, organizationId, role, true, mfaToken);
    }
}
