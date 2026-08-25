-- Extend role_permissions for operational roles (baseline MEMBER-like + domain tweaks)

INSERT INTO role_permissions (role_code, permission_code) VALUES
    ('SALES', 'agents.read'), ('SALES', 'marketplace.install'), ('SALES', 'chat.use'),
    ('MARKETING', 'agents.read'), ('MARKETING', 'marketplace.install'), ('MARKETING', 'chat.use'),
    ('ACCOUNTANT', 'agents.read'), ('ACCOUNTANT', 'chat.use'),
    ('SUPPORT', 'agents.read'), ('SUPPORT', 'marketplace.install'), ('SUPPORT', 'chat.use'),
    ('LEGAL', 'agents.read'), ('LEGAL', 'chat.use'),
    ('HR', 'agents.read'), ('HR', 'chat.use'),
    ('OPS', 'agents.read'), ('OPS', 'agents.write'), ('OPS', 'marketplace.install'),
    ('OPS', 'pim.write'), ('OPS', 'chat.use'), ('OPS', 'studio.edit')
ON CONFLICT DO NOTHING;
