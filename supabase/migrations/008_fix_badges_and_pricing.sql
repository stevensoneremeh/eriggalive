-- Fix badge system for all users and update event pricing
BEGIN;

-- Update all users to have correct tier badges based on their membership
UPDATE user_profiles 
SET tier = CASE 
  WHEN EXISTS (
    SELECT 1 FROM memberships m 
    WHERE m.user_id = user_profiles.user_id 
    AND m.tier_code = 'PRO' 
    AND m.status = 'active'
  ) THEN 'PRO'
  WHEN EXISTS (
    SELECT 1 FROM memberships m 
    WHERE m.user_id = user_profiles.user_id 
    AND m.tier_code = 'ENT' 
    AND m.status = 'active'
  ) THEN 'ENT'
  ELSE 'FREE'
END;

-- Remove any grassroot references and ensure all users have proper tier
UPDATE user_profiles 
SET tier = 'FREE' 
WHERE tier IS NULL OR tier = 'grassroot' OR tier = 'GRASSROOT';

-- Update event pricing for intimate session to 20,000 naira with 50,000 original price
UPDATE events 
SET 
  price = 2000000, -- 20,000 naira in kobo
  original_price = 5000000, -- 50,000 naira in kobo (for strike-through)
  updated_at = NOW()
WHERE title ILIKE '%intimate%' OR title ILIKE '%session%';

-- Ensure all existing tickets have QR codes
UPDATE tickets 
SET qr_code = CONCAT('TICKET-', id, '-', EXTRACT(epoch FROM created_at)::text)
WHERE qr_code IS NULL;

COMMIT;
