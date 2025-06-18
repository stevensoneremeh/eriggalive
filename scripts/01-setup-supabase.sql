-- First, enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Set up storage for media files
INSERT INTO storage.buckets (id, name, public) VALUES 
('avatars', 'avatars', true),
('media', 'media', true),
('thumbnails', 'thumbnails', true),
('merchandise', 'merchandise', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Public Access to Avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated Users Can Upload Avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users Can Update Their Own Avatars" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() = owner);

CREATE POLICY "Public Access to Media" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Authenticated Users Can Upload Media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Public Access to Thumbnails" ON storage.objects
  FOR SELECT USING (bucket_id = 'thumbnails');

CREATE POLICY "Public Access to Merchandise" ON storage.objects
  FOR SELECT USING (bucket_id = 'merchandise');

-- Set up authentication hooks
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, created_at, updated_at)
  VALUES (new.id, new.email, '', now(), now());
  
  -- Default to free tier
  INSERT INTO public.user_tiers (user_id, tier_name, start_date)
  VALUES (new.id, 'free', now());
  
  -- Give new users some welcome coins
  INSERT INTO public.coin_transactions (user_id, amount, transaction_type, description)
  VALUES (new.id, 50, 'credit', 'Welcome bonus');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Set up secure RLS policies
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM public;
