package com.sasurd.niha0.crm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CustomerRequest(
        @NotBlank @Size(max = 255) String name,
        @Size(max = 255) String email,
        @Size(max = 50) String phone,
        @Size(max = 100) String industry,
        @Size(max = 50) String status
) {}
