package com.sasurd.niha0.rag;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;

final class EmbeddingJson {

    private static final ObjectMapper JSON = new ObjectMapper();

    private EmbeddingJson() {}

    static String toJson(float[] embedding) {
        if (embedding == null || embedding.length == 0) return null;
        try {
            return JSON.writeValueAsString(embedding);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize embedding", e);
        }
    }

    static float[] fromJson(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            List<Double> values = JSON.readValue(json, new TypeReference<>() {});
            if (values == null || values.isEmpty()) return null;
            float[] out = new float[values.size()];
            for (int i = 0; i < values.size(); i++) {
                out[i] = values.get(i).floatValue();
            }
            return out;
        } catch (Exception e) {
            return null;
        }
    }
}
