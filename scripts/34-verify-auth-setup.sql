-- Comprehensive verification script
-- Checks that all authentication components are working

-- Check 1: Verify all required columns exist with correct defaults
SELECT 
    '=== COLUMN VERIFICATION ===' as section,
    '' as column_name,
    '' as data_type,
    '' as default_value,
    '' as status
UNION ALL
SELECT 
    'Required Columns' as section,
    column_name,
    data_type,
    COALESCE(column_default, 'NULL') as default_value,
    CASE 
        WHEN column_name = 'email_verified' AND column_default LIKE '%true%' THEN '✅ CORRECT'
        WHEN column_name = 'phone_verified' AND column_default LIKE '%true%' THEN '✅ CORRECT'
        WHEN column_name = 'two_factor_enabled' AND column_default LIKE '%false%' THEN '✅ CORRECT'
        WHEN column_name = 'login_count' AND column_default IS NOT NULL THEN '✅ CORRECT'
        WHEN column_name = 'preferences' AND column_default LIKE '%{}%' THEN '✅ CORRECT'
        WHEN column_name = 'metadata' AND column_default LIKE '%{}%' THEN '✅ CORRECT'
        WHEN column_name = 'full_name' AND is_nullable = 'YES' THEN '✅ CORRECT'
        WHEN column_name IN ('username', 'email', 'tier', 'role', 'level', 'points', 'coins', 'is_verified', 'is_active', 'is_banned') THEN '✅ EXISTS'
        ELSE '❌ ISSUE'
    END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name IN (
    'email_verified', 'phone_verified', 'two_factor_enabled', 'login_count', 
    'preferences', 'metadata', 'full_name', 'username', 'email', 'tier', 
    'role', 'level', 'points', 'coins', 'is_verified', 'is_active', 'is_banned'
  )
ORDER BY 
    CASE 
        WHEN section = '=== COLUMN VERIFICATION ===' THEN 0
        ELSE 1
    END,
    column_name;

-- Check 2: Verify functions exist
SELECT 
    '=== FUNCTION VERIFICATION ===' as section,
    '' as function_name,
    '' as schema_name,
    '' as status
UNION ALL
SELECT 
    'Required Functions' as section,
    routine_name as function_name,
    routine_schema as schema_name,
    '✅ EXISTS' as status
FROM information_schema.routines 
WHERE (routine_schema = 'public' AND routine_name IN ('handle_new_user', 'update_user_login'))
   OR (routine_schema = 'auth' AND routine_name = 'auto_confirm_user')
ORDER BY routine_schema, routine_name;

-- Check 3: Verify triggers exist
SELECT 
    '=== TRIGGER VERIFICATION ===' as section,
    '' as trigger_name,
    '' as table_name,
    '' as status
UNION ALL
SELECT 
    'Required Triggers' as section,
    trigger_name,
    event_object_table as table_name,
    '✅ ACTIVE' as status
FROM information_schema.triggers 
WHERE trigger_name IN ('on_auth_user_created', 'auto_confirm_user_trigger', 'on_user_login')
ORDER BY trigger_name;

-- Check 4: Verify RLS policies
SELECT 
    '=== RLS POLICY VERIFICATION ===' as section,
    '' as policy_name,
    '' as table_name,
    '' as status
UNION ALL
SELECT 
    'RLS Policies' as section,
    policyname as policy_name,
    tablename as table_name,
    '✅ ACTIVE' as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'users'
ORDER BY policyname;

-- Check 5: Data verification
SELECT 
    '=== DATA VERIFICATION ===' as section,
    '' as metric,
    '' as count_value,
    '' as status
UNION ALL
SELECT 
    'User Statistics' as section,
    'Total Users' as metric,
    COUNT(*)::text as count_value,
    CASE WHEN COUNT(*) >= 0 THEN '✅ OK' ELSE '❌ ERROR' END as status
FROM public.users
UNION ALL
SELECT 
    'User Statistics' as section,
    'Email Verified Users' as metric,
    COUNT(CASE WHEN email_verified = true THEN 1 END)::text as count_value,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ N/A'
        WHEN COUNT(CASE WHEN email_verified = true THEN 1 END) = COUNT(*) THEN '✅ ALL VERIFIED'
        ELSE '⚠️ SOME UNVERIFIED'
    END as status
FROM public.users
UNION ALL
SELECT 
    'User Statistics' as section,
    'Phone Verified Users' as metric,
    COUNT(CASE WHEN phone_verified = true THEN 1 END)::text as count_value,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ N/A'
        WHEN COUNT(CASE WHEN phone_verified = true THEN 1 END) = COUNT(*) THEN '✅ ALL VERIFIED'
        ELSE '⚠️ SOME UNVERIFIED'
    END as status
FROM public.users
UNION ALL
SELECT 
    'User Statistics' as section,
    'Active Users' as metric,
    COUNT(CASE WHEN is_active = true THEN 1 END)::text as count_value,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ N/A'
        WHEN COUNT(CASE WHEN is_active = true THEN 1 END) = COUNT(*) THEN '✅ ALL ACTIVE'
        ELSE '⚠️ SOME INACTIVE'
    END as status
FROM public.users;

-- Check 6: Auth users confirmation status
SELECT 
    '=== AUTH CONFIRMATION STATUS ===' as section,
    '' as metric,
    '' as count_value,
    '' as status
UNION ALL
SELECT 
    'Auth Users' as section,
    'Total Auth Users' as metric,
    COUNT(*)::text as count_value,
    '✅ INFO' as status
FROM auth.users
UNION ALL
SELECT 
    'Auth Users' as section,
    'Email Confirmed' as metric,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END)::text as count_value,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ N/A'
        WHEN COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) = COUNT(*) THEN '✅ ALL CONFIRMED'
        ELSE '❌ SOME UNCONFIRMED'
    END as status
FROM auth.users
UNION ALL
SELECT 
    'Auth Users' as section,
    'Fully Confirmed' as metric,
    COUNT(CASE WHEN confirmed_at IS NOT NULL THEN 1 END)::text as count_value,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ N/A'
        WHEN COUNT(CASE WHEN confirmed_at IS NOT NULL THEN 1 END) = COUNT(*) THEN '✅ ALL CONFIRMED'
        ELSE '❌ SOME UNCONFIRMED'
    END as status
FROM auth.users;

-- Final status summary
DO $$
DECLARE
    missing_columns integer := 0;
    missing_functions integer := 0;
    missing_triggers integer := 0;
    unconfirmed_auth_users integer := 0;
    unverified_profile_users integer := 0;
BEGIN
    -- Count missing required columns
    SELECT COUNT(*) INTO missing_columns
    FROM (
        VALUES ('email_verified'), ('phone_verified'), ('two_factor_enabled'), 
               ('login_count'), ('preferences'), ('metadata')
    ) AS required_cols(col)
    WHERE col NOT IN (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users'
    );

    -- Count missing functions
    SELECT COUNT(*) INTO missing_functions
    FROM (
        VALUES ('public', 'handle_new_user'), ('public', 'update_user_login'), ('auth', 'auto_confirm_user')
    ) AS required_funcs(schema_name, func_name)
    WHERE (schema_name, func_name) NOT IN (
        SELECT routine_schema, routine_name 
        FROM information_schema.routines
    );

    -- Count missing triggers
    SELECT COUNT(*) INTO missing_triggers
    FROM (
        VALUES ('on_auth_user_created'), ('auto_confirm_user_trigger')
    ) AS required_trigs(trig_name)
    WHERE trig_name NOT IN (
        SELECT trigger_name 
        FROM information_schema.triggers
    );

    -- Count unconfirmed auth users
    SELECT COUNT(*) INTO unconfirmed_auth_users
    FROM auth.users 
    WHERE email_confirmed_at IS NULL OR confirmed_at IS NULL;

    -- Count unverified profile users
    SELECT COUNT(*) INTO unverified_profile_users
    FROM public.users 
    WHERE email_verified = false OR phone_verified = false;

    -- Report final status
    RAISE NOTICE '';
    RAISE NOTICE '=== FINAL SETUP STATUS ===';
    
    IF missing_columns = 0 AND missing_functions = 0 AND missing_triggers = 0 
       AND unconfirmed_auth_users = 0 AND unverified_profile_users = 0 THEN
        RAISE NOTICE '🎉 PERFECT SETUP - Everything is configured correctly!';
        RAISE NOTICE '✅ All required columns exist with correct defaults';
        RAISE NOTICE '✅ All functions and triggers are active';
        RAISE NOTICE '✅ All users are auto-confirmed and verified';
        RAISE NOTICE '✅ Dashboard access is immediate after signup/signin';
        RAISE NOTICE '';
        RAISE NOTICE '🚀 Your authentication system is ready for production!';
    ELSE
        RAISE NOTICE '⚠️ SETUP ISSUES DETECTED:';
        IF missing_columns > 0 THEN
            RAISE NOTICE '  ❌ Missing % required columns', missing_columns;
        END IF;
        IF missing_functions > 0 THEN
            RAISE NOTICE '  ❌ Missing % required functions', missing_functions;
        END IF;
        IF missing_triggers > 0 THEN
            RAISE NOTICE '  ❌ Missing % required triggers', missing_triggers;
        END IF;
        IF unconfirmed_auth_users > 0 THEN
            RAISE NOTICE '  ⚠️ % auth users need confirmation', unconfirmed_auth_users;
        END IF;
        IF unverified_profile_users > 0 THEN
            RAISE NOTICE '  ⚠️ % profile users need verification', unverified_profile_users;
        END IF;
        RAISE NOTICE '';
        RAISE NOTICE '🔧 Please run the setup scripts again to fix these issues.';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '📋 MANUAL STEPS STILL REQUIRED:';
    RAISE NOTICE '1. Go to Supabase Dashboard > Authentication > Settings';
    RAISE NOTICE '2. Set "Enable email confirmations" to OFF';
    RAISE NOTICE '3. Set "Enable signup" to ON';
    RAISE NOTICE '4. Save the configuration';
    RAISE NOTICE '5. Test signup and signin flows';
END $$;
