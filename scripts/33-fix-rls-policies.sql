-- Fix RLS policies to prevent infinite recursion
-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;

-- Create simple, non-recursive policies
CREATE POLICY "Enable read access for authenticated users" ON users
    FOR SELECT USING (auth.uid()::text = auth_user_id OR auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = auth_user_id);

CREATE POLICY "Enable update for users based on auth_user_id" ON users
    FOR UPDATE USING (auth.uid()::text = auth_user_id);

-- Fix community posts policies
DROP POLICY IF EXISTS "Anyone can view published posts" ON community_posts;
DROP POLICY IF EXISTS "Users can create posts" ON community_posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON community_posts;

CREATE POLICY "Enable read access for all users" ON community_posts
    FOR SELECT USING (is_published = true OR user_id IN (
        SELECT id FROM users WHERE auth_user_id = auth.uid()::text
    ));

CREATE POLICY "Enable insert for authenticated users" ON community_posts
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM users WHERE auth_user_id = auth.uid()::text
    ));

CREATE POLICY "Enable update for post owners" ON community_posts
    FOR UPDATE USING (user_id IN (
        SELECT id FROM users WHERE auth_user_id = auth.uid()::text
    ));

-- Fix community comments policies
DROP POLICY IF EXISTS "Anyone can view comments" ON community_comments;
DROP POLICY IF EXISTS "Users can create comments" ON community_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON community_comments;

CREATE POLICY "Enable read access for all users" ON community_comments
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON community_comments
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM users WHERE auth_user_id = auth.uid()::text
    ));

CREATE POLICY "Enable update for comment owners" ON community_comments
    FOR UPDATE USING (user_id IN (
        SELECT id FROM users WHERE auth_user_id = auth.uid()::text
    ));

-- Fix community votes policies
DROP POLICY IF EXISTS "Users can view all votes" ON community_votes;
DROP POLICY IF EXISTS "Users can create votes" ON community_votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON community_votes;

CREATE POLICY "Enable read access for all users" ON community_votes
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON community_votes
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM users WHERE auth_user_id = auth.uid()::text
    ));

CREATE POLICY "Enable update for vote owners" ON community_votes
    FOR UPDATE USING (user_id IN (
        SELECT id FROM users WHERE auth_user_id = auth.uid()::text
    ));

-- Fix community categories policies
DROP POLICY IF EXISTS "Anyone can view categories" ON community_categories;

CREATE POLICY "Enable read access for all users" ON community_categories
    FOR SELECT USING (is_active = true);

-- Ensure RLS is enabled on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_categories ENABLE ROW LEVEL SECURITY;
