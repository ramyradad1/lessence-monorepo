-- ============================================================
-- Trigger: Notify user when their order status changes
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  status_title TEXT;
  status_body  TEXT;
BEGIN
  -- Only fire when the status column actually changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'confirmed' THEN
        status_title := 'Order Confirmed ✓';
        status_body  := 'Your order #' || LEFT(NEW.id::text, 8) || ' has been confirmed.';
      WHEN 'processing' THEN
        status_title := 'Order Processing 🔄';
        status_body  := 'Your order #' || LEFT(NEW.id::text, 8) || ' is being prepared.';
      WHEN 'shipped' THEN
        status_title := 'Order Shipped 🚚';
        status_body  := 'Your order #' || LEFT(NEW.id::text, 8) || ' is on its way!';
      WHEN 'delivered' THEN
        status_title := 'Order Delivered 📦';
        status_body  := 'Your order #' || LEFT(NEW.id::text, 8) || ' has been delivered.';
      WHEN 'cancelled' THEN
        status_title := 'Order Cancelled';
        status_body  := 'Your order #' || LEFT(NEW.id::text, 8) || ' has been cancelled.';
      ELSE
        status_title := 'Order Update';
        status_body  := 'Your order #' || LEFT(NEW.id::text, 8) || ' status is now: ' || NEW.status;
    END CASE;

    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      NEW.user_id,
      'order_update',
      status_title,
      status_body,
      jsonb_build_object('order_id', NEW.id, 'status', NEW.status)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_order_status_notification ON public.orders;
CREATE TRIGGER trigger_order_status_notification
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_order_status_change();
