package com.sasurd.niha0.rag;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sasurd.niha0.config.RagProperties;
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
 * OpenAI-compatible embeddings API for production vector RAG.
 */
@Service
@ConditionalOnProperty(name = "niha0.rag.embedding-provider", havingValue = "openai")
public class OpenAiEmbeddingProvider implements EmbeddingProvider {

    private static final Logger log = LoggerFactory.getLogger(OpenAiEmbeddingProvider.class);
    private static final ObjectMapper JSON = new ObjectMapper();

    private final RestClient client;
    private final String model;
    private final int dims;

    public OpenAiEmbeddingProvider(
            RagProperties ragProperties,
            @Value("${niha0.ai.openai.base-url:https://api.openai.com/v1}") String baseUrl,
            @Value("${niha0.ai.openai.api-key:}") String apiKey,
            @Value("${niha0.rag.openai.model:text-embedding-3-small}") String model) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("AI_OPENAI_API_KEY is required when niha0.rag.embedding-provider=openai");
        }
        this.model = model;
        this.dims = Math.max(8, ragProperties.getEmbeddingDims());
        this.client = RestClient.builder()
                .baseUrl(baseUrl.replaceAll("/$", ""))
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
        log.info("OpenAI embedding provider ready (model={}, dims={})", model, dims);
    }

    @Override
    public float[] embed(String text) {
        if (text == null || text.isBlank()) {
            return new float[dims];
        }
        try {
            Map<String, Object> body = Map.of(
                    "model", model,
                    "input", text,
                    "dimensions", dims
            );
            String raw = client.post()
                    .uri("/embeddings")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);
            return parseEmbedding(raw);
        } catch (Exception e) {
            throw new ApiException(502, "Embedding provider unavailable: " + e.getMessage());
        }
    }

    @Override
    public boolean isDemo() {
        return false;
    }

    private float[] parseEmbedding(String raw) throws Exception {
        JsonNode root = JSON.readTree(raw);
        JsonNode embedding = root.path("data").path(0).path("embedding");
        if (!embedding.isArray() || embedding.isEmpty()) {
            throw new IllegalStateException("Empty embedding response");
        }
        float[] vector = new float[embedding.size()];
        for (int i = 0; i < embedding.size(); i++) {
            vector[i] = (float) embedding.get(i).asDouble();
        }
        return vector;
    }
}
