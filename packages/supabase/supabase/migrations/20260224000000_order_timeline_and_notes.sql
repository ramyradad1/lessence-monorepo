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
    -- Only log if status has changed
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        -- Try to get the current user ID if available in setting
        -- Note: In Supabase, auth.uid() is available if triggered by an API request
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

-- Enable RLS
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_admin_notes ENABLE ROW LEVEL SECURITY;

-- order_status_history: Users can view history for their own orders
CREATE POLICY "Users can view own order status history" ON order_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_status_history.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- order_status_history: Admins can view everything
CREATE POLICY "Admins can view all order status history" ON order_status_history
    FOR SELECT USING (is_admin());

-- order_admin_notes: Only admins can view/manage
CREATE POLICY "Admins can manage order admin notes" ON order_admin_notes
    FOR ALL USING (is_admin());

-- 6. Initial History for Existing Orders
INSERT INTO order_status_history (order_id, status, created_at)
SELECT id, status, created_at FROM orders
ON CONFLICT DO NOTHING;
