package com.sasurd.niha0.identity.dto;

import com.sasurd.niha0.common.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record AcceptInviteRequest(
        @NotNull UUID token,
        @NotBlank @Size(min = 8, max = 128) String password,
        @NotBlank String firstName,
        @NotBlank String lastName
) {}
