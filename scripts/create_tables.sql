-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    tier VARCHAR(20) DEFAULT 'grassroot' CHECK (tier IN ('grassroot', 'pioneer', 'elder', 'blood_brotherhood', 'admin')),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin', 'super_admin')),
    level INTEGER DEFAULT 1,
    points INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 100,
    bio TEXT,
    location VARCHAR(100),
    website VARCHAR(255),
    phone VARCHAR(20),
    date_of_birth DATE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_banned BOOLEAN DEFAULT FALSE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    community_updates BOOLEAN DEFAULT TRUE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    profile_visibility VARCHAR(20) DEFAULT 'public',
    show_online_status BOOLEAN DEFAULT TRUE,
    allow_direct_messages BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community categories table
CREATE TABLE IF NOT EXISTS community_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community posts table
CREATE TABLE IF NOT EXISTS community_posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES community_categories(id) ON DELETE CASCADE,
    title VARCHAR(255),
    content TEXT NOT NULL,
    media_url TEXT,
    media_type VARCHAR(20),
    vote_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    is_published BOOLEAN DEFAULT TRUE,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community post votes table
CREATE TABLE IF NOT EXISTS community_post_votes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Create community comments table
CREATE TABLE IF NOT EXISTS community_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES community_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    vote_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community chat table
CREATE TABLE IF NOT EXISTS community_chat (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create functions for vote counting
CREATE OR REPLACE FUNCTION increment_vote_count(post_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE community_posts 
    SET vote_count = vote_count + 1 
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_vote_count(post_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE community_posts 
    SET vote_count = GREATEST(vote_count - 1, 0) 
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Insert default categories
INSERT INTO community_categories (name, slug, description, display_order) VALUES
('General Discussion', 'general', 'General discussions about Erigga and music', 1),
('Music & Bars', 'music-bars', 'Share and discuss music, bars, and lyrics', 2),
('Events & Shows', 'events', 'Upcoming events, concerts, and shows', 3),
('Fan Art & Creativity', 'fan-art', 'Share your creative works and fan art', 4),
('News & Updates', 'news', 'Latest news and updates about Erigga', 5)
ON CONFLICT (slug) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_chat ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can read all profiles but only update their own
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = auth_user_id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Categories are readable by all
CREATE POLICY "Categories are viewable by everyone" ON community_categories FOR SELECT USING (true);

-- Posts policies
CREATE POLICY "Posts are viewable by everyone" ON community_posts FOR SELECT USING (is_published = true AND is_deleted = false);
CREATE POLICY "Users can insert own posts" ON community_posts FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));
CREATE POLICY "Users can update own posts" ON community_posts FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Votes policies
CREATE POLICY "Votes are viewable by everyone" ON community_post_votes FOR SELECT USING (true);
CREATE POLICY "Users can insert own votes" ON community_post_votes FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));
CREATE POLICY "Users can delete own votes" ON community_post_votes FOR DELETE USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON community_comments FOR SELECT USING (is_deleted = false);
CREATE POLICY "Users can insert own comments" ON community_comments FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));
CREATE POLICY "Users can update own comments" ON community_comments FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Chat policies
CREATE POLICY "Chat messages are viewable by everyone" ON community_chat FOR SELECT USING (true);
CREATE POLICY "Users can insert own chat messages" ON community_chat FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category_id ON community_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_post_votes_post_id ON community_post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_votes_user_id ON community_post_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_chat_created_at ON community_chat(created_at DESC);
