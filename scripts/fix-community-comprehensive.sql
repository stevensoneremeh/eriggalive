
-- Comprehensive fix for community and user profile issues
-- This script ensures all tables exist and functions work properly with correct data types

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they have issues and recreate them
DROP TABLE IF EXISTS community_post_votes CASCADE;
DROP TABLE IF EXISTS community_comments CASCADE; 
DROP TABLE IF EXISTS community_posts CASCADE;
DROP TABLE IF EXISTS community_categories CASCADE;

-- Ensure users table exists with correct structure
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id uuid UNIQUE NOT NULL,
    email text NOT NULL,
    username text UNIQUE,
    full_name text,
    avatar_url text,
    profile_image_url text,
    bio text,
    location text,
    website text,
    phone text,
    date_of_birth date,
    social_links jsonb DEFAULT '{}',
    tier text DEFAULT 'erigga_citizen' CHECK (tier IN ('erigga_citizen', 'erigga_indigen', 'enterprise')),
    coins integer DEFAULT 100,
    points integer DEFAULT 0,
    level integer DEFAULT 1,
    reputation_score integer DEFAULT 0,
    is_active boolean DEFAULT true,
    is_verified boolean DEFAULT false,
    is_profile_public boolean DEFAULT true,
    profile_completeness integer DEFAULT 0,
    last_seen_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create community categories table
CREATE TABLE community_categories (
    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    color text DEFAULT '#3B82F6',
    icon text DEFAULT '💬',
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create community posts table with correct UUID reference
CREATE TABLE community_posts (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    category_id integer REFERENCES community_categories(id) ON DELETE SET NULL,
    title text,
    content text NOT NULL CHECK (length(content) >= 1 AND length(content) <= 10000),
    media_url text,
    media_type text CHECK (media_type IN ('image', 'video', 'audio')),
    hashtags text[] DEFAULT '{}',
    vote_count integer DEFAULT 0,
    comment_count integer DEFAULT 0,
    view_count integer DEFAULT 0,
    is_published boolean DEFAULT true,
    is_deleted boolean DEFAULT false,
    is_featured boolean DEFAULT false,
    is_pinned boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create community post votes table
CREATE TABLE community_post_votes (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    post_id bigint REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    vote_type text DEFAULT 'upvote' CHECK (vote_type IN ('upvote', 'downvote')),
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(post_id, user_id)
);

-- Create community comments table
CREATE TABLE community_comments (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    post_id bigint REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id bigint REFERENCES community_comments(id) ON DELETE CASCADE,
    content text NOT NULL CHECK (length(content) >= 1 AND length(content) <= 2000),
    like_count integer DEFAULT 0,
    reply_count integer DEFAULT 0,
    is_deleted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create community comment likes table
CREATE TABLE community_comment_likes (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    comment_id bigint REFERENCES community_comments(id) ON DELETE CASCADE,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(comment_id, user_id)
);

-- Insert default categories
INSERT INTO community_categories (name, slug, description, color, icon, display_order) VALUES
    ('General Discussion', 'general', 'General conversations about Erigga and music', '#3B82F6', '💬', 1),
    ('Music & Lyrics', 'music', 'Discuss Erigga''s music and lyrics', '#8B5CF6', '🎵', 2),
    ('Fan Art & Media', 'media', 'Share fan art, photos, and media', '#10B981', '🎨', 3),
    ('Events & News', 'events', 'Latest events and news updates', '#F59E0B', '📅', 4),
    ('Questions & Help', 'help', 'Ask questions and get help', '#EF4444', '❓', 5)
ON CONFLICT (slug) DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comment_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Anyone can view categories" ON community_categories;
DROP POLICY IF EXISTS "Anyone can view posts" ON community_posts;
DROP POLICY IF EXISTS "Users can create posts" ON community_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON community_posts;
DROP POLICY IF EXISTS "Anyone can view votes" ON community_post_votes;
DROP POLICY IF EXISTS "Users can create votes" ON community_post_votes;
DROP POLICY IF EXISTS "Users can delete own votes" ON community_post_votes;
DROP POLICY IF EXISTS "Anyone can view comments" ON community_comments;
DROP POLICY IF EXISTS "Users can create comments" ON community_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON community_comments;
DROP POLICY IF EXISTS "Anyone can view comment likes" ON community_comment_likes;
DROP POLICY IF EXISTS "Users can create comment likes" ON community_comment_likes;
DROP POLICY IF EXISTS "Users can delete own comment likes" ON community_comment_likes;

-- Create RLS policies
CREATE POLICY "Users can view public profiles or their own" ON users FOR SELECT USING (
    is_profile_public = true OR auth.uid() = auth_user_id
);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = auth_user_id);
CREATE POLICY "Enable insert for authenticated users" ON users FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Anyone can view categories" ON community_categories FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view published posts" ON community_posts FOR SELECT USING (is_published = true AND is_deleted = false);
CREATE POLICY "Users can create posts" ON community_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own posts" ON community_posts FOR UPDATE USING (
    auth.uid() = user_id
);

CREATE POLICY "Anyone can view votes" ON community_post_votes FOR SELECT USING (true);
CREATE POLICY "Users can create votes" ON community_post_votes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own votes" ON community_post_votes FOR DELETE USING (
    auth.uid() = user_id
);

CREATE POLICY "Anyone can view comments" ON community_comments FOR SELECT USING (is_deleted = false);
CREATE POLICY "Users can create comments" ON community_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own comments" ON community_comments FOR UPDATE USING (
    auth.uid() = user_id
);

CREATE POLICY "Anyone can view comment likes" ON community_comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can create comment likes" ON community_comment_likes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own comment likes" ON community_comment_likes FOR DELETE USING (
    auth.uid() = user_id
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category_id ON community_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_post_votes_post_id ON community_post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_votes_user_id ON community_post_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_user_id ON community_comments(user_id);

-- Function to automatically create user profile when auth user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (
        id,
        auth_user_id,
        email,
        username,
        full_name,
        avatar_url,
        tier,
        coins,
        points,
        level,
        reputation_score,
        is_active,
        is_verified,
        profile_completeness,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        'erigga_citizen',
        100, -- Welcome bonus
        0,
        1,
        0,
        true,
        false,
        25,
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
