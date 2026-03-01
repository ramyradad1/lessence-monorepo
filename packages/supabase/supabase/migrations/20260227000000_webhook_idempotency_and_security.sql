-- Webhook Idempotency & Security Hardening
-- Addresses: IDEMPOTENCY_STRATEGY.md, RLS_COVERAGE_MATRIX.md

-- 1. Create deduplication table for webhook events
CREATE TABLE IF NOT EXISTS handled_webhook_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider text NOT NULL,        -- 'stripe' or 'paymob'
  event_id text NOT NULL,        -- e.g., evt_12345 or transaction.id
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(provider, event_id)
);

-- RLS: Only service_role should access this table (Edge Functions use service_role)
ALTER TABLE handled_webhook_events ENABLE ROW LEVEL SECURITY;

-- 2. Prevent duplicate payment records per provider
-- Use IF NOT EXISTS pattern to avoid failure if constraint already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_provider_transaction'
  ) THEN
    ALTER TABLE payments ADD CONSTRAINT unique_provider_transaction UNIQUE (provider, transaction_id);
  END IF;
END $$;

-- 3. Remove the insecure client-side INSERT policy on orders
-- Orders should ONLY be created by Edge Functions using service_role key
-- This prevents malicious users from inserting orders with total_amount = 0
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
