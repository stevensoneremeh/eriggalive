-- =====================================================
-- COMPLETE ADMIN SETUP FOR info@eriggalive.com
-- =====================================================
-- This script performs a comprehensive setup to ensure
-- info@eriggalive.com has full admin access
-- =====================================================

-- Step 1: Check if the user exists in auth.users
DO $$
DECLARE
  v_auth_user_id uuid;
  v_user_exists boolean := false;
BEGIN
  -- Find the auth user
  SELECT id INTO v_auth_user_id
  FROM auth.users
  WHERE email = 'info@eriggalive.com'
  LIMIT 1;

  IF v_auth_user_id IS NULL THEN
    RAISE NOTICE '❌ User info@eriggalive.com not found in auth.users';
    RAISE NOTICE '⚠️  Please create the account first by signing up at your app';
    RAISE EXCEPTION 'User must be created via signup first';
  ELSE
    RAISE NOTICE '✅ Found auth user: %', v_auth_user_id;
  END IF;
END $$;

-- Step 2: Ensure users table exists and has correct structure
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    RAISE NOTICE '⚠️  Users table does not exist, creating it...';
    
    CREATE TABLE IF NOT EXISTS public.users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
      email text UNIQUE NOT NULL,
      username text UNIQUE,
      full_name text,
      avatar_url text,
      profile_image_url text,
      role text DEFAULT 'user',
      tier text DEFAULT 'erigga_citizen',
      subscription_tier text DEFAULT 'erigga_citizen',
      level integer DEFAULT 1,
      points integer DEFAULT 0,
      coins integer DEFAULT 0,
      coins_balance integer DEFAULT 0,
      is_verified boolean DEFAULT false,
      is_active boolean DEFAULT true,
      is_banned boolean DEFAULT false,
      bio text,
      profile_completeness integer DEFAULT 0,
      reputation_score integer DEFAULT 0,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    
    RAISE NOTICE '✅ Users table created';
  ELSE
    RAISE NOTICE '✅ Users table exists';
  END IF;
END $$;

-- Step 3: Update or insert the admin user
DO $$
DECLARE
  v_auth_user_id uuid;
  v_user_id uuid;
BEGIN
  -- Get auth user ID
  SELECT id INTO v_auth_user_id
  FROM auth.users
  WHERE email = 'info@eriggalive.com'
  LIMIT 1;

  -- Check if user exists in users table
  SELECT id INTO v_user_id
  FROM public.users
  WHERE auth_user_id = v_auth_user_id OR email = 'info@eriggalive.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    -- Insert new user
    INSERT INTO public.users (
      auth_user_id,
      email,
      username,
      full_name,
      role,
      tier,
      subscription_tier,
      is_verified,
      is_active,
      coins,
      coins_balance,
      level,
      points,
      profile_completeness
    ) VALUES (
      v_auth_user_id,
      'info@eriggalive.com',
      'erigga_admin',
      'Erigga Live Admin',
      'admin',
      'enterprise',
      'enterprise',
      true,
      true,
      100000,
      100000,
      100,
      100000,
      100
    );
    RAISE NOTICE '✅ Created new admin user profile';
  ELSE
    -- Update existing user
    UPDATE public.users
    SET 
      auth_user_id = v_auth_user_id,
      role = 'admin',
      tier = 'enterprise',
      subscription_tier = 'enterprise',
      is_verified = true,
      is_active = true,
      is_banned = false,
      coins = GREATEST(coins, 100000),
      coins_balance = GREATEST(coins_balance, 100000),
      level = GREATEST(level, 100),
      points = GREATEST(points, 100000),
      profile_completeness = 100,
      updated_at = now()
    WHERE id = v_user_id;
    RAISE NOTICE '✅ Updated existing user to admin';
  END IF;
END $$;

-- Step 4: Handle profiles table if it exists
DO $$
DECLARE
  v_auth_user_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    SELECT id INTO v_auth_user_id
    FROM auth.users
    WHERE email = 'info@eriggalive.com'
    LIMIT 1;

    -- Upsert into profiles
    INSERT INTO public.profiles (
      id,
      email,
      username,
      full_name,
      role,
      tier,
      is_verified,
      updated_at
    ) VALUES (
      v_auth_user_id,
      'info@eriggalive.com',
      'erigga_admin',
      'Erigga Live Admin',
      'admin',
      'enterprise',
      true,
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = 'info@eriggalive.com',
      role = 'admin',
      tier = 'enterprise',
      is_verified = true,
      updated_at = now();
    
    RAISE NOTICE '✅ Updated profiles table';
  ELSE
    RAISE NOTICE '⚠️  Profiles table does not exist (this is OK)';
  END IF;
END $$;

-- Step 5: Enable RLS and create policies
DO $$
BEGIN
  -- Enable RLS on users table
  ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
  DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
  DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
  DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
  
  -- Create new policies
  CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = auth_user_id);
  
  CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = auth_user_id);
  
  CREATE POLICY "Admins can view all users"
    ON public.users FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE auth_user_id = auth.uid()
        AND role IN ('admin', 'super_admin')
      )
    );
  
  CREATE POLICY "Admins can update all users"
    ON public.users FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE auth_user_id = auth.uid()
        AND role IN ('admin', 'super_admin')
      )
    );
  
  RAISE NOTICE '✅ RLS policies configured';
END $$;

-- Step 6: Verification
SELECT 
  '====== ADMIN SETUP VERIFICATION ======' as verification;

SELECT 
  'auth.users' as table_name,
  id,
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  created_at
FROM auth.users
WHERE email = 'info@eriggalive.com';

SELECT 
  'public.users' as table_name,
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
  coins_balance,
  level
FROM public.users
WHERE email = 'info@eriggalive.com';

-- Final status
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.users 
      WHERE email = 'info@eriggalive.com' 
      AND role = 'admin'
      AND is_active = true
    ) THEN '✅✅✅ ADMIN ACCESS SUCCESSFULLY CONFIGURED ✅✅✅'
    ELSE '❌ Setup incomplete - please review errors above'
  END as final_status;
