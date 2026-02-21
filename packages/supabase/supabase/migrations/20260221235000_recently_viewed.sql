-- Create recently_viewed table
CREATE TABLE IF NOT EXISTS public.recently_viewed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- RLS Policies
ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own recently viewed items"
ON public.recently_viewed
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to limit recently viewed per user (keep last 20)
CREATE OR REPLACE FUNCTION public.limit_recently_viewed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.recently_viewed
  WHERE user_id = NEW.user_id
    AND id NOT IN (
      SELECT id FROM public.recently_viewed
      WHERE user_id = NEW.user_id
      ORDER BY viewed_at DESC
      LIMIT 20
    );
  RETURN NEW;
END;
$$;

-- Trigger to run after insert or update on recently_viewed
DROP TRIGGER IF EXISTS tr_limit_recently_viewed ON public.recently_viewed;
CREATE TRIGGER tr_limit_recently_viewed
AFTER INSERT OR UPDATE ON public.recently_viewed
FOR EACH ROW
EXECUTE FUNCTION public.limit_recently_viewed();

-- Index for efficient querying by user and time
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user_time 
ON public.recently_viewed(user_id, viewed_at DESC);
