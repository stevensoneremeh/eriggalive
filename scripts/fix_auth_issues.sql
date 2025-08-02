-- Fix authentication and user profile issues

-- First, let's check for duplicate users
SELECT auth_user_id, COUNT(*) as count 
FROM users 
GROUP BY auth_user_id 
HAVING COUNT(*) > 1;

-- Remove duplicate user profiles (keep the first one created)
WITH duplicates AS (
  SELECT id, auth_user_id, 
         ROW_NUMBER() OVER (PARTITION BY auth_user_id ORDER BY created_at ASC) as rn
  FROM users
)
DELETE FROM users 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE users 
ADD CONSTRAINT users_auth_user_id_unique 
UNIQUE (auth_user_id);

-- Create or replace the trigger function for automatic user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Check if user profile already exists
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = NEW.id) THEN
    INSERT INTO public.users (
      auth_user_id,
      email,
      username,
      full_name,
      tier,
      coins,
      level,
      points,
      is_active,
      is_verified,
      is_banned
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      'grassroot',
      100,
      1,
      0,
      true,
      false,
      false
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create tables for community features if they don't exist
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Enable RLS on new tables
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all posts" ON community_posts FOR SELECT USING (NOT is_deleted);
CREATE POLICY "Users can create posts" ON community_posts FOR INSERT WITH CHECK (auth.uid()::text = author_id::text);
CREATE POLICY "Users can update own posts" ON community_posts FOR UPDATE USING (auth.uid()::text = author_id::text);

CREATE POLICY "Users can view all likes" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Users can manage own likes" ON post_likes FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view all comments" ON post_comments FOR SELECT USING (NOT is_deleted);
CREATE POLICY "Users can create comments" ON post_comments FOR INSERT WITH CHECK (auth.uid()::text = author_id::text);
CREATE POLICY "Users can update own comments" ON post_comments FOR UPDATE USING (auth.uid()::text = author_id::text);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_posts_author_id ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_author_id ON post_comments(author_id);

-- Grant necessary permissions
GRANT ALL ON community_posts TO authenticated;
GRANT ALL ON post_likes TO authenticated;
GRANT ALL ON post_comments TO authenticated;

-- Update existing users to ensure they have proper default values
UPDATE users 
SET 
  coins = COALESCE(coins, 100),
  level = COALESCE(level, 1),
  points = COALESCE(points, 0),
  tier = COALESCE(tier, 'grassroot'),
  is_active = COALESCE(is_active, true),
  is_verified = COALESCE(is_verified, false),
  is_banned = COALESCE(is_banned, false)
WHERE coins IS NULL OR level IS NULL OR points IS NULL OR tier IS NULL;
