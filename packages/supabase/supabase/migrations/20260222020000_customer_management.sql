-- Customer Management (Idempotent)
-- phone column and admin_notes table already exist on Supabase

-- Add phone column to profiles (already exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;

-- Create admin_notes table (already exists)
CREATE TABLE IF NOT EXISTS admin_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  admin_id uuid REFERENCES auth.users ON DELETE SET NULL NOT NULL,
  note text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_notes' AND policyname = 'Admins can manage admin notes') THEN
    CREATE POLICY "Admins can manage admin notes" ON admin_notes FOR ALL USING (public.is_admin());
  END IF;
END $$;

-- Create customer_aggregates view
CREATE OR REPLACE VIEW customer_aggregates AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.avatar_url,
  p.role,
  p.phone,
  p.created_at,
  coalesce(agg.total_orders, 0)::int AS total_orders,
  coalesce(agg.total_spend, 0)::numeric(10,2) AS total_spend,
  agg.last_order_date
FROM profiles p
LEFT JOIN LATERAL (
  SELECT
    count(*)::int AS total_orders,
    sum(o.total_amount)::numeric(10,2) AS total_spend,
    max(o.created_at) AS last_order_date
  FROM orders o
  WHERE o.user_id = p.id
    AND o.status NOT IN ('cancelled', 'refunded')
) agg ON true;
