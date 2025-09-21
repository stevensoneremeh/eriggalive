-- =====================================================
-- COMPLETE ERIGGA LIVE PLATFORM DATABASE SCHEMA
-- =====================================================
-- This script creates the entire backend schema for the Erigga Live platform
-- Run this on a fresh Supabase project to set up all tables, functions, and policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CUSTOM TYPES
-- =====================================================

-- Drop existing types if they exist
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_tier CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS transaction_status CASCADE;
DROP TYPE IF EXISTS post_type CASCADE;
DROP TYPE IF EXISTS content_type CASCADE;
DROP TYPE IF EXISTS vote_type CASCADE;

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'mod', 'user');
CREATE TYPE user_tier AS ENUM ('erigga_citizen', 'erigga_indigen', 'enterprise');
CREATE TYPE transaction_type AS ENUM ('purchase', 'reward', 'refund', 'bonus', 'withdrawal');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
CREATE TYPE post_type AS ENUM ('text', 'image', 'video', 'audio', 'poll');
CREATE TYPE content_type AS ENUM ('music', 'video', 'podcast', 'exclusive');
CREATE TYPE vote_type AS ENUM ('up', 'down');

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    phone TEXT,
    location TEXT,
    website_url TEXT,
    social_links JSONB DEFAULT '{}',
    role user_role DEFAULT 'user',
    tier user_tier DEFAULT 'erigga_citizen',
    coins INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    preferences JSONB DEFAULT '{}',
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles (additional profile information)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    display_name TEXT,
    phone_number TEXT,
    date_of_birth DATE,
    location TEXT,
    website_url TEXT,
    social_links JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    subscription_tier TEXT DEFAULT 'erigga_citizen',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    total_posts INTEGER DEFAULT 0,
    total_comments INTEGER DEFAULT 0,
    total_votes_received INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community categories
CREATE TABLE IF NOT EXISTS community_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT DEFAULT '#3B82F6',
    display_order INTEGER DEFAULT 0,
    required_tier user_tier DEFAULT 'erigga_citizen',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community posts
CREATE TABLE IF NOT EXISTS community_posts (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES community_categories(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    post_type post_type DEFAULT 'text',
    media_urls JSONB DEFAULT '[]',
    hashtags TEXT[] DEFAULT '{}',
    vote_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post comments
CREATE TABLE IF NOT EXISTS post_comments (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES post_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    vote_count INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post votes
CREATE TABLE IF NOT EXISTS post_votes (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
    vote_type vote_type NOT NULL,
    coin_amount INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- Comment votes
CREATE TABLE IF NOT EXISTS comment_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, comment_id)
);

-- =====================================================
-- PAYMENT & COMMERCE TABLES
-- =====================================================

-- Coin transactions
CREATE TABLE IF NOT EXISTS coin_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transaction_type transaction_type NOT NULL,
    status transaction_status DEFAULT 'pending',
    amount INTEGER NOT NULL,
    item_type TEXT,
    item_id TEXT,
    payment_method TEXT,
    external_transaction_id TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store products
CREATE TABLE IF NOT EXISTS store_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2),
    coin_price INTEGER,
    currency TEXT DEFAULT 'NGN',
    category TEXT,
    stock_quantity INTEGER DEFAULT 0,
    images JSONB DEFAULT '[]',
    required_tier user_tier DEFAULT 'erigga_citizen',
    is_published BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store purchases
CREATE TABLE IF NOT EXISTS store_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES store_products(id),
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC(10,2),
    total_price NUMERIC(10,2),
    status TEXT DEFAULT 'pending',
    payment_method TEXT,
    payment_id TEXT,
    shipping_address JSONB,
    tracking_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tier user_tier NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'NGN',
    payment_provider TEXT DEFAULT 'paystack',
    payment_id TEXT,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    auto_renew BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- EVENTS & TICKETS
-- =====================================================

-- Events
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    venue TEXT,
    image_url TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    ticket_price NUMERIC(10,2) DEFAULT 0,
    max_tickets INTEGER,
    tickets_sold INTEGER DEFAULT 0,
    required_tier user_tier DEFAULT 'erigga_citizen',
    is_published BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event tickets
CREATE TABLE IF NOT EXISTS event_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    ticket_code TEXT UNIQUE NOT NULL,
    purchase_price NUMERIC(10,2),
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CONTENT & MEDIA
-- =====================================================

-- Content (music, videos, exclusives)
CREATE TABLE IF NOT EXISTS content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    content_type content_type NOT NULL,
    thumbnail_url TEXT,
    content_url TEXT,
    coin_price INTEGER DEFAULT 0,
    required_tier user_tier DEFAULT 'erigga_citizen',
    is_published BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media content (for radio/streaming)
CREATE TABLE IF NOT EXISTS media_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER, -- in seconds
    file_size INTEGER, -- in bytes
    play_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    is_premium BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vault views (content access tracking)
CREATE TABLE IF NOT EXISTS vault_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    view_duration INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SOCIAL FEATURES
-- =====================================================

-- User follows
CREATE TABLE IF NOT EXISTS user_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- Shoutouts
CREATE TABLE IF NOT EXISTS shoutouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    coins_spent INTEGER DEFAULT 10,
    is_approved BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- GAMIFICATION
-- =====================================================

-- Missions
CREATE TABLE IF NOT EXISTS missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    reward_coins INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User missions (tracking)
CREATE TABLE IF NOT EXISTS user_missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, mission_id)
);

-- Referrals
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reward_coins INTEGER DEFAULT 50,
    is_rewarded BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referrer_id, referred_id)
);

-- =====================================================
-- AUDIT & LOGGING
-- =====================================================

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);

-- Community indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category_id ON community_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_votes_post_id ON post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_votes_user_id ON post_votes(user_id);

-- Transaction indexes
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created_at ON coin_transactions(created_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON post_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coin_transactions_updated_at BEFORE UPDATE ON coin_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile when user is created
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (user_id, display_name)
    VALUES (NEW.id, NEW.full_name);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Function to handle new user registration from Supabase Auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (auth_user_id, email, username, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- RPC FUNCTIONS
-- =====================================================

-- Function to create community post
CREATE OR REPLACE FUNCTION create_community_post(
    p_title TEXT,
    p_content TEXT,
    p_category_id INTEGER DEFAULT NULL,
    p_post_type post_type DEFAULT 'text',
    p_media_urls JSONB DEFAULT '[]',
    p_hashtags TEXT[] DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_post_id INTEGER;
    v_result JSON;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object('error', 'User not authenticated');
    END IF;
    
    -- Insert the post
    INSERT INTO community_posts (
        user_id, title, content, category_id, post_type, media_urls, hashtags
    ) VALUES (
        v_user_id, p_title, p_content, p_category_id, p_post_type, p_media_urls, p_hashtags
    ) RETURNING id INTO v_post_id;
    
    -- Update user's total posts count
    UPDATE user_profiles 
    SET total_posts = total_posts + 1 
    WHERE user_id = v_user_id;
    
    -- Return success with post ID
    RETURN json_build_object(
        'success', true,
        'post_id', v_post_id,
        'message', 'Post created successfully'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'error', SQLERRM,
        'success', false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to vote on post
CREATE OR REPLACE FUNCTION vote_on_post(
    p_post_id INTEGER,
    p_vote_type vote_type,
    p_coin_amount INTEGER DEFAULT 1
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_existing_vote vote_type;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object('error', 'User not authenticated');
    END IF;
    
    -- Check for existing vote
    SELECT vote_type INTO v_existing_vote
    FROM post_votes
    WHERE user_id = v_user_id AND post_id = p_post_id;
    
    IF v_existing_vote IS NOT NULL THEN
        -- Update existing vote
        UPDATE post_votes
        SET vote_type = p_vote_type, coin_amount = p_coin_amount
        WHERE user_id = v_user_id AND post_id = p_post_id;
    ELSE
        -- Insert new vote
        INSERT INTO post_votes (user_id, post_id, vote_type, coin_amount)
        VALUES (v_user_id, p_post_id, p_vote_type, p_coin_amount);
    END IF;
    
    -- Update post vote count
    UPDATE community_posts
    SET vote_count = (
        SELECT COALESCE(SUM(
            CASE 
                WHEN vote_type = 'up' THEN coin_amount
                WHEN vote_type = 'down' THEN -coin_amount
                ELSE 0
            END
        ), 0)
        FROM post_votes
        WHERE post_id = p_post_id
    )
    WHERE id = p_post_id;
    
    RETURN json_build_object('success', true, 'message', 'Vote recorded');
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE shoutouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = auth_user_id);

-- User profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Community categories policies
CREATE POLICY "Categories are viewable by everyone" ON community_categories FOR SELECT USING (true);

-- Community posts policies
CREATE POLICY "Posts are viewable by everyone" ON community_posts FOR SELECT USING (is_published = true);
CREATE POLICY "Users can create posts" ON community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON community_posts FOR UPDATE USING (auth.uid() = user_id);

-- Post comments policies
CREATE POLICY "Comments are viewable by everyone" ON post_comments FOR SELECT USING (is_deleted = false);
CREATE POLICY "Users can create comments" ON post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON post_comments FOR UPDATE USING (auth.uid() = user_id);

-- Post votes policies
CREATE POLICY "Users can view all votes" ON post_votes FOR SELECT USING (true);
CREATE POLICY "Users can create votes" ON post_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own votes" ON post_votes FOR UPDATE USING (auth.uid() = user_id);

-- Coin transactions policies
CREATE POLICY "Users can view own transactions" ON coin_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create transactions" ON coin_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Store products policies
CREATE POLICY "Products are viewable by everyone" ON store_products FOR SELECT USING (is_published = true);

-- Store purchases policies
CREATE POLICY "Users can view own purchases" ON store_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create purchases" ON store_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Events policies
CREATE POLICY "Events are viewable by everyone" ON events FOR SELECT USING (is_published = true);

-- Event tickets policies
CREATE POLICY "Users can view own tickets" ON event_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create tickets" ON event_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Content policies
CREATE POLICY "Content is viewable by everyone" ON content FOR SELECT USING (is_published = true);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default community categories
INSERT INTO community_categories (name, slug, description, icon, color, display_order) VALUES
('General Discussion', 'general', 'General discussions about Erigga and music', '💬', '#3B82F6', 1),
('Music', 'music', 'Share and discuss music', '🎵', '#10B981', 2),
('Events', 'events', 'Upcoming events and concerts', '🎤', '#F59E0B', 3),
('Fan Art', 'fan-art', 'Share your creative works', '🎨', '#8B5CF6', 4),
('News', 'news', 'Latest news and updates', '📰', '#EF4444', 5)
ON CONFLICT (slug) DO NOTHING;

-- Insert default missions
INSERT INTO missions (title, description, reward_coins) VALUES
('Welcome to Erigga Live', 'Complete your profile setup', 50),
('First Post', 'Create your first community post', 25),
('Social Butterfly', 'Follow 5 other users', 30),
('Voter', 'Vote on 10 posts', 20),
('Commentator', 'Leave 5 comments on posts', 15)
ON CONFLICT DO NOTHING;

-- Insert audit log for schema creation
INSERT INTO audit_logs (user_id, table_name, record_id, action, new_values, ip_address, user_agent)
VALUES (
    NULL,
    'schema',
    'complete_schema',
    'CREATE',
    '{"schema_version": "1.0", "created_at": "' || NOW() || '", "tables_created": 23}'::jsonb,
    '127.0.0.1'::inet,
    'Erigga Live Schema Setup'
);

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================
-- This completes the full Erigga Live platform database schema
-- All tables, functions, triggers, and policies are now set up
-- The frontend can now connect and interact with this backend
