-- Update search_products to support bilingual fields

CREATE OR REPLACE FUNCTION search_products(
    search_query TEXT DEFAULT NULL,
    category_slugs TEXT[] DEFAULT NULL,
    gender_targets TEXT[] DEFAULT NULL,
    sizes INTEGER[] DEFAULT NULL,
    concentrations TEXT[] DEFAULT NULL,
    min_price NUMERIC DEFAULT NULL,
    max_price NUMERIC DEFAULT NULL,
    in_stock_only BOOLEAN DEFAULT FALSE,
    min_rating NUMERIC DEFAULT NULL,
    sort_by TEXT DEFAULT 'newest'
)
RETURNS SETOF products AS $$
BEGIN
    RETURN QUERY
    WITH filtered_variants AS (
        SELECT pv.product_id, 
               MIN(pv.price) as min_variant_price, 
               MAX(pv.price) as max_variant_price, 
               SUM(pv.stock_qty) as total_stock
        FROM product_variants pv
        WHERE pv.is_active = true
        AND (sizes IS NULL OR array_length(sizes, 1) IS NULL OR pv.size_ml = ANY(sizes))
        AND (concentrations IS NULL OR array_length(concentrations, 1) IS NULL OR pv.concentration = ANY(concentrations))
        GROUP BY pv.product_id
    ),
    legacy_inventory AS (
        SELECT i.product_id, SUM(i.quantity_available) as total_stock
        FROM inventory i
        GROUP BY i.product_id
    )
    SELECT p.*
    FROM products p
    LEFT JOIN filtered_variants fv ON p.id = fv.product_id
    LEFT JOIN legacy_inventory inv ON p.id = inv.product_id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = true
    -- Search query (Updated for bilingual support)
    AND (
        search_query IS NULL OR search_query = '' OR
        p.name ILIKE '%' || search_query || '%' OR
        p.description ILIKE '%' || search_query || '%' OR
        p.name_ar ILIKE '%' || search_query || '%' OR
        p.description_ar ILIKE '%' || search_query || '%' OR
        p.name_en ILIKE '%' || search_query || '%' OR
        p.description_en ILIKE '%' || search_query || '%'
    )
    -- Categories
    AND (
        category_slugs IS NULL OR array_length(category_slugs, 1) IS NULL OR
        c.slug = ANY(category_slugs)
    )
    -- Gender
    AND (
        gender_targets IS NULL OR array_length(gender_targets, 1) IS NULL OR
        p.gender_target = ANY(gender_targets)
    )
    -- Price
    AND (
        min_price IS NULL OR 
        COALESCE(fv.min_variant_price, p.price) >= min_price
    )
    AND (
        max_price IS NULL OR 
        COALESCE(fv.min_variant_price, p.price) <= max_price
    )
    -- In stock
    AND (
        NOT in_stock_only OR 
        COALESCE(fv.total_stock, inv.total_stock, 0) > 0
    )
    -- Rating
    AND (
        min_rating IS NULL OR 
        p.rating >= min_rating
    )
    -- Variant filters must match if provided
    AND (
        (sizes IS NULL OR array_length(sizes, 1) IS NULL) AND 
        (concentrations IS NULL OR array_length(concentrations, 1) IS NULL) 
        OR fv.product_id IS NOT NULL
    )
    ORDER BY
        CASE WHEN sort_by = 'price_asc' THEN COALESCE(fv.min_variant_price, p.price) END ASC,
        CASE WHEN sort_by = 'price_desc' THEN COALESCE(fv.min_variant_price, p.price) END DESC,
        CASE WHEN sort_by = 'best_rated' THEN p.rating END DESC NULLS LAST,
        CASE WHEN sort_by = 'most_popular' THEN p.review_count END DESC NULLS LAST,
        CASE WHEN sort_by = 'newest' THEN p.created_at END DESC,
        p.created_at DESC;
END;
$$ LANGUAGE plpgsql;
