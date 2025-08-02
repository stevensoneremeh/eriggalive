-- DANGER: This script will completely reset your database
-- Only use this if you want to start completely fresh
-- Make sure you have backups before running this!

-- Disable RLS temporarily
SET session_replication_role = replica;

-- Drop all tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.tickets CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.freebie_votes CASCADE;
DROP TABLE IF EXISTS public.freebies CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.user_blocks CASCADE;
DROP TABLE IF EXISTS public.user_follows CASCADE;
DROP TABLE IF EXISTS public.community_comment_likes CASCADE;
DROP TABLE IF EXISTS public.community_post_votes CASCADE;
DROP TABLE IF EXISTS public.community_comments CASCADE;
DROP TABLE IF EXISTS public.community_posts CASCADE;
DROP TABLE IF EXISTS public.community_categories CASCADE;
DROP TABLE IF EXISTS public.content_access CASCADE;
DROP TABLE IF EXISTS public.coin_transactions CASCADE;
DROP TABLE IF EXISTS public.streaming_links CASCADE;
DROP TABLE IF EXISTS public.gallery_items CASCADE;
DROP TABLE IF EXISTS public.music_videos CASCADE;
DROP TABLE IF EXISTS public.tracks CASCADE;
DROP TABLE IF EXISTS public.albums CASCADE;
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS post_type CASCADE;
DROP TYPE IF EXISTS content_type CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_tier CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_post_vote CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP FUNCTION IF EXISTS update_comment_counts CASCADE;
DROP FUNCTION IF EXISTS update_like_counts CASCADE;
DROP FUNCTION IF EXISTS update_freebie_vote_counts CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS generate_erigga_id CASCADE;
DROP FUNCTION IF EXISTS generate_referral_code CASCADE;

-- Drop storage buckets
DELETE FROM storage.objects WHERE bucket_id IN ('avatars', 'covers', 'audio', 'videos', 'documents', 'community-media');
DELETE FROM storage.buckets WHERE id IN ('avatars', 'covers', 'audio', 'videos', 'documents', 'community-media');

-- Re-enable RLS
SET session_replication_role = DEFAULT;

-- Success message
SELECT '🗑️ DATABASE RESET COMPLETE - You can now run the main setup script' as message;
