-- Drop existing policies that might be blocking inserts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.users;

-- Create new policies that allow profile creation
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can create their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- Allow public viewing of active profiles
CREATE POLICY "Public profiles are viewable" ON public.users
    FOR SELECT USING (true);

-- Fix user_profiles table policies
DROP POLICY IF EXISTS "Users can manage their own settings" ON public.user_profiles;

CREATE POLICY "Users can view profiles" ON public.user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    auth_user_id,
    username,
    full_name,
    email,
    tier,
    role,
    coins_balance
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    'grassroot',
    'user',
    500
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure all auth users are confirmed (no email verification needed)
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;
