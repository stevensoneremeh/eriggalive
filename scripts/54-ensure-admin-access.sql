-- Ensure admin user has proper access
DO $$
DECLARE
  v_auth_id uuid;
BEGIN
  -- Get auth user ID
  SELECT id INTO v_auth_id
  FROM auth.users
  WHERE email = 'info@eriggalive.com'
  LIMIT 1;
  
  IF v_auth_id IS NOT NULL THEN
    -- Ensure user profile exists and has admin access
    INSERT INTO public.users (
      auth_user_id,
      email,
      username,
      full_name,
      display_name,
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
      v_auth_id,
      'info@eriggalive.com',
      'erigga_admin',
      'Erigga Live Admin',
      'Admin',
      'admin',
      'enterprise',
      'enterprise',
      true,
      true,
      100000,
      100000,
      100,
      100000
    )
    ON CONFLICT (auth_user_id) DO UPDATE SET
      role = 'admin',
      tier = 'enterprise',
      subscription_tier = 'enterprise',
      is_verified = true,
      is_active = true,
      is_banned = false,
      coins = GREATEST(users.coins, 100000),
      coins_balance = GREATEST(users.coins_balance, 100000),
      level = GREATEST(users.level, 100),
      points = GREATEST(users.points, 100000),
      updated_at = now();
      
    RAISE NOTICE 'Admin user configured successfully';
  ELSE
    RAISE NOTICE 'Auth user not found - please sign up first';
  END IF;
END $$;

-- Verify
SELECT email, username, role, tier, is_verified, is_active
FROM public.users
WHERE email = 'info@eriggalive.com';
