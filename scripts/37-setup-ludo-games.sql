-- Create ludo_games table
CREATE TABLE IF NOT EXISTS ludo_games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_name TEXT NOT NULL,
    entry_fee INTEGER NOT NULL DEFAULT 10,
    prize_pool INTEGER NOT NULL DEFAULT 0,
    max_players INTEGER NOT NULL DEFAULT 4,
    current_players INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    players UUID[] DEFAULT '{}',
    winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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
CREATE POLICY "Users can view all games" ON ludo_games
    FOR SELECT USING (true);

CREATE POLICY "Users can create games" ON ludo_games
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Players can update their games" ON ludo_games
    FOR UPDATE USING (
        auth.uid() = created_by OR 
        auth.uid() = ANY(players)
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ludo_games_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_ludo_games_updated_at ON ludo_games;
CREATE TRIGGER update_ludo_games_updated_at
    BEFORE UPDATE ON ludo_games
    FOR EACH ROW
    EXECUTE FUNCTION update_ludo_games_updated_at();

-- Enable realtime for ludo_games
ALTER PUBLICATION supabase_realtime ADD TABLE ludo_games;
