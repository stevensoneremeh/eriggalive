-- Create ludo_games table
CREATE TABLE IF NOT EXISTS public.ludo_games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_name TEXT NOT NULL,
    entry_fee INTEGER NOT NULL DEFAULT 10,
    max_players INTEGER NOT NULL DEFAULT 4,
    players JSONB NOT NULL DEFAULT '{}',
    current_player UUID,
    dice_value INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
    winner UUID,
    board_state JSONB NOT NULL DEFAULT '[]',
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ludo_games_status ON public.ludo_games(status);
CREATE INDEX IF NOT EXISTS idx_ludo_games_created_by ON public.ludo_games(created_by);
CREATE INDEX IF NOT EXISTS idx_ludo_games_created_at ON public.ludo_games(created_at);

-- Enable RLS
ALTER TABLE public.ludo_games ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all games" ON public.ludo_games
    FOR SELECT USING (true);

CREATE POLICY "Users can create games" ON public.ludo_games
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Players can update games they're in" ON public.ludo_games
    FOR UPDATE USING (
        auth.uid() = created_by OR 
        auth.uid()::text = ANY(SELECT jsonb_object_keys(players))
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

-- Grant permissions
GRANT ALL ON public.ludo_games TO authenticated;
GRANT ALL ON public.ludo_games TO service_role;

-- Add foreign key constraint to profiles table
ALTER TABLE public.ludo_games 
ADD CONSTRAINT ludo_games_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Insert some sample data for testing
INSERT INTO public.ludo_games (room_name, entry_fee, created_by, players) 
SELECT 
    'Sample Game Room',
    50,
    id,
    jsonb_build_object(
        id::text, jsonb_build_object(
            'username', username,
            'color', 'red',
            'pieces', '[0,0,0,0]',
            'position', 0
        )
    )
FROM public.profiles 
WHERE username = 'testuser1'
LIMIT 1;

-- Verify the setup
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ludo_games' 
ORDER BY ordinal_position;
