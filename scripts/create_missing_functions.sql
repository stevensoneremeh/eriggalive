-- Create function to increment comment count
CREATE OR REPLACE FUNCTION increment_comment_count(post_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE community_posts 
    SET comment_count = comment_count + 1 
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to decrement comment count
CREATE OR REPLACE FUNCTION decrement_comment_count(post_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE community_posts 
    SET comment_count = GREATEST(comment_count - 1, 0) 
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment vote count (if not exists)
CREATE OR REPLACE FUNCTION increment_vote_count(post_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE community_posts 
    SET vote_count = vote_count + 1 
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to decrement vote count (if not exists)
CREATE OR REPLACE FUNCTION decrement_vote_count(post_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE community_posts 
    SET vote_count = GREATEST(vote_count - 1, 0) 
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;
