-- =====================================================
-- Verify Admin Setup for info@eriggalive.com
-- =====================================================

-- Check auth.users
SELECT 
  'Auth Users' as table_name,
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'info@eriggalive.com';

-- Check public.users
SELECT 
  'Public Users' as table_name,
  id,
  auth_user_id,
  email,
  username,
  role,
  tier,
  subscription_tier,
  is_verified,
  is_active,
  coins,
  coins_balance
FROM public.users
WHERE email = 'info@eriggalive.com' OR username = 'erigga_admin';

-- Check profiles if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    RAISE NOTICE 'Checking profiles table...';
    EXECUTE '
      SELECT 
        ''Profiles'' as table_name,
        id,
        email,
        username,
        role,
        tier
      FROM public.profiles
      WHERE email = ''info@eriggalive.com''
    ';
  END IF;
END $$;

-- Summary
SELECT 
  '====== ADMIN ACCESS SUMMARY ======' as summary;
  
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.users 
      WHERE email = 'info@eriggalive.com' 
      AND role IN ('admin', 'super_admin')
    ) THEN '✅ Admin access is correctly configured'
    ELSE '❌ Admin access NOT configured - Run script 45-grant-admin-access-info.sql'
  END as status;
