-- =====================================================
-- COMPLETE PRODUCTION MIGRATION FOR ERIGGA LIVE
-- =====================================================
-- This script safely migrates the existing database to the new schema
-- Handles existing data and updates tier system

-- First, let's check what exists and create what's missing
DO $$
BEGIN
    -- Check if user_tier type exists, if so, drop and recreate with new values
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_tier') THEN
        -- We need to drop the type and recreate it, but first handle any dependencies
        
        -- Add a temporary column to store current tier values
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tier') THEN
            ALTER TABLE users ADD COLUMN IF NOT EXISTS temp_tier TEXT;
            UPDATE users SET temp_tier = tier::TEXT;
        END IF;
        
        -- Drop the old type (this will fail if there are dependencies, which is expected)
        BEGIN
            DROP TYPE IF EXISTS user_tier CASCADE;
        EXCEPTION
            WHEN OTHERS THEN
                -- Handle the case where type is in use
                RAISE NOTICE 'Type user_tier is in use, will handle dependencies';
        END;
    END IF;
    
    -- Create the new user_tier type with correct values
    CREATE TYPE user_tier AS ENUM ('erigga_citizen', 'erigga_indigen', 'enterprise', 'admin');
    
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'user_tier type already exists with new values';
END $$;

-- Create other types if they don't exist
DO $$
BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'user_role type already exists';
END $$;

DO $$
BEGIN
    CREATE TYPE report_reason AS ENUM ('spam', 'harassment', 'hate_speech', 'misinformation', 'inappropriate_content', 'other');
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'report_reason type already exists';
END $$;

DO $$
BEGIN
    CREATE TYPE report_target_type AS ENUM ('post', 'comment');
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'report_target_type type already exists';
END $$;

-- Enable extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Update or create users table with proper structure
DO $$
BEGIN
    -- Check if users table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Create users table from scratch
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
    ELSE
        -- Add missing columns to existing users table
        BEGIN
            ALTER TABLE users ADD COLUMN IF NOT EXISTS id UUID DEFAULT uuid_generate_v4();
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Column id already exists or cannot be added';
        END;
        
        ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'erigga_citizen';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS website TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        ALTER TABLE users ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 0;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS total_posts INTEGER DEFAULT 0;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS total_comments INTEGER DEFAULT 0;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS total_votes_received INTEGER DEFAULT 0;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS coins_balance INTEGER DEFAULT 100;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_profile_public BOOLEAN DEFAULT true;
        
        -- Handle tier column migration
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'temp_tier') THEN
            -- Add new tier column
            ALTER TABLE users ADD COLUMN IF NOT EXISTS tier user_tier DEFAULT 'erigga_citizen';
            
            -- Migrate old tier values to new ones
            UPDATE users SET tier = CASE 
                WHEN temp_tier = 'grassroot' THEN 'erigga_citizen'::user_tier
                WHEN temp_tier = 'pioneer' THEN 'erigga_indigen'::user_tier
                WHEN temp_tier = 'elder' THEN 'erigga_indigen'::user_tier
                WHEN temp_tier = 'blood' THEN 'enterprise'::user_tier
                WHEN temp_tier = 'blood_brotherhood' THEN 'enterprise'::user_tier
                ELSE 'erigga_citizen'::user_tier
            END;
            
            -- Update subscription_tier column as well
            UPDATE users SET subscription_tier = CASE 
                WHEN temp_tier = 'grassroot' THEN 'erigga_citizen'
                WHEN temp_tier = 'pioneer' THEN 'erigga_indigen'
                WHEN temp_tier = 'elder' THEN 'erigga_indigen'
                WHEN temp_tier = 'blood' THEN 'enterprise'
                WHEN temp_tier = 'blood_brotherhood' THEN 'enterprise'
                ELSE 'erigga_citizen'
            END;
            
            -- Drop temporary column
            ALTER TABLE users DROP COLUMN IF EXISTS temp_tier;
        ELSE
            -- Add tier column if it doesn't exist
            ALTER TABLE users ADD COLUMN IF NOT EXISTS tier user_tier DEFAULT 'erigga_citizen';
        END IF;
        
        -- Add role column if missing
        ALTER TABLE users ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user';
    END IF;
END $$;

-- Create community_categories table
CREATE TABLE IF NOT EXISTS community_categories (
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
CREATE TABLE IF NOT EXISTS community_posts (
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
CREATE TABLE IF NOT EXISTS community_post_votes (
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

-- Create community_comments table
CREATE TABLE IF NOT EXISTS community_comments (
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
CREATE TABLE IF NOT EXISTS comment_votes (
    comment_id UUID NOT NULL REFERENCES community_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (comment_id, user_id)
);

-- Create community_comment_likes table (for backward compatibility)
CREATE TABLE IF NOT EXISTS community_comment_likes (
    comment_id UUID NOT NULL REFERENCES community_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (comment_id, user_id)
);

-- Create community_reports table
CREATE TABLE IF NOT EXISTS community_reports (
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

-- Insert default categories
INSERT INTO community_categories (name, slug, description, icon, color, display_order) VALUES
('General Discussion', 'general', 'Open discussion for all topics', '💬', '#3B82F6', 1),
('Music & Bars', 'music-bars', 'Share your bars and discuss music', '🎵', '#10B981', 2),
('Events & Shows', 'events', 'Upcoming events and show discussions', '🎤', '#F59E0B', 3),
('Fan Art & Media', 'fan-art', 'Share your creative works', '🎨', '#8B5CF6', 4),
('Questions & Help', 'questions', 'Ask questions and get help', '❓', '#EF4444', 5)
ON CONFLICT (slug) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category_id ON community_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_vote_count ON community_posts(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_community_post_votes_user_id ON community_post_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_user_id ON community_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_user_id ON comment_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comment_likes_user_id ON community_comment_likes(user_id);

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

-- Function to toggle post vote
CREATE OR REPLACE FUNCTION toggle_post_vote(post_id_param UUID)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_existing_vote BOOLEAN;
    v_vote_count INTEGER;
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
        
        -- Get updated vote count
        SELECT vote_count INTO v_vote_count FROM community_posts WHERE id = post_id_param;
        
        RETURN json_build_object('success', true, 'voted', false, 'vote_count', v_vote_count, 'message', 'Vote removed');
    ELSE
        -- Add vote
        INSERT INTO community_post_votes (post_id, user_id)
        VALUES (post_id_param, v_user_id);
        
        -- Increment vote count
        PERFORM increment_post_votes(post_id_param);
        
        -- Get updated vote count
        SELECT vote_count INTO v_vote_count FROM community_posts WHERE id = post_id_param;
        
        RETURN json_build_object('success', true, 'voted', true, 'vote_count', v_vote_count, 'message', 'Vote added');
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_community_categories_updated_at ON community_categories;
DROP TRIGGER IF EXISTS update_community_posts_updated_at ON community_posts;
DROP TRIGGER IF EXISTS update_community_comments_updated_at ON community_comments;

-- Create triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_categories_updated_at BEFORE UPDATE ON community_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_comments_updated_at BEFORE UPDATE ON community_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comment_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view public user data" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view published posts" ON community_posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON community_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON community_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON community_posts;
DROP POLICY IF EXISTS "Authenticated users can vote on posts" ON community_post_votes;
DROP POLICY IF EXISTS "Authenticated users can vote on comments" ON comment_votes;
DROP POLICY IF EXISTS "Anyone can view comments" ON community_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON community_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON community_comments;
DROP POLICY IF EXISTS "Authenticated users can like comments" ON community_comment_likes;

-- Create RLS policies
CREATE POLICY "Users can view public user data" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = auth_user_id);

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

-- Function to handle user profile creation after auth signup
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

-- Drop and recreate trigger for user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
