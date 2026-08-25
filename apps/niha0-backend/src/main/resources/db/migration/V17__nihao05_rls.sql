-- RLS safety net for NIHAO_05 OS layer tables (V16)

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'agent_runtime_runs','agent_runtime_steps','agent_memories',
    'chat_threads','chat_messages','guardrail_events','tool_sandbox_logs',
    'agent_eval_metrics','pim_products','pim_variants',
    'agent_definitions','marketplace_listings','marketplace_installs'
  ]
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
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
