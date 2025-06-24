-- =====================================================
-- COMPREHENSIVE AUTH USERS SYNC FIX
-- This script will sync all Supabase Auth users with the public users table
-- =====================================================

-- First, let's see what we're working with
DO $$
BEGIN
    RAISE NOTICE 'Starting comprehensive auth users sync...';
    RAISE NOTICE 'Auth users count: %', (SELECT COUNT(*) FROM auth.users);
    RAISE NOTICE 'Public users count: %', (SELECT COUNT(*) FROM public.users);
END $$;

-- Create a function to sync auth users to public users table
CREATE OR REPLACE FUNCTION sync_auth_user_to_public(auth_user_record auth.users)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    username_val text;
    full_name_val text;
    email_val text;
BEGIN
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
    
    -- Insert or update the user in public.users
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
        is_banned,
        login_count,
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
        false,
        1,
        auth_user_record.email_confirmed_at IS NOT NULL,
        auth_user_record.phone_confirmed_at IS NOT NULL,
        false,
        '{}',
        '{}',
        COALESCE(auth_user_record.created_at, now()),
        now()
    )
    ON CONFLICT (auth_user_id) DO UPDATE SET
        email = EXCLUDED.email,
        avatar_url = EXCLUDED.avatar_url,
        email_verified = EXCLUDED.email_verified,
        phone_verified = EXCLUDED.phone_verified,
        updated_at = now();
        
    RAISE NOTICE 'Synced user: % (%) -> %', auth_user_record.email, auth_user_record.id, username_val;
END;
$$;

-- Sync all existing auth users to public users table
DO $$
DECLARE
    auth_user_record auth.users%ROWTYPE;
    sync_count integer := 0;
BEGIN
    FOR auth_user_record IN SELECT * FROM auth.users LOOP
        BEGIN
            PERFORM sync_auth_user_to_public(auth_user_record);
            sync_count := sync_count + 1;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to sync user %: %', auth_user_record.email, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Successfully synced % users', sync_count;
END $$;

-- Create a trigger function to automatically sync new auth users
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Sync the new auth user to public users table
    PERFORM sync_auth_user_to_public(NEW);
    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new auth users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_auth_user();

-- Create a function to get or create user profile
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
    PERFORM sync_auth_user_to_public(auth_user_record);
    
    -- Get the newly created profile
    SELECT * INTO user_profile
    FROM public.users
    WHERE auth_user_id = user_auth_id;
    
    RETURN user_profile;
END;
$$;

-- Update RLS policies to be more permissive for authenticated users
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.users;

-- Create more comprehensive user policies
CREATE POLICY "Authenticated users can view all active profiles" ON public.users
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        is_active = true AND 
        is_banned = false
    );

CREATE POLICY "Users can view and update their own profile" ON public.users
    FOR ALL USING (auth.uid() = auth_user_id);

CREATE POLICY "Service role can manage all users" ON public.users
    FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;

-- Final verification
DO $$
BEGIN
    RAISE NOTICE 'Sync complete!';
    RAISE NOTICE 'Auth users count: %', (SELECT COUNT(*) FROM auth.users);
    RAISE NOTICE 'Public users count: %', (SELECT COUNT(*) FROM public.users);
    RAISE NOTICE 'Unsynced auth users: %', (
        SELECT COUNT(*) 
        FROM auth.users au 
        WHERE NOT EXISTS (
            SELECT 1 FROM public.users pu WHERE pu.auth_user_id = au.id
        )
    );
END $$;
