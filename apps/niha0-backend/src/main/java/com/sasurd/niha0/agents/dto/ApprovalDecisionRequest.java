package com.sasurd.niha0.agents.dto;

import jakarta.validation.constraints.NotBlank;

public record ApprovalDecisionRequest(
        @NotBlank String comment
) {}
