
-- Fix user signup database issues
-- This script ensures proper user profile creation during signup

-- First, we need to properly handle the enum type conversion
DO $$
BEGIN
    -- Check if we need to update the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel IN ('FREE', 'PRO', 'ENT') 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_tier')
    ) THEN
        -- Add new enum values if they don't exist
        BEGIN
            ALTER TYPE user_tier ADD VALUE IF NOT EXISTS 'FREE';
            ALTER TYPE user_tier ADD VALUE IF NOT EXISTS 'PRO'; 
            ALTER TYPE user_tier ADD VALUE IF NOT EXISTS 'ENT';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not add enum values, they may already exist';
        END;
    END IF;
END $$;

-- Update the constraint to accept both old and new tier values
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_tier_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_tier_check 
CHECK (tier IN ('FREE', 'PRO', 'ENT', 'erigga_citizen', 'erigga_indigen', 'enterprise'));

-- Update existing users with old tier names to new ones
UPDATE public.users 
SET tier = 'FREE' 
WHERE tier IN ('free', 'grassroot', 'erigga_citizen');

UPDATE public.users 
SET tier = 'PRO' 
WHERE tier IN ('pro', 'pioneer', 'erigga_indigen');

UPDATE public.users 
SET tier = 'ENT' 
WHERE tier IN ('enterprise', 'elder', 'blood_brotherhood');

-- Create or replace the trigger function for user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    user_tier text := 'FREE';
    user_username text;
    user_full_name text;
    user_payment_ref text;
BEGIN
    -- Extract metadata from auth.users
    user_tier := COALESCE(NEW.raw_user_meta_data->>'tier', 'FREE');
    user_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    user_payment_ref := NEW.raw_user_meta_data->>'payment_reference';

    -- Ensure username is unique by appending random number if needed
    WHILE EXISTS (SELECT 1 FROM public.users WHERE username = user_username) LOOP
        user_username := user_username || floor(random() * 1000)::text;
    END LOOP;

    -- Insert new user profile with better error handling
    INSERT INTO public.users (
        auth_user_id,
        username,
        full_name,
        email,
        tier,
        email_verified,
        payment_reference,
        coins,
        level,
        points,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        user_username,
        user_full_name,
        NEW.email,
        user_tier::text,  -- Cast to text to avoid enum issues
        NEW.email_confirmed_at IS NOT NULL,
        user_payment_ref,
        CASE WHEN user_tier = 'PRO' THEN 1000 WHEN user_tier = 'ENT' THEN 12000 ELSE 100 END,
        1,
        0,
        true,
        NOW(),
        NOW()
    ) ON CONFLICT (auth_user_id) DO UPDATE SET
        email = EXCLUDED.email,
        tier = EXCLUDED.tier,
        email_verified = EXCLUDED.email_verified,
        payment_reference = EXCLUDED.payment_reference,
        updated_at = NOW();

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the auth user creation
        RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure proper RLS policies
DROP POLICY IF EXISTS "Users can insert during signup" ON public.users;
CREATE POLICY "Users can insert during signup" ON public.users
    FOR INSERT WITH CHECK (auth.uid()::text = auth_user_id::text);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT ON public.users TO authenticated, anon;
GRANT INSERT, UPDATE ON public.users TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
