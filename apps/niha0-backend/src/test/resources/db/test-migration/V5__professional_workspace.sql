-- Professional workspace / onboarding / branding
ALTER TABLE organizations ADD COLUMN description VARCHAR(4000);
ALTER TABLE organizations ADD COLUMN website VARCHAR(512);
ALTER TABLE organizations ADD COLUMN country VARCHAR(120);
ALTER TABLE organizations ADD COLUMN city VARCHAR(120);
ALTER TABLE organizations ADD COLUMN company_size VARCHAR(64);
ALTER TABLE organizations ADD COLUMN professional_email VARCHAR(255);
ALTER TABLE organizations ADD COLUMN slogan VARCHAR(255);
ALTER TABLE organizations ADD COLUMN logo_url VARCHAR(1000000);
ALTER TABLE organizations ADD COLUMN onboarding_status VARCHAR(32) DEFAULT 'COMPLETED';
ALTER TABLE organizations ADD COLUMN workspace_config VARCHAR(1000000);

UPDATE organizations SET onboarding_status = 'COMPLETED' WHERE onboarding_status IS NULL;

CREATE TABLE company_data_assets (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    file_type VARCHAR(64) NOT NULL,
    mime_type VARCHAR(128),
    size_bytes BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'IMPORTED',
    processing_status VARCHAR(64) NOT NULL DEFAULT 'PENDING_AI',
    description VARCHAR(4000),
    category VARCHAR(128),
    storage_reference VARCHAR(1000000),
    linked_agent_ids VARCHAR(2000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_company_data_assets_org ON company_data_assets(organization_id);
