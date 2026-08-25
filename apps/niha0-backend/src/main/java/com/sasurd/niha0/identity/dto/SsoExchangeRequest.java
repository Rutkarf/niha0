package com.sasurd.niha0.identity.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SsoExchangeRequest(@NotNull UUID code) {
}
