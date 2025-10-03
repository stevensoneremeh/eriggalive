
-- Fix infinite recursion in users table RLS policies
-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin full access to users" ON public.users;

-- Create simple, non-recursive policies
CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (auth.uid() = auth_user_id);

CREATE POLICY "users_insert_own"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

-- Admin access (using email check to avoid recursion)
CREATE POLICY "admin_full_access"
  ON public.users FOR ALL
  USING (
    auth.jwt() ->> 'email' = 'info@eriggalive.com'
  );

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
