-- =====================================================
-- COMPLETE GRASSROOT REMOVAL AND TIER MIGRATION
-- =====================================================
-- This script completely removes grassroot from the database
-- and migrates all users to the new 3-tier system
-- =====================================================

BEGIN;

-- Step 1: Drop all dependent policies first
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Step 2: Temporarily disable RLS
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;

-- Step 3: Change tier columns to text temporarily
ALTER TABLE public.users 
    ALTER COLUMN tier TYPE text,
    ALTER COLUMN subscription_tier TYPE text;

-- Step 4: Update all existing data to new tier names
UPDATE public.users
SET 
    tier = CASE 
        WHEN LOWER(tier) IN ('grassroot', 'grassroots', 'pioneer', 'free') THEN 'erigga_citizen'
        WHEN LOWER(tier) IN ('elder', 'pro') THEN 'erigga_indigen'
        WHEN LOWER(tier) IN ('blood', 'blood_brotherhood', 'bloodbrotherhood', 'ent', 'enterprise') THEN 'enterprise'
        WHEN LOWER(tier) = 'erigga_citizen' THEN 'erigga_citizen'
        WHEN LOWER(tier) = 'erigga_indigen' THEN 'erigga_indigen'
        ELSE 'erigga_citizen'
    END,
    subscription_tier = CASE 
        WHEN LOWER(subscription_tier) IN ('grassroot', 'grassroots', 'pioneer', 'free') THEN 'erigga_citizen'
        WHEN LOWER(subscription_tier) IN ('elder', 'pro') THEN 'erigga_indigen'
        WHEN LOWER(subscription_tier) IN ('blood', 'blood_brotherhood', 'bloodbrotherhood', 'ent', 'enterprise') THEN 'enterprise'
        WHEN LOWER(subscription_tier) = 'erigga_citizen' THEN 'erigga_citizen'
        WHEN LOWER(subscription_tier) = 'erigga_indigen' THEN 'erigga_indigen'
        ELSE 'erigga_citizen'
    END,
    updated_at = now();

-- Step 5: Drop old enum type if exists
DROP TYPE IF EXISTS user_tier CASCADE;

-- Step 6: Create new enum type with only 3 tiers
CREATE TYPE user_tier AS ENUM ('erigga_citizen', 'erigga_indigen', 'enterprise');

-- Step 7: Convert columns back to enum type
ALTER TABLE public.users 
    ALTER COLUMN tier TYPE user_tier USING tier::user_tier,
    ALTER COLUMN subscription_tier TYPE user_tier USING subscription_tier::user_tier;

-- Step 8: Set default values
ALTER TABLE public.users 
    ALTER COLUMN tier SET DEFAULT 'erigga_citizen'::user_tier,
    ALTER COLUMN subscription_tier SET DEFAULT 'erigga_citizen'::user_tier;

-- Step 9: Create or update admin user
DO $$
DECLARE
    v_auth_user_id uuid;
    v_user_exists boolean;
BEGIN
    -- Get the auth user ID for info@eriggalive.com
    SELECT id INTO v_auth_user_id
    FROM auth.users
    WHERE email = 'info@eriggalive.com'
    LIMIT 1;
    
    IF v_auth_user_id IS NOT NULL THEN
        -- Check if user profile exists
        SELECT EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = v_auth_user_id 
               OR email = 'info@eriggalive.com'
        ) INTO v_user_exists;
        
        IF v_user_exists THEN
            -- Update existing user
            UPDATE public.users
            SET 
                auth_user_id = v_auth_user_id,
                role = 'admin',
                tier = 'enterprise'::user_tier,
                subscription_tier = 'enterprise'::user_tier,
                is_verified = true,
                is_active = true,
                is_banned = false,
                coins = GREATEST(coins, 100000),
                coins_balance = GREATEST(coins_balance, 100000),
                level = GREATEST(level, 100),
                points = GREATEST(points, 100000),
                updated_at = now()
            WHERE auth_user_id = v_auth_user_id 
               OR email = 'info@eriggalive.com';
            
            RAISE NOTICE 'Updated admin user: info@eriggalive.com';
        ELSE
            -- Create new user
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
                v_auth_user_id,
                'info@eriggalive.com',
                'erigga_admin',
                'Erigga Live Admin',
                'Admin',
                'admin',
                'enterprise'::user_tier,
                'enterprise'::user_tier,
                true,
                true,
                100000,
                100000,
                100,
                100000
            );
            
            RAISE NOTICE 'Created admin user: info@eriggalive.com';
        END IF;
    ELSE
        RAISE NOTICE 'Auth user not found for info@eriggalive.com - please create auth user first';
    END IF;
END $$;

-- Step 10: Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 11: Recreate RLS policies
CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);

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
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE auth_user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can insert users"
    ON public.users FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE auth_user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Public profiles are viewable"
    ON public.users FOR SELECT
    USING (is_profile_public = true);

CREATE POLICY "Authenticated users can view users"
    ON public.users FOR SELECT
    USING (auth.role() = 'authenticated');

-- Step 12: Create indexes
CREATE INDEX IF NOT EXISTS idx_users_tier ON public.users(tier);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_seen_at ON public.users(last_seen_at);

-- Step 13: Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 14: Verification and reporting
DO $$
DECLARE
    v_total_users integer;
    v_citizen_count integer;
    v_indigen_count integer;
    v_enterprise_count integer;
    v_admin_count integer;
BEGIN
    SELECT COUNT(*) INTO v_total_users FROM public.users;
    SELECT COUNT(*) INTO v_citizen_count FROM public.users WHERE tier = 'erigga_citizen';
    SELECT COUNT(*) INTO v_indigen_count FROM public.users WHERE tier = 'erigga_indigen';
    SELECT COUNT(*) INTO v_enterprise_count FROM public.users WHERE tier = 'enterprise';
    SELECT COUNT(*) INTO v_admin_count FROM public.users WHERE role = 'admin';
    
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'MIGRATION COMPLETE';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Total Users: %', v_total_users;
    RAISE NOTICE 'Erigga Citizens: %', v_citizen_count;
    RAISE NOTICE 'Erigga Indigens: %', v_indigen_count;
    RAISE NOTICE 'Enterprise Members: %', v_enterprise_count;
    RAISE NOTICE 'Admin Users: %', v_admin_count;
    RAISE NOTICE '==============================================';
END $$;

-- Final check: Show admin user details
SELECT 
    'ADMIN USER DETAILS' as section,
    id,
    email,
    username,
    role,
    tier::text,
    subscription_tier::text,
    coins,
    coins_balance,
    level,
    is_verified,
    is_active
FROM public.users
WHERE email = 'info@eriggalive.com';

-- Show tier distribution
SELECT 
    'TIER DISTRIBUTION' as section,
    tier::text as tier_name,
    COUNT(*) as user_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM public.users), 2) as percentage
FROM public.users
GROUP BY tier
ORDER BY 
    CASE tier
        WHEN 'erigga_citizen'::user_tier THEN 1
        WHEN 'erigga_indigen'::user_tier THEN 2
        WHEN 'enterprise'::user_tier THEN 3
    END;

COMMIT;
