-- Migration: Enhance Reviews
-- Description: Alters existing public.reviews table, adds rating aggregates on products, triggers, and RPCs for moderation.

DO $$ BEGIN
    CREATE TYPE review_status AS ENUM ('pending', 'approved', 'hidden', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS status review_status DEFAULT 'pending'::review_status,
ADD COLUMN IF NOT EXISTS moderation_reason text,
ADD COLUMN IF NOT EXISTS admin_note text,
ADD COLUMN IF NOT EXISTS moderated_at timestamptz,
ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_verified_purchase boolean DEFAULT false;

-- Migrate existing is_approved mapping
UPDATE public.reviews SET status = 'approved'::review_status WHERE is_approved = TRUE AND status = 'pending'::review_status;

-- On products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS rating_avg numeric(3, 2) DEFAULT 0 CHECK (rating_avg >= 0 AND rating_avg <= 5),
ADD COLUMN IF NOT EXISTS rating_count integer DEFAULT 0 CHECK (rating_count >= 0);

-- Update RLS policies
-- 1. Read approved
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
CREATE POLICY "Public can view approved reviews" ON public.reviews
FOR SELECT USING (status = 'approved'::review_status);

-- 2. Read own
DROP POLICY IF EXISTS "Users can view their own reviews" ON public.reviews;
CREATE POLICY "Users can view their own reviews" ON public.reviews
FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 3. Insert own
CREATE OR REPLACE FUNCTION public.check_verified_purchase(p_product_id uuid, p_user_id uuid)
RETURNS boolean AS $$
DECLARE
    has_purchased boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.orders o
        JOIN public.order_items oi ON o.id = oi.order_id
        JOIN public.product_variants pv ON oi.variant_id = pv.id
        WHERE o.user_id = p_user_id
        AND pv.product_id = p_product_id
        AND o.status IN ('delivered', 'completed', 'paid')
    ) INTO has_purchased;
    
    RETURN has_purchased;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update insert policy
DROP POLICY IF EXISTS "Users can insert review if purchased" ON public.reviews;
CREATE POLICY "Users can insert review if purchased" ON public.reviews
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Update Trigger on Reviews (For inserts to auto-set verified purchase)
CREATE OR REPLACE FUNCTION public.handle_review_insert()
RETURNS trigger AS $$
BEGIN
    NEW.is_verified_purchase := public.check_verified_purchase(NEW.product_id, NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_insert ON public.reviews;
CREATE TRIGGER on_review_insert
    BEFORE INSERT ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.handle_review_insert();

-- Update Trigger on Reviews (For updates)
CREATE OR REPLACE FUNCTION public.handle_review_update()
RETURNS trigger AS $$
BEGIN
    IF auth.uid() = NEW.user_id AND (NEW.rating IS DISTINCT FROM OLD.rating OR NEW.comment IS DISTINCT FROM OLD.comment) THEN
        NEW.status = 'pending'::review_status;
        NEW.updated_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_update ON public.reviews;
CREATE TRIGGER on_review_update
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.handle_review_update();

-- Aggregate trigger
CREATE OR REPLACE FUNCTION public.update_product_ratings()
RETURNS trigger AS $$
DECLARE
    v_product_id uuid;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_product_id := OLD.product_id;
    ELSE
        v_product_id := NEW.product_id;
    END IF;

    UPDATE public.products
    SET 
        rating_avg = COALESCE((
            SELECT ROUND(AVG(rating)::numeric, 2) FROM public.reviews
            WHERE product_id = v_product_id AND status = 'approved'
        ), 0),
        rating_count = (
            SELECT COUNT(*) FROM public.reviews
            WHERE product_id = v_product_id AND status = 'approved'
        )
    WHERE id = v_product_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_status_change ON public.reviews;
CREATE TRIGGER on_review_status_change
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_product_ratings();

-- Admin moderation RPC
CREATE OR REPLACE FUNCTION public.moderate_reviews(
    p_review_ids uuid[],
    p_status review_status,
    p_reason text DEFAULT NULL,
    p_note text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    v_admin_id uuid;
    v_is_admin boolean;
BEGIN
    v_admin_id := auth.uid();
    
    SELECT EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = v_admin_id) INTO v_is_admin;
    IF NOT v_is_admin THEN RAISE EXCEPTION 'Unauthorized'; END IF;

    UPDATE public.reviews
    SET 
        status = p_status,
        moderation_reason = p_reason,
        admin_note = p_note,
        moderated_at = now(),
        moderated_by = v_admin_id
    WHERE id = ANY(p_review_ids);

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit Trial Trigger
DROP TRIGGER IF EXISTS trg_audit_reviews ON public.reviews;
CREATE TRIGGER trg_audit_reviews
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW EXECUTE PROCEDURE public.log_admin_action();

GRANT EXECUTE ON FUNCTION public.check_verified_purchase(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.moderate_reviews(uuid[], review_status, text, text) TO authenticated;

-- Finally drop is_approved safely
ALTER TABLE public.reviews DROP COLUMN IF EXISTS is_approved;
