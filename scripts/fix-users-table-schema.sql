-- Add missing date_of_birth column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'date_of_birth') THEN
        ALTER TABLE users ADD COLUMN date_of_birth DATE;
    END IF;
END $$;

-- Ensure avatar_url column exists for profile picture uploads
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- Add website column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'website') THEN
        ALTER TABLE users ADD COLUMN website TEXT;
    END IF;
END $$;

-- Add social_links column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'social_links') THEN
        ALTER TABLE users ADD COLUMN social_links JSONB DEFAULT '{}';
    END IF;
END $$;

-- Add location column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'location') THEN
        ALTER TABLE users ADD COLUMN location TEXT;
    END IF;
END $$;

-- Update RLS policies to ensure proper authentication
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = auth_user_id);

-- Fix community posts RLS to prevent authentication issues
DROP POLICY IF EXISTS "Users can create posts" ON community_posts;
CREATE POLICY "Users can create posts" ON community_posts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.id = community_posts.user_id
        )
    );

DROP POLICY IF EXISTS "Users can view published posts" ON community_posts;
CREATE POLICY "Users can view published posts" ON community_posts
    FOR SELECT USING (is_published = true OR user_id IN (
        SELECT id FROM users WHERE auth_user_id = auth.uid()
    ));

-- Fix community comments RLS
DROP POLICY IF EXISTS "Users can create comments" ON community_comments;
CREATE POLICY "Users can create comments" ON community_comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.auth_user_id = auth.uid() 
            AND users.id = community_comments.user_id
        )
    );

DROP POLICY IF EXISTS "Users can view comments" ON community_comments;
CREATE POLICY "Users can view comments" ON community_comments
    FOR SELECT USING (NOT is_deleted);
