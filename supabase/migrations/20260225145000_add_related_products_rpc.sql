-- Add missing get_related_products RPC for the RelatedProducts component

CREATE OR REPLACE FUNCTION get_related_products(
  p_product_id UUID,
  p_category_id UUID,
  p_price NUMERIC,
  p_scent_profiles TEXT[] DEFAULT '{}',
  p_limit INT DEFAULT 4
)
RETURNS SETOF products
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM products p
  WHERE p.id != p_product_id
    AND p.is_active = true
    AND (
      p.category_id = p_category_id
      OR p.price BETWEEN (p_price * 0.5) AND (p_price * 1.5)
    )
  ORDER BY 
    (p.category_id = p_category_id) DESC,
    ABS(p.price - p_price) ASC
  LIMIT p_limit;
END;
$$;
