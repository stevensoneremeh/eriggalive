-- =====================================================
-- SAFE MIGRATION FIX - FINAL SOLUTION
-- This script safely migrates existing data and adds missing columns
-- =====================================================

-- First, let's check what exists and add missing columns safely
DO $$ 
BEGIN
    -- Add hashtags column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'community_posts' AND column_name = 'hashtags') THEN
        ALTER TABLE community_posts ADD COLUMN hashtags text[] DEFAULT '{}';
        RAISE NOTICE 'Added hashtags column to community_posts';
    END IF;
    
    -- Add mentions column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'community_posts' AND column_name = 'mentions') THEN
        ALTER TABLE community_posts ADD COLUMN mentions bigint[] DEFAULT '{}';
        RAISE NOTICE 'Added mentions column to community_posts';
    END IF;
    
    -- Add view_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'community_posts' AND column_name = 'view_count') THEN
        ALTER TABLE community_posts ADD COLUMN view_count integer DEFAULT 0;
        RAISE NOTICE 'Added view_count column to community_posts';
    END IF;
    
    -- Add share_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'community_posts' AND column_name = 'share_count') THEN
        ALTER TABLE community_posts ADD COLUMN share_count integer DEFAULT 0;
        RAISE NOTICE 'Added share_count column to community_posts';
    END IF;
    
    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'community_posts' AND column_name = 'metadata') THEN
        ALTER TABLE community_posts ADD COLUMN metadata jsonb DEFAULT '{}';
        RAISE NOTICE 'Added metadata column to community_posts';
    END IF;
    
    -- Add is_featured column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'community_posts' AND column_name = 'is_featured') THEN
        ALTER TABLE community_posts ADD COLUMN is_featured boolean DEFAULT false;
        RAISE NOTICE 'Added is_featured column to community_posts';
    END IF;
    
    -- Add is_pinned column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'community_posts' AND column_name = 'is_pinned') THEN
        ALTER TABLE community_posts ADD COLUMN is_pinned boolean DEFAULT false;
        RAISE NOTICE 'Added is_pinned column to community_posts';
    END IF;
END $$;

-- Add missing columns to users table safely
DO $$ 
BEGIN
    -- Add reputation_score column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'reputation_score') THEN
        ALTER TABLE users ADD COLUMN reputation_score integer DEFAULT 0;
        RAISE NOTICE 'Added reputation_score column to users';
    END IF;
    
    -- Add posts_count column if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'posts_count') THEN
        ALTER TABLE users ADD COLUMN posts_count integer DEFAULT 0;
        RAISE NOTICE 'Added posts_count column to users';
    END IF;
    
    -- Add total_posts column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'total_posts') THEN
        ALTER TABLE users ADD COLUMN total_posts integer DEFAULT 0;
        RAISE NOTICE 'Added total_posts column to users';
    END IF;
END $$;

-- Create missing tables safely
CREATE TABLE IF NOT EXISTS public.user_follows (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    follower_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

CREATE TABLE IF NOT EXISTS public.post_reactions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    post_id bigint NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction_type text NOT NULL CHECK (reaction_type IN ('heart', 'fire', 'love', 'laugh', 'wow', 'sad', 'angry')),
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(post_id, user_id, reaction_type)
);

CREATE TABLE IF NOT EXISTS public.user_bookmarks (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id bigint NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, post_id)
);

CREATE TABLE IF NOT EXISTS public.hashtags (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL UNIQUE,
    usage_count integer DEFAULT 0,
    trending_score real DEFAULT 0,
    is_trending boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.post_hashtags (
    post_id bigint NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    hashtag_id bigint NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, hashtag_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('vote', 'comment', 'follow', 'mention', 'system', 'achievement')),
    title text NOT NULL,
    message text NOT NULL,
    data jsonb DEFAULT '{}',
    is_read boolean DEFAULT false,
    is_sent boolean DEFAULT false,
    sent_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- Create enhanced vote handling function
CREATE OR REPLACE FUNCTION handle_post_vote_safe(
    p_post_id bigint,
    p_voter_id bigint,
    p_coin_amount integer DEFAULT 100
)
RETURNS jsonb AS $$
DECLARE
    v_creator_id bigint;
    v_existing_vote boolean := false;
    v_voter_coins bigint;
    v_result jsonb;
BEGIN
    -- Get voter's coin balance
    SELECT coins INTO v_voter_coins
    FROM users 
    WHERE id = p_voter_id;
    
    IF v_voter_coins IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Voter not found');
    END IF;
    
    -- Get post creator's ID
    SELECT user_id INTO v_creator_id
    FROM community_posts 
    WHERE id = p_post_id;
    
    IF v_creator_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Post not found');
    END IF;
    
    -- Check if voting on own post
    IF p_voter_id = v_creator_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot vote on own post');
    END IF;
    
    -- Check if vote already exists
    SELECT EXISTS(
        SELECT 1 FROM community_post_votes 
        WHERE post_id = p_post_id AND user_id = p_voter_id
    ) INTO v_existing_vote;
    
    IF v_existing_vote THEN
        -- Remove vote and refund coins
        DELETE FROM community_post_votes 
        WHERE post_id = p_post_id AND user_id = p_voter_id;
        
        -- Update vote count
        UPDATE community_posts 
        SET vote_count = GREATEST(vote_count - 1, 0)
        WHERE id = p_post_id;
        
        -- Refund coins to voter
        UPDATE users 
        SET coins = coins + p_coin_amount 
        WHERE id = p_voter_id;
        
        -- Remove coins from creator
        UPDATE users 
        SET coins = GREATEST(coins - p_coin_amount, 0)
        WHERE id = v_creator_id;
        
        v_result := jsonb_build_object('success', true, 'voted', false, 'action', 'removed');
    ELSE
        -- Check if voter has enough coins
        IF v_voter_coins < p_coin_amount THEN
            RETURN jsonb_build_object('success', false, 'error', 'Insufficient coins');
        END IF;
        
        -- Add vote
        INSERT INTO community_post_votes (post_id, user_id)
        VALUES (p_post_id, p_voter_id);
        
        -- Update vote count
        UPDATE community_posts 
        SET vote_count = vote_count + 1 
        WHERE id = p_post_id;
        
        -- Transfer coins
        UPDATE users 
        SET coins = coins - p_coin_amount 
        WHERE id = p_voter_id;
        
        UPDATE users 
        SET coins = coins + p_coin_amount 
        WHERE id = v_creator_id;
        
        -- Create notification for post creator
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
            v_creator_id, 
            'vote', 
            'New Vote on Your Post!', 
            'Someone voted on your post and sent you ' || p_coin_amount || ' Erigga Coins!',
            jsonb_build_object('post_id', p_post_id, 'voter_id', p_voter_id, 'coins', p_coin_amount)
        );
        
        v_result := jsonb_build_object('success', true, 'voted', true, 'action', 'added');
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Create function to extract hashtags from content
CREATE OR REPLACE FUNCTION extract_hashtags(content_text text)
RETURNS text[] AS $$
DECLARE
    hashtag_array text[];
    hashtag text;
BEGIN
    -- Extract hashtags using regex
    SELECT array_agg(substring(match from 2)) 
    INTO hashtag_array
    FROM (
        SELECT regexp_split_to_table(content_text, '\s+') as match
    ) matches
    WHERE match ~ '^#[a-zA-Z0-9_]+$';
    
    RETURN COALESCE(hashtag_array, '{}');
END;
$$ LANGUAGE plpgsql;

-- Update existing posts to extract hashtags
UPDATE community_posts 
SET hashtags = extract_hashtags(content)
WHERE hashtags IS NULL OR array_length(hashtags, 1) IS NULL;

-- Update user stats from existing data
UPDATE users 
SET 
    posts_count = COALESCE((
        SELECT COUNT(*) 
        FROM community_posts 
        WHERE user_id = users.id AND is_deleted = false
    ), 0),
    total_posts = COALESCE((
        SELECT COUNT(*) 
        FROM community_posts 
        WHERE user_id = users.id AND is_deleted = false
    ), 0)
WHERE posts_count IS NULL OR posts_count = 0;

-- Insert some trending hashtags
INSERT INTO hashtags (name, usage_count, is_trending) VALUES
('PaperBoi', 25, true),
('EriggaFamily', 20, true),
('Bars', 18, true),
('EriggaLyrics', 15, true),
('Motivation', 12, true),
('Dreams', 10, true),
('EriggaLive', 8, true),
('LagosShow', 6, true),
('PaperBoiTour', 5, true),
('Community', 4, true)
ON CONFLICT (name) DO UPDATE SET 
    usage_count = EXCLUDED.usage_count,
    is_trending = EXCLUDED.is_trending;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_posts_hashtags ON community_posts USING GIN(hashtags);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_vote_count ON community_posts(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_hashtags_trending ON hashtags(is_trending, usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- Enable RLS on new tables
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view follows" ON user_follows;
CREATE POLICY "Users can view follows" ON user_follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own follows" ON user_follows;
CREATE POLICY "Users can manage their own follows" ON user_follows 
FOR ALL USING (follower_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Anyone can view hashtags" ON hashtags FOR SELECT USING (true);

CREATE POLICY "Users can view reactions" ON post_reactions FOR SELECT USING (true);
CREATE POLICY "Users can manage their own reactions" ON post_reactions 
FOR ALL USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can manage their own bookmarks" ON user_bookmarks 
FOR ALL USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view their own notifications" ON notifications 
FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update their own notifications" ON notifications 
FOR UPDATE USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Final verification
SELECT 
    'Migration completed successfully!' as status,
    (SELECT COUNT(*) FROM community_posts) as total_posts,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM community_categories) as total_categories,
    (SELECT COUNT(*) FROM hashtags) as total_hashtags;
