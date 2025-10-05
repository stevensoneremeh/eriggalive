-- Create helper functions for community features

-- Function to increment post vote count
CREATE OR REPLACE FUNCTION increment_post_votes(post_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE community_posts 
  SET vote_count = vote_count + 1 
  WHERE id = post_id;
END;
$$;

-- Function to decrement post vote count
CREATE OR REPLACE FUNCTION decrement_post_votes(post_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE community_posts 
  SET vote_count = GREATEST(vote_count - 1, 0)
  WHERE id = post_id;
END;
$$;

-- Function to increment comment count
CREATE OR REPLACE FUNCTION increment_comment_count(post_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE community_posts 
  SET comment_count = comment_count + 1 
  WHERE id = post_id;
END;
$$;

-- Function to decrement comment count
CREATE OR REPLACE FUNCTION decrement_comment_count(post_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE community_posts 
  SET comment_count = GREATEST(comment_count - 1, 0)
  WHERE id = post_id;
END;
$$;

-- Trigger to update comment count when comments are added/removed
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM increment_comment_count(NEW.post_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM decrement_comment_count(OLD.post_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_comment_count ON community_comments;
CREATE TRIGGER trigger_update_comment_count
  AFTER INSERT OR DELETE ON community_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count();
