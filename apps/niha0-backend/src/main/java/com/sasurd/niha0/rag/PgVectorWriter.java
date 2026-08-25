package com.sasurd.niha0.rag;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Dual-writes float embeddings into pgvector column when enabled (Postgres only).
 */
@Component
public class PgVectorWriter {

    private final JdbcTemplate jdbcTemplate;
    private final boolean enabled;

    public PgVectorWriter(JdbcTemplate jdbcTemplate,
                          @Value("${niha0.rag.pgvector-enabled:false}") boolean enabled) {
        this.jdbcTemplate = jdbcTemplate;
        this.enabled = enabled;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void upsert(java.util.UUID chunkId, float[] embedding) {
        if (!enabled || chunkId == null || embedding == null || embedding.length == 0) {
            return;
        }
        try {
            jdbcTemplate.update(
                    "UPDATE document_chunks SET embedding = CAST(? AS vector) WHERE id = ?",
                    toVectorLiteral(embedding),
                    chunkId);
        } catch (Exception ignored) {
            // Extension missing or H2 — JSON path remains source of truth
        }
    }

    static String toVectorLiteral(float[] values) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < values.length; i++) {
            if (i > 0) sb.append(',');
            sb.append(values[i]);
        }
        sb.append(']');
        return sb.toString();
    }
}
