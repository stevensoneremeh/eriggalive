-- Erigga Radio Database Schema
-- This file contains all necessary tables, relationships, and indexes for the radio functionality

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table (if not exists)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mood categories table
CREATE TABLE mood_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  color_gradient TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Radio tracks table
CREATE TABLE radio_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  artwork_url TEXT,
  audio_url TEXT,
  duration_ms INTEGER,
  mood_category TEXT REFERENCES mood_categories(id),
  source TEXT DEFAULT 'custom' CHECK (source IN ('spotify', 'apple', 'audiomack', 'boomplay', 'youtube', 'custom')),
  external_id TEXT,
  is_active BOOLEAN DEFAULT true,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User pinned tracks (persistent playlist)
CREATE TABLE user_pinned_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID REFERENCES radio_tracks(id) ON DELETE CASCADE,
  pinned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, track_id)
);

-- Live broadcasts table
CREATE TABLE live_broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  is_live BOOLEAN DEFAULT false,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  stream_url TEXT,
  chat_room_id TEXT,
  max_listeners INTEGER DEFAULT 0,
  current_listeners INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community shout-outs / fan messages
CREATE TABLE community_shoutouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  message TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Radio listening sessions (for analytics)
CREATE TABLE radio_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  mood_category TEXT REFERENCES mood_categories(id),
  track_id UUID REFERENCES radio_tracks(id) ON DELETE SET NULL,
  duration_listened INTEGER, -- in seconds
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  user_agent TEXT,
  ip_address INET
);

-- Daily quotes table
CREATE TABLE daily_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_text TEXT NOT NULL,
  author TEXT DEFAULT 'Erigga',
  is_active BOOLEAN DEFAULT true,
  display_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Radio settings (global configuration)
CREATE TABLE radio_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_radio_tracks_mood ON radio_tracks(mood_category);
CREATE INDEX idx_radio_tracks_active ON radio_tracks(is_active);
CREATE INDEX idx_user_pinned_tracks_user ON user_pinned_tracks(user_id);
CREATE INDEX idx_community_shoutouts_created ON community_shoutouts(created_at DESC);
CREATE INDEX idx_radio_sessions_user ON radio_sessions(user_id);
CREATE INDEX idx_radio_sessions_track ON radio_sessions(track_id);
CREATE INDEX idx_live_broadcasts_live ON live_broadcasts(is_live);

-- Row Level Security (RLS) Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pinned_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_shoutouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their pinned tracks" ON user_pinned_tracks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can create shout-outs" ON community_shoutouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can view approved shout-outs" ON community_shoutouts
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can view their own sessions" ON radio_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" ON radio_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public read access for reference tables
CREATE POLICY "Everyone can view mood categories" ON mood_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Everyone can view active tracks" ON radio_tracks
  FOR SELECT USING (is_active = true);

CREATE POLICY "Everyone can view live broadcasts" ON live_broadcasts
  FOR SELECT USING (true);

CREATE POLICY "Everyone can view daily quotes" ON daily_quotes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Everyone can view radio settings" ON radio_settings
  FOR SELECT USING (true);

-- Seed data for mood categories
INSERT INTO mood_categories (id, name, emoji, color_gradient, description, icon_name, sort_order) VALUES
('turn-up', 'Turn Up', '🔥', 'from-red-500 to-orange-500', 'Hype / Party vibes', 'Zap', 1),
('reflective', 'Reflective', '🧠', 'from-purple-500 to-indigo-500', 'Street Wisdom', 'Brain', 2),
('love-emotions', 'Love & Emotions', '❤️', 'from-pink-500 to-rose-500', 'Heartfelt vibes', 'Heart', 3),
('motivation', 'Motivation & Hustle', '💪', 'from-green-500 to-emerald-500', 'Grind time', 'Dumbbell', 4),
('freestyle', 'Freestyle / Mixed', '🎭', 'from-yellow-500 to-amber-500', 'Mixed Vibes', 'Mic', 5);

-- Seed data for daily quotes
INSERT INTO daily_quotes (quote_text, author, is_active) VALUES
('Success na journey, no be destination', 'Erigga', true),
('Make you hustle hard, but make you smart pass', 'Paper Boi', true),
('Street wisdom dey teach wetin school no fit teach', 'Erigga', true),
('Your grind today na your glory tomorrow', 'Paper Boi', true),
('Stay focused, stay hungry, stay humble', 'Erigga', true),
('Na small small dey build castle', 'Erigga', true),
('Every struggle get meaning, every pain get purpose', 'Paper Boi', true);

-- Seed data for sample tracks
INSERT INTO radio_tracks (title, artist, artwork_url, mood_category, duration_ms) VALUES
('Paper Boi', 'Erigga', '/placeholder.svg?height=300&width=300', 'turn-up', 240000),
('Street Motivation', 'Erigga ft. Victor AD', '/placeholder.svg?height=300&width=300', 'motivation', 210000),
('Love Me', 'Erigga ft. Yemi Alade', '/placeholder.svg?height=300&width=300', 'love-emotions', 195000),
('Warri Anthem', 'Erigga', '/placeholder.svg?height=300&width=300', 'turn-up', 225000),
('Life Philosophy', 'Erigga', '/placeholder.svg?height=300&width=300', 'reflective', 280000),
('Hustle Hard', 'Erigga ft. Graham D', '/placeholder.svg?height=300&width=300', 'motivation', 205000),
('Freestyle Session', 'Erigga', '/placeholder.svg?height=300&width=300', 'freestyle', 320000),
('Street Wisdom', 'Erigga', '/placeholder.svg?height=300&width=300', 'reflective', 245000);

-- Initial radio settings
INSERT INTO radio_settings (setting_key, setting_value, description) VALUES
('default_volume', '70', 'Default volume level for new users'),
('auto_play', 'true', 'Auto-play tracks when mood is selected'),
('shuffle_enabled', 'false', 'Enable shuffle by default'),
('crossfade_duration', '3000', 'Crossfade duration in milliseconds'),
('max_pinned_tracks', '50', 'Maximum number of tracks a user can pin');

-- Functions for common operations
CREATE OR REPLACE FUNCTION increment_play_count(track_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE radio_tracks 
  SET play_count = play_count + 1, updated_at = NOW()
  WHERE id = track_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_mood_playlist(mood_id TEXT, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  title TEXT,
  artist TEXT,
  artwork_url TEXT,
  duration_ms INTEGER,
  play_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT rt.id, rt.title, rt.artist, rt.artwork_url, rt.duration_ms, rt.play_count
  FROM radio_tracks rt
  WHERE rt.mood_category = mood_id AND rt.is_active = true
  ORDER BY rt.play_count DESC, rt.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_radio_tracks_updated_at
  BEFORE UPDATE ON radio_tracks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_live_broadcasts_updated_at
  BEFORE UPDATE ON live_broadcasts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
