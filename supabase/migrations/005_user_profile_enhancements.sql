-- User Profile Enhancements Migration
-- Adds comprehensive profile functionality including date of birth, profile images, and enhanced user data

-- Add date_of_birth column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_profile_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_profile_update TIMESTAMPTZ DEFAULT NOW();

-- Add constraint for age verification (13+ years)
ALTER TABLE public.users 
ADD CONSTRAINT check_age_verification 
CHECK (date_of_birth IS NULL OR date_of_birth <= (CURRENT_DATE - INTERVAL '13 years'));

-- Create storage bucket for user uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for user uploads
CREATE POLICY "Users can upload their own profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view all profile images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-uploads');

CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-uploads' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-uploads' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Function to calculate profile completeness
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
  
  -- Base fields (20 points each)
  IF user_record.username IS NOT NULL AND user_record.username != '' THEN
    completeness := completeness + 20;
  END IF;
  
  IF user_record.full_name IS NOT NULL AND user_record.full_name != '' THEN
    completeness := completeness + 20;
  END IF;
  
  IF user_record.profile_image_url IS NOT NULL AND user_record.profile_image_url != '' THEN
    completeness := completeness + 20;
  END IF;
  
  IF user_record.bio IS NOT NULL AND user_record.bio != '' THEN
    completeness := completeness + 20;
  END IF;
  
  IF user_record.date_of_birth IS NOT NULL THEN
    completeness := completeness + 20;
  END IF;
  
  RETURN completeness;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update profile completeness
CREATE OR REPLACE FUNCTION update_profile_completeness()
RETURNS TRIGGER AS $$
BEGIN
  NEW.profile_completeness := calculate_profile_completeness(NEW.id);
  NEW.last_profile_update := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profile_completeness
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_completeness();

-- Enhanced RLS policies for users table
DROP POLICY IF EXISTS "Users can view public profiles" ON public.users;
CREATE POLICY "Users can view public profiles"
ON public.users FOR SELECT
TO public
USING (is_profile_public = true OR auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create profile activity log table
CREATE TABLE IF NOT EXISTS public.profile_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for profile activities
ALTER TABLE public.profile_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile activities"
ON public.profile_activities FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can insert profile activities"
ON public.profile_activities FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Function to log profile activities
CREATE OR REPLACE FUNCTION log_profile_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_activity_data JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.profile_activities (user_id, activity_type, activity_data)
  VALUES (p_user_id, p_activity_type, p_activity_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_profile_completeness ON public.users(profile_completeness);
CREATE INDEX IF NOT EXISTS idx_users_last_profile_update ON public.users(last_profile_update);
CREATE INDEX IF NOT EXISTS idx_profile_activities_user_id ON public.profile_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_activities_created_at ON public.profile_activities(created_at);

-- Update existing users with profile completeness
UPDATE public.users 
SET profile_completeness = calculate_profile_completeness(id)
WHERE profile_completeness = 0;
