package com.sasurd.niha0.identity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MfaDisableRequest(
        @NotBlank @Size(min = 8, max = 128) String password
) {}
