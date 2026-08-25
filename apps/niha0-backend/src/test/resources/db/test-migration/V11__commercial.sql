-- Commercial billing, webhooks, MFA recovery (H2)
CREATE TABLE billing_checkouts (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  plan VARCHAR(32) NOT NULL,
  amount_cents INT NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'EUR',
  sumup_checkout_id VARCHAR(128),
  checkout_reference VARCHAR(128) NOT NULL UNIQUE,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  hosted_checkout_url VARCHAR(2048),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMP
);

CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY,
  webhook_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  payload_json TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  last_error TEXT,
  next_attempt_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMP
);

CREATE INDEX idx_webhook_deliveries_pending ON webhook_deliveries(status, next_attempt_at);

ALTER TABLE organizations ADD COLUMN billing_customer_ref VARCHAR(128);
ALTER TABLE users ADD COLUMN mfa_recovery_codes TEXT;
