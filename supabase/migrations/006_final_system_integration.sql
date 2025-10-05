-- Final System Integration Migration
-- Ensures all systems work together properly and adds any missing pieces

-- Ensure all users have proper default values for new profile fields
UPDATE public.users 
SET 
  profile_completeness = COALESCE(profile_completeness, calculate_profile_completeness(id)),
  is_profile_public = COALESCE(is_profile_public, true),
  social_links = COALESCE(social_links, '{}'),
  last_profile_update = COALESCE(last_profile_update, NOW())
WHERE profile_completeness IS NULL 
   OR is_profile_public IS NULL 
   OR social_links IS NULL 
   OR last_profile_update IS NULL;

-- Create comprehensive view for user profiles with all related data
CREATE OR REPLACE VIEW public.user_profiles_complete AS
SELECT 
  u.id,
  u.email,
  u.username,
  u.full_name,
  u.bio,
  u.location,
  u.website,
  u.date_of_birth,
  u.profile_image_url,
  u.avatar_url,
  u.social_links,
  u.profile_completeness,
  u.is_profile_public,
  u.last_profile_update,
  u.tier,
  u.coins,
  u.created_at,
  u.updated_at,
  -- Membership information
  m.tier_id as membership_tier_id,
  m.expires_at as membership_expires_at,
  m.is_active as membership_active,
  mt.name as membership_tier_name,
  mt.badge_label,
  mt.badge_color,
  -- Wallet information
  w.balance as wallet_balance,
  w.total_earned,
  w.total_spent,
  w.last_transaction_at
FROM public.users u
LEFT JOIN public.memberships m ON u.id = m.user_id AND m.is_active = true
LEFT JOIN public.membership_tiers mt ON m.tier_id = mt.id
LEFT JOIN public.wallets w ON u.id = w.user_id;

-- Grant access to the view
GRANT SELECT ON public.user_profiles_complete TO authenticated;

-- RLS policy for the view
CREATE POLICY "Users can view complete profiles based on privacy settings"
ON public.user_profiles_complete FOR SELECT
TO authenticated
USING (
  is_profile_public = true 
  OR auth.uid() = id 
  OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND tier IN ('elder', 'blood_brotherhood')
  )
);

-- Function to get user profile with all related data
CREATE OR REPLACE FUNCTION get_user_profile_complete(profile_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  email TEXT,
  username TEXT,
  full_name TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  date_of_birth DATE,
  profile_image_url TEXT,
  avatar_url TEXT,
  social_links JSONB,
  profile_completeness INTEGER,
  is_profile_public BOOLEAN,
  last_profile_update TIMESTAMPTZ,
  tier TEXT,
  coins INTEGER,
  membership_tier_name TEXT,
  badge_label TEXT,
  badge_color TEXT,
  wallet_balance INTEGER,
  total_earned INTEGER,
  total_spent INTEGER
) AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Use provided user_id or current authenticated user
  target_user_id := COALESCE(profile_user_id, auth.uid());
  
  RETURN QUERY
  SELECT 
    upc.id,
    upc.email,
    upc.username,
    upc.full_name,
    upc.bio,
    upc.location,
    upc.website,
    upc.date_of_birth,
    upc.profile_image_url,
    upc.avatar_url,
    upc.social_links,
    upc.profile_completeness,
    upc.is_profile_public,
    upc.last_profile_update,
    upc.tier,
    upc.coins,
    upc.membership_tier_name,
    upc.badge_label,
    upc.badge_color,
    upc.wallet_balance,
    upc.total_earned,
    upc.total_spent
  FROM public.user_profiles_complete upc
  WHERE upc.id = target_user_id
    AND (
      upc.is_profile_public = true 
      OR auth.uid() = upc.id 
      OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() 
        AND tier IN ('elder', 'blood_brotherhood')
      )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  withdrawal_notifications BOOLEAN DEFAULT true,
  membership_notifications BOOLEAN DEFAULT true,
  event_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for notification preferences
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification preferences"
ON public.user_notification_preferences FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to create default notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create notification preferences for new users
DROP TRIGGER IF EXISTS trigger_create_notification_preferences ON public.users;
CREATE TRIGGER trigger_create_notification_preferences
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- Create notification preferences for existing users
INSERT INTO public.user_notification_preferences (user_id)
SELECT id FROM public.users
ON CONFLICT (user_id) DO NOTHING;

-- Update the profile completeness calculation to include more fields
CREATE OR REPLACE FUNCTION calculate_profile_completeness(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  completeness INTEGER := 0;
  user_record RECORD;
BEGIN
  SELECT * INTO user_record FROM public.users WHERE id = user_id;
  
  IF user_record IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Essential fields (15 points each)
  IF user_record.username IS NOT NULL AND user_record.username != '' THEN
    completeness := completeness + 15;
  END IF;
  
  IF user_record.full_name IS NOT NULL AND user_record.full_name != '' THEN
    completeness := completeness + 15;
  END IF;
  
  IF user_record.profile_image_url IS NOT NULL AND user_record.profile_image_url != '' THEN
    completeness := completeness + 15;
  END IF;
  
  IF user_record.bio IS NOT NULL AND user_record.bio != '' THEN
    completeness := completeness + 15;
  END IF;
  
  IF user_record.date_of_birth IS NOT NULL THEN
    completeness := completeness + 15;
  END IF;
  
  -- Additional fields (10 points each)
  IF user_record.location IS NOT NULL AND user_record.location != '' THEN
    completeness := completeness + 10;
  END IF;
  
  IF user_record.website IS NOT NULL AND user_record.website != '' THEN
    completeness := completeness + 10;
  END IF;
  
  -- Social links (5 points for having any)
  IF user_record.social_links IS NOT NULL AND jsonb_array_length(jsonb_object_keys(user_record.social_links)) > 0 THEN
    completeness := completeness + 5;
  END IF;
  
  -- Cap at 100%
  IF completeness > 100 THEN
    completeness := 100;
  END IF;
  
  RETURN completeness;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update all existing users' profile completeness with new calculation
UPDATE public.users 
SET profile_completeness = calculate_profile_completeness(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_complete_membership ON public.memberships(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_complete_wallet ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.user_notification_preferences(user_id);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_profile_complete(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_profile_completeness(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_profile_activity(UUID, TEXT, JSONB) TO authenticated;

-- Final data integrity check and cleanup
-- Ensure all users have wallets
INSERT INTO public.wallets (user_id, balance, total_earned, total_spent)
SELECT id, COALESCE(coins, 0), 0, 0
FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM public.wallets w WHERE w.user_id = u.id)
ON CONFLICT (user_id) DO NOTHING;

-- Ensure all users have memberships (default to FREE tier)
INSERT INTO public.memberships (user_id, tier_id, is_active, created_at, expires_at)
SELECT u.id, mt.id, true, NOW(), NOW() + INTERVAL '1 year'
FROM public.users u
CROSS JOIN public.membership_tiers mt
WHERE mt.name = 'FREE'
  AND NOT EXISTS (SELECT 1 FROM public.memberships m WHERE m.user_id = u.id AND m.is_active = true)
ON CONFLICT DO NOTHING;

-- Add helpful comments
COMMENT ON VIEW public.user_profiles_complete IS 'Complete user profile view with membership and wallet data';
COMMENT ON FUNCTION get_user_profile_complete(UUID) IS 'Get complete user profile with all related data, respecting privacy settings';
COMMENT ON TABLE public.user_notification_preferences IS 'User notification preferences for various system events';
