-- Migration: Multi-Role Admin Access Control

-- 1. Create role_permissions table
CREATE TABLE role_permissions (
  role text PRIMARY KEY,
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb
);

-- Populate initial roles and permissions
INSERT INTO role_permissions (role, permissions) VALUES
  ('super_admin', '["all"]'::jsonb),
  ('order_manager', '["view_dashboard", "manage_orders", "view_users"]'::jsonb),
  ('inventory_manager', '["view_dashboard", "manage_inventory", "manage_products", "manage_categories"]'::jsonb),
  ('content_manager', '["view_dashboard", "manage_products", "manage_categories", "manage_reviews", "manage_coupons"]'::jsonb),
  ('user', '[]'::jsonb);

-- 2. Modify profiles table
-- Drop the existing constraint
ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;

-- Add foreign key to role_permissions
ALTER TABLE profiles ADD CONSTRAINT profiles_role_fkey FOREIGN KEY (role) REFERENCES role_permissions(role);

-- Update existing "admin" role to "super_admin"
UPDATE profiles SET role = 'super_admin' WHERE role = 'admin';

-- Re-apply a constraint to ensure role validity (optional but good practice, the FK is the main enforcer)
-- We rely on the FK now

-- 3. Create has_permission function
CREATE OR REPLACE FUNCTION public.has_permission(required_permission text)
RETURNS boolean AS $$
DECLARE
  user_role text;
  user_permissions jsonb;
BEGIN
  -- Get the current user's role
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  
  -- If super_admin, they have all permissions
  IF user_role = 'super_admin' THEN
    RETURN true;
  END IF;

  -- Get permissions for the user's role
  SELECT permissions INTO user_permissions FROM public.role_permissions WHERE role = user_role;

  -- Check if the specific permission exists in the array
  IF user_permissions ? required_permission THEN
      RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update is_admin function to check for any non-user role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role != 'user'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 5. Enable RLS on new table
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Role permissions are readable by everyone" ON role_permissions FOR SELECT USING (true);
CREATE POLICY "Admins can manage role permissions" ON role_permissions FOR ALL USING (public.is_admin());

-- 6. Trigger to audit role changes
CREATE OR REPLACE FUNCTION audit_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.admin_audit_logs (admin_id, action, table_name, record_id, changes)
    VALUES (
      -- If a user changes their own role (super admin), or another admin changes it, we try to log the updater.
      -- If it's a direct database update, auth.uid() might be null.
      auth.uid(), 
      'UPDATE_ROLE', 
      'profiles', 
      NEW.id, 
      jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_role_update
  AFTER UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION audit_role_change();
