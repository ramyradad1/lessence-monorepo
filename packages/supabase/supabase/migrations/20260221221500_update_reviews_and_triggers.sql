-- Rename is_approved to is_hidden and default to false
ALTER TABLE reviews RENAME COLUMN is_approved TO is_hidden;
ALTER TABLE reviews ALTER COLUMN is_hidden SET DEFAULT false;

-- Add updated_at if not exists
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone default timezone('utc'::text, now()) not null;

-- Add verified purchase boolean
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_verified_purchase boolean DEFAULT false;

-- Drop old policies
DROP POLICY IF EXISTS "Approved reviews are readable by everyone" ON reviews;
DROP POLICY IF EXISTS "Users can create and update own reviews" ON reviews;

-- New reviews policies
CREATE POLICY "Reviews are readable by everyone unless hidden" ON reviews FOR SELECT USING (
  is_hidden = false OR auth.uid() = user_id OR is_admin() = true
);

-- Users can only insert a review if they have purchased the product (has an order item for it)
CREATE POLICY "Users can create review if verified purchase" ON reviews FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM orders
    JOIN order_items ON orders.id = order_items.order_id
    WHERE orders.user_id = auth.uid()
    AND order_items.product_id = reviews.product_id
    AND orders.status IN ('delivered', 'paid', 'processing', 'shipped')
  )
);

-- Trigger to recompute product stats
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_product_id UUID;
  v_count INT;
  v_avg NUMERIC;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_product_id := OLD.product_id;
  ELSE
    v_product_id := NEW.product_id;
  END IF;

  -- Calculate new stats for non-hidden reviews
  SELECT COUNT(*), COALESCE(AVG(rating), 0)
  INTO v_count, v_avg
  FROM reviews
  WHERE product_id = v_product_id AND is_hidden = false;

  -- Update the product
  UPDATE products
  SET rating = ROUND(v_avg, 2),
      review_count = v_count
  WHERE id = v_product_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_product_rating ON reviews;
CREATE TRIGGER trigger_update_product_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_product_rating();
