-- NIHAO_05 Phases 2–6 : runtime, mémoire, chat, gouvernance, PIM, studio/marketplace

-- Phase 2: agent runtime runs (state graph)
CREATE TABLE agent_runtime_runs (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    graph_name VARCHAR(120) NOT NULL DEFAULT 'default',
    status VARCHAR(64) NOT NULL DEFAULT 'RUNNING',
    current_node VARCHAR(120),
    state_json TEXT NOT NULL DEFAULT '{}',
    interrupt_reason TEXT,
    model_provider VARCHAR(64) NOT NULL DEFAULT 'mock',
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE agent_runtime_steps (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    run_id UUID NOT NULL REFERENCES agent_runtime_runs(id) ON DELETE CASCADE,
    node_name VARCHAR(120) NOT NULL,
    step_index INT NOT NULL DEFAULT 0,
    input_json TEXT,
    output_json TEXT,
    status VARCHAR(64) NOT NULL DEFAULT 'DONE',
    latency_ms INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Phase 2: memory layers
CREATE TABLE agent_memories (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    scope VARCHAR(32) NOT NULL,
    scope_ref VARCHAR(120),
    key_name VARCHAR(160) NOT NULL,
    content TEXT NOT NULL,
    metadata_json TEXT,
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- Phase 2: chat
CREATE TABLE chat_threads (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL DEFAULT 'Conversation',
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    thread_id UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL,
    content TEXT NOT NULL,
    metadata_json TEXT,
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Phase 3: permissions catalog
CREATE TABLE permissions (
    id UUID PRIMARY KEY,
    code VARCHAR(80) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL
);

CREATE TABLE role_permissions (
    role_code VARCHAR(64) NOT NULL,
    permission_code VARCHAR(80) NOT NULL REFERENCES permissions(code) ON DELETE CASCADE,
    PRIMARY KEY (role_code, permission_code)
);

CREATE TABLE guardrail_events (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL,
    severity VARCHAR(32) NOT NULL DEFAULT 'INFO',
    source VARCHAR(64) NOT NULL,
    detail TEXT,
    blocked BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE tool_sandbox_logs (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    tool_name VARCHAR(120) NOT NULL,
    allowed BOOLEAN NOT NULL,
    duration_ms INT NOT NULL DEFAULT 0,
    detail TEXT,
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE agent_eval_metrics (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    recommendations INT NOT NULL DEFAULT 0,
    approvals INT NOT NULL DEFAULT 0,
    rejections INT NOT NULL DEFAULT 0,
    escalations INT NOT NULL DEFAULT 0,
    avg_latency_ms INT NOT NULL DEFAULT 0,
    estimated_cost_cents INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_agent_eval_org_date UNIQUE (organization_id, metric_date)
);

-- Phase 4: PIM
CREATE TABLE pim_products (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    sku VARCHAR(64) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(120),
    status VARCHAR(64) NOT NULL DEFAULT 'DRAFT',
    attributes_json TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_pim_products_org_sku UNIQUE (organization_id, sku)
);

CREATE TABLE pim_variants (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES pim_products(id) ON DELETE CASCADE,
    sku VARCHAR(64) NOT NULL,
    name VARCHAR(200) NOT NULL,
    price_cents INT NOT NULL DEFAULT 0,
    currency VARCHAR(8) NOT NULL DEFAULT 'EUR',
    status VARCHAR(64) NOT NULL DEFAULT 'ACTIVE',
    attributes_json TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_pim_variants_org_sku UNIQUE (organization_id, sku)
);

-- Phase 5: studio definitions + marketplace
CREATE TABLE agent_definitions (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    slug VARCHAR(120) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    graph_json TEXT NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
    version INT NOT NULL DEFAULT 1,
    visibility VARCHAR(32) NOT NULL DEFAULT 'PRIVATE',
    status VARCHAR(64) NOT NULL DEFAULT 'DRAFT',
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_agent_definitions_org_slug_ver UNIQUE (organization_id, slug, version)
);

CREATE TABLE marketplace_listings (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    definition_id UUID NOT NULL REFERENCES agent_definitions(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    summary TEXT,
    visibility VARCHAR(32) NOT NULL DEFAULT 'PRIVATE',
    category VARCHAR(80) NOT NULL DEFAULT 'agent',
    install_count INT NOT NULL DEFAULT 0,
    published_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE marketplace_installs (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    installed_by UUID,
    config_json TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_marketplace_install_org_listing UNIQUE (organization_id, listing_id)
);

CREATE INDEX idx_agent_runtime_runs_org ON agent_runtime_runs(organization_id);
CREATE INDEX idx_agent_runtime_steps_run ON agent_runtime_steps(run_id);
CREATE INDEX idx_agent_memories_org_scope ON agent_memories(organization_id, scope);
CREATE INDEX idx_chat_threads_org ON chat_threads(organization_id);
CREATE INDEX idx_chat_messages_thread ON chat_messages(thread_id);
CREATE INDEX idx_guardrail_events_org ON guardrail_events(organization_id);
CREATE INDEX idx_pim_products_org ON pim_products(organization_id);
CREATE INDEX idx_marketplace_listings_vis ON marketplace_listings(visibility);

-- Seed permissions
INSERT INTO permissions (id, code, description) VALUES
    ('b1000000-0000-0000-0000-000000000001', 'agents.read', 'Lire agents et runs'),
    ('b1000000-0000-0000-0000-000000000002', 'agents.write', 'Créer/exécuter agents'),
    ('b1000000-0000-0000-0000-000000000003', 'marketplace.publish', 'Publier sur marketplace'),
    ('b1000000-0000-0000-0000-000000000004', 'marketplace.install', 'Installer depuis marketplace'),
    ('b1000000-0000-0000-0000-000000000005', 'governance.admin', 'Admin gouvernance'),
    ('b1000000-0000-0000-0000-000000000006', 'pim.write', 'Écrire catalogue PIM'),
    ('b1000000-0000-0000-0000-000000000007', 'chat.use', 'Utiliser le chat assistant'),
    ('b1000000-0000-0000-0000-000000000008', 'studio.edit', 'Éditer studio agents');

INSERT INTO role_permissions (role_code, permission_code) VALUES
    ('OWNER', 'agents.read'), ('OWNER', 'agents.write'), ('OWNER', 'marketplace.publish'),
    ('OWNER', 'marketplace.install'), ('OWNER', 'governance.admin'), ('OWNER', 'pim.write'),
    ('OWNER', 'chat.use'), ('OWNER', 'studio.edit'),
    ('ADMIN', 'agents.read'), ('ADMIN', 'agents.write'), ('ADMIN', 'marketplace.publish'),
    ('ADMIN', 'marketplace.install'), ('ADMIN', 'governance.admin'), ('ADMIN', 'pim.write'),
    ('ADMIN', 'chat.use'), ('ADMIN', 'studio.edit'),
    ('MANAGER', 'agents.read'), ('MANAGER', 'agents.write'), ('MANAGER', 'marketplace.install'),
    ('MANAGER', 'pim.write'), ('MANAGER', 'chat.use'), ('MANAGER', 'studio.edit'),
    ('MEMBER', 'agents.read'), ('MEMBER', 'marketplace.install'), ('MEMBER', 'chat.use'),
    ('VIEWER', 'agents.read'), ('VIEWER', 'chat.use');

-- Seed PIM demo (OptimusTest)
INSERT INTO pim_products (id, organization_id, sku, name, description, category, status, attributes_json, created_at, updated_at)
VALUES
    ('b2000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
     'PIM-100', 'Bureau Solarpunk', 'Bureau modulable thème Solarpunk', 'Mobilier', 'ACTIVE',
     '{"material":"bois","theme":"solarpunk"}', NOW(), NOW()),
    ('b2000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
     'PIM-200', 'Lampe Cyberpunk', 'Éclairage néon bureau IA', 'Éclairage', 'ACTIVE',
     '{"color":"neon-cyan","theme":"cyberpunk"}', NOW(), NOW());

INSERT INTO pim_variants (id, organization_id, product_id, sku, name, price_cents, currency, status, created_at)
VALUES
    ('b2100000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
     'b2000000-0000-0000-0000-000000000001', 'PIM-100-STD', 'Standard', 24900, 'EUR', 'ACTIVE', NOW()),
    ('b2100000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
     'b2000000-0000-0000-0000-000000000001', 'PIM-100-PRO', 'Pro', 39900, 'EUR', 'ACTIVE', NOW());

INSERT INTO agent_definitions (id, organization_id, slug, name, description, graph_json, version, visibility, status, created_at, updated_at)
VALUES
    ('b3000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
     'support-triage', 'Support Triage', 'Template triage tickets',
     '{"nodes":[{"id":"start","type":"input"},{"id":"classify","type":"llm"},{"id":"escalate","type":"human"},{"id":"end","type":"output"}],"edges":[{"from":"start","to":"classify"},{"from":"classify","to":"escalate"},{"from":"escalate","to":"end"}]}',
     1, 'PRIVATE', 'PUBLISHED', NOW(), NOW());

INSERT INTO marketplace_listings (id, organization_id, definition_id, title, summary, visibility, category, install_count, published_at, created_at)
VALUES
    ('b4000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
     'b3000000-0000-0000-0000-000000000001', 'Support Triage v1',
     'Agent de triage support avec escalation humaine', 'PRIVATE', 'agent', 0, NOW(), NOW());
