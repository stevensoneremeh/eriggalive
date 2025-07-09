-- Complete database schema fix for authentication and community
-- This script ensures all tables exist with proper relationships and RLS policies

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (in correct order to handle dependencies)
DROP TABLE IF EXISTS community_comment_likes CASCADE;
DROP TABLE IF EXISTS community_comments CASCADE;
DROP TABLE IF EXISTS community_post_votes CASCADE;
DROP TABLE IF EXISTS community_posts CASCADE;
DROP TABLE IF EXISTS community_categories CASCADE;
DROP TABLE IF EXISTS community_reports CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    location VARCHAR(100),
    website VARCHAR(255),
    tier VARCHAR(20) DEFAULT 'grassroot' CHECK (tier IN ('grassroot', 'pioneer', 'elder', 'blood')),
    coins INTEGER DEFAULT 100,
    level INTEGER DEFAULT 1,
    points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    is_banned BOOLEAN DEFAULT false,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community categories table
CREATE TABLE community_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT '📝',
    color VARCHAR(7) DEFAULT '#6366f1',
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community posts table
CREATE TABLE community_posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES community_categories(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_url TEXT,
    media_type VARCHAR(20) CHECK (media_type IN ('image', 'video', 'audio')),
    media_metadata JSONB,
    hashtags TEXT[] DEFAULT '{}',
    mentions INTEGER[] DEFAULT '{}',
    vote_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community post votes table
CREATE TABLE community_post_votes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Create community comments table
CREATE TABLE community_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id INTEGER REFERENCES community_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community comment likes table
CREATE TABLE community_comment_likes (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER NOT NULL REFERENCES community_comments(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Create community reports table
CREATE TABLE community_reports (
    id SERIAL PRIMARY KEY,
    reporter_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_id INTEGER NOT NULL,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('post', 'comment', 'user')),
    reason VARCHAR(50) NOT NULL,
    additional_notes TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tier ON users(tier);

CREATE INDEX idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_community_posts_category_id ON community_posts(category_id);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX idx_community_posts_vote_count ON community_posts(vote_count DESC);
CREATE INDEX idx_community_posts_published ON community_posts(is_published, is_deleted);

CREATE INDEX idx_community_post_votes_post_id ON community_post_votes(post_id);
CREATE INDEX idx_community_post_votes_user_id ON community_post_votes(user_id);

CREATE INDEX idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX idx_community_comments_user_id ON community_comments(user_id);
CREATE INDEX idx_community_comments_parent_id ON community_comments(parent_comment_id);

CREATE INDEX idx_community_comment_likes_comment_id ON community_comment_likes(comment_id);
CREATE INDEX idx_community_comment_likes_user_id ON community_comment_likes(user_id);

-- Insert default categories
INSERT INTO community_categories (name, slug, description, icon, color, display_order) VALUES
('General', 'general', 'General discussions and announcements', '💬', '#6366f1', 1),
('Bars', 'bars', 'Share your rap bars and lyrics', '🎤', '#ef4444', 2),
('Music', 'music', 'Discuss music, albums, and tracks', '🎵', '#8b5cf6', 3),
('Events', 'events', 'Concert updates and event discussions', '🎪', '#f59e0b', 4),
('Fan Art', 'fan-art', 'Share your creative works', '🎨', '#10b981', 5),
('Questions', 'questions', 'Ask questions to the community', '❓', '#06b6d4', 6);

-- Create functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_categories_updated_at BEFORE UPDATE ON community_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_comments_updated_at BEFORE UPDATE ON community_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update vote count
CREATE OR REPLACE FUNCTION update_post_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_posts 
        SET vote_count = vote_count + 1 
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_posts 
        SET vote_count = vote_count - 1 
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update comment count
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_posts 
        SET comment_count = comment_count + 1 
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_posts 
        SET comment_count = comment_count - 1 
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update comment like count
CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_comments 
        SET like_count = like_count + 1 
        WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_comments 
        SET like_count = like_count - 1 
        WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for counts
CREATE TRIGGER trigger_update_post_vote_count
    AFTER INSERT OR DELETE ON community_post_votes
    FOR EACH ROW EXECUTE FUNCTION update_post_vote_count();

CREATE TRIGGER trigger_update_post_comment_count
    AFTER INSERT OR DELETE ON community_comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

CREATE TRIGGER trigger_update_comment_like_count
    AFTER INSERT OR DELETE ON community_comment_likes
    FOR EACH ROW EXECUTE FUNCTION update_comment_like_count();

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = auth_user_id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Categories policies (public read)
CREATE POLICY "Anyone can view categories" ON community_categories FOR SELECT USING (is_active = true);

-- Posts policies
CREATE POLICY "Anyone can view published posts" ON community_posts FOR SELECT USING (is_published = true AND is_deleted = false);
CREATE POLICY "Users can create posts" ON community_posts FOR INSERT WITH CHECK (auth.uid() IN (SELECT auth_user_id FROM users WHERE id = user_id));
CREATE POLICY "Users can update own posts" ON community_posts FOR UPDATE USING (auth.uid() IN (SELECT auth_user_id FROM users WHERE id = user_id));
CREATE POLICY "Users can delete own posts" ON community_posts FOR DELETE USING (auth.uid() IN (SELECT auth_user_id FROM users WHERE id = user_id));

-- Post votes policies
CREATE POLICY "Anyone can view votes" ON community_post_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote" ON community_post_votes FOR INSERT WITH CHECK (auth.uid() IN (SELECT auth_user_id FROM users WHERE id = user_id));
CREATE POLICY "Users can remove own votes" ON community_post_votes FOR DELETE USING (auth.uid() IN (SELECT auth_user_id FROM users WHERE id = user_id));

-- Comments policies
CREATE POLICY "Anyone can view comments" ON community_comments FOR SELECT USING (is_deleted = false);
CREATE POLICY "Users can create comments" ON community_comments FOR INSERT WITH CHECK (auth.uid() IN (SELECT auth_user_id FROM users WHERE id = user_id));
CREATE POLICY "Users can update own comments" ON community_comments FOR UPDATE USING (auth.uid() IN (SELECT auth_user_id FROM users WHERE id = user_id));
CREATE POLICY "Users can delete own comments" ON community_comments FOR DELETE USING (auth.uid() IN (SELECT auth_user_id FROM users WHERE id = user_id));

-- Comment likes policies
CREATE POLICY "Anyone can view comment likes" ON community_comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can like comments" ON community_comment_likes FOR INSERT WITH CHECK (auth.uid() IN (SELECT auth_user_id FROM users WHERE id = user_id));
CREATE POLICY "Users can remove own likes" ON community_comment_likes FOR DELETE USING (auth.uid() IN (SELECT auth_user_id FROM users WHERE id = user_id));

-- Reports policies
CREATE POLICY "Users can create reports" ON community_reports FOR INSERT WITH CHECK (auth.uid() IN (SELECT auth_user_id FROM users WHERE id = reporter_user_id));
CREATE POLICY "Users can view own reports" ON community_reports FOR SELECT USING (auth.uid() IN (SELECT auth_user_id FROM users WHERE id = reporter_user_id));

-- Function to handle post voting with coins
CREATE OR REPLACE FUNCTION handle_post_vote(
    p_post_id INTEGER,
    p_voter_auth_id UUID,
    p_post_creator_auth_id UUID,
    p_coin_amount INTEGER DEFAULT 100
)
RETURNS BOOLEAN AS $$
DECLARE
    v_voter_id INTEGER;
    v_post_creator_id INTEGER;
    v_existing_vote_id INTEGER;
    v_voter_coins INTEGER;
BEGIN
    -- Get voter's internal ID and coin balance
    SELECT id, coins INTO v_voter_id, v_voter_coins
    FROM users 
    WHERE auth_user_id = p_voter_auth_id;
    
    IF v_voter_id IS NULL THEN
        RAISE EXCEPTION 'Voter not found';
    END IF;
    
    -- Get post creator's internal ID
    SELECT id INTO v_post_creator_id
    FROM users 
    WHERE auth_user_id = p_post_creator_auth_id;
    
    IF v_post_creator_id IS NULL THEN
        RAISE EXCEPTION 'Post creator not found';
    END IF;
    
    -- Check if voting on own post
    IF v_voter_id = v_post_creator_id THEN
        RAISE EXCEPTION 'Cannot vote on own post';
    END IF;
    
    -- Check for existing vote
    SELECT id INTO v_existing_vote_id
    FROM community_post_votes 
    WHERE post_id = p_post_id AND user_id = v_voter_id;
    
    IF v_existing_vote_id IS NOT NULL THEN
        -- Remove vote and refund coins
        DELETE FROM community_post_votes WHERE id = v_existing_vote_id;
        
        -- Refund coins to voter
        UPDATE users SET coins = coins + p_coin_amount WHERE id = v_voter_id;
        
        -- Deduct coins from post creator
        UPDATE users SET coins = coins - p_coin_amount WHERE id = v_post_creator_id;
        
        RETURN FALSE; -- Vote removed
    ELSE
        -- Check if voter has enough coins
        IF v_voter_coins < p_coin_amount THEN
            RAISE EXCEPTION 'Insufficient coins';
        END IF;
        
        -- Add vote
        INSERT INTO community_post_votes (post_id, user_id) 
        VALUES (p_post_id, v_voter_id);
        
        -- Deduct coins from voter
        UPDATE users SET coins = coins - p_coin_amount WHERE id = v_voter_id;
        
        -- Add coins to post creator
        UPDATE users SET coins = coins + p_coin_amount WHERE id = v_post_creator_id;
        
        RETURN TRUE; -- Vote added
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
