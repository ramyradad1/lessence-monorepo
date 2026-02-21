-- Abandoned Cart Recovery Migration (Idempotent)
-- notifications table already exists, only add cart_activity

-- 1. Cart Activity Table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recovery_status_enum') THEN
    CREATE TYPE recovery_status_enum AS ENUM ('none', 'reminder_1_sent', 'recovered');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.cart_activity (
  cart_id uuid REFERENCES public.carts ON DELETE CASCADE PRIMARY KEY,
  last_interaction_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  recovery_status recovery_status_enum DEFAULT 'none',
  reminder_sent_at timestamp with time zone
);

ALTER TABLE public.cart_activity ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cart_activity' AND policyname = 'Users can view own cart activity') THEN
    CREATE POLICY "Users can view own cart activity" ON public.cart_activity
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.carts
          WHERE carts.id = cart_activity.cart_id AND carts.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cart_activity' AND policyname = 'Service role can manage cart activity') THEN
    CREATE POLICY "Service role can manage cart activity" ON public.cart_activity
      FOR ALL USING (true);
  END IF;
END $$;

-- 2. Trigger to update last_interaction_at
CREATE OR REPLACE FUNCTION public.handle_cart_item_update()
RETURNS TRIGGER AS $$
DECLARE
  target_cart_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_cart_id := OLD.cart_id;
  ELSE
    target_cart_id := NEW.cart_id;
  END IF;

  INSERT INTO public.cart_activity (cart_id, last_interaction_at, recovery_status)
  VALUES (
    target_cart_id,
    timezone('utc'::text, now()),
    'none'
  )
  ON CONFLICT (cart_id) DO UPDATE SET
    last_interaction_at = timezone('utc'::text, now()),
    recovery_status = 'none',
    reminder_sent_at = null;
    
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to cart_items table
DROP TRIGGER IF EXISTS on_cart_item_change ON public.cart_items;
CREATE TRIGGER on_cart_item_change
  AFTER INSERT OR UPDATE OR DELETE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_cart_item_update();
