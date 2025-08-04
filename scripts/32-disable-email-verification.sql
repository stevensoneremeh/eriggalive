-- Complete script to disable all verification requirements
-- This adds missing columns and configures immediate access

-- First, add all missing columns to the users table
DO $$ 
BEGIN
    -- Add email_verified column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'email_verified') THEN
        ALTER TABLE public.users ADD COLUMN email_verified boolean DEFAULT true;
        RAISE NOTICE 'Added email_verified column to users table';
    ELSE
        -- Update existing column to default true
        ALTER TABLE public.users ALTER COLUMN email_verified SET DEFAULT true;
        RAISE NOTICE 'Updated email_verified column default to true';
    END IF;

    -- Add phone_verified column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'phone_verified') THEN
        ALTER TABLE public.users ADD COLUMN phone_verified boolean DEFAULT true;
        RAISE NOTICE 'Added phone_verified column to users table';
    ELSE
        -- Update existing column to default true (no verification needed)
        ALTER TABLE public.users ALTER COLUMN phone_verified SET DEFAULT true;
        RAISE NOTICE 'Updated phone_verified column default to true';
    END IF;

    -- Add two_factor_enabled column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'two_factor_enabled') THEN
        ALTER TABLE public.users ADD COLUMN two_factor_enabled boolean DEFAULT false;
        RAISE NOTICE 'Added two_factor_enabled column to users table';
    END IF;

    -- Add login_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'login_count') THEN
        ALTER TABLE public.users ADD COLUMN login_count integer DEFAULT 1;
        RAISE NOTICE 'Added login_count column to users table';
    END IF;

    -- Add preferences column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'preferences') THEN
        ALTER TABLE public.users ADD COLUMN preferences jsonb DEFAULT '{}';
        RAISE NOTICE 'Added preferences column to users table';
    END IF;

    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'metadata') THEN
        ALTER TABLE public.users ADD COLUMN metadata jsonb DEFAULT '{}';
        RAISE NOTICE 'Added metadata column to users table';
    END IF;

    -- Make full_name nullable
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'users' 
               AND column_name = 'full_name' 
               AND is_nullable = 'NO') THEN
        ALTER TABLE public.users ALTER COLUMN full_name DROP NOT NULL;
        RAISE NOTICE 'Made full_name column nullable';
    END IF;
END $$;

-- Update all existing users to be verified (no verification needed)
UPDATE public.users 
SET 
    email_verified = true,
    phone_verified = true,
    login_count = COALESCE(login_count, 1),
    preferences = COALESCE(preferences, '{}'),
    metadata = COALESCE(metadata, '{}')
WHERE email_verified IS NULL 
   OR phone_verified IS NULL 
   OR login_count IS NULL 
   OR preferences IS NULL 
   OR metadata IS NULL;

-- Auto-confirm all auth.users (remove email confirmation requirement)
UPDATE auth.users 
SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    phone_confirmed_at = COALESCE(phone_confirmed_at, NOW()),
    confirmed_at = COALESCE(confirmed_at, NOW())
WHERE email_confirmed_at IS NULL 
   OR phone_confirmed_at IS NULL 
   OR confirmed_at IS NULL;

-- Create function to auto-confirm new auth users
CREATE OR REPLACE FUNCTION auth.auto_confirm_user()
RETURNS trigger AS $$
BEGIN
    -- Auto-confirm everything immediately
    NEW.email_confirmed_at = NOW();
    NEW.phone_confirmed_at = NOW();
    NEW.confirmed_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-confirm users on signup
DROP TRIGGER IF EXISTS auto_confirm_user_trigger ON auth.users;
CREATE TRIGGER auto_confirm_user_trigger
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auth.auto_confirm_user();

-- Grant permissions
GRANT EXECUTE ON FUNCTION auth.auto_confirm_user() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION auth.auto_confirm_user() TO postgres;

RAISE NOTICE '✅ All verification requirements disabled';
RAISE NOTICE '✅ Users will have immediate access after signup/signin';
