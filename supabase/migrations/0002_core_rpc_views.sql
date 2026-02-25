-- 1) Advanced Analytics View for Admin panel
CREATE OR REPLACE VIEW public.order_summary_view AS
SELECT 
    o.id AS order_id,
    o.order_number,
    o.user_id,
    o.status,
    o.subtotal,
    o.shipping_fee,
    o.discount_amount,
    o.total_amount,
    o.created_at,
    COUNT(oi.id) AS total_items,
    SUM(oi.quantity) AS total_quantity
FROM public.orders o
LEFT JOIN public.order_items oi ON o.id = oi.order_id
GROUP BY o.id;

-- 2) Helper RPC to handle cart emptying (can be called securely from client or edge function)
CREATE OR REPLACE FUNCTION public.empty_cart(target_cart_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verify the user owns the cart, or is an admin, or the cart has the same session_id (if guest cart logic extended)
    IF EXISTS (
        SELECT 1 FROM public.carts 
        WHERE id = target_cart_id 
        AND (user_id = auth.uid() OR public.is_super_admin())
    ) THEN
        DELETE FROM public.cart_items WHERE cart_id = target_cart_id;
    ELSE
        RAISE EXCEPTION 'Not authorized to empty this cart';
    END IF;
END;
$$;
