-- =====================================================
-- SAFE COMMUNITY ENHANCEMENTS ONLY
-- This script only adds new features without modifying existing structure
-- =====================================================

-- Only add missing columns to users table (safe additions)
DO $$ 
BEGIN
    -- Add coins column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'coins') THEN
        ALTER TABLE public.users ADD COLUMN coins bigint DEFAULT 1000;
    END IF;
    
    -- Add followers/following counts if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'followers_count') THEN
        ALTER TABLE public.users ADD COLUMN followers_count integer DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'following_count') THEN
        ALTER TABLE public.users ADD COLUMN following_count integer DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'posts_count') THEN
        ALTER TABLE public.users ADD COLUMN posts_count integer DEFAULT 0;
    END IF;
END $$;

-- Create user follows table (new table, won't affect existing)
CREATE TABLE IF NOT EXISTS public.user_follows (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    follower_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    following_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Create notifications table (new table, won't affect existing)
CREATE TABLE IF NOT EXISTS public.notifications (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('vote', 'comment', 'follow', 'mention', 'system')),
    title text NOT NULL,
    message text NOT NULL,
    data jsonb DEFAULT '{}',
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- Create user bookmarks table (new table, won't affect existing)
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    target_type text NOT NULL CHECK (target_type IN ('post', 'comment')),
    target_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, target_type, target_id)
);

-- Add hashtags support to existing posts (safe addition)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_posts' AND column_name = 'hashtags') THEN
        ALTER TABLE public.community_posts ADD COLUMN hashtags text[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_posts' AND column_name = 'view_count') THEN
        ALTER TABLE public.community_posts ADD COLUMN view_count integer DEFAULT 0;
    END IF;
END $$;

-- Create hashtags table (new table, won't affect existing)
CREATE TABLE IF NOT EXISTS public.hashtags (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL UNIQUE,
    usage_count integer DEFAULT 0,
    is_trending boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- Add indexes for better performance (safe additions)
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_community_posts_hashtags ON public.community_posts USING GIN(hashtags);

-- Enable RLS on new tables only
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;

-- Safe RLS policies for new tables
CREATE POLICY "Users can view their own follows" ON public.user_follows FOR SELECT USING (
    auth.uid()::text = (SELECT auth_user_id::text FROM public.users WHERE id = follower_id)
    OR 
    auth.uid()::text = (SELECT auth_user_id::text FROM public.users WHERE id = following_id)
);

CREATE POLICY "Users can manage their own follows" ON public.user_follows FOR ALL USING (
    auth.uid()::text = (SELECT auth_user_id::text FROM public.users WHERE id = follower_id)
);

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (
    auth.uid()::text = (SELECT auth_user_id::text FROM public.users WHERE id = user_id)
);

CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (
    auth.uid()::text = (SELECT auth_user_id::text FROM public.users WHERE id = user_id)
);

CREATE POLICY "Users can manage their own bookmarks" ON public.user_bookmarks FOR ALL USING (
    auth.uid()::text = (SELECT auth_user_id::text FROM public.users WHERE id = user_id)
);

-- Grant permissions
GRANT ALL ON public.user_follows TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.user_bookmarks TO authenticated;
GRANT ALL ON public.hashtags TO authenticated;
