-- Radio Database Schema Setup
-- Creates tables for radio functionality without affecting existing tables

-- Radio settings and configuration
CREATE TABLE IF NOT EXISTS radio_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  is_live BOOLEAN DEFAULT FALSE,
  live_title TEXT,
  live_stream_url TEXT, -- HLS stream URL
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Currently playing track information
CREATE TABLE IF NOT EXISTS radio_now_playing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('spotify', 'apple', 'audiomack', 'boomplay', 'youtube', 'custom')),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  artwork_url TEXT,
  external_id TEXT, -- Platform-specific track ID
  duration_ms INTEGER,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_live BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Radio queue for auto mode
CREATE TABLE IF NOT EXISTS radio_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  position INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('spotify', 'apple', 'audiomack', 'boomplay', 'youtube', 'custom')),
  external_id TEXT NOT NULL, -- Platform-specific track ID
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  duration_ms INTEGER,
  artwork_url TEXT,
  added_by UUID REFERENCES auth.users(id),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  played_at TIMESTAMP WITH TIME ZONE,
  is_played BOOLEAN DEFAULT FALSE
);

-- Radio playback history
CREATE TABLE IF NOT EXISTS radio_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('spotify', 'apple', 'audiomack', 'boomplay', 'youtube', 'custom')),
  external_id TEXT,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  artwork_url TEXT,
  duration_ms INTEGER,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  listener_count INTEGER DEFAULT 0,
  is_live BOOLEAN DEFAULT FALSE
);

-- Live broadcast sessions
CREATE TABLE IF NOT EXISTS radio_broadcasts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
  playback_url TEXT, -- HLS stream URL
  stream_key TEXT, -- RTMP stream key (write-only)
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  max_listeners INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_radio_queue_position ON radio_queue(position) WHERE is_played = FALSE;
CREATE INDEX IF NOT EXISTS idx_radio_history_started_at ON radio_history(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_radio_broadcasts_status ON radio_broadcasts(status);
CREATE INDEX IF NOT EXISTS idx_radio_broadcasts_created_by ON radio_broadcasts(created_by);

-- RLS Policies
ALTER TABLE radio_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_now_playing ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_broadcasts ENABLE ROW LEVEL SECURITY;

-- Radio settings - only admins can modify, everyone can read
CREATE POLICY "radio_settings_read" ON radio_settings FOR SELECT USING (true);
CREATE POLICY "radio_settings_admin_write" ON radio_settings FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.auth_user_id = auth.uid() 
    AND users.tier IN ('blood_brotherhood', 'elder')
  )
);

-- Now playing - everyone can read, system can write
CREATE POLICY "radio_now_playing_read" ON radio_now_playing FOR SELECT USING (true);
CREATE POLICY "radio_now_playing_system_write" ON radio_now_playing FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.auth_user_id = auth.uid() 
    AND users.tier IN ('blood_brotherhood', 'elder')
  )
);

-- Queue - authenticated users can read and add, admins can manage
CREATE POLICY "radio_queue_read" ON radio_queue FOR SELECT USING (true);
CREATE POLICY "radio_queue_user_add" ON radio_queue FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "radio_queue_admin_manage" ON radio_queue FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.auth_user_id = auth.uid() 
    AND users.tier IN ('blood_brotherhood', 'elder')
  )
);

-- History - everyone can read
CREATE POLICY "radio_history_read" ON radio_history FOR SELECT USING (true);
CREATE POLICY "radio_history_system_write" ON radio_history FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.auth_user_id = auth.uid() 
    AND users.tier IN ('blood_brotherhood', 'elder')
  )
);

-- Broadcasts - everyone can read, admins can manage
CREATE POLICY "radio_broadcasts_read" ON radio_broadcasts FOR SELECT USING (true);
CREATE POLICY "radio_broadcasts_admin_manage" ON radio_broadcasts FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.auth_user_id = auth.uid() 
    AND users.tier IN ('blood_brotherhood', 'elder')
  )
);

-- Insert default radio settings
INSERT INTO radio_settings (is_live, live_title) 
VALUES (FALSE, 'Erigga Radio - 24/7 Music')
ON CONFLICT DO NOTHING;

-- Insert some default queue items (Erigga's popular tracks)
INSERT INTO radio_queue (position, source, external_id, title, artist, duration_ms, artwork_url) VALUES
(1, 'youtube', 'dQw4w9WgXcQ', 'The Erigma', 'Erigga', 240000, '/placeholder.svg?height=300&width=300'),
(2, 'youtube', 'dQw4w9WgXcQ', 'Area Father', 'Erigga', 210000, '/placeholder.svg?height=300&width=300'),
(3, 'youtube', 'dQw4w9WgXcQ', 'Motivation', 'Erigga', 195000, '/placeholder.svg?height=300&width=300'),
(4, 'youtube', 'dQw4w9WgXcQ', 'Welcome to Warri', 'Erigga', 225000, '/placeholder.svg?height=300&width=300'),
(5, 'youtube', 'dQw4w9WgXcQ', 'Next Track', 'Erigga', 200000, '/placeholder.svg?height=300&width=300')
ON CONFLICT DO NOTHING;
