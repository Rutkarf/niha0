package com.sasurd.niha0.agents.dto;

import java.util.UUID;

public record AgentRecommendation(
        String actionType,
        String title,
        String description,
        String draftPayload
) {}
