-- Verification script to check authentication setup

-- Check if all required columns exist in users table
SELECT 
    'Column Check' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('email_verified', 'phone_verified', 'two_factor_enabled', 'login_count', 'preferences', 'metadata') 
        THEN 'REQUIRED' 
        ELSE 'OPTIONAL' 
    END as importance
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name IN ('email_verified', 'phone_verified', 'two_factor_enabled', 'login_count', 'preferences', 'metadata', 'username', 'email', 'tier', 'role')
ORDER BY 
    CASE column_name 
        WHEN 'email_verified' THEN 1
        WHEN 'phone_verified' THEN 2
        WHEN 'two_factor_enabled' THEN 3
        WHEN 'login_count' THEN 4
        WHEN 'preferences' THEN 5
        WHEN 'metadata' THEN 6
        ELSE 7
    END;

-- Check if required functions exist
SELECT 
    'Function Check' as check_type,
    routine_name,
    routine_type,
    CASE 
        WHEN routine_name = 'handle_new_user' THEN 'CRITICAL'
        WHEN routine_name = 'auto_confirm_users' THEN 'IMPORTANT'
        ELSE 'OPTIONAL'
    END as importance
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('handle_new_user', 'auto_confirm_users');

-- Check if trigger exists
SELECT 
    'Trigger Check' as check_type,
    trigger_name,
    event_manipulation,
    action_timing,
    'CRITICAL' as importance
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name = 'on_auth_user_created';

-- Check RLS policies
SELECT 
    'Policy Check' as check_type,
    policyname as policy_name,
    cmd as command_type,
    'IMPORTANT' as importance
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'users';

-- Check if users table has RLS enabled
SELECT 
    'RLS Check' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    'CRITICAL' as importance
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'users';

-- Check sample data structure
SELECT 
    'Data Check' as check_type,
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_users,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
    'INFO' as importance
FROM public.users;

-- Check auth.users confirmation status
SELECT 
    'Auth Confirmation Check' as check_type,
    COUNT(*) as total_auth_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
    COUNT(CASE WHEN confirmed_at IS NOT NULL THEN 1 END) as fully_confirmed_users,
    'INFO' as importance
FROM auth.users;

-- Final status message
DO $$
DECLARE
    missing_columns integer;
    missing_functions integer;
    missing_triggers integer;
BEGIN
    -- Count missing required columns
    SELECT COUNT(*) INTO missing_columns
    FROM (
        SELECT 'email_verified' as col
        UNION SELECT 'phone_verified'
        UNION SELECT 'two_factor_enabled'
        UNION SELECT 'login_count'
        UNION SELECT 'preferences'
        UNION SELECT 'metadata'
    ) required_cols
    WHERE col NOT IN (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'users'
    );

    -- Count missing functions
    SELECT COUNT(*) INTO missing_functions
    FROM (
        SELECT 'handle_new_user' as func
        UNION SELECT 'auto_confirm_users'
    ) required_funcs
    WHERE func NOT IN (
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public'
    );

    -- Count missing triggers
    SELECT COUNT(*) INTO missing_triggers
    FROM (
        SELECT 'on_auth_user_created' as trig
    ) required_trigs
    WHERE trig NOT IN (
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public'
    );

    -- Report status
    IF missing_columns = 0 AND missing_functions = 0 AND missing_triggers = 0 THEN
        RAISE NOTICE '✅ SETUP COMPLETE: All required components are in place';
        RAISE NOTICE '✅ Users can now sign up without email verification';
        RAISE NOTICE '✅ Profiles will be created automatically';
    ELSE
        RAISE NOTICE '❌ SETUP INCOMPLETE:';
        IF missing_columns > 0 THEN
            RAISE NOTICE '  - Missing % required columns', missing_columns;
        END IF;
        IF missing_functions > 0 THEN
            RAISE NOTICE '  - Missing % required functions', missing_functions;
        END IF;
        IF missing_triggers > 0 THEN
            RAISE NOTICE '  - Missing % required triggers', missing_triggers;
        END IF;
    END IF;
END $$;
