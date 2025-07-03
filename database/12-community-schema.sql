-- Previous content from 12-community-schema.sql should be here...
-- (community_categories, community_posts, community_post_votes, handle_post_vote function, RLS for these)

-- Ensure CUID extension is available if you prefer CUIDs for IDs from auth.users.id
-- CREATE EXTENSION IF NOT EXISTS "cuid";

-- Community Categories (from previous)
CREATE TABLE IF NOT EXISTS community_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial categories (if not already done)
INSERT INTO community_categories (name, slug, description) VALUES
('Bars', 'bars', 'Share your lyrical bars and punchlines.'),
('Stories', 'stories', 'Tell your Erigga-related stories and experiences.'),
('Events', 'events', 'Discuss upcoming and past Erigga events.'),
('General', 'general', 'General discussions related to Erigga and the community.')
ON CONFLICT (name) DO NOTHING;


-- Community Posts (from previous, ensure content can store HTML if using rich text)
CREATE TABLE IF NOT EXISTS community_posts (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES community_categories(id) ON DELETE RESTRICT,
    content TEXT NOT NULL, -- Will store HTML from rich text editor
    media_url TEXT,
    media_type TEXT, -- 'image', 'audio', 'video'
    media_metadata JSONB,
    vote_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0, -- This will be updated by a trigger or function
    tags TEXT[],
    mentions JSONB,
    is_published BOOLEAN DEFAULT TRUE,
    is_edited BOOLEAN DEFAULT FALSE, -- New field
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes (from previous)
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category_id ON community_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at_desc ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_vote_count_desc ON community_posts(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_content_fts ON community_posts USING GIN (to_tsvector('english', content)); -- For basic search


-- Community Post Votes (from previous)
CREATE TABLE IF NOT EXISTS community_post_votes (
    post_id BIGINT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

-- NEW: Community Comments
CREATE TABLE IF NOT EXISTS community_comments (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_comment_id BIGINT REFERENCES community_comments(id) ON DELETE CASCADE, -- For replies
    content TEXT NOT NULL, -- Can also store HTML if comments have rich text
    like_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0, -- If we want to show reply count directly on parent comment
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_user_id ON community_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_parent_comment_id ON community_comments(parent_comment_id);

-- NEW: Community Comment Likes
CREATE TABLE IF NOT EXISTS community_comment_likes (
    comment_id BIGINT NOT NULL REFERENCES community_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (comment_id, user_id)
);

-- NEW: Community Reports
CREATE TYPE report_reason AS ENUM ('spam', 'harassment', 'hate_speech', 'misinformation', 'inappropriate_content', 'other');
CREATE TYPE report_target_type AS ENUM ('post', 'comment');

CREATE TABLE IF NOT EXISTS community_reports (
    id BIGSERIAL PRIMARY KEY,
    reporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_id BIGINT NOT NULL, -- ID of the post or comment
    target_type report_target_type NOT NULL,
    reason report_reason NOT NULL,
    additional_notes TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES auth.users(id), -- Admin/Moderator who resolved it
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_reports_target ON community_reports(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_community_reports_reporter ON community_reports(reporter_user_id);


-- Function to update post's comment_count (and parent comment's reply_count)
CREATE OR REPLACE FUNCTION update_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
        IF NEW.parent_comment_id IS NOT NULL THEN
            UPDATE community_comments SET reply_count = reply_count + 1 WHERE id = NEW.parent_comment_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        -- Only decrement if it's a "hard" delete or a soft delete that should reduce count
        IF OLD.is_deleted = FALSE THEN -- Assuming we only count non-deleted comments
             UPDATE community_posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.post_id;
             IF OLD.parent_comment_id IS NOT NULL THEN
                 UPDATE community_comments SET reply_count = GREATEST(0, reply_count - 1) WHERE id = OLD.parent_comment_id;
             END IF;
        END IF;
    END IF;
    RETURN NULL; -- result is ignored since this is an AFTER trigger
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER community_comments_after_insert_delete
AFTER INSERT OR DELETE ON community_comments
FOR EACH ROW EXECUTE FUNCTION update_comment_counts();


-- Function to update comment's like_count
CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE community_comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE community_comments SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.comment_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER community_comment_likes_after_insert_delete
AFTER INSERT OR DELETE ON community_comment_likes
FOR EACH ROW EXECUTE FUNCTION update_comment_like_count();


-- Function handle_post_vote (from previous, ensure it's robust)
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
    SELECT coins INTO voter_coins FROM public.users WHERE id = p_voter_id;
    IF voter_coins IS NULL OR voter_coins < p_coin_amount THEN
        RAISE EXCEPTION 'Insufficient coins';
    END IF;

    IF EXISTS (SELECT 1 FROM community_post_votes WHERE post_id = p_post_id AND user_id = p_voter_id) THEN
        RAISE EXCEPTION 'User has already voted on this post';
    END IF;

    UPDATE public.users SET coins = coins - p_coin_amount WHERE id = p_voter_id;
    UPDATE public.users SET coins = coins + p_coin_amount WHERE id = p_post_creator_id;
    UPDATE community_posts SET vote_count = vote_count + 1 WHERE id = p_post_id;
    INSERT INTO community_post_votes (post_id, user_id) VALUES (p_post_id, p_voter_id);
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in handle_post_vote: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RLS Policies (Add for new tables, review existing)
-- community_categories, community_posts, community_post_votes RLS from previous...
ALTER TABLE community_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to categories" ON community_categories FOR SELECT USING (true);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to published posts" ON community_posts FOR SELECT USING (is_published = TRUE AND is_deleted = FALSE);
CREATE POLICY "Allow authenticated users to insert posts" ON community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow post owner to update their posts" ON community_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow post owner to (soft) delete their posts" ON community_posts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id); -- For soft delete (is_deleted = true)

ALTER TABLE community_post_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to votes" ON community_post_votes FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert their votes" ON community_post_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS for community_comments
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to non-deleted comments" ON community_comments FOR SELECT USING (is_deleted = FALSE);
CREATE POLICY "Allow authenticated users to insert comments" ON community_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow comment owner to update their comments" ON community_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow comment owner to (soft) delete their comments" ON community_comments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS for community_comment_likes
ALTER TABLE community_comment_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to comment likes" ON community_comment_likes FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert their comment likes" ON community_comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow like owner to delete their comment likes (un-like)" ON community_comment_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS for community_reports
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to insert reports" ON community_reports FOR INSERT WITH CHECK (auth.uid() = reporter_user_id);
CREATE POLICY "Allow admins/moderators to view reports" ON community_reports FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator', 'super_admin'))); -- Assuming 'users' table has 'role'
CREATE POLICY "Allow admins/moderators to update reports (resolve)" ON community_reports FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator', 'super_admin')));

-- Trigger to update `updated_at` timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_community_posts_updated_at
BEFORE UPDATE ON community_posts
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_community_comments_updated_at
BEFORE UPDATE ON community_comments
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Enable Realtime on tables
-- In Supabase Dashboard: Database -> Replication -> Source (public) -> Add tables (community_posts, community_comments, community_post_votes, community_comment_likes)
-- Or via SQL:
-- ALTER PUBLICATION supabase_realtime ADD TABLE community_posts, community_comments, community_post_votes, community_comment_likes;
-- Note: This might already be set to ALL TABLES by default. Check your Supabase project settings.
