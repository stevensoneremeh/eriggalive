
-- Enable realtime for community tables
ALTER PUBLICATION supabase_realtime ADD TABLE community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE community_post_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE community_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE community_comment_likes;

-- Function to increment post vote count
CREATE OR REPLACE FUNCTION increment_post_vote_count(post_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE community_posts 
  SET vote_count = vote_count + 1,
      updated_at = NOW()
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement post vote count
CREATE OR REPLACE FUNCTION decrement_post_vote_count(post_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE community_posts 
  SET vote_count = GREATEST(vote_count - 1, 0),
      updated_at = NOW()
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment comment like count
CREATE OR REPLACE FUNCTION increment_comment_like_count(comment_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE community_comments 
  SET like_count = like_count + 1,
      updated_at = NOW()
  WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement comment like count
CREATE OR REPLACE FUNCTION decrement_comment_like_count(comment_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE community_comments 
  SET like_count = GREATEST(like_count - 1, 0),
      updated_at = NOW()
  WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(post_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE community_posts 
  SET view_count = view_count + 1,
      updated_at = NOW()
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update comment count when comments are added
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts 
    SET comment_count = comment_count + 1,
        updated_at = NOW()
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts 
    SET comment_count = GREATEST(comment_count - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for comment count updates
DROP TRIGGER IF EXISTS trigger_update_comment_count ON community_comments;
CREATE TRIGGER trigger_update_comment_count
  AFTER INSERT OR DELETE ON community_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count();

-- Grant permissions
GRANT EXECUTE ON FUNCTION increment_post_vote_count TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_post_vote_count TO authenticated;
GRANT EXECUTE ON FUNCTION increment_comment_like_count TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_comment_like_count TO authenticated;
GRANT EXECUTE ON FUNCTION increment_view_count TO authenticated;
