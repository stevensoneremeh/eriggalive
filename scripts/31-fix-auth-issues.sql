-- Fix authentication issues and remove email verification requirement

-- First, fix the users table structure
ALTER TABLE public.users 
ALTER COLUMN full_name DROP NOT NULL;

-- Ensure email_verified column exists and defaults to true
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' 
                   AND column_name = 'email_verified') THEN
        ALTER TABLE public.users ADD COLUMN email_verified boolean DEFAULT true;
    END IF;
END $$;

-- Ensure phone_verified column exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' 
                   AND column_name = 'phone_verified') THEN
        ALTER TABLE public.users ADD COLUMN phone_verified boolean DEFAULT false;
    END IF;
END $$;

-- Update existing users to have email_verified = true
UPDATE public.users SET email_verified = true WHERE email_verified IS NULL OR email_verified = false;

-- Disable email confirmation in Supabase Auth settings
-- Note: This needs to be done in the Supabase dashboard under Authentication > Settings
-- Set "Enable email confirmations" to OFF

-- Create a function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    auth_user_id,
    username,
    full_name,
    email,
    email_verified,
    phone_verified,
    tier,
    role,
    level,
    points,
    coins,
    is_verified,
    is_active,
    is_banned,
    two_factor_enabled,
    login_count,
    preferences,
    metadata
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    true, -- Always set to true to skip email verification
    false,
    'grassroot',
    'user',
    1,
    0,
    500,
    false,
    true,
    false,
    false,
    1,
    '{}',
    '{}'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.user_settings TO anon, authenticated;
GRANT ALL ON public.notifications TO anon, authenticated;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Create RLS policies for user_settings table
CREATE POLICY "Users can manage own settings" ON public.user_settings
  FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Create RLS policies for notifications table
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));
