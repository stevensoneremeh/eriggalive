-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_tier AS ENUM ('grassroot', 'pioneer', 'elder', 'blood', 'admin');
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin', 'super_admin');
CREATE TYPE report_reason AS ENUM ('spam', 'harassment', 'hate_speech', 'misinformation', 'inappropriate_content', 'other');
CREATE TYPE report_target_type AS ENUM ('post', 'comment');

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar_url TEXT,
  cover_image_url TEXT,
  tier user_tier DEFAULT 'grassroot',
  role user_role DEFAULT 'user',
  level INTEGER DEFAULT 1,
  points INTEGER DEFAULT 0,
  coins INTEGER DEFAULT 100,
  erigga_id VARCHAR(20) UNIQUE,
  bio TEXT,
  location VARCHAR(100),
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community Categories
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

-- Community Posts
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES community_categories(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type VARCHAR(20),
  media_metadata JSONB,
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

-- Community Post Votes
CREATE TABLE IF NOT EXISTS community_post_votes (
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- Community Comments
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

-- Community Comment Votes (this was missing in the original schema)
CREATE TABLE IF NOT EXISTS comment_votes (
  comment_id UUID NOT NULL REFERENCES community_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id)
);

-- Community Comment Likes (kept for backward compatibility)
CREATE TABLE IF NOT EXISTS community_comment_likes (
  comment_id UUID NOT NULL REFERENCES community_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id)
);

-- Community Reports
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

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_categories_updated_at BEFORE UPDATE ON community_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_comments_updated_at BEFORE UPDATE ON community_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comment_likes ENABLE ROW LEVEL SECURITY;

-- Users can read all public user data
CREATE POLICY "Users can view public user data" ON users FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = auth_user_id);

-- Anyone can read published posts
CREATE POLICY "Anyone can view published posts" ON community_posts FOR SELECT USING (is_published = true AND is_deleted = false);

-- Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts" ON community_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can update their own posts
CREATE POLICY "Users can update own posts" ON community_posts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = community_posts.user_id)
);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts" ON community_posts FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = community_posts.user_id)
);

-- Authenticated users can vote on posts
CREATE POLICY "Authenticated users can vote on posts" ON community_post_votes FOR ALL USING (auth.role() = 'authenticated');

-- Authenticated users can vote on comments
CREATE POLICY "Authenticated users can vote on comments" ON comment_votes FOR ALL USING (auth.role() = 'authenticated');

-- Anyone can read comments
CREATE POLICY "Anyone can view comments" ON community_comments FOR SELECT USING (is_deleted = false);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments" ON community_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON community_comments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = community_comments.user_id)
);

-- Authenticated users can like comments
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic user profile creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();