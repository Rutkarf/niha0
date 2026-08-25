package com.sasurd.niha0.common;

import java.time.Instant;

/**
 * Uniform API error envelope — never expose stack traces or internal details to clients.
 */
public record ApiErrorResponse(
        int status,
        String error,
        String code,
        Instant timestamp
) {
    public static ApiErrorResponse of(int status, String error, String code) {
        return new ApiErrorResponse(status, error, code, Instant.now());
    }
}
