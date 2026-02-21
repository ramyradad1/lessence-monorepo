-- Migration: Related Products RPC

CREATE OR REPLACE FUNCTION get_related_products(
    p_product_id uuid,
    p_category_id uuid,
    p_price numeric,
    p_scent_profiles jsonb,
    p_limit integer default 4
)
RETURNS SETOF products AS $$
BEGIN
    RETURN QUERY
    SELECT p.*
    FROM products p
    -- Exclude the current product
    WHERE p.id != p_product_id
      AND p.is_active = true
    ORDER BY (
        -- Category Match (+30 points)
        (CASE WHEN p.category_id = p_category_id THEN 30 ELSE 0 END) +
        
        -- Price Proximity (+20 points if within 20%)
        (CASE WHEN p.price >= (p_price * 0.8) AND p.price <= (p_price * 1.2) THEN 20 ELSE 0 END) +
        
        -- Shared Scent Profiles (+10 points per match)
        COALESCE((
            SELECT COUNT(*)::integer * 10
            FROM jsonb_array_elements(p.scent_profiles) AS sp1(obj)
            JOIN jsonb_array_elements(p_scent_profiles) AS sp2(obj)
            ON (sp1.obj->>'name') = (sp2.obj->>'name')
        ), 0)
    ) DESC, 
    p.rating DESC NULLS LAST, 
    p.review_count DESC NULLS LAST
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
