-- Production Ready Schema for Erigga Live Platform
-- This script ensures all tables, functions, and policies are properly set up

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_tier AS ENUM ('grassroot', 'pioneer', 'elder', 'blood', 'mod', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE content_type AS ENUM ('music', 'video', 'image', 'document');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table (core user profiles)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    location VARCHAR(255),
    website VARCHAR(255),
    tier user_tier DEFAULT 'grassroot',
    coins INTEGER DEFAULT 100,
    level INTEGER DEFAULT 1,
    points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    is_banned BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community categories
CREATE TABLE IF NOT EXISTS community_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#f97316',
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community posts
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES community_categories(id) ON DELETE SET NULL,
    title VARCHAR(255),
    content TEXT NOT NULL,
    media_url TEXT,
    media_type content_type,
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    vote_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community comments
CREATE TABLE IF NOT EXISTS community_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post votes
CREATE TABLE IF NOT EXISTS community_post_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type INTEGER NOT NULL CHECK (vote_type IN (-1, 1)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Comment likes
CREATE TABLE IF NOT EXISTS community_comment_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID NOT NULL REFERENCES community_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Media vault
CREATE TABLE IF NOT EXISTS media_vault (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_type content_type NOT NULL,
    file_size BIGINT,
    duration INTEGER,
    tier_required user_tier DEFAULT 'grassroot',
    coin_cost INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User media access
CREATE TABLE IF NOT EXISTS user_media_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media_vault(id) ON DELETE CASCADE,
    access_type VARCHAR(20) DEFAULT 'view',
    coins_spent INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, media_id, access_type)
);

-- Coin transactions
CREATE TABLE IF NOT EXISTS coin_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    description TEXT,
    reference_id UUID,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_type VARCHAR(50) NOT NULL,
    tier_required user_tier DEFAULT 'grassroot',
    content TEXT NOT NULL,
    is_system_message BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category_id ON community_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_user_id ON community_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_community_post_votes_post_id ON community_post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_votes_user_id ON community_post_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_media_vault_tier_required ON media_vault(tier_required);
CREATE INDEX IF NOT EXISTS idx_media_vault_is_active ON media_vault(is_active);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_type ON chat_messages(room_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_media_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- RLS Policies for community_posts
DROP POLICY IF EXISTS "Anyone can view posts" ON community_posts;
CREATE POLICY "Anyone can view posts" ON community_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create posts" ON community_posts;
CREATE POLICY "Authenticated users can create posts" ON community_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own posts" ON community_posts;
CREATE POLICY "Users can update own posts" ON community_posts FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = community_posts.user_id)
);

DROP POLICY IF EXISTS "Users can delete own posts" ON community_posts;
CREATE POLICY "Users can delete own posts" ON community_posts FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = community_posts.user_id)
);

-- RLS Policies for community_comments
DROP POLICY IF EXISTS "Anyone can view comments" ON community_comments;
CREATE POLICY "Anyone can view comments" ON community_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON community_comments;
CREATE POLICY "Authenticated users can create comments" ON community_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own comments" ON community_comments;
CREATE POLICY "Users can update own comments" ON community_comments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = community_comments.user_id)
);

DROP POLICY IF EXISTS "Users can delete own comments" ON community_comments;
CREATE POLICY "Users can delete own comments" ON community_comments FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = community_comments.user_id)
);

-- RLS Policies for votes and likes
DROP POLICY IF EXISTS "Authenticated users can manage votes" ON community_post_votes;
CREATE POLICY "Authenticated users can manage votes" ON community_post_votes FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = community_post_votes.user_id)
);

DROP POLICY IF EXISTS "Authenticated users can manage comment likes" ON community_comment_likes;
CREATE POLICY "Authenticated users can manage comment likes" ON community_comment_likes FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = community_comment_likes.user_id)
);

-- RLS Policies for media_vault
DROP POLICY IF EXISTS "Anyone can view active media" ON media_vault;
CREATE POLICY "Anyone can view active media" ON media_vault FOR SELECT USING (is_active = true);

-- RLS Policies for other tables
DROP POLICY IF EXISTS "Users can view own transactions" ON coin_transactions;
CREATE POLICY "Users can view own transactions" ON coin_transactions FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = coin_transactions.user_id)
);

DROP POLICY IF EXISTS "Users can view own media access" ON user_media_access;
CREATE POLICY "Users can view own media access" ON user_media_access FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = user_media_access.user_id)
);

DROP POLICY IF EXISTS "Authenticated users can view chat messages" ON chat_messages;
CREATE POLICY "Authenticated users can view chat messages" ON chat_messages FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can send chat messages" ON chat_messages;
CREATE POLICY "Authenticated users can send chat messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Function to handle post voting
CREATE OR REPLACE FUNCTION handle_post_vote(post_id UUID, vote_type INTEGER)
RETURNS JSON AS $$
DECLARE
    current_user_id UUID;
    existing_vote INTEGER;
    new_vote_count INTEGER;
BEGIN
    -- Get current user ID
    SELECT id INTO current_user_id FROM users WHERE auth_user_id = auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN json_build_object('error', 'User not found');
    END IF;
    
    -- Check for existing vote
    SELECT community_post_votes.vote_type INTO existing_vote 
    FROM community_post_votes 
    WHERE community_post_votes.post_id = handle_post_vote.post_id 
    AND community_post_votes.user_id = current_user_id;
    
    -- Handle vote logic
    IF existing_vote IS NULL THEN
        -- No existing vote, insert new vote
        INSERT INTO community_post_votes (post_id, user_id, vote_type)
        VALUES (handle_post_vote.post_id, current_user_id, handle_post_vote.vote_type);
    ELSIF existing_vote = handle_post_vote.vote_type THEN
        -- Same vote, remove it
        DELETE FROM community_post_votes 
        WHERE community_post_votes.post_id = handle_post_vote.post_id 
        AND community_post_votes.user_id = current_user_id;
    ELSE
        -- Different vote, update it
        UPDATE community_post_votes 
        SET vote_type = handle_post_vote.vote_type
        WHERE community_post_votes.post_id = handle_post_vote.post_id 
        AND community_post_votes.user_id = current_user_id;
    END IF;
    
    -- Calculate new vote count
    SELECT COALESCE(SUM(vote_type), 0) INTO new_vote_count
    FROM community_post_votes 
    WHERE community_post_votes.post_id = handle_post_vote.post_id;
    
    -- Update post vote count
    UPDATE community_posts 
    SET vote_count = new_vote_count
    WHERE id = handle_post_vote.post_id;
    
    RETURN json_build_object('success', true, 'vote_count', new_vote_count);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update comment counts
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_posts 
        SET comment_count = comment_count + 1
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_posts 
        SET comment_count = GREATEST(comment_count - 1, 0)
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_comment_count_trigger ON community_comments;
CREATE TRIGGER update_comment_count_trigger
    AFTER INSERT OR DELETE ON community_comments
    FOR EACH ROW EXECUTE FUNCTION update_comment_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_posts_updated_at ON community_posts;
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_comments_updated_at ON community_comments;
CREATE TRIGGER update_community_comments_updated_at BEFORE UPDATE ON community_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO community_categories (name, description, color, icon) VALUES
('General Discussion', 'General conversations about Erigga and music', '#f97316', 'MessageCircle'),
('Music Reviews', 'Share your thoughts on tracks and albums', '#10b981', 'Music'),
('Fan Art', 'Show off your creative works', '#8b5cf6', 'Palette'),
('News & Updates', 'Latest news about Erigga', '#ef4444', 'Newspaper'),
('Events', 'Concerts, shows, and meetups', '#f59e0b', 'Calendar')
ON CONFLICT (name) DO NOTHING;

-- Insert sample data for testing
DO $$
DECLARE
    sample_user_id UUID;
    general_category_id UUID;
BEGIN
    -- Get or create a sample user (this would normally be created through auth)
    INSERT INTO users (
        auth_user_id, 
        email, 
        username, 
        full_name, 
        tier, 
        coins
    ) VALUES (
        uuid_generate_v4(),
        'sample@example.com',
        'sample_user',
        'Sample User',
        'grassroot',
        100
    ) ON CONFLICT (email) DO NOTHING
    RETURNING id INTO sample_user_id;
    
    -- Get sample user ID if it already exists
    IF sample_user_id IS NULL THEN
        SELECT id INTO sample_user_id FROM users WHERE email = 'sample@example.com';
    END IF;
    
    -- Get general category ID
    SELECT id INTO general_category_id FROM community_categories WHERE name = 'General Discussion';
    
    -- Insert sample posts
    INSERT INTO community_posts (user_id, category_id, title, content, vote_count, comment_count) VALUES
    (sample_user_id, general_category_id, 'Welcome to Erigga Live!', 'This is the official community for all Erigga fans. Share your thoughts, connect with other fans, and stay updated!', 5, 2),
    (sample_user_id, general_category_id, 'Favorite Erigga Track?', 'What''s your all-time favorite Erigga song? Mine has to be "Paper Boi" - that beat is just incredible!', 3, 1)
    ON CONFLICT DO NOTHING;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE community_comments;

COMMIT;
