-- Function to increment post votes
CREATE OR REPLACE FUNCTION increment_post_votes(post_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE community_posts 
  SET vote_count = vote_count + 1 
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement post votes
CREATE OR REPLACE FUNCTION decrement_post_votes(post_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE community_posts 
  SET vote_count = GREATEST(vote_count - 1, 0)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_post_votes(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_post_votes(INTEGER) TO authenticated;
