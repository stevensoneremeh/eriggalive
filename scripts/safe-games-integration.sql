-- Safe Games Integration Script
-- This script adds game functionality without affecting existing schema

-- Only add new tables for games functionality
-- DO NOT modify existing user_tier enum or users table

-- Create games-specific tables only if they don't exist
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    game_type VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    max_players INTEGER DEFAULT 2,
    min_players INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create game sessions for multiplayer functionality
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    session_code VARCHAR(10) UNIQUE NOT NULL,
    host_user_id UUID NOT NULL,
    current_player_id UUID,
    game_state JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed', 'abandoned')),
    max_players INTEGER DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create game session players
CREATE TABLE IF NOT EXISTS game_session_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    player_symbol VARCHAR(5),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_ready BOOLEAN DEFAULT false,
    UNIQUE(session_id, user_id)
);

-- Create game results for tracking wins/losses
CREATE TABLE IF NOT EXISTS game_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    winner_user_id UUID,
    game_data JSONB DEFAULT '{}',
    coins_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default games
INSERT INTO games (name, slug, description, game_type, max_players, min_players) VALUES
('Erigga X and O', 'erigga-x-and-o', 'Classic tic-tac-toe game with Erigga twist', 'strategy', 2, 2),
('Erigga Coin Collector', 'erigga-coin-collector', 'Collect coins and avoid obstacles', 'arcade', 1, 1)
ON CONFLICT (slug) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_sessions_host ON game_sessions(host_user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_game_session_players_user ON game_session_players(user_id);
CREATE INDEX IF NOT EXISTS idx_game_results_winner ON game_results(winner_user_id);

-- Enable RLS on new tables
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_session_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view active games" ON games FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can view game sessions" ON game_sessions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can create game sessions" ON game_sessions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Session host can update session" ON game_sessions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = game_sessions.host_user_id)
);

CREATE POLICY "Session players can view their sessions" ON game_session_players FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = game_session_players.user_id)
);
CREATE POLICY "Users can join game sessions" ON game_session_players FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.auth_user_id = auth.uid() AND users.id = game_session_players.user_id)
);

CREATE POLICY "Users can view game results" ON game_results FOR SELECT USING (auth.role() = 'authenticated');

-- Create functions for game functionality
CREATE OR REPLACE FUNCTION generate_session_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        code := upper(substring(md5(random()::text) from 1 for 6));
        SELECT EXISTS(SELECT 1 FROM game_sessions WHERE session_code = code) INTO exists_check;
        IF NOT exists_check THEN
            EXIT;
        END IF;
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_game_session(
    p_game_slug TEXT,
    p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_game_id UUID;
    v_session_id UUID;
    v_session_code TEXT;
BEGIN
    -- Get game ID
    SELECT id INTO v_game_id FROM games WHERE slug = p_game_slug AND is_active = true;
    
    IF v_game_id IS NULL THEN
        RETURN json_build_object('error', 'Game not found');
    END IF;
    
    -- Generate session code
    v_session_code := generate_session_code();
    
    -- Create session
    INSERT INTO game_sessions (game_id, host_user_id, session_code)
    VALUES (v_game_id, p_user_id, v_session_code)
    RETURNING id INTO v_session_id;
    
    -- Add host as first player
    INSERT INTO game_session_players (session_id, user_id, player_symbol)
    VALUES (v_session_id, p_user_id, 'X');
    
    RETURN json_build_object(
        'success', true,
        'session_id', v_session_id,
        'session_code', v_session_code
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
