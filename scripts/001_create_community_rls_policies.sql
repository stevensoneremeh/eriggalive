-- Enable RLS on community tables and create policies

-- Community Categories policies
ALTER TABLE community_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to active categories" ON community_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Allow admin users to manage categories" ON community_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Community Posts policies
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to published posts" ON community_posts
  FOR SELECT USING (is_published = true AND is_deleted = false);

CREATE POLICY "Allow authenticated users to create posts" ON community_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update their own posts" ON community_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own posts" ON community_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Community Post Votes policies
ALTER TABLE community_post_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view all votes" ON community_post_votes
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to vote" ON community_post_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to remove their own votes" ON community_post_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Community Comments policies
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to non-deleted comments" ON community_comments
  FOR SELECT USING (is_deleted = false);

CREATE POLICY "Allow authenticated users to create comments" ON community_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update their own comments" ON community_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own comments" ON community_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Community Comment Likes policies
ALTER TABLE community_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view all comment likes" ON community_comment_likes
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to like comments" ON community_comment_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to remove their own comment likes" ON community_comment_likes
  FOR DELETE USING (auth.uid() = user_id);
