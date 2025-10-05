-- =====================================================
-- COMPLETE WORKING MIGRATION FOR ERIGGA LIVE
-- =====================================================
-- This script handles function conflicts and creates a clean working schema

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop all existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS increment_post_votes(UUID) CASCADE;
DROP FUNCTION IF EXISTS decrement_post_votes(UUID) CASCADE;
DROP FUNCTION IF EXISTS toggle_post_vote(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_community_posts_with_user_data(UUID) CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop and recreate custom types
DROP TYPE IF EXISTS user_tier CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS report_reason CASCADE;
DROP TYPE IF EXISTS report_target_type CASCADE;

CREATE TYPE user_tier AS ENUM ('erigga_citizen', 'erigga_indigen', 'enterprise', 'admin');
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin', 'super_admin');
CREATE TYPE report_reason AS ENUM ('spam', 'harassment', 'hate_speech', 'misinformation', 'inappropriate_content', 'other');
CREATE TYPE report_target_type AS ENUM ('post', 'comment');

-- Create or recreate users table
DROP TABLE IF EXISTS community_post_votes CASCADE;
DROP TABLE IF EXISTS community_comments CASCADE;
DROP TABLE IF EXISTS community_posts CASCADE;
DROP TABLE IF EXISTS community_categories CASCADE;
DROP TABLE IF EXISTS comment_votes CASCADE;
DROP TABLE IF EXISTS community_comment_likes CASCADE;
DROP TABLE IF EXISTS community_reports CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE,
    full_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    profile_image_url TEXT,
    cover_image_url TEXT,
    tier user_tier DEFAULT 'erigga_citizen',
    role user_role DEFAULT 'user',
    level INTEGER DEFAULT 1,
    points INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 100,
    subscription_tier VARCHAR(50) DEFAULT 'erigga_citizen',
    erigga_id VARCHAR(20) UNIQUE,
    bio TEXT,
    location VARCHAR(100),
    website TEXT,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_banned BOOLEAN DEFAULT false,
    ban_reason TEXT,
    banned_until TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    login_count INTEGER DEFAULT 0,
    referral_code VARCHAR(20) UNIQUE,
    referred_by UUID,
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret TEXT,
    preferences JSONB DEFAULT '{}',
    social_links JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    profile_completeness INTEGER DEFAULT 0,
    reputation_score INTEGER DEFAULT 0,
    total_posts INTEGER DEFAULT 0,
    total_comments INTEGER DEFAULT 0,
    total_votes_received INTEGER DEFAULT 0,
    coins_balance INTEGER DEFAULT 100,
    is_profile_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community_categories table
CREATE TABLE community_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community_posts table
CREATE TABLE community_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES community_categories(id) ON DELETE SET NULL,
    title VARCHAR(255),
    content TEXT NOT NULL,
    media_url TEXT,
    media_type VARCHAR(20),
    media_metadata JSONB,
    hashtags TEXT[] DEFAULT '{}',
    vote_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    tags TEXT[],
    mentions JSONB,
    is_published BOOLEAN DEFAULT true,
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community_post_votes table
CREATE TABLE community_post_votes (
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

-- Create community_comments table
CREATE TABLE community_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comment_votes table
CREATE TABLE comment_votes (
    comment_id UUID NOT NULL REFERENCES community_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (comment_id, user_id)
);

-- Create community_comment_likes table
CREATE TABLE community_comment_likes (
    comment_id UUID NOT NULL REFERENCES community_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (comment_id, user_id)
);

-- Create community_reports table
CREATE TABLE community_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_id UUID NOT NULL,
    target_type report_target_type NOT NULL,
    reason report_reason NOT NULL,
    additional_notes TEXT,
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create missions table
CREATE TABLE missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    mission_type VARCHAR(50) NOT NULL CHECK (mission_type IN ('daily', 'weekly', 'achievement', 'special')),
    category VARCHAR(50) NOT NULL,
    points_reward INTEGER NOT NULL DEFAULT 0,
    coins_reward INTEGER NOT NULL DEFAULT 0,
    requirements JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_missions table
CREATE TABLE user_missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    progress JSONB NOT NULL DEFAULT '{}',
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, mission_id)
);

-- Create user_referrals table
CREATE TABLE user_referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_code VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
    reward_claimed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referred_id)
);

-- Insert default categories
INSERT INTO community_categories (name, slug, description, icon, color, display_order) VALUES
('General Discussion', 'general', 'Open discussion for all topics', '💬', '#3B82F6', 1),
('Music & Bars', 'music-bars', 'Share your bars and discuss music', '🎵', '#10B981', 2),
('Events & Shows', 'events', 'Upcoming events and show discussions', '🎤', '#F59E0B', 3),
('Fan Art & Media', 'fan-art', 'Share your creative works', '🎨', '#8B5CF6', 4),
('Questions & Help', 'questions', 'Ask questions and get help', '❓', '#EF4444', 5);

-- Insert sample missions
INSERT INTO missions (title, description, mission_type, category, points_reward, coins_reward, requirements) VALUES
('Daily Login', 'Login to the platform daily', 'daily', 'engagement', 10, 5, '{"login_count": 1}'),
('First Post', 'Create your first community post', 'achievement', 'social', 50, 25, '{"posts_created": 1}'),
('Social Butterfly', 'Follow 5 other users', 'achievement', 'social', 100, 50, '{"users_followed": 5}'),
('Active Commenter', 'Leave 10 comments on posts', 'weekly', 'engagement', 75, 35, '{"comments_created": 10}'),
('Coin Collector', 'Earn 500 Erigga Coins', 'achievement', 'economy', 200, 100, '{"coins_earned": 500}'),
('Community Helper', 'Vote on 20 posts', 'weekly', 'engagement', 60, 30, '{"votes_given": 20}'),
('Referral Master', 'Refer 5 new users', 'achievement', 'growth', 500, 1000, '{"referrals_completed": 5}');

-- Create indexes
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_community_posts_category_id ON community_posts(category_id);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX idx_community_posts_vote_count ON community_posts(vote_count DESC);
CREATE INDEX idx_community_post_votes_user_id ON community_post_votes(user_id);
CREATE INDEX idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX idx_community_comments_user_id ON community_comments(user_id);
CREATE INDEX idx_comment_votes_user_id ON comment_votes(user_id);
CREATE INDEX idx_community_comment_likes_user_id ON community_comment_likes(user_id);
CREATE INDEX idx_missions_type_active ON missions(mission_type, is_active);
CREATE INDEX idx_user_missions_user_id ON user_missions(user_id);
CREATE INDEX idx_user_missions_completed ON user_missions(is_completed, completed_at);
CREATE INDEX idx_user_referrals_referrer ON user_referrals(referrer_id);

-- Create functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION increment_post_votes(post_id_param UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE community_posts 
    SET vote_count = vote_count + 1 
    WHERE id = post_id_param;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_post_votes(post_id_param UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE community_posts 
    SET vote_count = GREATEST(vote_count - 1, 0) 
    WHERE id = post_id_param;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION toggle_post_vote(post_id_param UUID)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_existing_vote BOOLEAN;
    v_vote_count INTEGER;
BEGIN
    SELECT id INTO v_user_id FROM users WHERE auth_user_id = auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object('error', 'User not authenticated');
    END IF;
    
    SELECT EXISTS(
        SELECT 1 FROM community_post_votes 
        WHERE post_id = post_id_param AND user_id = v_user_id
    ) INTO v_existing_vote;
    
    IF v_existing_vote THEN
        DELETE FROM community_post_votes 
        WHERE post_id = post_id_param AND user_id = v_user_id;
        
        PERFORM decrement_post_votes(post_id_param);
        
        SELECT vote_count INTO v_vote_count FROM community_posts WHERE id = post_id_param;
        
        RETURN json_build_object('success', true, 'voted', false, 'vote_count', v_vote_count, 'message', 'Vote removed');
    ELSE
        INSERT INTO community_post_votes (post_id, user_id)
        VALUES (post_id_param, v_user_id);
        
        PERFORM increment_post_votes(post_id_param);
        
        SELECT vote_count INTO v_vote_count FROM community_posts WHERE id = post_id_param;
        
        RETURN json_build_object('success', true, 'voted', true, 'vote_count', v_vote_count, 'message', 'Vote added');
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    tier TEXT,
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
        COALESCE(u.profile_image_url, u.avatar_url) as avatar_url,
        u.tier::TEXT as tier,
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

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (
        auth_user_id,
        username,
        full_name,
        email,
        avatar_url,
        tier
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url',
        'erigga_citizen'::user_tier
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_categories_updated_at 
    BEFORE UPDATE ON community_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at 
    BEFORE UPDATE ON community_posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_comments_updated_at 
    BEFORE UPDATE ON community_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_referrals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view public user data" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Anyone can view categories" ON community_categories FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view published posts" ON community_posts FOR SELECT USING (is_published = true AND is_deleted = false);
CREATE POLICY "Authenticated users can create posts" ON community_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own posts" ON community_posts FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = community_posts.user_id)
);
CREATE POLICY "Users can delete own posts" ON community_posts FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = community_posts.user_id)
);

CREATE POLICY "Authenticated users can vote on posts" ON community_post_votes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can vote on comments" ON comment_votes FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can view comments" ON community_comments FOR SELECT USING (is_deleted = false);
CREATE POLICY "Authenticated users can create comments" ON community_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own comments" ON community_comments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = community_comments.user_id)
);

CREATE POLICY "Authenticated users can like comments" ON community_comment_likes FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can view active missions" ON missions FOR SELECT USING (is_active = true);
CREATE POLICY "Users can view own mission progress" ON user_missions FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = user_missions.user_id)
);
CREATE POLICY "Users can update own mission progress" ON user_missions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = user_missions.user_id)
);
CREATE POLICY "Users can insert own mission progress" ON user_missions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = user_missions.user_id)
);

CREATE POLICY "Users can view own referrals" ON user_referrals FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND (users.id = user_referrals.referrer_id OR users.id = user_referrals.referred_id))
);
CREATE POLICY "Users can insert referrals" ON user_referrals FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = user_referrals.referrer_id)
);
