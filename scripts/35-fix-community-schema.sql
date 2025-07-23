-- Fix Community Schema - Add missing columns and ensure proper structure
-- This script fixes the community_posts table and ensures all required columns exist

-- First, let's check if the community_posts table exists and add missing columns
DO $$
BEGIN
    -- Add type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'community_posts' 
        AND column_name = 'type' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.community_posts 
        ADD COLUMN type TEXT DEFAULT 'post' CHECK (type IN ('post', 'question', 'discussion', 'announcement'));
    END IF;

    -- Add hashtags column if it doesn't exist (as JSONB for better performance)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'community_posts' 
        AND column_name = 'hashtags' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.community_posts 
        ADD COLUMN hashtags JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Add is_pinned column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'community_posts' 
        AND column_name = 'is_pinned' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.community_posts 
        ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add is_featured column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'community_posts' 
        AND column_name = 'is_featured' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.community_posts 
        ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
    END IF;

    -- Ensure user_id references the correct users table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'users' 
        AND table_schema = 'public'
    ) THEN
        -- Drop existing foreign key if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'community_posts_user_id_fkey'
            AND table_name = 'community_posts'
        ) THEN
            ALTER TABLE public.community_posts DROP CONSTRAINT community_posts_user_id_fkey;
        END IF;

        -- Add correct foreign key constraint
        ALTER TABLE public.community_posts 
        ADD CONSTRAINT community_posts_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

END $$;

-- Update existing posts to have default type if null
UPDATE public.community_posts SET type = 'post' WHERE type IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON public.community_posts(type);
CREATE INDEX IF NOT EXISTS idx_community_posts_is_pinned ON public.community_posts(is_pinned);
CREATE INDEX IF NOT EXISTS idx_community_posts_is_featured ON public.community_posts(is_featured);
CREATE INDEX IF NOT EXISTS idx_community_posts_hashtags ON public.community_posts USING GIN(hashtags);

-- Ensure RLS is enabled
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Update RLS policies
DROP POLICY IF EXISTS "Community posts are viewable by everyone" ON public.community_posts;
CREATE POLICY "Community posts are viewable by everyone" ON public.community_posts
    FOR SELECT USING (is_published = true AND is_deleted = false);

DROP POLICY IF EXISTS "Users can insert their own posts" ON public.community_posts;
CREATE POLICY "Users can insert their own posts" ON public.community_posts
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id::text FROM public.users WHERE id = user_id));

DROP POLICY IF EXISTS "Users can update their own posts" ON public.community_posts;
CREATE POLICY "Users can update their own posts" ON public.community_posts
    FOR UPDATE USING (auth.uid()::text = (SELECT auth_user_id::text FROM public.users WHERE id = user_id));

-- Ensure community_categories table exists with proper data
INSERT INTO public.community_categories (name, slug, description, icon, color, display_order) VALUES
('General', 'general', 'General discussions and community updates', '💬', '#6B7280', 1),
('Bars', 'bars', 'Share your bars and lyrical content', '🎤', '#EF4444', 2),
('Music Discussion', 'music-discussion', 'Discuss music, artists, and industry topics', '🎵', '#3B82F6', 3),
('Events', 'events', 'Event announcements and discussions', '📅', '#10B981', 4),
('Street Talk', 'street-talk', 'Real street conversations and experiences', '🏙️', '#F59E0B', 5),
('Fan Art', 'fan-art', 'Share your creative works and fan art', '🎨', '#8B5CF6', 6)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    display_order = EXCLUDED.display_order;

-- Create a function to get user profile with posts
CREATE OR REPLACE FUNCTION get_user_with_posts(user_auth_id UUID)
RETURNS TABLE (
    id INTEGER,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    subscription_tier TEXT,
    coins_balance BIGINT,
    posts_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        u.full_name,
        u.avatar_url,
        u.subscription_tier,
        u.coins_balance,
        COALESCE(COUNT(cp.id), 0)::INTEGER as posts_count
    FROM public.users u
    LEFT JOIN public.community_posts cp ON u.id = cp.user_id AND cp.is_deleted = false
    WHERE u.auth_user_id = user_auth_id
    GROUP BY u.id, u.username, u.full_name, u.avatar_url, u.subscription_tier, u.coins_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.community_categories TO anon, authenticated;
GRANT SELECT ON public.community_posts TO anon, authenticated;
GRANT INSERT, UPDATE ON public.community_posts TO authenticated;
GRANT SELECT ON public.users TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_with_posts(UUID) TO authenticated;

COMMIT;
