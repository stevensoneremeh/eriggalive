-- Create ludo_games table
CREATE TABLE IF NOT EXISTS public.ludo_games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_name TEXT NOT NULL,
    entry_fee INTEGER NOT NULL DEFAULT 10,
    prize_pool INTEGER NOT NULL DEFAULT 0,
    max_players INTEGER NOT NULL DEFAULT 4,
    current_players INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
    host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    game_state JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ludo_games_status ON public.ludo_games(status);
CREATE INDEX IF NOT EXISTS idx_ludo_games_host_id ON public.ludo_games(host_id);
CREATE INDEX IF NOT EXISTS idx_ludo_games_created_at ON public.ludo_games(created_at DESC);

-- Enable RLS
ALTER TABLE public.ludo_games ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all games" ON public.ludo_games
    FOR SELECT USING (true);

CREATE POLICY "Users can create games" ON public.ludo_games
    FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host can update their games" ON public.ludo_games
    FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Players can update games they're in" ON public.ludo_games
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND 
        game_state ? auth.uid()::text
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
    BEFORE UPDATE ON public.ludo_games 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.ludo_games;
