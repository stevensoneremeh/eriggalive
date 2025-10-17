-- Fix community database issues by dropping and recreating functions
-- This addresses the "cannot change return type of existing function" error

-- Drop existing functions first to avoid return type conflicts
DROP FUNCTION IF EXISTS get_community_posts_with_user_data(bigint);
DROP FUNCTION IF EXISTS create_community_post(text, text, bigint, text[]);
DROP FUNCTION IF EXISTS toggle_post_vote(bigint);

-- Create the functions with correct return types
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
  user_id uuid,
  category_id bigint,
  category_name text,
  category_color text,
  category_icon text,
  username text,
  full_name text,
  avatar_url text,
  user_voted boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.title,
    cp.content,
    cp.media_url,
    cp.media_type,
    cp.hashtags,
    cp.vote_count,
    cp.comment_count,
    cp.created_at,
    cp.updated_at,
    cp.user_id,
    cp.category_id,
    cc.name as category_name,
    cc.color as category_color,
    cc.icon as category_icon,
    COALESCE(u.username, 'Anonymous') as username,
    COALESCE(u.full_name, 'Anonymous User') as full_name,
    u.avatar_url,
    CASE 
      WHEN auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM community_post_votes cpv 
        WHERE cpv.post_id = cp.id AND cpv.user_id = (
          SELECT id FROM users WHERE auth_user_id = auth.uid()
        )
      ) THEN true
      ELSE false
    END as user_voted
  FROM community_posts cp
  LEFT JOIN community_categories cc ON cp.category_id = cc.id
  LEFT JOIN users u ON cp.user_id = u.id
  WHERE 
    cp.is_published = true 
    AND cp.is_deleted = false
    AND (category_filter IS NULL OR cp.category_id = category_filter)
  ORDER BY cp.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION create_community_post(
  post_title text,
  post_content text,
  post_category_id bigint,
  post_hashtags text[] DEFAULT '{}'::text[]
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  new_post_id bigint;
BEGIN
  -- Get or create user
  SELECT id INTO current_user_id 
  FROM users 
  WHERE auth_user_id = auth.uid();
  
  -- If user doesn't exist, create them
  IF current_user_id IS NULL THEN
    INSERT INTO users (
      id,
      auth_user_id,
      email,
      username,
      full_name,
      coins,
      tier,
      is_active,
      is_verified,
      reputation_score,
      created_at,
      updated_at
    )
    SELECT 
      gen_random_uuid(),
      auth.uid(),
      au.email,
      COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)),
      COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
      0,
      'free',
      true,
      false,
      0,
      NOW(),
      NOW()
    FROM auth.users au
    WHERE au.id = auth.uid()
    RETURNING id INTO current_user_id;
  END IF;
  
  -- Create the post
  INSERT INTO community_posts (
    title,
    content,
    user_id,
    category_id,
    hashtags,
    vote_count,
    comment_count,
    is_published,
    is_deleted,
    created_at,
    updated_at
  )
  VALUES (
    post_title,
    post_content,
    current_user_id,
    post_category_id,
    post_hashtags,
    0,
    0,
    true,
    false,
    NOW(),
    NOW()
  )
  RETURNING id INTO new_post_id;
  
  RETURN new_post_id;
END;
$$;

CREATE OR REPLACE FUNCTION toggle_post_vote(post_id_param bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  vote_exists boolean;
BEGIN
  -- Get or create user
  SELECT id INTO current_user_id 
  FROM users 
  WHERE auth_user_id = auth.uid();
  
  -- If user doesn't exist, create them
  IF current_user_id IS NULL THEN
    INSERT INTO users (
      id,
      auth_user_id,
      email,
      username,
      full_name,
      coins,
      tier,
      is_active,
      is_verified,
      reputation_score,
      created_at,
      updated_at
    )
    SELECT 
      gen_random_uuid(),
      auth.uid(),
      au.email,
      COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)),
      COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
      0,
      'free',
      true,
      false,
      0,
      NOW(),
      NOW()
    FROM auth.users au
    WHERE au.id = auth.uid()
    RETURNING id INTO current_user_id;
  END IF;
  
  -- Check if vote exists
  SELECT EXISTS (
    SELECT 1 FROM community_post_votes 
    WHERE post_id = post_id_param AND user_id = current_user_id
  ) INTO vote_exists;
  
  IF vote_exists THEN
    -- Remove vote
    DELETE FROM community_post_votes 
    WHERE post_id = post_id_param AND user_id = current_user_id;
    
    -- Update post vote count
    UPDATE community_posts 
    SET vote_count = vote_count - 1 
    WHERE id = post_id_param;
    
    RETURN false;
  ELSE
    -- Add vote
    INSERT INTO community_post_votes (post_id, user_id, created_at)
    VALUES (post_id_param, current_user_id, NOW());
    
    -- Update post vote count
    UPDATE community_posts 
    SET vote_count = vote_count + 1 
    WHERE id = post_id_param;
    
    RETURN true;
  END IF;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_community_posts_with_user_data TO authenticated;
GRANT EXECUTE ON FUNCTION create_community_post TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_post_vote TO authenticated;
