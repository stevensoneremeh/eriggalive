-- Complete Database Schema Fix for Authentication and Community
-- This script creates a clean, working schema without foreign key violations

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (in correct order to avoid dependency issues)
DROP TABLE IF EXISTS community_post_votes CASCADE;
DROP TABLE IF EXISTS community_post_comments CASCADE;
DROP TABLE IF EXISTS community_posts CASCADE;
DROP TABLE IF EXISTS community_categories CASCADE;
DROP TABLE IF EXISTS user_follows CASCADE;
DROP TABLE IF EXISTS coin_transactions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table (linked to auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    location VARCHAR(100),
    website VARCHAR(255),
    subscription_tier VARCHAR(20) DEFAULT 'general' CHECK (subscription_tier IN ('general', 'grassroot', 'pioneer', 'elder', 'blood')),
    coins_balance INTEGER DEFAULT 100,
    total_posts INTEGER DEFAULT 0,
    total_votes_received INTEGER DEFAULT 0,
    total_comments INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community categories
CREATE TABLE community_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT '💬',
    color VARCHAR(7) DEFAULT '#6B7280',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community posts
CREATE TABLE community_posts (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES community_categories(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    media_url TEXT,
    media_type VARCHAR(20) CHECK (media_type IN ('image', 'video', 'audio')),
    hashtags TEXT[] DEFAULT '{}',
    vote_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community post votes
CREATE TABLE community_post_votes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) DEFAULT 'up' CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Create community post comments
CREATE TABLE community_post_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id INTEGER REFERENCES community_post_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    vote_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create coin transactions
CREATE TABLE coin_transactions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('purchase', 'withdrawal', 'vote', 'reward', 'refund')),
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description TEXT,
    reference_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user follows
CREATE TABLE user_follows (
    id SERIAL PRIMARY KEY,
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- Insert default categories
INSERT INTO community_categories (name, slug, description, icon, color) VALUES
('General Discussion', 'general', 'General conversations about Erigga and music', '💬', '#6B7280'),
('Music & Bars', 'music-bars', 'Share and discuss bars, lyrics, and music', '🎵', '#F59E0B'),
('News & Updates', 'news', 'Latest news and updates about Erigga', '📰', '#3B82F6'),
('Fan Art & Creativity', 'fan-art', 'Share your creative works and fan art', '🎨', '#8B5CF6'),
('Events & Meetups', 'events', 'Discuss upcoming events and meetups', '📅', '#10B981'),
('Support & Help', 'support', 'Get help and support from the community', '🤝', '#EF4444');

-- Create indexes for better performance
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_community_posts_category_id ON community_posts(category_id);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX idx_community_post_votes_post_id ON community_post_votes(post_id);
CREATE INDEX idx_community_post_votes_user_id ON community_post_votes(user_id);
CREATE INDEX idx_community_post_comments_post_id ON community_post_comments(post_id);
CREATE INDEX idx_coin_transactions_user_id ON coin_transactions(user_id);

-- Function to automatically create user profile when auth user is created
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
    username_base TEXT;
    username_final TEXT;
    counter INTEGER := 0;
BEGIN
    -- Generate username from email
    username_base := LOWER(SPLIT_PART(NEW.email, '@', 1));
    username_base := REGEXP_REPLACE(username_base, '[^a-z0-9]', '', 'g');
    username_final := username_base;
    
    -- Ensure username is unique
    WHILE EXISTS (SELECT 1 FROM users WHERE username = username_final) LOOP
        counter := counter + 1;
        username_final := username_base || counter::TEXT;
    END LOOP;
    
    -- Insert user profile
    INSERT INTO users (
        auth_user_id,
        username,
        display_name,
        email,
        subscription_tier,
        coins_balance
    ) VALUES (
        NEW.id,
        username_final,
        COALESCE(NEW.raw_user_meta_data->>'display_name', username_final),
        NEW.email,
        'general',
        100
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- Function to update post vote count
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

-- Create trigger for vote count updates
DROP TRIGGER IF EXISTS update_post_vote_count_trigger ON community_post_votes;
CREATE TRIGGER update_post_vote_count_trigger
    AFTER INSERT OR DELETE ON community_post_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_post_vote_count();

-- Function to update post comment count
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

-- Create trigger for comment count updates
DROP TRIGGER IF EXISTS update_post_comment_count_trigger ON community_post_comments;
CREATE TRIGGER update_post_comment_count_trigger
    AFTER INSERT OR DELETE ON community_post_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_post_comment_count();

-- Function to handle coin transactions
CREATE OR REPLACE FUNCTION process_coin_transaction(
    p_user_id UUID,
    p_transaction_type VARCHAR,
    p_amount INTEGER,
    p_description TEXT DEFAULT NULL,
    p_reference_id VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_balance INTEGER;
    new_balance INTEGER;
BEGIN
    -- Get current balance
    SELECT coins_balance INTO current_balance FROM users WHERE id = p_user_id;
    
    IF current_balance IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Calculate new balance
    IF p_transaction_type IN ('purchase', 'reward', 'refund') THEN
        new_balance := current_balance + p_amount;
    ELSIF p_transaction_type IN ('withdrawal', 'vote') THEN
        IF current_balance < p_amount THEN
            RAISE EXCEPTION 'Insufficient coins';
        END IF;
        new_balance := current_balance - p_amount;
    ELSE
        RAISE EXCEPTION 'Invalid transaction type';
    END IF;
    
    -- Update user balance
    UPDATE users SET coins_balance = new_balance WHERE id = p_user_id;
    
    -- Record transaction
    INSERT INTO coin_transactions (
        user_id,
        transaction_type,
        amount,
        balance_after,
        description,
        reference_id
    ) VALUES (
        p_user_id,
        p_transaction_type,
        p_amount,
        new_balance,
        p_description,
        p_reference_id
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = auth_user_id);

-- RLS Policies for community_posts table
CREATE POLICY "Anyone can view active posts" ON community_posts FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated users can create posts" ON community_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own posts" ON community_posts FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = community_posts.user_id AND users.auth_user_id = auth.uid())
);
CREATE POLICY "Users can delete own posts" ON community_posts FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = community_posts.user_id AND users.auth_user_id = auth.uid())
);

-- RLS Policies for community_post_votes table
CREATE POLICY "Anyone can view votes" ON community_post_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON community_post_votes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own votes" ON community_post_votes FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = community_post_votes.user_id AND users.auth_user_id = auth.uid())
);
CREATE POLICY "Users can delete own votes" ON community_post_votes FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = community_post_votes.user_id AND users.auth_user_id = auth.uid())
);

-- RLS Policies for community_post_comments table
CREATE POLICY "Anyone can view active comments" ON community_post_comments FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated users can create comments" ON community_post_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own comments" ON community_post_comments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = community_post_comments.user_id AND users.auth_user_id = auth.uid())
);
CREATE POLICY "Users can delete own comments" ON community_post_comments FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = community_post_comments.user_id AND users.auth_user_id = auth.uid())
);

-- RLS Policies for coin_transactions table
CREATE POLICY "Users can view own transactions" ON coin_transactions FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = coin_transactions.user_id AND users.auth_user_id = auth.uid())
);

-- RLS Policies for user_follows table
CREATE POLICY "Anyone can view follows" ON user_follows FOR SELECT USING (true);
CREATE POLICY "Authenticated users can follow" ON user_follows FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage own follows" ON user_follows FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = user_follows.follower_id AND users.auth_user_id = auth.uid())
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
