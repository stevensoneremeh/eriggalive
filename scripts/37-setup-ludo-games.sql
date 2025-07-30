-- Create ludo_games table
CREATE TABLE IF NOT EXISTS ludo_games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_name TEXT NOT NULL,
    entry_fee INTEGER NOT NULL DEFAULT 10,
    prize_pool INTEGER NOT NULL DEFAULT 10,
    max_players INTEGER NOT NULL DEFAULT 4,
    current_players INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    players UUID[] NOT NULL DEFAULT '{}',
    winner_id UUID REFERENCES auth.users(id),
    game_state JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ludo_games_status ON ludo_games(status);
CREATE INDEX IF NOT EXISTS idx_ludo_games_created_by ON ludo_games(created_by);
CREATE INDEX IF NOT EXISTS idx_ludo_games_created_at ON ludo_games(created_at);

-- Enable RLS
ALTER TABLE ludo_games ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all waiting games" ON ludo_games
    FOR SELECT USING (status = 'waiting');

CREATE POLICY "Users can view games they're part of" ON ludo_games
    FOR SELECT USING (auth.uid() = ANY(players));

CREATE POLICY "Users can create games" ON ludo_games
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Players can update games they're part of" ON ludo_games
    FOR UPDATE USING (auth.uid() = ANY(players));

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ludo_games_updated_at 
    BEFORE UPDATE ON ludo_games 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for live game updates
ALTER PUBLICATION supabase_realtime ADD TABLE ludo_games;
