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
DROP TYPE IF EXISTS report_reason CASCADE;
DROP TYPE IF EXISTS report_target_type CASCADE;

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin', 'super_admin');
CREATE TYPE user_tier AS ENUM ('grassroot', 'pioneer', 'elder', 'blood', 'admin');
CREATE TYPE transaction_type AS ENUM ('purchase', 'reward', 'refund', 'bonus', 'withdrawal');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
CREATE TYPE post_type AS ENUM ('text', 'image', 'video', 'audio', 'poll');
CREATE TYPE content_type AS ENUM ('music', 'video', 'podcast', 'exclusive');
CREATE TYPE vote_type AS ENUM ('up', 'down');
CREATE TYPE report_reason AS ENUM ('spam', 'harassment', 'hate_speech', 'misinformation', 'inappropriate_content', 'other');
CREATE TYPE report_target_type AS ENUM ('post', 'comment');

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    cover_image_url TEXT,
    bio TEXT,
    phone TEXT,
    location VARCHAR(100),
    website_url TEXT,
    social_links JSONB DEFAULT '{}',
    role user_role DEFAULT 'user',
    tier user_tier DEFAULT 'grassroot',
    coins INTEGER DEFAULT 100,
    points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    erigga_id VARCHAR(20) UNIQUE,
    wallet_address VARCHAR(100),
    phone_number VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_banned BOOLEAN DEFAULT false,
    ban_reason TEXT,
    banned_until TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    referral_code VARCHAR(20) UNIQUE,
    referred_by UUID REFERENCES users(id),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret TEXT,
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
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
    subscription_tier TEXT DEFAULT 'grassroot',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    total_posts INTEGER DEFAULT 0,
    total_comments INTEGER DEFAULT 0,
    total_votes_received INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community categories
CREATE TABLE IF NOT EXISTS community_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20) DEFAULT '#3B82F6',
    display_order INTEGER DEFAULT 0,
    required_tier user_tier DEFAULT 'grassroot',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community posts
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES community_categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    post_type post_type DEFAULT 'text',
    media_url TEXT,
    media_type VARCHAR(20),
    media_urls JSONB DEFAULT '[]',
    media_metadata JSONB DEFAULT '{}',
    hashtags TEXT[] DEFAULT '{}',
    vote_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    tags TEXT[],
    mentions JSONB,
    is_published BOOLEAN DEFAULT true,
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community post votes
CREATE TABLE IF NOT EXISTS community_post_votes (
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

-- Post comments
CREATE TABLE IF NOT EXISTS community_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    vote_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comment votes
CREATE TABLE IF NOT EXISTS comment_votes (
    comment_id UUID NOT NULL REFERENCES community_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (comment_id, user_id)
);

-- Community comment likes (kept for backward compatibility)
CREATE TABLE IF NOT EXISTS community_comment_likes (
    comment_id UUID NOT NULL REFERENCES community_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (comment_id, user_id)
);

-- Community reports
CREATE TABLE IF NOT EXISTS community_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_id UUID NOT NULL,
    target_type report_target_type NOT NULL,
    reason report_reason NOT NULL,
    additional_notes TEXT,
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
    required_tier user_tier DEFAULT 'grassroot',
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
    required_tier user_tier DEFAULT 'grassroot',
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
    required_tier user_tier DEFAULT 'grassroot',
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
CREATE INDEX IF NOT EXISTS idx_community_posts_vote_count ON community_posts(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_community_post_votes_user_id ON community_post_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_user_id ON community_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_user_id ON comment_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comment_likes_user_id ON community_comment_likes(user_id);

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
CREATE TRIGGER update_community_categories_updated_at BEFORE UPDATE ON community_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_comments_updated_at BEFORE UPDATE ON community_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
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
    INSERT INTO users (
        auth_user_id,
        username,
        full_name,
        email,
        avatar_url
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- RPC FUNCTIONS
-- =====================================================

-- Functions for vote counting
CREATE OR REPLACE FUNCTION increment_post_votes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE community_posts 
  SET vote_count = vote_count + 1 
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_post_votes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE community_posts 
  SET vote_count = GREATEST(vote_count - 1, 0) 
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get community posts with user data
CREATE OR REPLACE FUNCTION get_community_posts_with_user_data(category_filter UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  category_id UUID,
  title VARCHAR(255),
  content TEXT,
  media_url TEXT,
  media_type VARCHAR(20),
  vote_count INTEGER,
  comment_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  username VARCHAR(50),
  full_name VARCHAR(100),
  avatar_url TEXT,
  category_name VARCHAR(100),
  category_color VARCHAR(20),
  category_icon VARCHAR(50),
  user_voted BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.user_id,
    cp.category_id,
    cp.title,
    cp.content,
    cp.media_url,
    cp.media_type,
    cp.vote_count,
    cp.comment_count,
    cp.created_at,
    cp.updated_at,
    u.username,
    u.full_name,
    u.avatar_url,
    COALESCE(cc.name, 'General') as category_name,
    COALESCE(cc.color, '#3B82F6') as category_color,
    COALESCE(cc.icon, '💬') as category_icon,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM community_post_votes cpv 
        WHERE cpv.post_id = cp.id 
        AND cpv.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      ) THEN true
      ELSE false
    END as user_voted
  FROM community_posts cp
  LEFT JOIN users u ON cp.user_id = u.id
  LEFT JOIN community_categories cc ON cp.category_id = cc.id
  WHERE cp.is_published = true 
    AND cp.is_deleted = false
    AND (category_filter IS NULL OR cp.category_id = category_filter)
  ORDER BY cp.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create community post
CREATE OR REPLACE FUNCTION create_community_post(
    post_title TEXT,
    post_content TEXT,
    post_category_id UUID DEFAULT NULL,
    post_hashtags TEXT[] DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_post_id UUID;
    v_result JSON;
BEGIN
    -- Get current user ID
    SELECT id INTO v_user_id FROM users WHERE auth_user_id = auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object('error', 'User not authenticated');
    END IF;
    
    -- Insert the post
    INSERT INTO community_posts (
        user_id, title, content, category_id, hashtags
    ) VALUES (
        v_user_id, post_title, post_content, post_category_id, post_hashtags
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

-- Function to toggle post vote
CREATE OR REPLACE FUNCTION toggle_post_vote(post_id_param UUID)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_existing_vote BOOLEAN;
BEGIN
    -- Get current user ID
    SELECT id INTO v_user_id FROM users WHERE auth_user_id = auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object('error', 'User not authenticated');
    END IF;
    
    -- Check for existing vote
    SELECT EXISTS(
        SELECT 1 FROM community_post_votes 
        WHERE post_id = post_id_param AND user_id = v_user_id
    ) INTO v_existing_vote;
    
    IF v_existing_vote THEN
        -- Remove vote
        DELETE FROM community_post_votes 
        WHERE post_id = post_id_param AND user_id = v_user_id;
        
        -- Decrement vote count
        PERFORM decrement_post_votes(post_id_param);
        
        RETURN json_build_object('success', true, 'voted', false, 'message', 'Vote removed');
    ELSE
        -- Add vote
        INSERT INTO community_post_votes (post_id, user_id)
        VALUES (post_id_param, v_user_id);
        
        -- Increment vote count
        PERFORM increment_post_votes(post_id_param);
        
        RETURN json_build_object('success', true, 'voted', true, 'message', 'Vote added');
    END IF;
    
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
ALTER TABLE community_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;
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
CREATE POLICY "Users can view public user data" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = auth_user_id);

-- User profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = user_profiles.user_id)
);

-- Community categories policies
CREATE POLICY "Categories are viewable by everyone" ON community_categories FOR SELECT USING (true);

-- Community posts policies
CREATE POLICY "Anyone can view published posts" ON community_posts FOR SELECT USING (is_published = true AND is_deleted = false);
CREATE POLICY "Authenticated users can create posts" ON community_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own posts" ON community_posts FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = community_posts.user_id)
);
CREATE POLICY "Users can delete own posts" ON community_posts FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = community_posts.user_id)
);

-- Community post votes policies
CREATE POLICY "Authenticated users can vote on posts" ON community_post_votes FOR ALL USING (auth.role() = 'authenticated');

-- Post comments policies
CREATE POLICY "Anyone can view comments" ON community_comments FOR SELECT USING (is_deleted = false);
CREATE POLICY "Authenticated users can create comments" ON community_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own comments" ON community_comments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = community_comments.user_id)
);

-- Comment votes policies
CREATE POLICY "Authenticated users can vote on comments" ON comment_votes FOR ALL USING (auth.role() = 'authenticated');

-- Community comment likes policies
CREATE POLICY "Authenticated users can like comments" ON community_comment_likes FOR ALL USING (auth.role() = 'authenticated');

-- Coin transactions policies
CREATE POLICY "Users can view own transactions" ON coin_transactions FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = coin_transactions.user_id)
);
CREATE POLICY "Users can create transactions" ON coin_transactions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = coin_transactions.user_id)
);

-- Store products policies
CREATE POLICY "Products are viewable by everyone" ON store_products FOR SELECT USING (is_published = true);

-- Store purchases policies
CREATE POLICY "Users can view own purchases" ON store_purchases FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = store_purchases.user_id)
);
CREATE POLICY "Users can create purchases" ON store_purchases FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = store_purchases.user_id)
);

-- Events policies
CREATE POLICY "Events are viewable by everyone" ON events FOR SELECT USING (is_published = true);

-- Event tickets policies
CREATE POLICY "Users can view own tickets" ON event_tickets FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = event_tickets.user_id)
);
CREATE POLICY "Users can create tickets" ON event_tickets FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = event_tickets.user_id)
);

-- Content policies
CREATE POLICY "Content is viewable by everyone" ON content FOR SELECT USING (is_published = true);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = notifications.user_id)
);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = notifications.user_id)
);

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default community categories
INSERT INTO community_categories (name, slug, description, icon, color, display_order) VALUES
('General Discussion', 'general', 'Open discussion for all topics', '💬', '#3B82F6', 1),
('Music & Bars', 'music-bars', 'Share your bars and discuss music', '🎵', '#10B981', 2),
('Events & Shows', 'events', 'Upcoming events and show discussions', '🎤', '#F59E0B', 3),
('Fan Art & Media', 'fan-art', 'Share your creative works', '🎨', '#8B5CF6', 4),
('Questions & Help', 'questions', 'Ask questions and get help', '❓', '#EF4444', 5)
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
    '{"schema_version": "2.0", "created_at": "' || NOW() || '", "tables_created": 25}'::jsonb,
    '127.0.0.1'::inet,
    'Erigga Live Schema Setup v2.0'
);

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================
-- This completes the full Erigga Live platform database schema
-- All tables, functions, triggers, and policies are now set up
-- The frontend can now connect and interact with this backend
