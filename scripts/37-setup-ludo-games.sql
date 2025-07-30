-- Create ludo_games table
CREATE TABLE IF NOT EXISTS ludo_games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    entry_fee INTEGER NOT NULL DEFAULT 10,
    max_players INTEGER NOT NULL DEFAULT 4,
    current_players INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'waiting',
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    players JSONB DEFAULT '[]'::jsonb,
    prize_pool INTEGER DEFAULT 0,
    game_state JSONB DEFAULT '{}'::jsonb,
    winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    subscription_tier VARCHAR(50) DEFAULT 'grassroot',
    coins_balance INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ludo_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ludo_games
CREATE POLICY "Users can view all games" ON ludo_games
    FOR SELECT USING (true);

CREATE POLICY "Users can create games" ON ludo_games
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update games they created or joined" ON ludo_games
    FOR UPDATE USING (
        auth.uid() = created_by OR 
        auth.uid()::text = ANY(SELECT jsonb_array_elements_text(players))
    );

-- RLS Policies for user_profiles
CREATE POLICY "Users can view all profiles" ON user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ludo_games_status ON ludo_games(status);
CREATE INDEX IF NOT EXISTS idx_ludo_games_created_by ON ludo_games(created_by);
CREATE INDEX IF NOT EXISTS idx_ludo_games_created_at ON ludo_games(created_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ludo_games_updated_at BEFORE UPDATE ON ludo_games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
