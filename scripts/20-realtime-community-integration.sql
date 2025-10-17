-- Complete Real-time Community Integration with Supabase Auth
-- This script creates a fully integrated community system with real-time features

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable realtime for all community tables
ALTER PUBLICATION supabase_realtime ADD TABLE auth.users;

-- Create comprehensive users table linked to auth
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    location TEXT,
    tier TEXT DEFAULT 'grassroot' CHECK (tier IN ('grassroot', 'pioneer', 'elder', 'blood_brotherhood', 'admin')),
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

-- Enable RLS and realtime for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- Community categories with enhanced features
CREATE TABLE IF NOT EXISTS public.community_categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '📝',
    color TEXT DEFAULT '#3B82F6',
    banner_url TEXT,
    post_count INTEGER DEFAULT 0,
    subscriber_count INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_categories REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_categories;

-- Enhanced community posts with real-time features
CREATE TABLE IF NOT EXISTS public.community_posts (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    category_id INTEGER REFERENCES public.community_categories(id) NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    hashtags TEXT[] DEFAULT '{}',
    mentions UUID[] DEFAULT '{}',
    media_urls TEXT[] DEFAULT '{}',
    vote_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;

-- Real-time comments system with nested replies
CREATE TABLE IF NOT EXISTS public.community_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    parent_comment_id INTEGER REFERENCES public.community_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    mentions UUID[] DEFAULT '{}',
    vote_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_comments;

-- Real-time voting system
CREATE TABLE IF NOT EXISTS public.post_votes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    vote_type TEXT CHECK (vote_type IN ('up', 'down')) NOT NULL,
    coin_amount INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_votes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_votes;

-- Comment votes
CREATE TABLE IF NOT EXISTS public.comment_votes (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER REFERENCES public.community_comments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    vote_type TEXT CHECK (vote_type IN ('up', 'down')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_votes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_votes;

-- Real-time notifications system
CREATE TABLE IF NOT EXISTS public.notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    actor_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('post_vote', 'comment', 'mention', 'follow', 'achievement', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- User follows for social features
CREATE TABLE IF NOT EXISTS public.user_follows (
    id SERIAL PRIMARY KEY,
    follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_follows;

-- User bookmarks
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    post_id INTEGER REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bookmarks REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_bookmarks;

-- Real-time presence tracking
CREATE TABLE IF NOT EXISTS public.user_presence (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
    status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_page TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_tier ON public.users(tier);
CREATE INDEX IF NOT EXISTS idx_users_reputation ON public.users(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON public.users(last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON public.community_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_vote_count ON public.community_posts(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_posts_hashtags ON public.community_posts USING GIN(hashtags);
CREATE INDEX IF NOT EXISTS idx_posts_published ON public.community_posts(is_published, is_deleted);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.community_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.community_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.community_comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_votes_post_user ON public.post_votes(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment_user ON public.comment_votes(comment_id, user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.user_follows(following_id);

-- Automatic user profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        auth_user_id,
        username,
        full_name,
        email,
        avatar_url
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Real-time vote handling function
CREATE OR REPLACE FUNCTION public.handle_post_vote(
    p_post_id INTEGER,
    p_user_id UUID,
    p_vote_type TEXT DEFAULT 'up',
    p_coin_amount INTEGER DEFAULT 100
)
RETURNS JSONB AS $$
DECLARE
    v_existing_vote post_votes%ROWTYPE;
    v_post_owner_id UUID;
    v_voter_username TEXT;
    v_result JSONB;
BEGIN
    -- Get existing vote
    SELECT * INTO v_existing_vote
    FROM post_votes
    WHERE post_id = p_post_id AND user_id = p_user_id;

    -- Get post owner and voter info
    SELECT cp.user_id, u.username INTO v_post_owner_id, v_voter_username
    FROM community_posts cp
    JOIN users u ON u.id = p_user_id
    WHERE cp.id = p_post_id;

    -- Prevent self-voting
    IF v_post_owner_id = p_user_id THEN
        RETURN jsonb_build_object('success', false, 'message', 'Cannot vote on your own post');
    END IF;

    IF v_existing_vote.id IS NOT NULL THEN
        -- Remove existing vote
        DELETE FROM post_votes WHERE id = v_existing_vote.id;
        
        -- Update post vote count
        UPDATE community_posts 
        SET vote_count = vote_count - 1,
            updated_at = NOW()
        WHERE id = p_post_id;

        -- Return coins to voter
        UPDATE users 
        SET coins = coins + v_existing_vote.coin_amount
        WHERE id = p_user_id;

        -- Remove coins from post owner
        UPDATE users 
        SET coins = coins - v_existing_vote.coin_amount,
            reputation_score = reputation_score - 10
        WHERE id = v_post_owner_id;

        v_result := jsonb_build_object('success', true, 'action', 'removed', 'voted', false);
    ELSE
        -- Add new vote
        INSERT INTO post_votes (post_id, user_id, vote_type, coin_amount)
        VALUES (p_post_id, p_user_id, p_vote_type, p_coin_amount);

        -- Update post vote count
        UPDATE community_posts 
        SET vote_count = vote_count + 1,
            updated_at = NOW()
        WHERE id = p_post_id;

        -- Transfer coins from voter to post owner
        UPDATE users 
        SET coins = coins - p_coin_amount
        WHERE id = p_user_id AND coins >= p_coin_amount;

        UPDATE users 
        SET coins = coins + p_coin_amount,
            reputation_score = reputation_score + 10
        WHERE id = v_post_owner_id;

        -- Create notification
        INSERT INTO notifications (user_id, actor_id, type, title, message, data)
        VALUES (
            v_post_owner_id,
            p_user_id,
            'post_vote',
            'New Vote on Your Post!',
            v_voter_username || ' voted on your post and sent you ' || p_coin_amount || ' Erigga Coins!',
            jsonb_build_object('post_id', p_post_id, 'coin_amount', p_coin_amount)
        );

        v_result := jsonb_build_object('success', true, 'action', 'added', 'voted', true);
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user stats trigger
CREATE OR REPLACE FUNCTION public.update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'community_posts' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE users SET posts_count = posts_count + 1 WHERE id = NEW.user_id;
            UPDATE community_categories SET post_count = post_count + 1 WHERE id = NEW.category_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE users SET posts_count = posts_count - 1 WHERE id = OLD.user_id;
            UPDATE community_categories SET post_count = post_count - 1 WHERE id = OLD.category_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'community_comments' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE community_posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'user_follows' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
            UPDATE users SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE users SET following_count = following_count - 1 WHERE id = OLD.follower_id;
            UPDATE users SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for stats updates
DROP TRIGGER IF EXISTS trigger_update_post_stats ON public.community_posts;
CREATE TRIGGER trigger_update_post_stats
    AFTER INSERT OR DELETE ON public.community_posts
    FOR EACH ROW EXECUTE FUNCTION public.update_user_stats();

DROP TRIGGER IF EXISTS trigger_update_comment_stats ON public.community_comments;
CREATE TRIGGER trigger_update_comment_stats
    AFTER INSERT OR DELETE ON public.community_comments
    FOR EACH ROW EXECUTE FUNCTION public.update_user_stats();

DROP TRIGGER IF EXISTS trigger_update_follow_stats ON public.user_follows;
CREATE TRIGGER trigger_update_follow_stats
    AFTER INSERT OR DELETE ON public.user_follows
    FOR EACH ROW EXECUTE FUNCTION public.update_user_stats();

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
DROP TRIGGER IF EXISTS trigger_users_updated_at ON public.users;
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_posts_updated_at ON public.community_posts;
CREATE TRIGGER trigger_posts_updated_at
    BEFORE UPDATE ON public.community_posts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Row Level Security Policies
-- Users can view all profiles but only edit their own
CREATE POLICY "Users can view all profiles" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- Posts are viewable by all, editable by owner
CREATE POLICY "Anyone can view published posts" ON public.community_posts
    FOR SELECT USING (is_published = true AND is_deleted = false);

CREATE POLICY "Users can create posts" ON public.community_posts
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can edit own posts" ON public.community_posts
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can delete own posts" ON public.community_posts
    FOR DELETE USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Comments policies
CREATE POLICY "Anyone can view comments" ON public.community_comments
    FOR SELECT USING (is_deleted = false);

CREATE POLICY "Users can create comments" ON public.community_comments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can edit own comments" ON public.community_comments
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Voting policies
CREATE POLICY "Users can view votes" ON public.post_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can vote" ON public.post_votes
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can change own votes" ON public.post_votes
    FOR DELETE USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Notification policies
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Categories are viewable by all
CREATE POLICY "Anyone can view categories" ON public.community_categories
    FOR SELECT USING (is_active = true);

-- Follows policies
CREATE POLICY "Anyone can view follows" ON public.user_follows
    FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON public.user_follows
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM users WHERE id = follower_id));

CREATE POLICY "Users can unfollow" ON public.user_follows
    FOR DELETE USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = follower_id));

-- Bookmarks policies
CREATE POLICY "Users can view own bookmarks" ON public.user_bookmarks
    FOR SELECT USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can bookmark posts" ON public.user_bookmarks
    FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can remove bookmarks" ON public.user_bookmarks
    FOR DELETE USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Insert default categories
INSERT INTO public.community_categories (name, slug, description, icon, color, display_order) VALUES
('General Discussion', 'general', 'General discussions about Erigga and his music', '💬', '#3B82F6', 1),
('Music Analysis', 'music', 'Deep dives into Erigga''s lyrics and music', '🎵', '#10B981', 2),
('Fan Art', 'art', 'Share your Erigga-inspired artwork', '🎨', '#F59E0B', 3),
('Events & Shows', 'events', 'Discussions about concerts and appearances', '🎤', '#EF4444', 4),
('News & Updates', 'news', 'Latest news about Erigga', '📰', '#8B5CF6', 5),
('Collaborations', 'collabs', 'Discuss Erigga''s collaborations', '🤝', '#06B6D4', 6),
('Behind the Scenes', 'bts', 'Exclusive behind-the-scenes content', '🎬', '#F97316', 7)
ON CONFLICT (name) DO NOTHING;

-- Create sample admin user (will be created when first admin signs up)
-- The trigger will handle user creation automatically

COMMIT;
