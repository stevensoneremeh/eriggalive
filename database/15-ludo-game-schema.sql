-- Create ludo_games table
CREATE TABLE IF NOT EXISTS public.ludo_games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    creator_username TEXT NOT NULL,
    players JSONB DEFAULT '[]'::jsonb,
    max_players INTEGER DEFAULT 4,
    current_player INTEGER DEFAULT 0,
    game_status TEXT DEFAULT 'waiting' CHECK (game_status IN ('waiting', 'active', 'finished')),
    winner TEXT,
    dice_value INTEGER DEFAULT 1,
    last_move TEXT DEFAULT '',
    entry_fee INTEGER DEFAULT 10,
    prize_pool INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.ludo_games ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view ludo games" ON public.ludo_games
    FOR SELECT USING (true);

CREATE POLICY "Users can create ludo games" ON public.ludo_games
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Players can update their games" ON public.ludo_games
    FOR UPDATE USING (
        auth.uid() = creator_id OR 
        auth.uid()::text = ANY(
            SELECT jsonb_array_elements(players)->>'id'
        )
    );

CREATE POLICY "Creators can delete their games" ON public.ludo_games
    FOR DELETE USING (auth.uid() = creator_id);

-- Create indexes
CREATE INDEX idx_ludo_games_creator_id ON public.ludo_games(creator_id);
CREATE INDEX idx_ludo_games_game_status ON public.ludo_games(game_status);
CREATE INDEX idx_ludo_games_created_at ON public.ludo_games(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ludo_games_updated_at BEFORE UPDATE
    ON public.ludo_games FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.ludo_games TO authenticated;
GRANT ALL ON public.ludo_games TO service_role;
