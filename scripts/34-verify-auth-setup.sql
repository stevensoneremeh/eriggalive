-- Verification Script for Authentication Setup
-- Run this script to verify that authentication is properly configured

-- Check 1: Verify table structure
SELECT 
  'users table structure' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'email_verified'
      AND column_default = 'true'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status,
  'email_verified column exists with default true' as description

UNION ALL

SELECT 
  'full_name nullable' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'full_name'
      AND is_nullable = 'YES'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status,
  'full_name column is nullable' as description

UNION ALL

-- Check 2: Verify triggers exist
SELECT 
  'user creation trigger' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'on_auth_user_created'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status,
  'trigger for creating user profiles exists' as description

UNION ALL

SELECT 
  'auto-confirm trigger' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'auto_confirm_user_trigger'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status,
  'trigger for auto-confirming users exists' as description

UNION ALL

-- Check 3: Verify functions exist
SELECT 
  'handle_new_user function' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'handle_new_user'
      AND routine_schema = 'public'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status,
  'function for handling new users exists' as description

UNION ALL

SELECT 
  'auto_confirm_user function' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'auto_confirm_user'
      AND routine_schema = 'auth'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status,
  'function for auto-confirming users exists' as description

UNION ALL

-- Check 4: Verify RLS policies
SELECT 
  'RLS enabled on users' as check_name,
  CASE 
    WHEN (
      SELECT relrowsecurity 
      FROM pg_class 
      WHERE relname = 'users' 
      AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status,
  'Row Level Security enabled on users table' as description

UNION ALL

-- Check 5: Data verification
SELECT 
  'confirmed users ratio' as check_name,
  CASE 
    WHEN (
      SELECT 
        CASE 
          WHEN COUNT(*) = 0 THEN true
          ELSE (COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL))::float / COUNT(*) >= 0.9
        END
      FROM auth.users
    ) THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status,
  'Most users are confirmed (>90%)' as description;

-- Detailed statistics
SELECT 
  '=== DETAILED STATISTICS ===' as section,
  '' as metric,
  '' as value
UNION ALL
SELECT 
  'Auth Users' as section,
  'Total Count' as metric,
  COUNT(*)::text as value
FROM auth.users
UNION ALL
SELECT 
  'Auth Users' as section,
  'Confirmed Count' as metric,
  COUNT(*)::text as value
FROM auth.users 
WHERE email_confirmed_at IS NOT NULL
UNION ALL
SELECT 
  'Auth Users' as section,
  'Unconfirmed Count' as metric,
  COUNT(*)::text as value
FROM auth.users 
WHERE email_confirmed_at IS NULL
UNION ALL
SELECT 
  'Profile Users' as section,
  'Total Count' as metric,
  COUNT(*)::text as value
FROM public.users
UNION ALL
SELECT 
  'Profile Users' as section,
  'Email Verified Count' as metric,
  COUNT(*)::text as value
FROM public.users 
WHERE email_verified = true
UNION ALL
SELECT 
  'User Settings' as section,
  'Total Count' as metric,
  COUNT(*)::text as value
FROM public.user_settings;

-- Show recent user registrations
SELECT 
  '=== RECENT REGISTRATIONS ===' as info,
  '' as email,
  '' as created_at,
  '' as confirmed_status
UNION ALL
SELECT 
  'Recent Users' as info,
  au.email,
  au.created_at::text,
  CASE 
    WHEN au.email_confirmed_at IS NOT NULL THEN 'Confirmed'
    ELSE 'Unconfirmed'
  END as confirmed_status
FROM auth.users au
ORDER BY au.created_at DESC
LIMIT 5;

-- Final recommendations
SELECT 
  '=== RECOMMENDATIONS ===' as section,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE email_confirmed_at IS NULL) 
    THEN 'Some users are unconfirmed. Run the auto-confirm update query.'
    ELSE 'All users are properly confirmed.'
  END as recommendation
UNION ALL
SELECT 
  'Dashboard Settings' as section,
  'Ensure "Enable email confirmations" is OFF in Supabase Dashboard > Authentication > Settings' as recommendation
UNION ALL
SELECT 
  'Testing' as section,
  'Test signup flow to ensure users can register and login immediately' as recommendation;
