-- =====================================================
-- FINAL GRASSROOT CLEANUP
-- =====================================================

BEGIN;

-- Update any remaining grassroot references in users table
UPDATE public.users
SET 
  tier = 'erigga_citizen',
  subscription_tier = 'erigga_citizen',
  updated_at = now()
WHERE tier IN ('grassroot', 'pioneer', 'free')
   OR subscription_tier IN ('grassroot', 'pioneer', 'free');

-- Update blood/elder references to new tiers
UPDATE public.users
SET 
  tier = CASE 
    WHEN tier IN ('blood', 'blood_brotherhood') THEN 'enterprise'
    WHEN tier IN ('elder', 'pro') THEN 'erigga_indigen'
    ELSE tier
  END,
  subscription_tier = CASE 
    WHEN subscription_tier IN ('blood', 'blood_brotherhood') THEN 'enterprise'
    WHEN subscription_tier IN ('elder', 'pro') THEN 'erigga_indigen'
    ELSE subscription_tier
  END,
  updated_at = now()
WHERE tier IN ('blood', 'blood_brotherhood', 'elder', 'pro')
   OR subscription_tier IN ('blood', 'blood_brotherhood', 'elder', 'pro');

-- Ensure info@eriggalive.com has admin access
UPDATE public.users
SET 
  role = 'admin',
  tier = 'enterprise',
  subscription_tier = 'enterprise',
  is_verified = true,
  is_active = true,
  updated_at = now()
WHERE email = 'info@eriggalive.com';

-- Update RLS policies to remove old tier references
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_user_id = auth.uid()
      AND (role IN ('admin', 'super_admin') OR tier = 'enterprise')
    )
    OR 
    auth.jwt() ->> 'email' = 'info@eriggalive.com'
  );

DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users"
  ON public.users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_user_id = auth.uid()
      AND (role IN ('admin', 'super_admin') OR tier = 'enterprise')
    )
    OR 
    auth.jwt() ->> 'email' = 'info@eriggalive.com'
  );

DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
CREATE POLICY "Admins can insert users"
  ON public.users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_user_id = auth.uid()
      AND (role IN ('admin', 'super_admin') OR tier = 'enterprise')
    )
    OR 
    auth.jwt() ->> 'email' = 'info@eriggalive.com'
  );

-- Verify the cleanup
SELECT 
  'CLEANUP VERIFICATION' as section,
  tier::text as tier_name,
  COUNT(*) as user_count
FROM public.users
GROUP BY tier
ORDER BY 
  CASE tier::text
    WHEN 'erigga_citizen' THEN 1
    WHEN 'erigga_indigen' THEN 2
    WHEN 'enterprise' THEN 3
  END;

-- Show admin user
SELECT 
  'ADMIN USER' as section,
  email,
  username,
  role,
  tier::text,
  subscription_tier::text,
  is_verified,
  is_active
FROM public.users
WHERE email = 'info@eriggalive.com';

COMMIT;
