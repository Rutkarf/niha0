package com.sasurd.niha0.identity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record MfaConfirmRequest(
        @NotBlank @Size(min = 6, max = 6) @Pattern(regexp = "\\d{6}") String code
) {}
