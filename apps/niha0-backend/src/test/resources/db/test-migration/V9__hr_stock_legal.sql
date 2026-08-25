-- HR / Stock domain tables + legal seed enrichment (H2)
CREATE TABLE employees (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    first_name VARCHAR(120) NOT NULL,
    last_name VARCHAR(120) NOT NULL,
    email VARCHAR(255),
    job_title VARCHAR(160),
    department VARCHAR(120),
    status VARCHAR(64) NOT NULL DEFAULT 'ACTIVE',
    hired_at DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE leave_requests (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(64) NOT NULL DEFAULT 'ANNUAL',
    status VARCHAR(64) NOT NULL DEFAULT 'PENDING',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days INT NOT NULL DEFAULT 1,
    reason TEXT,
    decided_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE stock_items (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    sku VARCHAR(64) NOT NULL,
    name VARCHAR(200) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    reorder_level INT NOT NULL DEFAULT 10,
    unit VARCHAR(32) NOT NULL DEFAULT 'unit',
    location VARCHAR(120),
    status VARCHAR(64) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_stock_items_org_sku UNIQUE (organization_id, sku)
);

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    stock_item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
    movement_type VARCHAR(32) NOT NULL,
    quantity INT NOT NULL,
    note TEXT,
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_employees_org ON employees(organization_id);
CREATE INDEX idx_leave_requests_org ON leave_requests(organization_id);
CREATE INDEX idx_stock_items_org ON stock_items(organization_id);
CREATE INDEX idx_stock_movements_org ON stock_movements(organization_id);

INSERT INTO contracts (id, organization_id, title, category, status, start_date, end_date, content, created_at)
VALUES
    ('a6000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
     'Contrat CTR-09 — Maison Dupont', 'CLIENT', 'ACTIVE', '2025-06-01', '2026-09-15',
     'Contrat de service annuel. Échéance de renouvellement à J+14.', NOW()),
    ('a6000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
     'NDA Partenaire TechNova', 'NDA', 'ACTIVE', '2026-01-10', '2027-01-10',
     'Accord de confidentialité bilatéral.', NOW());

INSERT INTO employees (id, organization_id, first_name, last_name, email, job_title, department, status, hired_at, created_at)
VALUES
    ('a7000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
     'Léa', 'Moreau', 'lea.moreau@optimustest.fr', 'Responsable RH', 'RH', 'ACTIVE', '2023-03-01', NOW()),
    ('a7000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
     'Karim', 'Benali', 'karim.benali@optimustest.fr', 'Commercial', 'Ventes', 'ACTIVE', '2024-01-15', NOW());

INSERT INTO leave_requests (id, organization_id, employee_id, leave_type, status, start_date, end_date, days, reason, created_at, updated_at)
VALUES
    ('a7100000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
     'a7000000-0000-0000-0000-000000000001', 'ANNUAL', 'PENDING', '2026-09-01', '2026-09-05', 5,
     'Congés d''été', NOW(), NOW());

INSERT INTO stock_items (id, organization_id, sku, name, quantity, reorder_level, unit, location, status, created_at, updated_at)
VALUES
    ('a8000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
     'SKU-42', 'Carton emballage premium', 8, 50, 'unit', 'A-12', 'ACTIVE', NOW(), NOW()),
    ('a8000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
     'SKU-17', 'Toner laser noir', 42, 20, 'unit', 'B-03', 'ACTIVE', NOW(), NOW());
