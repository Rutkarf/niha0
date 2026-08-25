package com.sasurd.niha0.organization.dto;

import com.sasurd.niha0.common.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateInviteRequest(
        @NotBlank @Email String email,
        @NotNull Role role
) {}
