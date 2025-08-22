-- Erigga Radio Database Schema
-- This file contains all necessary tables, relationships, and indexes for the radio functionality

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Mood Categories Table
CREATE TABLE mood_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  color_scheme JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tracks Table
CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255) NOT NULL,
  artwork_url TEXT,
  audio_url TEXT,
  duration_ms INTEGER,
  mood_category UUID REFERENCES mood_categories(id),
  source VARCHAR(50) DEFAULT 'custom', -- spotify, apple, audiomack, youtube, custom
  external_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Pinned Tracks (for persistent playlists)
CREATE TABLE user_pinned_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  pinned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, track_id)
);

-- Live Broadcasts Table
CREATE TABLE live_broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, live, ended
  scheduled_time TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  stream_url TEXT,
  max_listeners INTEGER DEFAULT 0,
  current_listeners INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Quotes Table
CREATE TABLE daily_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  author VARCHAR(100) DEFAULT 'Erigga',
  date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date)
);

-- Community Shout-outs Table
CREATE TABLE community_shoutouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Radio Sessions (for tracking user listening sessions)
CREATE TABLE radio_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mood_category UUID REFERENCES mood_categories(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  tracks_played JSONB DEFAULT '[]',
  total_duration_ms INTEGER DEFAULT 0
);

-- Playlist History (for "last played mood" feature)
CREATE TABLE user_playlist_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mood_category UUID REFERENCES mood_categories(id),
  track_id UUID REFERENCES tracks(id),
  played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id UUID REFERENCES radio_sessions(id)
);

-- Radio Analytics (for admin insights)
CREATE TABLE radio_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE DEFAULT CURRENT_DATE,
  total_listeners INTEGER DEFAULT 0,
  peak_listeners INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  avg_session_duration_ms INTEGER DEFAULT 0,
  top_mood_category UUID REFERENCES mood_categories(id),
  total_shoutouts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date)
);

-- Indexes for performance
CREATE INDEX idx_tracks_mood_category ON tracks(mood_category);
CREATE INDEX idx_tracks_is_active ON tracks(is_active);
CREATE INDEX idx_tracks_play_count ON tracks(play_count DESC);
CREATE INDEX idx_user_pinned_tracks_user_id ON user_pinned_tracks(user_id);
CREATE INDEX idx_live_broadcasts_status ON live_broadcasts(status);
CREATE INDEX idx_live_broadcasts_scheduled_time ON live_broadcasts(scheduled_time);
CREATE INDEX idx_community_shoutouts_created_at ON community_shoutouts(created_at DESC);
CREATE INDEX idx_radio_sessions_user_id ON radio_sessions(user_id);
CREATE INDEX idx_user_playlist_history_user_id ON user_playlist_history(user_id);
CREATE INDEX idx_user_playlist_history_played_at ON user_playlist_history(played_at DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE mood_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pinned_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_shoutouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_playlist_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_analytics ENABLE ROW LEVEL SECURITY;

-- Public read access for mood categories and tracks
CREATE POLICY "Public read access for mood_categories" ON mood_categories FOR SELECT USING (true);
CREATE POLICY "Public read access for tracks" ON tracks FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access for daily_quotes" ON daily_quotes FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access for live_broadcasts" ON live_broadcasts FOR SELECT USING (true);

-- User-specific policies
CREATE POLICY "Users can manage their pinned tracks" ON user_pinned_tracks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can create shoutouts" ON community_shoutouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public read access for approved shoutouts" ON community_shoutouts FOR SELECT USING (is_approved = true);
CREATE POLICY "Users can manage their sessions" ON radio_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their history" ON user_playlist_history FOR ALL USING (auth.uid() = user_id);

-- Admin policies (assuming admin role in user metadata)
CREATE POLICY "Admins can manage all content" ON tracks FOR ALL USING (
  (auth.jwt() ->> 'role') = 'admin' OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
CREATE POLICY "Admins can manage broadcasts" ON live_broadcasts FOR ALL USING (
  (auth.jwt() ->> 'role') = 'admin' OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
CREATE POLICY "Admins can manage quotes" ON daily_quotes FOR ALL USING (
  (auth.jwt() ->> 'role') = 'admin' OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
CREATE TRIGGER update_mood_categories_updated_at BEFORE UPDATE ON mood_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tracks_updated_at BEFORE UPDATE ON tracks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_live_broadcasts_updated_at BEFORE UPDATE ON live_broadcasts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment play count
CREATE OR REPLACE FUNCTION increment_play_count(track_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE tracks SET play_count = play_count + 1 WHERE id = track_uuid;
END;
$$ LANGUAGE plpgsql;

-- Seed Data for Mood Categories
INSERT INTO mood_categories (name, slug, description, color_scheme) VALUES
('Turn Up', 'turn-up', 'Hype / Party Vibes', '{"primary": "#ef4444", "secondary": "#f97316"}'),
('Reflective', 'reflective', 'Street Wisdom', '{"primary": "#8b5cf6", "secondary": "#3b82f6"}'),
('Love & Emotions', 'love-emotions', 'Heart & Soul', '{"primary": "#ec4899", "secondary": "#f43f5e"}'),
('Motivation & Hustle', 'motivation', 'Hustle & Grind', '{"primary": "#10b981", "secondary": "#059669"}'),
('Freestyle / Mixed Vibes', 'freestyle', 'Mixed Vibes', '{"primary": "#eab308", "secondary": "#f59e0b"}');

-- Sample Daily Quote
INSERT INTO daily_quotes (text, date) VALUES
('The streets taught me everything I know, but music gave me everything I have.', CURRENT_DATE);

-- Sample Tracks (you would populate this with actual track data)
INSERT INTO tracks (title, artist, mood_category, artwork_url, duration_ms) 
SELECT 
  'Sample Track ' || generate_series,
  'Erigga',
  (SELECT id FROM mood_categories ORDER BY RANDOM() LIMIT 1),
  '/placeholder.svg?height=300&width=300',
  180000 + (RANDOM() * 120000)::INTEGER
FROM generate_series(1, 20);

-- Create a view for popular tracks
CREATE VIEW popular_tracks AS
SELECT 
  t.*,
  mc.name as mood_name,
  mc.slug as mood_slug
FROM tracks t
JOIN mood_categories mc ON t.mood_category = mc.id
WHERE t.is_active = true
ORDER BY t.play_count DESC, t.created_at DESC;

-- Create a view for user listening stats
CREATE VIEW user_listening_stats AS
SELECT 
  rs.user_id,
  COUNT(rs.id) as total_sessions,
  SUM(rs.total_duration_ms) as total_listening_time_ms,
  AVG(rs.total_duration_ms) as avg_session_duration_ms,
  COUNT(DISTINCT rs.mood_category) as unique_moods_played,
  MAX(rs.started_at) as last_session
FROM radio_sessions rs
GROUP BY rs.user_id;

-- Realtime subscriptions setup (run these in Supabase dashboard)
-- NOTIFY for live broadcasts
CREATE OR REPLACE FUNCTION notify_broadcast_change()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('broadcast_change', row_to_json(NEW)::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER broadcast_change_trigger
  AFTER INSERT OR UPDATE ON live_broadcasts
  FOR EACH ROW EXECUTE FUNCTION notify_broadcast_change();

-- NOTIFY for new shoutouts
CREATE OR REPLACE FUNCTION notify_new_shoutout()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('new_shoutout', row_to_json(NEW)::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER new_shoutout_trigger
  AFTER INSERT ON community_shoutouts
  FOR EACH ROW EXECUTE FUNCTION notify_new_shoutout();
