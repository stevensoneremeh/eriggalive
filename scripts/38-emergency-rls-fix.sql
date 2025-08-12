-- Emergency fix for infinite recursion in RLS policies
-- This completely removes all problematic policies and creates the simplest possible ones

-- Disable RLS temporarily to clear all policies
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable update access for own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert access for own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create the simplest possible policies using only auth.uid()
-- No table references to avoid recursion

-- Users table policies
CREATE POLICY "users_select_policy" ON users
    FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "users_insert_policy" ON users
    FOR INSERT WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "users_update_policy" ON users
    FOR UPDATE USING (auth_user_id = auth.uid());

-- User profiles table policies  
CREATE POLICY "user_profiles_select_policy" ON user_profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_profiles_insert_policy" ON user_profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_profiles_update_policy" ON user_profiles
    FOR UPDATE USING (user_id = auth.uid());

-- Profiles table policies
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE USING (id = auth.uid());
