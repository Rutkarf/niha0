-- Object storage metadata (test mirror of V6)
CREATE TABLE stored_assets (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    storage_key VARCHAR(512) NOT NULL,
    original_filename VARCHAR(512) NOT NULL,
    content_type VARCHAR(128) NOT NULL,
    size_bytes BIGINT NOT NULL DEFAULT 0,
    kind VARCHAR(64) NOT NULL,
    processing_status VARCHAR(64) NOT NULL DEFAULT 'UPLOADED',
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_stored_assets_storage_key UNIQUE (storage_key)
);

CREATE INDEX idx_stored_assets_org ON stored_assets(organization_id);

ALTER TABLE organizations ADD COLUMN logo_asset_id UUID REFERENCES stored_assets(id) ON DELETE SET NULL;

ALTER TABLE company_data_assets ADD COLUMN stored_asset_id UUID REFERENCES stored_assets(id) ON DELETE SET NULL;

UPDATE company_data_assets
SET processing_status = 'UPLOADED'
WHERE processing_status IS NULL OR processing_status = 'PENDING_AI';
