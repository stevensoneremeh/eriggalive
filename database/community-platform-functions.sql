-- Community Platform Database Functions
-- These functions support the community features

-- Function to increment post votes
CREATE OR REPLACE FUNCTION increment_post_votes(post_id BIGINT)
RETURNS VOID AS $$
BEGIN
    UPDATE community_posts 
    SET vote_count = vote_count + 1 
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement post votes
CREATE OR REPLACE FUNCTION decrement_post_votes(post_id BIGINT)
RETURNS VOID AS $$
BEGIN
    UPDATE community_posts 
    SET vote_count = GREATEST(0, vote_count - 1) 
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment freebie votes
CREATE OR REPLACE FUNCTION increment_freebie_votes(freebie_id BIGINT)
RETURNS VOID AS $$
BEGIN
    UPDATE freebies 
    SET vote_count = vote_count + 1 
    WHERE id = freebie_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement freebie votes
CREATE OR REPLACE FUNCTION decrement_freebie_votes(freebie_id BIGINT)
RETURNS VOID AS $$
BEGIN
    UPDATE freebies 
    SET vote_count = GREATEST(0, vote_count - 1) 
    WHERE id = freebie_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment freebie downloads
CREATE OR REPLACE FUNCTION increment_freebie_downloads(freebie_id BIGINT)
RETURNS VOID AS $$
BEGIN
    UPDATE freebies 
    SET download_count = download_count + 1 
    WHERE id = freebie_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update comment counts
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_posts 
        SET comment_count = comment_count + 1 
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_posts 
        SET comment_count = GREATEST(0, comment_count - 1) 
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for comment count updates
DROP TRIGGER IF EXISTS update_comment_count_trigger ON community_comments;
CREATE TRIGGER update_comment_count_trigger
    AFTER INSERT OR DELETE ON community_comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- Enable realtime for community tables
ALTER PUBLICATION supabase_realtime ADD TABLE community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE community_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE community_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE freebies;
ALTER PUBLICATION supabase_realtime ADD TABLE freebie_votes;
