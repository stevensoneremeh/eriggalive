-- Complete user schema fix with proper triggers and functions

-- First, drop existing problematic policies and triggers
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on auth_user_id" ON users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Ensure the users table has the correct structure
CREATE TABLE IF NOT EXISTS public.users (
    id bigint primary key generated always as identity,
    auth_user_id uuid unique not null references auth.users(id) on delete cascade,
    username text unique not null check (length(username) >= 3 and length(username) <= 30),
    full_name text not null check (length(full_name) >= 2),
    email text unique not null,
    avatar_url text,
    cover_image_url text,
    tier text default 'free' check (tier in ('free', 'pro', 'enterprise')),
    role text default 'user' check (role in ('user', 'moderator', 'admin', 'super_admin')),
    level integer default 1 check (level >= 1 and level <= 100),
    points integer default 0 check (points >= 0),
    coins integer default 0 check (coins >= 0),
    erigga_id text unique,
    bio text check (length(bio) <= 500),
    location text,
    wallet_address text,
    phone_number text,
    date_of_birth date,
    gender text check (gender in ('male', 'female', 'other', 'prefer_not_to_say')),
    is_verified boolean default false,
    is_active boolean default true,
    is_banned boolean default false,
    ban_reason text,
    banned_until timestamp with time zone,
    last_login timestamp with time zone,
    login_count integer default 0,
    referral_code text unique,
    referred_by bigint references public.users(id),
    subscription_expires_at timestamp with time zone,
    email_verified boolean default false,
    phone_verified boolean default false,
    two_factor_enabled boolean default false,
    two_factor_secret text,
    preferences jsonb default '{}',
    metadata jsonb default '{}',
    reputation_score integer default 100,
    payment_reference text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    user_tier text := 'free';
    user_username text;
    user_full_name text;
    user_payment_ref text;
BEGIN
    -- Extract metadata from auth.users
    user_tier := COALESCE(NEW.raw_user_meta_data->>'tier', 'free');
    user_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    user_payment_ref := NEW.raw_user_meta_data->>'payment_reference';

    -- Ensure username is unique by appending random number if needed
    WHILE EXISTS (SELECT 1 FROM public.users WHERE username = user_username) LOOP
        user_username := user_username || floor(random() * 1000)::text;
    END LOOP;

    -- Insert new user profile
    INSERT INTO public.users (
        auth_user_id,
        username,
        full_name,
        email,
        tier,
        email_verified,
        payment_reference,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        user_username,
        user_full_name,
        NEW.email,
        user_tier,
        NEW.email_confirmed_at IS NOT NULL,
        user_payment_ref,
        NOW(),
        NOW()
    );

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the auth user creation
        RAISE WARNING 'Failed to create user profile: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update user updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create simple RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy for reading user profiles
CREATE POLICY "Users can read all profiles" ON public.users
    FOR SELECT USING (true);

-- Policy for inserting user profiles (only via trigger)
CREATE POLICY "System can insert user profiles" ON public.users
    FOR INSERT WITH CHECK (true);

-- Policy for updating own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = auth_user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.users TO anon, authenticated;
GRANT INSERT, UPDATE ON public.users TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_tier ON public.users(tier);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Ensure community tables exist with proper structure
CREATE TABLE IF NOT EXISTS public.community_categories (
    id bigint primary key generated always as identity,
    name text not null,
    slug text unique not null,
    description text,
    icon text,
    color text,
    display_order integer default 0,
    is_active boolean default true,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

CREATE TABLE IF NOT EXISTS public.community_posts (
    id bigint primary key generated always as identity,
    user_id bigint not null references public.users(id) on delete cascade,
    category_id bigint not null references public.community_categories(id) on delete cascade,
    title text,
    content text not null,
    media_url text,
    media_type text,
    vote_count integer default 0,
    comment_count integer default 0,
    is_pinned boolean default false,
    is_locked boolean default false,
    tags text[],
    mentions jsonb default '[]',
    is_published boolean default true,
    is_edited boolean default false,
    is_deleted boolean default false,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

CREATE TABLE IF NOT EXISTS public.community_comments (
    id bigint primary key generated always as identity,
    post_id bigint not null references public.community_posts(id) on delete cascade,
    user_id bigint not null references public.users(id) on delete cascade,
    parent_id bigint references public.community_comments(id) on delete cascade,
    content text not null,
    vote_count integer default 0,
    like_count integer default 0,
    reply_count integer default 0,
    is_edited boolean default false,
    is_deleted boolean default false,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

CREATE TABLE IF NOT EXISTS public.community_votes (
    id bigint primary key generated always as identity,
    user_id bigint not null references public.users(id) on delete cascade,
    post_id bigint references public.community_posts(id) on delete cascade,
    comment_id bigint references public.community_comments(id) on delete cascade,
    vote_type text not null check (vote_type in ('up', 'down')),
    created_at timestamp with time zone default now(),
    CONSTRAINT vote_target_check CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR 
        (post_id IS NULL AND comment_id IS NOT NULL)
    ),
    UNIQUE(user_id, post_id),
    UNIQUE(user_id, comment_id)
);

-- Enable RLS on community tables
ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_votes ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies for community tables
CREATE POLICY "Anyone can read categories" ON public.community_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can read posts" ON public.community_posts
    FOR SELECT USING (is_published = true AND is_deleted = false);

CREATE POLICY "Users can create posts" ON public.community_posts
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own posts" ON public.community_posts
    FOR UPDATE USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Anyone can read comments" ON public.community_comments
    FOR SELECT USING (is_deleted = false);

CREATE POLICY "Users can create comments" ON public.community_comments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own comments" ON public.community_comments
    FOR UPDATE USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Anyone can read votes" ON public.community_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can create votes" ON public.community_votes
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own votes" ON public.community_votes
    FOR UPDATE USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Insert default categories
INSERT INTO public.community_categories (name, slug, description, is_active) VALUES
    ('General', 'general', 'General discussions and topics', true),
    ('Music', 'music', 'Music discussions, reviews, and recommendations', true),
    ('Events', 'events', 'Upcoming events and announcements', true),
    ('Bars & Lyrics', 'bars', 'Share your bars and discuss lyrics', true),
    ('Fan Art', 'fan-art', 'Share your creative works and fan art', true)
ON CONFLICT (slug) DO NOTHING;

-- Grant permissions for community tables
GRANT SELECT ON public.community_categories TO anon, authenticated;
GRANT SELECT ON public.community_posts TO anon, authenticated;
GRANT SELECT ON public.community_comments TO anon, authenticated;
GRANT SELECT ON public.community_votes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.community_posts TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.community_comments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.community_votes TO authenticated;
