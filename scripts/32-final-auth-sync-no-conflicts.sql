-- =====================================================
-- FINAL AUTH SYNC - NO POLICY CONFLICTS
-- This script handles all existing policies safely
-- =====================================================

-- First, let's safely drop ALL existing policies on users table
DO $$
DECLARE
    policy_record record;
BEGIN
    RAISE NOTICE 'Dropping all existing policies on users table...';
    
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', policy_record.policyname);
            RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop policy %: %', policy_record.policyname, SQLERRM;
        END;
    END LOOP;
END $$;

-- Add missing columns safely
DO $$
DECLARE
    column_exists boolean;
BEGIN
    RAISE NOTICE 'Checking and adding missing columns...';
    
    -- Check and add is_banned column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'is_banned'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.users ADD COLUMN is_banned boolean DEFAULT false;
        RAISE NOTICE 'Added is_banned column';
    END IF;
    
    -- Check and add ban_reason column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'ban_reason'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.users ADD COLUMN ban_reason text;
        RAISE NOTICE 'Added ban_reason column';
    END IF;
    
    -- Check and add banned_until column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'banned_until'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.users ADD COLUMN banned_until timestamptz;
        RAISE NOTICE 'Added banned_until column';
    END IF;
    
    -- Check and add login_count column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'login_count'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.users ADD COLUMN login_count integer DEFAULT 0;
        RAISE NOTICE 'Added login_count column';
    END IF;
    
    -- Check and add last_login column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'last_login'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.users ADD COLUMN last_login timestamptz;
        RAISE NOTICE 'Added last_login column';
    END IF;
    
    -- Check and add referral_code column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'referral_code'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.users ADD COLUMN referral_code text;
        RAISE NOTICE 'Added referral_code column';
    END IF;
    
    -- Check and add referred_by column (without foreign key)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'referred_by'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE public.users ADD COLUMN referred_by bigint;
        RAISE NOTICE 'Added referred_by column';
    END IF;
    
    RAISE NOTICE 'Column setup complete!';
END $$;

-- Create or replace the sync function
CREATE OR REPLACE FUNCTION sync_auth_user_safe(auth_user_record auth.users)
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
        RETURN; -- User already exists, skip
    END IF;
    
    -- Generate safe username
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
    
    -- Insert new user with safe defaults
    INSERT INTO public.users (
        auth_user_id,
        username,
        full_name,
        email,
        tier,
        role,
        level,
        points,
        coins,
        is_verified,
        is_active,
        is_banned,
        login_count,
        created_at,
        updated_at
    ) VALUES (
        auth_user_record.id,
        username_val,
        full_name_val,
        email_val,
        'grassroot'::user_tier,
        'user'::user_role,
        1,
        0,
        1000,
        false,
        true,
        false,
        0,
        COALESCE(auth_user_record.created_at, now()),
        now()
    );
        
    RAISE NOTICE 'Synced user: % -> %', auth_user_record.email, username_val;
END;
$$;

-- Sync all existing auth users
DO $$
DECLARE
    auth_user_record auth.users%ROWTYPE;
    sync_count integer := 0;
    skip_count integer := 0;
BEGIN
    RAISE NOTICE 'Starting auth user sync...';
    
    FOR auth_user_record IN SELECT * FROM auth.users LOOP
        BEGIN
            PERFORM sync_auth_user_safe(auth_user_record);
            sync_count := sync_count + 1;
        EXCEPTION WHEN OTHERS THEN
            skip_count := skip_count + 1;
        END;
    END LOOP;
    
    RAISE NOTICE 'Sync complete! New users: %, Existing: %', sync_count, skip_count;
END $$;

-- Create trigger function for new auth users
CREATE OR REPLACE FUNCTION handle_new_auth_user_safe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM sync_auth_user_safe(NEW);
    RETURN NEW;
END;
$$;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_auth_user_safe();

-- Create the get or create function
CREATE OR REPLACE FUNCTION get_or_create_user_profile(user_auth_id uuid)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_profile public.users%ROWTYPE;
    auth_user_record auth.users%ROWTYPE;
BEGIN
    -- Try to get existing user profile
    SELECT * INTO user_profile
    FROM public.users
    WHERE auth_user_id = user_auth_id;
    
    IF FOUND THEN
        RETURN user_profile;
    END IF;
    
    -- Get auth user record
    SELECT * INTO auth_user_record
    FROM auth.users
    WHERE id = user_auth_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Auth user with ID % not found', user_auth_id;
    END IF;
    
    -- Create the profile
    PERFORM sync_auth_user_safe(auth_user_record);
    
    -- Return the newly created profile
    SELECT * INTO user_profile
    FROM public.users
    WHERE auth_user_id = user_auth_id;
    
    RETURN user_profile;
END;
$$;

-- Create fresh RLS policies with unique names
CREATE POLICY "users_select_authenticated" ON public.users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "users_insert_own" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "users_service_role_all" ON public.users
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;
GRANT ALL ON public.users TO authenticated;

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
    
    RAISE NOTICE '=== FINAL VERIFICATION ===';
    RAISE NOTICE 'Auth users: %', auth_count;
    RAISE NOTICE 'Public users: %', public_count;
    RAISE NOTICE 'Unsynced: %', unsynced_count;
    
    IF unsynced_count = 0 THEN
        RAISE NOTICE 'SUCCESS: All users synced!';
    ELSE
        RAISE NOTICE 'WARNING: % users not synced', unsynced_count;
    END IF;
END $$;
