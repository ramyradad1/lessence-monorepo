-- 1. Create a composite index for cart items pagination / ordering
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_created_at ON public.cart_items(cart_id, created_at ASC);

-- 2. Create a composite index for favorites user / created_at ordering (if the storefront fetches sorted favorites)
CREATE INDEX IF NOT EXISTS idx_favorites_user_created_at ON public.favorites(user_id, created_at DESC);
