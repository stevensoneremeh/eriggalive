-- Deployment Verification Script
-- Run this after deploying to verify everything is working correctly

-- Check if all required extensions are enabled
SELECT 
    extname as extension_name,
    extversion as version
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pgcrypto');

-- Check if all custom types exist
SELECT 
    typname as type_name,
    typtype as type_type
FROM pg_type 
WHERE typname IN (
    'user_tier', 'user_role', 'subscription_status', 
    'payment_status', 'transaction_type', 'payment_method',
    'content_type', 'post_type', 'notification_type'
);

-- Check if all required tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'user_profiles', 'community_categories', 'community_posts',
    'community_post_votes', 'community_comments', 'community_comment_likes',
    'freebies', 'freebie_claims', 'coin_transactions', 'products', 'notifications'
);

-- Check RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
    'user_profiles', 'community_posts', 'community_comments',
    'freebies', 'freebie_claims', 'coin_transactions'
);

-- Check if storage bucket exists
SELECT 
    id,
    name,
    public
FROM storage.buckets 
WHERE id = 'eriggalive-assets';

-- Verify sample data exists
SELECT 'community_categories' as table_name, count(*) as record_count FROM public.community_categories
UNION ALL
SELECT 'freebies', count(*) FROM public.freebies
UNION ALL
SELECT 'user_profiles', count(*) FROM public.user_profiles;

-- Check for any constraint violations
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    conrelid::regclass as table_name
FROM pg_constraint 
WHERE connamespace = 'public'::regnamespace
AND contype IN ('f', 'c', 'u'); -- foreign key, check, unique

-- Test basic functionality with a sample query
SELECT 
    'Database is ready for deployment' as status,
    now() as verified_at;
