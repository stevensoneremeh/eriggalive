-- Drop old community tables if they exist (keeping only the current ones)
-- This script is safe to run multiple times

-- Drop old community tables that might conflict
DROP TABLE IF EXISTS old_community_posts CASCADE;
DROP TABLE IF EXISTS old_community_comments CASCADE;
DROP TABLE IF EXISTS old_community_likes CASCADE;
DROP TABLE IF EXISTS old_community_reactions CASCADE;

-- Drop any old functions that might exist
DROP FUNCTION IF EXISTS get_community_posts_with_user_data() CASCADE;
DROP FUNCTION IF EXISTS create_community_post(text, text, bigint) CASCADE;
DROP FUNCTION IF EXISTS toggle_post_vote(bigint) CASCADE;

-- Ensure RLS is enabled on all community tables
ALTER TABLE community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comment_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Anyone can view categories" ON community_categories;
DROP POLICY IF EXISTS "Anyone can view posts" ON community_posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON community_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON community_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON community_posts;
DROP POLICY IF EXISTS "Anyone can view comments" ON community_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON community_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON community_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON community_comments;
DROP POLICY IF EXISTS "Anyone can view votes" ON community_post_votes;
DROP POLICY IF EXISTS "Authenticated users can vote" ON community_post_votes;
DROP POLICY IF EXISTS "Users can delete own votes" ON community_post_votes;
DROP POLICY IF EXISTS "Anyone can view comment likes" ON community_comment_likes;
DROP POLICY IF EXISTS "Authenticated users can like comments" ON community_comment_likes;
DROP POLICY IF EXISTS "Users can delete own comment likes" ON community_comment_likes;

-- Create simple, permissive policies that don't depend on user_roles
CREATE POLICY "Anyone can view categories" ON community_categories FOR SELECT USING (true);

CREATE POLICY "Anyone can view posts" ON community_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON community_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own posts" ON community_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON community_posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view comments" ON community_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON community_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own comments" ON community_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON community_comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view votes" ON community_post_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON community_post_votes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own votes" ON community_post_votes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view comment likes" ON community_comment_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like comments" ON community_comment_likes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own comment likes" ON community_comment_likes FOR DELETE USING (auth.uid() = user_id);
