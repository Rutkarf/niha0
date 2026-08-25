-- V19: ERP modules REAL + pgvector (Postgres) + RBAC erp.write
-- H2 tests use a mirror without CREATE EXTENSION (see test-migration).

CREATE TABLE IF NOT EXISTS erp_items (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    module VARCHAR(16) NOT NULL,
    code VARCHAR(64) NOT NULL,
    title VARCHAR(200) NOT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'DRAFT',
    details_json TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_erp_items_org_module_code UNIQUE (organization_id, module, code)
);

CREATE INDEX IF NOT EXISTS idx_erp_items_org_module ON erp_items (organization_id, module);

INSERT INTO permissions (id, code, description) VALUES
    ('b1000000-0000-0000-0000-000000000009', 'erp.write', 'Écrire modules ERP (CMS/SCM/MRP/ETL/EDI)')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_code, permission_code) VALUES
    ('OWNER', 'erp.write'),
    ('ADMIN', 'erp.write'),
    ('MANAGER', 'erp.write'),
    ('OPS', 'erp.write')
ON CONFLICT DO NOTHING;

-- pgvector ANN column. Official postgres:17-alpine has no vector.control;
-- skip quietly so local Flyway can proceed (RAG_PGVECTOR_ENABLED=false).
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
    ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS embedding vector(384);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'pgvector unavailable, skipping embedding column: %', SQLERRM;
END
$$;
