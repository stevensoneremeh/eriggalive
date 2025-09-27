
-- Create Super Admin Migration
-- Sets up info@eriggalive.com as the super admin with full system access

-- First, ensure we have the proper user roles
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'moderator', 'user');
  ELSE
    -- Add super_admin to existing enum if it doesn't exist
    BEGIN
      ALTER TYPE user_role ADD VALUE 'super_admin';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- Create or update the super admin user profile
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'info@eriggalive.com',
  crypt('SuperAdmin@Erigga2024!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"], "role": "super_admin"}',
  '{"username": "super_admin", "role": "super_admin"}',
  true,
  'authenticated'
) ON CONFLICT (email) DO UPDATE SET
  raw_app_meta_data = EXCLUDED.raw_app_meta_data,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  is_super_admin = true,
  updated_at = NOW();

-- Ensure users table has role column with proper type
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user',
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- Insert/Update the super admin in users table
INSERT INTO public.users (
  id,
  auth_user_id,
  username,
  email,
  full_name,
  tier,
  role,
  is_super_admin,
  coins_balance,
  total_spent,
  points,
  level,
  is_verified,
  created_at,
  updated_at
) VALUES (
  1, -- Using ID 1 for super admin
  '11111111-1111-1111-1111-111111111111',
  'super_admin',
  'info@eriggalive.com',
  'Erigga Live Super Admin',
  'blood_brotherhood',
  'super_admin',
  true,
  999999,
  0,
  999999,
  99,
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  role = 'super_admin',
  is_super_admin = true,
  tier = 'blood_brotherhood',
  coins_balance = 999999,
  points = 999999,
  level = 99,
  is_verified = true,
  updated_at = NOW();

-- Create meet_greet_admin_settings table to configure admin for all sessions
CREATE TABLE IF NOT EXISTS public.meet_greet_admin_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id INTEGER NOT NULL REFERENCES public.users(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert admin settings
INSERT INTO public.meet_greet_admin_settings (admin_user_id, is_active)
VALUES (1, true)
ON CONFLICT DO NOTHING;

-- Update meetgreet_payments table to always include admin
ALTER TABLE public.meetgreet_payments 
ADD COLUMN IF NOT EXISTS admin_user_id INTEGER REFERENCES public.users(id) DEFAULT 1,
ADD COLUMN IF NOT EXISTS admin_session_room_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS requires_admin_approval BOOLEAN DEFAULT TRUE;

-- Function to ensure admin is always added to meet and greet sessions
CREATE OR REPLACE FUNCTION ensure_admin_in_meetgreet()
RETURNS TRIGGER AS $$
DECLARE
  admin_id INTEGER;
BEGIN
  -- Get the active admin user
  SELECT admin_user_id INTO admin_id 
  FROM public.meet_greet_admin_settings 
  WHERE is_active = true 
  LIMIT 1;
  
  -- Set admin for the session
  NEW.admin_user_id := COALESCE(admin_id, 1);
  NEW.requires_admin_approval := true;
  
  -- Generate admin room ID if session room is set
  IF NEW.session_room_id IS NOT NULL AND NEW.admin_session_room_id IS NULL THEN
    NEW.admin_session_room_id := NEW.session_room_id || '_admin';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure admin is always involved
DROP TRIGGER IF EXISTS ensure_admin_meetgreet_trigger ON public.meetgreet_payments;
CREATE TRIGGER ensure_admin_meetgreet_trigger
  BEFORE INSERT OR UPDATE ON public.meetgreet_payments
  FOR EACH ROW
  EXECUTE FUNCTION ensure_admin_in_meetgreet();

-- Update existing meetgreet payments to include admin
UPDATE public.meetgreet_payments 
SET admin_user_id = 1, requires_admin_approval = true
WHERE admin_user_id IS NULL;

-- Enhanced RLS policies for super admin
CREATE POLICY "Super admin can do everything on users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_user_id::text = auth.uid()::text 
      AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admin can manage all meetgreet payments" ON public.meetgreet_payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_user_id::text = auth.uid()::text 
      AND role = 'super_admin'
    )
  );

-- Grant super admin access to all tables
DO $$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN 
    SELECT t.table_name 
    FROM information_schema.tables t 
    WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('
      DROP POLICY IF EXISTS "super_admin_all_access" ON public.%I;
      CREATE POLICY "super_admin_all_access" ON public.%I
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id::text = auth.uid()::text 
            AND role = ''super_admin''
          )
        );
    ', table_name, table_name);
  END LOOP;
END $$;

-- Create admin dashboard permissions table
CREATE TABLE IF NOT EXISTS public.admin_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id),
  permission_type TEXT NOT NULL,
  resource TEXT,
  can_read BOOLEAN DEFAULT FALSE,
  can_write BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant all permissions to super admin
INSERT INTO public.admin_permissions (user_id, permission_type, resource, can_read, can_write, can_delete)
VALUES 
  (1, 'global', '*', true, true, true),
  (1, 'users', '*', true, true, true),
  (1, 'meetgreet', '*', true, true, true),
  (1, 'payments', '*', true, true, true),
  (1, 'content', '*', true, true, true),
  (1, 'admin', '*', true, true, true)
ON CONFLICT DO NOTHING;

-- Function to check admin permissions
CREATE OR REPLACE FUNCTION has_admin_permission(
  user_uuid UUID,
  permission_type TEXT,
  resource TEXT DEFAULT '*',
  permission_level TEXT DEFAULT 'read'
)
RETURNS BOOLEAN AS $$
DECLARE
  user_internal_id INTEGER;
  has_permission BOOLEAN := FALSE;
BEGIN
  -- Get internal user ID
  SELECT id INTO user_internal_id
  FROM public.users
  WHERE auth_user_id::text = user_uuid::text;
  
  IF user_internal_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check for super admin
  IF EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_internal_id 
    AND role = 'super_admin'
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check specific permissions
  SELECT 
    CASE 
      WHEN permission_level = 'read' THEN can_read
      WHEN permission_level = 'write' THEN can_write
      WHEN permission_level = 'delete' THEN can_delete
      ELSE FALSE
    END INTO has_permission
  FROM public.admin_permissions
  WHERE user_id = user_internal_id
  AND (permission_type = permission_type OR permission_type = 'global')
  AND (resource = resource OR resource = '*')
  LIMIT 1;
  
  RETURN COALESCE(has_permission, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_super_admin ON public.users(is_super_admin) WHERE is_super_admin = true;
CREATE INDEX IF NOT EXISTS idx_meetgreet_admin_user ON public.meetgreet_payments(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_user ON public.admin_permissions(user_id);

-- Create audit log for admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id INTEGER NOT NULL REFERENCES public.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  admin_id INTEGER,
  action TEXT,
  resource_type TEXT DEFAULT NULL,
  resource_id TEXT DEFAULT NULL,
  old_values JSONB DEFAULT NULL,
  new_values JSONB DEFAULT NULL,
  ip_address TEXT DEFAULT NULL,
  user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.admin_audit_log (
    admin_user_id, action, resource_type, resource_id, 
    old_values, new_values, ip_address, user_agent
  ) VALUES (
    admin_id, action, resource_type, resource_id,
    old_values, new_values, ip_address::inet, user_agent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on new tables
ALTER TABLE public.meet_greet_admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin tables
CREATE POLICY "Super admin can manage admin settings" ON public.meet_greet_admin_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_user_id::text = auth.uid()::text 
      AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admin can manage permissions" ON public.admin_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_user_id::text = auth.uid()::text 
      AND role = 'super_admin'
    )
  );

CREATE POLICY "Admins can view audit logs" ON public.admin_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_user_id::text = auth.uid()::text 
      AND role IN ('super_admin', 'admin')
    )
  );

-- Update updated_at triggers
CREATE TRIGGER update_meet_greet_admin_settings_updated_at
  BEFORE UPDATE ON public.meet_greet_admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_permissions_updated_at
  BEFORE UPDATE ON public.admin_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
