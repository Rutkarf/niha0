package com.sasurd.niha0.rag;

/**
 * Produces dense vector embeddings for RAG chunk indexing and query matching.
 */
public interface EmbeddingProvider {

    float[] embed(String text);

    /** True when embeddings are deterministic/demo (not from a real model). */
    boolean isDemo();
}
