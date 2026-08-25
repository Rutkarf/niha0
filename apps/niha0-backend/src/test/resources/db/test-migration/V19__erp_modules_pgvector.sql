-- V19 H2-compatible: ERP modules + erp.write (no pgvector extension)

CREATE TABLE IF NOT EXISTS erp_items (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    module VARCHAR(16) NOT NULL,
    code VARCHAR(64) NOT NULL,
    title VARCHAR(200) NOT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'DRAFT',
    details_json TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_erp_items_org_module_code UNIQUE (organization_id, module, code)
);

CREATE INDEX IF NOT EXISTS idx_erp_items_org_module ON erp_items (organization_id, module);

INSERT INTO permissions (id, code, description) VALUES
    ('b1000000-0000-0000-0000-000000000009', 'erp.write', 'Écrire modules ERP (CMS/SCM/MRP/ETL/EDI)');

INSERT INTO role_permissions (role_code, permission_code) VALUES
    ('OWNER', 'erp.write'),
    ('ADMIN', 'erp.write'),
    ('MANAGER', 'erp.write'),
    ('OPS', 'erp.write');
