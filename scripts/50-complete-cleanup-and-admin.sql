-- =====================================================
-- COMPLETE CLEANUP & ADMIN SETUP
-- =====================================================
-- This script does a complete cleanup of grassroot references
-- and sets up admin access properly
-- =====================================================

BEGIN;

-- Step 1: Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id uuid UNIQUE NOT NULL,
    email text UNIQUE NOT NULL,
    username text UNIQUE NOT NULL,
    full_name text,
    display_name text,
    avatar_url text,
    profile_image_url text,
    tier text DEFAULT 'erigga_citizen',
    subscription_tier text DEFAULT 'erigga_citizen',
    role text DEFAULT 'user',
    level integer DEFAULT 1,
    points integer DEFAULT 0,
    coins integer DEFAULT 0,
    coins_balance integer DEFAULT 0,
    bio text,
    is_verified boolean DEFAULT false,
    is_active boolean DEFAULT true,
    is_banned boolean DEFAULT false,
    reputation_score integer DEFAULT 0,
    profile_completeness integer DEFAULT 0,
    total_posts integer DEFAULT 0,
    total_comments integer DEFAULT 0,
    total_votes_received integer DEFAULT 0,
    is_profile_public boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_seen_at timestamptz DEFAULT now()
);

-- Step 2: Update all users with legacy tiers to new tiers
UPDATE public.users
SET 
    tier = CASE 
        WHEN tier IN ('grassroot', 'pioneer', 'free', 'FREE') THEN 'erigga_citizen'
        WHEN tier IN ('elder', 'pro', 'PRO') THEN 'erigga_indigen'
        WHEN tier IN ('blood', 'blood_brotherhood', 'ent', 'ENT') THEN 'enterprise'
        ELSE 'erigga_citizen'
    END,
    subscription_tier = CASE 
        WHEN subscription_tier IN ('grassroot', 'pioneer', 'free', 'FREE') THEN 'erigga_citizen'
        WHEN subscription_tier IN ('elder', 'pro', 'PRO') THEN 'erigga_indigen'
        WHEN subscription_tier IN ('blood', 'blood_brotherhood', 'ent', 'ENT') THEN 'enterprise'
        ELSE 'erigga_citizen'
    END,
    updated_at = now()
WHERE tier NOT IN ('erigga_citizen', 'erigga_indigen', 'enterprise')
   OR subscription_tier NOT IN ('erigga_citizen', 'erigga_indigen', 'enterprise');

-- Step 3: Set up admin user for info@eriggalive.com
DO $$
DECLARE
    v_auth_user_id uuid;
    v_user_exists boolean;
BEGIN
    -- Get the auth user ID
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
                tier = 'enterprise',
                subscription_tier = 'enterprise',
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
                'enterprise',
                'enterprise',
                true,
                true,
                100000,
                100000,
                100,
                100000
            );
        END IF;
    END IF;
END $$;

-- Step 4: Set up RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;

-- Create new policies
CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Admins can view all users"
    ON public.users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE auth_user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
        OR 
        auth.email() = 'info@eriggalive.com'
    );

CREATE POLICY "Admins can update all users"
    ON public.users FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE auth_user_id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
        OR 
        auth.email() = 'info@eriggalive.com'
    );

CREATE POLICY "Public profiles are viewable by everyone"
    ON public.users FOR SELECT
    USING (is_profile_public = true);

CREATE POLICY "Enable read access for authenticated users"
    ON public.users FOR SELECT
    USING (auth.role() = 'authenticated');

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_tier ON public.users(tier);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);

-- Step 6: Verification
SELECT 
    'Admin User Info' as section,
    email,
    username,
    role,
    tier,
    subscription_tier,
    is_verified,
    is_active,
    coins,
    coins_balance,
    level
FROM public.users
WHERE email = 'info@eriggalive.com';

SELECT 
    'Tier Distribution' as section,
    tier,
    COUNT(*) as user_count
FROM public.users
GROUP BY tier
ORDER BY 
    CASE tier
        WHEN 'erigga_citizen' THEN 1
        WHEN 'erigga_indigen' THEN 2
        WHEN 'enterprise' THEN 3
        ELSE 4
    END;

COMMIT;
