-- First, let's make sure all tables exist before creating triggers
-- Check if votes table exists, if not skip the vote trigger for now

-- Triggers for comment counts (this should work since posts and comments exist)
DROP TRIGGER IF EXISTS comment_count_trigger ON comments;
CREATE TRIGGER comment_count_trigger
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_comment_counts();

-- Trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create vote trigger only if votes table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'votes') THEN
        DROP TRIGGER IF EXISTS vote_count_trigger ON votes;
        CREATE TRIGGER vote_count_trigger
            AFTER INSERT OR UPDATE OR DELETE ON votes
            FOR EACH ROW EXECUTE FUNCTION update_post_vote_counts();
    END IF;
END $$;
