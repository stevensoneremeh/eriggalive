-- Supabase Authentication Configuration Script
-- This script disables email verification requirements for user signup

-- Set authentication configuration to disable email confirmations
-- This must be run as a superuser or supabase_auth_admin

-- Disable email confirmation for signups
UPDATE auth.config 
SET 
  enable_signup = true,
  enable_confirmations = false,
  enable_email_confirmations = false
WHERE 
  id = 'auth-config';

-- If the config row doesn't exist, insert it
INSERT INTO auth.config (id, enable_signup, enable_confirmations, enable_email_confirmations)
SELECT 'auth-config', true, false, false
WHERE NOT EXISTS (SELECT 1 FROM auth.config WHERE id = 'auth-config');

-- Alternative method using Supabase's auth configuration
-- Update the auth schema configuration directly
DO $$
BEGIN
  -- Check if we can access auth.config table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'config') THEN
    -- Update existing configuration
    UPDATE auth.config SET 
      enable_confirmations = false,
      enable_email_confirmations = false,
      enable_signup = true
    WHERE id = 'default';
    
    -- Insert if doesn't exist
    INSERT INTO auth.config (id, enable_confirmations, enable_email_confirmations, enable_signup)
    SELECT 'default', false, false, true
    WHERE NOT EXISTS (SELECT 1 FROM auth.config WHERE id = 'default');
    
    RAISE NOTICE 'Email confirmation disabled successfully';
  ELSE
    RAISE NOTICE 'Auth config table not accessible. Please configure in Supabase Dashboard.';
  END IF;
END $$;

-- Set site URL and redirect URLs (adjust as needed)
-- These settings help with proper authentication flow
UPDATE auth.config SET 
  site_url = COALESCE(current_setting('app.settings.site_url', true), 'http://localhost:3000'),
  additional_redirect_urls = COALESCE(current_setting('app.settings.redirect_urls', true), 'http://localhost:3000,https://your-domain.com')
WHERE id IN ('auth-config', 'default');

-- Create or update auth configuration using the proper Supabase method
-- This uses the internal Supabase configuration system
SELECT auth.set_config('DISABLE_SIGNUP', 'false');
SELECT auth.set_config('ENABLE_EMAIL_CONFIRMATIONS', 'false');
SELECT auth.set_config('ENABLE_EMAIL_AUTOCONFIRM', 'true');
SELECT auth.set_config('ENABLE_PHONE_CONFIRMATIONS', 'false');
SELECT auth.set_config('ENABLE_PHONE_AUTOCONFIRM', 'false');

-- Alternative approach using system settings
-- Update auth settings in the auth.config table if it exists
DO $$
DECLARE
  config_exists boolean;
BEGIN
  -- Check if auth.config exists and is accessible
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'auth' AND table_name = 'config'
  ) INTO config_exists;
  
  IF config_exists THEN
    -- Try to update the configuration
    BEGIN
      -- Disable email confirmations
      INSERT INTO auth.config (parameter, value) 
      VALUES ('DISABLE_SIGNUP', 'false')
      ON CONFLICT (parameter) DO UPDATE SET value = 'false';
      
      INSERT INTO auth.config (parameter, value) 
      VALUES ('ENABLE_EMAIL_CONFIRMATIONS', 'false')
      ON CONFLICT (parameter) DO UPDATE SET value = 'false';
      
      INSERT INTO auth.config (parameter, value) 
      VALUES ('ENABLE_EMAIL_AUTOCONFIRM', 'true')
      ON CONFLICT (parameter) DO UPDATE SET value = 'true';
      
      RAISE NOTICE 'Auth configuration updated successfully';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not update auth configuration: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Auth config table not found. Please configure manually in Supabase Dashboard.';
  END IF;
END $$;

-- Create a function to handle auto-confirmation of users
-- This ensures users are automatically confirmed without email verification
CREATE OR REPLACE FUNCTION auth.auto_confirm_user()
RETURNS trigger AS $$
BEGIN
  -- Auto-confirm the user's email
  NEW.email_confirmed_at = NOW();
  NEW.confirmed_at = NOW();
  
  -- Set email confirmation status
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at = NOW();
  END IF;
  
  IF NEW.confirmed_at IS NULL THEN
    NEW.confirmed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-confirm users on signup
DROP TRIGGER IF EXISTS auto_confirm_user_trigger ON auth.users;
CREATE TRIGGER auto_confirm_user_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.auto_confirm_user();

-- Update existing unconfirmed users to be confirmed
UPDATE auth.users 
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  confirmed_at = COALESCE(confirmed_at, NOW())
WHERE 
  email_confirmed_at IS NULL 
  OR confirmed_at IS NULL;

-- Grant necessary permissions for the auth functions
GRANT EXECUTE ON FUNCTION auth.auto_confirm_user() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION auth.auto_confirm_user() TO postgres;

-- Log the configuration changes
DO $$
BEGIN
  RAISE NOTICE '=== Supabase Auth Configuration Complete ===';
  RAISE NOTICE 'Email confirmations: DISABLED';
  RAISE NOTICE 'Auto-confirm users: ENABLED';
  RAISE NOTICE 'Signup: ENABLED';
  RAISE NOTICE '';
  RAISE NOTICE 'Additional steps required:';
  RAISE NOTICE '1. In Supabase Dashboard > Authentication > Settings';
  RAISE NOTICE '2. Set "Enable email confirmations" to OFF';
  RAISE NOTICE '3. Set "Enable signup" to ON';
  RAISE NOTICE '4. Save the configuration';
END $$;

-- Verify the configuration
SELECT 
  'Auth Users Count' as metric,
  COUNT(*) as value
FROM auth.users
UNION ALL
SELECT 
  'Confirmed Users Count' as metric,
  COUNT(*) as value
FROM auth.users 
WHERE email_confirmed_at IS NOT NULL
UNION ALL
SELECT 
  'Unconfirmed Users Count' as metric,
  COUNT(*) as value
FROM auth.users 
WHERE email_confirmed_at IS NULL;
