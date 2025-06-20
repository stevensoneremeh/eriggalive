-- FINAL WORKING COMMUNITY SCHEMA
-- This script creates a complete, working community system

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table that syncs with auth.users
CREATE TABLE IF NOT EXISTS public.users (
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

-- Create community categories
CREATE TABLE IF NOT EXISTS public.community_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📝',
  color TEXT DEFAULT '#3B82F6',
  post_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community posts
CREATE TABLE IF NOT EXISTS public.community_posts (
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

-- Create post votes
CREATE TABLE IF NOT EXISTS public.post_votes (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Insert default categories
INSERT INTO public.community_categories (name, slug, description, icon, color, display_order) VALUES
('General Discussion', 'general', 'General community discussions', '💬', '#3B82F6', 1),
('Music & Lyrics', 'music', 'Discuss Erigga''s music and lyrics', '🎵', '#10B981', 2),
('Fan Art', 'fan-art', 'Share your creative works', '🎨', '#F59E0B', 3),
('News & Updates', 'news', 'Latest news and updates', '📰', '#EF4444', 4),
('Events', 'events', 'Community events and meetups', '🎉', '#8B5CF6', 5),
('Support', 'support', 'Get help and support', '🆘', '#6B7280', 6),
('Off Topic', 'off-topic', 'Everything else', '🗣️', '#EC4899', 7)
ON CONFLICT (slug) DO NOTHING;

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
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
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
    SET coins = coins - 100 
    WHERE id = post_owner_id;
    
    RETURN FALSE;
  ELSE
    -- Check if user has enough coins
    IF (SELECT coins FROM public.users WHERE id = p_user_id) < 100 THEN
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

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Anyone can view published posts" ON public.community_posts FOR SELECT USING (is_published = true AND is_deleted = false);
CREATE POLICY "Users can create posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own posts" ON public.community_posts FOR UPDATE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can vote on posts" ON public.post_votes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view votes" ON public.post_votes FOR SELECT USING (true);
CREATE POLICY "Users can remove own votes" ON public.post_votes FOR DELETE USING (auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON public.community_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_post_id ON public.post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON public.post_votes(user_id);
