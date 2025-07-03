-- SAFE FINAL MIGRATION - Handles existing data
-- This script safely migrates existing community data

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    CREATE TABLE public.users (
      id BIGSERIAL PRIMARY KEY,
      auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      username TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT,
      avatar_url TEXT,
      tier TEXT DEFAULT 'grassroot',
      bio TEXT,
      location TEXT,
      coins BIGINT DEFAULT 1000,
      reputation_score INTEGER DEFAULT 0,
      posts_count INTEGER DEFAULT 0,
      followers_count INTEGER DEFAULT 0,
      following_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- Add missing columns to existing users table
DO $$
BEGIN
  -- Add auth_user_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'auth_user_id') THEN
    ALTER TABLE public.users ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  -- Add other missing columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tier') THEN
    ALTER TABLE public.users ADD COLUMN tier TEXT DEFAULT 'grassroot';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'coins') THEN
    ALTER TABLE public.users ADD COLUMN coins BIGINT DEFAULT 1000;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'reputation_score') THEN
    ALTER TABLE public.users ADD COLUMN reputation_score INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'posts_count') THEN
    ALTER TABLE public.users ADD COLUMN posts_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'followers_count') THEN
    ALTER TABLE public.users ADD COLUMN followers_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'following_count') THEN
    ALTER TABLE public.users ADD COLUMN following_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create community_posts table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'community_posts') THEN
    CREATE TABLE public.community_posts (
      id SERIAL PRIMARY KEY,
      user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
      category_id INTEGER REFERENCES public.community_categories(id),
      content TEXT NOT NULL,
      media_url TEXT,
      media_type TEXT,
      hashtags TEXT[] DEFAULT '{}',
      vote_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      is_published BOOLEAN DEFAULT true,
      is_deleted BOOLEAN DEFAULT false,
      is_edited BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- Add missing columns to existing community_posts table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_posts' AND column_name = 'hashtags') THEN
    ALTER TABLE public.community_posts ADD COLUMN hashtags TEXT[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_posts' AND column_name = 'vote_count') THEN
    ALTER TABLE public.community_posts ADD COLUMN vote_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_posts' AND column_name = 'comment_count') THEN
    ALTER TABLE public.community_posts ADD COLUMN comment_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_posts' AND column_name = 'view_count') THEN
    ALTER TABLE public.community_posts ADD COLUMN view_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_posts' AND column_name = 'is_published') THEN
    ALTER TABLE public.community_posts ADD COLUMN is_published BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_posts' AND column_name = 'is_deleted') THEN
    ALTER TABLE public.community_posts ADD COLUMN is_deleted BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_posts' AND column_name = 'is_edited') THEN
    ALTER TABLE public.community_posts ADD COLUMN is_edited BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create post_votes table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'post_votes') THEN
    CREATE TABLE public.post_votes (
      id SERIAL PRIMARY KEY,
      post_id INTEGER REFERENCES public.community_posts(id) ON DELETE CASCADE,
      user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(post_id, user_id)
    );
  END IF;
END $$;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, username, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to handle post voting
CREATE OR REPLACE FUNCTION public.vote_on_post(p_post_id INTEGER, p_user_id BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
  vote_exists BOOLEAN;
  post_owner_id BIGINT;
  user_coins BIGINT;
BEGIN
  -- Check if vote already exists
  SELECT EXISTS(
    SELECT 1 FROM public.post_votes 
    WHERE post_id = p_post_id AND user_id = p_user_id
  ) INTO vote_exists;
  
  -- Get post owner
  SELECT user_id INTO post_owner_id 
  FROM public.community_posts 
  WHERE id = p_post_id;
  
  -- Don't allow voting on own posts
  IF post_owner_id = p_user_id THEN
    RETURN FALSE;
  END IF;
  
  -- Get user's current coins
  SELECT coins INTO user_coins FROM public.users WHERE id = p_user_id;
  
  IF vote_exists THEN
    -- Remove vote
    DELETE FROM public.post_votes 
    WHERE post_id = p_post_id AND user_id = p_user_id;
    
    -- Update post vote count
    UPDATE public.community_posts 
    SET vote_count = vote_count - 1 
    WHERE id = p_post_id;
    
    -- Refund coins to voter
    UPDATE public.users 
    SET coins = coins + 100 
    WHERE id = p_user_id;
    
    -- Remove coins from post owner
    UPDATE public.users 
    SET coins = GREATEST(coins - 100, 0)
    WHERE id = post_owner_id;
    
    RETURN FALSE;
  ELSE
    -- Check if user has enough coins
    IF user_coins < 100 THEN
      RETURN FALSE;
    END IF;
    
    -- Add vote
    INSERT INTO public.post_votes (post_id, user_id) 
    VALUES (p_post_id, p_user_id);
    
    -- Update post vote count
    UPDATE public.community_posts 
    SET vote_count = vote_count + 1 
    WHERE id = p_post_id;
    
    -- Transfer coins from voter to post owner
    UPDATE public.users 
    SET coins = coins - 100 
    WHERE id = p_user_id;
    
    UPDATE public.users 
    SET coins = coins + 100 
    WHERE id = post_owner_id;
    
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can view published posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can vote on posts" ON public.post_votes;
DROP POLICY IF EXISTS "Users can view votes" ON public.post_votes;
DROP POLICY IF EXISTS "Users can remove own votes" ON public.post_votes;

-- Create RLS Policies
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Anyone can view published posts" ON public.community_posts FOR SELECT USING (is_published = true AND is_deleted = false);
CREATE POLICY "Users can create posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own posts" ON public.community_posts FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can vote on posts" ON public.post_votes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view votes" ON public.post_votes FOR SELECT USING (true);
CREATE POLICY "Users can remove own votes" ON public.post_votes FOR DELETE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON public.community_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_post_id ON public.post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON public.post_votes(user_id);

-- Sync existing auth users to public.users table
INSERT INTO public.users (auth_user_id, username, full_name, email, avatar_url, tier)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'username', SPLIT_PART(email, '@', 1)),
  COALESCE(raw_user_meta_data->>'full_name', email),
  email,
  raw_user_meta_data->>'avatar_url',
  'grassroot'
FROM auth.users
WHERE id NOT IN (SELECT auth_user_id FROM public.users WHERE auth_user_id IS NOT NULL);

-- Update existing users with auth_user_id if missing
UPDATE public.users 
SET auth_user_id = (
  SELECT id FROM auth.users 
  WHERE email = users.email 
  LIMIT 1
)
WHERE auth_user_id IS NULL AND email IS NOT NULL;
