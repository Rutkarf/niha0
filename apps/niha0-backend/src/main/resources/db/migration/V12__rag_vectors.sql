-- Incremental vector RAG: store embeddings as JSON float arrays (no pgvector required)
ALTER TABLE document_chunks ADD COLUMN embedding_json TEXT;
