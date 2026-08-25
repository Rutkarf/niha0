package com.sasurd.niha0.identity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record LocaleUpdateRequest(
        @NotBlank @Pattern(regexp = "fr|en") String locale
) {}
