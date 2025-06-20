
-- Complete Community System Schema
-- This creates all necessary tables and functions for the community features

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id BIGSERIAL PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    location TEXT,
    tier TEXT DEFAULT 'grassroot' CHECK (tier IN ('grassroot', 'pioneer', 'elder', 'blood')),
    level INTEGER DEFAULT 1,
    points INTEGER DEFAULT 0,
    coins BIGINT DEFAULT 1000,
    reputation_score INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community Categories
CREATE TABLE IF NOT EXISTS public.community_categories (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT DEFAULT '📝',
    color TEXT DEFAULT '#3b82f6',
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community Posts
CREATE TABLE IF NOT EXISTS public.community_posts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES public.community_categories(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('image', 'audio', 'video')),
    media_metadata JSONB,
    vote_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    mentions JSONB DEFAULT '[]',
    is_published BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community Post Votes
CREATE TABLE IF NOT EXISTS public.community_post_votes (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Community Comments
CREATE TABLE IF NOT EXISTS public.community_comments (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    parent_comment_id BIGINT REFERENCES public.community_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community Comment Likes
CREATE TABLE IF NOT EXISTS public.community_comment_likes (
    id BIGSERIAL PRIMARY KEY,
    comment_id BIGINT NOT NULL REFERENCES public.community_comments(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category_id ON public.community_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_vote_count ON public.community_posts(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_community_post_votes_post_id ON public.community_post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_votes_user_id ON public.community_post_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON public.community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_user_id ON public.community_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_parent_id ON public.community_comments(parent_comment_id);

-- RPC Function for handling post votes with coin transfer
CREATE OR REPLACE FUNCTION public.handle_post_vote(
    p_post_id BIGINT,
    p_voter_auth_id UUID,
    p_post_creator_auth_id UUID,
    p_coin_amount INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    voter_user_id BIGINT;
    creator_user_id BIGINT;
    voter_coins BIGINT;
    existing_vote_id BIGINT;
BEGIN
    -- Get voter's internal user ID and current coins
    SELECT id, coins INTO voter_user_id, voter_coins
    FROM public.users 
    WHERE auth_user_id = p_voter_auth_id;
    
    IF voter_user_id IS NULL THEN
        RAISE EXCEPTION 'Voter not found';
    END IF;
    
    -- Get creator's internal user ID
    SELECT id INTO creator_user_id
    FROM public.users 
    WHERE auth_user_id = p_post_creator_auth_id;
    
    IF creator_user_id IS NULL THEN
        RAISE EXCEPTION 'Post creator not found';
    END IF;
    
    -- Check if voter is trying to vote on their own post
    IF voter_user_id = creator_user_id THEN
        RAISE EXCEPTION 'Cannot vote on own post';
    END IF;
    
    -- Check if user already voted
    SELECT id INTO existing_vote_id
    FROM public.community_post_votes 
    WHERE post_id = p_post_id AND user_id = voter_user_id;
    
    IF existing_vote_id IS NOT NULL THEN
        RAISE EXCEPTION 'User has already voted on this post';
    END IF;
    
    -- Check if voter has enough coins
    IF voter_coins < p_coin_amount THEN
        RAISE EXCEPTION 'Insufficient coins';
    END IF;
    
    -- Perform the vote transaction
    BEGIN
        -- Deduct coins from voter
        UPDATE public.users 
        SET coins = coins - p_coin_amount,
            updated_at = NOW()
        WHERE id = voter_user_id;
        
        -- Add coins to creator
        UPDATE public.users 
        SET coins = coins + p_coin_amount,
            reputation_score = reputation_score + 10,
            updated_at = NOW()
        WHERE id = creator_user_id;
        
        -- Create vote record
        INSERT INTO public.community_post_votes (post_id, user_id)
        VALUES (p_post_id, voter_user_id);
        
        -- Update post vote count
        UPDATE public.community_posts 
        SET vote_count = vote_count + 1,
            updated_at = NOW()
        WHERE id = p_post_id;
        
        RETURN TRUE;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Vote transaction failed: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update comment counts
CREATE OR REPLACE FUNCTION update_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment comment count on post
        UPDATE public.community_posts 
        SET comment_count = comment_count + 1,
            updated_at = NOW()
        WHERE id = NEW.post_id;
        
        -- If it's a reply, increment reply count on parent comment
        IF NEW.parent_comment_id IS NOT NULL THEN
            UPDATE public.community_comments 
            SET reply_count = reply_count + 1,
                updated_at = NOW()
            WHERE id = NEW.parent_comment_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement comment count on post
        UPDATE public.community_posts 
        SET comment_count = GREATEST(0, comment_count - 1),
            updated_at = NOW()
        WHERE id = OLD.post_id;
        
        -- If it's a reply, decrement reply count on parent comment
        IF OLD.parent_comment_id IS NOT NULL THEN
            UPDATE public.community_comments 
            SET reply_count = GREATEST(0, reply_count - 1),
                updated_at = NOW()
            WHERE id = OLD.parent_comment_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_comment_counts ON public.community_comments;
CREATE TRIGGER trigger_update_comment_counts
    AFTER INSERT OR DELETE ON public.community_comments
    FOR EACH ROW EXECUTE FUNCTION update_comment_counts();

-- Function to update like counts
CREATE OR REPLACE FUNCTION update_like_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.community_comments 
        SET like_count = like_count + 1,
            updated_at = NOW()
        WHERE id = NEW.comment_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.community_comments 
        SET like_count = GREATEST(0, like_count - 1),
            updated_at = NOW()
        WHERE id = OLD.comment_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comment likes
DROP TRIGGER IF EXISTS trigger_update_like_counts ON public.community_comment_likes;
CREATE TRIGGER trigger_update_like_counts
    AFTER INSERT OR DELETE ON public.community_comment_likes
    FOR EACH ROW EXECUTE FUNCTION update_like_counts();

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = auth_user_id);

-- RLS Policies for categories
CREATE POLICY "Anyone can view categories" ON public.community_categories FOR SELECT USING (is_active = true);

-- RLS Policies for posts
CREATE POLICY "Anyone can view published posts" ON public.community_posts FOR SELECT USING (is_published = true AND is_deleted = false);
CREATE POLICY "Authenticated users can create posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own posts" ON public.community_posts FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- RLS Policies for votes
CREATE POLICY "Anyone can view votes" ON public.community_post_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON public.community_post_votes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for comments  
CREATE POLICY "Anyone can view comments" ON public.community_comments FOR SELECT USING (is_deleted = false);
CREATE POLICY "Authenticated users can create comments" ON public.community_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own comments" ON public.community_comments FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- RLS Policies for comment likes
CREATE POLICY "Anyone can view comment likes" ON public.community_comment_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like comments" ON public.community_comment_likes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can remove own likes" ON public.community_comment_likes FOR DELETE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Seed data for categories
INSERT INTO public.community_categories (name, slug, description, icon, color, display_order) VALUES
('General', 'general', 'General discussions about Erigga and the community', '💬', '#3b82f6', 1),
('Bars', 'bars', 'Share your lyrical bars and punchlines', '🎤', '#ef4444', 2),
('Stories', 'stories', 'Tell your Erigga-related stories and experiences', '📖', '#10b981', 3),
('Events', 'events', 'Discuss upcoming and past Erigga events', '🎉', '#f59e0b', 4),
('Music', 'music', 'Discussions about Erigga''s music and collaborations', '🎵', '#8b5cf6', 5)
ON CONFLICT (slug) DO NOTHING;

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_post_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_comment_likes;
