-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Custom types
CREATE TYPE user_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE user_tier AS ENUM ('grassroot', 'pioneer', 'elder', 'blood_brotherhood');
CREATE TYPE transaction_type AS ENUM ('purchase', 'withdrawal', 'spend', 'reward', 'refund');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE content_type AS ENUM ('music', 'video', 'exclusive', 'chronicle', 'merch', 'event');
CREATE TYPE post_type AS ENUM ('text', 'image', 'video', 'audio', 'link');
CREATE TYPE vote_type AS ENUM ('upvote', 'downvote', 'coin_vote');

-- Core tables
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  tier user_tier NOT NULL DEFAULT 'grassroot',
  role user_role NOT NULL DEFAULT 'user',
  coins INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  phone TEXT,
  location TEXT,
  social_links JSONB,
  preferences JSONB DEFAULT '{}',
  last_active TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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

-- Content tables
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  required_tier user_tier DEFAULT 'grassroot',
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  content_type content_type NOT NULL,
  category_id UUID REFERENCES categories(id),
  required_tier user_tier NOT NULL DEFAULT 'grassroot',
  coin_price INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  thumbnail_url TEXT,
  content_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS albums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  release_date DATE,
  cover_url TEXT,
  required_tier user_tier NOT NULL DEFAULT 'grassroot',
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
  track_number INTEGER,
  duration INTEGER, -- in seconds
  audio_url TEXT NOT NULL,
  required_tier user_tier NOT NULL DEFAULT 'grassroot',
  coin_price INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  lyrics TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chronicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  series_id UUID,
  episode_number INTEGER,
  duration INTEGER, -- in seconds
  thumbnail_url TEXT,
  video_url TEXT,
  required_tier user_tier NOT NULL DEFAULT 'grassroot',
  coin_price INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chronicle_series (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  required_tier user_tier NOT NULL DEFAULT 'grassroot',
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  transaction_id UUID,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commerce tables
CREATE TABLE IF NOT EXISTS coin_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  coin_price INTEGER,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  images JSONB DEFAULT '[]',
  required_tier user_tier DEFAULT 'grassroot',
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  payment_method TEXT,
  payment_id TEXT,
  shipping_address JSONB,
  shipping_method TEXT,
  tracking_number TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  paid_with_coins BOOLEAN DEFAULT FALSE,
  coins_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  venue TEXT,
  image_url TEXT,
  max_tickets INTEGER,
  tickets_sold INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  coin_price INTEGER,
  quantity INTEGER NOT NULL,
  sold INTEGER DEFAULT 0,
  required_tier user_tier DEFAULT 'grassroot',
  sale_start_date TIMESTAMP WITH TIME ZONE,
  sale_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_type_id UUID NOT NULL REFERENCES ticket_types(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID,
  ticket_code TEXT UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  paid_with_coins BOOLEAN DEFAULT FALSE,
  coins_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social tables
CREATE TABLE IF NOT EXISTS community_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  required_tier user_tier DEFAULT 'grassroot',
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES community_categories(id),
  title TEXT,
  content TEXT NOT NULL,
  post_type post_type NOT NULL DEFAULT 'text',
  media_urls JSONB DEFAULT '[]',
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  coin_votes INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls JSONB DEFAULT '[]',
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  coin_votes INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  vote_type vote_type NOT NULL,
  coin_amount INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT one_target_only CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(tier);

CREATE INDEX IF NOT EXISTS idx_content_type ON content(content_type);
CREATE INDEX IF NOT EXISTS idx_content_required_tier ON content(required_tier);
CREATE INDEX IF NOT EXISTS idx_content_category ON content(category_id);
CREATE INDEX IF NOT EXISTS idx_content_featured ON content(is_featured) WHERE is_featured = TRUE;

CREATE INDEX IF NOT EXISTS idx_tracks_album ON tracks(album_id);
CREATE INDEX IF NOT EXISTS idx_tracks_required_tier ON tracks(required_tier);

CREATE INDEX IF NOT EXISTS idx_chronicles_series ON chronicles(series_id);
CREATE INDEX IF NOT EXISTS idx_chronicles_required_tier ON chronicles(required_tier);

CREATE INDEX IF NOT EXISTS idx_content_access_user ON content_access(user_id);
CREATE INDEX IF NOT EXISTS idx_content_access_content ON content_access(content_id, content_type);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_type ON coin_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created ON coin_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(is_featured) WHERE is_featured = TRUE;

CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_pinned ON posts(is_pinned) WHERE is_pinned = TRUE;

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_post ON votes(post_id);
CREATE INDEX IF NOT EXISTS idx_votes_comment ON votes(comment_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read) WHERE is_read = FALSE;

-- Create functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT table_name 
    FROM information_schema.columns 
    WHERE column_name = 'updated_at' 
    AND table_schema = 'public'
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON %I;
      CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
    ', t, t);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update vote counts
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.post_id IS NOT NULL THEN
      IF NEW.vote_type = 'upvote' THEN
        UPDATE posts SET upvotes = upvotes + 1 WHERE id = NEW.post_id;
      ELSIF NEW.vote_type = 'downvote' THEN
        UPDATE posts SET downvotes = downvotes + 1 WHERE id = NEW.post_id;
      ELSIF NEW.vote_type = 'coin_vote' THEN
        UPDATE posts SET coin_votes = coin_votes + NEW.coin_amount WHERE id = NEW.post_id;
      END IF;
    ELSIF NEW.comment_id IS NOT NULL THEN
      IF NEW.vote_type = 'upvote' THEN
        UPDATE comments SET upvotes = upvotes + 1 WHERE id = NEW.comment_id;
      ELSIF NEW.vote_type = 'downvote' THEN
        UPDATE comments SET downvotes = downvotes + 1 WHERE id = NEW.comment_id;
      ELSIF NEW.vote_type = 'coin_vote' THEN
        UPDATE comments SET coin_votes = coin_votes + NEW.coin_amount WHERE id = NEW.comment_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.post_id IS NOT NULL THEN
      IF OLD.vote_type = 'upvote' THEN
        UPDATE posts SET upvotes = upvotes - 1 WHERE id = OLD.post_id;
      ELSIF OLD.vote_type = 'downvote' THEN
        UPDATE posts SET downvotes = downvotes - 1 WHERE id = OLD.post_id;
      ELSIF OLD.vote_type = 'coin_vote' THEN
        UPDATE posts SET coin_votes = coin_votes - OLD.coin_amount WHERE id = OLD.post_id;
      END IF;
    ELSIF OLD.comment_id IS NOT NULL THEN
      IF OLD.vote_type = 'upvote' THEN
        UPDATE comments SET upvotes = upvotes - 1 WHERE id = OLD.comment_id;
      ELSIF OLD.vote_type = 'downvote' THEN
        UPDATE comments SET downvotes = downvotes - 1 WHERE id = OLD.comment_id;
      ELSIF OLD.vote_type = 'coin_vote' THEN
        UPDATE comments SET coin_votes = coin_votes - OLD.coin_amount WHERE id = OLD.comment_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply vote count trigger
CREATE TRIGGER update_post_vote_counts
AFTER INSERT OR DELETE ON votes
FOR EACH ROW
EXECUTE FUNCTION update_vote_counts();

-- Function to update user level based on points
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple level calculation: level = 1 + floor(points / 1000)
  -- Adjust the formula as needed
  NEW.level = 1 + FLOOR(NEW.points / 1000);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply level update trigger
CREATE TRIGGER update_level_on_points_change
BEFORE UPDATE OF points ON profiles
FOR EACH ROW
WHEN (NEW.points <> OLD.points)
EXECUTE FUNCTION update_user_level();

-- Row Level Security Policies
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicle_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for each table
-- Profiles: Users can read all profiles but only update their own
CREATE POLICY profiles_select ON profiles FOR SELECT USING (true);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id);

-- Content: Users can read content based on their tier
CREATE POLICY content_select ON content FOR SELECT USING (
  is_published = true AND (
    required_tier = 'grassroot' OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND (
        CASE 
          WHEN required_tier = 'blood_brotherhood' THEN tier = 'blood_brotherhood'
          WHEN required_tier = 'elder' THEN tier IN ('elder', 'blood_brotherhood')
          WHEN required_tier = 'pioneer' THEN tier IN ('pioneer', 'elder', 'blood_brotherhood')
          ELSE true
        END
      )
    ) OR
    EXISTS (
      SELECT 1 FROM content_access 
      WHERE user_id = auth.uid() AND content_id = content.id
    )
  )
);

-- Posts: Users can read posts in categories they have access to
CREATE POLICY posts_select ON posts FOR SELECT USING (
  NOT is_hidden AND (
    EXISTS (
      SELECT 1 FROM community_categories c
      JOIN profiles p ON auth.uid() = p.id
      WHERE posts.category_id = c.id AND (
        c.required_tier = 'grassroot' OR
        CASE 
          WHEN c.required_tier = 'blood_brotherhood' THEN p.tier = 'blood_brotherhood'
          WHEN c.required_tier = 'elder' THEN p.tier IN ('elder', 'blood_brotherhood')
          WHEN c.required_tier = 'pioneer' THEN p.tier IN ('pioneer', 'elder', 'blood_brotherhood')
          ELSE true
        END
      )
    )
  )
);

-- Posts: Users can create posts in categories they have access to
CREATE POLICY posts_insert ON posts FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM community_categories c
    JOIN profiles p ON auth.uid() = p.id
    WHERE posts.category_id = c.id AND (
      c.required_tier = 'grassroot' OR
      CASE 
        WHEN c.required_tier = 'blood_brotherhood' THEN p.tier = 'blood_brotherhood'
        WHEN c.required_tier = 'elder' THEN p.tier IN ('elder', 'blood_brotherhood')
        WHEN c.required_tier = 'pioneer' THEN p.tier IN ('pioneer', 'elder', 'blood_brotherhood')
        ELSE true
      END
    )
  )
);

-- Posts: Users can update their own posts
CREATE POLICY posts_update ON posts FOR UPDATE USING (
  auth.uid() = user_id AND NOT is_locked
);

-- Comments: Users can read comments on posts they can see
CREATE POLICY comments_select ON comments FOR SELECT USING (
  NOT is_hidden AND EXISTS (
    SELECT 1 FROM posts 
    WHERE id = comments.post_id AND NOT is_hidden
  )
);

-- Comments: Users can create comments on posts they can see and that aren't locked
CREATE POLICY comments_insert ON comments FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM posts 
    WHERE id = comments.post_id AND NOT is_hidden AND NOT is_locked
  )
);

-- Comments: Users can update their own comments
CREATE POLICY comments_update ON comments FOR UPDATE USING (
  auth.uid() = user_id
);

-- Votes: Users can see all votes
CREATE POLICY votes_select ON votes FOR SELECT USING (true);

-- Votes: Users can create votes on content they can see
CREATE POLICY votes_insert ON votes FOR INSERT WITH CHECK (
  (post_id IS NULL OR EXISTS (
    SELECT 1 FROM posts WHERE id = votes.post_id AND NOT is_hidden
  )) AND
  (comment_id IS NULL OR EXISTS (
    SELECT 1 FROM comments WHERE id = votes.comment_id AND NOT is_hidden
  ))
);

-- Notifications: Users can only see their own notifications
CREATE POLICY notifications_select ON notifications FOR SELECT USING (
  auth.uid() = user_id
);

-- Orders: Users can only see their own orders
CREATE POLICY orders_select ON orders FOR SELECT USING (
  auth.uid() = user_id
);

-- Tickets: Users can only see their own tickets
CREATE POLICY tickets_select ON tickets FOR SELECT USING (
  auth.uid() = user_id
);

-- Coin transactions: Users can only see their own transactions
CREATE POLICY coin_transactions_select ON coin_transactions FOR SELECT USING (
  auth.uid() = user_id
);

-- Admin policies: Admins can do everything
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('
      CREATE POLICY admin_all ON %I FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND role = ''admin''
        )
      );
    ', t);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Moderator policies: Moderators have special permissions
CREATE POLICY moderator_posts ON posts FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'moderator'
  )
);

CREATE POLICY moderator_comments ON comments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'moderator'
  )
);

-- Create initial admin user
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin@eriggalive.com',
  crypt('admin_password_123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"username": "admin"}'
);

INSERT INTO profiles (id, username, email, tier, role, coins, points, level)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin',
  'admin@eriggalive.com',
  'blood_brotherhood',
  'admin',
  10000,
  10000,
  11
);

-- Create initial categories
INSERT INTO categories (name, slug, description, required_tier)
VALUES 
  ('Singles', 'singles', 'Erigga''s single releases', 'grassroot'),
  ('Albums', 'albums', 'Full album releases', 'grassroot'),
  ('Music Videos', 'music-videos', 'Official music videos', 'grassroot'),
  ('Exclusives', 'exclusives', 'Exclusive content for premium members', 'pioneer'),
  ('Behind the Scenes', 'behind-the-scenes', 'Behind the scenes footage', 'elder'),
  ('Studio Sessions', 'studio-sessions', 'Recording studio sessions', 'blood_brotherhood');

INSERT INTO community_categories (name, slug, description, required_tier)
VALUES 
  ('General Discussion', 'general', 'General discussion about Erigga', 'grassroot'),
  ('Music Talk', 'music', 'Discuss Erigga''s music', 'grassroot'),
  ('Lyrics Breakdown', 'lyrics', 'Analyze and discuss lyrics', 'grassroot'),
  ('Pioneer Lounge', 'pioneer-lounge', 'Exclusive discussion for Pioneer tier and above', 'pioneer'),
  ('Elder Council', 'elder-council', 'Exclusive discussion for Elder tier and above', 'elder'),
  ('Blood Brotherhood', 'blood-brotherhood', 'Exclusive discussion for Blood Brotherhood members', 'blood_brotherhood');

-- Create chronicle series
INSERT INTO chronicle_series (title, description, required_tier)
VALUES 
  ('The Paper Boi Story', 'The origin story of Erigga', 'grassroot'),
  ('Street Wisdom', 'Life lessons from the streets', 'pioneer'),
  ('Studio Diaries', 'Behind the scenes of album creation', 'elder');
