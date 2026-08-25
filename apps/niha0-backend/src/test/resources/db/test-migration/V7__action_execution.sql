-- Persist real post-CEO action execution outcomes (H2)
ALTER TABLE agent_actions ADD COLUMN IF NOT EXISTS execution_result TEXT;
ALTER TABLE agent_actions ADD COLUMN IF NOT EXISTS executed_at TIMESTAMP;
