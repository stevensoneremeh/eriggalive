-- Disable email verification requirements in Supabase Auth
-- This script configures Supabase to skip email confirmation during signup

-- First, let's add the missing columns to the users table
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
        RAISE NOTICE 'email_verified column already exists';
    END IF;

    -- Add phone_verified column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'phone_verified') THEN
        ALTER TABLE public.users ADD COLUMN phone_verified boolean DEFAULT false;
        RAISE NOTICE 'Added phone_verified column to users table';
    ELSE
        RAISE NOTICE 'phone_verified column already exists';
    END IF;

    -- Add two_factor_enabled column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'two_factor_enabled') THEN
        ALTER TABLE public.users ADD COLUMN two_factor_enabled boolean DEFAULT false;
        RAISE NOTICE 'Added two_factor_enabled column to users table';
    ELSE
        RAISE NOTICE 'two_factor_enabled column already exists';
    END IF;

    -- Add login_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'login_count') THEN
        ALTER TABLE public.users ADD COLUMN login_count integer DEFAULT 0;
        RAISE NOTICE 'Added login_count column to users table';
    ELSE
        RAISE NOTICE 'login_count column already exists';
    END IF;

    -- Add preferences column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'preferences') THEN
        ALTER TABLE public.users ADD COLUMN preferences jsonb DEFAULT '{}';
        RAISE NOTICE 'Added preferences column to users table';
    ELSE
        RAISE NOTICE 'preferences column already exists';
    END IF;

    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'metadata') THEN
        ALTER TABLE public.users ADD COLUMN metadata jsonb DEFAULT '{}';
        RAISE NOTICE 'Added metadata column to users table';
    ELSE
        RAISE NOTICE 'metadata column already exists';
    END IF;
END $$;

-- Update existing users to have email_verified = true
UPDATE public.users 
SET email_verified = true 
WHERE email_verified IS NULL OR email_verified = false;

-- Update existing users to have default values for new columns
UPDATE public.users 
SET 
    phone_verified = COALESCE(phone_verified, false),
    two_factor_enabled = COALESCE(two_factor_enabled, false),
    login_count = COALESCE(login_count, 0),
    preferences = COALESCE(preferences, '{}'),
    metadata = COALESCE(metadata, '{}')
WHERE phone_verified IS NULL 
   OR two_factor_enabled IS NULL 
   OR login_count IS NULL 
   OR preferences IS NULL 
   OR metadata IS NULL;

-- Configure Supabase Auth to disable email confirmation
-- Note: These settings may need to be configured in the Supabase dashboard as well

-- Create or update auth configuration
INSERT INTO auth.config (parameter, value) 
VALUES ('GOTRUE_MAILER_AUTOCONFIRM', 'true')
ON CONFLICT (parameter) 
DO UPDATE SET value = 'true';

INSERT INTO auth.config (parameter, value) 
VALUES ('GOTRUE_DISABLE_SIGNUP', 'false')
ON CONFLICT (parameter) 
DO UPDATE SET value = 'false';

INSERT INTO auth.config (parameter, value) 
VALUES ('GOTRUE_EXTERNAL_EMAIL_DISABLED', 'false')
ON CONFLICT (parameter) 
DO UPDATE SET value = 'false';

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Display current table structure for verification
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;
