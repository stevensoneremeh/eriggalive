-- =====================================================
-- COMPREHENSIVE BACKEND FIX - FINAL SOLUTION
-- =====================================================
-- This script ensures complete integration between Supabase auth and community features
-- Handles email column, user migration, and all backend components

-- Step 1: Create proper public.users table with email integration
CREATE TABLE IF NOT EXISTS public.users (
    id bigint primary key generated always as identity,
    auth_user_id uuid unique not null references auth.users(id) on delete cascade,
    email text not null,
    username text unique not null check (length(username) >= 3 and length(username) <= 30),
    full_name text not null check (length(full_name) >= 2),
    avatar_url text,
    tier text default 'grassroot' check (tier in ('grassroot', 'pioneer', 'elder', 'blood_brotherhood', 'admin')),
    level integer default 1 check (level >= 1 and level <= 100),
    points integer default 0 check (points >= 0),
    coins bigint default 100 check (coins >= 0),
    bio text check (length(bio) <= 500),
    location text,
    is_verified boolean default false,
    is_active boolean default true,
    posts_count integer default 0,
    followers_count integer default 0,
    following_count integer default 0,
    reputation_score integer default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_tier ON public.users(tier);

-- Step 3: Create community tables with proper relationships
CREATE TABLE IF NOT EXISTS public.community_categories (
    id bigint primary key generated always as identity,
    name text unique not null,
    slug text unique not null,
    description text,
    icon text default '💬',
    color text default '#3B82F6',
    post_count integer default 0,
    display_order integer default 0,
    is_active boolean default true,
    created_at timestamp with time zone default now()
);

CREATE TABLE IF NOT EXISTS public.community_posts (
    id bigint primary key generated always as identity,
    user_id bigint not null references public.users(id) on delete cascade,
    category_id bigint not null references public.community_categories(id),
    content text not null check (length(content) >= 1 and length(content) <= 5000),
    hashtags text[] default '{}',
    vote_count integer default 0,
    comment_count integer default 0,
    view_count integer default 0,
    is_published boolean default true,
    is_featured boolean default false,
    is_deleted boolean default false,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

CREATE TABLE IF NOT EXISTS public.community_post_votes (
    id bigint primary key generated always as identity,
    post_id bigint not null references public.community_posts(id) on delete cascade,
    user_id bigint not null references public.users(id) on delete cascade,
    created_at timestamp with time zone default now(),
    unique(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.community_comments (
    id bigint primary key generated always as identity,
    post_id bigint not null references public.community_posts(id) on delete cascade,
    user_id bigint not null references public.users(id) on delete cascade,
    parent_comment_id bigint references public.community_comments(id),
    content text not null check (length(content) >= 1 and length(content) <= 2000),
    like_count integer default 0,
    reply_count integer default 0,
    is_deleted boolean default false,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Step 4: Create user follows table
CREATE TABLE IF NOT EXISTS public.user_follows (
    id bigint primary key generated always as identity,
    follower_id bigint not null references public.users(id) on delete cascade,
    following_id bigint not null references public.users(id) on delete cascade,
    created_at timestamp with time zone default now(),
    unique(follower_id, following_id),
    check(follower_id != following_id)
);

-- Step 5: Create bookmarks table
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
    id bigint primary key generated always as identity,
    user_id bigint not null references public.users(id) on delete cascade,
    post_id bigint not null references public.community_posts(id) on delete cascade,
    created_at timestamp with time zone default now(),
    unique(user_id, post_id)
);

-- Step 6: Create hashtags table
CREATE TABLE IF NOT EXISTS public.hashtags (
    id bigint primary key generated always as identity,
    name text unique not null,
    usage_count integer default 1,
    is_trending boolean default false,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Step 7: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category_id ON public.community_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at desc);
CREATE INDEX IF NOT EXISTS idx_community_post_votes_post_id ON public.community_post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_votes_user_id ON public.community_post_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON public.community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON public.user_follows(following_id);

-- Step 8: Create automatic user sync function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    auth_user_id,
    email,
    username,
    full_name,
    avatar_url
  ) VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(COALESCE(NEW.email, 'user'), '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, 'User'), '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create trigger for automatic user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 10: Migrate existing auth users to public.users
INSERT INTO public.users (auth_user_id, email, username, full_name, avatar_url, created_at)
SELECT 
  au.id,
  COALESCE(au.email, ''),
  COALESCE(au.raw_user_meta_data->>'username', split_part(COALESCE(au.email, 'user' || au.id::text), '@', 1)),
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(COALESCE(au.email, 'User'), '@', 1)),
  au.raw_user_meta_data->>'avatar_url',
  au.created_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.auth_user_id = au.id
)
ON CONFLICT (auth_user_id) DO NOTHING;

-- Step 11: Create vote handling function
CREATE OR REPLACE FUNCTION public.handle_post_vote(
  p_post_id bigint,
  p_voter_auth_id uuid,
  p_coin_amount integer DEFAULT 100
)
RETURNS boolean AS $$
DECLARE
  v_voter_id bigint;
  v_post_creator_id bigint;
  v_existing_vote_id bigint;
BEGIN
  -- Get voter's internal ID
  SELECT id INTO v_voter_id 
  FROM public.users 
  WHERE auth_user_id = p_voter_auth_id;
  
  IF v_voter_id IS NULL THEN
    RAISE EXCEPTION 'Voter not found';
  END IF;
  
  -- Get post creator's ID
  SELECT user_id INTO v_post_creator_id 
  FROM public.community_posts 
  WHERE id = p_post_id;
  
  IF v_post_creator_id IS NULL THEN
    RAISE EXCEPTION 'Post not found';
  END IF;
  
  -- Check if user already voted
  SELECT id INTO v_existing_vote_id 
  FROM public.community_post_votes 
  WHERE post_id = p_post_id AND user_id = v_voter_id;
  
  IF v_existing_vote_id IS NOT NULL THEN
    -- Remove vote
    DELETE FROM public.community_post_votes WHERE id = v_existing_vote_id;
    
    -- Update post vote count
    UPDATE public.community_posts 
    SET vote_count = vote_count - 1 
    WHERE id = p_post_id;
    
    RETURN false;
  ELSE
    -- Add vote
    INSERT INTO public.community_post_votes (post_id, user_id) 
    VALUES (p_post_id, v_voter_id);
    
    -- Update post vote count
    UPDATE public.community_posts 
    SET vote_count = vote_count + 1 
    WHERE id = p_post_id;
    
    -- Transfer coins to post creator (if different user)
    IF v_voter_id != v_post_creator_id THEN
      UPDATE public.users 
      SET coins = coins + p_coin_amount,
          reputation_score = reputation_score + 10
      WHERE id = v_post_creator_id;
    END IF;
    
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Create update triggers for stats
CREATE OR REPLACE FUNCTION public.update_user_stats()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update post count
    UPDATE public.users 
    SET posts_count = posts_count + 1,
        updated_at = now()
    WHERE id = NEW.user_id;
    
    -- Update category post count
    UPDATE public.community_categories 
    SET post_count = post_count + 1 
    WHERE id = NEW.category_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Update post count
    UPDATE public.users 
    SET posts_count = posts_count - 1,
        updated_at = now()
    WHERE id = OLD.user_id;
    
    -- Update category post count
    UPDATE public.community_categories 
    SET post_count = post_count - 1 
    WHERE id = OLD.category_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_user_stats_on_post ON public.community_posts;
CREATE TRIGGER update_user_stats_on_post
  AFTER INSERT OR DELETE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_user_stats();

-- Step 13: Insert default categories
INSERT INTO public.community_categories (name, slug, description, icon, color, display_order) VALUES
('General Discussion', 'general', 'General discussions about Erigga and his music', '💬', '#3B82F6', 1),
('Music Analysis', 'music', 'Deep dives into Erigga''s lyrics and music', '🎵', '#10B981', 2),
('Fan Art', 'art', 'Share your Erigga-inspired artwork', '🎨', '#F59E0B', 3),
('Events', 'events', 'Discussions about Erigga''s concerts and appearances', '🎤', '#EF4444', 4),
('Bars & Freestyles', 'bars', 'Share your bars and freestyle videos', '🔥', '#8B5CF6', 5),
('News & Updates', 'news', 'Latest news and updates about Erigga', '📰', '#06B6D4', 6),
('Community Support', 'support', 'Help and support for community members', '🤝', '#84CC16', 7)
ON CONFLICT (name) DO NOTHING;

-- Step 14: Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;

-- Step 15: Create RLS policies
-- Users policies
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = auth_user_id);

-- Categories policies
CREATE POLICY "Anyone can view categories" ON public.community_categories FOR SELECT USING (is_active = true);

-- Posts policies
CREATE POLICY "Anyone can view published posts" ON public.community_posts FOR SELECT USING (is_published = true AND is_deleted = false);
CREATE POLICY "Authenticated users can create posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own posts" ON public.community_posts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = community_posts.user_id)
);
CREATE POLICY "Users can delete own posts" ON public.community_posts FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = community_posts.user_id)
);

-- Votes policies
CREATE POLICY "Anyone can view votes" ON public.community_post_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON public.community_post_votes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own votes" ON public.community_post_votes FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = community_post_votes.user_id)
);

-- Comments policies
CREATE POLICY "Anyone can view comments" ON public.community_comments FOR SELECT USING (is_deleted = false);
CREATE POLICY "Authenticated users can create comments" ON public.community_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own comments" ON public.community_comments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = community_comments.user_id)
);

-- Follows policies
CREATE POLICY "Anyone can view follows" ON public.user_follows FOR SELECT USING (true);
CREATE POLICY "Authenticated users can follow" ON public.user_follows FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage own follows" ON public.user_follows FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = user_follows.follower_id)
);

-- Bookmarks policies
CREATE POLICY "Users can view own bookmarks" ON public.user_bookmarks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = user_bookmarks.user_id)
);
CREATE POLICY "Users can create bookmarks" ON public.user_bookmarks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own bookmarks" ON public.user_bookmarks FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid() AND id = user_bookmarks.user_id)
);

-- Hashtags policies
CREATE POLICY "Anyone can view hashtags" ON public.hashtags FOR SELECT USING (true);

-- Step 16: Create sample posts for testing
DO $$
DECLARE
  sample_user_id bigint;
  general_category_id bigint;
BEGIN
  -- Get a sample user ID
  SELECT id INTO sample_user_id FROM public.users LIMIT 1;
  
  -- Get general category ID
  SELECT id INTO general_category_id FROM public.community_categories WHERE slug = 'general';
  
  -- Insert sample posts if user exists
  IF sample_user_id IS NOT NULL AND general_category_id IS NOT NULL THEN
    INSERT INTO public.community_posts (user_id, category_id, content, hashtags) VALUES
    (sample_user_id, general_category_id, 'Welcome to the Erigga community! 🎵 Let''s share our love for real music and authentic bars. #EriggaMovement #PaperBoi', ARRAY['EriggaMovement', 'PaperBoi']),
    (sample_user_id, general_category_id, 'Just listened to "The Erigma" album again. The storytelling is incredible! What''s your favorite track? #TheErigma #NigerianHipHop', ARRAY['TheErigma', 'NigerianHipHop'])
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Step 17: Final verification
DO $$
BEGIN
  RAISE NOTICE 'Backend setup completed successfully!';
  RAISE NOTICE 'Users table: % rows', (SELECT COUNT(*) FROM public.users);
  RAISE NOTICE 'Categories: % rows', (SELECT COUNT(*) FROM public.community_categories);
  RAISE NOTICE 'Posts: % rows', (SELECT COUNT(*) FROM public.community_posts);
  RAISE NOTICE 'Email integration: ACTIVE';
  RAISE NOTICE 'Authentication sync: ACTIVE';
  RAISE NOTICE 'RLS policies: ENABLED';
END $$;
