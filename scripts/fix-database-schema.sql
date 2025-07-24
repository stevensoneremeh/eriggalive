-- Fix database schema to match the codebase expectations
-- This script will create the missing tables and fix relationships

-- First, ensure we have the users table with proper structure
CREATE TABLE IF NOT EXISTS public.users (
    id BIGSERIAL PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    email TEXT NOT NULL,
    avatar_url TEXT,
    tier TEXT DEFAULT 'grassroot' CHECK (tier IN ('grassroot', 'pioneer', 'elder', 'blood_brotherhood', 'blood')),
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin', 'super_admin')),
    level INTEGER DEFAULT 1,
    points INTEGER DEFAULT 0,
    coins_balance INTEGER DEFAULT 100,
    subscription_tier TEXT DEFAULT 'grassroot',
    bio TEXT,
    location TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community categories table
CREATE TABLE IF NOT EXISTS public.community_categories (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '💬',
    color TEXT DEFAULT '#6B7280',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community posts table with proper foreign key relationships
CREATE TABLE IF NOT EXISTS public.community_posts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    category_id BIGINT REFERENCES public.community_categories(id) ON DELETE SET NULL,
    title TEXT,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'post',
    media_url TEXT,
    media_type TEXT,
    hashtags TEXT[] DEFAULT '{}',
    vote_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community post votes table
CREATE TABLE IF NOT EXISTS public.community_post_votes (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Create community comments table
CREATE TABLE IF NOT EXISTS public.community_comments (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    parent_id BIGINT REFERENCES public.community_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    vote_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community comment likes table
CREATE TABLE IF NOT EXISTS public.community_comment_likes (
    id BIGSERIAL PRIMARY KEY,
    comment_id BIGINT REFERENCES public.community_comments(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Insert default categories
INSERT INTO public.community_categories (name, slug, icon, color, display_order) VALUES
('General Discussion', 'general', '💬', '#6B7280', 1),
('Music & Bars', 'music', '🎵', '#3B82F6', 2),
('Events & Shows', 'events', '🎤', '#10B981', 3),
('Fan Art', 'fan-art', '🎨', '#8B5CF6', 4),
('News & Updates', 'news', '📰', '#F59E0B', 5)
ON CONFLICT (slug) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category_id ON public.community_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON public.community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_user_id ON public.community_comments(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_categories_updated_at ON public.community_categories;
CREATE TRIGGER update_community_categories_updated_at BEFORE UPDATE ON public.community_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_posts_updated_at ON public.community_posts;
CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON public.community_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_comments_updated_at ON public.community_comments;
CREATE TRIGGER update_community_comments_updated_at BEFORE UPDATE ON public.community_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comment_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can read all users but only update their own
CREATE POLICY "Users can view all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = auth_user_id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Categories are readable by all
CREATE POLICY "Categories are viewable by everyone" ON public.community_categories FOR SELECT USING (is_active = true);

-- Posts policies
CREATE POLICY "Posts are viewable by everyone" ON public.community_posts FOR SELECT USING (is_published = true AND is_deleted = false);
CREATE POLICY "Users can create posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() IN (SELECT auth_user_id FROM public.users WHERE id = user_id));
CREATE POLICY "Users can update own posts" ON public.community_posts FOR UPDATE USING (auth.uid() IN (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON public.community_comments FOR SELECT USING (is_deleted = false);
CREATE POLICY "Users can create comments" ON public.community_comments FOR INSERT WITH CHECK (auth.uid() IN (SELECT auth_user_id FROM public.users WHERE id = user_id));
CREATE POLICY "Users can update own comments" ON public.community_comments FOR UPDATE USING (auth.uid() IN (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Votes policies
CREATE POLICY "Users can view all votes" ON public.community_post_votes FOR SELECT USING (true);
CREATE POLICY "Users can create votes" ON public.community_post_votes FOR INSERT WITH CHECK (auth.uid() IN (SELECT auth_user_id FROM public.users WHERE id = user_id));
CREATE POLICY "Users can delete own votes" ON public.community_post_votes FOR DELETE USING (auth.uid() IN (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Comment likes policies
CREATE POLICY "Users can view all comment likes" ON public.community_comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can create comment likes" ON public.community_comment_likes FOR INSERT WITH CHECK (auth.uid() IN (SELECT auth_user_id FROM public.users WHERE id = user_id));
CREATE POLICY "Users can delete own comment likes" ON public.community_comment_likes FOR DELETE USING (auth.uid() IN (SELECT auth_user_id FROM public.users WHERE id = user_id));
