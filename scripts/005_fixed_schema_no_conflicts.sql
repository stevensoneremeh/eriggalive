-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Drop existing types to avoid conflicts, then recreate them
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_tier CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS transaction_status CASCADE;
DROP TYPE IF EXISTS content_type CASCADE;
DROP TYPE IF EXISTS post_type CASCADE;
DROP TYPE IF EXISTS vote_type CASCADE;

-- Custom types with updated tier system
CREATE TYPE user_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE user_tier AS ENUM ('erigga_citizen', 'erigga_indigen', 'enterprise');
CREATE TYPE transaction_type AS ENUM ('purchase', 'withdrawal', 'spend', 'reward', 'refund');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE content_type AS ENUM ('music', 'video', 'exclusive', 'chronicle', 'merch', 'event');
CREATE TYPE post_type AS ENUM ('text', 'image', 'video', 'audio', 'link');
CREATE TYPE vote_type AS ENUM ('upvote', 'downvote', 'coin_vote');

-- Drop existing tables to avoid conflicts, then recreate them
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS store_purchases CASCADE;
DROP TABLE IF EXISTS store_products CASCADE;
DROP TABLE IF EXISTS event_tickets CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS content CASCADE;
DROP TABLE IF EXISTS coin_transactions CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS post_comments CASCADE;
DROP TABLE IF EXISTS post_votes CASCADE;
DROP TABLE IF EXISTS community_posts CASCADE;
DROP TABLE IF EXISTS community_categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (linked to Supabase auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  tier user_tier NOT NULL DEFAULT 'erigga_citizen',
  role user_role NOT NULL DEFAULT 'user',
  coins INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  phone TEXT,
  location TEXT,
  social_links JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community categories
CREATE TABLE community_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  required_tier user_tier DEFAULT 'erigga_citizen',
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'hash',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community posts
CREATE TABLE community_posts (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES community_categories(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  post_type post_type DEFAULT 'text',
  media_urls JSONB DEFAULT '[]',
  hashtags TEXT[] DEFAULT '{}',
  vote_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  is_deleted BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post votes
CREATE TABLE post_votes (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  vote_type vote_type NOT NULL DEFAULT 'upvote',
  coin_amount INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Post comments
CREATE TABLE post_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  vote_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier user_tier NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  payment_provider TEXT,
  payment_id TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coin transactions
CREATE TABLE coin_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type transaction_type NOT NULL,
  status transaction_status NOT NULL DEFAULT 'completed',
  payment_method TEXT,
  external_transaction_id TEXT,
  item_id TEXT,
  item_type TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content tables
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  content_type content_type NOT NULL,
  required_tier user_tier NOT NULL DEFAULT 'erigga_citizen',
  coin_price INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  thumbnail_url TEXT,
  content_url TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  venue TEXT,
  image_url TEXT,
  max_tickets INTEGER,
  tickets_sold INTEGER DEFAULT 0,
  ticket_price DECIMAL(10, 2) DEFAULT 0,
  required_tier user_tier DEFAULT 'erigga_citizen',
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event tickets
CREATE TABLE event_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_code TEXT UNIQUE NOT NULL,
  purchase_price DECIMAL(10, 2) NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store products
CREATE TABLE store_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  coin_price INTEGER,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  images JSONB DEFAULT '[]',
  required_tier user_tier DEFAULT 'erigga_citizen',
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store purchases
CREATE TABLE store_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES store_products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  payment_method TEXT,
  payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  shipping_address JSONB,
  tracking_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

CREATE INDEX IF NOT EXISTS idx_community_posts_user ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON community_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_community_posts_published ON community_posts(is_published) WHERE is_published = TRUE;

CREATE INDEX IF NOT EXISTS idx_post_votes_user ON post_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_votes_post ON post_votes(post_id);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user ON post_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_type ON coin_transactions(transaction_type);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read) WHERE is_read = FALSE;

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_post_vote_counts() CASCADE;
DROP FUNCTION IF EXISTS update_comment_counts() CASCADE;
DROP FUNCTION IF EXISTS get_community_posts_with_user_data(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS create_community_post(TEXT, TEXT, INTEGER, TEXT[]) CASCADE;
DROP FUNCTION IF EXISTS toggle_post_vote(INTEGER) CASCADE;

-- Create functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables with updated_at column
CREATE TRIGGER set_updated_at_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_community_categories BEFORE UPDATE ON community_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_community_posts BEFORE UPDATE ON community_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_post_comments BEFORE UPDATE ON post_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_subscriptions BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_coin_transactions BEFORE UPDATE ON coin_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_content BEFORE UPDATE ON content FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_events BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_store_products BEFORE UPDATE ON store_products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_store_purchases BEFORE UPDATE ON store_purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to automatically create user profile when auth user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (
    id,
    auth_user_id,
    username,
    email,
    full_name,
    tier
  ) VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'tier')::user_tier, 'erigga_citizen')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on auth user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update vote counts
CREATE OR REPLACE FUNCTION update_post_vote_counts()
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

-- Apply vote count trigger
CREATE TRIGGER update_vote_counts_trigger
  AFTER INSERT OR DELETE ON post_votes
  FOR EACH ROW EXECUTE FUNCTION update_post_vote_counts();

-- Function to update comment counts
CREATE OR REPLACE FUNCTION update_comment_counts()
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

-- Apply comment count trigger
CREATE TRIGGER update_comment_counts_trigger
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_counts();

-- RPC Functions for community features
CREATE OR REPLACE FUNCTION get_community_posts_with_user_data(category_filter INTEGER DEFAULT NULL)
RETURNS TABLE (
  id INTEGER,
  title TEXT,
  content TEXT,
  hashtags TEXT[],
  vote_count INTEGER,
  comment_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  user_id UUID,
  category_id INTEGER,
  category_name TEXT,
  category_color TEXT,
  category_icon TEXT,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  user_voted BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.content,
    p.hashtags,
    p.vote_count,
    p.comment_count,
    p.created_at,
    p.updated_at,
    p.user_id,
    p.category_id,
    COALESCE(c.name, 'General') as category_name,
    COALESCE(c.color, '#3B82F6') as category_color,
    COALESCE(c.icon, 'hash') as category_icon,
    u.username,
    COALESCE(u.full_name, u.username) as full_name,
    u.avatar_url,
    EXISTS(
      SELECT 1 FROM post_votes pv 
      WHERE pv.post_id = p.id AND pv.user_id = auth.uid()
    ) as user_voted
  FROM community_posts p
  LEFT JOIN users u ON p.user_id = u.id
  LEFT JOIN community_categories c ON p.category_id = c.id
  WHERE p.is_published = TRUE 
    AND p.is_deleted = FALSE
    AND (category_filter IS NULL OR p.category_id = category_filter)
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_community_post(
  post_title TEXT,
  post_content TEXT,
  post_category_id INTEGER,
  post_hashtags TEXT[] DEFAULT '{}'
)
RETURNS INTEGER AS $$
DECLARE
  new_post_id INTEGER;
BEGIN
  INSERT INTO community_posts (
    user_id,
    category_id,
    title,
    content,
    hashtags
  ) VALUES (
    auth.uid(),
    post_category_id,
    post_title,
    post_content,
    post_hashtags
  ) RETURNING id INTO new_post_id;
  
  RETURN new_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION toggle_post_vote(post_id_param INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  vote_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM post_votes 
    WHERE user_id = auth.uid() AND post_id = post_id_param
  ) INTO vote_exists;
  
  IF vote_exists THEN
    DELETE FROM post_votes 
    WHERE user_id = auth.uid() AND post_id = post_id_param;
    RETURN FALSE;
  ELSE
    INSERT INTO post_votes (user_id, post_id, vote_type)
    VALUES (auth.uid(), post_id_param, 'upvote');
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY users_select ON users FOR SELECT USING (true);
CREATE POLICY users_update ON users FOR UPDATE USING (auth.uid() = id);

-- Community categories policies
CREATE POLICY community_categories_select ON community_categories FOR SELECT USING (is_active = true);

-- Community posts policies
CREATE POLICY community_posts_select ON community_posts FOR SELECT USING (
  is_published = true AND is_deleted = false
);

CREATE POLICY community_posts_insert ON community_posts FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY community_posts_update ON community_posts FOR UPDATE USING (
  auth.uid() = user_id AND NOT is_locked
);

-- Post votes policies
CREATE POLICY post_votes_select ON post_votes FOR SELECT USING (true);
CREATE POLICY post_votes_insert ON post_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY post_votes_delete ON post_votes FOR DELETE USING (auth.uid() = user_id);

-- Post comments policies
CREATE POLICY post_comments_select ON post_comments FOR SELECT USING (is_deleted = false);
CREATE POLICY post_comments_insert ON post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY post_comments_update ON post_comments FOR UPDATE USING (auth.uid() = user_id);

-- Personal data policies
CREATE POLICY subscriptions_select ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY coin_transactions_select ON coin_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY event_tickets_select ON event_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY store_purchases_select ON store_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY notifications_select ON notifications FOR SELECT USING (auth.uid() = user_id);

-- Public content policies
CREATE POLICY content_select ON content FOR SELECT USING (is_published = true);
CREATE POLICY events_select ON events FOR SELECT USING (is_published = true);
CREATE POLICY store_products_select ON store_products FOR SELECT USING (is_published = true);

-- Admin policies
CREATE POLICY admin_all_users ON users FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY admin_all_community_posts ON community_posts FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Insert initial data
INSERT INTO community_categories (name, slug, description, required_tier, color, icon, display_order) VALUES
('General Discussion', 'general', 'General discussion about Erigga', 'erigga_citizen', '#3B82F6', 'users', 1),
('Music Talk', 'music', 'Discuss Erigga''s music and tracks', 'erigga_citizen', '#10B981', 'music', 2),
('Lyrics Breakdown', 'lyrics', 'Analyze and discuss song lyrics', 'erigga_citizen', '#F59E0B', 'file-text', 3),
('Fan Art & Creativity', 'fan-art', 'Share your creative works', 'erigga_citizen', '#EF4444', 'palette', 4),
('Erigga Indigen Lounge', 'indigen-lounge', 'Exclusive discussion for Pro members', 'erigga_indigen', '#8B5CF6', 'star', 5),
('Enterprise Circle', 'enterprise-circle', 'VIP discussion for Enterprise members', 'enterprise', '#F59E0B', 'crown', 6)
ON CONFLICT (slug) DO NOTHING;

-- Fixed jsonb insertion with proper JSON format
INSERT INTO audit_logs (action, table_name, new_values, created_at)
VALUES (
  'SCHEMA_MIGRATION',
  'database',
  '{"version": "005_fixed_schema_no_conflicts", "description": "Complete database schema with Erigga Citizen tier system and unified Supabase auth - fixed type conflicts"}'::jsonb,
  NOW()
);
