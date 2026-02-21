-- Order Timeline and Admin Notes Migration

-- 1. Order Status History Table
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL,
    changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Order Admin Notes Table
CREATE TABLE IF NOT EXISTS order_admin_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Trigger Function for Status Logging
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_admin_id UUID;
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        BEGIN
            v_admin_id := auth.uid();
        EXCEPTION WHEN OTHERS THEN
            v_admin_id := NULL;
        END;

        INSERT INTO order_status_history (order_id, status, changed_by)
        VALUES (NEW.id, NEW.status, v_admin_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Apply Trigger to Orders Table
DROP TRIGGER IF EXISTS on_order_status_change ON orders;
CREATE TRIGGER on_order_status_change
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    EXECUTE FUNCTION log_order_status_change();

-- 5. RLS Policies
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_admin_notes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_status_history' AND policyname = 'Users can view own order status history') THEN
    CREATE POLICY "Users can view own order status history" ON order_status_history
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM orders
                WHERE orders.id = order_status_history.order_id
                AND orders.user_id = auth.uid()
            )
        );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_status_history' AND policyname = 'Admins can view all order status history') THEN
    CREATE POLICY "Admins can view all order status history" ON order_status_history
        FOR SELECT USING (is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_admin_notes' AND policyname = 'Admins can manage order admin notes') THEN
    CREATE POLICY "Admins can manage order admin notes" ON order_admin_notes
        FOR ALL USING (is_admin());
  END IF;
END $$;

-- 6. Initial History for Existing Orders (idempotent)
INSERT INTO order_status_history (order_id, status, created_at)
SELECT id, status, created_at FROM orders
WHERE NOT EXISTS (
    SELECT 1 FROM order_status_history osh WHERE osh.order_id = orders.id
);
