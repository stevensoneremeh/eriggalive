-- Add the missing coins column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 1000;

-- Update existing users to have coins
UPDATE users SET coins = 1000 WHERE coins IS NULL;

-- Create community categories if they don't exist
CREATE TABLE IF NOT EXISTS community_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    color TEXT DEFAULT 'bg-blue-500',
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO community_categories (name, slug, description, color, display_order) 
VALUES 
    ('General', 'general', 'General discussions and conversations', 'bg-blue-500', 1),
    ('Bars', 'bars', 'Share your best bars and lyrics', 'bg-red-500', 2),
    ('Stories', 'stories', 'Share your stories and experiences', 'bg-green-500', 3),
    ('Events', 'events', 'Upcoming events and announcements', 'bg-purple-500', 4)
ON CONFLICT (slug) DO NOTHING;

-- Create community posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS community_posts (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES community_categories(id),
    content TEXT NOT NULL,
    media_url TEXT,
    media_type TEXT,
    vote_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create some test users if none exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'erigga_official') THEN
        INSERT INTO users (auth_user_id, username, full_name, tier, avatar_url, email, coins)
        VALUES 
            (gen_random_uuid(), 'erigga_official', 'Erigga', 'admin', '/placeholder-user.jpg', 'erigga@example.com', 5000),
            (gen_random_uuid(), 'bars_king', 'Bars King', 'blood_brotherhood', '/placeholder-user.jpg', 'bars@example.com', 2500),
            (gen_random_uuid(), 'street_poet', 'Street Poet', 'elder', '/placeholder-user.jpg', 'poet@example.com', 2000),
            (gen_random_uuid(), 'lyric_master', 'Lyric Master', 'pioneer', '/placeholder-user.jpg', 'lyric@example.com', 1500),
            (gen_random_uuid(), 'fan_number1', 'Fan Number 1', 'grassroot', '/placeholder-user.jpg', 'fan@example.com', 1000);
    END IF;
END $$;

-- Create dummy posts
DO $$
DECLARE
    user1_id BIGINT;
    user2_id BIGINT;
    user3_id BIGINT;
    user4_id BIGINT;
    user5_id BIGINT;
    general_cat_id INTEGER;
    bars_cat_id INTEGER;
    stories_cat_id INTEGER;
    events_cat_id INTEGER;
BEGIN
    -- Get user IDs
    SELECT id INTO user1_id FROM users WHERE username = 'erigga_official' LIMIT 1;
    SELECT id INTO user2_id FROM users WHERE username = 'bars_king' LIMIT 1;
    SELECT id INTO user3_id FROM users WHERE username = 'street_poet' LIMIT 1;
    SELECT id INTO user4_id FROM users WHERE username = 'lyric_master' LIMIT 1;
    SELECT id INTO user5_id FROM users WHERE username = 'fan_number1' LIMIT 1;
    
    -- Get category IDs
    SELECT id INTO general_cat_id FROM community_categories WHERE slug = 'general' LIMIT 1;
    SELECT id INTO bars_cat_id FROM community_categories WHERE slug = 'bars' LIMIT 1;
    SELECT id INTO stories_cat_id FROM community_categories WHERE slug = 'stories' LIMIT 1;
    SELECT id INTO events_cat_id FROM community_categories WHERE slug = 'events' LIMIT 1;
    
    -- Insert dummy posts if users exist
    IF user1_id IS NOT NULL THEN
        INSERT INTO community_posts (user_id, category_id, content, vote_count, comment_count, created_at)
        VALUES 
            (user1_id, general_cat_id, 'Welcome to the official Erigga community! 🎵 This is where we connect, share, and celebrate the culture. Drop your favorite Erigga lyrics below! #PaperBoi', 45, 12, NOW() - INTERVAL '1 hour'),
            (user2_id, bars_cat_id, E'Just dropped some fire bars! 🔥🔥🔥\n\n"Money dey my pocket, I no dey fear anybody\nNa God dey my back, I no need security\nFrom Warri to Lagos, dem know say I dey carry\nThe streets dey feel me, my story legendary"\n\nWhat y''all think? Rate this bar 1-10! 💯', 38, 8, NOW() - INTERVAL '2 hours'),
            (user3_id, stories_cat_id, E'Real talk: Remember when Erigga first started and nobody believed in the sound? Now look at where we are! 🙌\n\nThat''s why I never give up on my dreams. If Paper Boi can make it from the streets to the top, we all can make it too. What''s your biggest dream right now? Let''s motivate each other! 💪', 29, 15, NOW() - INTERVAL '3 hours'),
            (user4_id, events_cat_id, E'YO! Who else is going to the Lagos concert next month?! 🎤🎵\n\nI''ve been waiting for this for months! The energy is going to be INSANE! If you''re going, drop a comment so we can link up. Let''s make this the biggest Erigga concert ever!\n\n#EriggaLive #LagosShow #PaperBoiTour', 52, 23, NOW() - INTERVAL '4 hours'),
            (user5_id, general_cat_id, E'Good morning Erigga family! ☀️\n\nHope everyone is having a blessed day. Just wanted to say this community is everything! The love, the support, the real conversations - this is what it''s all about.\n\nRemember: Stay focused, stay grinding, and keep supporting each other! Much love ❤️', 15, 6, NOW() - INTERVAL '5 hours');
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category_id ON community_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);

SELECT 'Community setup completed successfully!' as result;
