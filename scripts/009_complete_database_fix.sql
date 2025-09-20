-- Complete database fix for all console errors
-- This script creates all missing tables, functions, and fixes RLS policies

-- 1. Create users table if it doesn't exist (main issue causing 404 errors)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    tier TEXT DEFAULT 'fan',
    coins INTEGER DEFAULT 0,
    reputation_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create community tables
CREATE TABLE IF NOT EXISTS community_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT 'hash',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_posts (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES community_categories(id) ON DELETE SET NULL,
    hashtags TEXT[] DEFAULT '{}',
    vote_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    media_url TEXT,
    media_type TEXT,
    is_published BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_post_votes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- 3. Create missing tables that are causing 403 errors
CREATE TABLE IF NOT EXISTS store_purchases (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    item_type TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_follows (
    id SERIAL PRIMARY KEY,
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS vault_views (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL,
    content_id TEXT NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE,
    location TEXT,
    price DECIMAL(10,2) DEFAULT 0,
    max_tickets INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_tickets (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    ticket_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    reward_amount INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS missions (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    reward_coins INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Insert default categories
INSERT INTO community_categories (name, slug, description, color, icon, display_order) VALUES
('General Discussion', 'general', 'General conversations about Erigga', '#3B82F6', 'users', 1),
('Music & Lyrics', 'music', 'Discuss Erigga''s music and lyrics', '#8B5CF6', 'music', 2),
('Fan Art & Media', 'media', 'Share fan art and media content', '#10B981', 'image', 3),
('Events & News', 'events', 'Latest events and news', '#F59E0B', 'calendar', 4),
('Questions & Help', 'help', 'Ask questions and get help', '#EF4444', 'help-circle', 5)
ON CONFLICT (slug) DO NOTHING;

-- 5. Create or replace database functions
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (auth_user_id, email, username, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (auth_user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;

-- Create trigger for auto user creation
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- 6. Community functions
CREATE OR REPLACE FUNCTION get_community_posts_with_user_data(category_filter INTEGER DEFAULT NULL)
RETURNS TABLE (
    id INTEGER,
    title TEXT,
    content TEXT,
    media_url TEXT,
    media_type TEXT,
    hashtags TEXT[],
    vote_count INTEGER,
    comment_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    user_id UUID,
    category_id INTEGER,
    category_name TEXT,
    category_color TEXT,
    category_icon TEXT,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    user_voted BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.id,
        cp.title,
        cp.content,
        cp.media_url,
        cp.media_type,
        cp.hashtags,
        cp.vote_count,
        cp.comment_count,
        cp.created_at,
        cp.updated_at,
        cp.user_id,
        cp.category_id,
        COALESCE(cc.name, 'General') as category_name,
        COALESCE(cc.color, '#3B82F6') as category_color,
        COALESCE(cc.icon, 'hash') as category_icon,
        COALESCE(u.username, 'Anonymous') as username,
        COALESCE(u.full_name, 'Anonymous User') as full_name,
        u.avatar_url,
        CASE 
            WHEN auth.uid() IS NOT NULL THEN 
                EXISTS(SELECT 1 FROM community_post_votes cpv WHERE cpv.post_id = cp.id AND cpv.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()))
            ELSE false
        END as user_voted
    FROM community_posts cp
    LEFT JOIN community_categories cc ON cp.category_id = cc.id
    LEFT JOIN users u ON cp.user_id = u.id
    WHERE cp.is_published = true 
        AND cp.is_deleted = false
        AND (category_filter IS NULL OR cp.category_id = category_filter)
    ORDER BY cp.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_community_post(
    post_title TEXT,
    post_content TEXT,
    post_category_id INTEGER DEFAULT 1,
    post_hashtags TEXT[] DEFAULT '{}'
)
RETURNS INTEGER AS $$
DECLARE
    current_user_id UUID;
    new_post_id INTEGER;
BEGIN
    -- Get current user ID
    SELECT id INTO current_user_id 
    FROM users 
    WHERE auth_user_id = auth.uid();
    
    -- If user doesn't exist, create them
    IF current_user_id IS NULL THEN
        INSERT INTO users (auth_user_id, email, username, full_name)
        SELECT 
            auth.uid(),
            au.email,
            COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)),
            COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1))
        FROM auth.users au
        WHERE au.id = auth.uid()
        RETURNING id INTO current_user_id;
    END IF;
    
    -- Create the post
    INSERT INTO community_posts (title, content, user_id, category_id, hashtags)
    VALUES (post_title, post_content, current_user_id, post_category_id, post_hashtags)
    RETURNING id INTO new_post_id;
    
    RETURN new_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION toggle_post_vote(post_id_param INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_id UUID;
    vote_exists BOOLEAN;
BEGIN
    -- Get current user ID
    SELECT id INTO current_user_id 
    FROM users 
    WHERE auth_user_id = auth.uid();
    
    -- If user doesn't exist, create them
    IF current_user_id IS NULL THEN
        INSERT INTO users (auth_user_id, email, username, full_name)
        SELECT 
            auth.uid(),
            au.email,
            COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)),
            COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1))
        FROM auth.users au
        WHERE au.id = auth.uid()
        RETURNING id INTO current_user_id;
    END IF;
    
    -- Check if vote exists
    SELECT EXISTS(
        SELECT 1 FROM community_post_votes 
        WHERE post_id = post_id_param AND user_id = current_user_id
    ) INTO vote_exists;
    
    IF vote_exists THEN
        -- Remove vote
        DELETE FROM community_post_votes 
        WHERE post_id = post_id_param AND user_id = current_user_id;
        
        -- Update vote count
        UPDATE community_posts 
        SET vote_count = vote_count - 1 
        WHERE id = post_id_param;
        
        RETURN false;
    ELSE
        -- Add vote
        INSERT INTO community_post_votes (post_id, user_id)
        VALUES (post_id_param, current_user_id);
        
        -- Update vote count
        UPDATE community_posts 
        SET vote_count = vote_count + 1 
        WHERE id = post_id_param;
        
        RETURN true;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies
-- Users policies
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth_user_id = auth.uid());

-- Community categories policies
DROP POLICY IF EXISTS "Anyone can view categories" ON community_categories;
CREATE POLICY "Anyone can view categories" ON community_categories FOR SELECT USING (is_active = true);

-- Community posts policies
DROP POLICY IF EXISTS "Anyone can view published posts" ON community_posts;
CREATE POLICY "Anyone can view published posts" ON community_posts FOR SELECT USING (is_published = true AND is_deleted = false);

DROP POLICY IF EXISTS "Authenticated users can create posts" ON community_posts;
CREATE POLICY "Authenticated users can create posts" ON community_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own posts" ON community_posts;
CREATE POLICY "Users can update own posts" ON community_posts FOR UPDATE USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Community post votes policies
DROP POLICY IF EXISTS "Anyone can view votes" ON community_post_votes;
CREATE POLICY "Anyone can view votes" ON community_post_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can vote" ON community_post_votes;
CREATE POLICY "Authenticated users can vote" ON community_post_votes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete own votes" ON community_post_votes;
CREATE POLICY "Users can delete own votes" ON community_post_votes FOR DELETE USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Store purchases policies
DROP POLICY IF EXISTS "Users can view own purchases" ON store_purchases;
CREATE POLICY "Users can view own purchases" ON store_purchases FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- User follows policies
DROP POLICY IF EXISTS "Users can view follows" ON user_follows;
CREATE POLICY "Users can view follows" ON user_follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own follows" ON user_follows;
CREATE POLICY "Users can manage own follows" ON user_follows FOR ALL USING (follower_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Vault views policies
DROP POLICY IF EXISTS "Users can view own vault views" ON vault_views;
CREATE POLICY "Users can view own vault views" ON vault_views FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can create vault views" ON vault_views;
CREATE POLICY "Users can create vault views" ON vault_views FOR INSERT WITH CHECK (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Events policies
DROP POLICY IF EXISTS "Anyone can view events" ON events;
CREATE POLICY "Anyone can view events" ON events FOR SELECT USING (true);

-- Event tickets policies
DROP POLICY IF EXISTS "Users can view own tickets" ON event_tickets;
CREATE POLICY "Users can view own tickets" ON event_tickets FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Referrals policies
DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
CREATE POLICY "Users can view own referrals" ON referrals FOR SELECT USING (referrer_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR referred_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Missions policies
DROP POLICY IF EXISTS "Anyone can view active missions" ON missions;
CREATE POLICY "Anyone can view active missions" ON missions FOR SELECT USING (is_active = true);

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category_id ON community_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_post_votes_post_id ON community_post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_votes_user_id ON community_post_votes(user_id);

-- 10. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
