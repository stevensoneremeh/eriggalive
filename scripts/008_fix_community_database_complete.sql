-- Drop existing functions if they exist to avoid conflicts
DROP FUNCTION IF EXISTS get_community_posts_with_user_data(bigint);
DROP FUNCTION IF EXISTS create_community_post(text, text, bigint, text[]);
DROP FUNCTION IF EXISTS toggle_post_vote(bigint);
DROP FUNCTION IF EXISTS create_comment(bigint, text, bigint);
DROP FUNCTION IF EXISTS toggle_comment_like(bigint);

-- Create or update users function to handle auth user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    auth_user_id,
    email,
    full_name,
    username,
    avatar_url,
    tier,
    coins,
    reputation_score,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    'Free',
    0,
    0,
    true,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to get community posts with user data
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
) AS $$
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
    u.username,
    u.full_name,
    u.avatar_url,
    CASE 
      WHEN auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM community_post_votes cpv 
        WHERE cpv.post_id = cp.id AND cpv.user_id = auth.uid()
      ) THEN true
      ELSE false
    END as user_voted
  FROM community_posts cp
  JOIN users u ON cp.user_id = u.id
  JOIN community_categories cc ON cp.category_id = cc.id
  WHERE cp.is_published = true 
    AND cp.is_deleted = false
    AND (category_filter IS NULL OR cp.category_id = category_filter)
  ORDER BY cp.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create community post
CREATE OR REPLACE FUNCTION create_community_post(
  post_title text,
  post_content text,
  post_category_id bigint,
  post_hashtags text[] DEFAULT '{}'
)
RETURNS bigint AS $$
DECLARE
  new_post_id bigint;
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Ensure user exists in users table
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = current_user_id) THEN
    -- Create user record if it doesn't exist
    INSERT INTO users (
      id,
      auth_user_id,
      email,
      full_name,
      username,
      tier,
      coins,
      reputation_score,
      is_active,
      created_at,
      updated_at
    )
    SELECT 
      au.id,
      au.id,
      au.email,
      COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
      COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)),
      'Free',
      0,
      0,
      true,
      NOW(),
      NOW()
    FROM auth.users au
    WHERE au.id = current_user_id;
  END IF;

  -- Insert the post
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle post vote
CREATE OR REPLACE FUNCTION toggle_post_vote(post_id_param bigint)
RETURNS boolean AS $$
DECLARE
  current_user_id uuid;
  vote_exists boolean;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
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
    
    -- Decrease vote count
    UPDATE community_posts 
    SET vote_count = vote_count - 1,
        updated_at = NOW()
    WHERE id = post_id_param;
    
    RETURN false;
  ELSE
    -- Add vote
    INSERT INTO community_post_votes (post_id, user_id, created_at)
    VALUES (post_id_param, current_user_id, NOW());
    
    -- Increase vote count
    UPDATE community_posts 
    SET vote_count = vote_count + 1,
        updated_at = NOW()
    WHERE id = post_id_param;
    
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create comment
CREATE OR REPLACE FUNCTION create_comment(
  comment_post_id bigint,
  comment_content text,
  parent_comment_id bigint DEFAULT NULL
)
RETURNS bigint AS $$
DECLARE
  new_comment_id bigint;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Insert comment
  INSERT INTO community_comments (
    post_id,
    user_id,
    content,
    parent_comment_id,
    like_count,
    is_deleted,
    created_at,
    updated_at
  )
  VALUES (
    comment_post_id,
    current_user_id,
    comment_content,
    parent_comment_id,
    0,
    false,
    NOW(),
    NOW()
  )
  RETURNING id INTO new_comment_id;

  -- Update post comment count
  UPDATE community_posts 
  SET comment_count = comment_count + 1,
      updated_at = NOW()
  WHERE id = comment_post_id;

  RETURN new_comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle comment like
CREATE OR REPLACE FUNCTION toggle_comment_like(comment_id_param bigint)
RETURNS boolean AS $$
DECLARE
  current_user_id uuid;
  like_exists boolean;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Check if like exists
  SELECT EXISTS (
    SELECT 1 FROM community_comment_likes 
    WHERE comment_id = comment_id_param AND user_id = current_user_id
  ) INTO like_exists;

  IF like_exists THEN
    -- Remove like
    DELETE FROM community_comment_likes 
    WHERE comment_id = comment_id_param AND user_id = current_user_id;
    
    -- Decrease like count
    UPDATE community_comments 
    SET like_count = like_count - 1,
        updated_at = NOW()
    WHERE id = comment_id_param;
    
    RETURN false;
  ELSE
    -- Add like
    INSERT INTO community_comment_likes (comment_id, user_id, created_at)
    VALUES (comment_id_param, current_user_id, NOW());
    
    -- Increase like count
    UPDATE community_comments 
    SET like_count = like_count + 1,
        updated_at = NOW()
    WHERE id = comment_id_param;
    
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default categories if they don't exist
INSERT INTO community_categories (name, slug, description, color, icon, display_order, is_active, created_at)
VALUES 
  ('General Discussion', 'general', 'General conversations and discussions', '#3B82F6', 'users', 1, true, NOW()),
  ('Music & Lyrics', 'music', 'Discuss Erigga''s music and lyrics', '#8B5CF6', 'music', 2, true, NOW()),
  ('Fan Art & Media', 'media', 'Share fan art, photos, and media', '#10B981', 'image', 3, true, NOW()),
  ('Events & News', 'events', 'Latest events and news updates', '#F59E0B', 'calendar', 4, true, NOW()),
  ('Questions & Help', 'help', 'Ask questions and get help', '#EF4444', 'help-circle', 5, true, NOW())
ON CONFLICT (slug) DO NOTHING;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_community_posts_with_user_data(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION create_community_post(text, text, bigint, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_post_vote(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION create_comment(bigint, text, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_comment_like(bigint) TO authenticated;

-- Enable RLS on all community tables
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_posts
DROP POLICY IF EXISTS "Anyone can view published posts" ON community_posts;
CREATE POLICY "Anyone can view published posts" ON community_posts
  FOR SELECT USING (is_published = true AND is_deleted = false);

DROP POLICY IF EXISTS "Users can create posts" ON community_posts;
CREATE POLICY "Users can create posts" ON community_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own posts" ON community_posts;
CREATE POLICY "Users can update own posts" ON community_posts
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for community_categories
DROP POLICY IF EXISTS "Anyone can view categories" ON community_categories;
CREATE POLICY "Anyone can view categories" ON community_categories
  FOR SELECT USING (is_active = true);

-- RLS Policies for community_post_votes
DROP POLICY IF EXISTS "Users can view all votes" ON community_post_votes;
CREATE POLICY "Users can view all votes" ON community_post_votes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create votes" ON community_post_votes;
CREATE POLICY "Users can create votes" ON community_post_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own votes" ON community_post_votes;
CREATE POLICY "Users can delete own votes" ON community_post_votes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for community_comments
DROP POLICY IF EXISTS "Anyone can view comments" ON community_comments;
CREATE POLICY "Anyone can view comments" ON community_comments
  FOR SELECT USING (is_deleted = false);

DROP POLICY IF EXISTS "Users can create comments" ON community_comments;
CREATE POLICY "Users can create comments" ON community_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON community_comments;
CREATE POLICY "Users can update own comments" ON community_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for community_comment_likes
DROP POLICY IF EXISTS "Users can view all comment likes" ON community_comment_likes;
CREATE POLICY "Users can view all comment likes" ON community_comment_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create comment likes" ON community_comment_likes;
CREATE POLICY "Users can create comment likes" ON community_comment_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comment likes" ON community_comment_likes;
CREATE POLICY "Users can delete own comment likes" ON community_comment_likes
  FOR DELETE USING (auth.uid() = user_id);
