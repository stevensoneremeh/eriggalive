-- =====================================================
-- SAFE AUTH USERS SYNC WITH COLUMN VERIFICATION
-- This script will check existing columns and create missing ones
-- =====================================================

-- First, let's check what columns exist in the users table
DO $$
DECLARE
    column_exists boolean;
BEGIN
    RAISE NOTICE 'Checking users table structure...';
    
    -- Check if is_banned column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'is_banned'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding missing is_banned column...';
        ALTER TABLE public.users ADD COLUMN is_banned boolean DEFAULT false;
    END IF;
    
    -- Check if ban_reason column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'ban_reason'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding missing ban_reason column...';
        ALTER TABLE public.users ADD COLUMN ban_reason text;
    END IF;
    
    -- Check if banned_until column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'banned_until'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding missing banned_until column...';
        ALTER TABLE public.users ADD COLUMN banned_until timestamptz;
    END IF;
    
    -- Check if login_count column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'login_count'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding missing login_count column...';
        ALTER TABLE public.users ADD COLUMN login_count integer DEFAULT 0;
    END IF;
    
    -- Check if last_login column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'last_login'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding missing last_login column...';
        ALTER TABLE public.users ADD COLUMN last_login timestamptz;
    END IF;
    
    -- Check if referral_code column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'referral_code'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding missing referral_code column...';
        ALTER TABLE public.users ADD COLUMN referral_code text UNIQUE;
    END IF;
    
    -- Check if referred_by column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'referred_by'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Adding missing referred_by column...';
        ALTER TABLE public.users ADD COLUMN referred_by bigint REFERENCES public.users(id);
    END IF;
    
    RAISE NOTICE 'Column verification complete!';
END $$;

-- Now let's get the actual column list for the users table
DO $$
DECLARE
    users_columns text;
BEGIN
    SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
    INTO users_columns
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users';
    
    RAISE NOTICE 'Users table columns: %', users_columns;
END $$;

-- Create a safe function to sync auth users to public users table
CREATE OR REPLACE FUNCTION sync_auth_user_to_public_safe(auth_user_record auth.users)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    username_val text;
    full_name_val text;
    email_val text;
    existing_user_id bigint;
BEGIN
    -- Check if user already exists
    SELECT id INTO existing_user_id
    FROM public.users 
    WHERE auth_user_id = auth_user_record.id;
    
    IF existing_user_id IS NOT NULL THEN
        RAISE NOTICE 'User already exists: % (ID: %)', auth_user_record.email, existing_user_id;
        RETURN;
    END IF;
    
    -- Generate username from email or use a default
    username_val := COALESCE(
        auth_user_record.raw_user_meta_data->>'username',
        split_part(auth_user_record.email, '@', 1),
        'user_' || substr(auth_user_record.id::text, 1, 8)
    );
    
    -- Ensure username is unique
    WHILE EXISTS (SELECT 1 FROM public.users WHERE username = username_val) LOOP
        username_val := username_val || '_' || floor(random() * 1000)::text;
    END LOOP;
    
    -- Get full name
    full_name_val := COALESCE(
        auth_user_record.raw_user_meta_data->>'full_name',
        auth_user_record.raw_user_meta_data->>'name',
        split_part(auth_user_record.email, '@', 1)
    );
    
    -- Get email
    email_val := COALESCE(auth_user_record.email, '');
    
    -- Insert the user in public.users with only the columns that definitely exist
    INSERT INTO public.users (
        auth_user_id,
        username,
        full_name,
        email,
        avatar_url,
        tier,
        role,
        level,
        points,
        coins,
        is_verified,
        is_active,
        email_verified,
        phone_verified,
        two_factor_enabled,
        preferences,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        auth_user_record.id,
        username_val,
        full_name_val,
        email_val,
        auth_user_record.raw_user_meta_data->>'avatar_url',
        'grassroot'::user_tier,
        'user'::user_role,
        1,
        0,
        1000, -- Starting coins
        false,
        true,
        auth_user_record.email_confirmed_at IS NOT NULL,
        auth_user_record.phone_confirmed_at IS NOT NULL,
        false,
        '{}',
        '{}',
        COALESCE(auth_user_record.created_at, now()),
        now()
    );
        
    RAISE NOTICE 'Created new user: % (%) -> %', auth_user_record.email, auth_user_record.id, username_val;
END;
$$;

-- Sync all existing auth users to public users table
DO $$
DECLARE
    auth_user_record auth.users%ROWTYPE;
    sync_count integer := 0;
    skip_count integer := 0;
BEGIN
    RAISE NOTICE 'Starting auth user sync...';
    
    FOR auth_user_record IN SELECT * FROM auth.users LOOP
        BEGIN
            PERFORM sync_auth_user_to_public_safe(auth_user_record);
            sync_count := sync_count + 1;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Skipped user % (already exists or error): %', auth_user_record.email, SQLERRM;
            skip_count := skip_count + 1;
        END;
    END LOOP;
    
    RAISE NOTICE 'Sync complete! Created: %, Skipped: %', sync_count, skip_count;
END $$;

-- Create a trigger function to automatically sync new auth users
CREATE OR REPLACE FUNCTION handle_new_auth_user_safe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Sync the new auth user to public users table
    PERFORM sync_auth_user_to_public_safe(NEW);
    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new auth users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_auth_user_safe();

-- Create a simplified function to get or create user profile
CREATE OR REPLACE FUNCTION get_or_create_user_profile(user_auth_id uuid)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_profile public.users%ROWTYPE;
    auth_user_record auth.users%ROWTYPE;
BEGIN
    -- First try to get existing user profile
    SELECT * INTO user_profile
    FROM public.users
    WHERE auth_user_id = user_auth_id;
    
    -- If user profile exists, return it
    IF FOUND THEN
        RETURN user_profile;
    END IF;
    
    -- If not found, get the auth user record
    SELECT * INTO auth_user_record
    FROM auth.users
    WHERE id = user_auth_id;
    
    -- If auth user doesn't exist, raise error
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Auth user with ID % not found', user_auth_id;
    END IF;
    
    -- Sync the auth user to create the profile
    PERFORM sync_auth_user_to_public_safe(auth_user_record);
    
    -- Get the newly created profile
    SELECT * INTO user_profile
    FROM public.users
    WHERE auth_user_id = user_auth_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Failed to create user profile for auth user %', user_auth_id;
    END IF;
    
    RETURN user_profile;
END;
$$;

-- Update RLS policies to be more permissive for authenticated users
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view all active profiles" ON public.users;
DROP POLICY IF EXISTS "Users can view and update their own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;

-- Create comprehensive user policies
CREATE POLICY "Authenticated users can view active profiles" ON public.users
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        is_active = true
    );

CREATE POLICY "Users can manage their own profile" ON public.users
    FOR ALL USING (auth.uid() = auth_user_id);

CREATE POLICY "Service role can manage all users" ON public.users
    FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;

-- Final verification
DO $$
DECLARE
    auth_count integer;
    public_count integer;
    unsynced_count integer;
BEGIN
    SELECT COUNT(*) INTO auth_count FROM auth.users;
    SELECT COUNT(*) INTO public_count FROM public.users;
    
    SELECT COUNT(*) INTO unsynced_count
    FROM auth.users au 
    WHERE NOT EXISTS (
        SELECT 1 FROM public.users pu WHERE pu.auth_user_id = au.id
    );
    
    RAISE NOTICE '=== SYNC VERIFICATION ===';
    RAISE NOTICE 'Auth users count: %', auth_count;
    RAISE NOTICE 'Public users count: %', public_count;
    RAISE NOTICE 'Unsynced auth users: %', unsynced_count;
    
    IF unsynced_count = 0 THEN
        RAISE NOTICE 'SUCCESS: All auth users are synced!';
    ELSE
        RAISE NOTICE 'WARNING: % auth users are not synced', unsynced_count;
    END IF;
END $$;
