-- Add missing columns to users table if they don't exist
DO $$ 
BEGIN
    -- Add coins column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'coins') THEN
        ALTER TABLE users ADD COLUMN coins INTEGER DEFAULT 1000;
    END IF;
    
    -- Add other missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'username') THEN
        ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'full_name') THEN
        ALTER TABLE users ADD COLUMN full_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tier') THEN
        ALTER TABLE users ADD COLUMN tier VARCHAR(20) DEFAULT 'grassroot';
    END IF;
END $$;

-- Create community_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS community_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(50) DEFAULT 'bg-blue-500',
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community_posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS community_posts (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES community_categories(id),
    content TEXT NOT NULL,
    media_url TEXT,
    media_type VARCHAR(20),
    media_metadata JSONB,
    vote_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert categories
INSERT INTO community_categories (name, slug, color, display_order) VALUES
('General', 'general', 'bg-blue-500', 1),
('Bars', 'bars', 'bg-red-500', 2),
('Stories', 'stories', 'bg-green-500', 3),
('Events', 'events', 'bg-purple-500', 4)
ON CONFLICT (slug) DO NOTHING;

-- Update existing users with missing data
UPDATE users SET 
    username = COALESCE(username, 'user_' || id),
    full_name = COALESCE(full_name, 'User ' || id),
    coins = COALESCE(coins, 1000),
    tier = COALESCE(tier, 'grassroot')
WHERE username IS NULL OR full_name IS NULL OR coins IS NULL OR tier IS NULL;

-- Insert sample users if none exist
INSERT INTO users (auth_user_id, username, full_name, tier, coins, email, avatar_url) VALUES
('erigga-official-uuid', 'erigga_official', 'Erigga', 'admin', 10000, 'erigga@official.com', '/placeholder-user.jpg'),
('bars-king-uuid', 'bars_king', 'Bars King', 'blood_brotherhood', 5000, 'barsking@example.com', '/placeholder-user.jpg'),
('street-poet-uuid', 'street_poet', 'Street Poet', 'elder', 3000, 'streetpoet@example.com', '/placeholder-user.jpg'),
('lyric-master-uuid', 'lyric_master', 'Lyric Master', 'pioneer', 2000, 'lyricmaster@example.com', '/placeholder-user.jpg'),
('fan-number1-uuid', 'fan_number1', 'Fan Number 1', 'grassroot', 1000, 'fan1@example.com', '/placeholder-user.jpg')
ON CONFLICT (email) DO NOTHING;

-- Insert sample posts
INSERT INTO community_posts (user_id, category_id, content, vote_count, comment_count) VALUES
((SELECT id FROM users WHERE username = 'erigga_official' LIMIT 1), 1, 'Welcome to the official Erigga community! 🎵 This is where we connect, share, and celebrate the culture. Drop your favorite Erigga lyrics below! #PaperBoi', 45, 12),
((SELECT id FROM users WHERE username = 'bars_king' LIMIT 1), 2, 'Just dropped some fire bars! 🔥🔥🔥

"Money dey my pocket, I no dey fear anybody
Na God dey my back, I no need security
From Warri to Lagos, dem know say I dey carry
The streets dey feel me, my story legendary"

What y''all think? Rate this bar 1-10! 💯', 38, 8),
((SELECT id FROM users WHERE username = 'street_poet' LIMIT 1), 3, 'Real talk: Remember when Erigga first started and nobody believed in the sound? Now look at where we are! 🙌

That''s why I never give up on my dreams. If Paper Boi can make it from the streets to the top, we all can make it too. What''s your biggest dream right now? Let''s motivate each other! 💪', 29, 15),
((SELECT id FROM users WHERE username = 'lyric_master' LIMIT 1), 4, 'YO! Who else is going to the Lagos concert next month?! 🎤🎵

I''ve been waiting for this for months! The energy is going to be INSANE! If you''re going, drop a comment so we can link up. Let''s make this the biggest Erigga concert ever!

#EriggaLive #LagosShow #PaperBoiTour', 52, 23),
((SELECT id FROM users WHERE username = 'fan_number1' LIMIT 1), 1, 'Good morning Erigga family! ☀️

Hope everyone is having a blessed day. Just wanted to say this community is everything! The love, the support, the real conversations - this is what it''s all about.

Remember: Stay focused, stay grinding, and keep supporting each other! Much love ❤️', 15, 6);

-- Enable RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Posts are viewable by everyone" ON community_posts FOR SELECT USING (true);
CREATE POLICY "Users can insert their own posts" ON community_posts FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));
CREATE POLICY "Users can update their own posts" ON community_posts FOR UPDATE USING (auth.uid()::text = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Categories are viewable by everyone" ON community_categories FOR SELECT USING (true);
