-- Migration: 20260226050000_fix_is_admin_function.sql
-- Description: Define public.is_admin() function required by RLS policies on brands and collections

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.get_user_role(auth.uid()) IN ('admin', 'super_admin');
$$;
