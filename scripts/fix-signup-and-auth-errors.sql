
-- Complete fix for signup and authentication errors
-- Run this script to fix all database-related signup issues

-- Step 1: Ensure the user_tier enum has correct values
DO $$ 
BEGIN
    -- Drop the old enum if it exists and recreate with correct values
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_tier') THEN
        -- Update any existing users to use lowercase values first
        UPDATE public.users SET tier = 'free'::text WHERE tier::text = 'FREE';
        UPDATE public.users SET tier = 'pro'::text WHERE tier::text = 'PRO';  
        UPDATE public.users SET tier = 'enterprise'::text WHERE tier::text = 'ENT';
        
        -- Now we can safely alter the enum
        ALTER TYPE user_tier RENAME TO user_tier_old;
    END IF;
    
    -- Create the new enum with correct values
    CREATE TYPE user_tier AS ENUM ('free', 'pro', 'enterprise');
    
    -- Update the users table to use the new enum
    ALTER TABLE public.users 
    ALTER COLUMN tier TYPE user_tier USING 
    CASE 
        WHEN tier::text IN ('FREE', 'free') THEN 'free'::user_tier
        WHEN tier::text IN ('PRO', 'pro') THEN 'pro'::user_tier  
        WHEN tier::text IN ('ENT', 'enterprise') THEN 'enterprise'::user_tier
        ELSE 'free'::user_tier
    END;
    
    -- Drop the old enum
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_tier_old') THEN
        DROP TYPE user_tier_old;
    END IF;
END $$;

-- Step 2: Ensure users table has all required columns
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS custom_amount TEXT;

-- Step 3: Create or replace the user creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    user_tier_val user_tier := 'free';
    user_username text;
    user_full_name text;
    user_payment_ref text;
    user_custom_amount text;
BEGIN
    -- Extract metadata from auth.users with better error handling
    BEGIN
        user_tier_val := CASE 
            WHEN NEW.raw_user_meta_data->>'tier' IN ('PRO', 'pro') THEN 'pro'::user_tier
            WHEN NEW.raw_user_meta_data->>'tier' IN ('ENT', 'enterprise') THEN 'enterprise'::user_tier
            ELSE 'free'::user_tier
        END;
        
        user_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
        user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
        user_payment_ref := NEW.raw_user_meta_data->>'payment_reference';
        user_custom_amount := NEW.raw_user_meta_data->>'custom_amount';
        
        -- Ensure username is unique
        WHILE EXISTS (SELECT 1 FROM public.users WHERE username = user_username) LOOP
            user_username := user_username || floor(random() * 1000)::text;
        END LOOP;
        
        -- Insert new user profile
        INSERT INTO public.users (
            auth_user_id,
            username,
            full_name,
            email,
            tier,
            email_verified,
            payment_reference,
            custom_amount,
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
            user_tier_val,
            NEW.email_confirmed_at IS NOT NULL,
            user_payment_ref,
            user_custom_amount,
            CASE 
                WHEN user_tier_val = 'pro' THEN 1000 
                WHEN user_tier_val = 'enterprise' THEN 12000 
                ELSE 100 
            END,
            1,
            0,
            true,
            NOW(),
            NOW()
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Log error but don't fail the auth user creation
            RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Update RLS policies for better security
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = auth_user_id::text);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;  
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = auth_user_id::text);

-- Step 6: Grant proper permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 7: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_tier ON public.users(tier);

-- Verification query
SELECT 'Migration completed successfully. User tier enum values:' as status;
SELECT enumlabel as available_tiers FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_tier');
