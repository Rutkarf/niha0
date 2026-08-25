package com.sasurd.niha0.feedback.dto;

import java.util.UUID;

public record FeedbackResponse(UUID id, String category, String message) {}
