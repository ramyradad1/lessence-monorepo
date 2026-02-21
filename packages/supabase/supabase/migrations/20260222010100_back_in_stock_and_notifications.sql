-- ============================================================
-- Back in Stock Subscriptions (Idempotent)
-- Table already exists from Supabase migration 20260221221746
-- ============================================================
CREATE TABLE IF NOT EXISTS public.back_in_stock_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    email TEXT,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'notified', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, product_id, variant_id)
);

ALTER TABLE public.back_in_stock_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'back_in_stock_subscriptions' AND policyname = 'Users can view own bis subscriptions') THEN
    CREATE POLICY "Users can view own bis subscriptions"
      ON public.back_in_stock_subscriptions FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'back_in_stock_subscriptions' AND policyname = 'Users can insert own bis subscriptions') THEN
    CREATE POLICY "Users can insert own bis subscriptions"
      ON public.back_in_stock_subscriptions FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'back_in_stock_subscriptions' AND policyname = 'Users can update own bis subscriptions') THEN
    CREATE POLICY "Users can update own bis subscriptions"
      ON public.back_in_stock_subscriptions FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'back_in_stock_subscriptions' AND policyname = 'Users can delete own bis subscriptions') THEN
    CREATE POLICY "Users can delete own bis subscriptions"
      ON public.back_in_stock_subscriptions FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'back_in_stock_subscriptions' AND policyname = 'Admins can manage all bis subscriptions') THEN
    CREATE POLICY "Admins can manage all bis subscriptions"
      ON public.back_in_stock_subscriptions FOR ALL
      USING (is_admin());
  END IF;
END $$;

-- ============================================================
-- Add data column to notifications if missing
-- ============================================================
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;

-- ============================================================
-- Trigger: notify subscribers when stock returns
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_back_in_stock()
RETURNS TRIGGER AS $$
DECLARE
    sub RECORD;
    product_name TEXT;
    variant_label TEXT;
BEGIN
    IF (OLD.stock_qty <= 0 AND NEW.stock_qty > 0) THEN
        SELECT name INTO product_name FROM public.products WHERE id = NEW.product_id;
        variant_label := NEW.size_ml || 'ml ' || NEW.concentration;

        FOR sub IN
            SELECT id, user_id FROM public.back_in_stock_subscriptions
            WHERE product_id = NEW.product_id
              AND (variant_id = NEW.id OR variant_id IS NULL)
              AND status = 'active'
        LOOP
            INSERT INTO public.notifications (user_id, type, title, body, data)
            VALUES (
                sub.user_id,
                'back_in_stock',
                product_name || ' is Back in Stock!',
                'The ' || variant_label || ' variant of ' || product_name || ' is available again.',
                jsonb_build_object('product_id', NEW.product_id, 'variant_id', NEW.id)
            );

            UPDATE public.back_in_stock_subscriptions
            SET status = 'notified'
            WHERE id = sub.id;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_back_in_stock ON public.product_variants;
CREATE TRIGGER trigger_back_in_stock
    AFTER UPDATE ON public.product_variants
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_back_in_stock();
