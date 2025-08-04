-- Fix the users table to match the expected schema
ALTER TABLE public.users 
DROP COLUMN IF EXISTS email_verified,
DROP COLUMN IF EXISTS phone_verified;

-- Add the correct columns
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false;

-- Update existing users to have email_verified = true
UPDATE public.users SET email_verified = true WHERE email_verified IS NULL;

-- Make full_name nullable since it's optional
ALTER TABLE public.users 
ALTER COLUMN full_name DROP NOT NULL;
