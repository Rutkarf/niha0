package com.sasurd.niha0.agents;

import com.sasurd.niha0.agents.dto.AgentRecommendation;

/**
 * Pluggable recommendation engine. Current production bean is {@link MockAgentService}
 * (demo heuristics). Replace with an LLM/RAG implementation without touching controllers.
 */
public interface AgentRecommendationProvider {

    AgentRecommendation recommend(String agentCode);

    String taskBubble(String agentCode, String status);

    /** Honest capability flag for UI transparency. */
    default boolean isDemoEngine() {
        return true;
    }

    default String engineLabel() {
        return "Démo (mock)";
    }

    /** True when the last recommend() call fell back to demo heuristics. */
    default boolean lastRecommendUsedFallback() {
        return false;
    }
}
