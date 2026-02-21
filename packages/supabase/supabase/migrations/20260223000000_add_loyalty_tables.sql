-- Migration: Add loyalty tables and tier rules
-- Timestamp: 20260223000000

CREATE TABLE IF NOT EXISTS loyalty_accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_balance bigint NOT NULL DEFAULT 0,
  total_earned bigint NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid NOT NULL REFERENCES loyalty_accounts(id) ON DELETE CASCADE,
  order_id uuid NULL REFERENCES orders(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('earned','redeemed')),
  points bigint NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loyalty_tier_rules (
  tier text PRIMARY KEY,
  min_points bigint NOT NULL,
  benefit_description text
);

-- RLS policies for loyalty_accounts
CREATE POLICY "Allow user to view own account"
  ON loyalty_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow user to update own account"
  ON loyalty_accounts
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for loyalty_transactions
CREATE POLICY "Allow user to view own transactions"
  ON loyalty_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM loyalty_accounts la WHERE la.id = loyalty_transactions.account_id AND la.user_id = auth.uid())
  );

CREATE POLICY "Allow user to insert transactions for own account"
  ON loyalty_transactions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM loyalty_accounts la WHERE la.id = NEW.account_id AND la.user_id = auth.uid())
  );

-- Enable row level security
ALTER TABLE loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tier_rules ENABLE ROW LEVEL SECURITY;

-- Insert default tier rules (example)
INSERT INTO loyalty_tier_rules (tier, min_points, benefit_description) VALUES
  ('Silver', 1000, '5% discount on orders'),
  ('Gold', 5000, '10% discount on orders'),
  ('VIP', 10000, '15% discount on orders')
ON CONFLICT (tier) DO NOTHING;
