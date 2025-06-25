-- Production-ready deployment fixes
-- This script ensures all database issues are resolved for deployment

-- 1. Ensure all required tables exist with proper structure
DO $$ 
BEGIN
    -- Check and create users table if missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'auth_user_id') THEN
        ALTER TABLE users ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'coins') THEN
        ALTER TABLE users ADD COLUMN coins INTEGER DEFAULT 1000;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tier') THEN
        ALTER TABLE users ADD COLUMN tier TEXT DEFAULT 'grassroot';
    END IF;
END $$;

-- 2. Create community tables if they don't exist
CREATE TABLE IF NOT EXISTS community_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    post_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES community_categories(id),
    content TEXT NOT NULL,
    media_url TEXT,
    media_type TEXT,
    media_metadata JSONB,
    vote_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    mentions JSONB,
    is_published BOOLEAN DEFAULT true,
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id INTEGER REFERENCES community_comments(id),
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_post_votes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS community_comment_likes (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER REFERENCES community_comments(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- 3. Create cartoon_series table for chronicles page
CREATE TABLE IF NOT EXISTS cartoon_series (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    episode_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Insert default categories
INSERT INTO community_categories (name, slug, description) VALUES
    ('General', 'general', 'General discussions and announcements'),
    ('Bars', 'bars', 'Share your best rap bars and lyrics'),
    ('Music', 'music', 'Music discussions and recommendations'),
    ('Street Stories', 'street-stories', 'Real stories from the streets')
ON CONFLICT (slug) DO NOTHING;

-- 5. Insert sample cartoon series
INSERT INTO cartoon_series (title, description, thumbnail_url, episode_count) VALUES
    ('Erigga Chronicles', 'Animated series following the Paper Boi adventures', '/placeholder.svg?height=200&width=300', 12),
    ('Street Tales', 'Stories from the Nigerian streets in animated form', '/placeholder.svg?height=200&width=300', 8)
ON CONFLICT DO NOTHING;

-- 6. Create or replace the vote handling function
CREATE OR REPLACE FUNCTION handle_post_vote(
    p_post_id INTEGER,
    p_voter_auth_id UUID,
    p_post_creator_auth_id UUID,
    p_coin_amount INTEGER DEFAULT 100
) RETURNS BOOLEAN AS $$
DECLARE
    v_voter_id INTEGER;
    v_creator_id INTEGER;
    v_existing_vote INTEGER;
    v_voter_coins INTEGER;
BEGIN
    -- Get voter's internal ID
    SELECT id, coins INTO v_voter_id, v_voter_coins
    FROM users WHERE auth_user_id = p_voter_auth_id;
    
    IF v_voter_id IS NULL THEN
        RAISE EXCEPTION 'Voter not found';
    END IF;
    
    -- Get creator's internal ID
    SELECT id INTO v_creator_id
    FROM users WHERE auth_user_id = p_post_creator_auth_id;
    
    IF v_creator_id IS NULL THEN
        RAISE EXCEPTION 'Post creator not found';
    END IF;
    
    -- Check if voting on own post
    IF v_voter_id = v_creator_id THEN
        RAISE EXCEPTION 'Cannot vote on own post';
    END IF;
    
    -- Check if already voted
    SELECT id INTO v_existing_vote
    FROM community_post_votes 
    WHERE post_id = p_post_id AND user_id = v_voter_id;
    
    IF v_existing_vote IS NOT NULL THEN
        RAISE EXCEPTION 'Already voted on this post';
    END IF;
    
    -- Check if voter has enough coins
    IF v_voter_coins < p_coin_amount THEN
        RAISE EXCEPTION 'Insufficient coins';
    END IF;
    
    -- Perform the vote transaction
    BEGIN
        -- Deduct coins from voter
        UPDATE users SET coins = coins - p_coin_amount WHERE id = v_voter_id;
        
        -- Add coins to creator
        UPDATE users SET coins = coins + p_coin_amount WHERE id = v_creator_id;
        
        -- Record the vote
        INSERT INTO community_post_votes (post_id, user_id) VALUES (p_post_id, v_voter_id);
        
        -- Update post vote count
        UPDATE community_posts SET vote_count = vote_count + 1 WHERE id = p_post_id;
        
        RETURN TRUE;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Vote transaction failed: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql;

-- 7. Set up RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartoon_series ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view published posts" ON community_posts;
DROP POLICY IF EXISTS "Users can create posts" ON community_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON community_posts;
DROP POLICY IF EXISTS "Anyone can view categories" ON community_categories;
DROP POLICY IF EXISTS "Anyone can view comments" ON community_comments;
DROP POLICY IF EXISTS "Users can create comments" ON community_comments;
DROP POLICY IF EXISTS "Users can view votes" ON community_post_votes;
DROP POLICY IF EXISTS "Users can vote" ON community_post_votes;
DROP POLICY IF EXISTS "Users can view comment likes" ON community_comment_likes;
DROP POLICY IF EXISTS "Users can like comments" ON community_comment_likes;
DROP POLICY IF EXISTS "Anyone can view cartoon series" ON cartoon_series;

-- Create new policies
CREATE POLICY "Enable read access for authenticated users" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable update for users based on auth_user_id" ON users FOR UPDATE TO authenticated USING (auth.uid() = auth_user_id);
CREATE POLICY "Enable insert for authenticated users" ON users FOR INSERT TO authenticated WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Enable read access for all users" ON community_posts FOR SELECT USING (is_published = true AND is_deleted = false);
CREATE POLICY "Enable insert for authenticated users" ON community_posts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for post owners" ON community_posts FOR UPDATE TO authenticated USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Enable read access for all users" ON community_categories FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON community_comments FOR SELECT USING (is_deleted = false);
CREATE POLICY "Enable insert for authenticated users" ON community_comments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for comment owners" ON community_comments FOR UPDATE TO authenticated USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Enable read access for authenticated users" ON community_post_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON community_post_votes FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable read access for authenticated users" ON community_comment_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON community_comment_likes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable delete for like owners" ON community_comment_likes FOR DELETE TO authenticated USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Enable read access for all users" ON cartoon_series FOR SELECT USING (true);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category_id ON community_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_votes_post_user ON community_post_votes(post_id, user_id);

-- 9. Create trigger to sync auth users with public users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (auth_user_id, username, full_name, email, avatar_url, coins, tier)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url',
        1000,
        'grassroot'
    )
    ON CONFLICT (auth_user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Sync existing auth users
INSERT INTO public.users (auth_user_id, username, full_name, email, avatar_url, coins, tier)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1), 'user_' || substr(au.id::text, 1, 8)),
    COALESCE(au.raw_user_meta_data->>'full_name', au.email, 'User'),
    COALESCE(au.email, ''),
    au.raw_user_meta_data->>'avatar_url',
    1000,
    'grassroot'
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.auth_user_id = au.id
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Production deployment setup completed successfully!';
    RAISE NOTICE 'Tables created: %, Users synced: %', 
        (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'),
        (SELECT count(*) FROM users);
END $$;
