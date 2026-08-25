package com.sasurd.niha0.feedback.dto;

import jakarta.validation.constraints.NotBlank;

public record FeedbackRequest(
        @NotBlank String category,
        @NotBlank String message
) {}
