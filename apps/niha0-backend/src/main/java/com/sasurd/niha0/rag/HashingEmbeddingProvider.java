package com.sasurd.niha0.rag;

import com.sasurd.niha0.config.RagProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

/**
 * Deterministic pseudo-embeddings from token hashes — local/dev without external API.
 */
@Service
@ConditionalOnProperty(name = "niha0.rag.embedding-provider", havingValue = "hash", matchIfMissing = true)
public class HashingEmbeddingProvider implements EmbeddingProvider {

    private final int dims;

    public HashingEmbeddingProvider(RagProperties ragProperties) {
        this.dims = Math.max(8, ragProperties.getEmbeddingDims());
    }

    @Override
    public float[] embed(String text) {
        float[] vector = new float[dims];
        if (text == null || text.isBlank()) {
            return vector;
        }
        for (String token : text.toLowerCase(Locale.ROOT).split("[^\\p{L}\\p{N}]+")) {
            if (token.length() < 2) continue;
            int hash = stableHash(token);
            int primary = Math.floorMod(hash, dims);
            int secondary = Math.floorMod(hash * 31 + 17, dims);
            vector[primary] += 1.0f;
            vector[secondary] += 0.5f;
        }
        normalize(vector);
        return vector;
    }

    @Override
    public boolean isDemo() {
        return true;
    }

    private static int stableHash(String token) {
        byte[] bytes = token.getBytes(StandardCharsets.UTF_8);
        int h = 0x811C9DC5;
        for (byte b : bytes) {
            h ^= b;
            h *= 0x01000193;
        }
        return h;
    }

    private static void normalize(float[] vector) {
        double norm = 0;
        for (float v : vector) norm += v * v;
        if (norm <= 0) return;
        float scale = (float) (1.0 / Math.sqrt(norm));
        for (int i = 0; i < vector.length; i++) {
            vector[i] *= scale;
        }
    }
}
