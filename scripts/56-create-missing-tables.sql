
-- Create missing tables to fix 404 errors

-- event_tickets table
CREATE TABLE IF NOT EXISTS event_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  event_id bigint REFERENCES events(id) ON DELETE CASCADE,
  ticket_number text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- user_follows table
CREATE TABLE IF NOT EXISTS user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES users(id) ON DELETE CASCADE,
  following_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- store_purchases table
CREATE TABLE IF NOT EXISTS store_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  product_id bigint,
  amount integer NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- vault_views table
CREATE TABLE IF NOT EXISTS vault_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  content_id bigint,
  viewed_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_tickets
CREATE POLICY "Users can view their own tickets"
  ON event_tickets FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for user_follows
CREATE POLICY "Users can view follows"
  ON user_follows FOR SELECT
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can manage their follows"
  ON user_follows FOR ALL
  USING (auth.uid() = follower_id);

-- RLS Policies for store_purchases
CREATE POLICY "Users can view their purchases"
  ON store_purchases FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for vault_views
CREATE POLICY "Users can view their vault history"
  ON vault_views FOR SELECT
  USING (auth.uid() = user_id);
