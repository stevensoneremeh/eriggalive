-- Fix infinite recursion in RLS policies
-- This script removes all problematic policies and creates simple, non-recursive ones

-- First, disable RLS temporarily to avoid conflicts
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users_new DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for own user" ON users;
DROP POLICY IF EXISTS "Enable update access for own user" ON users;
DROP POLICY IF EXISTS "Enable insert access for own user" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable update access for own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert access for own profile" ON user_profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON user_profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON user_profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON user_profiles;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update access for own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert access for own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

DROP POLICY IF EXISTS "Users can view own profile" ON users_new;
DROP POLICY IF EXISTS "Users can update own profile" ON users_new;
DROP POLICY IF EXISTS "Users can insert own profile" ON users_new;
DROP POLICY IF EXISTS "users_new_select_own" ON users_new;
DROP POLICY IF EXISTS "users_new_update_own" ON users_new;
DROP POLICY IF EXISTS "users_new_insert_own" ON users_new;

-- Re-enable RLS with simple, non-recursive policies
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users_new ENABLE ROW LEVEL SECURITY;

-- Create simple policies using only auth.uid() - no table references
-- For users table (using unique policy names)
CREATE POLICY "users_table_select" ON users FOR SELECT USING (auth_user_id = auth.uid());
CREATE POLICY "users_table_update" ON users FOR UPDATE USING (auth_user_id = auth.uid());
CREATE POLICY "users_table_insert" ON users FOR INSERT WITH CHECK (auth_user_id = auth.uid());

-- For user_profiles table (using unique policy names)
CREATE POLICY "user_profiles_table_select" ON user_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_profiles_table_update" ON user_profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "user_profiles_table_insert" ON user_profiles FOR INSERT WITH CHECK (user_id = auth.uid());

-- For profiles table (using unique policy names)
CREATE POLICY "profiles_table_select" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_table_update" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_table_insert" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- For users_new table (using unique policy names)
CREATE POLICY "users_new_table_select" ON users_new FOR SELECT USING (auth_user_id = auth.uid());
CREATE POLICY "users_new_table_update" ON users_new FOR UPDATE USING (auth_user_id = auth.uid());
CREATE POLICY "users_new_table_insert" ON users_new FOR INSERT WITH CHECK (auth_user_id = auth.uid());

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON users_new TO authenticated;

-- Create or replace the user creation trigger (non-recursive)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Only insert if user doesn't already exist to prevent duplicates
  INSERT INTO public.users (auth_user_id, email, full_name, tier, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'free',
    NOW()
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
