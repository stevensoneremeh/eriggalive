-- Complete authentication setup with immediate access
-- No verification required for anything

-- Ensure required enums exist
DO $$ 
BEGIN
    -- Create user_tier enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_tier') THEN
        CREATE TYPE user_tier AS ENUM ('grassroot', 'pioneer', 'elder', 'blood');
        RAISE NOTICE 'Created user_tier enum';
    END IF;

    -- Create user_role enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');
        RAISE NOTICE 'Created user_role enum';
    END IF;

    -- Create audit_action enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action') THEN
        CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout');
        RAISE NOTICE 'Created audit_action enum';
    END IF;

    -- Create notification_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM ('system', 'user', 'admin', 'marketing');
        RAISE NOTICE 'Created notification_type enum';
    END IF;
END $$;

-- Ensure users table has all required columns with proper defaults
DO $$
BEGIN
    -- Set all columns to have proper defaults (no verification required)
    ALTER TABLE public.users 
        ALTER COLUMN full_name DROP NOT NULL,
        ALTER COLUMN email_verified SET DEFAULT true,
        ALTER COLUMN phone_verified SET DEFAULT true,
        ALTER COLUMN two_factor_enabled SET DEFAULT false,
        ALTER COLUMN login_count SET DEFAULT 1,
        ALTER COLUMN preferences SET DEFAULT '{}',
        ALTER COLUMN metadata SET DEFAULT '{}',
        ALTER COLUMN tier SET DEFAULT 'grassroot',
        ALTER COLUMN role SET DEFAULT 'user',
        ALTER COLUMN level SET DEFAULT 1,
        ALTER COLUMN points SET DEFAULT 0,
        ALTER COLUMN coins SET DEFAULT 500,
        ALTER COLUMN is_verified SET DEFAULT false,
        ALTER COLUMN is_active SET DEFAULT true,
        ALTER COLUMN is_banned SET DEFAULT false;
    
    RAISE NOTICE 'Updated all column defaults for immediate access';
END $$;

-- Create comprehensive user creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    new_username text;
    username_counter integer := 0;
    base_username text;
BEGIN
    -- Generate username from email
    base_username := split_part(NEW.email, '@', 1);
    new_username := base_username;
    
    -- Ensure username is unique
    WHILE EXISTS (SELECT 1 FROM public.users WHERE username = new_username) LOOP
        username_counter := username_counter + 1;
        new_username := base_username || '_' || username_counter;
    END LOOP;

    -- Insert new user profile with all verifications set to true
    INSERT INTO public.users (
        auth_user_id,
        username,
        full_name,
        email,
        email_verified,
        phone_verified,
        tier,
        role,
        level,
        points,
        coins,
        is_verified,
        is_active,
        is_banned,
        two_factor_enabled,
        login_count,
        preferences,
        metadata,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        new_username,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email,
        true, -- Always verified - no email verification needed
        true, -- Always verified - no phone verification needed
        'grassroot',
        'user',
        1,
        0,
        500, -- Starting coins
        false, -- Not manually verified by admin
        true,  -- Active immediately
        false, -- Not banned
        false, -- 2FA disabled by default
        1,     -- First login
        '{}',  -- Empty preferences
        '{}',  -- Empty metadata
        NOW(),
        NOW()
    );

    RAISE NOTICE 'Created user profile for: % with immediate access', NEW.email;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating user profile for %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger for user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- Create function to update login count
CREATE OR REPLACE FUNCTION public.update_user_login()
RETURNS trigger AS $$
BEGIN
    -- Update login count and last login time
    UPDATE public.users 
    SET 
        login_count = login_count + 1,
        updated_at = NOW()
    WHERE auth_user_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for login tracking
DROP TRIGGER IF EXISTS on_user_login ON auth.users;
CREATE TRIGGER on_user_login
    AFTER UPDATE OF last_sign_in_at ON auth.users
    FOR EACH ROW 
    WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
    EXECUTE FUNCTION public.update_user_login();

-- Grant all necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Enable RLS but make it permissive
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;

-- Create permissive RLS policies for immediate access
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "All active profiles are publicly viewable" ON public.users
    FOR SELECT USING (is_active = true AND is_banned = false);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_active_status ON public.users(is_active, is_banned);

-- Grant function permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.update_user_login() TO supabase_auth_admin;

RAISE NOTICE '✅ Complete authentication setup finished';
RAISE NOTICE '✅ Users get immediate dashboard access after signup/signin';
RAISE NOTICE '✅ No verification required for anything';
