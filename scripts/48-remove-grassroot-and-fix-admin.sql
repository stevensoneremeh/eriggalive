-- =====================================================
-- REMOVE GRASSROOT TIER & FIX ADMIN ACCESS
-- =====================================================
-- This script:
-- 1. Removes all grassroot tier references
-- 2. Migrates any grassroot users to erigga_citizen
-- 3. Updates tier enum to only have 3 tiers
-- 4. Grants admin access to info@eriggalive.com
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Migrate grassroot users to erigga_citizen
-- =====================================================

DO $$
DECLARE
  v_migrated_count integer := 0;
BEGIN
  -- Update users table to migrate legacy tiers
  UPDATE public.users
  SET 
    tier = 'erigga_citizen',
    subscription_tier = 'erigga_citizen',
    updated_at = now()
  WHERE tier IN ('grassroot', 'pioneer', 'elder', 'blood', 'blood_brotherhood');
  
  GET DIAGNOSTICS v_migrated_count = ROW_COUNT;
  
  RAISE NOTICE 'Migrated % users from legacy tiers to erigga_citizen', v_migrated_count;
END $$;

-- =====================================================
-- STEP 2: Update tier enum (drop and recreate)
-- =====================================================

DO $$
BEGIN
  -- Convert tier columns to text temporarily
  ALTER TABLE public.users 
    ALTER COLUMN tier TYPE text,
    ALTER COLUMN subscription_tier TYPE text;
  
  -- Drop the old enum
  DROP TYPE IF EXISTS user_tier CASCADE;
  
  -- Create new enum with only 3 tiers
  CREATE TYPE user_tier AS ENUM (
    'erigga_citizen',
    'erigga_indigen', 
    'enterprise'
  );
  
  -- Convert columns back to the new enum
  ALTER TABLE public.users
    ALTER COLUMN tier TYPE user_tier USING tier::user_tier,
    ALTER COLUMN subscription_tier TYPE user_tier USING subscription_tier::user_tier;
  
  RAISE NOTICE 'Created new user_tier enum with 3 tiers';
END $$;

-- =====================================================
-- STEP 3: Set up admin access for info@eriggalive.com
-- =====================================================

DO $$
DECLARE
  v_auth_user_id uuid;
  v_user_id uuid;
BEGIN
  -- Get the auth user
  SELECT id INTO v_auth_user_id
  FROM auth.users
  WHERE email = 'info@eriggalive.com'
  LIMIT 1;
  
  IF v_auth_user_id IS NULL THEN
    RAISE NOTICE 'User info@eriggalive.com not found in auth.users';
    RAISE NOTICE 'Please sign up first, then run this script again';
  ELSE
    RAISE NOTICE 'Found auth user: %', v_auth_user_id;
    
    -- Check if user exists in users table
    SELECT id INTO v_user_id
    FROM public.users
    WHERE auth_user_id = v_auth_user_id OR email = 'info@eriggalive.com'
    LIMIT 1;
    
    IF v_user_id IS NULL THEN
      -- Create new user
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
        points
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
        100000
      );
      
      RAISE NOTICE 'Created admin user profile';
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
        updated_at = now()
      WHERE id = v_user_id;
      
      RAISE NOTICE 'Updated user to admin';
    END IF;
  END IF;
END $$;

-- =====================================================
-- STEP 4: Update RLS policies
-- =====================================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;

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

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.users FOR SELECT
  USING (is_profile_public = true);

-- =====================================================
-- STEP 5: Verification Query
-- =====================================================

-- Check tier distribution
SELECT 
  '====== TIER DISTRIBUTION ======' as info,
  tier,
  COUNT(*) as user_count
FROM public.users
GROUP BY tier
ORDER BY tier;

-- Check admin user
SELECT 
  '====== ADMIN USER ======' as info,
  email,
  username,
  role,
  tier,
  subscription_tier,
  is_verified,
  is_active,
  coins,
  level
FROM public.users
WHERE email = 'info@eriggalive.com';

COMMIT;
