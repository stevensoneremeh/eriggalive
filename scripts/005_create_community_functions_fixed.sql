-- Create community functions that don't depend on user_roles table

-- Function to get posts with user data (without user_roles dependency)
CREATE OR REPLACE FUNCTION get_community_posts_with_user_data(category_filter bigint DEFAULT NULL)
RETURNS TABLE (
  id bigint,
  title text,
  content text,
  media_url text,
  media_type text,
  hashtags text[],
  vote_count integer,
  comment_count integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  category_id bigint,
  category_name text,
  category_color text,
  category_icon text,
  user_id uuid,
  username text,
  full_name text,
  avatar_url text,
  user_voted boolean
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.content,
    p.media_url,
    p.media_type,
    p.hashtags,
    p.vote_count,
    p.comment_count,
    p.created_at,
    p.updated_at,
    p.category_id,
    c.name as category_name,
    c.color as category_color,
    c.icon as category_icon,
    p.user_id,
    COALESCE(u.username, u.full_name, 'Anonymous') as username,
    u.full_name,
    u.avatar_url,
    EXISTS(
      SELECT 1 FROM community_post_votes v 
      WHERE v.post_id = p.id AND v.user_id = auth.uid()
    ) as user_voted
  FROM community_posts p
  LEFT JOIN community_categories c ON p.category_id = c.id
  LEFT JOIN users u ON p.user_id = u.id
  WHERE 
    p.is_published = true 
    AND p.is_deleted = false
    AND (category_filter IS NULL OR p.category_id = category_filter)
  ORDER BY p.created_at DESC;
END;
$$;

-- Function to create a post
CREATE OR REPLACE FUNCTION create_community_post(
  post_title text,
  post_content text,
  post_category_id bigint,
  post_hashtags text[] DEFAULT '{}',
  post_media_url text DEFAULT NULL,
  post_media_type text DEFAULT NULL
)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_post_id bigint;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Insert the post
  INSERT INTO community_posts (
    title, content, category_id, hashtags, media_url, media_type, user_id, is_published
  ) VALUES (
    post_title, post_content, post_category_id, post_hashtags, post_media_url, post_media_type, auth.uid(), true
  ) RETURNING id INTO new_post_id;

  RETURN new_post_id;
END;
$$;

-- Function to toggle post vote
CREATE OR REPLACE FUNCTION toggle_post_vote(post_id_param bigint)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  vote_exists boolean;
  new_vote_count integer;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Check if vote exists
  SELECT EXISTS(
    SELECT 1 FROM community_post_votes 
    WHERE post_id = post_id_param AND user_id = auth.uid()
  ) INTO vote_exists;

  IF vote_exists THEN
    -- Remove vote
    DELETE FROM community_post_votes 
    WHERE post_id = post_id_param AND user_id = auth.uid();
    
    -- Update vote count
    UPDATE community_posts 
    SET vote_count = vote_count - 1 
    WHERE id = post_id_param;
    
    RETURN false;
  ELSE
    -- Add vote
    INSERT INTO community_post_votes (post_id, user_id) 
    VALUES (post_id_param, auth.uid());
    
    -- Update vote count
    UPDATE community_posts 
    SET vote_count = vote_count + 1 
    WHERE id = post_id_param;
    
    RETURN true;
  END IF;
END;
$$;

-- Function to get comments for a post
CREATE OR REPLACE FUNCTION get_post_comments(post_id_param bigint)
RETURNS TABLE (
  id bigint,
  content text,
  like_count integer,
  created_at timestamp with time zone,
  user_id uuid,
  username text,
  full_name text,
  avatar_url text,
  user_liked boolean
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.content,
    c.like_count,
    c.created_at,
    c.user_id,
    COALESCE(u.username, u.full_name, 'Anonymous') as username,
    u.full_name,
    u.avatar_url,
    EXISTS(
      SELECT 1 FROM community_comment_likes cl 
      WHERE cl.comment_id = c.id AND cl.user_id = auth.uid()
    ) as user_liked
  FROM community_comments c
  LEFT JOIN users u ON c.user_id = u.id
  WHERE 
    c.post_id = post_id_param 
    AND c.is_deleted = false
    AND c.parent_comment_id IS NULL
  ORDER BY c.created_at ASC;
END;
$$;
