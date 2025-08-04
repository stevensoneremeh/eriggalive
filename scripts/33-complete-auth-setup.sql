-- Complete Authentication Setup Script
-- This script sets up the entire authentication system without email verification

-- Step 1: Ensure proper user table structure
DO $$
BEGIN
  -- Make full_name nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'full_name' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.users ALTER COLUMN full_name DROP NOT NULL;
    RAISE NOTICE 'Made full_name column nullable';
  END IF;

  -- Ensure email_verified column exists and defaults to true
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE public.users ADD COLUMN email_verified boolean DEFAULT true;
    RAISE NOTICE 'Added email_verified column';
  ELSE
    -- Update default value
    ALTER TABLE public.users ALTER COLUMN email_verified SET DEFAULT true;
    RAISE NOTICE 'Updated email_verified default value';
  END IF;

  -- Ensure phone_verified column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'phone_verified'
  ) THEN
    ALTER TABLE public.users ADD COLUMN phone_verified boolean DEFAULT false;
    RAISE NOTICE 'Added phone_verified column';
  END IF;
END $$;

-- Step 2: Update existing users
UPDATE public.users 
SET email_verified = true 
WHERE email_verified IS NULL OR email_verified = false;

-- Step 3: Create enhanced user creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_username text;
  username_counter integer := 0;
  base_username text;
BEGIN
  -- Generate a unique username
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  
  new_username := base_username;
  
  -- Ensure username is unique
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = new_username) LOOP
    username_counter := username_counter + 1;
    new_username := base_username || '_' || username_counter;
  END LOOP;

  -- Insert new user profile
  INSERT INTO public.users (
    auth_user_id,
    username,
    full_name,
    email,
    email_verified,
    phone_verified,
    tier,
    role,
    level,
    points,
    coins,
    is_verified,
    is_active,
    is_banned,
    two_factor_enabled,
    login_count,
    preferences,
    metadata,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    new_username,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    true, -- Always verified
    false,
    'grassroot'::user_tier,
    'user'::user_role,
    1,
    0,
    500, -- Starting coins
    false,
    true,
    false,
    false,
    1,
    '{}',
    '{}',
    NOW(),
    NOW()
  );

  -- Create user settings
  INSERT INTO public.user_settings (
    user_id,
    theme,
    language,
    timezone,
    email_notifications,
    push_notifications,
    sms_notifications,
    marketing_emails,
    privacy_level,
    auto_play_videos,
    show_online_status,
    allow_friend_requests,
    content_filter_level,
    created_at,
    updated_at
  )
  SELECT 
    u.id,
    'system',
    'en',
    'UTC',
    true,
    true,
    false,
    true,
    'public',
    true,
    true,
    true,
    'moderate',
    NOW(),
    NOW()
  FROM public.users u 
  WHERE u.auth_user_id = NEW.id;

  RAISE NOTICE 'Created user profile for: %', NEW.email;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error creating user profile for %: %', NEW.email, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create/recreate triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Auto-confirm function for auth.users
CREATE OR REPLACE FUNCTION auth.auto_confirm_user()
RETURNS trigger AS $$
BEGIN
  -- Auto-confirm email and phone
  NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, NOW());
  NEW.phone_confirmed_at = COALESCE(NEW.phone_confirmed_at, NOW());
  NEW.confirmed_at = COALESCE(NEW.confirmed_at, NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create auto-confirm trigger
DROP TRIGGER IF EXISTS auto_confirm_user_trigger ON auth.users;
CREATE TRIGGER auto_confirm_user_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.auto_confirm_user();

-- Step 7: Update existing unconfirmed users
UPDATE auth.users 
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, created_at, NOW()),
  phone_confirmed_at = COALESCE(phone_confirmed_at, created_at, NOW()),
  confirmed_at = COALESCE(confirmed_at, created_at, NOW())
WHERE 
  email_confirmed_at IS NULL 
  OR phone_confirmed_at IS NULL 
  OR confirmed_at IS NULL;

-- Step 8: Set up proper RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can manage own settings" ON public.user_settings;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Public profiles viewable" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own settings" ON public.user_settings
  FOR ALL USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Step 9: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.user_settings TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Grant auth function permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION auth.auto_confirm_user() TO supabase_auth_admin;

-- Step 10: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- Step 11: Final verification and summary
DO $$
DECLARE
  total_auth_users integer;
  total_profile_users integer;
  confirmed_users integer;
BEGIN
  SELECT COUNT(*) INTO total_auth_users FROM auth.users;
  SELECT COUNT(*) INTO total_profile_users FROM public.users;
  SELECT COUNT(*) INTO confirmed_users FROM auth.users WHERE email_confirmed_at IS NOT NULL;
  
  RAISE NOTICE '=== AUTHENTICATION SETUP COMPLETE ===';
  RAISE NOTICE 'Total auth users: %', total_auth_users;
  RAISE NOTICE 'Total profile users: %', total_profile_users;
  RAISE NOTICE 'Confirmed users: %', confirmed_users;
  RAISE NOTICE '';
  RAISE NOTICE 'Configuration Summary:';
  RAISE NOTICE '✓ Email verification: DISABLED';
  RAISE NOTICE '✓ Auto-confirmation: ENABLED';
  RAISE NOTICE '✓ User profiles: AUTO-CREATED';
  RAISE NOTICE '✓ RLS policies: CONFIGURED';
  RAISE NOTICE '✓ Triggers: ACTIVE';
  RAISE NOTICE '';
  RAISE NOTICE 'Manual steps required:';
  RAISE NOTICE '1. Go to Supabase Dashboard > Authentication > Settings';
  RAISE NOTICE '2. Turn OFF "Enable email confirmations"';
  RAISE NOTICE '3. Turn ON "Enable signup"';
  RAISE NOTICE '4. Save settings';
  RAISE NOTICE '';
  RAISE NOTICE 'Your authentication system is now ready!';
END $$;
