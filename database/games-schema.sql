-- Games and Game Rooms Tables
CREATE TABLE IF NOT EXISTS game_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    game_type VARCHAR(50) NOT NULL DEFAULT 'ludo',
    host_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    max_players INTEGER NOT NULL DEFAULT 4,
    current_players INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game Sessions Table
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
    game_state JSONB NOT NULL DEFAULT '{}',
    current_player_index INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE,
    winner_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game Players Table (tracks who's in which game)
CREATE TABLE IF NOT EXISTS game_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    player_color VARCHAR(20),
    player_position INTEGER,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(room_id, user_id)
);

-- Game Statistics Table
CREATE TABLE IF NOT EXISTS game_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    game_type VARCHAR(50) NOT NULL,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    total_play_time INTEGER DEFAULT 0, -- in seconds
    coins_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, game_type)
);

-- Game Moves Table (for replay and analysis)
CREATE TABLE IF NOT EXISTS game_moves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    move_number INTEGER NOT NULL,
    move_data JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_rooms_status ON game_rooms(status);
CREATE INDEX IF NOT EXISTS idx_game_rooms_game_type ON game_rooms(game_type);
CREATE INDEX IF NOT EXISTS idx_game_rooms_host ON game_rooms(host_user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_room ON game_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_game_players_room ON game_players(room_id);
CREATE INDEX IF NOT EXISTS idx_game_players_user ON game_players(user_id);
CREATE INDEX IF NOT EXISTS idx_game_statistics_user ON game_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_game_moves_session ON game_moves(session_id);

-- RLS Policies
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_moves ENABLE ROW LEVEL SECURITY;

-- Game rooms policies
CREATE POLICY "Users can view all game rooms" ON game_rooms FOR SELECT USING (true);
CREATE POLICY "Users can create game rooms" ON game_rooms FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = host_user_id));
CREATE POLICY "Host can update their game rooms" ON game_rooms FOR UPDATE USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = host_user_id));
CREATE POLICY "Host can delete their game rooms" ON game_rooms FOR DELETE USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = host_user_id));

-- Game sessions policies
CREATE POLICY "Players can view their game sessions" ON game_sessions FOR SELECT USING (
    EXISTS (SELECT 1 FROM game_players WHERE room_id = game_sessions.room_id AND user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()::text))
);
CREATE POLICY "Players can update their game sessions" ON game_sessions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM game_players WHERE room_id = game_sessions.room_id AND user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()::text))
);

-- Game players policies
CREATE POLICY "Users can view game players" ON game_players FOR SELECT USING (true);
CREATE POLICY "Users can join games" ON game_players FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));
CREATE POLICY "Users can leave games" ON game_players FOR UPDATE USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Game statistics policies
CREATE POLICY "Users can view their own statistics" ON game_statistics FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));
CREATE POLICY "Users can update their own statistics" ON game_statistics FOR UPDATE USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));
CREATE POLICY "System can insert statistics" ON game_statistics FOR INSERT WITH CHECK (true);

-- Game moves policies
CREATE POLICY "Players can view moves in their games" ON game_moves FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM game_players gp 
        JOIN game_sessions gs ON gp.room_id = gs.room_id 
        WHERE gs.id = game_moves.session_id 
        AND gp.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()::text)
    )
);
CREATE POLICY "Players can insert their moves" ON game_moves FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Functions for game management
CREATE OR REPLACE FUNCTION update_game_room_players()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE game_rooms 
        SET current_players = current_players + 1,
            updated_at = NOW()
        WHERE id = NEW.room_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' AND OLD.left_at IS NULL AND NEW.left_at IS NOT NULL THEN
        UPDATE game_rooms 
        SET current_players = current_players - 1,
            updated_at = NOW()
        WHERE id = NEW.room_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update player count
DROP TRIGGER IF EXISTS trigger_update_game_room_players ON game_players;
CREATE TRIGGER trigger_update_game_room_players
    AFTER INSERT OR UPDATE ON game_players
    FOR EACH ROW
    EXECUTE FUNCTION update_game_room_players();

-- Function to update game statistics
CREATE OR REPLACE FUNCTION update_game_statistics(
    p_user_id INTEGER,
    p_game_type VARCHAR(50),
    p_won BOOLEAN DEFAULT FALSE,
    p_play_time INTEGER DEFAULT 0,
    p_coins_earned INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO game_statistics (user_id, game_type, games_played, games_won, total_play_time, coins_earned)
    VALUES (p_user_id, p_game_type, 1, CASE WHEN p_won THEN 1 ELSE 0 END, p_play_time, p_coins_earned)
    ON CONFLICT (user_id, game_type)
    DO UPDATE SET
        games_played = game_statistics.games_played + 1,
        games_won = game_statistics.games_won + CASE WHEN p_won THEN 1 ELSE 0 END,
        total_play_time = game_statistics.total_play_time + p_play_time,
        coins_earned = game_statistics.coins_earned + p_coins_earned,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
