-- Fix infinite recursion in RLS policies
-- This script removes problematic policies and creates simple, non-recursive ones

-- Drop all existing RLS policies that might cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on auth_user_id" ON users;

-- Drop policies on other user tables
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create simple, non-recursive RLS policies for users table
CREATE POLICY "users_select_policy" ON users
    FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "users_insert_policy" ON users
    FOR INSERT WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "users_update_policy" ON users
    FOR UPDATE USING (auth_user_id = auth.uid());

-- Create simple policies for user_profiles table
CREATE POLICY "user_profiles_select_policy" ON user_profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_profiles_insert_policy" ON user_profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_profiles_update_policy" ON user_profiles
    FOR UPDATE USING (user_id = auth.uid());

-- Create simple policies for profiles table
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE USING (user_id = auth.uid());

-- Ensure RLS is enabled on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create or replace the trigger function for automatic user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (
    auth_user_id,
    email,
    tier,
    created_at,
    updated_at,
    is_active,
    email_verified
  ) VALUES (
    NEW.id,
    NEW.email,
    'free',
    NOW(),
    NOW(),
    true,
    NEW.email_confirmed_at IS NOT NULL
  );

  -- Insert into user_profiles table
  INSERT INTO public.user_profiles (
    user_id,
    tier,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    'free',
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
