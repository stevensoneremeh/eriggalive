-- Enable realtime for community tables
ALTER PUBLICATION supabase_realtime ADD TABLE community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE community_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE community_post_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE community_comment_likes;

-- Function to handle post votes properly
CREATE OR REPLACE FUNCTION handle_post_vote(post_id_param bigint, user_id_param uuid)
RETURNS JSON AS $$
DECLARE
    existing_vote community_post_votes%ROWTYPE;
    vote_count int;
    is_voted boolean;
BEGIN
    -- Check if user already voted
    SELECT * INTO existing_vote 
    FROM community_post_votes 
    WHERE post_id = post_id_param AND user_id = user_id_param;
    
    IF existing_vote.id IS NULL THEN
        -- Insert new vote
        INSERT INTO community_post_votes (post_id, user_id, vote_type, created_at)
        VALUES (post_id_param, user_id_param, 'upvote', NOW());
        is_voted := true;
    ELSE
        -- Remove existing vote
        DELETE FROM community_post_votes 
        WHERE post_id = post_id_param AND user_id = user_id_param;
        is_voted := false;
    END IF;
    
    -- Get updated vote count
    SELECT COUNT(*) INTO vote_count
    FROM community_post_votes
    WHERE post_id = post_id_param;
    
    -- Update post vote count
    UPDATE community_posts 
    SET vote_count = vote_count
    WHERE id = post_id_param;
    
    RETURN json_build_object(
        'voted', is_voted,
        'voteCount', vote_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle comment likes properly
CREATE OR REPLACE FUNCTION handle_comment_like(comment_id_param bigint, user_id_param uuid)
RETURNS JSON AS $$
DECLARE
    existing_like community_comment_likes%ROWTYPE;
    like_count int;
    is_liked boolean;
BEGIN
    -- Check if user already liked
    SELECT * INTO existing_like 
    FROM community_comment_likes 
    WHERE comment_id = comment_id_param AND user_id = user_id_param;
    
    IF existing_like.id IS NULL THEN
        -- Insert new like
        INSERT INTO community_comment_likes (comment_id, user_id, created_at)
        VALUES (comment_id_param, user_id_param, NOW());
        is_liked := true;
    ELSE
        -- Remove existing like
        DELETE FROM community_comment_likes 
        WHERE comment_id = comment_id_param AND user_id = user_id_param;
        is_liked := false;
    END IF;
    
    -- Get updated like count
    SELECT COUNT(*) INTO like_count
    FROM community_comment_likes
    WHERE comment_id = comment_id_param;
    
    -- Update comment like count
    UPDATE community_comments 
    SET like_count = like_count
    WHERE id = comment_id_param;
    
    RETURN json_build_object(
        'liked', is_liked,
        'likeCount', like_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update post comment count when comments are added/removed
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
        SET comment_count = GREATEST(comment_count - 1, 0)
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comment count updates
DROP TRIGGER IF EXISTS update_post_comment_count_trigger ON community_comments;
CREATE TRIGGER update_post_comment_count_trigger
    AFTER INSERT OR DELETE ON community_comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- Create function to get posts with user vote status
CREATE OR REPLACE FUNCTION get_community_posts_with_votes(requesting_user_id uuid DEFAULT NULL)
RETURNS TABLE (
    id bigint,
    title text,
    content text,
    media_url text,
    user_id uuid,
    category_id bigint,
    vote_count int,
    comment_count int,
    hashtags text[],
    created_at timestamptz,
    updated_at timestamptz,
    user_voted boolean,
    user_data json,
    category_data json
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.content,
        p.media_url,
        p.user_id,
        p.category_id,
        p.vote_count,
        p.comment_count,
        p.hashtags,
        p.created_at,
        p.updated_at,
        CASE 
            WHEN requesting_user_id IS NOT NULL THEN 
                EXISTS(SELECT 1 FROM community_post_votes v WHERE v.post_id = p.id AND v.user_id = requesting_user_id)
            ELSE false
        END as user_voted,
        json_build_object(
            'id', u.id,
            'username', u.username,
            'full_name', u.full_name,
            'avatar_url', u.avatar_url,
            'tier', u.tier
        ) as user_data,
        json_build_object(
            'id', c.id,
            'name', c.name,
            'color', c.color,
            'icon', c.icon
        ) as category_data
    FROM community_posts p
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN community_categories c ON p.category_id = c.id
    WHERE p.is_deleted = false
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get comments with user like status
CREATE OR REPLACE FUNCTION get_post_comments_with_likes(post_id_param bigint, requesting_user_id uuid DEFAULT NULL)
RETURNS TABLE (
    id bigint,
    post_id bigint,
    user_id uuid,
    content text,
    like_count int,
    reply_count int,
    parent_comment_id bigint,
    created_at timestamptz,
    user_liked boolean,
    user_data json
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.content,
        c.like_count,
        c.reply_count,
        c.parent_comment_id,
        c.created_at,
        CASE 
            WHEN requesting_user_id IS NOT NULL THEN 
                EXISTS(SELECT 1 FROM community_comment_likes l WHERE l.comment_id = c.id AND l.user_id = requesting_user_id)
            ELSE false
        END as user_liked,
        json_build_object(
            'id', u.id,
            'username', u.username,
            'full_name', u.full_name,
            'avatar_url', u.avatar_url,
            'tier', u.tier
        ) as user_data
    FROM community_comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.post_id = post_id_param AND c.is_deleted = false
    ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
