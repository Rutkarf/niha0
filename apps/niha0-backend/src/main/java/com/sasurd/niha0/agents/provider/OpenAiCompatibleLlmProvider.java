package com.sasurd.niha0.agents.provider;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

/**
 * OpenAI-compatible chat completions. Falls back to {@link MockLlmProvider} when API key is missing or call fails.
 */
@Component
public class OpenAiCompatibleLlmProvider implements LlmProvider {

    private static final Logger log = LoggerFactory.getLogger(OpenAiCompatibleLlmProvider.class);
    private static final ObjectMapper JSON = new ObjectMapper();

    private final RestClient client;
    private final String model;
    private final boolean configured;
    private final MockLlmProvider mockFallback;

    public OpenAiCompatibleLlmProvider(
            @Value("${niha0.ai.openai.base-url:https://api.openai.com/v1}") String baseUrl,
            @Value("${niha0.ai.openai.api-key:}") String apiKey,
            @Value("${niha0.ai.openai.model:gpt-4o-mini}") String model,
            MockLlmProvider mockFallback) {
        this.model = model;
        this.mockFallback = mockFallback;
        this.configured = apiKey != null && !apiKey.isBlank();
        if (configured) {
            this.client = RestClient.builder()
                    .baseUrl(baseUrl.replaceAll("/$", ""))
                    .defaultHeader("Authorization", "Bearer " + apiKey)
                    .build();
        } else {
            this.client = null;
            log.info("OpenAI LLM provider has no API key — will use mock fallback");
        }
    }

    @Override
    public String complete(String system, String user) {
        if (!configured || client == null) {
            return mockFallback.complete(system, user);
        }
        try {
            Map<String, Object> body = Map.of(
                    "model", model,
                    "temperature", 0.4,
                    "messages", List.of(
                            Map.of("role", "system", "content", system == null ? "" : system),
                            Map.of("role", "user", "content", user == null ? "" : user)
                    )
            );
            String raw = client.post()
                    .uri("/chat/completions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);
            JsonNode root = JSON.readTree(raw);
            String content = root.path("choices").path(0).path("message").path("content").asText("");
            if (content.isBlank()) {
                return mockFallback.complete(system, user);
            }
            return content;
        } catch (Exception e) {
            log.warn("OpenAI complete failed — falling back to mock: {}", e.getMessage());
            return mockFallback.complete(system, user);
        }
    }

    @Override
    public String name() {
        return configured ? "openai" : "mock";
    }
}
