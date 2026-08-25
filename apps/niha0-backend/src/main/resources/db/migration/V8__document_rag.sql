-- Document chunks for keyword RAG (no vector DB required for MVP)
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    data_asset_id UUID NOT NULL REFERENCES company_data_assets(id) ON DELETE CASCADE,
    stored_asset_id UUID REFERENCES stored_assets(id) ON DELETE SET NULL,
    chunk_index INT NOT NULL DEFAULT 0,
    content TEXT NOT NULL,
    token_estimate INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_document_chunks_org ON document_chunks(organization_id);
CREATE INDEX idx_document_chunks_asset ON document_chunks(data_asset_id);
