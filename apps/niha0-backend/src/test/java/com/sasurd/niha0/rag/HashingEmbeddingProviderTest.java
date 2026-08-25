package com.sasurd.niha0.rag;

import com.sasurd.niha0.config.RagProperties;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class HashingEmbeddingProviderTest {

    @Test
    void sharedTokensProducePositiveSimilarity() {
        RagProperties props = new RagProperties();
        props.setEmbeddingDims(384);
        HashingEmbeddingProvider provider = new HashingEmbeddingProvider(props);

        float[] query = provider.embed("facture Dupont");
        float[] doc = provider.embed("""
                Rapport OptimusTest — facture FAC-2026-014 en retard.
                Client Maison Dupont, relance commerciale prévue.
                """);

        double dot = 0, normA = 0, normB = 0;
        for (int i = 0; i < query.length; i++) {
            dot += query[i] * doc[i];
            normA += query[i] * query[i];
            normB += doc[i] * doc[i];
        }
        double similarity = dot / (Math.sqrt(normA) * Math.sqrt(normB));
        assertThat(similarity).isGreaterThan(0);
    }
}
