-- Add low_stock_threshold to products and variants
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;

-- Create admin_notifications table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  reference_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Admins can manage all notifications
CREATE POLICY "Admins can manage notifications" ON public.admin_notifications FOR ALL USING (
  is_admin()
);

-- Function to handle variant stock updates
CREATE OR REPLACE FUNCTION check_variant_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- If stock drops to or below threshold, create a notification
  IF NEW.stock_qty <= NEW.low_stock_threshold AND (OLD.stock_qty > OLD.low_stock_threshold OR OLD.stock_qty IS NULL) THEN
    -- Check if there's already an unread notification for this variant
    IF NOT EXISTS (
      SELECT 1 FROM public.admin_notifications 
      WHERE reference_id = NEW.id AND type = 'low_stock' AND is_read = false
    ) THEN
      INSERT INTO public.admin_notifications (type, message, reference_id)
      VALUES (
        'low_stock', 
        'Variant stock is low (' || NEW.stock_qty || ' remaining) for variant ' || NEW.id,
        NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for variant stock updates
DROP TRIGGER IF EXISTS trigger_check_variant_low_stock ON public.product_variants;
CREATE TRIGGER trigger_check_variant_low_stock
  AFTER UPDATE OF stock_qty, low_stock_threshold ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION check_variant_low_stock();

-- Note: We only add trigger to `product_variants` as stock is managed there.
-- We could also monitor `inventory` table if `products` without variants share that table.
-- Let's add a trigger to `inventory` table just in case base products use it.

CREATE OR REPLACE FUNCTION check_inventory_low_stock()
RETURNS TRIGGER AS $$
DECLARE
  prod_threshold INTEGER;
  prod_name TEXT;
BEGIN
  -- Get the threshold from the parent product
  SELECT low_stock_threshold, name INTO prod_threshold, prod_name FROM public.products WHERE id = NEW.product_id;
  
  -- If stock drops to or below threshold, create a notification
  IF NEW.quantity_available <= prod_threshold AND (OLD.quantity_available > prod_threshold OR OLD.quantity_available IS NULL) THEN
    -- Check if there's already an unread notification for this product/size
    IF NOT EXISTS (
      SELECT 1 FROM public.admin_notifications 
      WHERE reference_id = NEW.product_id AND type = 'low_stock' AND is_read = false AND message LIKE '%' || NEW.size || '%'
    ) THEN
      INSERT INTO public.admin_notifications (type, message, reference_id)
      VALUES (
        'low_stock', 
        'Product stock is low (' || NEW.quantity_available || ' remaining) for ' || prod_name || ' (Size: ' || NEW.size || ')',
        NEW.product_id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for inventory updates
DROP TRIGGER IF EXISTS trigger_check_inventory_low_stock ON public.inventory;
CREATE TRIGGER trigger_check_inventory_low_stock
  AFTER UPDATE OF quantity_available ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION check_inventory_low_stock();
