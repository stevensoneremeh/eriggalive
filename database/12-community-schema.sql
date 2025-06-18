-- Enable CUID extension if not already enabled
-- CREATE EXTENSION IF NOT EXISTS "cuid"; -- Assuming CUIDs are preferred for user IDs from auth.users.id

-- Community Categories
CREATE TABLE IF NOT EXISTS community_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial categories
INSERT INTO community_categories (name, slug, description) VALUES
('Bars', 'bars', 'Share your lyrical bars and punchlines.'),
('Stories', 'stories', 'Tell your Erigga-related stories and experiences.'),
('Events', 'events', 'Discuss upcoming and past Erigga events.'),
('General', 'general', 'General discussions related to Erigga and the community.')
ON CONFLICT (name) DO NOTHING;


-- Community Posts
CREATE TABLE IF NOT EXISTS community_posts (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES community_categories(id) ON DELETE RESTRICT,
    content TEXT NOT NULL,
    media_url TEXT, -- URL to the uploaded media (image, audio, video)
    media_type TEXT, -- 'image', 'audio', 'video'
    media_metadata JSONB, -- Store dimensions, duration, etc.
    vote_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0, -- Placeholder for future comment feature
    tags TEXT[], -- Array of tags
    mentions JSONB, -- Store mentioned user_ids and their positions, e.g., [{"user_id": "uuid", "username": "name", "position": 10}]
    is_published BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fetching posts by user or category
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category_id ON community_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at_desc ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_vote_count_desc ON community_posts(vote_count DESC);


-- Community Post Votes (to prevent double voting and track who voted)
CREATE TABLE IF NOT EXISTS community_post_votes (
    post_id BIGINT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

-- User Profiles (ensure this table exists and has necessary columns)
-- This table is typically managed by Supabase Auth and extended via a public.users table.
-- We need: id (uuid), username, full_name, avatar_url, tier, coins.
-- If your public.users table is different, adjust FKs and queries.
-- Example:
-- CREATE TABLE IF NOT EXISTS public.users (
--     id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
--     username TEXT UNIQUE,
--     full_name TEXT,
--     avatar_url TEXT,
--     tier TEXT DEFAULT 'grassroot', -- Make sure UserTier type is defined or use TEXT
--     coins INTEGER DEFAULT 0,
--     updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Function to update user coins and post votes atomically (Example)
CREATE OR REPLACE FUNCTION handle_post_vote(
    p_post_id BIGINT,
    p_voter_id UUID,
    p_post_creator_id UUID,
    p_coin_amount INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    voter_coins INTEGER;
BEGIN
    -- Check if voter has enough coins
    SELECT coins INTO voter_coins FROM public.users WHERE id = p_voter_id;
    IF voter_coins IS NULL OR voter_coins < p_coin_amount THEN
        RAISE EXCEPTION 'Insufficient coins';
    END IF;

    -- Check for double voting
    IF EXISTS (SELECT 1 FROM community_post_votes WHERE post_id = p_post_id AND user_id = p_voter_id) THEN
        RAISE EXCEPTION 'User has already voted on this post';
    END IF;

    -- Deduct coins from voter
    UPDATE public.users SET coins = coins - p_coin_amount WHERE id = p_voter_id;

    -- Credit coins to post creator
    UPDATE public.users SET coins = coins + p_coin_amount WHERE id = p_post_creator_id;

    -- Increment post vote_count
    UPDATE community_posts SET vote_count = vote_count + 1 WHERE id = p_post_id;

    -- Record the vote
    INSERT INTO community_post_votes (post_id, user_id) VALUES (p_post_id, p_voter_id);
    
    -- Record transactions (optional, but good for audit)
    -- INSERT INTO coin_transactions (user_id, amount, type, related_post_id) VALUES (p_voter_id, -p_coin_amount, 'vote_cast', p_post_id);
    -- INSERT INTO coin_transactions (user_id, amount, type, related_post_id) VALUES (p_post_creator_id, p_coin_amount, 'vote_received', p_post_id);

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error or handle as needed
        RAISE WARNING 'Error in handle_post_vote: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER if function needs to bypass RLS for specific updates. Use with caution.

-- RLS Policies (Basic examples, tailor to your needs)
ALTER TABLE community_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to categories" ON community_categories FOR SELECT USING (true);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to published posts" ON community_posts FOR SELECT USING (is_published = TRUE AND is_deleted = FALSE);
CREATE POLICY "Allow authenticated users to insert posts" ON community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow post owner to update their posts" ON community_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow post owner to delete their posts" ON community_posts FOR DELETE USING (auth.uid() = user_id); -- (soft delete preferred)

ALTER TABLE community_post_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to votes" ON community_post_votes FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert their votes" ON community_post_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
-- No update/delete policies for votes usually, unless un-voting is a feature.

-- Trigger to update `updated_at` timestamp on community_posts
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_community_posts_updated_at
BEFORE UPDATE ON community_posts
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
