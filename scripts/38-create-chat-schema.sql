-- Create chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id TEXT NOT NULL,
    vote_count INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat message votes table
CREATE TABLE IF NOT EXISTS chat_message_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- Create freebies posts table for community posts
CREATE TABLE IF NOT EXISTS freebies_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create freebies post votes table
CREATE TABLE IF NOT EXISTS freebies_post_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES freebies_posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_message_votes_message_id ON chat_message_votes(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_votes_user_id ON chat_message_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_freebies_posts_user_id ON freebies_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_freebies_posts_created_at ON freebies_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_freebies_post_votes_post_id ON freebies_post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_freebies_post_votes_user_id ON freebies_post_votes(user_id);

-- Create function to update chat message vote count
CREATE OR REPLACE FUNCTION update_chat_message_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE chat_messages 
        SET vote_count = (
            SELECT COUNT(*) FILTER (WHERE vote_type = 'up') - COUNT(*) FILTER (WHERE vote_type = 'down')
            FROM chat_message_votes 
            WHERE message_id = NEW.message_id
        )
        WHERE id = NEW.message_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE chat_messages 
        SET vote_count = (
            SELECT COUNT(*) FILTER (WHERE vote_type = 'up') - COUNT(*) FILTER (WHERE vote_type = 'down')
            FROM chat_message_votes 
            WHERE message_id = NEW.message_id
        )
        WHERE id = NEW.message_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE chat_messages 
        SET vote_count = (
            SELECT COUNT(*) FILTER (WHERE vote_type = 'up') - COUNT(*) FILTER (WHERE vote_type = 'down')
            FROM chat_message_votes 
            WHERE message_id = OLD.message_id
        )
        WHERE id = OLD.message_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to update freebies post vote counts
CREATE OR REPLACE FUNCTION update_freebies_post_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE freebies_posts 
        SET 
            upvotes = (SELECT COUNT(*) FROM freebies_post_votes WHERE post_id = NEW.post_id AND vote_type = 'up'),
            downvotes = (SELECT COUNT(*) FROM freebies_post_votes WHERE post_id = NEW.post_id AND vote_type = 'down')
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE freebies_posts 
        SET 
            upvotes = (SELECT COUNT(*) FROM freebies_post_votes WHERE post_id = NEW.post_id AND vote_type = 'up'),
            downvotes = (SELECT COUNT(*) FROM freebies_post_votes WHERE post_id = NEW.post_id AND vote_type = 'down')
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE freebies_posts 
        SET 
            upvotes = (SELECT COUNT(*) FROM freebies_post_votes WHERE post_id = OLD.post_id AND vote_type = 'up'),
            downvotes = (SELECT COUNT(*) FROM freebies_post_votes WHERE post_id = OLD.post_id AND vote_type = 'down')
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update vote counts
DROP TRIGGER IF EXISTS trigger_update_chat_message_vote_count ON chat_message_votes;
CREATE TRIGGER trigger_update_chat_message_vote_count
    AFTER INSERT OR UPDATE OR DELETE ON chat_message_votes
    FOR EACH ROW EXECUTE FUNCTION update_chat_message_vote_count();

DROP TRIGGER IF EXISTS trigger_update_freebies_post_vote_count ON freebies_post_votes;
CREATE TRIGGER trigger_update_freebies_post_vote_count
    AFTER INSERT OR UPDATE OR DELETE ON freebies_post_votes
    FOR EACH ROW EXECUTE FUNCTION update_freebies_post_vote_count();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS trigger_update_chat_messages_updated_at ON chat_messages;
CREATE TRIGGER trigger_update_chat_messages_updated_at
    BEFORE UPDATE ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_freebies_posts_updated_at ON freebies_posts;
CREATE TRIGGER trigger_update_freebies_posts_updated_at
    BEFORE UPDATE ON freebies_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE freebies_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE freebies_post_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_messages
CREATE POLICY "Users can view all chat messages" ON chat_messages
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own chat messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid()::text IN (
        SELECT auth_user_id FROM users WHERE id = user_id
    ));

CREATE POLICY "Users can update their own chat messages" ON chat_messages
    FOR UPDATE USING (auth.uid()::text IN (
        SELECT auth_user_id FROM users WHERE id = user_id
    ));

CREATE POLICY "Users can delete their own chat messages" ON chat_messages
    FOR DELETE USING (auth.uid()::text IN (
        SELECT auth_user_id FROM users WHERE id = user_id
    ));

-- RLS Policies for chat_message_votes
CREATE POLICY "Users can view all chat message votes" ON chat_message_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own votes" ON chat_message_votes
    FOR INSERT WITH CHECK (auth.uid()::text IN (
        SELECT auth_user_id FROM users WHERE id = user_id
    ));

CREATE POLICY "Users can update their own votes" ON chat_message_votes
    FOR UPDATE USING (auth.uid()::text IN (
        SELECT auth_user_id FROM users WHERE id = user_id
    ));

CREATE POLICY "Users can delete their own votes" ON chat_message_votes
    FOR DELETE USING (auth.uid()::text IN (
        SELECT auth_user_id FROM users WHERE id = user_id
    ));

-- RLS Policies for freebies_posts
CREATE POLICY "Users can view all freebies posts" ON freebies_posts
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own freebies posts" ON freebies_posts
    FOR INSERT WITH CHECK (auth.uid()::text IN (
        SELECT auth_user_id FROM users WHERE id = user_id
    ));

CREATE POLICY "Users can update their own freebies posts" ON freebies_posts
    FOR UPDATE USING (auth.uid()::text IN (
        SELECT auth_user_id FROM users WHERE id = user_id
    ));

CREATE POLICY "Users can delete their own freebies posts" ON freebies_posts
    FOR DELETE USING (auth.uid()::text IN (
        SELECT auth_user_id FROM users WHERE id = user_id
    ));

-- RLS Policies for freebies_post_votes
CREATE POLICY "Users can view all freebies post votes" ON freebies_post_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own freebies post votes" ON freebies_post_votes
    FOR INSERT WITH CHECK (auth.uid()::text IN (
        SELECT auth_user_id FROM users WHERE id = user_id
    ));

CREATE POLICY "Users can update their own freebies post votes" ON freebies_post_votes
    FOR UPDATE USING (auth.uid()::text IN (
        SELECT auth_user_id FROM users WHERE id = user_id
    ));

CREATE POLICY "Users can delete their own freebies post votes" ON freebies_post_votes
    FOR DELETE USING (auth.uid()::text IN (
        SELECT auth_user_id FROM users WHERE id = user_id
    ));

-- Add comments for documentation
COMMENT ON TABLE chat_messages IS 'Stores chat messages for tier-based chat rooms';
COMMENT ON TABLE chat_message_votes IS 'Stores votes for chat messages';
COMMENT ON TABLE freebies_posts IS 'Stores community posts in the freebies room';
COMMENT ON TABLE freebies_post_votes IS 'Stores votes for freebies posts';
