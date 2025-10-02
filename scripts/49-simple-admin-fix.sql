-- Simple admin fix for info@eriggalive.com

-- Step 1: Update the user to admin if they exist
UPDATE public.users
SET 
  role = 'admin',
  tier = 'enterprise',
  subscription_tier = 'enterprise',
  is_verified = true,
  is_active = true,
  is_banned = false,
  coins = 100000,
  coins_balance = 100000,
  level = 100,
  points = 100000,
  updated_at = now()
WHERE email = 'info@eriggalive.com';

-- Step 2: If no user exists, check auth.users and create one
DO $$
DECLARE
  v_auth_id uuid;
BEGIN
  -- Get auth user ID
  SELECT id INTO v_auth_id
  FROM auth.users
  WHERE email = 'info@eriggalive.com'
  LIMIT 1;
  
  -- If auth user exists but no profile, create it
  IF v_auth_id IS NOT NULL THEN
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
    )
    SELECT
      v_auth_id,
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
    WHERE NOT EXISTS (
      SELECT 1 FROM public.users WHERE auth_user_id = v_auth_id
    );
  END IF;
END $$;

-- Step 3: Verify the change
SELECT 
  email,
  username,
  role,
  tier,
  is_active,
  coins
FROM public.users
WHERE email = 'info@eriggalive.com';
