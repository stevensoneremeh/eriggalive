-- Complete Community System with Supabase Auth Integration
-- This script creates a fully working community with proper auth integration

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable realtime for auth.users
ALTER PUBLICATION supabase_realtime ADD TABLE auth.users;

-- Create user profiles table that extends auth.users
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    tier TEXT DEFAULT 'grassroot' CHECK (tier IN ('grassroot', 'pioneer', 'elder', 'blood_brotherhood', 'admin')),
    coins BIGINT DEFAULT 1000,
    reputation_score INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and realtime
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;

-- Community categories
CREATE TABLE IF NOT EXISTS public.community_categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '📝',
    color TEXT DEFAULT '#3B82F6',
    post_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_categories REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_categories;

-- Community posts table
CREATE TABLE IF NOT EXISTS public.community_posts (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_id INTEGER REFERENCES public.community_categories(id) NOT NULL,
    content TEXT NOT NULL,
    hashtags TEXT[] DEFAULT '{}',
    vote_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;

-- Post votes table
CREATE TABLE IF NOT EXISTS public.post_votes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    coin_amount INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_votes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_votes;

-- Comments table
CREATE TABLE IF NOT EXISTS public.community_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    parent_comment_id INTEGER REFERENCES public.community_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    vote_count INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_comments;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tier ON public.user_profiles(tier);
CREATE INDEX IF NOT EXISTS idx_user_profiles_coins ON public.user_profiles(coins DESC);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON public.community_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_vote_count ON public.community_posts(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_posts_published ON public.community_posts(is_published, is_deleted);

CREATE INDEX IF NOT EXISTS idx_votes_post_user ON public.post_votes(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON public.post_votes(user_id);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.community_comments(user_id);

-- Automatic user profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id,
        username,
        full_name,
        avatar_url
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Vote handling function with proper coin transfer
CREATE OR REPLACE FUNCTION public.handle_post_vote(
    p_post_id INTEGER,
    p_user_id UUID,
    p_coin_amount INTEGER DEFAULT 100
)
RETURNS JSONB AS $$
DECLARE
    v_existing_vote post_votes%ROWTYPE;
    v_post_owner_id UUID;
    v_voter_coins BIGINT;
    v_result JSONB;
BEGIN
    -- Get post owner
    SELECT user_id INTO v_post_owner_id
    FROM community_posts
    WHERE id = p_post_id;

    -- Prevent self-voting
    IF v_post_owner_id = p_user_id THEN
        RETURN jsonb_build_object('success', false, 'message', 'Cannot vote on your own post');
    END IF;

    -- Check voter's coin balance
    SELECT coins INTO v_voter_coins
    FROM user_profiles
    WHERE id = p_user_id;

    -- Get existing vote
    SELECT * INTO v_existing_vote
    FROM post_votes
    WHERE post_id = p_post_id AND user_id = p_user_id;

    IF v_existing_vote.id IS NOT NULL THEN
        -- Remove existing vote
        DELETE FROM post_votes WHERE id = v_existing_vote.id;
        
        -- Update post vote count
        UPDATE community_posts 
        SET vote_count = vote_count - 1,
            updated_at = NOW()
        WHERE id = p_post_id;

        -- Return coins to voter
        UPDATE user_profiles 
        SET coins = coins + v_existing_vote.coin_amount,
            updated_at = NOW()
        WHERE id = p_user_id;

        -- Remove coins from post owner
        UPDATE user_profiles 
        SET coins = coins - v_existing_vote.coin_amount,
            reputation_score = reputation_score - 10,
            updated_at = NOW()
        WHERE id = v_post_owner_id;

        v_result := jsonb_build_object(
            'success', true, 
            'action', 'removed', 
            'voted', false,
            'message', 'Vote removed and coins returned'
        );
    ELSE
        -- Check if voter has enough coins
        IF v_voter_coins < p_coin_amount THEN
            RETURN jsonb_build_object('success', false, 'message', 'Insufficient coins to vote');
        END IF;

        -- Add new vote
        INSERT INTO post_votes (post_id, user_id, coin_amount)
        VALUES (p_post_id, p_user_id, p_coin_amount);

        -- Update post vote count
        UPDATE community_posts 
        SET vote_count = vote_count + 1,
            updated_at = NOW()
        WHERE id = p_post_id;

        -- Transfer coins from voter to post owner
        UPDATE user_profiles 
        SET coins = coins - p_coin_amount,
            updated_at = NOW()
        WHERE id = p_user_id;

        UPDATE user_profiles 
        SET coins = coins + p_coin_amount,
            reputation_score = reputation_score + 10,
            updated_at = NOW()
        WHERE id = v_post_owner_id;

        v_result := jsonb_build_object(
            'success', true, 
            'action', 'added', 
            'voted', true,
            'message', format('%s coins transferred successfully', p_coin_amount)
        );
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update stats triggers
CREATE OR REPLACE FUNCTION public.update_post_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment user post count
        UPDATE user_profiles 
        SET posts_count = posts_count + 1,
            updated_at = NOW()
        WHERE id = NEW.user_id;
        
        -- Increment category post count
        UPDATE community_categories 
        SET post_count = post_count + 1 
        WHERE id = NEW.category_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement user post count
        UPDATE user_profiles 
        SET posts_count = posts_count - 1,
            updated_at = NOW()
        WHERE id = OLD.user_id;
        
        -- Decrement category post count
        UPDATE community_categories 
        SET post_count = post_count - 1 
        WHERE id = OLD.category_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_post_stats ON public.community_posts;
CREATE TRIGGER trigger_update_post_stats
    AFTER INSERT OR DELETE ON public.community_posts
    FOR EACH ROW EXECUTE FUNCTION public.update_post_stats();

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trigger_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_posts_updated_at ON public.community_posts;
CREATE TRIGGER trigger_posts_updated_at
    BEFORE UPDATE ON public.community_posts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Row Level Security Policies

-- User profiles: users can view all, edit own
CREATE POLICY "Anyone can view user profiles" ON public.user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Categories: anyone can view
CREATE POLICY "Anyone can view categories" ON public.community_categories
    FOR SELECT USING (is_active = true);

-- Posts: anyone can view published, users can create/edit own
CREATE POLICY "Anyone can view published posts" ON public.community_posts
    FOR SELECT USING (is_published = true AND is_deleted = false);

CREATE POLICY "Users can create posts" ON public.community_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON public.community_posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON public.community_posts
    FOR DELETE USING (auth.uid() = user_id);

-- Votes: users can view all, create/delete own
CREATE POLICY "Anyone can view votes" ON public.post_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can vote" ON public.post_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own votes" ON public.post_votes
    FOR DELETE USING (auth.uid() = user_id);

-- Comments: anyone can view, users can create/edit own
CREATE POLICY "Anyone can view comments" ON public.community_comments
    FOR SELECT USING (is_deleted = false);

CREATE POLICY "Users can create comments" ON public.community_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON public.community_comments
    FOR UPDATE USING (auth.uid() = user_id);

-- Insert default categories
INSERT INTO public.community_categories (name, slug, description, icon, color, display_order) VALUES
('General Discussion', 'general', 'General discussions about Erigga and his music', '💬', '#3B82F6', 1),
('Music Analysis', 'music', 'Deep dives into Erigga''s lyrics and music', '🎵', '#10B981', 2),
('Fan Art', 'art', 'Share your Erigga-inspired artwork', '🎨', '#F59E0B', 3),
('Events & Shows', 'events', 'Discussions about concerts and appearances', '🎤', '#EF4444', 4),
('News & Updates', 'news', 'Latest news about Erigga', '📰', '#8B5CF6', 5)
ON CONFLICT (name) DO NOTHING;

-- Create sample user profiles for existing auth users
INSERT INTO public.user_profiles (id, username, full_name, tier, coins)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)),
    COALESCE(raw_user_meta_data->>'full_name', email),
    'grassroot',
    1000
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles)
ON CONFLICT (id) DO NOTHING;

COMMIT;
