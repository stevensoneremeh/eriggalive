-- Create chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id TEXT NOT NULL,
    vote_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat message votes table
CREATE TABLE IF NOT EXISTS chat_message_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- Create freebies table
CREATE TABLE IF NOT EXISTS freebies (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    type TEXT NOT NULL CHECK (type IN ('track', 'video', 'image', 'document')),
    vote_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create freebie votes table
CREATE TABLE IF NOT EXISTS freebie_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    freebie_id INTEGER NOT NULL REFERENCES freebies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(freebie_id, user_id)
);

-- Create freebies posts table
CREATE TABLE IF NOT EXISTS freebies_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create freebies post votes table
CREATE TABLE IF NOT EXISTS freebies_post_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES freebies_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_message_votes_message_id ON chat_message_votes(message_id);
CREATE INDEX IF NOT EXISTS idx_freebies_is_active ON freebies(is_active);
CREATE INDEX IF NOT EXISTS idx_freebies_vote_count ON freebies(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_freebie_votes_freebie_id ON freebie_votes(freebie_id);
CREATE INDEX IF NOT EXISTS idx_freebies_posts_created_at ON freebies_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_freebies_post_votes_post_id ON freebies_post_votes(post_id);

-- Create functions for vote counting
CREATE OR REPLACE FUNCTION increment_freebie_votes(freebie_id INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE freebies SET vote_count = vote_count + 1 WHERE id = freebie_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_freebie_votes(freebie_id INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE freebies SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = freebie_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_freebie_downloads(freebie_id INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE freebies SET download_count = download_count + 1 WHERE id = freebie_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update freebies post vote counts
CREATE OR REPLACE FUNCTION update_freebies_post_votes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.vote_type = 'up' THEN
            UPDATE freebies_posts SET upvotes = upvotes + 1 WHERE id = NEW.post_id;
        ELSE
            UPDATE freebies_posts SET downvotes = downvotes + 1 WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.vote_type = 'up' THEN
            UPDATE freebies_posts SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = OLD.post_id;
        ELSE
            UPDATE freebies_posts SET downvotes = GREATEST(downvotes - 1, 0) WHERE id = OLD.post_id;
        END IF;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle vote type change
        IF OLD.vote_type = 'up' THEN
            UPDATE freebies_posts SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = OLD.post_id;
        ELSE
            UPDATE freebies_posts SET downvotes = GREATEST(downvotes - 1, 0) WHERE id = OLD.post_id;
        END IF;
        
        IF NEW.vote_type = 'up' THEN
            UPDATE freebies_posts SET upvotes = upvotes + 1 WHERE id = NEW.post_id;
        ELSE
            UPDATE freebies_posts SET downvotes = downvotes + 1 WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for freebies post votes
DROP TRIGGER IF EXISTS trigger_update_freebies_post_votes ON freebies_post_votes;
CREATE TRIGGER trigger_update_freebies_post_votes
    AFTER INSERT OR UPDATE OR DELETE ON freebies_post_votes
    FOR EACH ROW EXECUTE FUNCTION update_freebies_post_votes();

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE freebies ENABLE ROW LEVEL SECURITY;
ALTER TABLE freebie_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE freebies_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE freebies_post_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_messages
CREATE POLICY "Users can view all chat messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Users can insert their own chat messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));
CREATE POLICY "Users can update their own chat messages" ON chat_messages FOR UPDATE USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));
CREATE POLICY "Users can delete their own chat messages" ON chat_messages FOR DELETE USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));

-- RLS Policies for chat_message_votes
CREATE POLICY "Users can view all chat message votes" ON chat_message_votes FOR SELECT USING (true);
CREATE POLICY "Users can manage their own chat message votes" ON chat_message_votes FOR ALL USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));

-- RLS Policies for freebies
CREATE POLICY "Users can view active freebies" ON freebies FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage freebies" ON freebies FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE auth_user_id = auth.uid()::text 
        AND tier = 'admin'
    )
);

-- RLS Policies for freebie_votes
CREATE POLICY "Users can view all freebie votes" ON freebie_votes FOR SELECT USING (true);
CREATE POLICY "Users can manage their own freebie votes" ON freebie_votes FOR ALL USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));

-- RLS Policies for freebies_posts
CREATE POLICY "Users can view all freebies posts" ON freebies_posts FOR SELECT USING (true);
CREATE POLICY "Users can insert their own freebies posts" ON freebies_posts FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));
CREATE POLICY "Users can update their own freebies posts" ON freebies_posts FOR UPDATE USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));
CREATE POLICY "Users can delete their own freebies posts" ON freebies_posts FOR DELETE USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));

-- RLS Policies for freebies_post_votes
CREATE POLICY "Users can view all freebies post votes" ON freebies_post_votes FOR SELECT USING (true);
CREATE POLICY "Users can manage their own freebies post votes" ON freebies_post_votes FOR ALL USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Insert some sample freebies
INSERT INTO freebies (title, description, file_url, thumbnail_url, type, user_id) 
SELECT 
    'Erigga - Street Anthem (Free Download)',
    'Latest street anthem from Erigga, available for free download',
    'https://example.com/track1.mp3',
    'https://example.com/track1-thumb.jpg',
    'track',
    id
FROM users WHERE tier = 'admin' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO freebies (title, description, file_url, thumbnail_url, type, user_id) 
SELECT 
    'Behind the Scenes - Studio Session',
    'Exclusive behind the scenes footage from Erigga''s latest recording session',
    'https://example.com/video1.mp4',
    'https://example.com/video1-thumb.jpg',
    'video',
    id
FROM users WHERE tier = 'admin' LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert sample freebies posts
INSERT INTO freebies_posts (title, content, user_id)
SELECT 
    'New Free Track Alert! 🔥',
    'Just dropped a new street anthem for all my fans. This one hits different! Download it now and let me know what you think in the comments. Much love to everyone supporting the movement! #EriggaLive #StreetMusic',
    id
FROM users WHERE username = 'erigga_official' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO freebies_posts (title, content, user_id)
SELECT 
    'Studio Session Vibes',
    'Been cooking up some heat in the studio lately. The energy is unmatched! Can''t wait for y''all to hear what we''ve been working on. Stay tuned for more freebies coming your way! 🎵',
    id
FROM users WHERE username = 'erigga_official' LIMIT 1
ON CONFLICT DO NOTHING;
