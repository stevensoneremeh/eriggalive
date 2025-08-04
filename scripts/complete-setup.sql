-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    auth_user_id UUID UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    tier VARCHAR(20) DEFAULT 'grassroot' CHECK (tier IN ('grassroot', 'pioneer', 'elder', 'blood')),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin', 'super_admin')),
    level INTEGER DEFAULT 1,
    points INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 500,
    bio TEXT,
    location VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    banned_until TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    referral_code VARCHAR(20) UNIQUE,
    referred_by INTEGER REFERENCES users(id),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT,
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
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
    category_id INTEGER NOT NULL REFERENCES community_categories(id),
    title VARCHAR(255),
    content TEXT NOT NULL,
    media_url TEXT,
    media_type VARCHAR(50),
    vote_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    mentions JSONB DEFAULT '[]',
    is_published BOOLEAN DEFAULT TRUE,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Create community votes table
CREATE TABLE IF NOT EXISTS community_votes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES community_comments(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id),
    UNIQUE(user_id, comment_id),
    CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category_id ON community_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_user_id ON community_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_community_votes_user_id ON community_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_community_votes_post_id ON community_votes(post_id);

-- Insert default categories
INSERT INTO community_categories (name, slug, description, icon, color, display_order) VALUES
('General Discussion', 'general', 'General discussions about Erigga and music', '💬', '#6366f1', 1),
('Bars & Lyrics', 'bars', 'Share and discuss your favorite bars and lyrics', '🎤', '#f59e0b', 2),
('Events & Shows', 'events', 'Discuss upcoming events and shows', '🎪', '#10b981', 3),
('Music Reviews', 'reviews', 'Review and rate Erigga''s music', '⭐', '#ef4444', 4),
('Fan Art', 'fan-art', 'Share your creative fan art and designs', '🎨', '#8b5cf6', 5)
ON CONFLICT (slug) DO NOTHING;

-- Create RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_votes ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = auth_user_id::text);

-- Categories policies
CREATE POLICY "Anyone can view categories" ON community_categories FOR SELECT USING (is_active = true);

-- Posts policies
CREATE POLICY "Anyone can view published posts" ON community_posts FOR SELECT USING (is_published = true AND is_deleted = false);
CREATE POLICY "Users can create posts" ON community_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own posts" ON community_posts FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND id = community_posts.user_id)
);
CREATE POLICY "Users can delete own posts" ON community_posts FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND id = community_posts.user_id)
);

-- Comments policies
CREATE POLICY "Anyone can view comments" ON community_comments FOR SELECT USING (is_deleted = false);
CREATE POLICY "Users can create comments" ON community_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own comments" ON community_comments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND id = community_comments.user_id)
);
CREATE POLICY "Users can delete own comments" ON community_comments FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND id = community_comments.user_id)
);

-- Votes policies
CREATE POLICY "Users can view all votes" ON community_votes FOR SELECT USING (true);
CREATE POLICY "Users can create votes" ON community_votes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own votes" ON community_votes FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND id = community_votes.user_id)
);
CREATE POLICY "Users can delete own votes" ON community_votes FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND id = community_votes.user_id)
);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_categories_updated_at BEFORE UPDATE ON community_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_comments_updated_at BEFORE UPDATE ON community_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle user creation from auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (auth_user_id, email, username, full_name, email_verified)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email_confirmed_at IS NOT NULL
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
