-- Return Requests Migration (Idempotent)

-- Create updated_at helper function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create return_requests table
CREATE TABLE IF NOT EXISTS return_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'received', 'refunded', 'rejected')),
  reason TEXT NOT NULL,
  comment TEXT,
  admin_notes TEXT,
  media_urls JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create return_request_items table
CREATE TABLE IF NOT EXISTS return_request_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  return_request_id UUID REFERENCES return_requests(id) ON DELETE CASCADE NOT NULL,
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_request_items ENABLE ROW LEVEL SECURITY;

-- Policies for return_requests
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'return_requests' AND policyname = 'Users can view own return requests') THEN
    CREATE POLICY "Users can view own return requests" ON return_requests FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'return_requests' AND policyname = 'Users can create own return requests') THEN
    CREATE POLICY "Users can create own return requests" ON return_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'return_requests' AND policyname = 'Admins can manage all return requests') THEN
    CREATE POLICY "Admins can manage all return requests" ON return_requests FOR ALL USING (is_admin());
  END IF;
END $$;

-- Policies for return_request_items
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'return_request_items' AND policyname = 'Users can view own return request items') THEN
    CREATE POLICY "Users can view own return request items" ON return_request_items FOR SELECT USING (
      EXISTS (SELECT 1 FROM return_requests WHERE return_requests.id = return_request_items.return_request_id AND return_requests.user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'return_request_items' AND policyname = 'Users can create own return request items') THEN
    CREATE POLICY "Users can create own return request items" ON return_request_items FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM return_requests WHERE return_requests.id = return_request_items.return_request_id AND return_requests.user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'return_request_items' AND policyname = 'Admins can manage all return request items') THEN
    CREATE POLICY "Admins can manage all return request items" ON return_request_items FOR ALL USING (is_admin());
  END IF;
END $$;

-- Storage Bucket for return_media
INSERT INTO storage.buckets (id, name, public) VALUES ('return_media', 'return_media', true) ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Anyone can view return media') THEN
    CREATE POLICY "Anyone can view return media" ON storage.objects FOR SELECT USING (bucket_id = 'return_media');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated users can upload return media') THEN
    CREATE POLICY "Authenticated users can upload return media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'return_media' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Audit logging trigger for status changes
CREATE OR REPLACE FUNCTION log_return_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO admin_audit_logs (admin_id, action, table_name, record_id, changes)
    VALUES (auth.uid(), 'return_status_change', 'return_requests', NEW.id, jsonb_build_object('from', OLD.status, 'to', NEW.status));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_return_status_change ON return_requests;
CREATE TRIGGER on_return_status_change AFTER UPDATE ON return_requests FOR EACH ROW EXECUTE FUNCTION log_return_status_change();

-- updated_at trigger
DROP TRIGGER IF EXISTS set_return_requests_updated_at ON return_requests;
CREATE TRIGGER set_return_requests_updated_at BEFORE UPDATE ON return_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
