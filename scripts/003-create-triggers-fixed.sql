-- Create triggers for vote counts (both post and comment votes)
CREATE TRIGGER vote_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON votes
    FOR EACH ROW EXECUTE FUNCTION update_post_vote_counts();

CREATE TRIGGER comment_vote_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON votes
    FOR EACH ROW EXECUTE FUNCTION update_comment_vote_counts();

-- Trigger for comment counts on posts
CREATE TRIGGER comment_count_trigger
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_comment_counts();

-- Trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
