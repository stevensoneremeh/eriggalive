-- =====================================================
-- Grant Admin Access to info@eriggalive.com
-- =====================================================
-- This script ensures the user info@eriggalive.com has full admin access
-- Run this script in your Supabase SQL Editor

-- First, let's find the auth user ID for info@eriggalive.com
DO $$
DECLARE
  v_auth_user_id uuid;
  v_user_id uuid;
BEGIN
  -- Get the auth user ID from auth.users
  SELECT id INTO v_auth_user_id
  FROM auth.users
  WHERE email = 'info@eriggalive.com'
  LIMIT 1;

  IF v_auth_user_id IS NULL THEN
    RAISE NOTICE 'User info@eriggalive.com not found in auth.users. Please create the account first.';
    RAISE EXCEPTION 'User not found';
  ELSE
    RAISE NOTICE 'Found auth user: %', v_auth_user_id;

    -- Check if user exists in users table
    SELECT id INTO v_user_id
    FROM public.users
    WHERE email = 'info@eriggalive.com' OR auth_user_id = v_auth_user_id
    LIMIT 1;

    IF v_user_id IS NULL THEN
      -- Create user profile if it doesn't exist
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
      )
      RETURNING id INTO v_user_id;
      
      RAISE NOTICE 'Created new user profile with ID: %', v_user_id;
    ELSE
      -- Update existing user to admin
      UPDATE public.users
      SET 
        role = 'admin',
        tier = 'enterprise',
        subscription_tier = 'enterprise',
        is_verified = true,
        is_active = true,
        coins = GREATEST(coins, 100000),
        coins_balance = GREATEST(coins_balance, 100000),
        level = GREATEST(level, 100),
        points = GREATEST(points, 100000),
        profile_completeness = 100,
        updated_at = NOW()
      WHERE id = v_user_id;
      
      RAISE NOTICE 'Updated user % to admin access', v_user_id;
    END IF;

    -- Also check profiles table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
      -- Update or insert into profiles table
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
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        role = 'admin',
        tier = 'enterprise',
        is_verified = true,
        updated_at = NOW();
      
      RAISE NOTICE 'Updated profiles table for admin access';
    END IF;

    RAISE NOTICE '✅ Admin access granted successfully to info@eriggalive.com';
  END IF;
END $$;

-- Verify the changes
SELECT 
  u.id,
  u.email,
  u.username,
  u.role,
  u.tier,
  u.subscription_tier,
  u.is_verified,
  u.is_active,
  u.coins,
  u.coins_balance
FROM public.users u
WHERE u.email = 'info@eriggalive.com';

-- Grant additional permissions if needed
COMMENT ON TABLE public.users IS 'User info@eriggalive.com has been granted admin access';
