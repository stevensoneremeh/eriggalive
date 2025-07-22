-- Function to update post vote counts
CREATE OR REPLACE FUNCTION update_post_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.vote_type = 'up' THEN
            UPDATE posts SET upvotes = upvotes + 1 WHERE id = NEW.post_id;
        ELSE
            UPDATE posts SET downvotes = downvotes + 1 WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.vote_type = 'up' THEN
            UPDATE posts SET upvotes = upvotes - 1 WHERE id = OLD.post_id;
        ELSE
            UPDATE posts SET downvotes = downvotes - 1 WHERE id = OLD.post_id;
        END IF;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.vote_type = 'up' THEN
            UPDATE posts SET upvotes = upvotes - 1 WHERE id = OLD.post_id;
        ELSE
            UPDATE posts SET downvotes = downvotes - 1 WHERE id = OLD.post_id;
        END IF;
        
        IF NEW.vote_type = 'up' THEN
            UPDATE posts SET upvotes = upvotes + 1 WHERE id = NEW.post_id;
        ELSE
            UPDATE posts SET downvotes = downvotes + 1 WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update comment counts
CREATE OR REPLACE FUNCTION update_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to handle user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
