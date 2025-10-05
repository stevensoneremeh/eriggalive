-- Fix RLS policies to prevent infinite recursion
-- This script addresses authentication and authorization issues

-- First, disable RLS temporarily to make changes
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on auth_user_id" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;

-- Create new, safe RLS policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = auth_user_id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = auth_user_id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = auth_user_id);

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Fix community posts policies
ALTER TABLE community_posts DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view posts" ON community_posts;
DROP POLICY IF EXISTS "Users can create posts" ON community_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON community_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON community_posts;

CREATE POLICY "Anyone can view active posts" ON community_posts
  FOR SELECT USING (is_deleted = false);

CREATE POLICY "Authenticated users can create posts" ON community_posts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own posts" ON community_posts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid()::text 
      AND users.id = community_posts.user_id
    )
  );

CREATE POLICY "Users can delete own posts" ON community_posts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid()::text 
      AND users.id = community_posts.user_id
    )
  );

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- Fix community comments policies
ALTER TABLE community_comments DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view comments" ON community_comments;
DROP POLICY IF EXISTS "Users can create comments" ON community_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON community_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON community_comments;

CREATE POLICY "Anyone can view active comments" ON community_comments
  FOR SELECT USING (is_deleted = false);

CREATE POLICY "Authenticated users can create comments" ON community_comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own comments" ON community_comments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid()::text 
      AND users.id = community_comments.user_id
    )
  );

CREATE POLICY "Users can delete own comments" ON community_comments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid()::text 
      AND users.id = community_comments.user_id
    )
  );

ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

-- Fix community categories (public read)
ALTER TABLE community_categories DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view categories" ON community_categories;

CREATE POLICY "Anyone can view active categories" ON community_categories
  FOR SELECT USING (is_active = true);

ALTER TABLE community_categories ENABLE ROW LEVEL SECURITY;

-- Fix community post votes
ALTER TABLE community_post_votes DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view votes" ON community_post_votes;
DROP POLICY IF EXISTS "Users can create votes" ON community_post_votes;
DROP POLICY IF EXISTS "Users can update own votes" ON community_post_votes;
DROP POLICY IF EXISTS "Users can delete own votes" ON community_post_votes;

CREATE POLICY "Users can view all votes" ON community_post_votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create votes" ON community_post_votes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own votes" ON community_post_votes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid()::text 
      AND users.id = community_post_votes.user_id
    )
  );

CREATE POLICY "Users can delete own votes" ON community_post_votes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.auth_user_id = auth.uid()::text 
      AND users.id = community_post_votes.user_id
    )
  );

ALTER TABLE community_post_votes ENABLE ROW LEVEL SECURITY;

-- Ensure the user creation trigger exists and works properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, email, username, full_name)
  VALUES (
    new.id::text,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
