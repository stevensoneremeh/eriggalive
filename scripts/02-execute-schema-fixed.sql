-- Execute Complete Community Schema Setup (FIXED VERSION)
-- This script sets up all community-related tables, functions, triggers, and policies

-- First, let's check if we have the required users table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        RAISE EXCEPTION 'The public.users table does not exist. Please run the main schema setup first.';
    END IF;
    
    -- Check if users table has required columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id') THEN
        RAISE EXCEPTION 'The public.users table is missing the id column.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'auth_user_id') THEN
        RAISE EXCEPTION 'The public.users table is missing the auth_user_id column.';
    END IF;
    
    RAISE NOTICE 'Users table validation passed. Proceeding with community schema setup.';
END $$;

-- Check the actual data type of auth_user_id column
DO $$
DECLARE
    auth_user_id_type TEXT;
BEGIN
    SELECT data_type INTO auth_user_id_type
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'auth_user_id';
    
    RAISE NOTICE 'auth_user_id column type: %', auth_user_id_type;
END $$;

-- Drop existing community tables if they exist (in correct order to handle dependencies)
DROP TABLE IF EXISTS public.community_reports CASCADE;
DROP TABLE IF EXISTS public.community_comment_likes CASCADE;
DROP TABLE IF EXISTS public.community_comment_votes CASCADE;
DROP TABLE IF EXISTS public.community_post_votes CASCADE;
DROP TABLE IF EXISTS public.community_comments CASCADE;
DROP TABLE IF EXISTS public.community_posts CASCADE;
DROP TABLE IF EXISTS public.community_categories CASCADE;
DROP TABLE IF EXISTS public.community_media CASCADE;

-- Create community categories table
CREATE TABLE public.community_categories (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    color TEXT,
    parent_id BIGINT REFERENCES public.community_categories(id) ON DELETE SET NULL,
    post_count INTEGER DEFAULT 0 CHECK (post_count >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    required_tier TEXT DEFAULT 'grassroot' CHECK (required_tier IN ('grassroot', 'pioneer', 'elder', 'blood')),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community posts table
CREATE TABLE public.community_posts (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES public.community_categories(id) ON DELETE RESTRICT,
    title TEXT,
    content TEXT NOT NULL CHECK (LENGTH(content) >= 1 AND LENGTH(content) <= 10000),
    post_type TEXT NOT NULL DEFAULT 'discussion' CHECK (post_type IN ('discussion', 'question', 'media', 'announcement', 'event')),
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('image', 'video', 'audio')),
    media_metadata JSONB DEFAULT '{}',
    vote_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0 CHECK (comment_count >= 0),
    view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
    is_pinned BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    tags TEXT[] DEFAULT '{}',
    mentions JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community comments table
CREATE TABLE public.community_comments (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    post_id BIGINT NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    parent_comment_id BIGINT REFERENCES public.community_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (LENGTH(content) >= 1 AND LENGTH(content) <= 2000),
    like_count INTEGER DEFAULT 0 CHECK (like_count >= 0),
    reply_count INTEGER DEFAULT 0 CHECK (reply_count >= 0),
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community post votes table
CREATE TABLE public.community_post_votes (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    post_id BIGINT NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Create community comment likes table
CREATE TABLE public.community_comment_likes (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    comment_id BIGINT NOT NULL REFERENCES public.community_comments(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Create community reports table
CREATE TABLE public.community_reports (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    reporter_user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    target_id BIGINT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
    reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'hate_speech', 'misinformation', 'inappropriate_content', 'other')),
    additional_notes TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID, -- UUID of admin/mod from auth.users
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX idx_community_posts_category_id ON public.community_posts(category_id);
CREATE INDEX idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX idx_community_posts_vote_count ON public.community_posts(vote_count DESC);
CREATE INDEX idx_community_posts_published ON public.community_posts(is_published, is_deleted);

CREATE INDEX idx_community_comments_post_id ON public.community_comments(post_id);
CREATE INDEX idx_community_comments_user_id ON public.community_comments(user_id);
CREATE INDEX idx_community_comments_parent_id ON public.community_comments(parent_comment_id);
CREATE INDEX idx_community_comments_created_at ON public.community_comments(created_at);

CREATE INDEX idx_community_post_votes_post_id ON public.community_post_votes(post_id);
CREATE INDEX idx_community_post_votes_user_id ON public.community_post_votes(user_id);

CREATE INDEX idx_community_comment_likes_comment_id ON public.community_comment_likes(comment_id);
CREATE INDEX idx_community_comment_likes_user_id ON public.community_comment_likes(user_id);

-- Insert default categories
INSERT INTO public.community_categories (name, slug, description, icon, color, required_tier, display_order) VALUES
('General Discussion', 'general-discussion', 'General discussions about Erigga and his music', 'MessageSquare', '#3B82F6', 'grassroot', 1),
('Music & Lyrics', 'music-lyrics', 'Discuss Erigga''s music, lyrics, and their meanings', 'Music', '#EC4899', 'grassroot', 2),
('Events & Shows', 'events-shows', 'Information about upcoming events and shows', 'Calendar', '#10B981', 'grassroot', 3),
('Freestyle Corner', 'freestyle-corner', 'Share your own freestyle lyrics and get feedback', 'Mic', '#F59E0B', 'grassroot', 4),
('Premium Lounge', 'premium-lounge', 'Exclusive discussions for premium members', 'Crown', '#8B5CF6', 'pioneer', 5),
('Elder''s Council', 'elders-council', 'Strategic discussions for Elder tier members', 'Shield', '#6366F1', 'elder', 6),
('Blood Brotherhood', 'blood-brotherhood', 'Inner circle discussions for Blood tier members', 'Droplet', '#EF4444', 'blood', 7)
ON CONFLICT (slug) DO NOTHING;

-- Create function to handle post voting with coin transfer
CREATE OR REPLACE FUNCTION public.handle_post_vote(
    p_post_id BIGINT,
    p_voter_auth_id TEXT,
    p_post_creator_auth_id TEXT,
    p_coin_amount INTEGER DEFAULT 100
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_voter_id BIGINT;
    v_post_creator_id BIGINT;
    v_voter_coins INTEGER;
    v_existing_vote BOOLEAN;
    v_voter_auth_uuid UUID;
    v_creator_auth_uuid UUID;
BEGIN
    -- Convert text to UUID if needed
    BEGIN
        v_voter_auth_uuid := p_voter_auth_id::UUID;
        v_creator_auth_uuid := p_post_creator_auth_id::UUID;
    EXCEPTION WHEN invalid_text_representation THEN
        RAISE EXCEPTION 'Invalid UUID format provided';
    END;

    -- Get voter's internal ID and coin balance
    SELECT id, coins INTO v_voter_id, v_voter_coins
    FROM public.users 
    WHERE auth_user_id = v_voter_auth_uuid;
    
    IF v_voter_id IS NULL THEN
        RAISE EXCEPTION 'Voter not found';
    END IF;
    
    -- Get post creator's internal ID
    SELECT id INTO v_post_creator_id
    FROM public.users 
    WHERE auth_user_id = v_creator_auth_uuid;
    
    IF v_post_creator_id IS NULL THEN
        RAISE EXCEPTION 'Post creator not found';
    END IF;
    
    -- Check if voter is trying to vote on their own post
    IF v_voter_id = v_post_creator_id THEN
        RAISE EXCEPTION 'Cannot vote on own post';
    END IF;
    
    -- Check if user has enough coins
    IF v_voter_coins < p_coin_amount THEN
        RAISE EXCEPTION 'Insufficient coins';
    END IF;
    
    -- Check if user has already voted
    SELECT EXISTS(
        SELECT 1 FROM public.community_post_votes 
        WHERE post_id = p_post_id AND user_id = v_voter_id
    ) INTO v_existing_vote;
    
    IF v_existing_vote THEN
        -- Remove vote and refund coins
        DELETE FROM public.community_post_votes 
        WHERE post_id = p_post_id AND user_id = v_voter_id;
        
        -- Update vote count
        UPDATE public.community_posts 
        SET vote_count = vote_count - 1 
        WHERE id = p_post_id;
        
        -- Refund coins to voter
        UPDATE public.users 
        SET coins = coins + p_coin_amount 
        WHERE id = v_voter_id;
        
        -- Remove coins from post creator
        UPDATE public.users 
        SET coins = coins - p_coin_amount 
        WHERE id = v_post_creator_id;
        
        -- Record refund transaction (if coin_transactions table exists)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coin_transactions') THEN
            INSERT INTO public.coin_transactions (user_id, amount, transaction_type, description, status)
            VALUES (v_voter_id, p_coin_amount, 'refund', 'Vote removed - refund', 'completed');
            
            INSERT INTO public.coin_transactions (user_id, amount, transaction_type, description, status)
            VALUES (v_post_creator_id, -p_coin_amount, 'refund', 'Vote removed - deduction', 'completed');
        END IF;
        
        RETURN FALSE; -- Vote removed
    ELSE
        -- Add vote
        INSERT INTO public.community_post_votes (post_id, user_id)
        VALUES (p_post_id, v_voter_id);
        
        -- Update vote count
        UPDATE public.community_posts 
        SET vote_count = vote_count + 1 
        WHERE id = p_post_id;
        
        -- Transfer coins from voter to post creator
        UPDATE public.users 
        SET coins = coins - p_coin_amount 
        WHERE id = v_voter_id;
        
        UPDATE public.users 
        SET coins = coins + p_coin_amount 
        WHERE id = v_post_creator_id;
        
        -- Record transactions (if coin_transactions table exists)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coin_transactions') THEN
            INSERT INTO public.coin_transactions (user_id, amount, transaction_type, description, status)
            VALUES (v_voter_id, -p_coin_amount, 'content_access', 'Post vote', 'completed');
            
            INSERT INTO public.coin_transactions (user_id, amount, transaction_type, description, status)
            VALUES (v_post_creator_id, p_coin_amount, 'reward', 'Post vote received', 'completed');
        END IF;
        
        RETURN TRUE; -- Vote added
    END IF;
END;
$$;

-- Create triggers to update counts
CREATE OR REPLACE FUNCTION public.update_comment_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment comment count
        UPDATE public.community_posts 
        SET comment_count = comment_count + 1 
        WHERE id = NEW.post_id;
        
        -- If it's a reply, increment reply count
        IF NEW.parent_comment_id IS NOT NULL THEN
            UPDATE public.community_comments 
            SET reply_count = reply_count + 1 
            WHERE id = NEW.parent_comment_id;
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement comment count
        UPDATE public.community_posts 
        SET comment_count = comment_count - 1 
        WHERE id = OLD.post_id;
        
        -- If it's a reply, decrement reply count
        IF OLD.parent_comment_id IS NOT NULL THEN
            UPDATE public.community_comments 
            SET reply_count = reply_count - 1 
            WHERE id = OLD.parent_comment_id;
        END IF;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_like_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.community_comments 
        SET like_count = like_count + 1 
        WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.community_comments 
        SET like_count = like_count - 1 
        WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_comment_counts ON public.community_comments;
CREATE TRIGGER trigger_update_comment_counts
    AFTER INSERT OR DELETE ON public.community_comments
    FOR EACH ROW EXECUTE FUNCTION public.update_comment_counts();

DROP TRIGGER IF EXISTS trigger_update_like_counts ON public.community_comment_likes;
CREATE TRIGGER trigger_update_like_counts
    AFTER INSERT OR DELETE ON public.community_comment_likes
    FOR EACH ROW EXECUTE FUNCTION public.update_like_counts();

-- Enable RLS
ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read categories" ON public.community_categories;
DROP POLICY IF EXISTS "Anyone can read published posts" ON public.community_posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.community_posts;
DROP POLICY IF EXISTS "Anyone can read comments" ON public.community_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.community_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.community_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.community_comments;
DROP POLICY IF EXISTS "Anyone can read votes" ON public.community_post_votes;
DROP POLICY IF EXISTS "Authenticated users can vote" ON public.community_post_votes;
DROP POLICY IF EXISTS "Users can delete own votes" ON public.community_post_votes;
DROP POLICY IF EXISTS "Anyone can read likes" ON public.community_comment_likes;
DROP POLICY IF EXISTS "Authenticated users can like" ON public.community_comment_likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON public.community_comment_likes;
DROP POLICY IF EXISTS "Authenticated users can report" ON public.community_reports;
DROP POLICY IF EXISTS "Users can read own reports" ON public.community_reports;

-- RLS Policies with proper UUID handling
-- Categories - everyone can read
CREATE POLICY "Anyone can read categories" ON public.community_categories
    FOR SELECT USING (true);

-- Posts - everyone can read published posts
CREATE POLICY "Anyone can read published posts" ON public.community_posts
    FOR SELECT USING (is_published = true AND is_deleted = false);

-- Posts - authenticated users can create
CREATE POLICY "Authenticated users can create posts" ON public.community_posts
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = user_id)
    );

-- Posts - users can update their own posts
CREATE POLICY "Users can update own posts" ON public.community_posts
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = user_id)
    );

-- Posts - users can delete their own posts
CREATE POLICY "Users can delete own posts" ON public.community_posts
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = user_id)
    );

-- Comments - everyone can read non-deleted comments
CREATE POLICY "Anyone can read comments" ON public.community_comments
    FOR SELECT USING (is_deleted = false);

-- Comments - authenticated users can create
CREATE POLICY "Authenticated users can create comments" ON public.community_comments
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = user_id)
    );

-- Comments - users can update their own comments
CREATE POLICY "Users can update own comments" ON public.community_comments
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = user_id)
    );

-- Comments - users can delete their own comments
CREATE POLICY "Users can delete own comments" ON public.community_comments
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = user_id)
    );

-- Votes - everyone can read
CREATE POLICY "Anyone can read votes" ON public.community_post_votes
    FOR SELECT USING (true);

-- Votes - authenticated users can vote
CREATE POLICY "Authenticated users can vote" ON public.community_post_votes
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = user_id)
    );

-- Votes - users can delete their own votes
CREATE POLICY "Users can delete own votes" ON public.community_post_votes
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = user_id)
    );

-- Likes - everyone can read
CREATE POLICY "Anyone can read likes" ON public.community_comment_likes
    FOR SELECT USING (true);

-- Likes - authenticated users can like
CREATE POLICY "Authenticated users can like" ON public.community_comment_likes
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = user_id)
    );

-- Likes - users can delete their own likes
CREATE POLICY "Users can delete own likes" ON public.community_comment_likes
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = user_id)
    );

-- Reports - authenticated users can create
CREATE POLICY "Authenticated users can report" ON public.community_reports
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = reporter_user_id)
    );

-- Reports - users can read their own reports
CREATE POLICY "Users can read own reports" ON public.community_reports
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = reporter_user_id)
    );

-- Final verification
DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    trigger_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Count created tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE 'community_%';
    
    -- Count created functions
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('handle_post_vote', 'update_comment_counts', 'update_like_counts');
    
    -- Count created triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public' 
    AND trigger_name IN ('trigger_update_comment_counts', 'trigger_update_like_counts');
    
    -- Count RLS policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename LIKE 'community_%';
    
    RAISE NOTICE 'Community schema setup completed successfully!';
    RAISE NOTICE 'Tables created: %', table_count;
    RAISE NOTICE 'Functions created: %', function_count;
    RAISE NOTICE 'Triggers created: %', trigger_count;
    RAISE NOTICE 'RLS policies created: %', policy_count;
    
    IF table_count < 6 THEN
        RAISE WARNING 'Expected 6 community tables, but only % were created', table_count;
    END IF;
    
    IF function_count < 3 THEN
        RAISE WARNING 'Expected 3 functions, but only % were created', function_count;
    END IF;
    
    -- Test the handle_post_vote function exists and is callable
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'handle_post_vote') THEN
        RAISE NOTICE 'handle_post_vote function is ready for use';
    ELSE
        RAISE WARNING 'handle_post_vote function was not created properly';
    END IF;
END $$;
