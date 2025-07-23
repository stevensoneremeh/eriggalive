-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_tier AS ENUM ('grassroot', 'pioneer', 'elder', 'blood', 'mod', 'admin');
CREATE TYPE media_type AS ENUM ('image', 'video', 'audio', 'document');
CREATE TYPE post_type AS ENUM ('text', 'image', 'video', 'audio', 'poll');
CREATE TYPE notification_type AS ENUM ('like', 'comment', 'follow', 'mention', 'system');

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name TEXT,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    tier user_tier DEFAULT 'grassroot',
    coins_balance INTEGER DEFAULT 100,
    level INTEGER DEFAULT 1,
    points INTEGER DEFAULT 0,
    location TEXT,
    website_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_banned BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles for additional data
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    preferences JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    social_links JSONB DEFAULT '{}',
    achievements JSONB DEFAULT '[]',
    stats JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community posts
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    post_type post_type DEFAULT 'text',
    media_urls JSONB DEFAULT '[]',
    tags TEXT[] DEFAULT '{}',
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post votes
CREATE TABLE IF NOT EXISTS post_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vote_type INTEGER CHECK (vote_type IN (-1, 1)), -- -1 for downvote, 1 for upvote
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comment votes
CREATE TABLE IF NOT EXISTS comment_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vote_type INTEGER CHECK (vote_type IN (-1, 1)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Chat rooms
CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    room_type VARCHAR(50) DEFAULT 'general', -- general, tier-based, private
    required_tier user_tier DEFAULT 'grassroot',
    is_active BOOLEAN DEFAULT TRUE,
    max_members INTEGER,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- text, image, file, system
    media_url TEXT,
    reply_to UUID REFERENCES chat_messages(id),
    is_deleted BOOLEAN DEFAULT FALSE,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat message votes
CREATE TABLE IF NOT EXISTS chat_message_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vote_type INTEGER CHECK (vote_type IN (-1, 1)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- Room members
CREATE TABLE IF NOT EXISTS room_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- member, moderator, admin
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_muted BOOLEAN DEFAULT FALSE,
    UNIQUE(room_id, user_id)
);

-- User follows
CREATE TABLE IF NOT EXISTS user_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media items (for vault/gallery)
CREATE TABLE IF NOT EXISTS media_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    media_type media_type NOT NULL,
    file_size BIGINT,
    duration INTEGER, -- for audio/video in seconds
    tier_access user_tier DEFAULT 'grassroot',
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media likes
CREATE TABLE IF NOT EXISTS media_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    media_id UUID REFERENCES media_items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(media_id, user_id)
);

-- Coin transactions
CREATE TABLE IF NOT EXISTS coin_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- purchase, withdrawal, reward, spend
    description TEXT,
    reference_id TEXT,
    status VARCHAR(20) DEFAULT 'completed', -- pending, completed, failed
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_upvotes ON community_posts(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_post_votes_post_id ON post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_votes_user_id ON post_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_items_tier_access ON media_items(tier_access);
CREATE INDEX IF NOT EXISTS idx_media_items_created_at ON media_items(created_at DESC);

-- Create functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_rooms_updated_at BEFORE UPDATE ON chat_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_media_items_updated_at BEFORE UPDATE ON media_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update post vote counts
CREATE OR REPLACE FUNCTION update_post_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.vote_type = 1 THEN
            UPDATE community_posts SET upvotes = upvotes + 1 WHERE id = NEW.post_id;
        ELSE
            UPDATE community_posts SET downvotes = downvotes + 1 WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.vote_type = 1 AND NEW.vote_type = -1 THEN
            UPDATE community_posts SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = NEW.post_id;
        ELSIF OLD.vote_type = -1 AND NEW.vote_type = 1 THEN
            UPDATE community_posts SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.vote_type = 1 THEN
            UPDATE community_posts SET upvotes = upvotes - 1 WHERE id = OLD.post_id;
        ELSE
            UPDATE community_posts SET downvotes = downvotes - 1 WHERE id = OLD.post_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_vote_counts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON post_votes
    FOR EACH ROW EXECUTE FUNCTION update_post_vote_counts();

-- Function to update comment counts
CREATE OR REPLACE FUNCTION update_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comment_counts_trigger
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_comment_counts();

-- Function to create user profile after user creation
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = auth_user_id);

-- User profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = user_profiles.user_id AND users.auth_user_id = auth.uid())
);

-- Community posts policies
CREATE POLICY "Posts are viewable by everyone" ON community_posts FOR SELECT USING (NOT is_deleted);
CREATE POLICY "Authenticated users can create posts" ON community_posts FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = user_id)
);
CREATE POLICY "Users can update own posts" ON community_posts FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = user_id AND users.auth_user_id = auth.uid())
);
CREATE POLICY "Users can delete own posts" ON community_posts FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = user_id AND users.auth_user_id = auth.uid())
);

-- Post votes policies
CREATE POLICY "Votes are viewable by everyone" ON post_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON post_votes FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = user_id)
);
CREATE POLICY "Users can update own votes" ON post_votes FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = user_id AND users.auth_user_id = auth.uid())
);
CREATE POLICY "Users can delete own votes" ON post_votes FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = user_id AND users.auth_user_id = auth.uid())
);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (NOT is_deleted);
CREATE POLICY "Authenticated users can create comments" ON comments FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = user_id)
);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = user_id AND users.auth_user_id = auth.uid())
);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = user_id AND users.auth_user_id = auth.uid())
);

-- Chat rooms policies
CREATE POLICY "Chat rooms are viewable by everyone" ON chat_rooms FOR SELECT USING (is_active);
CREATE POLICY "Authenticated users can create rooms" ON chat_rooms FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
);

-- Chat messages policies
CREATE POLICY "Messages are viewable by room members" ON chat_messages FOR SELECT USING (
    NOT is_deleted AND (
        EXISTS (SELECT 1 FROM room_members WHERE room_members.room_id = chat_messages.room_id AND room_members.user_id IN (
            SELECT id FROM users WHERE auth_user_id = auth.uid()
        )) OR
        EXISTS (SELECT 1 FROM chat_rooms WHERE chat_rooms.id = chat_messages.room_id AND chat_rooms.room_type = 'general')
    )
);
CREATE POLICY "Room members can send messages" ON chat_messages FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = user_id) AND
    (
        EXISTS (SELECT 1 FROM room_members WHERE room_members.room_id = chat_messages.room_id AND room_members.user_id = user_id) OR
        EXISTS (SELECT 1 FROM chat_rooms WHERE chat_rooms.id = chat_messages.room_id AND chat_rooms.room_type = 'general')
    )
);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = notifications.user_id AND users.auth_user_id = auth.uid())
);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = notifications.user_id AND users.auth_user_id = auth.uid())
);

-- Media items policies
CREATE POLICY "Media items are viewable based on tier" ON media_items FOR SELECT USING (
    tier_access = 'grassroot' OR 
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.auth_user_id = auth.uid() 
        AND (
            users.tier::text >= tier_access::text OR 
            users.id = media_items.user_id
        )
    )
);
CREATE POLICY "Authenticated users can upload media" ON media_items FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = user_id)
);

-- Insert default chat rooms
INSERT INTO chat_rooms (name, description, room_type, required_tier) VALUES
('General Chat', 'Open discussion for all members', 'general', 'grassroot'),
('Freebies', 'Share and discover free content', 'general', 'grassroot'),
('Pioneer Lounge', 'Exclusive chat for Pioneer tier members', 'tier-based', 'pioneer'),
('Elder Circle', 'Private discussions for Elder tier members', 'tier-based', 'elder'),
('Blood Brotherhood', 'Elite chat for Blood tier members', 'tier-based', 'blood')
ON CONFLICT DO NOTHING;

-- Create storage bucket for media uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Media files are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Authenticated users can upload media" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'media' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can update own media" ON storage.objects FOR UPDATE USING (
    bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete own media" ON storage.objects FOR DELETE USING (
    bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]
);
