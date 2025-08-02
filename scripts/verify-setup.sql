-- Verification script to check if everything is set up correctly
-- Run this after the main setup script to ensure everything is working

-- Check if all required tables exist
SELECT 
    'Tables Check' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 25 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- Check if RLS is enabled on key tables
SELECT 
    'RLS Check' as check_type,
    COUNT(*) as enabled_tables,
    CASE 
        WHEN COUNT(*) >= 20 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- Check if key functions exist
SELECT 
    'Functions Check' as check_type,
    COUNT(*) as function_count,
    CASE 
        WHEN COUNT(*) >= 5 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status
FROM pg_proc 
WHERE proname IN ('handle_post_vote', 'update_comment_counts', 'update_like_counts', 'handle_new_user', 'update_updated_at_column');

-- Check if triggers are created
SELECT 
    'Triggers Check' as check_type,
    COUNT(*) as trigger_count,
    CASE 
        WHEN COUNT(*) >= 10 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Check if indexes are created
SELECT 
    'Indexes Check' as check_type,
    COUNT(*) as index_count,
    CASE 
        WHEN COUNT(*) >= 30 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status
FROM pg_indexes 
WHERE schemaname = 'public';

-- Check if sample data exists
SELECT 
    'Sample Data Check' as check_type,
    (SELECT COUNT(*) FROM public.community_categories) as categories,
    (SELECT COUNT(*) FROM public.albums) as albums,
    (SELECT COUNT(*) FROM public.tracks) as tracks,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.community_categories) >= 5 
        AND (SELECT COUNT(*) FROM public.albums) >= 3 
        AND (SELECT COUNT(*) FROM public.tracks) >= 3 
        THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status;

-- Check storage buckets
SELECT 
    'Storage Buckets Check' as check_type,
    COUNT(*) as bucket_count,
    CASE 
        WHEN COUNT(*) >= 5 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status
FROM storage.buckets;

-- Final summary
SELECT 
    '🎯 SETUP VERIFICATION COMPLETE' as summary,
    'All checks completed. Review results above.' as message;
