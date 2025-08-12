-- Production Database Schema Setup
-- This script consolidates user tables and sets up proper triggers and policies

-- First, let's create a unified users table structure
-- Drop existing problematic tables if they exist
DROP TABLE IF EXISTS public.users_new CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Create the main users table with all necessary fields
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email text NOT NULL,
    username text UNIQUE,
    full_name text,
    avatar_url text,
    tier text DEFAULT 'grassroot' CHECK (tier IN ('grassroot', 'pioneer', 'elder', 'blood')),
    user_role text DEFAULT 'user' CHECK (user_role IN ('user', 'moderator', 'admin')),
    coins bigint DEFAULT 0,
    points bigint DEFAULT 0,
    level bigint DEFAULT 1,
    reputation_score integer DEFAULT 0,
    posts_count integer DEFAULT 0,
    followers_count integer DEFAULT 0,
    following_count integer DEFAULT 0,
    login_count integer DEFAULT 0,
    referral_code text UNIQUE,
    is_active boolean DEFAULT true,
    is_banned boolean DEFAULT false,
    is_verified boolean DEFAULT false,
    email_verified boolean DEFAULT false,
    phone_verified boolean DEFAULT false,
    two_factor_enabled boolean DEFAULT false,
    ban_reason text,
    banned_until timestamp with time zone,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_tier ON public.users(tier);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create automatic user creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    new_referral_code text;
BEGIN
    -- Generate unique referral code
    new_referral_code := 'REF_' || upper(substring(gen_random_uuid()::text from 1 for 8));
    
    -- Ensure referral code is unique
    WHILE EXISTS (SELECT 1 FROM public.users WHERE referral_code = new_referral_code) LOOP
        new_referral_code := 'REF_' || upper(substring(gen_random_uuid()::text from 1 for 8));
    END LOOP;

    INSERT INTO public.users (
        auth_user_id,
        email,
        username,
        full_name,
        referral_code,
        email_verified
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        new_referral_code,
        NEW.email_confirmed_at IS NOT NULL
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Update existing profiles table to be simpler (keep for backward compatibility)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(auth_user_id) ON DELETE CASCADE,
    username text,
    full_name text,
    avatar_url text,
    website text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own data and public profiles
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- Public profiles are viewable by everyone
CREATE POLICY "Public profiles are viewable by everyone" ON public.users
    FOR SELECT USING (true);

-- Profiles table policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update coin_transactions table to use proper user reference
ALTER TABLE public.coin_transactions 
DROP CONSTRAINT IF EXISTS coin_transactions_user_id_fkey;

ALTER TABLE public.coin_transactions 
ADD CONSTRAINT coin_transactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(auth_user_id) ON DELETE CASCADE;

-- Update other tables to reference users properly
ALTER TABLE public.community_posts 
DROP CONSTRAINT IF EXISTS community_posts_user_id_fkey;

ALTER TABLE public.community_posts 
ADD CONSTRAINT community_posts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(auth_user_id) ON DELETE CASCADE;

ALTER TABLE public.community_comments 
DROP CONSTRAINT IF EXISTS community_comments_user_id_fkey;

ALTER TABLE public.community_comments 
ADD CONSTRAINT community_comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(auth_user_id) ON DELETE CASCADE;

-- Create function to get user by auth_user_id
CREATE OR REPLACE FUNCTION public.get_user_by_auth_id(auth_id uuid)
RETURNS public.users AS $$
DECLARE
    user_record public.users;
BEGIN
    SELECT * INTO user_record FROM public.users WHERE auth_user_id = auth_id;
    RETURN user_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update user coins
CREATE OR REPLACE FUNCTION public.update_user_coins(
    auth_id uuid,
    coin_amount bigint,
    transaction_type text DEFAULT 'purchase'
)
RETURNS boolean AS $$
DECLARE
    current_coins bigint;
BEGIN
    -- Get current coins
    SELECT coins INTO current_coins FROM public.users WHERE auth_user_id = auth_id;
    
    IF current_coins IS NULL THEN
        RETURN false;
    END IF;
    
    -- Update coins
    UPDATE public.users 
    SET coins = coins + coin_amount,
        updated_at = now()
    WHERE auth_user_id = auth_id;
    
    -- Log transaction
    INSERT INTO public.coin_transactions (
        user_id,
        coins_added,
        status,
        created_at
    ) VALUES (
        auth_id,
        coin_amount,
        'completed',
        now()
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.users TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT ON public.coin_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_by_auth_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_coins(uuid, bigint, text) TO authenticated;

-- Create default community categories if they don't exist
INSERT INTO public.community_categories (id, name, slug, description, color, icon, display_order)
VALUES 
    (gen_random_uuid(), 'General Discussion', 'general', 'General discussions about Erigga and music', '#3B82F6', 'MessageCircle', 1),
    (gen_random_uuid(), 'Music & Lyrics', 'music', 'Discuss tracks, albums, and lyrics', '#10B981', 'Music', 2),
    (gen_random_uuid(), 'Events & Shows', 'events', 'Concert updates and event discussions', '#F59E0B', 'Calendar', 3),
    (gen_random_uuid(), 'Freestyle Corner', 'freestyle', 'Share your own bars and freestyle', '#EF4444', 'Mic', 4)
ON CONFLICT (slug) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Production database schema setup completed successfully!';
    RAISE NOTICE 'Users table consolidated and triggers created.';
    RAISE NOTICE 'RLS policies configured for security.';
    RAISE NOTICE 'Foreign key constraints updated.';
END $$;
