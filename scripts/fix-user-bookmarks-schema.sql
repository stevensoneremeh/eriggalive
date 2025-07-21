-- Check if users table exists and get its structure
DO $$
DECLARE
    users_id_type text;
    table_exists boolean;
BEGIN
    -- Check if users table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        -- Create users table if it doesn't exist
        CREATE TABLE public.users (
            id BIGSERIAL PRIMARY KEY,
            auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
            username TEXT UNIQUE NOT NULL,
            full_name TEXT,
            email TEXT NOT NULL,
            avatar_url TEXT,
            bio TEXT,
            tier TEXT DEFAULT 'grassroot' CHECK (tier IN ('grassroot', 'pioneer', 'elder', 'blood')),
            level INTEGER DEFAULT 1,
            points INTEGER DEFAULT 0,
            coins BIGINT DEFAULT 1000,
            is_verified BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create index on auth_user_id
        CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
        
        RAISE NOTICE 'Users table created with BIGINT id';
    ELSE
        -- Get the data type of users.id
        SELECT data_type INTO users_id_type
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'id';
        
        RAISE NOTICE 'Users table exists with id type: %', users_id_type;
    END IF;
END $$;

-- Create user_bookmarks table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_bookmarks (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_id ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_post_id ON user_bookmarks(post_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_created_at ON user_bookmarks(created_at);

-- Enable RLS
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON user_bookmarks;
CREATE POLICY "Users can view their own bookmarks" ON user_bookmarks
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own bookmarks" ON user_bookmarks;
CREATE POLICY "Users can create their own bookmarks" ON user_bookmarks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON user_bookmarks;
CREATE POLICY "Users can delete their own bookmarks" ON user_bookmarks
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON user_bookmarks TO authenticated;
GRANT USAGE ON SEQUENCE user_bookmarks_id_seq TO authenticated;
