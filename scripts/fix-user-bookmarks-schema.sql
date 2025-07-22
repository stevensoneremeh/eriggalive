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

-- Drop user_bookmarks table if it exists to recreate with correct foreign key
DROP TABLE IF EXISTS public.user_bookmarks CASCADE;

-- Recreate user_bookmarks table with correct foreign key reference
CREATE TABLE public.user_bookmarks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    post_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- Add foreign key constraints
ALTER TABLE public.user_bookmarks 
ADD CONSTRAINT fk_user_bookmarks_user_id 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_bookmarks 
ADD CONSTRAINT fk_user_bookmarks_post_id 
FOREIGN KEY (post_id) REFERENCES public.community_posts(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_id ON public.user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_post_id ON public.user_bookmarks(post_id);

-- Enable RLS
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
DROP POLICY IF EXISTS "Users can manage their own bookmarks" ON public.user_bookmarks;
CREATE POLICY "Users can manage their own bookmarks" ON public.user_bookmarks 
FOR ALL USING (
    auth.uid()::text = (
        SELECT auth_user_id::text 
        FROM public.users 
        WHERE id = user_id
    )
);

-- Verify the foreign key constraints
DO $$
DECLARE
    constraint_count integer;
BEGIN
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'user_bookmarks' 
    AND tc.constraint_type = 'FOREIGN KEY';
    
    RAISE NOTICE 'user_bookmarks table has % foreign key constraints', constraint_count;
    
    -- List the constraints
    FOR constraint_count IN 
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'user_bookmarks' 
        AND tc.constraint_type = 'FOREIGN KEY'
    LOOP
        RAISE NOTICE 'Foreign key constraint exists for user_bookmarks';
    END LOOP;
END $$;

-- Test the constraints work by attempting to insert invalid data (this should fail)
DO $$
BEGIN
    -- This should fail if constraints are working
    BEGIN
        INSERT INTO public.user_bookmarks (user_id, post_id) VALUES (99999, 99999);
        RAISE NOTICE 'WARNING: Foreign key constraints may not be working properly';
    EXCEPTION
        WHEN foreign_key_violation THEN
            RAISE NOTICE 'SUCCESS: Foreign key constraints are working correctly';
        WHEN OTHERS THEN
            RAISE NOTICE 'INFO: Test insert failed as expected: %', SQLERRM;
    END;
END $$;
