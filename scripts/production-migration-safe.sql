-- =====================================================
-- SAFE PRODUCTION MIGRATION FOR ERIGGA LIVE PLATFORM
-- =====================================================
-- This script safely migrates existing data to the new tier system

-- First, let's check what exists and create only what's missing
DO $$ 
BEGIN
    -- Check if user_tier type exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_tier') THEN
        CREATE TYPE user_tier AS ENUM ('erigga_citizen', 'erigga_indigen', 'enterprise');
    END IF;
    
    -- Check if we need to update existing enum values
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_tier') THEN
        -- Add new enum values if they don't exist
        BEGIN
            ALTER TYPE user_tier ADD VALUE IF NOT EXISTS 'erigga_citizen';
        EXCEPTION WHEN duplicate_object THEN
            NULL; -- Ignore if already exists
        END;
        
        BEGIN
            ALTER TYPE user_tier ADD VALUE IF NOT EXISTS 'erigga_indigen';
        EXCEPTION WHEN duplicate_object THEN
            NULL; -- Ignore if already exists
        END;
        
        BEGIN
            ALTER TYPE user_tier ADD VALUE IF NOT EXISTS 'enterprise';
        EXCEPTION WHEN duplicate_object THEN
            NULL; -- Ignore if already exists
        END;
    END IF;
END $$;

-- Check if other required types exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin', 'super_admin');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_reason') THEN
        CREATE TYPE report_reason AS ENUM ('spam', 'harassment', 'hate_speech', 'misinformation', 'inappropriate_content', 'other');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_target_type') THEN
        CREATE TYPE report_target_type AS ENUM ('post', 'comment');
    END IF;
END $$;

-- Check current users table structure and add missing columns
DO $$ 
BEGIN
    -- Add tier column if it doesn't exist (check for common variations)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tier') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_tier') THEN
            ALTER TABLE users ADD COLUMN tier user_tier DEFAULT 'erigga_citizen';
        ELSE
            -- Rename subscription_tier to tier if it exists
            ALTER TABLE users RENAME COLUMN subscription_tier TO tier;
        END IF;
    END IF;
    
    -- Add other missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role user_role DEFAULT 'user';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'level') THEN
        ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'points') THEN
        ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'coins') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'coins_balance') THEN
            ALTER TABLE users RENAME COLUMN coins_balance TO coins;
        ELSE
            ALTER TABLE users ADD COLUMN coins INTEGER DEFAULT 100;
        END IF;
    END IF;
END $$;

-- Update existing tier values to new system
UPDATE users SET tier = 
    CASE 
        WHEN tier::text = 'grassroot' OR tier::text = 'free' THEN 'erigga_citizen'::user_tier
        WHEN tier::text = 'pioneer' OR tier::text = 'pro' OR tier::text = 'elder' THEN 'erigga_indigen'::user_tier
        WHEN tier::text = 'blood' OR tier::text = 'blood_brotherhood' OR tier::text = 'ent' THEN 'enterprise'::user_tier
        ELSE 'erigga_citizen'::user_tier
    END
WHERE tier IS NOT NULL;

-- Create community tables if they don't exist
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

CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES community_categories(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
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

CREATE TABLE IF NOT EXISTS community_post_votes (
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

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

CREATE TABLE IF NOT EXISTS community_comment_likes (
  comment_id UUID NOT NULL REFERENCES community_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id)
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

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_community_categories_updated_at') THEN
        CREATE TRIGGER update_community_categories_updated_at BEFORE UPDATE ON community_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_community_posts_updated_at') THEN
        CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_community_comments_updated_at') THEN
        CREATE TRIGGER update_community_comments_updated_at BEFORE UPDATE ON community_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comment_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view public user data" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view published posts" ON community_posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON community_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON community_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON community_posts;
DROP POLICY IF EXISTS "Authenticated users can vote on posts" ON community_post_votes;
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

CREATE POLICY "Anyone can view comments" ON community_comments FOR SELECT USING (is_deleted = false);
CREATE POLICY "Authenticated users can create comments" ON community_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own comments" ON community_comments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = community_comments.user_id)
);

CREATE POLICY "Authenticated users can like comments" ON community_comment_likes FOR ALL USING (auth.role() = 'authenticated');
