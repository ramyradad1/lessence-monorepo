-- Migration: Price Drop Alerts (Idempotent)
-- Tables price_history and notifications already exist from Supabase migration 20260221220931
-- This migration ensures triggers and indexes are present

-- 1. price_history (CREATE IF NOT EXISTS - already exists)
CREATE TABLE IF NOT EXISTS public.price_history (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id    uuid REFERENCES public.products   ON DELETE CASCADE NOT NULL,
  variant_id    uuid REFERENCES public.product_variants ON DELETE CASCADE,
  old_price     numeric(10, 2) NOT NULL,
  new_price     numeric(10, 2) NOT NULL,
  changed_at    timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'price_history' AND policyname = 'Admins can view price_history') THEN
    CREATE POLICY "Admins can view price_history" ON public.price_history FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- 2. notifications (already exists - skip creation)
-- Just ensure policies exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Service role can insert notifications') THEN
    CREATE POLICY "Service role can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Admins can manage all notifications') THEN
    CREATE POLICY "Admins can manage all notifications" ON public.notifications FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- 3. Trigger on products price change
CREATE OR REPLACE FUNCTION public.fn_record_product_price_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.price IS DISTINCT FROM OLD.price THEN
    INSERT INTO public.price_history (product_id, variant_id, old_price, new_price)
    VALUES (NEW.id, NULL, OLD.price, NEW.price);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_product_price_history ON public.products;
CREATE TRIGGER trg_product_price_history
AFTER UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.fn_record_product_price_change();

-- 4. Trigger on product_variants price change
CREATE OR REPLACE FUNCTION public.fn_record_variant_price_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.price IS DISTINCT FROM OLD.price THEN
    INSERT INTO public.price_history (product_id, variant_id, old_price, new_price)
    VALUES (NEW.product_id, NEW.id, OLD.price, NEW.price);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_variant_price_history ON public.product_variants;
CREATE TRIGGER trg_variant_price_history
AFTER UPDATE ON public.product_variants
FOR EACH ROW EXECUTE FUNCTION public.fn_record_variant_price_change();

-- 5. Fan-out trigger: notify favorites on price drop
CREATE OR REPLACE FUNCTION public.fn_fan_out_price_drop_notifications()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_product_name  text;
  v_variant_label text;
  v_title         text;
  v_body          text;
BEGIN
  IF NEW.new_price >= NEW.old_price THEN
    RETURN NEW;
  END IF;
  SELECT name INTO v_product_name FROM public.products WHERE id = NEW.product_id;
  IF NEW.variant_id IS NOT NULL THEN
    SELECT CONCAT(size_ml::text, 'ml – ', concentration) INTO v_variant_label
    FROM public.product_variants WHERE id = NEW.variant_id;
    v_title := 'Price Drop on ' || v_product_name;
    v_body  := v_variant_label || ' dropped from $' || NEW.old_price::text || ' to $' || NEW.new_price::text || '!';
  ELSE
    v_title := 'Price Drop on ' || v_product_name;
    v_body  := 'Now $' || NEW.new_price::text || ' (was $' || NEW.old_price::text || '). Grab it while it lasts!';
  END IF;
  INSERT INTO public.notifications (user_id, type, title, body, product_id, variant_id, old_price, new_price)
  SELECT f.user_id, 'price_drop', v_title, v_body, NEW.product_id, NEW.variant_id, NEW.old_price, NEW.new_price
  FROM public.favorites f WHERE f.product_id = NEW.product_id;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_fan_out_price_drop_notifications ON public.price_history;
CREATE TRIGGER trg_fan_out_price_drop_notifications
AFTER INSERT ON public.price_history
FOR EACH ROW EXECUTE FUNCTION public.fn_fan_out_price_drop_notifications();

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread  ON public.notifications (user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_price_history_product ON public.price_history (product_id, changed_at DESC);
