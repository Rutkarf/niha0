package com.sasurd.niha0.agents;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sasurd.niha0.agents.dto.AgentRecommendation;
import com.sasurd.niha0.common.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * OpenAI-compatible chat completions provider.
 * Activate with {@code niha0.ai.provider=openai} and {@code AI_OPENAI_API_KEY}.
 * Falls back to demo recommendations when {@code niha0.ai.openai.allow-demo-fallback=true}.
 */
@Service
@ConditionalOnProperty(name = "niha0.ai.provider", havingValue = "openai")
public class OpenAiAgentRecommendationProvider implements AgentRecommendationProvider {

    private static final Logger log = LoggerFactory.getLogger(OpenAiAgentRecommendationProvider.class);
    private static final ObjectMapper JSON = new ObjectMapper();

    private final RestClient client;
    private final String model;
    private final boolean allowDemoFallback;
    private volatile boolean lastRecommendUsedFallback;

    public OpenAiAgentRecommendationProvider(
            @Value("${niha0.ai.openai.base-url:https://api.openai.com/v1}") String baseUrl,
            @Value("${niha0.ai.openai.api-key:}") String apiKey,
            @Value("${niha0.ai.openai.model:gpt-4o-mini}") String model,
            @Value("${niha0.ai.openai.timeout-ms:20000}") long timeoutMs,
            @Value("${niha0.ai.openai.allow-demo-fallback:true}") boolean allowDemoFallback) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("AI_OPENAI_API_KEY is required when niha0.ai.provider=openai");
        }
        this.model = model;
        this.allowDemoFallback = allowDemoFallback;
        this.client = RestClient.builder()
                .baseUrl(baseUrl.replaceAll("/$", ""))
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
        log.info("OpenAI recommendation provider ready (model={}, baseUrl={}, allowDemoFallback={})",
                model, baseUrl, allowDemoFallback);
    }

    @Override
    public AgentRecommendation recommend(String agentCode) {
        try {
            String system = """
                    Tu es un agent métier NIHAO. Réponds UNIQUEMENT avec un JSON compact:
                    {"actionType":"...","title":"...","description":"...","draftPayload":"{...}"}
                    description en français, title court, actionType en SNAKE_CASE.
                    """;
            String user = "Génère une recommandation actionnable pour l'agent code=" + agentCode
                    + ". Contexte: ERP multi-tenant, validation CEO requise.";

            Map<String, Object> body = Map.of(
                    "model", model,
                    "temperature", 0.4,
                    "response_format", Map.of("type", "json_object"),
                    "messages", List.of(
                            Map.of("role", "system", "content", system),
                            Map.of("role", "user", "content", user)
                    )
            );

            String raw = client.post()
                    .uri("/chat/completions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            AgentRecommendation recommendation = parseRecommendation(raw, agentCode);
            lastRecommendUsedFallback = false;
            return recommendation;
        } catch (Exception e) {
            if (allowDemoFallback) {
                log.warn("OpenAI recommend failed for {} — falling back to demo: {}", agentCode, e.getMessage());
                lastRecommendUsedFallback = true;
                return MockAgentService.demoRecommend(agentCode);
            }
            throw new ApiException(502, "AI provider unavailable");
        }
    }

    @Override
    public String taskBubble(String agentCode, String status) {
        return MockAgentService.demoBubble(agentCode, status);
    }

    @Override
    public boolean isDemoEngine() {
        return lastRecommendUsedFallback;
    }

    @Override
    public boolean lastRecommendUsedFallback() {
        return lastRecommendUsedFallback;
    }

    @Override
    public String engineLabel() {
        if (lastRecommendUsedFallback) {
            return "OpenAI (fallback démo)";
        }
        return "OpenAI (" + model + ")";
    }

    private AgentRecommendation parseRecommendation(String raw, String agentCode) throws Exception {
        JsonNode root = JSON.readTree(raw);
        String content = root.path("choices").path(0).path("message").path("content").asText("");
        if (content.isBlank()) {
            throw new IllegalStateException("Empty LLM content");
        }
        JsonNode rec = JSON.readTree(content);
        String actionType = textOr(rec, "actionType", "LLM_ACTION");
        String title = textOr(rec, "title", "Recommandation " + agentCode);
        String description = textOr(rec, "description", "Proposition générée par IA.");
        String draftPayload = rec.has("draftPayload")
                ? (rec.get("draftPayload").isTextual()
                ? rec.get("draftPayload").asText()
                : rec.get("draftPayload").toString())
                : "{\"agentCode\":\"" + agentCode + "\"}";
        return new AgentRecommendation(actionType, title, description, draftPayload);
    }

    private static String textOr(JsonNode node, String field, String fallback) {
        String v = node.path(field).asText("");
        return v.isBlank() ? fallback : v;
    }
}
