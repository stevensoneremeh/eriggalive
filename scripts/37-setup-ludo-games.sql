-- Create ludo_games table
CREATE TABLE IF NOT EXISTS ludo_games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    entry_fee INTEGER NOT NULL DEFAULT 10,
    max_players INTEGER NOT NULL DEFAULT 4,
    current_players INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    players UUID[] DEFAULT '{}',
    prize_pool INTEGER DEFAULT 0,
    winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    game_state JSONB DEFAULT '{}',
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

CREATE POLICY "Users can update games they created or joined" ON ludo_games
    FOR UPDATE USING (
        auth.uid() = created_by OR 
        auth.uid() = ANY(players)
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_ludo_games_updated_at 
    BEFORE UPDATE ON ludo_games 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON ludo_games TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
