-- Verify user_bookmarks table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_bookmarks'
ORDER BY ordinal_position;

-- Verify foreign key constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'user_bookmarks';

-- Verify RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_bookmarks';

-- Check if users table exists and its id column type
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
AND column_name = 'id';

-- Test query to ensure joins work
SELECT COUNT(*) as total_bookmarks
FROM user_bookmarks ub
JOIN users u ON ub.user_id = u.id
JOIN community_posts cp ON ub.post_id = cp.id;

-- Verify bookmark schema
-- This script checks if the user_bookmarks table and related structures exist

DO $$
BEGIN
    -- Check if user_bookmarks table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_bookmarks') THEN
        RAISE NOTICE 'user_bookmarks table exists';
        
        -- Check columns
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_bookmarks' AND column_name = 'id') THEN
            RAISE NOTICE 'id column exists';
        ELSE
            RAISE WARNING 'id column missing';
        END IF;
        
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_bookmarks' AND column_name = 'user_id') THEN
            RAISE NOTICE 'user_id column exists';
        ELSE
            RAISE WARNING 'user_id column missing';
        END IF;
        
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_bookmarks' AND column_name = 'post_id') THEN
            RAISE NOTICE 'post_id column exists';
        ELSE
            RAISE WARNING 'post_id column missing';
        END IF;
        
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_bookmarks' AND column_name = 'created_at') THEN
            RAISE NOTICE 'created_at column exists';
        ELSE
            RAISE WARNING 'created_at column missing';
        END IF;
        
        -- Check indexes
        IF EXISTS (SELECT FROM pg_indexes WHERE tablename = 'user_bookmarks' AND indexname = 'idx_user_bookmarks_user_id') THEN
            RAISE NOTICE 'user_id index exists';
        ELSE
            RAISE WARNING 'user_id index missing';
        END IF;
        
        -- Check RLS
        IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_bookmarks' AND rowsecurity = true) THEN
            RAISE NOTICE 'RLS is enabled';
        ELSE
            RAISE WARNING 'RLS is not enabled';
        END IF;
        
        -- Check policies
        IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'user_bookmarks') THEN
            RAISE NOTICE 'RLS policies exist';
        ELSE
            RAISE WARNING 'No RLS policies found';
        END IF;
        
    ELSE
        RAISE WARNING 'user_bookmarks table does not exist';
    END IF;
    
    -- Check if community_posts table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'community_posts') THEN
        RAISE NOTICE 'community_posts table exists';
    ELSE
        RAISE WARNING 'community_posts table does not exist';
    END IF;
    
END $$;
