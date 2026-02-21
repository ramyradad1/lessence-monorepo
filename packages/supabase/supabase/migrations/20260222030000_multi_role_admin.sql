-- Migration: Multi-Role Admin Access Control (Idempotent)
-- IMPORTANT: Must (1) create role_permissions, (2) drop check constraint, (3) update roles, (4) add FK

-- 1. Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  role text PRIMARY KEY,
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb
);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Populate initial roles and permissions
INSERT INTO role_permissions (role, permissions) VALUES
  ('super_admin', '["all"]'::jsonb),
  ('order_manager', '["view_dashboard", "manage_orders", "view_users"]'::jsonb),
  ('inventory_manager', '["view_dashboard", "manage_inventory", "manage_products", "manage_categories"]'::jsonb),
  ('content_manager', '["view_dashboard", "manage_products", "manage_categories", "manage_reviews", "manage_coupons"]'::jsonb),
  ('user', '[]'::jsonb)
ON CONFLICT (role) DO NOTHING;

-- 2. Drop the existing check constraint BEFORE updating roles
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'profiles_role_check' AND table_name = 'profiles') THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
  END IF;
END $$;

-- 3. Update existing "admin" role to "super_admin"
UPDATE profiles SET role = 'super_admin' WHERE role = 'admin';

-- 4. Add FK constraint AFTER updating roles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'profiles_role_fkey' AND table_name = 'profiles') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_fkey FOREIGN KEY (role) REFERENCES role_permissions(role);
  END IF;
END $$;

-- 5. Create has_permission function
CREATE OR REPLACE FUNCTION public.has_permission(required_permission text)
RETURNS boolean AS $$
DECLARE
  user_role text;
  user_permissions jsonb;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  IF user_role = 'super_admin' THEN RETURN true; END IF;
  SELECT permissions INTO user_permissions FROM public.role_permissions WHERE role = user_role;
  IF user_permissions ? required_permission THEN RETURN true; END IF;
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Update is_admin function to check for any non-user role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role != 'user'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 7. Policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'role_permissions' AND policyname = 'Role permissions are readable by everyone') THEN
    CREATE POLICY "Role permissions are readable by everyone" ON role_permissions FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'role_permissions' AND policyname = 'Admins can manage role permissions') THEN
    CREATE POLICY "Admins can manage role permissions" ON role_permissions FOR ALL USING (public.is_admin());
  END IF;
END $$;

-- 8. Trigger to audit role changes
CREATE OR REPLACE FUNCTION audit_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.admin_audit_logs (admin_id, action, table_name, record_id, changes)
    VALUES (auth.uid(), 'UPDATE_ROLE', 'profiles', NEW.id, jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_role_update ON profiles;
CREATE TRIGGER on_profile_role_update
  AFTER UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION audit_role_change();
