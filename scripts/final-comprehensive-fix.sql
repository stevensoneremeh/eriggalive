
-- =====================================================
-- FINAL COMPREHENSIVE FIX - One Time Only
-- =====================================================
-- This script fixes table conflicts and updates tier naming

-- Step 1: Drop existing tables if they exist to avoid conflicts
DROP TABLE IF EXISTS public.community_comment_likes CASCADE;
DROP TABLE IF EXISTS public.community_post_votes CASCADE;
DROP TABLE IF EXISTS public.community_comments CASCADE;
DROP TABLE IF EXISTS public.community_posts CASCADE;
DROP TABLE IF EXISTS public.community_categories CASCADE;

-- Step 2: Drop and recreate users table with proper tier enum
DROP TYPE IF EXISTS user_tier CASCADE;
CREATE TYPE user_tier AS ENUM ('erigga_citizen', 'erigga_indigen', 'enterprise', 'admin');

-- Update users table to use new tier system
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Add temporary column
        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS new_tier user_tier DEFAULT 'erigga_citizen';
        
        -- Update existing data
        UPDATE public.users SET new_tier = CASE 
            WHEN tier = 'grassroot' OR tier = 'free' OR tier = 'Grassroot' OR tier = 'Free' THEN 'erigga_citizen'::user_tier
            WHEN tier = 'pioneer' OR tier = 'pro' OR tier = 'Pioneer' OR tier = 'Pro' THEN 'erigga_indigen'::user_tier
            WHEN tier = 'elder' OR tier = 'blood' OR tier = 'premium' OR tier = 'Elder' OR tier = 'Blood' OR tier = 'Premium' THEN 'enterprise'::user_tier
            WHEN tier = 'admin' OR tier = 'Admin' THEN 'admin'::user_tier
            ELSE 'erigga_citizen'::user_tier
        END;
        
        -- Drop old tier column and rename new one
        ALTER TABLE public.users DROP COLUMN IF EXISTS tier;
        ALTER TABLE public.users RENAME COLUMN new_tier TO tier;
    END IF;
END $$;

-- Step 3: Create community tables with proper structure
CREATE TABLE public.community_categories (
    id BIGSERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '💬',
    color TEXT DEFAULT '#3B82F6',
    post_count INTEGER DEFAULT 0 CHECK (post_count >= 0),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.community_posts (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES public.community_categories(id) ON DELETE RESTRICT,
    title TEXT,
    content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 10000),
    hashtags TEXT[] DEFAULT '{}',
    mentions UUID[] DEFAULT '{}',
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('image', 'video', 'audio')),
    media_metadata JSONB DEFAULT '{}',
    vote_count INTEGER DEFAULT 0 CHECK (vote_count >= 0),
    comment_count INTEGER DEFAULT 0 CHECK (comment_count >= 0),
    view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
    is_pinned BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.community_comments (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    parent_comment_id BIGINT REFERENCES public.community_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 2000),
    like_count INTEGER DEFAULT 0 CHECK (like_count >= 0),
    reply_count INTEGER DEFAULT 0 CHECK (reply_count >= 0),
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.community_post_votes (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    vote_type TEXT DEFAULT 'upvote' CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

CREATE TABLE public.community_comment_likes (
    id BIGSERIAL PRIMARY KEY,
    comment_id BIGINT NOT NULL REFERENCES public.community_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_tier ON public.users(tier);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category_id ON public.community_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_post_votes_post_id ON public.community_post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_votes_user_id ON public.community_post_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON public.community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_user_id ON public.community_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_community_comment_likes_comment_id ON public.community_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_community_comment_likes_user_id ON public.community_comment_likes(user_id);

-- Step 5: Insert default categories
INSERT INTO public.community_categories (name, slug, description, icon, color, display_order) VALUES
('General Discussion', 'general', 'General conversations about Erigga and music', '💬', '#3B82F6', 1),
('Music & Lyrics', 'music', 'Discuss Erigga''s music and lyrics', '🎵', '#8B5CF6', 2),
('Fan Art & Media', 'media', 'Share fan art, photos, and media', '🎨', '#10B981', 3),
('Events & News', 'events', 'Latest events and news updates', '📅', '#F59E0B', 4),
('Questions & Help', 'help', 'Ask questions and get help', '❓', '#EF4444', 5)
ON CONFLICT (slug) DO NOTHING;

-- Step 6: Create or replace automatic user creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.users (
        auth_user_id,
        username,
        full_name,
        email,
        avatar_url,
        tier
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url',
        'erigga_citizen'::user_tier
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create user profile: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Step 7: Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 8: Enable RLS and create policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comment_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view public profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Anyone can view categories" ON public.community_categories;
DROP POLICY IF EXISTS "Anyone can view published posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.community_posts;
DROP POLICY IF EXISTS "Anyone can view votes" ON public.community_post_votes;
DROP POLICY IF EXISTS "Users can create votes" ON public.community_post_votes;
DROP POLICY IF EXISTS "Users can delete own votes" ON public.community_post_votes;
DROP POLICY IF EXISTS "Anyone can view comments" ON public.community_comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.community_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.community_comments;
DROP POLICY IF EXISTS "Anyone can view comment likes" ON public.community_comment_likes;
DROP POLICY IF EXISTS "Users can create comment likes" ON public.community_comment_likes;
DROP POLICY IF EXISTS "Users can delete own comment likes" ON public.community_comment_likes;

-- Create RLS policies
CREATE POLICY "Users can view public profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = auth_user_id);
CREATE POLICY "Enable insert for authenticated users" ON public.users FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Anyone can view categories" ON public.community_categories FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view published posts" ON public.community_posts FOR SELECT USING (is_published = true AND is_deleted = false);
CREATE POLICY "Users can create posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own posts" ON public.community_posts FOR UPDATE USING (
    auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
);

CREATE POLICY "Anyone can view votes" ON public.community_post_votes FOR SELECT USING (true);
CREATE POLICY "Users can create votes" ON public.community_post_votes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own votes" ON public.community_post_votes FOR DELETE USING (
    auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
);

CREATE POLICY "Anyone can view comments" ON public.community_comments FOR SELECT USING (is_deleted = false);
CREATE POLICY "Users can create comments" ON public.community_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own comments" ON public.community_comments FOR UPDATE USING (
    auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
);

CREATE POLICY "Anyone can view comment likes" ON public.community_comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can create comment likes" ON public.community_comment_likes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own comment likes" ON public.community_comment_likes FOR DELETE USING (
    auth.uid() = (SELECT auth_user_id FROM public.users WHERE id = user_id)
);

-- Step 9: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 10: Update any remaining tier references in other tables
UPDATE public.users SET tier = 'erigga_citizen' WHERE tier::text ILIKE '%grassroot%' OR tier::text ILIKE '%free%';

-- Final confirmation
SELECT 'Database tables recreated and tier system updated successfully!' as status;
