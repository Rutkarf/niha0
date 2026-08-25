-- Phase C: PostgreSQL Row Level Security safety net (app still filters by organization_id).
-- Session GUC app.organization_id is set by TenantRlsSupport after JWT auth.
-- Bypass when GUC is empty (migrations, admin jobs, webhooks without tenant).

DO $$
BEGIN
  -- Enable RLS on core tenant tables
  ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
  ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
  ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
  ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
  ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
  ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
  ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
  ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
  ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
  ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE stored_assets ENABLE ROW LEVEL SECURITY;
  ALTER TABLE company_data_assets ENABLE ROW LEVEL SECURITY;
  ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
  ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'RLS skipped missing table — continue';
END $$;

-- Force RLS for table owner as well (defense in depth)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'customers','contacts','leads','opportunities','tasks',
    'invoices','quotes','payments','tickets',
    'agents','agent_actions','stored_assets','company_data_assets',
    'employees','contracts'
  ]
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXCEPTION WHEN undefined_table THEN
      NULL;
    END;
  END LOOP;
END $$;

-- Policies: allow all when GUC unset (Flyway / local tools); else match organization_id
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'customers','contacts','leads','opportunities','tasks',
    'invoices','quotes','payments','tickets',
    'agents','agent_actions','stored_assets','company_data_assets',
    'employees','contracts'
  ]
  LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
      EXECUTE format(
        'CREATE POLICY tenant_isolation ON %I
           USING (
             current_setting(''app.organization_id'', true) IS NULL
             OR current_setting(''app.organization_id'', true) = ''''
             OR organization_id::text = current_setting(''app.organization_id'', true)
           )
           WITH CHECK (
             current_setting(''app.organization_id'', true) IS NULL
             OR current_setting(''app.organization_id'', true) = ''''
             OR organization_id::text = current_setting(''app.organization_id'', true)
           )', t);
    EXCEPTION WHEN undefined_table THEN
      NULL;
    END;
  END LOOP;
END $$;
